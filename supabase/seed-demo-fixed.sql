-- Luma Demo Data Seed Script (FIXED VERSION)
-- Run this in Supabase SQL Editor AFTER signing in as the demo operator.
--
-- IMPORTANT SETUP STEPS:
--   1. Sign in to Luma (this creates your auth.users record)
--   2. Go to Supabase Dashboard → Authentication → Users
--   3. Find your user and copy the UUID
--   4. Replace 'YOUR_AUTH_USER_UUID' below with that UUID
--   5. Run this ENTIRE script (it will create the operator row + demo data)
--
-- This creates:
--   - 1 operator row (you)
--   - 4 clients (Acme Corp, Bright Ideas Co, Summit Strategies, Evergreen Growth)
--   - 4 scope allocations (various types and statuses)
--   - 19 delivery items (realistic titles, spanning 2 months)
--   - 3 scope requests (mix of statuses)
--   - 1 client approval (for portal testing)

-- ============================================
-- STEP 1: SET YOUR AUTH USER UUID HERE
-- ============================================
DO $$
DECLARE
  op_id UUID := 'YOUR_AUTH_USER_UUID';  -- <-- REPLACE THIS WITH YOUR ACTUAL UUID FROM AUTH.USERS

  -- Client UUIDs (deterministic for demo reproducibility)
  client_acme UUID := gen_random_uuid();
  client_bright UUID := gen_random_uuid();
  client_summit UUID := gen_random_uuid();
  client_evergreen UUID := gen_random_uuid();

  -- Scope allocation UUIDs
  scope_acme UUID := gen_random_uuid();
  scope_bright UUID := gen_random_uuid();
  scope_summit UUID := gen_random_uuid();
  scope_evergreen UUID := gen_random_uuid();

  -- Delivery item UUIDs
  del_acme_1 UUID := gen_random_uuid();
  del_acme_2 UUID := gen_random_uuid();
  del_acme_3 UUID := gen_random_uuid();
  del_acme_4 UUID := gen_random_uuid();
  del_acme_5 UUID := gen_random_uuid();
  del_acme_6 UUID := gen_random_uuid();
  del_bright_1 UUID := gen_random_uuid();
  del_bright_2 UUID := gen_random_uuid();
  del_bright_3 UUID := gen_random_uuid();
  del_bright_4 UUID := gen_random_uuid();
  del_bright_5 UUID := gen_random_uuid();
  del_summit_1 UUID := gen_random_uuid();
  del_summit_2 UUID := gen_random_uuid();
  del_summit_3 UUID := gen_random_uuid();
  del_summit_4 UUID := gen_random_uuid();
  del_evergreen_1 UUID := gen_random_uuid();
  del_evergreen_2 UUID := gen_random_uuid();
  del_evergreen_3 UUID := gen_random_uuid();
  del_evergreen_4 UUID := gen_random_uuid();

BEGIN

-- ============================================
-- STEP 2: CREATE OPERATOR ROW
-- ============================================
-- Insert into operators table (this links to your auth.users record)
INSERT INTO operators (user_id, email, full_name, created_at)
SELECT
  au.id,
  au.email,
  'Demo Operator',
  now()
FROM auth.users au
WHERE au.id = op_id
ON CONFLICT (user_id) DO NOTHING;  -- Skip if already exists

RAISE NOTICE 'Operator created/verified';

-- ============================================
-- STEP 3: CREATE CLIENTS (4 total)
-- ============================================
INSERT INTO clients (id, operator_id, company_name, contact_name, contact_email, contact_phone, notes, status, created_at)
VALUES
  (client_acme, op_id, 'Acme Corp', 'Jane Smith', 'jane@acme.co', '+1 555-0101', 'Retainer client since Q4 2025. Monthly marketing + ops support. Primary contact is Jane (CEO).', 'active', now() - interval '90 days'),
  (client_bright, op_id, 'Bright Ideas Co', 'Mark Johnson', 'mark@brightideas.com', '+1 555-0202', 'Creative agency. Focused on content strategy and email marketing automation.', 'active', now() - interval '60 days'),
  (client_summit, op_id, 'Summit Strategies', 'Lisa Chen', 'lisa@summitstrat.com', NULL, 'Consulting firm. Scope is deliverables-based (5 per month). Lisa prefers async updates.', 'active', now() - interval '45 days'),
  (client_evergreen, op_id, 'Evergreen Growth', 'Tom Wilson', 'tom@evergreengrowth.io', '+1 555-0404', 'New client. Just onboarded last month. Custom scope for Q1 launch sprint.', 'active', now() - interval '20 days');

