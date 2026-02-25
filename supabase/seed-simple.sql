-- Simple Seed Script for Luma Demo Data
-- Uses your actual auth.users UUID: 26d5a8ee-7746-4f46-99c6-620f805e7e01
-- Run this ENTIRE script in Supabase SQL Editor

-- ============================================
-- STEP 1: Ensure operator row exists
-- ============================================
INSERT INTO operators (user_id, email, full_name)
SELECT
  '26d5a8ee-7746-4f46-99c6-620f805e7e01'::uuid,
  'hello@heymervin.com',
  'Mervin'
WHERE NOT EXISTS (
  SELECT 1 FROM operators WHERE user_id = '26d5a8ee-7746-4f46-99c6-620f805e7e01'::uuid
);

-- ============================================
-- STEP 2: Create clients
-- ============================================
INSERT INTO clients (company_name, operator_id, contact_name, contact_email, contact_phone, notes, status, created_at)
VALUES
  ('Acme Corp', '26d5a8ee-7746-4f46-99c6-620f805e7e01', 'Jane Smith', 'jane@acme.co', '+1 555-0101', 'Retainer client since Q4 2025. Monthly marketing + ops support.', 'active', now() - interval '90 days'),
  ('Bright Ideas Co', '26d5a8ee-7746-4f46-99c6-620f805e7e01', 'Mark Johnson', 'mark@brightideas.com', '+1 555-0202', 'Creative agency. Content strategy and email marketing.', 'active', now() - interval '60 days'),
  ('Summit Strategies', '26d5a8ee-7746-4f46-99c6-620f805e7e01', 'Lisa Chen', 'lisa@summitstrat.com', NULL, 'Consulting firm. Deliverables-based scope.', 'active', now() - interval '45 days'),
  ('Evergreen Growth', '26d5a8ee-7746-4f46-99c6-620f805e7e01', 'Tom Wilson', 'tom@evergreengrowth.io', '+1 555-0404', 'New client. Q1 launch sprint.', 'active', now() - interval '20 days');

-- Check what was created
SELECT id, company_name, contact_name FROM clients WHERE operator_id = '26d5a8ee-7746-4f46-99c6-620f805e7e01';
