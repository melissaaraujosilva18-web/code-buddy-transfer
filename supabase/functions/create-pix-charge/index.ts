import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =================================================================
// DADOS FIXOS (VÁLIDOS)
// TROQUE ESTES DADOS POR QUALQUER CPF/TELEFONE VÁLIDO
// O Oasyfy não aceita dados falsos como "000.000.000-00"
// =================================================================
const PLACEHOLDER_NAME = "Cliente Depósito";
const PLACEHOLDER_EMAIL = "cliente@deposito.com";
const PLACEHOLDER_PHONE = "11999999999"; // (Use um telefone válido, SÓ NÚMEROS)
const PLACEHOLDER_DOCUMENT = "12345678900"; // (Use um CPF válido, SÓ NÚMEROS)
// =================================================================


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, userId } = await req.json(); // Você ainda precisa do userId e amount

    if (!amount || amount < 30) {
      return new Response(
        JSON.stringify({ error: 'Valor mínimo de R$ 30,00' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // (Opcional: Você pode remover a busca ao 'profiles' se não precisar do email/nome real)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('email, full_name') // Pega só o que precisa
      .eq('id', userId)
      .single();

    // Generate unique identifier
    const identifier = `DEP_${userId ? userId.substring(0, 8) : 'USER'}_${Date.now()}`;

    // Get webhook URL from environment
    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/oasyfy-webhook`;

    // Call Oasyfy API to create PIX charge
    const oasyfyResponse = await fetch('https://app.oasyfy.com/api/v1/gateway/pix/receive', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // [CORREÇÃO 1: Use os NOMES corretos das variáveis de ambiente]
        'x-public-key': Deno.env.get('OASYFY_PUBLIC_KEY') ?? '',
        'x-secret-key': Deno.env.get('OASYFY_SECRET_KEY') ?? '',
      },
      body: JSON.stringify({
        identifier,
        amount: Number(amount),
        client: {
          // [CORREÇÃO 2: Usando dados fixos VÁLIDOS]
          name: profile?.full_name || PLACEHOLDER_NAME,
          email: profile?.email || PLACEHOLDER_EMAIL,
          phone: PLACEHOLDER_PHONE, // (Deve ter 11 dígitos)
          document: PLACEHOLDER_DOCUMENT, // (Deve ter 11 dígitos)
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
      console.error('Oasyfy error:', errorData); // O erro real do Oasyfy aparecerá nos seus logs
      throw new Error('Erro ao criar cobrança PIX');
    }

    const oasyfyData = await oasyfyResponse.json();

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