-- Fix foreign keys and RLS policies for correct schema
-- The operators table has 'user_id' not 'id' as the reference to auth.users

-- 1. Backfill operators for existing users
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

-- 2. Check if clients.operator_id references operators.id or operators.user_id
-- We need to update the foreign key if it's wrong

-- Drop existing foreign key constraint on clients
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_operator_id_fkey;

-- Add correct foreign key constraint
ALTER TABLE clients ADD CONSTRAINT clients_operator_id_fkey
  FOREIGN KEY (operator_id) REFERENCES operators(user_id) ON DELETE CASCADE;

-- 3. Update RLS policies for operators table to use user_id
DROP POLICY IF EXISTS "operators_select_own" ON operators;
DROP POLICY IF EXISTS "operators_update_own" ON operators;

CREATE POLICY "operators_select_own" ON operators
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "operators_update_own" ON operators
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 4. Ensure the trigger uses user_id correctly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.operators (user_id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
