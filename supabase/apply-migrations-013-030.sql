-- =============================================================
-- Luma: Complete Migration Script (002 prerequisites + 013–030)
-- Paste this entire script into the Supabase SQL Editor and run.
-- Fully idempotent — safe to run multiple times.
-- =============================================================

BEGIN;

-- =============================================
-- PREREQUISITES FROM MIGRATION 002
-- (audit infrastructure not yet applied)
-- =============================================

-- audit_action enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_action') THEN
    CREATE TYPE audit_action AS ENUM (
      'create', 'update', 'delete', 'approve', 'revision_requested',
      'magic_link_generated', 'magic_link_regenerated', 'scope_exceeded'
    );
  END IF;
END $$;

-- Indexes on core tables (safe with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_delivery_client_completed    ON delivery_items(client_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_scope_alloc_client_period    ON scope_allocations(client_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_scope_req_client_status      ON scope_requests(client_id, status);

-- Unique constraint on scope_allocations (skip if already exists)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'scope_allocations' AND constraint_name = 'unique_client_period'
  ) THEN
    ALTER TABLE scope_allocations ADD CONSTRAINT unique_client_period UNIQUE (client_id, period_start, period_end);
  END IF;
END $$;

-- audit_log table
CREATE TABLE IF NOT EXISTS audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type  TEXT NOT NULL CHECK (actor_type IN ('operator', 'client', 'system')),
  actor_id    TEXT,
  action      audit_action NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   UUID NOT NULL,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity  ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor   ON audit_log(actor_type, actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_log' AND policyname = 'audit_log_select') THEN
    CREATE POLICY "audit_log_select" ON audit_log FOR SELECT
      USING (
        (entity_type = 'client' AND entity_id IN (SELECT id FROM clients WHERE operator_id = auth.uid()))
        OR (entity_type = 'delivery_item' AND entity_id IN (
              SELECT id FROM delivery_items WHERE client_id IN (SELECT id FROM clients WHERE operator_id = auth.uid())))
        OR (entity_type = 'scope_allocation' AND entity_id IN (
              SELECT id FROM scope_allocations WHERE client_id IN (SELECT id FROM clients WHERE operator_id = auth.uid())))
        OR (entity_type = 'scope_request' AND entity_id IN (
              SELECT id FROM scope_requests WHERE client_id IN (SELECT id FROM clients WHERE operator_id = auth.uid())))
        OR (entity_type IN ('proposal', 'agreement'))
      );
  END IF;
END $$;

-- write_audit_log helper function
CREATE OR REPLACE FUNCTION write_audit_log(
  p_actor_type  TEXT,
  p_actor_id    TEXT,
  p_action      audit_action,
  p_entity_type TEXT,
  p_entity_id   UUID,
  p_metadata    JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO audit_log (actor_type, actor_id, action, entity_type, entity_id, metadata)
  VALUES (p_actor_type, p_actor_id, p_action, p_entity_type, p_entity_id, p_metadata)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Audit trigger functions for core tables
CREATE OR REPLACE FUNCTION audit_delivery_item_changes()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM write_audit_log('operator', auth.uid()::TEXT, 'create', 'delivery_item', NEW.id,
      jsonb_build_object('title', NEW.title, 'status', NEW.status::TEXT));
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM write_audit_log('operator', auth.uid()::TEXT, 'update', 'delivery_item', NEW.id,
      jsonb_build_object('title', NEW.title, 'old_status', OLD.status::TEXT, 'new_status', NEW.status::TEXT));
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM write_audit_log('operator', auth.uid()::TEXT, 'delete', 'delivery_item', OLD.id,
      jsonb_build_object('title', OLD.title));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'audit_delivery_items' AND event_object_table = 'delivery_items') THEN
    CREATE TRIGGER audit_delivery_items
      AFTER INSERT OR UPDATE OR DELETE ON delivery_items
      FOR EACH ROW EXECUTE FUNCTION audit_delivery_item_changes();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION audit_client_approval()
RETURNS trigger AS $$
BEGIN
  PERFORM write_audit_log('client', NULL, NEW.action::TEXT::audit_action, 'client_approval', NEW.id,
    jsonb_build_object('delivery_item_id', NEW.delivery_item_id, 'note', NEW.note));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'audit_client_approvals' AND event_object_table = 'client_approvals') THEN
    CREATE TRIGGER audit_client_approvals
      AFTER INSERT ON client_approvals
      FOR EACH ROW EXECUTE FUNCTION audit_client_approval();
  END IF;
END $$;


-- =============================================
-- PREREQUISITE FROM MIGRATION 011
-- Rename magic_link_token → magic_link_token_hash
-- =============================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'magic_link_token_hash'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'clients' AND column_name = 'magic_link_token'
    ) THEN
      ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_magic_link_token_key;
      DROP INDEX IF EXISTS idx_clients_magic_token;
      ALTER TABLE clients RENAME COLUMN magic_link_token TO magic_link_token_hash;
      ALTER TABLE clients ADD CONSTRAINT clients_magic_link_token_hash_key UNIQUE (magic_link_token_hash);
      CREATE INDEX idx_clients_magic_token_hash ON clients(magic_link_token_hash);
    END IF;
  END IF;
END $$;


-- =============================================
-- MIGRATION 013: Proposals core schema
-- =============================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'proposal_status') THEN
    CREATE TYPE proposal_status AS ENUM ('draft', 'sent', 'viewed', 'accepted', 'declined', 'expired');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_type') THEN
    CREATE TYPE billing_type AS ENUM ('one_time', 'recurring');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled', 'refunded');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS addon_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id   UUID NOT NULL REFERENCES operators(user_id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  default_price NUMERIC NOT NULL CHECK (default_price >= 0),
  billing_type  billing_type NOT NULL DEFAULT 'one_time',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_addon_templates_operator ON addon_templates(operator_id);

