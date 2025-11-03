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
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId é obrigatório' }),
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

    // ... (o resto da sua lógica de taxa) ...
    if (profile.withdrawal_status !== 'awaiting_fee') {
      return new Response(
        JSON.stringify({ error: 'Não há saque pendente aguardando taxa' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!profile.withdrawal_amount) {
      return new Response(
        JSON.stringify({ error: 'Valor de saque não encontrado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!profile.cpf || !profile.phone) { // Adicionei verificação de telefone
      return new Response(
        JSON.stringify({ error: 'CPF ou Telefone não cadastrado. Por favor, atualize seu perfil.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    // ...

    // Calcular taxa administrativa (10%)
    const adminFee = profile.withdrawal_amount * 0.1;

    // Generate unique identifier
    const identifier = `TAXA_${userId.substring(0, 8)}_${Date.now()}`;

    // Get webhook URL from environment
    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/admin-fee-webhook`;

    console.log('Creating admin fee charge:', {
      userId,
      withdrawalAmount: profile.withdrawal_amount,
      adminFee,
      identifier,
    });

    // Call Oasyfy API to create PIX charge for admin fee
    const oasyfyResponse = await fetch('https://app.oasyfy.com/api/v1/gateway/pix/receive', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-public-key': Deno.env.get('OASYFY_PUBLIC_KEY') ?? '',
        'x-secret-key': Deno.env.get('OASYFY_SECRET_KEY') ?? '',
      },
      body: JSON.stringify({
        identifier,
        amount: Number(adminFee.toFixed(2)),
        client: {
          name: profile.full_name || 'Cliente',
          email: profile.email,
          // [CORREÇÃO 1: Pega o telefone do perfil e remove formatação]
          phone: profile.phone.replace(/\D/g, ''),
          // [CORREÇÃO 2: Pega o CPF do perfil e remove formatação]
          document: profile.cpf.replace(/\D/g, ''),
        },
        callbackUrl: webhookUrl,
        trackProps: {
          userId: userId,
          type: 'admin_fee',
          withdrawalAmount: profile.withdrawal_amount,
          adminFee: adminFee,
        }
      }),
    });

    if (!oasyfyResponse.ok) {
      const errorData = await oasyfyResponse.text();
      console.error('Oasyfy error:', errorData);
      throw new Error('Erro ao criar cobrança da taxa administrativa');
    }

    const oasyfyData = await oasyfyResponse.json();

    console.log('Admin fee charge created:', {
      transactionId: oasyfyData.transactionId,
      identifier,
      adminFee
    });

    return new Response(
      JSON.stringify({
        success: true,
        transactionId: oasyfyData.transactionId,
        identifier,
        qrCode: oasyfyData.pix.code,
        qrCodeBase64: oasyfyData.pix.base64,
        qrCodeImage: oasyfyData.pix.image,
        amount: adminFee,
        withdrawalAmount: profile.withdrawal_amount,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in create-admin-fee-charge:', error);
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