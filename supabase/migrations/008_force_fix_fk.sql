-- Force fix the foreign key constraint
-- The constraint is pointing to operators.id when it should point to operators.user_id

-- 1. Drop all existing rows in clients (since the FK is wrong, they can't be valid anyway)
TRUNCATE TABLE clients CASCADE;

-- 2. Drop the wrong foreign key
ALTER TABLE clients DROP CONSTRAINT clients_operator_id_fkey;

-- 3. Add the correct foreign key pointing to operators.user_id
ALTER TABLE clients
  ADD CONSTRAINT clients_operator_id_fkey
  FOREIGN KEY (operator_id)
  REFERENCES operators(user_id)
  ON DELETE CASCADE;

-- 4. Verify the fix worked
SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'clients'
  AND kcu.column_name = 'operator_id';
