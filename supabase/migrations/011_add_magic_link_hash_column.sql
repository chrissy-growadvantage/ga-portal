-- Add magic_link_token_hash column if it doesn't exist
-- The edge function expects this column but schema might have magic_link_token instead

DO $$
BEGIN
  -- Check if magic_link_token_hash exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'magic_link_token_hash'
  ) THEN
    -- If we have magic_link_token, rename it
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'clients' AND column_name = 'magic_link_token'
    ) THEN
      ALTER TABLE clients RENAME COLUMN magic_link_token TO magic_link_token_hash;
    ELSE
      -- Add the column if neither exists
      ALTER TABLE clients ADD COLUMN magic_link_token_hash TEXT UNIQUE;
    END IF;
  END IF;
END $$;

-- Ensure magic_link_expires_at exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'magic_link_expires_at'
  ) THEN
    ALTER TABLE clients ADD COLUMN magic_link_expires_at TIMESTAMPTZ;
  END IF;
END $$;
