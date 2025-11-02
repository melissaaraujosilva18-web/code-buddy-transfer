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
    const gameResponse = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log('VPS response status:', gameResponse.status);
    console.log('VPS response headers:', Object.fromEntries(gameResponse.headers.entries()));
    
    if (!gameResponse.ok) {
      const errorText = await gameResponse.text();
      console.error('VPS error response:', errorText);
      throw new Error(`VPS returned ${gameResponse.status}: ${errorText}`);
    }

    const contentType = gameResponse.headers.get('content-type') || 'text/html';
    const body = await gameResponse.text();
    
    console.log('Successfully fetched game, content length:', body.length);

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