CREATE TABLE IF NOT EXISTS proposals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id         UUID NOT NULL REFERENCES operators(user_id) ON DELETE CASCADE,
  client_id           UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  summary             TEXT,
  notes               TEXT,
  status              proposal_status NOT NULL DEFAULT 'draft',
  version             INT NOT NULL DEFAULT 1,
  parent_proposal_id  UUID REFERENCES proposals(id) ON DELETE SET NULL,
  valid_days          INT,
  expires_at          TIMESTAMPTZ,
  sent_at             TIMESTAMPTZ,
  viewed_at           TIMESTAMPTZ,
  token_hash          TEXT UNIQUE,
  token_expires_at    TIMESTAMPTZ,
  accepted_at         TIMESTAMPTZ,
  declined_at         TIMESTAMPTZ,
  decline_reason      TEXT,
  summary_json        JSONB,
  content_version     INTEGER DEFAULT 1,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_proposals_client_status   ON proposals(client_id, status);
CREATE INDEX IF NOT EXISTS idx_proposals_operator_status ON proposals(operator_id, status);
CREATE INDEX IF NOT EXISTS idx_proposals_token_hash      ON proposals(token_hash);

ALTER TABLE addon_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals       ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'addon_templates' AND policyname = 'addon_templates_select') THEN
    CREATE POLICY "addon_templates_select" ON addon_templates FOR SELECT USING (operator_id = auth.uid());
    CREATE POLICY "addon_templates_insert" ON addon_templates FOR INSERT WITH CHECK (operator_id = auth.uid());
    CREATE POLICY "addon_templates_update" ON addon_templates FOR UPDATE USING (operator_id = auth.uid());
    CREATE POLICY "addon_templates_delete" ON addon_templates FOR DELETE USING (operator_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'proposals' AND policyname = 'proposals_select') THEN
    CREATE POLICY "proposals_select" ON proposals FOR SELECT USING (operator_id = auth.uid());
    CREATE POLICY "proposals_insert" ON proposals FOR INSERT WITH CHECK (operator_id = auth.uid());
    CREATE POLICY "proposals_update" ON proposals FOR UPDATE USING (operator_id = auth.uid());
    CREATE POLICY "proposals_delete" ON proposals FOR DELETE USING (operator_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'set_updated_at' AND event_object_table = 'addon_templates') THEN
    CREATE TRIGGER set_updated_at BEFORE UPDATE ON addon_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'set_updated_at' AND event_object_table = 'proposals') THEN
    CREATE TRIGGER set_updated_at BEFORE UPDATE ON proposals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- Update audit_log entity_type constraint to include proposals/agreements
ALTER TABLE audit_log DROP CONSTRAINT IF EXISTS audit_log_entity_type_check;

CREATE OR REPLACE FUNCTION audit_proposal_changes()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM write_audit_log('operator', auth.uid()::TEXT, 'create', 'proposal', NEW.id,
      jsonb_build_object('title', NEW.title, 'status', NEW.status::TEXT));
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM write_audit_log('operator', auth.uid()::TEXT, 'update', 'proposal', NEW.id,
      jsonb_build_object('title', NEW.title, 'old_status', OLD.status::TEXT, 'new_status', NEW.status::TEXT));
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM write_audit_log('operator', auth.uid()::TEXT, 'delete', 'proposal', OLD.id,
      jsonb_build_object('title', OLD.title));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'audit_proposals' AND event_object_table = 'proposals') THEN
    CREATE TRIGGER audit_proposals AFTER INSERT OR UPDATE OR DELETE ON proposals FOR EACH ROW EXECUTE FUNCTION audit_proposal_changes();
  END IF;
