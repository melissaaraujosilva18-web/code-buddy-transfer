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
    const { amount, userId } = await req.json();

    if (!amount || amount < 30) {
      return new Response(
        JSON.stringify({ error: 'Valor mínimo de R$ 30,00' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user data
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error('Usuário não encontrado');
    }

    // Generate unique identifier
    const identifier = `DEP_${userId.substring(0, 8)}_${Date.now()}`;

    // Get webhook URL from environment
    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/oasyfy-webhook`;

    // Call Oasyfy API to create PIX charge
    const oasyfyResponse = await fetch('https://app.oasyfy.com/api/v1/gateway/pix/receive', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-public-key': Deno.env.get('marcosviniciuslkk_m61w150ycoyd7ioq') ?? '',
        'x-secret-key': Deno.env.get('vspmkfohm1j2hey9pyz9gxguq3vdpqdz0s2r9mfv1751tjlcu62hac0qkf7vp7bp') ?? '',
      },
      body: JSON.stringify({
        identifier,
        amount: Number(amount),
        client: {
          name: profile.full_name || 'Cliente',
          email: profile.email,
          phone: '(79) 99999-9999',
          document: '051.178.900-94',
        },
        callbackUrl: webhookUrl,
        trackProps: {
          userId: userId,
          depositAmount: amount,
        }
      }),
    });

    if (!oasyfyResponse.ok) {
      const errorData = await oasyfyResponse.text();
      console.error('Oasyfy error:', errorData);
      throw new Error('Erro ao criar cobrança PIX');
    }

    const oasyfyData = await oasyfyResponse.json();

    console.log('PIX charge created:', {
      transactionId: oasyfyData.transactionId,
      identifier,
      amount
    });

    return new Response(
      JSON.stringify({
        success: true,
        transactionId: oasyfyData.transactionId,
        identifier,
        qrCode: oasyfyData.pix.code,
        qrCodeBase64: oasyfyData.pix.base64,
        qrCodeImage: oasyfyData.pix.image,
        amount,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in create-pix-charge:', error);
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
