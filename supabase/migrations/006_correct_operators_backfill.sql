-- Correct backfill for operators table
-- The table has 'user_id' that references auth.users, not 'id'

INSERT INTO operators (user_id, email, full_name, avatar_url)
SELECT
  au.id as user_id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1)
  ) as full_name,
  au.raw_user_meta_data->>'avatar_url' as avatar_url
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM operators o WHERE o.user_id = au.id
);
