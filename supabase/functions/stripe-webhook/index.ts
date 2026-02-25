import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { jsonResponse } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase.ts';

/** Verify the Stripe webhook signature using HMAC-SHA256. */
async function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string,
  webhookSecret: string
): Promise<{ valid: boolean; reason?: string }> {
  // Parse the Stripe-Signature header into key-value pairs
  const parts = signatureHeader.split(',').reduce((acc, part) => {
    const [key, value] = part.split('=');
    acc[key.trim()] = value;
    return acc;
  }, {} as Record<string, string>);

  const timestamp = parts['t'];
  const sig = parts['v1'];

  if (!timestamp || !sig) {
    return { valid: false, reason: 'Missing timestamp or signature' };
  }

  // Check timestamp freshness (300s tolerance)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) {
    return { valid: false, reason: 'Timestamp too old' };
  }

  // Compute expected signature
  const signedPayload = `${timestamp}.${rawBody}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const expectedSig = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
  const expectedHex = Array.from(new Uint8Array(expectedSig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  if (expectedHex !== sig) {
    return { valid: false, reason: 'Signature mismatch' };
  }

  return { valid: true };
}

/** Fire a webhook event (fire-and-forget). */
function fireWebhook(eventType: string, operatorId: string, payload: Record<string, unknown>) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  fetch(`${supabaseUrl}/functions/v1/fire-webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ event_type: eventType, operator_id: operatorId, payload }),
  }).catch(() => {});
}

/** Resolve the operator_id from either the connected account or the payment record. */
async function resolveOperatorId(
  supabase: ReturnType<typeof getServiceClient>,
  stripeAccountId: string | undefined,
  paymentRecordOperatorId?: string
): Promise<string | null> {
  // If we already have it from the payment record, use that
  if (paymentRecordOperatorId) return paymentRecordOperatorId;

  // Otherwise look up via the connected account
  if (stripeAccountId) {
    const { data: operator } = await supabase
      .from('operators')
      .select('user_id')
      .eq('stripe_account_id', stripeAccountId)
      .single();

    return operator?.user_id ?? null;
  }

  return null;
}

serve(async (req) => {
  // Stripe webhooks are always POST, no CORS needed
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Read raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response('Missing signature', { status: 400 });
    }

    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';
    const verification = await verifyStripeSignature(rawBody, signature, webhookSecret);

    if (!verification.valid) {
      return new Response(verification.reason || 'Invalid signature', { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventType: string = event.type;
    const stripeAccountId: string | undefined = event.account;
    const supabase = getServiceClient();

    switch (eventType) {
      // ── Invoice paid ──────────────────────────────────────────────
      case 'invoice.paid': {
        const invoice = event.data.object;
        const stripeInvoiceId: string = invoice.id;

        const { data: record } = await supabase
          .from('payment_records')
          .select('id, operator_id')
          .eq('stripe_invoice_id', stripeInvoiceId)
          .single();

        if (record) {
          await supabase
            .from('payment_records')
            .update({ payment_status: 'paid', paid_at: new Date().toISOString() })
            .eq('id', record.id);

          const operatorId = await resolveOperatorId(supabase, stripeAccountId, record.operator_id);
          if (operatorId) {
            fireWebhook('payment.succeeded', operatorId, {
              payment_record_id: record.id,
              stripe_invoice_id: stripeInvoiceId,
            });
          }
        }
        break;
      }

      // ── Invoice payment failed ────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const stripeInvoiceId: string = invoice.id;

        const { data: record } = await supabase
          .from('payment_records')
          .select('id, operator_id')
          .eq('stripe_invoice_id', stripeInvoiceId)
          .single();

        if (record) {
          await supabase
            .from('payment_records')
            .update({ payment_status: 'overdue' })
            .eq('id', record.id);

          const operatorId = await resolveOperatorId(supabase, stripeAccountId, record.operator_id);
          if (operatorId) {
            fireWebhook('payment.failed', operatorId, {
              payment_record_id: record.id,
              stripe_invoice_id: stripeInvoiceId,
            });
          }
        }
        break;
      }

      // ── Subscription updated ──────────────────────────────────────
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const stripeSubscriptionId: string = subscription.id;

        const { data: record } = await supabase
          .from('payment_records')
          .select('id')
          .eq('stripe_subscription_id', stripeSubscriptionId)
          .single();

        if (record) {
          const updateData: Record<string, unknown> = {};

          if (subscription.current_period_start) {
            updateData.period_start = new Date(subscription.current_period_start * 1000)
              .toISOString()
              .split('T')[0];
          }
          if (subscription.current_period_end) {
            updateData.period_end = new Date(subscription.current_period_end * 1000)
              .toISOString()
              .split('T')[0];
          }

          if (Object.keys(updateData).length > 0) {
            await supabase
              .from('payment_records')
              .update(updateData)
              .eq('id', record.id);
          }
        }
        break;
      }

      // ── Subscription deleted ──────────────────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const stripeSubscriptionId: string = subscription.id;

        const { data: record } = await supabase
          .from('payment_records')
          .select('id, operator_id')
          .eq('stripe_subscription_id', stripeSubscriptionId)
          .single();

        if (record) {
          await supabase
            .from('payment_records')
            .update({ payment_status: 'cancelled' })
            .eq('id', record.id);

          const operatorId = await resolveOperatorId(supabase, stripeAccountId, record.operator_id);
          if (operatorId) {
            fireWebhook('subscription.cancelled', operatorId, {
              payment_record_id: record.id,
              stripe_subscription_id: stripeSubscriptionId,
            });
          }
        }
        break;
      }

      // ── Charge refunded ───────────────────────────────────────────
      case 'charge.refunded': {
        const charge = event.data.object;
        const stripePaymentIntentId: string | null = charge.payment_intent;

        if (stripePaymentIntentId) {
          const { data: record } = await supabase
            .from('payment_records')
            .select('id, operator_id')
            .eq('stripe_payment_intent_id', stripePaymentIntentId)
            .single();

          if (record) {
            await supabase
              .from('payment_records')
              .update({ payment_status: 'refunded' })
              .eq('id', record.id);

            const operatorId = await resolveOperatorId(
              supabase,
              stripeAccountId,
              record.operator_id
            );
            if (operatorId) {
              fireWebhook('payment.refunded', operatorId, {
                payment_record_id: record.id,
                stripe_payment_intent_id: stripePaymentIntentId,
              });
            }
          }
        }
        break;
      }

      default:
        // Unhandled event type — acknowledge receipt silently
        break;
    }

    return jsonResponse({ received: true });
  } catch {
    return new Response('Webhook processing error', { status: 500 });
  }
});
