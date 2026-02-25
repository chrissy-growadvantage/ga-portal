-- Debug: Check what's in operators table and current user
SELECT
  'Current auth user' as source,
  auth.uid() as user_id,
  auth.email() as email
UNION ALL
SELECT
  'Operators table' as source,
  user_id,
  email
FROM operators;

-- Also check the foreign key constraint details
SELECT
  tc.constraint_name,
  tc.table_name,
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
