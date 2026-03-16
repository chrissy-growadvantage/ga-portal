-- Migration 025: Extend scope_requests for GA Portal MVP
-- Adds category, attachment_url, admin_note, ga_status columns

ALTER TABLE scope_requests ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE scope_requests ADD COLUMN IF NOT EXISTS attachment_url text;
ALTER TABLE scope_requests ADD COLUMN IF NOT EXISTS admin_note text;
ALTER TABLE scope_requests ADD COLUMN IF NOT EXISTS ga_status text CHECK (ga_status IN ('submitted', 'received', 'in_progress', 'waiting_on_client', 'done'));

-- Add portal-specific fields to clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS portal_stripe_url text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS portal_intake_url text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS onboarding_stage integer DEFAULT 0;
