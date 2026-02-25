import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
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
    const body = await req.json();
    const { token, reason } = body as {
      token: string;
      reason?: string;
    };

    if (!token) {
      return jsonResponse({ error: { code: 'BAD_REQUEST', message: 'token is required' } }, 400);
    }

    const tokenHash = await hashToken(token);
    const supabase = getServiceClient();

    // Look up proposal by token_hash
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select('id, operator_id, status, token_expires_at')
      .eq('token_hash', tokenHash)
      .single();

    if (proposalError || !proposal) {
      return jsonResponse({ error: { code: 'NOT_FOUND', message: 'Proposal not found' } }, 404);
    }

    // Validate token not expired
    if (proposal.token_expires_at && new Date(proposal.token_expires_at) < new Date()) {
      return jsonResponse({ error: { code: 'EXPIRED_TOKEN', message: 'Proposal token has expired' } }, 410);
    }

    // Validate proposal is in a declinable state
    if (proposal.status !== 'sent' && proposal.status !== 'viewed') {
      return jsonResponse(
        { error: { code: 'BAD_REQUEST', message: 'Proposal is not in a state that allows declining' } },
        400
      );
    }

    // Update proposal to declined
    const { error: updateError } = await supabase
      .from('proposals')
      .update({
        status: 'declined',
        declined_at: new Date().toISOString(),
        decline_reason: reason?.trim() || null,
      })
      .eq('id', proposal.id);

    if (updateError) {
      return jsonResponse({ error: { code: 'SERVER_ERROR', message: 'Failed to decline proposal' } }, 500);
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
        event_type: 'proposal.declined',
        operator_id: proposal.operator_id,
        payload: { proposal_id: proposal.id, reason: reason?.trim() || null },
      }),
    }).catch(() => {});

    return jsonResponse({ success: true, proposal_id: proposal.id });
  } catch {
    return jsonResponse({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, 500);
  }
});
