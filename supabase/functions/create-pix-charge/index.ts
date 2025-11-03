import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, userId } = await req.json();

    if (!amount || amount < 30) {
      return new Response(JSON.stringify({ error: "Valor mínimo de R$ 30,00" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Get user data
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("*") // Pega tudo do perfil (cpf, phone, full_name)
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      throw new Error("Usuário não encontrado");
    }

    // 2. [CORREÇÃO CRÍTICA]
    // Verificar se o usuário TEM CPF e Telefone cadastrados no banco
    if (!profile.cpf || !profile.phone || !profile.full_name) {
      return new Response(
        JSON.stringify({
          error: "Dados incompletos. Por favor, complete seu cadastro (Nome, CPF e Telefone) antes de depositar.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 3. Generate unique identifier
    const identifier = `DEP_${userId.substring(0, 8)}_${Date.now()}`;

    // 4. Get webhook URL from environment
    const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/oasyfy-webhook`;

    // 5. Call Oasyfy API to create PIX charge
    const oasyfyResponse = await fetch("https://app.oasyfy.com/api/v1/gateway/pix/receive", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // [CORREÇÃO 1: Usando os NOMES corretos das Secrets do Supabase]
        "x-public-key": Deno.env.get("OASYFY_PUBLIC_KEY") ?? "",
        "x-secret-key": Deno.env.get("OASYFY_SECRET_KEY") ?? "",
      },
      body: JSON.stringify({
        identifier,
        amount: Number(amount),
        client: {
          // [CORREÇÃO 2: Usando dados DINÂMICOS do perfil]
          name: profile.full_name,
          email: profile.email,
          // [CORREÇÃO 3: Enviando SÓ NÚMEROS (Formatação)]
          phone: profile.phone.replace(/\D/g, ""),
          document: profile.cpf.replace(/\D/g, ""),
        },
        callbackUrl: webhookUrl,
        trackProps: {
          userId: userId,
          depositAmount: amount,
        },
      }),
    });

    if (!oasyfyResponse.ok) {
      const errorData = await oasyfyResponse.text();
      // O ERRO REAL ESTARÁ AQUI NOS LOGS DO SUPABASE:
      console.error("Oasyfy error:", errorData);
      // Se 'errorData' ainda for "Documento inválido", o Oasyfy está rejeitando a combinação Nome/CPF.
      throw new Error("Erro ao criar cobrança PIX");
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in create-pix-charge:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
