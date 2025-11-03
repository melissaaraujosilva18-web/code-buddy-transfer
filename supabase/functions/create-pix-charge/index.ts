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
      .select("full_name, email, phone, cpf") // Pega campos específicos
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      console.error("Profile error:", profileError);
      return new Response(JSON.stringify({ error: "Usuário não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. [MELHORIA 1] Validar TODOS os campos obrigatórios
    if (!profile.cpf || !profile.phone || !profile.full_name || !profile.email) {
      return new Response(
        JSON.stringify({
          error:
            "Dados incompletos. Por favor, complete seu cadastro (Nome, Email, CPF e Telefone) antes de depositar.",
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
        "x-public-key": Deno.env.get("OASYFY_PUBLIC_KEY") ?? "",
        "x-secret-key": Deno.env.get("OASYFY_SECRET_KEY") ?? "",
      },
      body: JSON.stringify({
        identifier,
        amount: Number(amount),
        client: {
          name: profile.full_name,
          email: profile.email,
          phone: profile.phone.replace(/\D/g, ""), // Limpa para enviar só números
          document: profile.cpf.replace(/\D/g, ""), // Limpa para enviar só números
        },
        callbackUrl: webhookUrl,
        trackProps: {
          userId: userId,
          depositAmount: amount,
        },
      }),
    });

    // [MELHORIA 2] Tratar o erro da Oasyfy e retorná-lo
    if (!oasyfyResponse.ok) {
      // Tenta pegar o JSON de erro da Oasyfy
      let errorData;
      try {
        errorData = await oasyfyResponse.json();
      } catch (e) {
        // Se a Oasyfy retornar algo que não é JSON (raro, talvez um 502)
        errorData = { message: await oasyfyResponse.text() };
      }

      // Loga o erro real para depuração
      console.error("Oasyfy API error:", errorData);

      // Constrói uma mensagem de erro amigável
      const errorMessage = errorData.errors
        ? `Erro de validação: ${errorData.errors[0].message}` // Pega a primeira mensagem de erro
        : errorData.message || "Erro desconhecido na API de pagamento.";

      // Retorna o erro real da Oasyfy para o front-end
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 400, // 400 (Bad Request) faz mais sentido aqui
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
    // Esse catch agora só pegará erros inesperados (ex: falha ao conectar no Supabase)
    console.error("Critical Error in create-pix-charge:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro interno no servidor";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