END $$;


-- =============================================
-- MIGRATION 014: Line items & addons
-- =============================================

CREATE TABLE IF NOT EXISTS proposal_line_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id      UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  description      TEXT,
  description_json JSONB,
  quantity         NUMERIC NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  unit_price       NUMERIC NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  billing_type     billing_type NOT NULL DEFAULT 'one_time',
  sort_order       INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_proposal_line_items_proposal_sort ON proposal_line_items(proposal_id, sort_order);

CREATE TABLE IF NOT EXISTS proposal_addons (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id       UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  addon_template_id UUID REFERENCES addon_templates(id) ON DELETE SET NULL,
  name              TEXT NOT NULL,
  description       TEXT,
  description_json  JSONB,
  price             NUMERIC NOT NULL DEFAULT 0 CHECK (price >= 0),
  billing_type      billing_type NOT NULL DEFAULT 'one_time',
  is_included       BOOLEAN NOT NULL DEFAULT true,
  is_selected       BOOLEAN NOT NULL DEFAULT false,
  sort_order        INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_proposal_addons_proposal_sort ON proposal_addons(proposal_id, sort_order);

ALTER TABLE proposal_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_addons     ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'proposal_line_items' AND policyname = 'proposal_line_items_select') THEN
    CREATE POLICY "proposal_line_items_select" ON proposal_line_items FOR SELECT
      USING (proposal_id IN (SELECT id FROM proposals WHERE operator_id = auth.uid()));
    CREATE POLICY "proposal_line_items_insert" ON proposal_line_items FOR INSERT
      WITH CHECK (proposal_id IN (SELECT id FROM proposals WHERE operator_id = auth.uid()));
    CREATE POLICY "proposal_line_items_update" ON proposal_line_items FOR UPDATE
      USING (proposal_id IN (SELECT id FROM proposals WHERE operator_id = auth.uid()));
    CREATE POLICY "proposal_line_items_delete" ON proposal_line_items FOR DELETE
      USING (proposal_id IN (SELECT id FROM proposals WHERE operator_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'proposal_addons' AND policyname = 'proposal_addons_select') THEN
    CREATE POLICY "proposal_addons_select" ON proposal_addons FOR SELECT
      USING (proposal_id IN (SELECT id FROM proposals WHERE operator_id = auth.uid()));
    CREATE POLICY "proposal_addons_insert" ON proposal_addons FOR INSERT
      WITH CHECK (proposal_id IN (SELECT id FROM proposals WHERE operator_id = auth.uid()));
    CREATE POLICY "proposal_addons_update" ON proposal_addons FOR UPDATE
      USING (proposal_id IN (SELECT id FROM proposals WHERE operator_id = auth.uid()));
    CREATE POLICY "proposal_addons_delete" ON proposal_addons FOR DELETE
      USING (proposal_id IN (SELECT id FROM proposals WHERE operator_id = auth.uid()));
  END IF;
END $$;


-- =============================================
-- MIGRATION 015: Agreements
-- =============================================

CREATE TABLE IF NOT EXISTS agreements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id    UUID NOT NULL UNIQUE REFERENCES proposals(id) ON DELETE RESTRICT,
  client_id      UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  operator_id    UUID NOT NULL REFERENCES operators(user_id) ON DELETE CASCADE,
  snapshot       JSONB NOT NULL,
  snapshot_hash  TEXT,
  signer_name    TEXT NOT NULL,
  signer_email   TEXT,
  signature_data JSONB NOT NULL,
  signed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  billing_status TEXT NOT NULL DEFAULT 'pending_billing'
                 CHECK (billing_status IN ('pending_billing','billing_active','billing_failed','not_applicable')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_agreements_client   ON agreements(client_id);
CREATE INDEX IF NOT EXISTS idx_agreements_operator ON agreements(operator_id);

ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agreements' AND policyname = 'agreements_select') THEN
    CREATE POLICY "agreements_select" ON agreements FOR SELECT USING (operator_id = auth.uid());
    CREATE POLICY "agreements_insert" ON agreements FOR INSERT WITH CHECK (operator_id = auth.uid());
  END IF;
END $$;

CREATE OR REPLACE FUNCTION audit_agreement_changes()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM write_audit_log('client', NEW.signer_name, 'create', 'agreement', NEW.id,
      jsonb_build_object('proposal_id', NEW.proposal_id, 'signer_name', NEW.signer_name, 'signed_at', NEW.signed_at::TEXT));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'audit_agreements' AND event_object_table = 'agreements') THEN
    CREATE TRIGGER audit_agreements AFTER INSERT ON agreements FOR EACH ROW EXECUTE FUNCTION audit_agreement_changes();
  END IF;
END $$;


-- =============================================
-- MIGRATION 016: Webhooks & payments
-- =============================================

CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES operators(user_id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  secret      TEXT NOT NULL,
  events      TEXT[] NOT NULL DEFAULT '{}',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_operator ON webhook_endpoints(operator_id);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  event_type          TEXT NOT NULL,
  payload             JSONB NOT NULL,
  response_status     INT,
  response_body       TEXT,
  delivered_at        TIMESTAMPTZ,
  attempts            INT NOT NULL DEFAULT 0,
  next_retry_at       TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_endpoint_created ON webhook_deliveries(webhook_endpoint_id, created_at);

CREATE TABLE IF NOT EXISTS payment_records (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id             UUID NOT NULL REFERENCES agreements(id) ON DELETE RESTRICT,
  client_id                UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  operator_id              UUID NOT NULL REFERENCES operators(user_id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_invoice_id        TEXT UNIQUE,
  stripe_subscription_id   TEXT,
  amount                   NUMERIC NOT NULL CHECK (amount >= 0),
  currency                 TEXT NOT NULL DEFAULT 'usd',
  payment_status           payment_status NOT NULL DEFAULT 'pending',
  billing_type             billing_type NOT NULL,
  period_start             DATE,
  period_end               DATE,
  paid_at                  TIMESTAMPTZ,
  metadata                 JSONB DEFAULT '{}',
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payment_records_agreement     ON payment_records(agreement_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_client_status ON payment_records(client_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_records_stripe_pi     ON payment_records(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_operator_paid ON payment_records(operator_id, paid_at);

ALTER TABLE operators
  ADD COLUMN IF NOT EXISTS stripe_account_id          TEXT,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_disconnected_at     TIMESTAMPTZ;

ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records    ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'webhook_endpoints' AND policyname = 'webhook_endpoints_select') THEN
    CREATE POLICY "webhook_endpoints_select" ON webhook_endpoints FOR SELECT USING (operator_id = auth.uid());
    CREATE POLICY "webhook_endpoints_insert" ON webhook_endpoints FOR INSERT WITH CHECK (operator_id = auth.uid());
    CREATE POLICY "webhook_endpoints_update" ON webhook_endpoints FOR UPDATE USING (operator_id = auth.uid());
    CREATE POLICY "webhook_endpoints_delete" ON webhook_endpoints FOR DELETE USING (operator_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'webhook_deliveries' AND policyname = 'webhook_deliveries_select') THEN
    CREATE POLICY "webhook_deliveries_select" ON webhook_deliveries FOR SELECT
      USING (webhook_endpoint_id IN (SELECT id FROM webhook_endpoints WHERE operator_id = auth.uid()));
    CREATE POLICY "webhook_deliveries_insert" ON webhook_deliveries FOR INSERT
      WITH CHECK (webhook_endpoint_id IN (SELECT id FROM webhook_endpoints WHERE operator_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_records' AND policyname = 'payment_records_select') THEN
    CREATE POLICY "payment_records_select" ON payment_records FOR SELECT USING (operator_id = auth.uid());
    CREATE POLICY "payment_records_insert" ON payment_records FOR INSERT WITH CHECK (operator_id = auth.uid());
    CREATE POLICY "payment_records_update" ON payment_records FOR UPDATE USING (operator_id = auth.uid());
    CREATE POLICY "payment_records_delete" ON payment_records FOR DELETE USING (operator_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'set_updated_at' AND event_object_table = 'webhook_endpoints') THEN
    CREATE TRIGGER set_updated_at BEFORE UPDATE ON webhook_endpoints FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'set_updated_at' AND event_object_table = 'payment_records') THEN
    CREATE TRIGGER set_updated_at BEFORE UPDATE ON payment_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;


-- =============================================
-- MIGRATION 017: Security hardening
-- =============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION prevent_sent_proposal_edit()
RETURNS trigger AS $$
BEGIN
  IF OLD.status != 'draft' THEN
    IF NEW.title IS DISTINCT FROM OLD.title OR NEW.summary IS DISTINCT FROM OLD.summary
       OR NEW.notes IS DISTINCT FROM OLD.notes OR NEW.valid_days IS DISTINCT FROM OLD.valid_days THEN
      RAISE EXCEPTION 'Cannot modify proposal content after it has been sent.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'lock_sent_proposal_content' AND event_object_table = 'proposals') THEN
    CREATE TRIGGER lock_sent_proposal_content BEFORE UPDATE ON proposals FOR EACH ROW EXECUTE FUNCTION prevent_sent_proposal_edit();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION prevent_addon_edit_after_signing()
RETURNS trigger AS $$
DECLARE v_status proposal_status;
BEGIN
  SELECT status INTO v_status FROM proposals WHERE id = NEW.proposal_id;
  IF v_status IN ('accepted', 'declined', 'expired') THEN
    RAISE EXCEPTION 'Cannot modify addons on a % proposal.', v_status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'lock_signed_proposal_addons' AND event_object_table = 'proposal_addons') THEN
    CREATE TRIGGER lock_signed_proposal_addons BEFORE UPDATE ON proposal_addons FOR EACH ROW EXECUTE FUNCTION prevent_addon_edit_after_signing();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION prevent_line_item_edit_after_sending()
RETURNS trigger AS $$
DECLARE v_status proposal_status;
BEGIN
  SELECT status INTO v_status FROM proposals WHERE id = COALESCE(NEW.proposal_id, OLD.proposal_id);
  IF v_status != 'draft' THEN
    RAISE EXCEPTION 'Cannot modify line items on a % proposal.', v_status;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'lock_sent_proposal_line_items' AND event_object_table = 'proposal_line_items') THEN
    CREATE TRIGGER lock_sent_proposal_line_items BEFORE INSERT OR UPDATE OR DELETE ON proposal_line_items FOR EACH ROW EXECUTE FUNCTION prevent_line_item_edit_after_sending();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION prevent_agreement_modification()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.proposal_id IS DISTINCT FROM OLD.proposal_id OR NEW.client_id IS DISTINCT FROM OLD.client_id
       OR NEW.snapshot IS DISTINCT FROM OLD.snapshot OR NEW.signer_name IS DISTINCT FROM OLD.signer_name
       OR NEW.signature_data IS DISTINCT FROM OLD.signature_data OR NEW.signed_at IS DISTINCT FROM OLD.signed_at THEN
      RAISE EXCEPTION 'Agreements are immutable.';
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Agreements cannot be deleted.';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'enforce_agreement_immutability' AND event_object_table = 'agreements') THEN
    CREATE TRIGGER enforce_agreement_immutability BEFORE UPDATE OR DELETE ON agreements FOR EACH ROW EXECUTE FUNCTION prevent_agreement_modification();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION create_agreement(
  p_proposal_id    UUID,
  p_token_hash     TEXT,
  p_signer_name    TEXT,
  p_signer_email   TEXT,
  p_signature_data JSONB
)
RETURNS agreements AS $$
DECLARE
  v_proposal      proposals;
  v_agreement     agreements;
  v_snapshot      JSONB;
  v_line_items    JSONB;
  v_addons        JSONB;
  v_snapshot_hash TEXT;
BEGIN
  SELECT * INTO v_proposal FROM proposals WHERE id = p_proposal_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Proposal not found: %', p_proposal_id; END IF;
  IF v_proposal.token_hash IS NULL OR v_proposal.token_hash != p_token_hash THEN
    RAISE EXCEPTION 'Invalid token for proposal: %', p_proposal_id;
  END IF;
  IF v_proposal.token_expires_at IS NOT NULL AND v_proposal.token_expires_at < now() THEN
    RAISE EXCEPTION 'Proposal token has expired';
  END IF;
  IF v_proposal.expires_at IS NOT NULL AND v_proposal.expires_at < (now() - interval '15 minutes') THEN
    RAISE EXCEPTION 'Proposal has expired';
  END IF;
  IF v_proposal.status NOT IN ('sent', 'viewed') THEN
    RAISE EXCEPTION 'Proposal % is not in a signable state (%)', p_proposal_id, v_proposal.status;
  END IF;
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', li.id, 'name', li.name, 'quantity', li.quantity,
    'unit_price', li.unit_price, 'billing_type', li.billing_type::TEXT, 'sort_order', li.sort_order
  ) ORDER BY li.sort_order), '[]'::JSONB) INTO v_line_items
  FROM proposal_line_items li WHERE li.proposal_id = p_proposal_id;
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', pa.id, 'name', pa.name, 'price', pa.price, 'billing_type', pa.billing_type::TEXT,
    'is_included', pa.is_included, 'is_selected', pa.is_selected, 'sort_order', pa.sort_order
  ) ORDER BY pa.sort_order), '[]'::JSONB) INTO v_addons
  FROM proposal_addons pa WHERE pa.proposal_id = p_proposal_id;
  v_snapshot := jsonb_build_object(
    'proposal_id', v_proposal.id, 'title', v_proposal.title,
    'summary', v_proposal.summary, 'version', v_proposal.version,
    'line_items', v_line_items, 'addons', v_addons, 'snapshot_at', now()::TEXT
  );
  v_snapshot_hash := encode(digest(v_snapshot::TEXT, 'sha256'), 'hex');
  INSERT INTO agreements (proposal_id, client_id, operator_id, snapshot, snapshot_hash, signer_name, signer_email, signature_data)
  VALUES (p_proposal_id, v_proposal.client_id, v_proposal.operator_id, v_snapshot, v_snapshot_hash, p_signer_name, p_signer_email, p_signature_data)
  RETURNING * INTO v_agreement;
  UPDATE proposals SET status = 'accepted', accepted_at = now() WHERE id = p_proposal_id;
  RETURN v_agreement;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =============================================
