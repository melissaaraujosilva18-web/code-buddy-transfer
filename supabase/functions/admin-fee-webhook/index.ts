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
    const webhookData = await req.json();

    console.log('Admin fee webhook received:', JSON.stringify(webhookData, null, 2));

    // Validate webhook token for security
    const webhookToken = req.headers.get('x-webhook-token') || webhookData.token;
    const expectedToken = Deno.env.get('OASYFY_WEBHOOK_TOKEN');

    if (!webhookToken || webhookToken !== expectedToken) {
      console.error('Invalid webhook token');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { event, transaction } = webhookData;

    // Only process paid transactions
    if (event !== 'TRANSACTION_PAID' || transaction.status !== 'COMPLETED') {
      console.log('Ignoring event:', event, 'status:', transaction.status);
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get userId from trackProps (metadata personalizados da Oasyfy)
    const trackProps = webhookData.trackProps || {};
    const userId = trackProps.userId;
    const type = trackProps.type;

    if (!userId || type !== 'admin_fee') {
      console.error('Invalid metadata - userId or type missing');
      return new Response(JSON.stringify({ error: 'Invalid metadata' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get current profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Profile not found:', userId);
      throw new Error('Usuário não encontrado');
    }

    // Verificar se está aguardando pagamento da taxa
    if (profile.withdrawal_status !== 'awaiting_fee') {
      console.log('No withdrawal awaiting fee for user:', userId);
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Processing admin fee payment:', {
      userId,
      withdrawalAmount: profile.withdrawal_amount,
      feePaid: transaction.amount,
    });

    // Atualizar status do saque para "processing" (aguardando processamento manual)
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        withdrawal_status: 'processing',
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating withdrawal status:', updateError);
      throw updateError;
    }

    console.log('Admin fee paid successfully, withdrawal now processing:', {
      userId,
      withdrawalAmount: profile.withdrawal_amount,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Taxa administrativa paga, saque em processamento',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in admin-fee-webhook:', error);
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
