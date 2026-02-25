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

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const proposalId = url.searchParams.get('proposal_id');

    if (!token) {
      return jsonResponse({ error: { code: 'BAD_REQUEST', message: 'Token is required' } }, 400);
    }

    const tokenHash = await hashToken(token);
    const supabase = getServiceClient();

    // Look up proposal by token_hash (optionally scoped to proposal_id)
    let query = supabase
      .from('proposals')
      .select('id, title, summary, notes, status, expires_at, accepted_at, declined_at, viewed_at, operator_id, client_id, token_expires_at')
      .eq('token_hash', tokenHash);

    if (proposalId) {
      query = query.eq('id', proposalId);
    }

    const { data: proposal, error: proposalError } = await query.single();

    if (proposalError || !proposal) {
      return jsonResponse({ error: { code: 'INVALID_TOKEN', message: 'Invalid or unknown token' } }, 404);
    }

    // Check token expiry
    if (proposal.token_expires_at && new Date(proposal.token_expires_at) < new Date()) {
      return jsonResponse({ error: { code: 'EXPIRED_TOKEN', message: 'This proposal link has expired' } }, 410);
    }

    // Track first view: update viewed_at and status
    const isFirstView = proposal.status === 'sent' && !proposal.viewed_at;
    if (isFirstView) {
      await supabase
        .from('proposals')
        .update({ viewed_at: new Date().toISOString(), status: 'viewed' })
        .eq('id', proposal.id);
    }

    // Fetch line items
    const { data: lineItems } = await supabase
      .from('proposal_line_items')
      .select('*')
      .eq('proposal_id', proposal.id)
      .order('sort_order', { ascending: true });

    // Fetch addons
    const { data: addons } = await supabase
      .from('proposal_addons')
      .select('*')
      .eq('proposal_id', proposal.id)
      .order('sort_order', { ascending: true });

    // Fetch client info
    const { data: client } = await supabase
      .from('clients')
      .select('company_name, contact_name')
      .eq('id', proposal.client_id)
      .single();

    // Fetch operator info
    const { data: operator } = await supabase
      .from('operators')
      .select('full_name, business_name')
      .eq('user_id', proposal.operator_id)
      .single();

    // Fetch agreement if exists
    const { data: agreement } = await supabase
      .from('agreements')
      .select('*')
      .eq('proposal_id', proposal.id)
      .maybeSingle();

    // Fire webhook on first view (fire-and-forget)
    if (isFirstView) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
      fetch(`${supabaseUrl}/functions/v1/fire-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          event_type: 'proposal.viewed',
          operator_id: proposal.operator_id,
          payload: { proposal_id: proposal.id },
        }),
      }).catch(() => {});
    }

    return jsonResponse(
      {
        proposal: {
          id: proposal.id,
          title: proposal.title,
          summary: proposal.summary,
          notes: proposal.notes,
          status: isFirstView ? 'viewed' : proposal.status,
          expires_at: proposal.expires_at,
          accepted_at: proposal.accepted_at,
          declined_at: proposal.declined_at,
        },
        line_items: lineItems ?? [],
        addons: addons ?? [],
        client: client ?? { company_name: 'Unknown', contact_name: null },
        operator: operator ?? { full_name: 'Your Operator', business_name: null },
        agreement: agreement ?? null,
      },
      200,
      { 'Cache-Control': 'no-cache' }
    );
  } catch {
    return jsonResponse({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, 500);
  }
});