-- MIGRATION 020a: Proposal content blocks
-- =============================================

CREATE TABLE IF NOT EXISTS proposal_content_blocks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id  UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('rich_text', 'image_gallery', 'video_embed')),
  position     INTEGER NOT NULL,
  content_json JSONB NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_content_blocks_proposal ON proposal_content_blocks(proposal_id, position);
ALTER TABLE proposal_content_blocks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'proposal_content_blocks' AND policyname = 'Operators can view their proposal blocks') THEN
    CREATE POLICY "Operators can view their proposal blocks" ON proposal_content_blocks FOR SELECT TO authenticated
      USING (proposal_id IN (SELECT id FROM proposals WHERE operator_id = auth.uid()));
    CREATE POLICY "Operators can insert blocks" ON proposal_content_blocks FOR INSERT TO authenticated
      WITH CHECK (proposal_id IN (SELECT id FROM proposals WHERE operator_id = auth.uid()));
    CREATE POLICY "Operators can update blocks" ON proposal_content_blocks FOR UPDATE TO authenticated
      USING (proposal_id IN (SELECT id FROM proposals WHERE operator_id = auth.uid()));
    CREATE POLICY "Operators can delete blocks" ON proposal_content_blocks FOR DELETE TO authenticated
      USING (proposal_id IN (SELECT id FROM proposals WHERE operator_id = auth.uid()));
  END IF;