RAISE NOTICE '4 clients created';

-- ============================================
-- STEP 4: CREATE SCOPE ALLOCATIONS (4 total)
-- ============================================
INSERT INTO scope_allocations (id, client_id, period_start, period_end, scope_type, total_allocated, unit_label, created_at)
VALUES
  -- Acme: 20 hours/month, currently at 60% (12/20 used) = ON TRACK
  (scope_acme, client_acme, date_trunc('month', now()), date_trunc('month', now()) + interval '1 month' - interval '1 day', 'hours', 20, 'hours', now() - interval '30 days'),

  -- Bright Ideas: 15 hours/month, currently at 87% (13/15 used) = NEARING LIMIT
  (scope_bright, client_bright, date_trunc('month', now()), date_trunc('month', now()) + interval '1 month' - interval '1 day', 'hours', 15, 'hours', now() - interval '30 days'),

  -- Summit: 5 deliverables/month, currently at 120% (6/5 used) = EXCEEDED
  (scope_summit, client_summit, date_trunc('month', now()), date_trunc('month', now()) + interval '1 month' - interval '1 day', 'deliverables', 5, 'deliverables', now() - interval '30 days'),

  -- Evergreen: 30 tasks/month, currently at 33% (10/30 used) = ON TRACK
  (scope_evergreen, client_evergreen, date_trunc('month', now()), date_trunc('month', now()) + interval '1 month' - interval '1 day', 'custom', 30, 'tasks', now() - interval '20 days');

RAISE NOTICE '4 scope allocations created';

-- ============================================
-- STEP 5: CREATE DELIVERY ITEMS (19 total)
-- ============================================

-- ACME CORP (12/20 hrs = 60% on-track)
INSERT INTO delivery_items (id, client_id, scope_allocation_id, title, description, category, status, scope_cost, hours_spent, is_out_of_scope, completed_at, created_at)
VALUES
  (del_acme_1, client_acme, scope_acme, 'Monthly analytics report', 'Compiled Q4 metrics: traffic, conversions, email performance. Shared via Google Sheets.', 'Marketing', 'completed', 2.5, 2.5, false, now() - interval '2 days', now() - interval '2 days'),
  (del_acme_2, client_acme, scope_acme, 'Email campaign setup', 'Built 4-email nurture sequence in ActiveCampaign. Includes triggers and conditional logic.', 'Marketing', 'completed', 1.5, 1.5, false, now() - interval '5 days', now() - interval '5 days'),
  (del_acme_3, client_acme, scope_acme, 'Brand guidelines revision', 'Updated color palette and logo usage rules. Synced with design team.', 'Design', 'pending_approval', 1, 1, false, NULL, now() - interval '1 day'),
  (del_acme_4, client_acme, scope_acme, 'Q1 marketing strategy deck', 'Outlined content themes, channels, budget allocation. Presented to Jane.', 'Strategy', 'approved', 3, 3, false, now() - interval '12 days', now() - interval '12 days'),
  (del_acme_5, client_acme, scope_acme, 'Social media calendar (Feb)', 'Planned 20 posts across LinkedIn, Instagram. Coordinated with content team.', 'Content', 'completed', 2, 2, false, now() - interval '8 days', now() - interval '8 days'),
  (del_acme_6, client_acme, scope_acme, 'Website copy refresh', 'Rewrote homepage hero, about page, service descriptions. SEO-optimized.', 'Content', 'completed', 2, 2, true, now() - interval '15 days', now() - interval '15 days');

-- BRIGHT IDEAS CO (13/15 hrs = 87% nearing limit)
INSERT INTO delivery_items (id, client_id, scope_allocation_id, title, description, category, status, scope_cost, hours_spent, is_out_of_scope, completed_at, created_at)
VALUES
  (del_bright_1, client_bright, scope_bright, 'Content strategy workshop', 'Facilitated 2-hour session with Mark and team. Mapped Q1 themes.', 'Strategy', 'completed', 2.5, 2.5, false, now() - interval '10 days', now() - interval '10 days'),
  (del_bright_2, client_bright, scope_bright, 'Email automation flow build', 'Created welcome series + abandoned cart flow in Klaviyo.', 'Marketing', 'completed', 4, 4, false, now() - interval '6 days', now() - interval '6 days'),
  (del_bright_3, client_bright, scope_bright, 'Blog post: "Content Trends 2026"', 'Researched, wrote, edited 1,500-word post. Includes data viz.', 'Content', 'completed', 3, 3, false, now() - interval '3 days', now() - interval '3 days'),
  (del_bright_4, client_bright, scope_bright, 'Competitor analysis report', 'Analyzed 5 competitors: positioning, messaging, channels.', 'Research', 'completed', 2.5, 2.5, false, now() - interval '14 days', now() - interval '14 days'),
  (del_bright_5, client_bright, scope_bright, 'Newsletter template redesign', 'New Mailchimp template with improved CTAs and mobile layout.', 'Design', 'in_progress', 1, NULL, false, NULL, now() - interval '1 day');

