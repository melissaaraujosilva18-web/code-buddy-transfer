import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    console.log('Incoming request to gold_api:', {
      method: req.method,
      pathname: url.pathname,
      search: url.search
    });
    
    // Handle user_balance endpoint
    if (url.pathname.endsWith('/user_balance')) {
      const requestBody = await req.text();
      console.log('User balance request body:', requestBody);
      
      let parsedBody;
      try {
        parsedBody = JSON.parse(requestBody);
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      const userId = parsedBody.user_code || parsedBody.userId;
      
      if (!userId) {
        return new Response(JSON.stringify({ error: 'user_code is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('balance')
        .eq('id', userId)
        .single();
      
      if (profileError || !profile) {
        return new Response(JSON.stringify({ 
          status: 0,
          msg: 'User not found' 
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({
        status: 1,
        msg: 'SUCCESS',
        user_balance: Number(profile.balance)
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Check if the path is /game_callback
    if (!url.pathname.endsWith('/game_callback')) {
      console.error('Invalid endpoint accessed:', url.pathname);
      return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const requestBody = await req.text();
    console.log('Raw request body:', requestBody);
    
    let parsedBody;
    try {
      parsedBody = JSON.parse(requestBody);
    } catch (e) {
      console.error('Failed to parse JSON:', e);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Parsed callback data:', parsedBody);
    
    // Extract data from slot object or direct fields
    const userId = parsedBody.user_code || parsedBody.userId;
    const slot = parsedBody.slot || {};
    
    // Determine transaction type from slot data
    let transactionType = 'bet';
    let amount = 0;
    
    if (slot.txn_type === 'debit_credit') {
      // Combined bet + win transaction
      amount = slot.win - slot.bet;
      transactionType = amount >= 0 ? 'win' : 'bet';
    } else if (slot.txn_type === 'debit') {
      transactionType = 'bet';
      amount = slot.bet;
    } else if (slot.txn_type === 'credit') {
      transactionType = 'win';
      amount = slot.win;
    }
    
    console.log('Processing callback:', {
      userId,
      transactionType,
      amount,
      bet: slot.bet,
      win: slot.win,
      gameCode: slot.game_code,
      roundId: slot.round_id
    });

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get current user balance
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('balance')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentBalance = Number(profile.balance);
    
    // Calculate new balance based on transaction type
    let newBalance = currentBalance;
    if (slot.txn_type === 'debit_credit') {
      // For combined transactions, use the after_balance from VPS
      newBalance = Number(slot.user_after_balance || (currentBalance - slot.bet + slot.win));
    } else if (transactionType === 'bet') {
      newBalance = currentBalance - Math.abs(amount);
    } else if (transactionType === 'win') {
      newBalance = currentBalance + Math.abs(amount);
    }

    // Update user balance
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating balance:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update balance' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log transaction - create separate entries for bet and win if it's a combined transaction
    if (slot.txn_type === 'debit_credit' && slot.bet > 0) {
      // Log bet first
      await supabaseClient
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'bet',
          amount: -Number(slot.bet),
          balance_before: currentBalance,
          balance_after: currentBalance - slot.bet,
          description: `Aposta em ${slot.game_code || 'jogo'}`,
          metadata: {
            game_code: slot.game_code,
            round_id: slot.round_id,
            txn_id: slot.txn_id
          }
        });
      
      // Log win if there's a win amount
      if (slot.win > 0) {
        await supabaseClient
          .from('transactions')
          .insert({
            user_id: userId,
            type: 'win',
            amount: Number(slot.win),
            balance_before: currentBalance - slot.bet,
            balance_after: newBalance,
            description: `Ganho em ${slot.game_code || 'jogo'} (${(slot.win / slot.bet).toFixed(2)}x)`,
            metadata: {
              game_code: slot.game_code,
              round_id: slot.round_id,
              txn_id: slot.txn_id,
              multiplier: slot.win / slot.bet
            }
          });
      }
    } else {
      // Single transaction (bet or win only)
      const { error: transactionError } = await supabaseClient
        .from('transactions')
        .insert({
          user_id: userId,
          type: transactionType,
          amount: transactionType === 'bet' ? -Math.abs(amount) : Math.abs(amount),
          balance_before: currentBalance,
          balance_after: newBalance,
          description: `${transactionType === 'bet' ? 'Aposta' : 'Ganho'} em ${slot.game_code || 'jogo'}`,
          metadata: {
            game_code: slot.game_code,
            round_id: slot.round_id,
            txn_id: slot.txn_id
          }
        });
      
      if (transactionError) {
        console.error('Error logging transaction:', transactionError);
      }
    }

    return new Response(
      JSON.stringify({
        status: 1,
        msg: 'SUCCESS',
        user_id: userId,
        user_balance: newBalance,
        balance: newBalance,
        currency: 'BRL'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in gold_api callback:', error);
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