END $$;


-- =============================================
-- MIGRATION 020b: Proposal templates
-- =============================================

CREATE TABLE IF NOT EXISTS proposal_templates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id  UUID REFERENCES operators(user_id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  content_json JSONB NOT NULL,
  category     TEXT,
  is_system    BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE proposal_templates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'proposal_templates' AND policyname = 'Operators can view their templates') THEN
    CREATE POLICY "Operators can view their templates" ON proposal_templates FOR SELECT TO authenticated
      USING (operator_id = auth.uid() OR is_system = true);
    CREATE POLICY "Operators can insert templates" ON proposal_templates FOR INSERT TO authenticated
      WITH CHECK (operator_id = auth.uid());
    CREATE POLICY "Operators can update templates" ON proposal_templates FOR UPDATE TO authenticated
      USING (operator_id = auth.uid());
    CREATE POLICY "Operators can delete templates" ON proposal_templates FOR DELETE TO authenticated
      USING (operator_id = auth.uid());
  END IF;
END $$;

INSERT INTO proposal_templates (operator_id, name, description, content_json, category, is_system)
SELECT NULL, 'Project Introduction', 'Standard project intro template',
  '{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Project Overview"}]},{"type":"paragraph","content":[{"type":"text","text":"[Describe the project scope and objectives here]"}]}]}'::jsonb,
  'intro', true