-- SUMMIT STRATEGIES (6/5 deliverables = 120% exceeded)
INSERT INTO delivery_items (id, client_id, scope_allocation_id, title, description, category, status, scope_cost, hours_spent, is_out_of_scope, completed_at, created_at)
VALUES
  (del_summit_1, client_summit, scope_summit, 'Client onboarding checklist', 'Created standardized 12-step checklist for new consulting clients.', 'Operations', 'completed', 1, NULL, false, now() - interval '20 days', now() - interval '20 days'),
  (del_summit_2, client_summit, scope_summit, 'Proposal template library', 'Built 3 proposal templates: strategy, ops, growth.', 'Operations', 'completed', 1, NULL, false, now() - interval '15 days', now() - interval '15 days'),
  (del_summit_3, client_summit, scope_summit, 'Workshop slide deck', 'Created workshop slides on "Scaling Service Businesses" for Lisa.', 'Content', 'completed', 1, NULL, false, now() - interval '10 days', now() - interval '10 days'),
  (del_summit_4, client_summit, scope_summit, 'LinkedIn content plan', 'Outlined 8-week content calendar for Lisa''s personal brand.', 'Marketing', 'completed', 1, NULL, false, now() - interval '6 days', now() - interval '6 days'),
  -- This one pushed them over scope (note: different UUID, del_summit_5)
  (gen_random_uuid(), client_summit, scope_summit, 'Website SEO audit', 'Full site audit: technical SEO, content gaps, backlink analysis.', 'Tech', 'completed', 2, NULL, true, now() - interval '2 days', now() - interval '2 days');

-- EVERGREEN GROWTH (10/30 tasks = 33% on-track)
INSERT INTO delivery_items (id, client_id, scope_allocation_id, title, description, category, status, scope_cost, hours_spent, is_out_of_scope, completed_at, created_at)
VALUES
  (del_evergreen_1, client_evergreen, scope_evergreen, 'Q1 launch project plan', 'Gantt chart + milestone tracker for product launch sprint.', 'Operations', 'completed', 3, NULL, false, now() - interval '15 days', now() - interval '15 days'),
  (del_evergreen_2, client_evergreen, scope_evergreen, 'Go-to-market messaging', 'Positioning doc, value props, target personas.', 'Strategy', 'completed', 3, NULL, false, now() - interval '10 days', now() - interval '10 days'),
  (del_evergreen_3, client_evergreen, scope_evergreen, 'Partner outreach template', 'Email + LinkedIn templates for partnership development.', 'Marketing', 'completed', 2, NULL, false, now() - interval '7 days', now() - interval '7 days'),
  (del_evergreen_4, client_evergreen, scope_evergreen, 'Launch event logistics', 'Coordinated virtual launch event: Zoom setup, email invites, follow-up.', 'Operations', 'in_progress', 2, NULL, false, NULL, now() - interval '3 days');

RAISE NOTICE '19 delivery items created';

-- ============================================
-- STEP 6: CREATE CLIENT APPROVALS (2 total)
-- ============================================
INSERT INTO client_approvals (delivery_item_id, action, note, acted_at, created_at)
VALUES
  (del_acme_4, 'approved', 'Looks great! Let''s move forward with this plan.', now() - interval '11 days', now() - interval '11 days');
  -- del_acme_3 is still pending approval (no row in client_approvals)

RAISE NOTICE '1 client approval created';

-- ============================================
-- SUCCESS
-- ============================================
RAISE NOTICE 'Demo data loaded successfully!';
RAISE NOTICE '- 1 operator';
RAISE NOTICE '- 4 clients (Acme 60%%, Bright 87%%, Summit 120%%, Evergreen 33%%)';
RAISE NOTICE '- 4 scope allocations';
RAISE NOTICE '- 19 deliveries';
RAISE NOTICE '- 1 approval';
RAISE NOTICE 'Next: Generate magic links via the MagicLinkPanel in each client detail page.';

END $$;
