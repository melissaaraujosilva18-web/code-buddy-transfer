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
    const body = await req.json();
    console.log('Game API Callback received:', body);

    const { userId, action, amount, newBalance, gameCode, transactionId } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get current user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('balance')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error('Usuário não encontrado');
    }

    const currentBalance = parseFloat(profile.balance.toString());
    let finalBalance = currentBalance;
    let transactionType = '';
    let description = '';

    // Process based on action
    switch (action) {
      case 'bet':
      case 'debit':
        finalBalance = newBalance !== undefined ? parseFloat(newBalance.toString()) : currentBalance - parseFloat(amount.toString());
        transactionType = 'bet';
        description = `Aposta em ${gameCode || 'jogo'}`;
        break;

      case 'win':
      case 'credit':
        finalBalance = newBalance !== undefined ? parseFloat(newBalance.toString()) : currentBalance + parseFloat(amount.toString());
        transactionType = 'win';
        description = `Ganho em ${gameCode || 'jogo'}`;
        break;

      case 'rollback':
        finalBalance = newBalance !== undefined ? parseFloat(newBalance.toString()) : currentBalance + parseFloat(amount.toString());
        transactionType = 'bet';
        description = `Estorno de aposta - ${gameCode || 'jogo'}`;
        break;

      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }

    // Update user balance
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ balance: finalBalance, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating balance:', updateError);
      throw new Error('Erro ao atualizar saldo');
    }

    // Record transaction
    const { error: transactionError } = await supabaseClient
      .from('transactions')
      .insert({
        user_id: userId,
        type: transactionType,
        amount: action === 'bet' || action === 'debit' ? -Math.abs(amount) : Math.abs(amount),
        balance_before: currentBalance,
        balance_after: finalBalance,
        description: description,
        metadata: {
          game_code: gameCode,
          transaction_id: transactionId,
          action: action,
          source: 'game_api'
        }
      });

    if (transactionError) {
      console.error('Error recording transaction:', transactionError);
    }

    console.log('Balance updated successfully:', {
      userId,
      action,
      oldBalance: currentBalance,
      newBalance: finalBalance,
      amount
    });

    return new Response(
      JSON.stringify({
        success: true,
        balance: finalBalance,
        transactionId: transactionId
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in game-api-callback:', error);
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
