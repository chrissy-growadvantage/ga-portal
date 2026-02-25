-- Luma -- Proposals: line items and addons
-- Migration 014: Create proposal_line_items and proposal_addons tables

-- ============================================
-- 1. Tables
-- ============================================

-- Proposal Line Items
CREATE TABLE proposal_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  unit_price NUMERIC NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  billing_type billing_type NOT NULL DEFAULT 'one_time',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_proposal_line_items_proposal_sort ON proposal_line_items(proposal_id, sort_order);

-- Proposal Addons
CREATE TABLE proposal_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  addon_template_id UUID REFERENCES addon_templates(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0 CHECK (price >= 0),
  billing_type billing_type NOT NULL DEFAULT 'one_time',
  is_included BOOLEAN NOT NULL DEFAULT true,
  is_selected BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_proposal_addons_proposal_sort ON proposal_addons(proposal_id, sort_order);

-- ============================================
-- 2. Row Level Security
-- ============================================

ALTER TABLE proposal_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proposal_line_items_select" ON proposal_line_items FOR SELECT
  USING (proposal_id IN (
    SELECT id FROM proposals WHERE operator_id = auth.uid()
  ));

CREATE POLICY "proposal_line_items_insert" ON proposal_line_items FOR INSERT
  WITH CHECK (proposal_id IN (
    SELECT id FROM proposals WHERE operator_id = auth.uid()
  ));

CREATE POLICY "proposal_line_items_update" ON proposal_line_items FOR UPDATE
  USING (proposal_id IN (
    SELECT id FROM proposals WHERE operator_id = auth.uid()
  ));

CREATE POLICY "proposal_line_items_delete" ON proposal_line_items FOR DELETE
  USING (proposal_id IN (
    SELECT id FROM proposals WHERE operator_id = auth.uid()
  ));

ALTER TABLE proposal_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proposal_addons_select" ON proposal_addons FOR SELECT
  USING (proposal_id IN (
    SELECT id FROM proposals WHERE operator_id = auth.uid()
  ));

CREATE POLICY "proposal_addons_insert" ON proposal_addons FOR INSERT
  WITH CHECK (proposal_id IN (
    SELECT id FROM proposals WHERE operator_id = auth.uid()
  ));

CREATE POLICY "proposal_addons_update" ON proposal_addons FOR UPDATE
  USING (proposal_id IN (
    SELECT id FROM proposals WHERE operator_id = auth.uid()
  ));

CREATE POLICY "proposal_addons_delete" ON proposal_addons FOR DELETE
  USING (proposal_id IN (
    SELECT id FROM proposals WHERE operator_id = auth.uid()
  ));
