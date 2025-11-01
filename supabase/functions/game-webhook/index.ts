import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload = await req.json();
    console.log('Webhook received:', payload);

    // Payload esperado da API:
    // {
    //   user_id: string,
    //   game_code: string,
    //   game_name: string,
    //   type: 'bet' | 'win' | 'loss',
    //   amount: number,
    //   multiplier?: number
    // }

    const { user_id, game_code, game_name, type, amount, multiplier } = payload;

    if (!user_id || !type || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (type === 'bet') {
      // Deduzir saldo e registrar aposta
      const result = await supabase.rpc('process_game_bet', {
        p_user_id: user_id,
        p_game_code: game_code,
        p_game_name: game_name,
        p_bet_amount: amount,
        p_game_url: ''
      });

      if (result.error) {
        console.error('Error processing bet:', result.error);
        return new Response(
          JSON.stringify({ error: result.error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Bet processed:', result.data);
      return new Response(
        JSON.stringify({ success: true, data: result.data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (type === 'win') {
      // Buscar a última aposta do usuário neste jogo
      const { data: lastBet, error: betError } = await supabase
        .from('game_bets')
        .select('id')
        .eq('user_id', user_id)
        .eq('game_code', game_code)
        .eq('status', 'playing')
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (betError || !lastBet) {
        console.error('Bet not found:', betError);
        return new Response(
          JSON.stringify({ error: 'Bet not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Processar ganho
      const result = await supabase.rpc('process_game_win', {
        p_bet_id: lastBet.id,
        p_win_amount: amount,
        p_multiplier: multiplier || 0
      });

      if (result.error) {
        console.error('Error processing win:', result.error);
        return new Response(
          JSON.stringify({ error: result.error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Win processed:', result.data);
      return new Response(
        JSON.stringify({ success: true, data: result.data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (type === 'loss') {
      // Marcar aposta como perdida
      const { data: lastBet, error: betError } = await supabase
        .from('game_bets')
        .select('id')
        .eq('user_id', user_id)
        .eq('game_code', game_code)
        .eq('status', 'playing')
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (betError || !lastBet) {
        console.error('Bet not found:', betError);
        return new Response(
          JSON.stringify({ error: 'Bet not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: updateError } = await supabase
        .from('game_bets')
        .update({ status: 'lost', finished_at: new Date().toISOString() })
        .eq('id', lastBet.id);

      if (updateError) {
        console.error('Error updating bet:', updateError);
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Loss processed for bet:', lastBet.id);
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid type' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
