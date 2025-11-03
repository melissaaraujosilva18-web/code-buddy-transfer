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
    const { userId } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "userId é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      throw new Error("Usuário não encontrado");
    }

    if (profile.withdrawal_status !== "awaiting_fee") {
      return new Response(JSON.stringify({ error: "Não há saque pendente aguardando taxa" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!profile.withdrawal_amount) {
      return new Response(JSON.stringify({ error: "Valor de saque não encontrado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminFee = Number((profile.withdrawal_amount * 0.1).toFixed(2));
    const identifier = `TAXA_${userId.substring(0, 8)}_${Date.now()}`;
    const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/admin-fee-webhook`;

    const oasyfyResponse = await fetch("https://app.oasyfy.com/api/v1/gateway/pix/receive", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-public-key": Deno.env.get("OASYFY_PUBLIC_KEY") ?? "",
        "x-secret-key": Deno.env.get("OASYFY_SECRET_KEY") ?? "",
      },
      body: JSON.stringify({
        identifier,
        amount: adminFee,
        client: {
          name: profile.full_name || "Cliente",
          email: profile.email,
          phone: profile.phone || "(11) 99999-9999",
          document: profile.cpf ? profile.cpf.replace(/[^\d]/g, "") : "00000000000",
        },
        callbackUrl: webhookUrl,
        trackProps: {
          userId,
          type: "admin_fee",
          withdrawalAmount: profile.withdrawal_amount,
          adminFee,
        },
      }),
    });

    if (!oasyfyResponse.ok) {
      const errorText = await oasyfyResponse.text();
      console.error("Erro Oasyfy (Taxa administrativa):", errorText);
      throw new Error(`Erro ao criar cobrança da taxa: ${errorText}`);
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
        amount: adminFee,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Erro em create-admin-fee:", error);
    return new Response(JSON.stringify({ error: error.message || "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
