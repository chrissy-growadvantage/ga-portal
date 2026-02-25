-- Fix category field - convert from empty enum to TEXT for flexibility
-- This allows operators to use any category they want

-- Option 1: Convert to TEXT (RECOMMENDED - more flexible)
ALTER TABLE delivery_items
  ALTER COLUMN category TYPE TEXT USING category::text;

-- Drop the now-unused enum type
DROP TYPE IF EXISTS delivery_category;

-- Set a default value
ALTER TABLE delivery_items
  ALTER COLUMN category SET DEFAULT 'General';

-- Update any NULL categories to 'General'
UPDATE delivery_items SET category = 'General' WHERE category IS NULL;
