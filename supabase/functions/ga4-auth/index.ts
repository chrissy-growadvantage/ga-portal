import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsResponse, jsonResponse } from '../_shared/cors.ts';

// ga4-auth — generates a Google OAuth URL for the operator to initiate GA4 connection.
// Returns { authUrl } as JSON; the SPA handles the redirect navigation.
// Must be called with a valid operator JWT (Authorization header).

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse();

  if (req.method !== 'GET') {
    return jsonResponse({ error: { code: 'METHOD_NOT_ALLOWED', message: 'GET only' } }, 405);
  }

  try {
    // ── 1. Verify operator JWT ────────────────────────────────────────────────
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

    // ── 2. Parse query params ─────────────────────────────────────────────────
    const url = new URL(req.url);
    const clientId = url.searchParams.get('clientId');
    const appUrl = Deno.env.get('APP_URL') ?? '';
    const returnUrl =
      url.searchParams.get('returnUrl') ??
      `${appUrl}/clients/${clientId ?? ''}?tab=analytics`;

    if (!clientId) {
      return jsonResponse({ error: { code: 'BAD_REQUEST', message: 'clientId is required' } }, 400);
    }

    // ── 3. Security check: client must belong to this operator (RLS enforced) ─
    const { data: client, error: clientError } = await anonClient
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .maybeSingle();

    if (clientError || !client) {
      return jsonResponse({ error: { code: 'NOT_FOUND', message: 'Client not found' } }, 404);
    }

    // ── 4. Build Google OAuth URL ─────────────────────────────────────────────
    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
    if (!googleClientId) {
      return jsonResponse({ error: { code: 'SERVER_ERROR', message: 'Google OAuth not configured' } }, 500);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const redirectUri = `${supabaseUrl}/functions/v1/ga4-auth-callback`;

    // Encode state so the callback can store the correct IDs and redirect back
    const state = btoa(
      JSON.stringify({ clientId, operatorId: user.id, returnUrl })
    );

    const params = new URLSearchParams({
      client_id: googleClientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/analytics.readonly',
      access_type: 'offline',
      prompt: 'consent', // Always re-consent to ensure we receive a refresh_token
      state,
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    return jsonResponse({ authUrl });
  } catch {
    return jsonResponse({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, 500);
  }
});
