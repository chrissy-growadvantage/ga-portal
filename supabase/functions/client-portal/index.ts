import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsResponse, jsonResponse } from '../_shared/cors.ts';
import { validateToken } from '../_shared/validate-token.ts';
import { getServiceClient } from '../_shared/supabase.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse();

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const snapshotSlug = url.searchParams.get('snapshot');

    if (!token) {
      return jsonResponse({ error: { code: 'INVALID_TOKEN', message: 'Token is required' } }, 400);
    }

    const result = await validateToken(token);
    if (!result.ok) {
      return jsonResponse({ error: { code: result.code, message: result.code === 'EXPIRED_TOKEN' ? 'This link has expired' : 'Invalid or unknown token' } }, result.status);
    }

    const { client: validatedClient } = result;
    const supabase = getServiceClient();

    // Re-fetch full client row (validateToken only returns slim fields)
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', validatedClient.id)
      .single();

    if (clientError || !client) {
      return jsonResponse({ error: { code: 'SERVER_ERROR', message: 'Failed to load client' } }, 500);
    }

    // If requesting a specific snapshot, return just that snapshot
    if (snapshotSlug) {
      const { data: snapshot, error: snapshotError } = await supabase
        .from('monthly_snapshots')
        .select('*')
        .eq('client_id', client.id)
        .eq('month_slug', snapshotSlug)
        .single();

      if (snapshotError || !snapshot) {
        return jsonResponse({ error: { code: 'NOT_FOUND', message: 'Snapshot not found' } }, 404);
      }

      return jsonResponse({ snapshot }, 200, { 'Cache-Control': 'public, max-age=60' });
    }

    // Fetch operator info for trust banner
    const { data: operator } = await supabase
      .from('operators')
      .select('full_name, business_name, portal_logo_url, portal_primary_color, portal_accent_color')
      .eq('id', client.operator_id)
      .single();

    // Fetch deliveries with latest approval per item
    const { data: deliveries } = await supabase
      .from('delivery_items')
      .select('*')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false });

    // Fetch scope allocations
    const { data: scopeAllocations } = await supabase
      .from('scope_allocations')
      .select('*')
      .eq('client_id', client.id)
      .order('period_start', { ascending: false });

    // Fetch agreements for this client
    const { data: agreements } = await supabase
      .from('agreements')
      .select('id, proposal_id, signer_name, signer_email, signed_at, snapshot, created_at')
      .eq('client_id', client.id)
      .order('signed_at', { ascending: false });

    // Fetch monthly snapshots index (lightweight — just enough to render the list)
    const { data: monthlySnapshots } = await supabase
      .from('monthly_snapshots')
      .select('id, month_label, month_slug, created_at')
      .eq('client_id', client.id)
      .order('month_slug', { ascending: false });

    // Fetch scope requests for this client
    const { data: scopeRequests } = await supabase
      .from('scope_requests')
      .select('id, title, description, status, category, admin_note, attachment_url, ga_status, created_at')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false });

    // Fetch onboarding stages for this client
    const { data: onboardingStages } = await supabase
      .from('onboarding_stages')
      .select('id, stage_key, stage_label, sort_order, status, owner_label, due_date, notes, action_url, completed_at')
      .eq('client_id', client.id)
      .order('sort_order', { ascending: true });

    // Fetch client tasks (active + recently completed)
    const { data: clientTasks } = await supabase
      .from('client_tasks')
      .select('id, title, due_date, link_url, completed_at, created_at')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false });

    return jsonResponse(
      {
        client: {
          id: client.id,
          company_name: client.company_name,
          contact_name: client.contact_name,
          status: client.status,
          // Portal metadata fields (migration 021)
          integrator_name: client.integrator_name ?? null,
          primary_comms_channel: client.primary_comms_channel ?? null,
          next_strategy_meeting: client.next_strategy_meeting ?? null,
          this_month_outcomes: client.this_month_outcomes ?? null,
          this_month_deliverables: client.this_month_deliverables ?? null,
          this_month_improvements: client.this_month_improvements ?? null,
          this_month_risks: client.this_month_risks ?? null,
          this_month_focus: client.this_month_focus ?? null,
          portal_slack_url: client.portal_slack_url ?? null,
          portal_drive_url: client.portal_drive_url ?? null,
          portal_booking_url: client.portal_booking_url ?? null,
          portal_stripe_url: client.portal_stripe_url ?? null,
          portal_intake_url: client.portal_intake_url ?? null,
          onboarding_stage: client.onboarding_stage ?? null,
          hours_used_this_month: client.hours_used_this_month ?? null,
          next_meeting_at: client.next_meeting_at ?? null,
          next_meeting_link: client.next_meeting_link ?? null,
          completed_this_month: client.completed_this_month ?? null,
          monthly_plan_notes: client.monthly_plan_notes ?? null,
          portal_proposal_url: client.portal_proposal_url ?? null,
          portal_contract_url: client.portal_contract_url ?? null,
          portal_contract_pdf_url: client.portal_contract_pdf_url ?? null,
        },
        operator: {
          full_name: operator?.full_name ?? 'Your Operator',
          business_name: operator?.business_name ?? null,
          portal_logo_url: operator?.portal_logo_url ?? null,
          portal_primary_color: operator?.portal_primary_color ?? null,
          portal_accent_color: operator?.portal_accent_color ?? null,
        },
        deliveries: deliveries ?? [],
        scope_allocations: scopeAllocations ?? [],
        agreements: agreements ?? [],
        monthly_snapshots: monthlySnapshots ?? [],
        scope_requests: scopeRequests ?? [],
        onboarding_stages: onboardingStages ?? [],
        client_tasks: clientTasks ?? [],
      },
      200,
      { 'Cache-Control': 'public, max-age=30' }
    );
  } catch {
    return jsonResponse({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, 500);
  }
});
