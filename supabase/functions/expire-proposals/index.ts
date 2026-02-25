import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsResponse, jsonResponse } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse();

  if (req.method !== 'POST') {
    return jsonResponse({ error: { code: 'METHOD_NOT_ALLOWED', message: 'POST only' } }, 405);
  }

  try {
    // Verify service role key authentication
    const authHeader = req.headers.get('authorization')?.replace('Bearer ', '');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (authHeader !== serviceKey) {
      return jsonResponse({ error: { code: 'UNAUTHORIZED', message: 'Service key required' } }, 401);
    }

    const supabase = getServiceClient();
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';

    // Find all proposals that have expired tokens
    const { data: expiredProposals, error: fetchError } = await supabase
      .from('proposals')
      .select('id, operator_id')
      .in('status', ['sent', 'viewed'])
      .not('token_expires_at', 'is', null)
      .lt('token_expires_at', new Date().toISOString());

    if (fetchError) {
      return jsonResponse({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch expired proposals' } }, 500);
    }

    if (!expiredProposals || expiredProposals.length === 0) {
      return jsonResponse({ expired_count: 0, proposal_ids: [] });
    }

    const proposalIds = expiredProposals.map((p: { id: string }) => p.id);

    // Update all expired proposals to 'expired' status
    const { error: updateError } = await supabase
      .from('proposals')
      .update({ status: 'expired' })
      .in('id', proposalIds);

    if (updateError) {
      return jsonResponse({ error: { code: 'SERVER_ERROR', message: 'Failed to update proposal statuses' } }, 500);
    }

    // Fire webhooks for each expired proposal (fire-and-forget)
    for (const proposal of expiredProposals) {
      fetch(`${supabaseUrl}/functions/v1/fire-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          event_type: 'proposal.expired',
          operator_id: proposal.operator_id,
          payload: { proposal_id: proposal.id },
        }),
      }).catch(() => {});
    }

    return jsonResponse({ expired_count: proposalIds.length, proposal_ids: proposalIds });
  } catch {
    return jsonResponse({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, 500);
  }
});