WHERE NOT EXISTS (SELECT 1 FROM proposal_templates WHERE is_system = true AND name = 'Project Introduction');

INSERT INTO proposal_templates (operator_id, name, description, content_json, category, is_system)
SELECT NULL, 'Scope of Work', 'Standard scope template',
  '{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Scope of Work"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Deliverable 1"}]}]}]}]}'::jsonb,
  'deliverables', true
WHERE NOT EXISTS (SELECT 1 FROM proposal_templates WHERE is_system = true AND name = 'Scope of Work');

INSERT INTO proposal_templates (operator_id, name, description, content_json, category, is_system)
SELECT NULL, 'Terms & Conditions', 'Standard T&C template',
  '{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Terms & Conditions"}]},{"type":"orderedList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Payment terms: 50% upfront, 50% on completion"}]}]}]}]}'::jsonb,
  'terms', true
WHERE NOT EXISTS (SELECT 1 FROM proposal_templates WHERE is_system = true AND name = 'Terms & Conditions');


-- =============================================
-- MIGRATION 021: Portal extensions + monthly snapshots
-- =============================================

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS integrator_name           text,
  ADD COLUMN IF NOT EXISTS primary_comms_channel     text,
  ADD COLUMN IF NOT EXISTS next_strategy_meeting     text,
  ADD COLUMN IF NOT EXISTS this_month_outcomes       text,
  ADD COLUMN IF NOT EXISTS this_month_deliverables   text,
  ADD COLUMN IF NOT EXISTS this_month_improvements   text,
  ADD COLUMN IF NOT EXISTS this_month_risks          text,
  ADD COLUMN IF NOT EXISTS this_month_focus          text,
  ADD COLUMN IF NOT EXISTS portal_slack_url          text,
  ADD COLUMN IF NOT EXISTS portal_drive_url          text,
  ADD COLUMN IF NOT EXISTS portal_booking_url        text,
  ADD COLUMN IF NOT EXISTS hours_used_this_month     numeric(8,2),
  ADD COLUMN IF NOT EXISTS next_meeting_at           timestamptz,
  ADD COLUMN IF NOT EXISTS next_meeting_link         text;

