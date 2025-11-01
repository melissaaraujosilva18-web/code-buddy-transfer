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

    // Prepare form-encoded payload (some VPS setups expect x-www-form-urlencoded)
    const params = new URLSearchParams();
    params.append('agentToken', apiSettings.operator_token);
    params.append('agentCode', apiSettings.provider_code || 'VORTEX001');
    params.append('user_code', userId);
    params.append('userId', userId);
    params.append('username', profile.full_name || profile.email);
    const intBalance = String(Math.floor(Number(profile.balance)));
    // Send several synonyms for balance to maximize compatibility
    params.append('saldo', intBalance);
    params.append('balance', intBalance);
    params.append('user_balance', intBalance);
    params.append('userBalance', intBalance);
    params.append('User Balance', intBalance);
    params.append('gameCode', gameCode);

    // Call VPS API to launch game
    const launchResponse = await fetch(`${apiSettings.api_key}/api/v1/game_launch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!launchResponse.ok) {
      const errorText = await launchResponse.text();
      console.error('VPS API error:', errorText);
      throw new Error('Erro ao iniciar jogo. Verifique as configurações da API.');
    }

    const gameData = await launchResponse.json();

    // Log full response for debugging in edge logs (safe, server-side only)
    console.log('VPS launch response payload:', JSON.stringify(gameData));

    // If VPS reports an error, bubble it up clearly to the client
    if (gameData?.status === 'error' || gameData?.success === false) {
      const message = gameData?.message || gameData?.error || 'Erro desconhecido na API do VPS';
      return new Response(
        JSON.stringify({ error: `VPS: ${message}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try to resolve the game URL from multiple possible keys / nesting
    const nested = (obj: any, ...keys: string[]): string | undefined => {
      try {
        return keys.reduce((acc: any, key: string) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
      } catch (_) {
        return undefined;
      }
    };

    const resolvedGameUrl =
      gameData?.url ||
      gameData?.gameUrl ||
      gameData?.link ||
      gameData?.launch_url ||
      gameData?.game_link ||
      nested(gameData, 'data', 'url') ||
      nested(gameData, 'data', 'link') ||
      nested(gameData, 'data', 'gameUrl') ||
      nested(gameData, 'result', 'url') ||
      nested(gameData, 'response', 'url');

    if (!resolvedGameUrl) {
      console.error('No game URL found in VPS response');
      return new Response(
        JSON.stringify({
          error: 'A API retornou sucesso mas sem URL do jogo. Verifique a configuração do VPS.',
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Game launched successfully');

    return new Response(
      JSON.stringify({
        success: true,
        gameUrl: resolvedGameUrl,
        token: gameData?.token,
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
