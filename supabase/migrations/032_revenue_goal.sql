-- Migration 032: Revenue goal stored on operators row
ALTER TABLE operators
  ADD COLUMN IF NOT EXISTS revenue_goal_cents integer NOT NULL DEFAULT 2000000;
