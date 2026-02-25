import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsResponse, jsonResponse } from '../_shared/cors.ts';
import { validateToken } from '../_shared/validate-token.ts';
import { getServiceClient } from '../_shared/supabase.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse();

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return jsonResponse({ error: { code: 'INVALID_TOKEN', message: 'Token is required' } }, 400);
    }

    const result = await validateToken(token);
    if (!result.ok) {
      return jsonResponse({ error: { code: result.code, message: result.code === 'EXPIRED_TOKEN' ? 'This link has expired' : 'Invalid or unknown token' } }, result.status);
    }

    const { client } = result;
    const supabase = getServiceClient();

    // Fetch operator info for trust banner
    const { data: operator } = await supabase
      .from('operators')
      .select('full_name, business_name')
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

    return jsonResponse(
      {
        client: {
          id: client.id,
          company_name: client.company_name,
          contact_name: client.contact_name,
          status: client.status,
        },
        operator: operator ?? { full_name: 'Your Operator', business_name: null },
        deliveries: deliveries ?? [],
        scope_allocations: scopeAllocations ?? [],
      },
      200,
      { 'Cache-Control': 'public, max-age=30' }
    );
  } catch {
    return jsonResponse({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, 500);
  }
});
