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

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get API settings
    const { data: apiSettings, error: settingsError } = await supabaseClient
      .from('game_api_settings')
      .select('*')
      .eq('is_active', true)
      .maybeSingle();

    if (settingsError || !apiSettings || !apiSettings.api_key) {
      throw new Error('Configure a URL da API no painel Admin primeiro');
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

    if (profile.blocked) {
      throw new Error('Usuário bloqueado');
    }

    console.log('Launching game via VPS API:', {
      gameCode,
      userId,
      username: profile.full_name || profile.email,
      balance: profile.balance,
      apiUrl: apiSettings.api_key
    });

    // Call VPS API to launch game
    const launchResponse = await fetch(`${apiSettings.api_key}/api/v1/game_launch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agentToken: apiSettings.operator_token,
        agentCode: apiSettings.provider_code || 'VORTEX',
        user_code: userId,
        userId: userId,
        username: profile.full_name || profile.email,
        saldo: parseFloat(profile.balance.toString()),
        gameCode: gameCode,
      }),
    });

    if (!launchResponse.ok) {
      const errorText = await launchResponse.text();
      console.error('VPS API error:', errorText);
      throw new Error('Erro ao iniciar jogo. Verifique as configurações da API.');
    }

    const gameData = await launchResponse.json();

    console.log('Game launched successfully');

    return new Response(
      JSON.stringify({
        success: true,
        gameUrl: gameData.url || gameData.gameUrl,
        token: gameData.token,
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
