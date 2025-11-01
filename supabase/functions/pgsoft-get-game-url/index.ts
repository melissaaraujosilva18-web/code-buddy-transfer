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

    if (settingsError || !apiSettings || !apiSettings.api_key || !apiSettings.secret_key) {
      throw new Error('Configure a URL da API e a Secret Key no painel Admin primeiro');
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

    // Prepare form-encoded payload
    const params = new URLSearchParams();
    // Prefer expected param names; keep legacy keys for compatibility
    params.append('operator_token', apiSettings.operator_token);
    params.append('secret_key', apiSettings.secret_key);
    params.append('provider_code', apiSettings.provider_code || 'VORTEX001');
    // Legacy aliases (if VPS expects these)
    params.append('agentToken', apiSettings.operator_token);
    params.append('secretKey', apiSettings.secret_key);
    params.append('agentCode', apiSettings.provider_code || 'VORTEX001');

    // User identifiers (send both common variants)
    params.append('user_id', userId);
    params.append('user_code', userId);
    params.append('userId', userId);

    params.append('username', profile.full_name || profile.email);
    // Balance (send both common variants as integer)
    const intBalance = String(Math.floor(Number(profile.balance)));
    params.append('balance', intBalance);
    params.append('user_balance', intBalance);

    params.append('game_code', gameCode);
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

    // Check for errors (status:"error" or status !== 1)
    if (gameData?.status === 'error' || (typeof gameData?.status === 'number' && gameData?.status !== 1)) {
      const message = gameData?.message || gameData?.msg || gameData?.error || 'Erro desconhecido na API do VPS';
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

    let resolvedGameUrl =
      gameData?.launch_url ||
      gameData?.url ||
      gameData?.gameUrl ||
      gameData?.link ||
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

    // 🎯 FIX: Replace hardcoded pgsoft.com domain with actual VPS URL
    // The VPS API returns https://m.pgsoft.com/126/index.html but games are hosted locally
    // at the VPS in the /public folder, so we need to rewrite the URL to point to the VPS
    if (resolvedGameUrl.includes('m.pgsoft.com')) {
      const vpsBaseUrl = apiSettings.api_key.replace(/\/$/, ''); // Remove trailing slash
      try {
        const u = new URL(resolvedGameUrl);
        const vps = new URL(vpsBaseUrl);
        u.protocol = vps.protocol; // enforce https if your VPS uses https
        u.host = vps.host;         // point to VPS domain/IP
        // Optional: align query helpers to your VPS host
        u.searchParams.set('api', vps.host);
        u.searchParams.set('or', vps.host);
        resolvedGameUrl = u.toString();
      } catch (_) {
        // Fallback to simple replace if URL parsing fails
        resolvedGameUrl = resolvedGameUrl.replace('https://m.pgsoft.com', vpsBaseUrl);
      }
      console.log('🔧 Fixed game URL to point to VPS:', resolvedGameUrl);
    }

    console.log('Game launched successfully, final URL:', resolvedGameUrl);

    // Wrap the game URL through our proxy to bypass mixed content and CSP restrictions
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const proxiedGameUrl = `${supabaseUrl}/functions/v1/game-proxy?url=${encodeURIComponent(resolvedGameUrl)}`;
    
    console.log('Proxied URL:', proxiedGameUrl);

    return new Response(
      JSON.stringify({
        success: true,
        gameUrl: proxiedGameUrl,
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
