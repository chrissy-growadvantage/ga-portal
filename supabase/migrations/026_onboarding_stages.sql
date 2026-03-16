-- Migration 026: Onboarding stages table for GA Portal MVP

CREATE TABLE IF NOT EXISTS onboarding_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  operator_id uuid NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  stage_key text NOT NULL,
  stage_label text NOT NULL,
  sort_order integer NOT NULL,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'waiting_on_client', 'blocked', 'done')),
  owner_label text NOT NULL DEFAULT 'operator' CHECK (owner_label IN ('operator', 'client')),
  due_date date,
  notes text,
  action_url text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, stage_key)
);

-- RLS: operator can manage their own clients' stages
ALTER TABLE onboarding_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Operators manage onboarding stages"
  ON onboarding_stages FOR ALL
  USING (operator_id = auth.uid())
  WITH CHECK (operator_id = auth.uid());

-- Index for portal lookups
CREATE INDEX IF NOT EXISTS idx_onboarding_stages_client ON onboarding_stages(client_id, sort_order);
