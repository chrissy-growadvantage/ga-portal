import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsResponse, jsonResponse } from '../_shared/cors.ts';
import { validateToken } from '../_shared/validate-token.ts';
import { getServiceClient } from '../_shared/supabase.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse();

  if (req.method !== 'POST') {
    return jsonResponse({ error: { code: 'METHOD_NOT_ALLOWED', message: 'POST only' } }, 405);
  }

  try {
    const body = await req.json();
    const { token, delivery_item_id, action, note } = body as {
      token: string;
      delivery_item_id: string;
      action: 'approved' | 'revision_requested';
      note?: string;
    };

    if (!token || !delivery_item_id || !action) {
      return jsonResponse({ error: { code: 'BAD_REQUEST', message: 'token, delivery_item_id, and action are required' } }, 400);
    }

    if (action !== 'approved' && action !== 'revision_requested') {
      return jsonResponse({ error: { code: 'BAD_REQUEST', message: 'action must be "approved" or "revision_requested"' } }, 400);
    }

    // Validate token
    const result = await validateToken(token);
    if (!result.ok) {
      return jsonResponse({ error: { code: result.code, message: 'Invalid token' } }, result.status);
    }

    const { client } = result;
    const supabase = getServiceClient();

    // Verify delivery item belongs to this client
    const { data: deliveryItem, error: diError } = await supabase
      .from('delivery_items')
      .select('id, client_id, status')
      .eq('id', delivery_item_id)
      .single();

    if (diError || !deliveryItem) {
      return jsonResponse({ error: { code: 'NOT_FOUND', message: 'Delivery item not found' } }, 404);
    }

    if (deliveryItem.client_id !== client.id) {
      return jsonResponse({ error: { code: 'FORBIDDEN', message: 'Delivery item does not belong to this client' } }, 403);
    }

    // Insert approval record
    const { error: approvalError } = await supabase
      .from('client_approvals')
      .insert({
        delivery_item_id,
        action,
        note: note?.trim() || null,
        acted_at: new Date().toISOString(),
      });

    if (approvalError) {
      return jsonResponse({ error: { code: 'SERVER_ERROR', message: 'Failed to record approval' } }, 500);
    }

    // Update delivery item status
    const newStatus = action === 'approved' ? 'approved' : 'revision_requested';
    await supabase
      .from('delivery_items')
      .update({ status: newStatus })
      .eq('id', delivery_item_id);

    return jsonResponse({ success: true, action, delivery_item_id });
  } catch {
    return jsonResponse({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, 500);
  }
});
