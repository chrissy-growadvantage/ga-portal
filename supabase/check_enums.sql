-- Check what enum types exist and their values
SELECT
  t.typname as enum_name,
  e.enumlabel as enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname LIKE '%category%' OR t.typname LIKE '%delivery%'
ORDER BY t.typname, e.enumsortorder;

-- Also check the delivery_items table structure
SELECT
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name = 'delivery_items'
  AND column_name = 'category';
