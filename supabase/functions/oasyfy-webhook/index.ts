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

    console.log('Webhook received:', JSON.stringify(webhookData, null, 2));

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

    if (!userId) {
      console.error('No userId found in webhook metadata');
      return new Response(JSON.stringify({ error: 'Missing userId' }), {
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

    // Add amount to balance and mark as deposited
    const depositAmount = transaction.amount || 0;
    const newBalance = profile.balance + depositAmount;

    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        balance: newBalance,
        has_deposited: true,
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating balance:', updateError);
      throw updateError;
    }

    console.log('Balance updated successfully:', {
      userId,
      oldBalance: profile.balance,
      depositAmount,
      newBalance,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Saldo creditado com sucesso',
        newBalance
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in oasyfy-webhook:', error);
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
