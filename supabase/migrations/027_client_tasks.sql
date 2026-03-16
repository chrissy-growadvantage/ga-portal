-- Migration 027: Client tasks table for GA Portal MVP

CREATE TABLE IF NOT EXISTS client_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  operator_id uuid NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  title text NOT NULL,
  due_date date,
  link_url text,
  notes text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: operator manages tasks
ALTER TABLE client_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Operators manage client tasks"
  ON client_tasks FOR ALL
  USING (operator_id = auth.uid())
  WITH CHECK (operator_id = auth.uid());

-- Index for portal lookups
CREATE INDEX IF NOT EXISTS idx_client_tasks_client ON client_tasks(client_id, created_at DESC);
