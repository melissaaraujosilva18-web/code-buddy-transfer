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
    const { startCode = 1, endCode = 200 } = await req.json();

    console.log(`Testing game codes from ${startCode} to ${endCode}`);

    const validCodes: { code: number; name: string; url: string }[] = [];
    const batchSize = 10; // Testar 10 por vez para não sobrecarregar

    for (let i = startCode; i <= endCode; i += batchSize) {
      const batch = [];

      for (let j = i; j < Math.min(i + batchSize, endCode + 1); j++) {
        batch.push(
          fetch(`https://slotbetpix.io/gold_api/pegarLinkJogo/PGSOFT/${j}`)
            .then(res => res.json())
            .then(data => ({
              code: j,
              data
            }))
            .catch(() => ({
              code: j,
              data: null
            }))
        );
      }

      const results = await Promise.all(batch);

      for (const result of results) {
        if (result.data &&
            result.data.gameURL &&
            result.data.gameURL !== 'Link do jogo não localizado') {
          validCodes.push({
            code: result.code,
            name: result.data.gameName || `Game ${result.code}`,
            url: result.data.gameURL
          });
          console.log(`✅ Valid code found: ${result.code} - ${result.data.gameName}`);
        }
      }

      // Pequeno delay entre batches
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`Testing complete. Found ${validCodes.length} valid codes.`);

    return new Response(
      JSON.stringify({
        success: true,
        totalTested: endCode - startCode + 1,
        validCodes
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in test-game-codes:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
