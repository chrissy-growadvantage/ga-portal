import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsResponse, jsonResponse } from '../_shared/cors.ts';
import { validateToken } from '../_shared/validate-token.ts';
import { getServiceClient } from '../_shared/supabase.ts';
import { notifyOperatorByEmail, notifyOperatorBySlack } from '../_shared/notify.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse();

  if (req.method !== 'POST') {
    return jsonResponse({ error: { code: 'METHOD_NOT_ALLOWED', message: 'POST only' } }, 405);
  }

  try {
    const body = await req.json();
    const { token, title, description, category, attachment_url } = body as {
      token: string;
      title: string;
      description?: string;
      category?: string;
      attachment_url?: string;
    };

    if (!token) {
      return jsonResponse({ error: { code: 'BAD_REQUEST', message: 'Token is required' } }, 400);
    }

    // Validate title
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return jsonResponse({ error: { code: 'BAD_REQUEST', message: 'Title is required' } }, 400);
    }

    if (title.trim().length > 500) {
      return jsonResponse({ error: { code: 'BAD_REQUEST', message: 'Title must be 500 characters or less' } }, 400);
    }

    // Validate description if provided
    if (description !== undefined && typeof description === 'string' && description.length > 2000) {
      return jsonResponse({ error: { code: 'BAD_REQUEST', message: 'Description must be 2000 characters or less' } }, 400);
    }

    // Validate token
    const result = await validateToken(token);
    if (!result.ok) {
      return jsonResponse({ error: { code: result.code, message: 'Invalid token' } }, result.status);
    }

    const { client } = result;
    const supabase = getServiceClient();

    const { data: scopeRequest, error: insertError } = await supabase
      .from('scope_requests')
      .insert({
        client_id: client.id,
        title: title.trim(),
        description: description?.trim() || null,
        status: 'pending',
        category: category ?? null,
        attachment_url: attachment_url ?? null,
        ga_status: 'submitted',
      })
      .select('id')
      .single();

    if (insertError || !scopeRequest) {
      return jsonResponse({ error: { code: 'SERVER_ERROR', message: 'Failed to create request' } }, 500);
    }

    // --- Operator notification (best-effort, non-blocking) ---
    const siteUrl = Deno.env.get('SITE_URL') ?? 'https://app.lumaops.com';

    const { data: operator } = await supabase
      .from('operators')
      .select('email, full_name, business_name')
      .eq('id', client.operator_id)
      .single();

    if (operator) {
      const notificationPayload = {
        operatorEmail: operator.email,
        operatorName: operator.business_name ?? operator.full_name ?? 'Operator',
        clientName: client.company_name,
        requestTitle: title.trim(),
        requestDescription: description?.trim() ?? null,
        requestId: scopeRequest.id,
        siteUrl,
      };

      // Fire-and-forget — errors are logged inside helpers, never bubble up
      await Promise.allSettled([
        notifyOperatorByEmail(notificationPayload),
        notifyOperatorBySlack(notificationPayload),
      ]);
    }
    // ---------------------------------------------------------

    return jsonResponse({ success: true, id: scopeRequest.id });
  } catch {
    return jsonResponse({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, 500);
  }
});
