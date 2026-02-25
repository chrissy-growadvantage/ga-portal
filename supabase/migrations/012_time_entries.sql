-- Luma — Time Tracking: time_entries table
-- Migration 012: Create time_entries table, indexes, RLS, and hours view

-- ============================================
-- 1. Table
-- ============================================

CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES operators(user_id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  delivery_item_id UUID REFERENCES delivery_items(id) ON DELETE SET NULL,

  description TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  is_manual BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 2. Indexes
-- ============================================

CREATE INDEX idx_time_entries_operator ON time_entries(operator_id);
CREATE INDEX idx_time_entries_client ON time_entries(client_id);
CREATE INDEX idx_time_entries_started ON time_entries(started_at);
CREATE INDEX idx_time_entries_delivery ON time_entries(delivery_item_id);

-- ============================================
-- 3. Row Level Security
-- ============================================

ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "time_entries_select" ON time_entries FOR SELECT
  USING (operator_id = auth.uid());

CREATE POLICY "time_entries_insert" ON time_entries FOR INSERT
  WITH CHECK (operator_id = auth.uid());

CREATE POLICY "time_entries_update" ON time_entries FOR UPDATE
  USING (operator_id = auth.uid());

CREATE POLICY "time_entries_delete" ON time_entries FOR DELETE
  USING (operator_id = auth.uid());

-- ============================================
-- 4. Auto-update updated_at trigger
-- ============================================

CREATE TRIGGER set_updated_at BEFORE UPDATE ON time_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 5. View: delivery items with computed hours
-- ============================================

CREATE VIEW delivery_items_with_hours AS
SELECT
  di.*,
  COALESCE(SUM(te.duration_seconds) / 3600.0, 0) AS computed_hours_spent
FROM delivery_items di
LEFT JOIN time_entries te ON te.delivery_item_id = di.id
GROUP BY di.id;
