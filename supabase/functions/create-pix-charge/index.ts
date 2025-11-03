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

    if (!userId) {
      return new Response(JSON.stringify({ error: "userId é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Instancia o Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Busca o perfil do usuário
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      throw new Error("Usuário não encontrado");
    }

    const identifier = `DEP_${userId.substring(0, 8)}_${Date.now()}`;
    const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/oasyfy-webhook`;

    // Faz a requisição para criar cobrança PIX
    const oasyfyResponse = await fetch("https://app.oasyfy.com/api/v1/gateway/pix/receive", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-public-key": Deno.env.get("OASYFY_PUBLIC_KEY") ?? "",
        "x-secret-key": Deno.env.get("OASYFY_SECRET_KEY") ?? "",
      },
      body: JSON.stringify({
        identifier,
        amount: Number(amount.toFixed(2)),
        client: {
          name: profile.full_name || "Cliente",
          email: profile.email,
          phone: profile.phone || "(11) 99999-9999",
          document: profile.cpf ? profile.cpf.replace(/[^\d]/g, "") : "00000000000",
        },
        callbackUrl: webhookUrl,
        trackProps: {
          userId,
          type: "deposit",
          depositAmount: amount,
        },
      }),
    });

    if (!oasyfyResponse.ok) {
      const errorText = await oasyfyResponse.text();
      console.error("Erro Oasyfy (Depósito):", errorText);
      throw new Error(`Erro ao criar cobrança PIX: ${errorText}`);
    }

    const oasyfyData = await oasyfyResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        transactionId: oasyfyData.transactionId,
        identifier,
        qrCode: oasyfyData.pix?.code,
        qrCodeBase64: oasyfyData.pix?.base64,
        qrCodeImage: oasyfyData.pix?.image,
        amount,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Erro em create-pix-charge:", error);
    return new Response(JSON.stringify({ error: error.message || "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
