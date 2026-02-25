import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsResponse, jsonResponse } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse();

  if (req.method !== 'POST') {
    return jsonResponse({ error: { code: 'METHOD_NOT_ALLOWED', message: 'POST only' } }, 405);
  }

  try {
    // Verify operator auth via JWT
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return jsonResponse({ error: { code: 'UNAUTHORIZED', message: 'Authorization header required' } }, 401);
    }

    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: { code: 'UNAUTHORIZED', message: 'Invalid auth token' } }, 401);
    }

    const { client_id } = (await req.json()) as { client_id: string };
    if (!client_id) {
      return jsonResponse({ error: { code: 'BAD_REQUEST', message: 'client_id is required' } }, 400);
    }

    const supabase = getServiceClient();
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:5173';

    // Get operator's stripe_account_id
    const { data: operator, error: operatorError } = await supabase
      .from('operators')
      .select('stripe_account_id')
      .eq('user_id', user.id)
      .single();

    if (operatorError || !operator) {
      return jsonResponse({ error: { code: 'NOT_FOUND', message: 'Operator not found' } }, 404);
    }

    if (!operator.stripe_account_id) {
      return jsonResponse({ error: { code: 'STRIPE_NOT_CONNECTED', message: 'Stripe account not connected' } }, 400);
    }

    // Look up payment record with an active subscription for this client
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('stripe_subscription_id')
      .eq('client_id', client_id)
      .not('stripe_subscription_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (paymentError || !payment?.stripe_subscription_id) {
      return jsonResponse({ error: { code: 'NO_SUBSCRIPTION', message: 'No active subscription found for this client' } }, 404);
    }

    // Get the Stripe customer from the subscription
    const subscriptionRes = await fetch(
      `https://api.stripe.com/v1/subscriptions/${payment.stripe_subscription_id}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          'Stripe-Account': operator.stripe_account_id,
        },
      }
    );

    if (!subscriptionRes.ok) {
      const err = await subscriptionRes.json();
      return jsonResponse(
        { error: { code: 'STRIPE_ERROR', message: err?.error?.message || 'Failed to retrieve subscription' } },
        502
      );
    }

    const subscription = await subscriptionRes.json();
    const customerId = subscription.customer;

    // Create a Billing Portal session
    const portalRes = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Stripe-Account': operator.stripe_account_id,
      },
      body: new URLSearchParams({
        customer: customerId,
        return_url: `${appUrl}/clients/${client_id}`,
      }),
    });

    if (!portalRes.ok) {
      const err = await portalRes.json();
      return jsonResponse(
        { error: { code: 'STRIPE_ERROR', message: err?.error?.message || 'Failed to create billing portal session' } },
        502
      );
    }

    const portalSession = await portalRes.json();

    return jsonResponse({ url: portalSession.url });
  } catch {
    return jsonResponse({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, 500);
  }
});
