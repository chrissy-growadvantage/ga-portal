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
    const { token, signer_name, signer_email } = body as {
      token: string;
      signer_name: string;
      signer_email?: string;
    };

    if (!token || !signer_name) {
      return jsonResponse(
        { error: { code: 'BAD_REQUEST', message: 'token and signer_name are required' } },
        400
      );
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

    // Validate proposal is in a signable state
    if (proposal.status !== 'sent' && proposal.status !== 'viewed') {
      return jsonResponse(
        { error: { code: 'BAD_REQUEST', message: 'Proposal is not in a signable state' } },
        400
      );
    }

    // Capture forensic metadata
    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    const signatureData = {
      signer_name,
      signer_email: signer_email || null,
      ip_address: ipAddress,
      user_agent: userAgent,
      consent_text: 'I agree to the services and pricing outlined in this proposal',
      signed_at: new Date().toISOString(),
    };

    // Create agreement via database function
    const { data: agreement, error: agreementError } = await supabase.rpc('create_agreement', {
      p_proposal_id: proposal.id,
      p_token_hash: tokenHash,
      p_signer_name: signer_name,
      p_signer_email: signer_email || null,
      p_signature_data: signatureData,
    });

    if (agreementError) {
      return jsonResponse(
        { error: { code: 'SERVER_ERROR', message: agreementError.message || 'Failed to create agreement' } },
        500
      );
    }

    // Fire webhooks (fire-and-forget)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    fetch(`${supabaseUrl}/functions/v1/fire-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        event_type: 'proposal.accepted',
        operator_id: proposal.operator_id,
        payload: { proposal_id: proposal.id, agreement_id: agreement.id },
      }),
    }).catch(() => {});

    fetch(`${supabaseUrl}/functions/v1/fire-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        event_type: 'agreement.created',
        operator_id: proposal.operator_id,
        payload: { proposal_id: proposal.id, agreement_id: agreement.id },
      }),
    }).catch(() => {});

    // Trigger payment creation (fire-and-forget — gracefully skips if Stripe not connected)
    fetch(`${supabaseUrl}/functions/v1/create-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ agreement_id: agreement.id }),
    }).catch(() => {});

    return jsonResponse({ success: true, agreement_id: agreement.id });
  } catch {
    return jsonResponse({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, 500);
  }
});
