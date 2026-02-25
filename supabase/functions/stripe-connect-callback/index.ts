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

    const supabase = getServiceClient();
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const body = await req.json();

    // Handle disconnect action
    if (body?.action === 'disconnect') {
      const { error: disconnectError } = await supabase
        .from('operators')
        .update({
          stripe_account_id: null,
          stripe_onboarding_complete: false,
          stripe_disconnected_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (disconnectError) {
        return jsonResponse({ error: { code: 'SERVER_ERROR', message: 'Failed to disconnect Stripe account' } }, 500);
      }

      return jsonResponse({ disconnected: true });
    }

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
      return jsonResponse({ error: { code: 'NO_STRIPE_ACCOUNT', message: 'No Stripe account linked' } }, 400);
    }

    // Retrieve the account from Stripe
    const accountRes = await fetch(`https://api.stripe.com/v1/accounts/${operator.stripe_account_id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
      },
    });

    if (!accountRes.ok) {
      const err = await accountRes.json();
      return jsonResponse({ error: { code: 'STRIPE_ERROR', message: err?.error?.message || 'Failed to retrieve Stripe account' } }, 502);
    }

    const account = await accountRes.json();

    // Check if onboarding is complete
    if (!account.charges_enabled || !account.details_submitted) {
      return jsonResponse({ onboarding_complete: false, url: null });
    }

    // Onboarding complete — update operator
    const { error: updateError } = await supabase
      .from('operators')
      .update({ stripe_onboarding_complete: true })
      .eq('user_id', user.id);

    if (updateError) {
      return jsonResponse({ error: { code: 'SERVER_ERROR', message: 'Failed to update onboarding status' } }, 500);
    }

    // Fire webhook (fire-and-forget)
    fetch(`${supabaseUrl}/functions/v1/fire-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        event_type: 'stripe.connected',
        operator_id: user.id,
        payload: { stripe_account_id: account.id },
      }),
    }).catch(() => {});

    return jsonResponse({ onboarding_complete: true });
  } catch {
    return jsonResponse({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, 500);
  }
});
