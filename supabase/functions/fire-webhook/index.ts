import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsResponse, jsonResponse } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase.ts';

const RETRY_DELAYS = [10, 60, 300]; // seconds: 10s, 60s, 5min

async function hmacSign(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse();

  if (req.method !== 'POST') {
    return jsonResponse({ error: { code: 'METHOD_NOT_ALLOWED', message: 'POST only' } }, 405);
  }

  try {
    const { event_type, operator_id, payload } = (await req.json()) as {
      event_type: string;
      operator_id: string;
      payload: Record<string, unknown>;
    };

    if (!event_type || !operator_id || !payload) {
      return jsonResponse(
        { error: { code: 'BAD_REQUEST', message: 'event_type, operator_id, and payload are required' } },
        400
      );
    }

    const supabase = getServiceClient();

    // Look up active webhook endpoints for this operator matching the event type
    const { data: endpoints, error: endpointsError } = await supabase
      .from('webhook_endpoints')
      .select('id, url, secret, events')
      .eq('operator_id', operator_id)
      .eq('is_active', true);

    if (endpointsError) {
      return jsonResponse({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch webhook endpoints' } }, 500);
    }

    // Filter endpoints that subscribe to this event type
    const matchingEndpoints = (endpoints ?? []).filter(
      (ep: { events: string[] }) => ep.events.includes(event_type) || ep.events.includes('*')
    );

    let delivered = 0;
    let failed = 0;

    for (const endpoint of matchingEndpoints) {
      const payloadJson = JSON.stringify(payload);
      const signature = await hmacSign(endpoint.secret, payloadJson);

      let responseStatus: number | null = null;
      let responseBody = '';
      let success = false;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10_000);

        const response = await fetch(endpoint.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Luma-Signature': `sha256=${signature}`,
            'X-Luma-Event': event_type,
          },
          body: payloadJson,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        responseStatus = response.status;
        responseBody = await response.text();
        success = response.ok;
      } catch (err) {
        responseStatus = 0;
        responseBody = err instanceof Error ? err.message : 'Unknown fetch error';
        success = false;
      }

      // Truncate response body to 1000 chars
      const truncatedBody = responseBody.slice(0, 1000);

      if (success) {
        delivered++;

        await supabase.from('webhook_deliveries').insert({
          webhook_endpoint_id: endpoint.id,
          event_type,
          payload,
          response_status: responseStatus,
          response_body: truncatedBody,
          delivered_at: new Date().toISOString(),
          attempts: 1,
          next_retry_at: null,
        });
      } else {
        failed++;

        const retryDelay = RETRY_DELAYS[0]; // First retry: 10s
        const nextRetryAt = new Date(Date.now() + retryDelay * 1000).toISOString();

        await supabase.from('webhook_deliveries').insert({
          webhook_endpoint_id: endpoint.id,
          event_type,
          payload,
          response_status: responseStatus,
          response_body: truncatedBody,
          delivered_at: null,
          attempts: 1,
          next_retry_at: nextRetryAt,
        });
      }
    }

    return jsonResponse({ delivered, failed });
  } catch {
    return jsonResponse({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, 500);
  }
});
