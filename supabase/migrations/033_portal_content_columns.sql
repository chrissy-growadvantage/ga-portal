-- Migration: 033_portal_content_columns
-- Date: 2026-03-17
-- Description: Add completed_this_month and monthly_plan_notes to clients table.
--   These support the "Completed this month" free-text block (FE-03) and the
--   monthly plan / catch-up notes section (FE-06) on the client portal.
--   Note: slack/drive URL columns already exist as portal_slack_url / portal_drive_url (migration 021).
--   Note: delivery_items.phase / uplift / category already exist (migrations 001, 028).

-- Up
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS completed_this_month text,
  ADD COLUMN IF NOT EXISTS monthly_plan_notes   text;

-- Down (rollback)
-- ALTER TABLE clients
--   DROP COLUMN IF EXISTS completed_this_month,
--   DROP COLUMN IF EXISTS monthly_plan_notes;