CREATE TABLE IF NOT EXISTS monthly_snapshots (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id              uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  operator_id            uuid NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  month_label            text NOT NULL,
  month_slug             text NOT NULL,
  meeting_date           text,
  attendees              text,
  wins                   text,
  deliverables_completed text,
  slipped                text,
  insights               text,
  upcoming_priorities    jsonb DEFAULT '[]'::jsonb,
  key_deadlines          text,
  risks_constraints      text,
  process_improvements   jsonb DEFAULT '[]'::jsonb,
  adhoc_requests         jsonb DEFAULT '[]'::jsonb,
  primary_comms          text,
  recurring_meetings     jsonb DEFAULT '[]'::jsonb,
  response_times         text,
  working_well           text,
  unclear_messy          text,
  more_visibility        text,
  priorities_score       smallint CHECK (priorities_score BETWEEN 0 AND 10),
  delivery_score         smallint CHECK (delivery_score BETWEEN 0 AND 10),
  communication_score    smallint CHECK (communication_score BETWEEN 0 AND 10),
  capacity_score         smallint CHECK (capacity_score BETWEEN 0 AND 10),
  decisions_actions      jsonb DEFAULT '[]'::jsonb,
  blockers               text,
  time_saved             text,
  friction_removed       text,
  systems_implemented    text,
  agreement_snapshot     jsonb DEFAULT '[]'::jsonb,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, month_slug)
);

ALTER TABLE monthly_snapshots ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'monthly_snapshots' AND policyname = 'operators_manage_snapshots') THEN
    CREATE POLICY "operators_manage_snapshots" ON monthly_snapshots FOR ALL
      USING (operator_id = auth.uid()) WITH CHECK (operator_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'monthly_snapshots' AND policyname = 'service_role_snapshots') THEN
    CREATE POLICY "service_role_snapshots" ON monthly_snapshots FOR ALL TO service_role
      USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION update_monthly_snapshots_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trg_monthly_snapshots_updated_at' AND event_object_table = 'monthly_snapshots') THEN
    CREATE TRIGGER trg_monthly_snapshots_updated_at BEFORE UPDATE ON monthly_snapshots FOR EACH ROW EXECUTE FUNCTION update_monthly_snapshots_updated_at();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_monthly_snapshots_client_month ON monthly_snapshots(client_id, month_slug DESC);


-- =============================================
-- MIGRATION 022: GA4 connections
-- =============================================

CREATE TABLE IF NOT EXISTS client_ga4_connections (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  operator_id   uuid NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  property_id   text NOT NULL,
  property_name text,
  refresh_token text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, property_id)
);

