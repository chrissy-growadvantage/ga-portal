-- MANUAL SEED SCRIPT - Simple approach
--
-- STEP 1: Get your user_id from operators table:
--   SELECT user_id FROM operators LIMIT 1;
--
-- STEP 2: Replace XXXXX-XXXXX-XXXXX below with that user_id
--
-- STEP 3: Run this entire script

-- If operators table is empty, run this first (uncomment and replace the UUID):
-- INSERT INTO operators (user_id, email, full_name)
-- SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', 'Demo User')
-- FROM auth.users
-- WHERE email = 'YOUR_EMAIL_HERE';

-- ============================================
-- Replace XXXXX-XXXXX-XXXXX with your actual user_id from operators table
-- ============================================
\set operator_id 'XXXXX-XXXXX-XXXXX'

-- Create clients
INSERT INTO clients (company_name, operator_id, contact_name, contact_email, status, created_at)
VALUES
  ('Acme Corp', :'operator_id', 'Jane Smith', 'jane@acme.co', 'active', now() - interval '90 days'),
  ('Bright Ideas Co', :'operator_id', 'Mark Johnson', 'mark@brightideas.com', 'active', now() - interval '60 days'),
  ('Summit Strategies', :'operator_id', 'Lisa Chen', 'lisa@summitstrat.com', 'active', now() - interval '45 days'),
  ('Evergreen Growth', :'operator_id', 'Tom Wilson', 'tom@evergreengrowth.io', 'active', now() - interval '20 days')
RETURNING id, company_name;
