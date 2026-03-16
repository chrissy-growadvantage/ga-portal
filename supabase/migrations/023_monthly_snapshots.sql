-- Migration: 023_monthly_snapshots
-- Monthly Snapshot: structured client review notes per calendar month.
-- Stores all 11 sections of the operator ↔ client meeting document.

-- ============================================================
-- 1. Create monthly_snapshots table
-- ============================================================
CREATE TABLE IF NOT EXISTS monthly_snapshots (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  operator_id      uuid NOT NULL REFERENCES operators(id) ON DELETE CASCADE,

  -- Identity
  month_label      text NOT NULL,          -- e.g. "January 2026"
  month_slug       text NOT NULL,          -- e.g. "jan-2026"

  -- Section 1: Meeting Details
  meeting_date     date,
  attendees        text,

  -- Section 4: Previous Month Review
  wins                    text,
  deliverables_completed  text,
  slipped                 text,
  insights                text,

  -- Section 5: Upcoming Month Priorities
  upcoming_priorities     jsonb NOT NULL DEFAULT '[]'::jsonb,
  key_deadlines           text,
  risks_constraints       text,

  -- Section 6: Process Improvements
  process_improvements    jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Section 7: Ad Hoc Requests
  adhoc_requests          jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Section 8: Communication Tools & Cadence
  primary_comms           text,
  recurring_meetings      jsonb NOT NULL DEFAULT '[]'::jsonb,
  response_times          text,

  -- Section 9: Client Feedback & Confidence Check
  working_well            text,
  unclear_messy           text,
  more_visibility         text,
  priorities_score        integer CHECK (priorities_score BETWEEN 0 AND 10),
  delivery_score          integer CHECK (delivery_score BETWEEN 0 AND 10),
  communication_score     integer CHECK (communication_score BETWEEN 0 AND 10),
  capacity_score          integer CHECK (capacity_score BETWEEN 0 AND 10),

  -- Section 10: Decisions, Actions & Owners
  decisions_actions       jsonb NOT NULL DEFAULT '[]'::jsonb,
  blockers                text,

  -- Section 11: Efficiency / Impact Notes
  time_saved              text,
  friction_removed        text,
  systems_implemented     text,

  -- Section 3: Agreement Snapshot
  agreement_snapshot      jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Timestamps
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),

  UNIQUE (client_id, month_slug)
);

-- ============================================================
-- 2. RLS
-- ============================================================
ALTER TABLE monthly_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "operators_manage_own_snapshots"
  ON monthly_snapshots
  FOR ALL
  USING (operator_id = auth.uid())
  WITH CHECK (operator_id = auth.uid());

-- ============================================================
-- 3. updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_monthly_snapshots_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_monthly_snapshots_updated_at
  BEFORE UPDATE ON monthly_snapshots
  FOR EACH ROW EXECUTE FUNCTION update_monthly_snapshots_updated_at();

-- ============================================================
-- 4. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_monthly_snapshots_client
  ON monthly_snapshots(client_id);

CREATE INDEX IF NOT EXISTS idx_monthly_snapshots_operator
  ON monthly_snapshots(operator_id);

CREATE INDEX IF NOT EXISTS idx_monthly_snapshots_slug
  ON monthly_snapshots(client_id, month_slug);
