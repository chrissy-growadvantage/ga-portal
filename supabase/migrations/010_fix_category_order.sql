-- Fix category field - proper order to avoid dependencies

-- 1. Remove the default first
ALTER TABLE delivery_items
  ALTER COLUMN category DROP DEFAULT;

-- 2. Convert column to TEXT
ALTER TABLE delivery_items
  ALTER COLUMN category TYPE TEXT USING category::text;

-- 3. Now drop the enum (no more dependencies)
DROP TYPE IF EXISTS delivery_category CASCADE;

-- 4. Set new TEXT default
ALTER TABLE delivery_items
  ALTER COLUMN category SET DEFAULT 'General';

-- 5. Update any NULL categories
UPDATE delivery_items SET category = 'General' WHERE category IS NULL OR category = '';
