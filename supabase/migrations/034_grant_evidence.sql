-- Migration: 034_grant_evidence
-- Date: 2026-03-17
-- Description: Create grant_evidence table to persist pilot tracking data per operator.
--   Replaces the fragile localStorage approach in GrantEvidence.tsx.
--   One row per operator (UNIQUE on operator_id). All complex data stored as JSONB.

-- Up
CREATE TABLE IF NOT EXISTS grant_evidence (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id uuid        NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  client_a    jsonb       NOT NULL DEFAULT '{}'::jsonb,
  client_b    jsonb       NOT NULL DEFAULT '{}'::jsonb,
  checklist   jsonb       NOT NULL DEFAULT '{}'::jsonb,
  kpis        jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (operator_id)
);

CREATE INDEX IF NOT EXISTS idx_grant_evidence_operator ON grant_evidence(operator_id);

-- RLS: only the owning operator can read/write their own row
ALTER TABLE grant_evidence ENABLE ROW LEVEL SECURITY;

-- Operators can read/write only their own evidence row
CREATE POLICY "grant_evidence_operator_all"
  ON grant_evidence
  FOR ALL
  USING (operator_id = auth.uid())
  WITH CHECK (operator_id = auth.uid());

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_grant_evidence_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_grant_evidence_updated_at
  BEFORE UPDATE ON grant_evidence
  FOR EACH ROW EXECUTE FUNCTION update_grant_evidence_updated_at();

-- Down (rollback)
-- DROP TRIGGER IF EXISTS trg_grant_evidence_updated_at ON grant_evidence;
-- DROP FUNCTION IF EXISTS update_grant_evidence_updated_at();
-- DROP TABLE IF EXISTS grant_evidence;
