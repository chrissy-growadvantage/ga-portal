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
    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:5173';

    // Check if operator already has a fully connected Stripe account
    const { data: operator, error: operatorError } = await supabase
      .from('operators')
      .select('stripe_account_id, stripe_onboarding_complete')
      .eq('user_id', user.id)
      .single();

    if (operatorError || !operator) {
      return jsonResponse({ error: { code: 'NOT_FOUND', message: 'Operator not found' } }, 404);
    }

    if (operator.stripe_account_id && operator.stripe_onboarding_complete) {
      return jsonResponse({ error: { code: 'ALREADY_CONNECTED', message: 'Stripe account already connected' } }, 400);
    }

    // Create a Stripe Connect Standard account
    const accountRes = await fetch('https://api.stripe.com/v1/accounts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        type: 'standard',
        'metadata[luma_operator_id]': user.id,
      }),
    });

    if (!accountRes.ok) {
      const err = await accountRes.json();
      return jsonResponse({ error: { code: 'STRIPE_ERROR', message: err?.error?.message || 'Failed to create Stripe account' } }, 502);
    }

    const account = await accountRes.json();

    // Save stripe_account_id on the operator record
    const { error: updateError } = await supabase
      .from('operators')
      .update({
        stripe_account_id: account.id,
        stripe_onboarding_complete: false,
        stripe_disconnected_at: null,
      })
      .eq('user_id', user.id);

    if (updateError) {
      return jsonResponse({ error: { code: 'SERVER_ERROR', message: 'Failed to save Stripe account' } }, 500);
    }

    // Create an Account Link for onboarding
    const linkRes = await fetch('https://api.stripe.com/v1/account_links', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        account: account.id,
        refresh_url: `${appUrl}/settings?tab=billing&stripe=refresh`,
        return_url: `${appUrl}/settings?tab=billing&stripe=success`,
        type: 'account_onboarding',
      }),
    });

    if (!linkRes.ok) {
      const err = await linkRes.json();
      return jsonResponse({ error: { code: 'STRIPE_ERROR', message: err?.error?.message || 'Failed to create account link' } }, 502);
    }

    const accountLink = await linkRes.json();

    return jsonResponse({ url: accountLink.url });
  } catch {
    return jsonResponse({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, 500);
  }
});
