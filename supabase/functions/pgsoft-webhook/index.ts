import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-operator-token',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookData = await req.json();

    console.log('PGSoft webhook received:', JSON.stringify(webhookData, null, 2));

    // Validate operator token
    const operatorToken = req.headers.get('x-operator-token');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: apiSettings } = await supabaseClient
      .from('game_api_settings')
      .select('operator_token')
      .eq('is_active', true)
      .single();

    if (!operatorToken || operatorToken !== apiSettings?.operator_token) {
      console.error('Invalid operator token');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, data } = webhookData;

    // Handle different webhook actions
    switch (action) {
      case 'get_balance':
        return await handleGetBalance(supabaseClient, data);
      
      case 'debit':
        return await handleDebit(supabaseClient, data);
      
      case 'credit':
        return await handleCredit(supabaseClient, data);
      
      case 'rollback':
        return await handleRollback(supabaseClient, data);
      
      default:
        console.log('Unknown action:', action);
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Error in pgsoft-webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function handleGetBalance(supabase: any, data: any) {
  const { operator_id } = data;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', operator_id)
    .single();

  if (error || !profile) {
    throw new Error('Usuário não encontrado');
  }

  return new Response(
    JSON.stringify({
      balance: Number(profile.balance).toFixed(2),
      currency: 'BRL'
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    }
  );
}

async function handleDebit(supabase: any, data: any) {
  const { operator_id, amount, transaction_id, game_id } = data;

  // Get current balance
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', operator_id)
    .single();

  if (profileError || !profile) {
    throw new Error('Usuário não encontrado');
  }

  const currentBalance = Number(profile.balance);
  const debitAmount = Number(amount);

  if (currentBalance < debitAmount) {
    return new Response(
      JSON.stringify({ error: 'Saldo insuficiente' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  const newBalance = currentBalance - debitAmount;

  // Update balance
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ balance: newBalance })
    .eq('id', operator_id);

  if (updateError) {
    throw updateError;
  }

  // Create transaction record
  await supabase
    .from('transactions')
    .insert({
      user_id: operator_id,
      type: 'bet',
      amount: -debitAmount,
      balance_before: currentBalance,
      balance_after: newBalance,
      description: `Aposta em ${game_id}`,
      metadata: { transaction_id, game_id }
    });

  console.log('Debit processed:', { operator_id, amount: debitAmount, newBalance });

  return new Response(
    JSON.stringify({
      balance: newBalance.toFixed(2),
      transaction_id,
      currency: 'BRL'
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    }
  );
}

async function handleCredit(supabase: any, data: any) {
  const { operator_id, amount, transaction_id, game_id } = data;

  // Get current balance
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', operator_id)
    .single();

  if (profileError || !profile) {
    throw new Error('Usuário não encontrado');
  }

  const currentBalance = Number(profile.balance);
  const creditAmount = Number(amount);
  const newBalance = currentBalance + creditAmount;

  // Update balance
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ balance: newBalance })
    .eq('id', operator_id);

  if (updateError) {
    throw updateError;
  }

  // Create transaction record
  await supabase
    .from('transactions')
    .insert({
      user_id: operator_id,
      type: 'win',
      amount: creditAmount,
      balance_before: currentBalance,
      balance_after: newBalance,
      description: `Ganho em ${game_id}`,
      metadata: { transaction_id, game_id }
    });

  console.log('Credit processed:', { operator_id, amount: creditAmount, newBalance });

  return new Response(
    JSON.stringify({
      balance: newBalance.toFixed(2),
      transaction_id,
      currency: 'BRL'
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    }
  );
}

async function handleRollback(supabase: any, data: any) {
  const { transaction_id } = data;

  // Find the original transaction
  const { data: transaction, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('metadata->>transaction_id', transaction_id)
    .single();

  if (error || !transaction) {
    // Transaction not found, return success (idempotent)
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  // Reverse the transaction
  const { data: profile } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', transaction.user_id)
    .single();

  const currentBalance = Number(profile.balance);
  const reversalAmount = -Number(transaction.amount);
  const newBalance = currentBalance + reversalAmount;

  await supabase
    .from('profiles')
    .update({ balance: newBalance })
    .eq('id', transaction.user_id);

  console.log('Rollback processed:', { transaction_id, reversalAmount, newBalance });

  return new Response(
    JSON.stringify({
      balance: newBalance.toFixed(2),
      currency: 'BRL'
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    }
  );
}
