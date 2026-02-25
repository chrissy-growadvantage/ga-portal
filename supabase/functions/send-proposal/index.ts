import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsResponse, jsonResponse } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase.ts';

async function hashToken(raw: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(raw));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

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

    // Create client with anon key but use the user's JWT for auth
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: { code: 'UNAUTHORIZED', message: 'Invalid auth token' } }, 401);
    }

    const body = await req.json();
    const { proposal_id, expires_in_days = 30 } = body as {
      proposal_id: string;
      expires_in_days?: number;
    };

    if (!proposal_id) {
      return jsonResponse({ error: { code: 'BAD_REQUEST', message: 'proposal_id is required' } }, 400);
    }

    const supabase = getServiceClient();

    // Fetch proposal and verify operator ownership + draft status
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select('id, operator_id, status, valid_days')
      .eq('id', proposal_id)
      .single();

    if (proposalError || !proposal) {
      return jsonResponse({ error: { code: 'NOT_FOUND', message: 'Proposal not found' } }, 404);
    }

    if (proposal.operator_id !== user.id) {
      return jsonResponse({ error: { code: 'FORBIDDEN', message: 'You do not own this proposal' } }, 403);
    }

    if (proposal.status !== 'draft') {
      return jsonResponse({ error: { code: 'BAD_REQUEST', message: 'Proposal must be in draft status to send' } }, 400);
    }

    // Generate raw token and hash
    const rawToken = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '');
    const tokenHash = await hashToken(rawToken);

    // Calculate expiry from valid_days (proposal field) or expires_in_days (request param)
    const days = proposal.valid_days ?? expires_in_days;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    // Update proposal: mark as sent with token
    const { error: updateError } = await supabase
      .from('proposals')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        token_hash: tokenHash,
        token_expires_at: expiresAt,
        expires_at: expiresAt,
      })
      .eq('id', proposal_id);

    if (updateError) {
      return jsonResponse({ error: { code: 'SERVER_ERROR', message: 'Failed to send proposal' } }, 500);
    }

    // Fire webhook (fire-and-forget)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    fetch(`${supabaseUrl}/functions/v1/fire-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        event_type: 'proposal.sent',
        operator_id: user.id,
        payload: { proposal_id },
      }),
    }).catch(() => {});

    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:5173';
    const portalUrl = `${appUrl}/portal/${rawToken}/proposal/${proposal_id}`;

    return jsonResponse({
      raw_token: rawToken,
      proposal_id,
      expires_at: expiresAt,
      portal_url: portalUrl,
    });
  } catch {
    return jsonResponse({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, 500);
  }
});
