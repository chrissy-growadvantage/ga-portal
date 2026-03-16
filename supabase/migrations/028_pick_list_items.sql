-- Migration 028: Pick-list items table for GA Portal MVP

CREATE TABLE IF NOT EXISTS pick_list_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id uuid NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  list_type text NOT NULL CHECK (list_type IN ('phase', 'category', 'uplift', 'work_status')),
  label text NOT NULL,
  colour text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: operator manages their own pick-lists
ALTER TABLE pick_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Operators manage pick lists"
  ON pick_list_items FOR ALL
  USING (operator_id = auth.uid())
  WITH CHECK (operator_id = auth.uid());

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_pick_list_items_operator ON pick_list_items(operator_id, list_type, sort_order);

-- Extend delivery_items for pick-list tags
ALTER TABLE delivery_items ADD COLUMN IF NOT EXISTS phase text;
ALTER TABLE delivery_items ADD COLUMN IF NOT EXISTS uplift text;
