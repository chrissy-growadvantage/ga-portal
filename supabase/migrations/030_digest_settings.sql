-- Add weekly digest settings to operators table
ALTER TABLE operators
  ADD COLUMN IF NOT EXISTS digest_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS digest_day text DEFAULT 'monday',
  ADD COLUMN IF NOT EXISTS digest_time text DEFAULT '09:00';
