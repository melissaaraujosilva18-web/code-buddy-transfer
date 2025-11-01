import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response('Missing url parameter', { status: 400 });
    }

    console.log('Proxying game from:', targetUrl);

    // Fetch the game from VPS
    const gameResponse = await fetch(targetUrl);
    
    if (!gameResponse.ok) {
      throw new Error(`VPS returned ${gameResponse.status}`);
    }

    const contentType = gameResponse.headers.get('content-type') || 'text/html';
    const body = await gameResponse.text();

    // Remove security headers that block iframes
    return new Response(body, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        // Allow iframe embedding from anywhere
        'X-Frame-Options': 'ALLOWALL',
        'Content-Security-Policy': 'frame-ancestors *',
      }
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});