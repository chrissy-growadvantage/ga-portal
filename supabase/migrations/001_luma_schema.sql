-- Luma — Client Delivery OS
-- Full database schema for Supabase
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. Custom Enum Types
-- ============================================

CREATE TYPE client_status AS ENUM ('active', 'paused', 'archived');
CREATE TYPE scope_type AS ENUM ('hours', 'deliverables', 'custom');
CREATE TYPE delivery_status AS ENUM ('completed', 'in_progress', 'pending_approval', 'approved', 'revision_requested');
CREATE TYPE request_source AS ENUM ('client', 'operator');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'declined', 'completed');
CREATE TYPE approval_action AS ENUM ('approved', 'revision_requested');

-- ============================================
-- 2. Tables
-- ============================================

-- Operators (mirrors auth.users)
CREATE TABLE operators (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  business_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  notes TEXT,
  status client_status NOT NULL DEFAULT 'active',
  magic_link_token TEXT UNIQUE,
  magic_link_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clients_operator ON clients(operator_id);
CREATE INDEX idx_clients_magic_token ON clients(magic_link_token);

-- Scope Allocations
CREATE TABLE scope_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  scope_type scope_type NOT NULL DEFAULT 'hours',
  total_allocated NUMERIC NOT NULL DEFAULT 0 CHECK (total_allocated >= 0),
  unit_label TEXT NOT NULL DEFAULT 'hours',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_period CHECK (period_end >= period_start)
);

CREATE INDEX idx_scope_alloc_client ON scope_allocations(client_id);

-- Delivery Items
CREATE TABLE delivery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  scope_allocation_id UUID REFERENCES scope_allocations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  status delivery_status NOT NULL DEFAULT 'completed',
  scope_cost NUMERIC NOT NULL DEFAULT 1 CHECK (scope_cost >= 0),
  hours_spent NUMERIC CHECK (hours_spent >= 0),
  is_out_of_scope BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_delivery_client ON delivery_items(client_id);
CREATE INDEX idx_delivery_scope_alloc ON delivery_items(scope_allocation_id);

-- Scope Requests
CREATE TABLE scope_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  requested_by request_source NOT NULL DEFAULT 'client',
  status request_status NOT NULL DEFAULT 'pending',
  scope_cost NUMERIC CHECK (scope_cost >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_scope_req_client ON scope_requests(client_id);

-- Client Approvals
CREATE TABLE client_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_item_id UUID NOT NULL REFERENCES delivery_items(id) ON DELETE CASCADE,
  action approval_action NOT NULL,
  note TEXT,
  acted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_approval_delivery ON client_approvals(delivery_item_id);

-- ============================================
-- 3. Row Level Security (RLS)
-- ============================================

ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "operators_select_own" ON operators FOR SELECT USING (auth.uid() = id);
CREATE POLICY "operators_update_own" ON operators FOR UPDATE USING (auth.uid() = id);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clients_select" ON clients FOR SELECT USING (operator_id = auth.uid());
CREATE POLICY "clients_insert" ON clients FOR INSERT WITH CHECK (operator_id = auth.uid());
CREATE POLICY "clients_update" ON clients FOR UPDATE USING (operator_id = auth.uid());
CREATE POLICY "clients_delete" ON clients FOR DELETE USING (operator_id = auth.uid());

ALTER TABLE scope_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scope_alloc_select" ON scope_allocations FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE operator_id = auth.uid()));
CREATE POLICY "scope_alloc_insert" ON scope_allocations FOR INSERT
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE operator_id = auth.uid()));
CREATE POLICY "scope_alloc_update" ON scope_allocations FOR UPDATE
  USING (client_id IN (SELECT id FROM clients WHERE operator_id = auth.uid()));
CREATE POLICY "scope_alloc_delete" ON scope_allocations FOR DELETE
  USING (client_id IN (SELECT id FROM clients WHERE operator_id = auth.uid()));

ALTER TABLE delivery_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "delivery_select" ON delivery_items FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE operator_id = auth.uid()));
CREATE POLICY "delivery_insert" ON delivery_items FOR INSERT
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE operator_id = auth.uid()));
CREATE POLICY "delivery_update" ON delivery_items FOR UPDATE
  USING (client_id IN (SELECT id FROM clients WHERE operator_id = auth.uid()));
CREATE POLICY "delivery_delete" ON delivery_items FOR DELETE
  USING (client_id IN (SELECT id FROM clients WHERE operator_id = auth.uid()));

ALTER TABLE scope_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scope_req_select" ON scope_requests FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE operator_id = auth.uid()));
CREATE POLICY "scope_req_insert" ON scope_requests FOR INSERT
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE operator_id = auth.uid()));
CREATE POLICY "scope_req_update" ON scope_requests FOR UPDATE
  USING (client_id IN (SELECT id FROM clients WHERE operator_id = auth.uid()));

ALTER TABLE client_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "approval_select" ON client_approvals FOR SELECT
  USING (delivery_item_id IN (
    SELECT id FROM delivery_items WHERE client_id IN (
      SELECT id FROM clients WHERE operator_id = auth.uid()
    )
  ));

-- ============================================
-- 4. Triggers
-- ============================================

-- Auto-create operator row on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.operators (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON operators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON scope_allocations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON delivery_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON scope_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
