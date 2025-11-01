import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { gameCode } = await req.json();

    console.log('Received gameCode:', gameCode);

    if (!gameCode) {
      throw new Error('gameCode is required');
    }

    const apiUrl = `https://slotbetpix.io/gold_api/pegarLinkJogo/PGSOFT/${gameCode}`;
    console.log('Fetching from:', apiUrl);

    const response = await fetch(apiUrl);

    if (!response.ok) {
      console.error('API response not ok:', response.status, response.statusText);
      throw new Error('Failed to fetch game URL from external API');
    }

    const data = await response.json();
    console.log('API response data:', data);

    // Verificar se a resposta é válida
    if (!data.gameURL || data.gameURL === 'Link do jogo não localizado') {
      console.error('Invalid game URL received:', data.gameURL);
      throw new Error(`Jogo com código ${gameCode} não encontrado ou indisponível`);
    }

    return new Response(
      JSON.stringify(data),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in get-game-url:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
