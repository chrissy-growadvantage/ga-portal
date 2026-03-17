import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsResponse, jsonResponse } from '../_shared/cors.ts';
import { hashToken } from '../_shared/validate-token.ts';
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

    const token = authHeader.replace('Bearer ', '');

    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return jsonResponse({ error: { code: 'UNAUTHORIZED', message: 'Invalid auth token' } }, 401);
    }

    const body = await req.json() as {
      client_id: string;
      expires_in_days?: number;
      label?: string;
    };
    const { client_id, expires_in_days = 30, label } = body;

    if (!client_id) {
      return jsonResponse({ error: { code: 'BAD_REQUEST', message: 'client_id is required' } }, 400);
    }

    const supabase = getServiceClient();

    // Verify operator owns this client
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, operator_id, company_name')
      .eq('id', client_id)
      .single();

    if (clientError || !client) {
      return jsonResponse({ error: { code: 'NOT_FOUND', message: 'Client not found' } }, 404);
    }

    if (client.operator_id !== user.id) {
      return jsonResponse({ error: { code: 'FORBIDDEN', message: 'You do not own this client' } }, 403);
    }

    // Generate slug from company name + random suffix
    const slug = (client as { company_name?: string })?.company_name
      ? (client as { company_name: string }).company_name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 30)
      : 'client';
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(8)))
      .map((b) => chars[b % chars.length])
      .join('');
    const rawToken = `${slug}-${randomPart}`;
    const tokenHash = await hashToken(rawToken);
    const expiresAt = new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000).toISOString();

    // Insert into portal_links table (multi-token — does NOT invalidate existing links)
    const { error: insertError } = await supabase
      .from('portal_links')
      .insert({
        client_id,
        token_hash: tokenHash,
        label: label ?? null,
        expires_at: expiresAt,
        is_active: true,
      });

    if (insertError) {
      return jsonResponse({ error: { code: 'SERVER_ERROR', message: 'Failed to generate link' } }, 500);
    }

    // Legacy: also update clients table so old code still works during transition
    await supabase
      .from('clients')
      .update({
        magic_link_token_hash: tokenHash,
        magic_link_expires_at: expiresAt,
      })
      .eq('id', client_id);

    // Return raw token to operator (one-time display — we don't store the raw value)
    return jsonResponse({
      raw_token: rawToken,
      expires_at: expiresAt,
    });
  } catch {
    return jsonResponse({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, 500);
  }
});
