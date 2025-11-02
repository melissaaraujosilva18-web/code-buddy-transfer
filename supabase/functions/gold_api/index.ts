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
    console.log('Incoming request to gold_api:', {
      method: req.method,
      pathname: url.pathname,
      search: url.search
    });
    
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
    
    const { userId, action, amount, gameId, transactionId, roundId, user_code, agent_secret } = parsedBody;

    const actualUserId = userId || user_code;
    
    console.log('Processing callback:', {
      actualUserId,
      action,
      amount,
      gameId,
      transactionId,
      roundId
    });

    if (!actualUserId) {
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
      .eq('id', actualUserId)
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
      .eq('id', actualUserId);

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
        user_id: actualUserId,
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
        status: 1,
        msg: 'SUCCESS',
        user_id: actualUserId,
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
