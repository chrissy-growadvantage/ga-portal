-- Migration 036: Add separate contract PDF upload column to clients
-- Spec 4.6: "Signed contract (SignWell link + uploaded PDF copy)"

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS portal_contract_pdf_url text;

-- Down (rollback)
-- ALTER TABLE clients
--   DROP COLUMN IF EXISTS portal_contract_pdf_url;
