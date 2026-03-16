-- Migration 029: Operator portal branding fields

ALTER TABLE operators ADD COLUMN IF NOT EXISTS portal_primary_color text;
ALTER TABLE operators ADD COLUMN IF NOT EXISTS portal_logo_url text;
ALTER TABLE operators ADD COLUMN IF NOT EXISTS portal_accent_color text;
