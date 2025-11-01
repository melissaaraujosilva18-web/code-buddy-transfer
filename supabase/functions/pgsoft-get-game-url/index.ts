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
    const { gameCode, userId } = await req.json();

    if (!gameCode || !userId) {
      return new Response(
        JSON.stringify({ error: 'gameCode e userId são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get API settings from database
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: apiSettings, error: settingsError } = await supabaseClient
      .from('game_api_settings')
      .select('*')
      .eq('is_active', true)
      .single();

    if (settingsError || !apiSettings) {
      throw new Error('Configurações da API de jogos não encontradas');
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error('Usuário não encontrado');
    }

    // Check if user is blocked
    if (profile.blocked) {
      throw new Error('Usuário bloqueado');
    }

    console.log('Requesting game URL from PGSoft:', {
      gameCode,
      userId,
      operatorToken: apiSettings.operator_token?.substring(0, 10) + '...'
    });

    // Call PGSoft API to get game URL
    const pgSoftResponse = await fetch('https://api.pgsoft-games.com/external/game/launch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Operator-Token': apiSettings.operator_token || '',
      },
      body: JSON.stringify({
        operator_player_session: {
          player_name: profile.full_name || profile.email,
          operator_id: userId,
          token: `${Date.now()}_${userId}`,
          game_id: gameCode,
          language: 'pt',
          return_url: `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '')}/`,
        }
      }),
    });

    if (!pgSoftResponse.ok) {
      const errorData = await pgSoftResponse.text();
      console.error('PGSoft API error:', errorData);
      throw new Error('Erro ao obter URL do jogo');
    }

    const gameData = await pgSoftResponse.json();

    console.log('Game URL obtained successfully:', {
      gameCode,
      userId
    });

    return new Response(
      JSON.stringify({
        success: true,
        gameUrl: gameData.game_url,
        sessionToken: gameData.session_token,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in pgsoft-get-game-url:', error);
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
