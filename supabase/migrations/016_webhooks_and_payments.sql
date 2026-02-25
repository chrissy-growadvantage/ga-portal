-- Luma -- Proposals: webhooks, payments, and Stripe integration
-- Migration 016: Create webhook_endpoints, webhook_deliveries, payment_records tables

-- ============================================
-- 1. Tables
-- ============================================

-- Webhook Endpoints
CREATE TABLE webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES operators(user_id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_webhook_endpoints_operator ON webhook_endpoints(operator_id);

-- Webhook Deliveries
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INT,
  response_body TEXT,
  delivered_at TIMESTAMPTZ,
  attempts INT NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_webhook_deliveries_endpoint_created ON webhook_deliveries(webhook_endpoint_id, created_at);

-- Payment Records
CREATE TABLE payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID REFERENCES agreements(id),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  operator_id UUID NOT NULL REFERENCES operators(user_id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_invoice_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'usd',
  payment_status payment_status NOT NULL DEFAULT 'pending',
  billing_type billing_type NOT NULL,
  period_start DATE,
  period_end DATE,
  paid_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_records_agreement ON payment_records(agreement_id);
CREATE INDEX idx_payment_records_client_status ON payment_records(client_id, payment_status);
CREATE INDEX idx_payment_records_stripe_pi ON payment_records(stripe_payment_intent_id);

-- ============================================
-- 2. Add Stripe columns to operators
-- ============================================

ALTER TABLE operators
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN NOT NULL DEFAULT false;

-- ============================================
-- 3. Row Level Security
-- ============================================

ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_endpoints_select" ON webhook_endpoints FOR SELECT
  USING (operator_id = auth.uid());

CREATE POLICY "webhook_endpoints_insert" ON webhook_endpoints FOR INSERT
  WITH CHECK (operator_id = auth.uid());

CREATE POLICY "webhook_endpoints_update" ON webhook_endpoints FOR UPDATE
  USING (operator_id = auth.uid());

CREATE POLICY "webhook_endpoints_delete" ON webhook_endpoints FOR DELETE
  USING (operator_id = auth.uid());

ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_deliveries_select" ON webhook_deliveries FOR SELECT
  USING (webhook_endpoint_id IN (
    SELECT id FROM webhook_endpoints WHERE operator_id = auth.uid()
  ));

CREATE POLICY "webhook_deliveries_insert" ON webhook_deliveries FOR INSERT
  WITH CHECK (webhook_endpoint_id IN (
    SELECT id FROM webhook_endpoints WHERE operator_id = auth.uid()
  ));

ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_records_select" ON payment_records FOR SELECT
  USING (operator_id = auth.uid());

CREATE POLICY "payment_records_insert" ON payment_records FOR INSERT
  WITH CHECK (operator_id = auth.uid());

CREATE POLICY "payment_records_update" ON payment_records FOR UPDATE
  USING (operator_id = auth.uid());

CREATE POLICY "payment_records_delete" ON payment_records FOR DELETE
  USING (operator_id = auth.uid());

-- ============================================
-- 4. Triggers
-- ============================================

CREATE TRIGGER set_updated_at BEFORE UPDATE ON webhook_endpoints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON payment_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
