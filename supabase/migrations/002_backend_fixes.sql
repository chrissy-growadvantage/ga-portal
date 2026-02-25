-- Luma — Backend Architecture Fixes
-- Migration 002: Indexes, constraints, token hashing, audit logging
-- Addresses critical and high-priority issues from architecture review

-- ============================================
-- 1. Missing Composite Indexes
-- ============================================

-- Composite index for querying delivery items by client within a date range
-- Used by: client portal, monthly summaries, delivery timeline
CREATE INDEX idx_delivery_client_completed
  ON delivery_items(client_id, completed_at);

-- Composite index for looking up scope allocations by client + period
-- Used by: scope tracker, period selection, overlap detection
CREATE INDEX idx_scope_alloc_client_period
  ON scope_allocations(client_id, period_start, period_end);

-- Composite index for filtering scope requests by client + status
-- Used by: pending requests list, scope request dashboard
CREATE INDEX idx_scope_req_client_status
  ON scope_requests(client_id, status);

-- ============================================
-- 2. Fix magic_link_token → magic_link_token_hash
-- ============================================
-- The spec mandates storing SHA-256 hashed tokens, not plaintext.
-- The column name should reflect that it stores a hash, not the raw token.

-- Drop the old unique index on magic_link_token (created implicitly by UNIQUE constraint)
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_magic_link_token_key;
DROP INDEX IF EXISTS idx_clients_magic_token;

-- Rename column to clarify it stores a hash
ALTER TABLE clients RENAME COLUMN magic_link_token TO magic_link_token_hash;

-- Re-add unique constraint and index on the hash column
ALTER TABLE clients ADD CONSTRAINT clients_magic_link_token_hash_key UNIQUE (magic_link_token_hash);
CREATE INDEX idx_clients_magic_token_hash ON clients(magic_link_token_hash);

-- ============================================
-- 3. Unique Constraint on Scope Allocations
-- ============================================
-- Prevent duplicate scope allocations for the same client + period.
-- One allocation per client per period enforces data integrity.

ALTER TABLE scope_allocations
  ADD CONSTRAINT unique_client_period
  UNIQUE (client_id, period_start, period_end);

-- ============================================
-- 4. Audit Log Table
-- ============================================
-- Lightweight audit trail for compliance and debugging.
-- Records who did what, when, and to which entity.

CREATE TYPE audit_action AS ENUM (
  'create',
  'update',
  'delete',
  'approve',
  'revision_requested',
  'magic_link_generated',
  'magic_link_regenerated',
  'scope_exceeded'
);

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Who performed the action
  actor_type TEXT NOT NULL CHECK (actor_type IN ('operator', 'client', 'system')),
  actor_id TEXT, -- operator UUID, magic_link_token_hash, or 'system'
  -- What happened
  action audit_action NOT NULL,
  -- What entity was affected
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'client', 'delivery_item', 'scope_allocation', 'scope_request', 'client_approval'
  )),
  entity_id UUID NOT NULL,
  -- Additional context
  metadata JSONB DEFAULT '{}',
  -- When
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common audit log queries
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_actor ON audit_log(actor_type, actor_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);

-- RLS: operators can only see audit entries for their own entities
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_select" ON audit_log FOR SELECT
  USING (
    -- Operator can see audit entries for their clients
    (entity_type = 'client' AND entity_id IN (
      SELECT id FROM clients WHERE operator_id = auth.uid()
    ))
    OR
    -- Operator can see audit entries for their delivery items
    (entity_type = 'delivery_item' AND entity_id IN (
      SELECT id FROM delivery_items WHERE client_id IN (
        SELECT id FROM clients WHERE operator_id = auth.uid()
      )
    ))
    OR
    -- Operator can see audit entries for their scope allocations
    (entity_type = 'scope_allocation' AND entity_id IN (
      SELECT id FROM scope_allocations WHERE client_id IN (
        SELECT id FROM clients WHERE operator_id = auth.uid()
      )
    ))
    OR
    -- Operator can see audit entries for their scope requests
    (entity_type = 'scope_request' AND entity_id IN (
      SELECT id FROM scope_requests WHERE client_id IN (
        SELECT id FROM clients WHERE operator_id = auth.uid()
      )
    ))
    OR
    -- Operator can see audit entries for their client approvals
    (entity_type = 'client_approval' AND entity_id IN (
      SELECT id FROM client_approvals WHERE delivery_item_id IN (
        SELECT id FROM delivery_items WHERE client_id IN (
          SELECT id FROM clients WHERE operator_id = auth.uid()
        )
      )
    ))
  );

-- No INSERT policy for operators — audit entries are written by triggers/functions with SECURITY DEFINER
-- No UPDATE/DELETE — audit log is append-only

-- ============================================
-- 5. Audit Log Helper Function
-- ============================================
-- SECURITY DEFINER function to write audit entries (bypasses RLS)

CREATE OR REPLACE FUNCTION write_audit_log(
  p_actor_type TEXT,
  p_actor_id TEXT,
  p_action audit_action,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO audit_log (actor_type, actor_id, action, entity_type, entity_id, metadata)
  VALUES (p_actor_type, p_actor_id, p_action, p_entity_type, p_entity_id, p_metadata)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. Audit Triggers for Core Tables
-- ============================================

-- Generic audit trigger for delivery_items
CREATE OR REPLACE FUNCTION audit_delivery_item_changes()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM write_audit_log(
      'operator', auth.uid()::TEXT, 'create',
      'delivery_item', NEW.id,
      jsonb_build_object('title', NEW.title, 'status', NEW.status::TEXT)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM write_audit_log(
      'operator', auth.uid()::TEXT, 'update',
      'delivery_item', NEW.id,
      jsonb_build_object(
        'title', NEW.title,
        'old_status', OLD.status::TEXT,
        'new_status', NEW.status::TEXT
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM write_audit_log(
      'operator', auth.uid()::TEXT, 'delete',
      'delivery_item', OLD.id,
      jsonb_build_object('title', OLD.title)
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_delivery_items
  AFTER INSERT OR UPDATE OR DELETE ON delivery_items
  FOR EACH ROW EXECUTE FUNCTION audit_delivery_item_changes();

-- Audit trigger for client_approvals (tracks client actions)
CREATE OR REPLACE FUNCTION audit_client_approval()
RETURNS trigger AS $$
BEGIN
  PERFORM write_audit_log(
    'client', NULL, NEW.action::TEXT::audit_action,
    'client_approval', NEW.id,
    jsonb_build_object('delivery_item_id', NEW.delivery_item_id, 'note', NEW.note)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_client_approvals
  AFTER INSERT ON client_approvals
  FOR EACH ROW EXECUTE FUNCTION audit_client_approval();
