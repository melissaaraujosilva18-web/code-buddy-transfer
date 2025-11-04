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

    // 1. Validação inicial do valor (mantida)
    if (!amount || amount < 30) {
      return new Response(JSON.stringify({ error: "Valor mínimo de R$ 30,00" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Conexão com Supabase (mantida)
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // 3. Busca de dados do perfil (mantida)
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("full_name, email, cpf")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      console.error("Profile error:", profileError);
      return new Response(JSON.stringify({ error: "Usuário não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Limpeza e Formatação do CPF (A CORREÇÃO PRINCIPAL)
    let cleanedCpf = null;
    if (profile.cpf) {
      // Converte para string e remove caracteres não-dígitos
      cleanedCpf = String(profile.cpf).replace(/\D/g, "");
    }

    // 5. Validação de dados (mantida)
    if (!cleanedCpf || cleanedCpf.length !== 11 || !profile.full_name || !profile.email) {
      return new Response(
        JSON.stringify({
          error:
            "Dados incompletos. Por favor, complete seu cadastro (Nome, Email e CPF) antes de depositar. Verifique se o CPF tem 11 dígitos.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // >>> CORREÇÃO: FORMATAR O CPF PARA O PADRÃO XXX.XXX.XXX-XX <<<
    // O exemplo da Oasyfy usa este formato: "document": "123.456.789-00"
    const formattedCpf = cleanedCpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
    // Ex: "06852767590" vira "068.527.675-90"

    // 6. Geração de Identificador e Webhook URL (mantida)
    const identifier = `DEP_${userId.substring(0, 8)}_${Date.now()}`;
    const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/oasyfy-webhook`;

    // 7. Payload da Oasyfy (USANDO O CPF FORMATADO)
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
          document: formattedCpf, // <<< AQUI USAMOS O CPF FORMATADO
        },
        callbackUrl: webhookUrl,
        trackProps: {
          userId: userId,
          depositAmount: amount,
        },
      }),
    });

    // 8. Tratamento de Erro e Log da Oasyfy (mantida)
    if (!oasyfyResponse.ok) {
      let errorData;
      try {
        errorData = await oasyfyResponse.json();
      } catch (e) {
        errorData = { message: await oasyfyResponse.text() };
      }

      console.error("Oasyfy API error:", errorData);

      // Mensagens de erro mais específicas para o usuário
      let userMessage = "Erro ao processar pagamento.";
      
      if (errorData.message && errorData.message.includes("Documento inválido")) {
        userMessage = "CPF inválido. Por favor, verifique seu CPF no perfil e tente novamente. O CPF precisa ser um número válido e real.";
      } else if (errorData.message) {
        userMessage = errorData.message;
      }

      return new Response(JSON.stringify({ error: userMessage }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 9. Retorno de Sucesso (mantida)
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
    // 10. Tratamento de Erro Crítico (mantida)
    console.error("Critical Error in create-pix-charge:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro interno no servidor";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
