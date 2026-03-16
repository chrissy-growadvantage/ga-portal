-- Migration: 024_client_notes
-- Brain Dump / Requests: lightweight append-only notes per client.
-- Types: 'note', 'request', 'todo', 'idea'

-- ============================================================
-- 1. Create client_notes table
-- ============================================================
CREATE TABLE IF NOT EXISTS client_notes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  operator_id uuid NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  body        text NOT NULL CHECK (char_length(body) > 0),
  type        text NOT NULL DEFAULT 'note'
                   CHECK (type IN ('note', 'request', 'todo', 'idea')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. RLS
-- ============================================================
ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "operators_manage_own_notes"
  ON client_notes
  FOR ALL
  USING (operator_id = auth.uid())
  WITH CHECK (operator_id = auth.uid());

-- ============================================================
-- 3. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_client_notes_client
  ON client_notes(client_id);

CREATE INDEX IF NOT EXISTS idx_client_notes_operator
  ON client_notes(operator_id);
