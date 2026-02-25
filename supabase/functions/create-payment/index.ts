import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsResponse, jsonResponse } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase.ts';

const STRIPE_API = 'https://api.stripe.com/v1';

interface SnapshotItem {
  name: string;
  description?: string;
  quantity?: number;
  unit_price?: number;
  price?: number;
  billing_type: 'one_time' | 'recurring';
  is_selected?: boolean;
}

/** Build common Stripe headers for connected account requests. */
function stripeHeaders(stripeAccountId: string): Record<string, string> {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
  return {
    Authorization: `Bearer ${stripeKey}`,
    'Content-Type': 'application/x-www-form-urlencoded',
    'Stripe-Account': stripeAccountId,
  };
}

/** Calculate the total amount in cents for a set of items. */
function totalCents(items: SnapshotItem[]): number {
  return items.reduce((sum, item) => {
    const unitPrice = item.unit_price ?? item.price ?? 0;
    const qty = item.quantity ?? 1;
    return sum + Math.round(unitPrice * qty * 100);
  }, 0);
}

/** Calculate the item amount in cents. */
function itemCents(item: SnapshotItem): number {
  const unitPrice = item.unit_price ?? item.price ?? 0;
  const qty = item.quantity ?? 1;
  return Math.round(unitPrice * qty * 100);
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

/** Search for or create a Stripe customer on the connected account. */
async function getOrCreateCustomer(
  email: string,
  name: string,
  clientId: string,
  stripeAccountId: string
): Promise<string> {
  const headers = stripeHeaders(stripeAccountId);

  // Search for existing customer by email
  const searchRes = await fetch(
    `${STRIPE_API}/customers/search?query=${encodeURIComponent(`email:'${email}'`)}`,
    { method: 'GET', headers: { Authorization: headers.Authorization, 'Stripe-Account': stripeAccountId } }
  );

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.data?.length > 0) {
      return searchData.data[0].id;
    }
  }

  // Create new customer
  const createRes = await fetch(`${STRIPE_API}/customers`, {
    method: 'POST',
    headers,
    body: new URLSearchParams({
      email,
      name,
      'metadata[luma_client_id]': clientId,
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json();
    throw new Error(err?.error?.message || 'Failed to create Stripe customer');
  }

  const customer = await createRes.json();
  return customer.id;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse();

  if (req.method !== 'POST') {
    return jsonResponse({ error: { code: 'METHOD_NOT_ALLOWED', message: 'POST only' } }, 405);
  }

  try {
    // Verify auth: accept service role key or operator JWT
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return jsonResponse({ error: { code: 'UNAUTHORIZED', message: 'Authorization header required' } }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const isServiceRole = token === serviceKey;

    if (!isServiceRole) {
      // Validate as operator JWT
      const anonClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );
      const { error: authError } = await anonClient.auth.getUser();
      if (authError) {
        return jsonResponse({ error: { code: 'UNAUTHORIZED', message: 'Invalid auth token' } }, 401);
      }
    }

    const body = await req.json();
    const { agreement_id } = body as { agreement_id: string };

    if (!agreement_id) {
      return jsonResponse(
        { error: { code: 'BAD_REQUEST', message: 'agreement_id is required' } },
        400
      );
    }

    const supabase = getServiceClient();

    // Fetch agreement with operator and client info
    const { data: agreement, error: agreementError } = await supabase
      .from('agreements')
      .select(
        '*, operator:operators(stripe_account_id, stripe_onboarding_complete), client:clients(contact_email, company_name, contact_name)'
      )
      .eq('id', agreement_id)
      .single();

    if (agreementError || !agreement) {
      return jsonResponse({ error: { code: 'NOT_FOUND', message: 'Agreement not found' } }, 404);
    }

    const operator = agreement.operator;
    const client = agreement.client;

    // Skip if Stripe is not connected — not an error
    if (!operator?.stripe_account_id || !operator?.stripe_onboarding_complete) {
      return jsonResponse({ skipped: true, reason: 'stripe_not_connected' });
    }

    const stripeAccountId = operator.stripe_account_id;

    // Parse snapshot for line items and selected addons
    const snapshot = agreement.snapshot ?? {};
    const lineItems: SnapshotItem[] = snapshot.line_items ?? [];
    const selectedAddons: SnapshotItem[] = (snapshot.addons ?? []).filter(
      (a: SnapshotItem) => a.is_selected
    );

    const allItems = [...lineItems, ...selectedAddons];
    const oneTimeItems = allItems.filter((i) => i.billing_type === 'one_time');
    const recurringItems = allItems.filter((i) => i.billing_type === 'recurring');

    // Nothing to bill
    if (oneTimeItems.length === 0 && recurringItems.length === 0) {
      return jsonResponse({ skipped: true, reason: 'no_billable_items' });
    }

    // Get or create Stripe customer on the connected account
    const customerName = client.company_name || client.contact_name || 'Client';
    const customerId = await getOrCreateCustomer(
      client.contact_email,
      customerName,
      agreement.client_id,
      stripeAccountId
    );

    const headers = stripeHeaders(stripeAccountId);
    const paymentRecordIds: string[] = [];
    let invoiceId: string | null = null;
    let subscriptionId: string | null = null;

    // --- One-time items: Create Stripe Invoice ---
    if (oneTimeItems.length > 0) {
      // Create invoice items
      for (const item of oneTimeItems) {
        const amount = itemCents(item);
        const description = item.name + (item.description ? ` - ${item.description}` : '');

        const itemRes = await fetch(`${STRIPE_API}/invoiceitems`, {
          method: 'POST',
          headers,
          body: new URLSearchParams({
            customer: customerId,
            amount: String(amount),
            currency: 'usd',
            description,
          }),
        });

        if (!itemRes.ok) {
          const err = await itemRes.json();
          throw new Error(err?.error?.message || 'Failed to create invoice item');
        }
      }

      // Create invoice
      const invoiceRes = await fetch(`${STRIPE_API}/invoices`, {
        method: 'POST',
        headers,
        body: new URLSearchParams({
          customer: customerId,
          auto_advance: 'true',
          'metadata[luma_agreement_id]': agreement_id,
        }),
      });

      if (!invoiceRes.ok) {
        const err = await invoiceRes.json();
        throw new Error(err?.error?.message || 'Failed to create invoice');
      }

      const invoice = await invoiceRes.json();
      invoiceId = invoice.id;

      // Finalize invoice
      const finalizeRes = await fetch(`${STRIPE_API}/invoices/${invoice.id}/finalize`, {
        method: 'POST',
        headers,
      });

      if (!finalizeRes.ok) {
        const err = await finalizeRes.json();
        throw new Error(err?.error?.message || 'Failed to finalize invoice');
      }

      // Insert payment record for one-time invoice
      const oneTimeTotal = totalCents(oneTimeItems) / 100; // Store as dollars in DB
      const { data: paymentRecord, error: prError } = await supabase
        .from('payment_records')
        .insert({
          agreement_id,
          client_id: agreement.client_id,
          operator_id: agreement.operator_id,
          stripe_invoice_id: invoice.id,
          amount: oneTimeTotal,
          currency: 'usd',
          billing_type: 'one_time',
          payment_status: 'pending',
        })
        .select('id')
        .single();

      if (prError) {
        throw new Error(prError.message || 'Failed to create payment record');
      }

      paymentRecordIds.push(paymentRecord.id);

      fireWebhook('payment.created', agreement.operator_id, {
        agreement_id,
        payment_record_id: paymentRecord.id,
        billing_type: 'one_time',
        stripe_invoice_id: invoice.id,
      });
    }

    // --- Recurring items: Create Stripe Subscription ---
    if (recurringItems.length > 0) {
      // Create a Price for each recurring item
      const priceIds: string[] = [];

      for (const item of recurringItems) {
        const amount = itemCents(item);

        const priceRes = await fetch(`${STRIPE_API}/prices`, {
          method: 'POST',
          headers,
          body: new URLSearchParams({
            unit_amount: String(amount),
            currency: 'usd',
            'recurring[interval]': 'month',
            'product_data[name]': item.name,
          }),
        });

        if (!priceRes.ok) {
          const err = await priceRes.json();
          throw new Error(err?.error?.message || 'Failed to create price');
        }

        const price = await priceRes.json();
        priceIds.push(price.id);
      }

      // Build subscription items params
      const subParams = new URLSearchParams({
        customer: customerId,
        'metadata[luma_agreement_id]': agreement_id,
      });

      priceIds.forEach((priceId, idx) => {
        subParams.append(`items[${idx}][price]`, priceId);
      });

      const subRes = await fetch(`${STRIPE_API}/subscriptions`, {
        method: 'POST',
        headers,
        body: subParams,
      });

      if (!subRes.ok) {
        const err = await subRes.json();
        throw new Error(err?.error?.message || 'Failed to create subscription');
      }

      const subscription = await subRes.json();
      subscriptionId = subscription.id;

      // Insert payment record for recurring subscription
      const recurringTotal = totalCents(recurringItems) / 100; // Store as dollars in DB
      const { data: paymentRecord, error: prError } = await supabase
        .from('payment_records')
        .insert({
          agreement_id,
          client_id: agreement.client_id,
          operator_id: agreement.operator_id,
          stripe_subscription_id: subscription.id,
          amount: recurringTotal,
          currency: 'usd',
          billing_type: 'recurring',
          payment_status: 'pending',
          period_start: subscription.current_period_start
            ? new Date(subscription.current_period_start * 1000).toISOString().split('T')[0]
            : null,
          period_end: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString().split('T')[0]
            : null,
        })
        .select('id')
        .single();

      if (prError) {
        throw new Error(prError.message || 'Failed to create payment record');
      }

      paymentRecordIds.push(paymentRecord.id);

      fireWebhook('payment.created', agreement.operator_id, {
        agreement_id,
        payment_record_id: paymentRecord.id,
        billing_type: 'recurring',
        stripe_subscription_id: subscription.id,
      });
    }

    return jsonResponse({
      invoice_id: invoiceId,
      subscription_id: subscriptionId,
      payment_record_ids: paymentRecordIds,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return jsonResponse({ error: { code: 'SERVER_ERROR', message } }, 500);
  }
});
