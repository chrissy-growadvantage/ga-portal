-- Migration 037: portal_links table
-- Replaces single magic_link_token_hash on clients with a multi-token table.
-- Each portal link has its own hash, expiry, optional label, and active flag.
-- Old clients.magic_link_token_hash column is kept for backwards compatibility
-- and is still checked as a fallback by validate-token.ts.

CREATE TABLE IF NOT EXISTS portal_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  label TEXT,  -- e.g. "Chrissy's link", "Mervin's test link"
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portal_links_client ON portal_links(client_id);
CREATE INDEX IF NOT EXISTS idx_portal_links_hash ON portal_links(token_hash);

-- RLS
ALTER TABLE portal_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Operators manage their client links"
  ON portal_links FOR ALL
  USING (client_id IN (SELECT id FROM clients WHERE operator_id = auth.uid()));
