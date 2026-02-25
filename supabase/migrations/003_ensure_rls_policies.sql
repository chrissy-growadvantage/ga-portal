-- Safe migration to ensure RLS policies exist
-- This can be run multiple times without errors

-- ============================================
-- Drop existing policies if they exist
-- ============================================

DROP POLICY IF EXISTS "operators_select_own" ON operators;
DROP POLICY IF EXISTS "operators_update_own" ON operators;

DROP POLICY IF EXISTS "clients_select" ON clients;
DROP POLICY IF EXISTS "clients_insert" ON clients;
DROP POLICY IF EXISTS "clients_update" ON clients;
DROP POLICY IF EXISTS "clients_delete" ON clients;

DROP POLICY IF EXISTS "scope_alloc_select" ON scope_allocations;
DROP POLICY IF EXISTS "scope_alloc_insert" ON scope_allocations;
DROP POLICY IF EXISTS "scope_alloc_update" ON scope_allocations;
DROP POLICY IF EXISTS "scope_alloc_delete" ON scope_allocations;

DROP POLICY IF EXISTS "delivery_select" ON delivery_items;
DROP POLICY IF EXISTS "delivery_insert" ON delivery_items;
DROP POLICY IF EXISTS "delivery_update" ON delivery_items;
DROP POLICY IF EXISTS "delivery_delete" ON delivery_items;

DROP POLICY IF EXISTS "scope_req_select" ON scope_requests;
DROP POLICY IF EXISTS "scope_req_insert" ON scope_requests;
DROP POLICY IF EXISTS "scope_req_update" ON scope_requests;

DROP POLICY IF EXISTS "approval_select" ON client_approvals;

-- ============================================
-- Enable RLS on all tables
-- ============================================

ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE scope_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE scope_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_approvals ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Create RLS Policies
-- ============================================

-- Operators
CREATE POLICY "operators_select_own" ON operators
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "operators_update_own" ON operators
  FOR UPDATE
  USING (auth.uid() = id);

-- Clients
CREATE POLICY "clients_select" ON clients
  FOR SELECT
  USING (operator_id = auth.uid());

CREATE POLICY "clients_insert" ON clients
  FOR INSERT
  WITH CHECK (operator_id = auth.uid());

CREATE POLICY "clients_update" ON clients
  FOR UPDATE
  USING (operator_id = auth.uid());

CREATE POLICY "clients_delete" ON clients
  FOR DELETE
  USING (operator_id = auth.uid());

-- Scope Allocations
CREATE POLICY "scope_alloc_select" ON scope_allocations
  FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE operator_id = auth.uid()));

CREATE POLICY "scope_alloc_insert" ON scope_allocations
  FOR INSERT
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE operator_id = auth.uid()));

CREATE POLICY "scope_alloc_update" ON scope_allocations
  FOR UPDATE
  USING (client_id IN (SELECT id FROM clients WHERE operator_id = auth.uid()));

CREATE POLICY "scope_alloc_delete" ON scope_allocations
  FOR DELETE
  USING (client_id IN (SELECT id FROM clients WHERE operator_id = auth.uid()));

-- Delivery Items
CREATE POLICY "delivery_select" ON delivery_items
  FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE operator_id = auth.uid()));

CREATE POLICY "delivery_insert" ON delivery_items
  FOR INSERT
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE operator_id = auth.uid()));

CREATE POLICY "delivery_update" ON delivery_items
  FOR UPDATE
  USING (client_id IN (SELECT id FROM clients WHERE operator_id = auth.uid()));

CREATE POLICY "delivery_delete" ON delivery_items
  FOR DELETE
  USING (client_id IN (SELECT id FROM clients WHERE operator_id = auth.uid()));

-- Scope Requests
CREATE POLICY "scope_req_select" ON scope_requests
  FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE operator_id = auth.uid()));

CREATE POLICY "scope_req_insert" ON scope_requests
  FOR INSERT
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE operator_id = auth.uid()));

CREATE POLICY "scope_req_update" ON scope_requests
  FOR UPDATE
  USING (client_id IN (SELECT id FROM clients WHERE operator_id = auth.uid()));

-- Client Approvals
CREATE POLICY "approval_select" ON client_approvals
  FOR SELECT
  USING (delivery_item_id IN (
    SELECT id FROM delivery_items WHERE client_id IN (
      SELECT id FROM clients WHERE operator_id = auth.uid()
    )
  ));
