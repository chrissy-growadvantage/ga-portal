-- Migration 034: Add proposal and contract PDF URL fields to clients

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS portal_proposal_url  text,
  ADD COLUMN IF NOT EXISTS portal_contract_url  text;

-- Down (rollback)
-- ALTER TABLE clients
--   DROP COLUMN IF EXISTS portal_proposal_url,
--   DROP COLUMN IF EXISTS portal_contract_url;
