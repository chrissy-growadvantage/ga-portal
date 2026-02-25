-- Luma -- Proposals: core schema for proposals and addon templates
-- Migration 013: Create enum types, addon_templates, and proposals tables

-- ============================================
-- 1. Enum Types
-- ============================================

CREATE TYPE proposal_status AS ENUM (
  'draft', 'sent', 'viewed', 'accepted', 'declined', 'expired'
);

CREATE TYPE billing_type AS ENUM (
  'one_time', 'recurring'
);

CREATE TYPE payment_status AS ENUM (
  'pending', 'paid', 'overdue', 'cancelled', 'refunded'
);

-- ============================================
-- 2. Tables
-- ============================================

-- Addon Templates (operator's reusable addon library)
CREATE TABLE addon_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES operators(user_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  default_price NUMERIC NOT NULL CHECK (default_price >= 0),
  billing_type billing_type NOT NULL DEFAULT 'one_time',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_addon_templates_operator ON addon_templates(operator_id);

-- Proposals
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES operators(user_id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  notes TEXT,
  status proposal_status NOT NULL DEFAULT 'draft',
  version INT NOT NULL DEFAULT 1,
  parent_proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
  valid_days INT,
  expires_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  token_hash TEXT UNIQUE,
  token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_proposals_client_status ON proposals(client_id, status);
CREATE INDEX idx_proposals_operator_status ON proposals(operator_id, status);
CREATE INDEX idx_proposals_token_hash ON proposals(token_hash);

-- ============================================
-- 3. Row Level Security
-- ============================================

ALTER TABLE addon_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "addon_templates_select" ON addon_templates FOR SELECT
  USING (operator_id = auth.uid());

CREATE POLICY "addon_templates_insert" ON addon_templates FOR INSERT
  WITH CHECK (operator_id = auth.uid());

CREATE POLICY "addon_templates_update" ON addon_templates FOR UPDATE
  USING (operator_id = auth.uid());

CREATE POLICY "addon_templates_delete" ON addon_templates FOR DELETE
  USING (operator_id = auth.uid());

ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proposals_select" ON proposals FOR SELECT
  USING (operator_id = auth.uid());

CREATE POLICY "proposals_insert" ON proposals FOR INSERT
  WITH CHECK (operator_id = auth.uid());

CREATE POLICY "proposals_update" ON proposals FOR UPDATE
  USING (operator_id = auth.uid());

CREATE POLICY "proposals_delete" ON proposals FOR DELETE
  USING (operator_id = auth.uid());

-- ============================================
-- 4. Triggers
-- ============================================

CREATE TRIGGER set_updated_at BEFORE UPDATE ON addon_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 5. Audit Triggers
-- ============================================

-- Extend entity_type CHECK constraint to include proposal types
ALTER TABLE audit_log DROP CONSTRAINT IF EXISTS audit_log_entity_type_check;
ALTER TABLE audit_log ADD CONSTRAINT audit_log_entity_type_check
  CHECK (entity_type IN (
    'client', 'delivery_item', 'scope_allocation', 'scope_request',
    'client_approval', 'proposal', 'agreement'
  ));

-- Audit trigger for proposals
CREATE OR REPLACE FUNCTION audit_proposal_changes()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM write_audit_log(
      'operator', auth.uid()::TEXT, 'create',
      'proposal', NEW.id,
      jsonb_build_object('title', NEW.title, 'status', NEW.status::TEXT)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM write_audit_log(
      'operator', auth.uid()::TEXT, 'update',
      'proposal', NEW.id,
      jsonb_build_object(
        'title', NEW.title,
        'old_status', OLD.status::TEXT,
        'new_status', NEW.status::TEXT
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM write_audit_log(
      'operator', auth.uid()::TEXT, 'delete',
      'proposal', OLD.id,
      jsonb_build_object('title', OLD.title)
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_proposals
  AFTER INSERT OR UPDATE OR DELETE ON proposals
  FOR EACH ROW EXECUTE FUNCTION audit_proposal_changes();
