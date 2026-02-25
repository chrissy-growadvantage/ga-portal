-- First, let's see what the operators table structure actually is
-- Run this query first to check:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'operators';

-- Based on the error, it seems user_id is a separate column from id
-- Let's try a different approach - insert with both id and user_id

INSERT INTO operators (id, user_id, email, full_name)
SELECT
  au.id,
  au.id, -- set user_id to the same as id
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1)
  ) as full_name
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM operators o WHERE o.id = au.id OR o.user_id = au.id
)
ON CONFLICT (id) DO NOTHING;
