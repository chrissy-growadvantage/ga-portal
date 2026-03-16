import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsResponse, jsonResponse } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase.ts';
import { buildDigestEmail } from './template.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse();

  try {
    const url = new URL(req.url);
    const isTest = url.searchParams.get('test') === 'true';

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return jsonResponse({ error: 'RESEND_API_KEY not configured' }, 500);
    }

    const siteUrl = Deno.env.get('SITE_URL') ?? 'https://app.lumaops.com';
    const supabase = getServiceClient();

    // For test mode, accept a client_id in the request body
    let testClientId: string | null = null;
    if (isTest && req.method === 'POST') {
      try {
        const body = await req.json();
        testClientId = body?.client_id ?? null;
      } catch {
        // No body or invalid JSON — fine for test mode
      }
    }

    // Query eligible clients
    let clientQuery = supabase
      .from('clients')
      .select('id, company_name, contact_name, contact_email, operator_id, magic_link_token_hash')
      .not('magic_link_token_hash', 'is', null)
      .eq('status', 'active');

    if (testClientId) {
      clientQuery = clientQuery.eq('id', testClientId);
    }

    const { data: clients, error: clientError } = await clientQuery;

    if (clientError) {
      return jsonResponse({ error: clientError.message }, 500);
    }

    if (!clients || clients.length === 0) {
      return jsonResponse({ sent: 0, skipped: 'no eligible clients', errors: [] });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const sent: string[] = [];
    const errors: string[] = [];

    for (const client of clients) {
      try {
        if (!client.contact_email) {
          errors.push(`${client.company_name}: no contact email`);
          continue;
        }

        // Fetch operator info
        const { data: operator } = await supabase
          .from('operators')
          .select('full_name, business_name')
          .eq('id', client.operator_id)
          .single();

        const operatorName = operator?.business_name ?? operator?.full_name ?? 'Your Operator';

        // Deliveries completed in past 7 days
        const { data: recentDeliveries } = await supabase
          .from('delivery_items')
          .select('title, category, updated_at')
          .eq('client_id', client.id)
          .in('status', ['approved', 'completed'])
          .gte('updated_at', sevenDaysAgo)
          .order('updated_at', { ascending: false });

        // Pending approvals
        const { data: pendingApprovals } = await supabase
          .from('delivery_items')
          .select('title, category')
          .eq('client_id', client.id)
          .eq('status', 'pending_approval');

        // Latest scope allocation
        const { data: scopeAllocs } = await supabase
          .from('scope_allocations')
          .select('total_allocated, used')
          .eq('client_id', client.id)
          .order('period_start', { ascending: false })
          .limit(1);

        const scope = scopeAllocs?.[0];
        const portalUrl = `${siteUrl}/portal/${client.magic_link_token_hash}`;

        const html = buildDigestEmail({
          clientName: client.company_name,
          operatorName,
          deliveriesThisWeek: (recentDeliveries ?? []).map((d) => ({
            title: d.title,
            category: d.category,
            completedAt: d.updated_at,
          })),
          pendingApprovals: (pendingApprovals ?? []).map((a) => ({
            title: a.title,
            category: a.category,
          })),
          scopeUsed: scope?.used ?? 0,
          scopeTotal: scope?.total_allocated ?? 0,
          portalUrl,
        });

        // Send via Resend
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'Luma <digest@lumaops.com>',
            to: [client.contact_email],
            subject: `Weekly Summary — ${client.company_name}`,
            html,
          }),
        });

        if (!emailRes.ok) {
          const errBody = await emailRes.text();
          errors.push(`${client.company_name}: Resend error ${emailRes.status} — ${errBody}`);
        } else {
          sent.push(client.company_name);
        }
      } catch (err) {
        errors.push(`${client.company_name}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return jsonResponse({ sent: sent.length, clients: sent, errors });
  } catch {
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
});
