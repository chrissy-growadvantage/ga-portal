-- Migration: 022_ga4_connections
-- Creates the client_ga4_connections table for storing Google Analytics 4 OAuth tokens.
-- Uses client_id UUID FK (not client_slug) to align with Luma's data model.

-- ============================================================
-- 1. Create client_ga4_connections table
-- ============================================================
CREATE TABLE IF NOT EXISTS client_ga4_connections (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  operator_id   uuid NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  property_id   text NOT NULL,
  property_name text,
  refresh_token text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, property_id)
);

-- ============================================================
-- 2. RLS for client_ga4_connections
-- ============================================================
ALTER TABLE client_ga4_connections ENABLE ROW LEVEL SECURITY;

-- Operators can read/write their own clients' GA4 connections
CREATE POLICY "operators_manage_ga4_connections"
  ON client_ga4_connections
  FOR ALL
  USING (operator_id = auth.uid())
  WITH CHECK (operator_id = auth.uid());

-- Service role bypass (used by Edge Functions for token rotation)
CREATE POLICY "service_role_ga4_connections"
  ON client_ga4_connections
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 3. updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_ga4_connections_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ga4_connections_updated_at
  BEFORE UPDATE ON client_ga4_connections
  FOR EACH ROW EXECUTE FUNCTION update_ga4_connections_updated_at();

-- ============================================================
-- 4. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_ga4_connections_client
  ON client_ga4_connections(client_id);

CREATE INDEX IF NOT EXISTS idx_ga4_connections_operator
  ON client_ga4_connections(operator_id);
