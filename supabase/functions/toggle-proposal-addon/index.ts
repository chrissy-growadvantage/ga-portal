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
    const { token, addon_id, is_selected } = body as {
      token: string;
      addon_id: string;
      is_selected: boolean;
    };

    if (!token || !addon_id || typeof is_selected !== 'boolean') {
      return jsonResponse(
        { error: { code: 'BAD_REQUEST', message: 'token, addon_id, and is_selected are required' } },
        400
      );
    }

    const tokenHash = await hashToken(token);
    const supabase = getServiceClient();

    // Look up proposal by token_hash
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select('id, status, token_expires_at')
      .eq('token_hash', tokenHash)
      .single();

    if (proposalError || !proposal) {
      return jsonResponse({ error: { code: 'NOT_FOUND', message: 'Proposal not found' } }, 404);
    }

    // Validate token not expired
    if (proposal.token_expires_at && new Date(proposal.token_expires_at) < new Date()) {
      return jsonResponse({ error: { code: 'EXPIRED_TOKEN', message: 'Proposal token has expired' } }, 410);
    }

    // Validate proposal is in a togglable state
    if (proposal.status !== 'sent' && proposal.status !== 'viewed') {
      return jsonResponse(
        { error: { code: 'BAD_REQUEST', message: 'Proposal is not in a state that allows addon changes' } },
        400
      );
    }

    // Verify addon belongs to this proposal and is_included=true
    const { data: addon, error: addonError } = await supabase
      .from('proposal_addons')
      .select('id, proposal_id, is_included')
      .eq('id', addon_id)
      .single();

    if (addonError || !addon) {
      return jsonResponse({ error: { code: 'NOT_FOUND', message: 'Addon not found' } }, 404);
    }

    if (addon.proposal_id !== proposal.id) {
      return jsonResponse({ error: { code: 'FORBIDDEN', message: 'Addon does not belong to this proposal' } }, 403);
    }

    if (!addon.is_included) {
      return jsonResponse(
        { error: { code: 'BAD_REQUEST', message: 'Only included addons can be toggled' } },
        400
      );
    }

    // Update addon selection
    const { error: updateError } = await supabase
      .from('proposal_addons')
      .update({ is_selected })
      .eq('id', addon_id);

    if (updateError) {
      return jsonResponse({ error: { code: 'SERVER_ERROR', message: 'Failed to update addon' } }, 500);
    }

    return jsonResponse({ success: true, addon_id, is_selected });
  } catch {
    return jsonResponse({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, 500);
  }
});