ALTER TABLE client_ga4_connections ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_ga4_connections' AND policyname = 'operators_manage_ga4_connections') THEN
    CREATE POLICY "operators_manage_ga4_connections" ON client_ga4_connections FOR ALL
      USING (operator_id = auth.uid()) WITH CHECK (operator_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_ga4_connections' AND policyname = 'service_role_ga4_connections') THEN
    CREATE POLICY "service_role_ga4_connections" ON client_ga4_connections FOR ALL TO service_role
      USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION update_ga4_connections_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trg_ga4_connections_updated_at' AND event_object_table = 'client_ga4_connections') THEN
    CREATE TRIGGER trg_ga4_connections_updated_at BEFORE UPDATE ON client_ga4_connections FOR EACH ROW EXECUTE FUNCTION update_ga4_connections_updated_at();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ga4_connections_client   ON client_ga4_connections(client_id);
CREATE INDEX IF NOT EXISTS idx_ga4_connections_operator ON client_ga4_connections(operator_id);

-- Migration 023 intentionally skipped (monthly_snapshots already created above)


-- =============================================
-- MIGRATION 024: Client notes
-- =============================================

CREATE TABLE IF NOT EXISTS client_notes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  operator_id uuid NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  body        text NOT NULL CHECK (char_length(body) > 0),
  type        text NOT NULL DEFAULT 'note' CHECK (type IN ('note','request','todo','idea')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_notes' AND policyname = 'operators_manage_own_notes') THEN
    CREATE POLICY "operators_manage_own_notes" ON client_notes FOR ALL
      USING (operator_id = auth.uid()) WITH CHECK (operator_id = auth.uid());
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_client_notes_client   ON client_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_client_notes_operator ON client_notes(operator_id);


-- =============================================
-- MIGRATION 025: Scope requests extension
-- =============================================

ALTER TABLE scope_requests ADD COLUMN IF NOT EXISTS category       text;
ALTER TABLE scope_requests ADD COLUMN IF NOT EXISTS attachment_url text;
ALTER TABLE scope_requests ADD COLUMN IF NOT EXISTS admin_note     text;
ALTER TABLE scope_requests ADD COLUMN IF NOT EXISTS ga_status      text
  CHECK (ga_status IN ('submitted','received','in_progress','waiting_on_client','done'));

ALTER TABLE clients ADD COLUMN IF NOT EXISTS portal_stripe_url text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS portal_intake_url text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS onboarding_stage  integer DEFAULT 0;


-- =============================================
-- MIGRATION 026: Onboarding stages
-- =============================================

CREATE TABLE IF NOT EXISTS onboarding_stages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  operator_id  uuid NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  stage_key    text NOT NULL,
  stage_label  text NOT NULL,
  sort_order   integer NOT NULL,
  status       text NOT NULL DEFAULT 'not_started'
               CHECK (status IN ('not_started','in_progress','waiting_on_client','blocked','done')),
  owner_label  text NOT NULL DEFAULT 'operator' CHECK (owner_label IN ('operator','client')),
  due_date     date,
  notes        text,
  action_url   text,
  completed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, stage_key)
);

ALTER TABLE onboarding_stages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'onboarding_stages' AND policyname = 'Operators manage onboarding stages') THEN
    CREATE POLICY "Operators manage onboarding stages" ON onboarding_stages FOR ALL
      USING (operator_id = auth.uid()) WITH CHECK (operator_id = auth.uid());
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_onboarding_stages_client ON onboarding_stages(client_id, sort_order);


-- =============================================
-- MIGRATION 027: Client tasks
-- =============================================

CREATE TABLE IF NOT EXISTS client_tasks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  operator_id  uuid NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  title        text NOT NULL,
  due_date     date,
  link_url     text,
  notes        text,
  completed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE client_tasks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_tasks' AND policyname = 'Operators manage client tasks') THEN
    CREATE POLICY "Operators manage client tasks" ON client_tasks FOR ALL
      USING (operator_id = auth.uid()) WITH CHECK (operator_id = auth.uid());
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_client_tasks_client ON client_tasks(client_id, created_at DESC);


-- =============================================
-- MIGRATION 028: Pick-list items
-- =============================================

CREATE TABLE IF NOT EXISTS pick_list_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id uuid NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  list_type   text NOT NULL CHECK (list_type IN ('phase','category','uplift','work_status')),
  label       text NOT NULL,
  colour      text,
  sort_order  integer NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pick_list_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pick_list_items' AND policyname = 'Operators manage pick lists') THEN
    CREATE POLICY "Operators manage pick lists" ON pick_list_items FOR ALL
      USING (operator_id = auth.uid()) WITH CHECK (operator_id = auth.uid());
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pick_list_items_operator ON pick_list_items(operator_id, list_type, sort_order);

ALTER TABLE delivery_items ADD COLUMN IF NOT EXISTS phase  text;
ALTER TABLE delivery_items ADD COLUMN IF NOT EXISTS uplift text;


-- =============================================
-- MIGRATION 029: Operator portal branding
-- =============================================

ALTER TABLE operators ADD COLUMN IF NOT EXISTS portal_primary_color text;
ALTER TABLE operators ADD COLUMN IF NOT EXISTS portal_logo_url       text;
ALTER TABLE operators ADD COLUMN IF NOT EXISTS portal_accent_color   text;


-- =============================================
-- MIGRATION 030: Weekly digest settings
-- =============================================

ALTER TABLE operators
  ADD COLUMN IF NOT EXISTS digest_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS digest_day     text DEFAULT 'monday',
  ADD COLUMN IF NOT EXISTS digest_time    text DEFAULT '09:00';


COMMIT;
