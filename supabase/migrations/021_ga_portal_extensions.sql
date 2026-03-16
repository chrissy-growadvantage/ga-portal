-- Migration: 021_ga_portal_extensions
-- Adds portal metadata fields to the clients table and creates monthly_snapshots table
-- for the Grow Advantage portal MVP.

-- ============================================================
-- 1. Extend clients table with portal metadata fields
-- ============================================================
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS integrator_name       text,
  ADD COLUMN IF NOT EXISTS primary_comms_channel text,
  ADD COLUMN IF NOT EXISTS next_strategy_meeting text,
  ADD COLUMN IF NOT EXISTS this_month_outcomes   text,
  ADD COLUMN IF NOT EXISTS this_month_deliverables text,
  ADD COLUMN IF NOT EXISTS this_month_improvements text,
  ADD COLUMN IF NOT EXISTS this_month_risks      text,
  ADD COLUMN IF NOT EXISTS this_month_focus      text,
  ADD COLUMN IF NOT EXISTS portal_slack_url      text,
  ADD COLUMN IF NOT EXISTS portal_drive_url      text,
  ADD COLUMN IF NOT EXISTS portal_booking_url    text,
  ADD COLUMN IF NOT EXISTS hours_used_this_month numeric(8,2),
  ADD COLUMN IF NOT EXISTS next_meeting_at       timestamptz,
  ADD COLUMN IF NOT EXISTS next_meeting_link     text;

-- ============================================================
-- 2. Create monthly_snapshots table
-- ============================================================
CREATE TABLE IF NOT EXISTS monthly_snapshots (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id             uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  operator_id           uuid NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  month_label           text NOT NULL,          -- e.g. "March 2026"
  month_slug            text NOT NULL,          -- e.g. "2026-03"
  meeting_date          text,
  attendees             text,
  -- Delivery
  wins                  text,
  deliverables_completed text,
  slipped               text,
  insights              text,
  upcoming_priorities   jsonb DEFAULT '[]'::jsonb,  -- PriorityItem[]
  key_deadlines         text,
  risks_constraints     text,
  process_improvements  jsonb DEFAULT '[]'::jsonb,  -- ProcessItem[]
  adhoc_requests        jsonb DEFAULT '[]'::jsonb,  -- AdhocItem[]
  -- Comms
  primary_comms         text,
  recurring_meetings    jsonb DEFAULT '[]'::jsonb,  -- MeetingItem[]
  response_times        text,
  working_well          text,
  unclear_messy         text,
  more_visibility       text,
  -- Scores (0-10)
  priorities_score      smallint CHECK (priorities_score BETWEEN 0 AND 10),
  delivery_score        smallint CHECK (delivery_score BETWEEN 0 AND 10),
  communication_score   smallint CHECK (communication_score BETWEEN 0 AND 10),
  capacity_score        smallint CHECK (capacity_score BETWEEN 0 AND 10),
  -- Actions
  decisions_actions     jsonb DEFAULT '[]'::jsonb,  -- DecisionItem[]
  blockers              text,
  -- Impact
  time_saved            text,
  friction_removed      text,
  systems_implemented   text,
  -- Agreement snapshot (optional month-level capture)
  agreement_snapshot    jsonb DEFAULT '[]'::jsonb,  -- AgreementItem[]
  -- Timestamps
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, month_slug)
);

-- ============================================================
-- 3. RLS for monthly_snapshots
-- ============================================================
ALTER TABLE monthly_snapshots ENABLE ROW LEVEL SECURITY;

-- Operators can read/write their own clients' snapshots
CREATE POLICY "operators_manage_snapshots"
  ON monthly_snapshots
  FOR ALL
  USING (operator_id = auth.uid())
  WITH CHECK (operator_id = auth.uid());

-- Service role bypass (used by Edge Functions)
CREATE POLICY "service_role_snapshots"
  ON monthly_snapshots
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 4. updated_at trigger for monthly_snapshots
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
-- 5. Index for fast lookup by client + month
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_monthly_snapshots_client_month
  ON monthly_snapshots(client_id, month_slug DESC);
