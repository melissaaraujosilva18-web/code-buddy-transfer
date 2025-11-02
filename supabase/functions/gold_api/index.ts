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
    // Check if the path is /game_callback
    const url = new URL(req.url);
    if (!url.pathname.endsWith('/game_callback')) {
      return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { userId, action, amount, gameId, transactionId, roundId } = await req.json();

    console.log('Game API callback received:', {
      userId,
      action,
      amount,
      gameId,
      transactionId,
      roundId
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
    let newBalance = currentBalance;

    // Process different actions
    if (action === 'bet' || action === 'debit') {
      newBalance = currentBalance - Number(amount);
    } else if (action === 'win' || action === 'credit') {
      newBalance = currentBalance + Number(amount);
    } else if (action === 'rollback') {
      newBalance = currentBalance + Number(amount);
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

    // Log transaction
    const { error: transactionError } = await supabaseClient
      .from('transactions')
      .insert({
        user_id: userId,
        type: action,
        amount: action === 'bet' || action === 'debit' ? -Number(amount) : Number(amount),
        balance_before: currentBalance,
        balance_after: newBalance,
        description: `Game ${action}: ${gameId}`,
        metadata: {
          gameId,
          transactionId,
          roundId
        }
      });

    if (transactionError) {
      console.error('Error logging transaction:', transactionError);
    }

    return new Response(
      JSON.stringify({
        success: true,
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
