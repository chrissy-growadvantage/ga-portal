-- Add Scope Allocations and Deliveries to Demo Clients
-- Run this AFTER seed-simple.sql

-- ============================================
-- STEP 1: Create scope allocations for this month
-- ============================================
WITH client_ids AS (
  SELECT id, company_name FROM clients
  WHERE operator_id = '26d5a8ee-7746-4f46-99c6-620f805e7e01'
  AND company_name IN ('Acme Corp', 'Bright Ideas Co', 'Summit Strategies', 'Evergreen Growth')
)
INSERT INTO scope_allocations (client_id, period_start, period_end, scope_type, total_allocated, unit_label, created_at)
SELECT
  id,
  date_trunc('month', now()),
  date_trunc('month', now()) + interval '1 month' - interval '1 day',
  CASE company_name
    WHEN 'Acme Corp' THEN 'hours'::scope_type
    WHEN 'Bright Ideas Co' THEN 'hours'::scope_type
    WHEN 'Summit Strategies' THEN 'deliverables'::scope_type
    WHEN 'Evergreen Growth' THEN 'custom'::scope_type
  END,
  CASE company_name
    WHEN 'Acme Corp' THEN 20
    WHEN 'Bright Ideas Co' THEN 15
    WHEN 'Summit Strategies' THEN 5
    WHEN 'Evergreen Growth' THEN 30
  END,
  CASE company_name
    WHEN 'Acme Corp' THEN 'hours'
    WHEN 'Bright Ideas Co' THEN 'hours'
    WHEN 'Summit Strategies' THEN 'deliverables'
    WHEN 'Evergreen Growth' THEN 'tasks'
  END,
  now() - interval '30 days'
FROM client_ids;

-- ============================================
-- STEP 2: Create delivery items
-- ============================================

-- Acme Corp deliveries (12/20 hours = 60% on-track)
WITH acme AS (
  SELECT c.id as client_id, sa.id as scope_id
  FROM clients c
  JOIN scope_allocations sa ON sa.client_id = c.id
  WHERE c.company_name = 'Acme Corp' AND c.operator_id = '26d5a8ee-7746-4f46-99c6-620f805e7e01'
  LIMIT 1
)
INSERT INTO delivery_items (client_id, scope_allocation_id, title, description, category, status, scope_cost, hours_spent, is_out_of_scope, completed_at, created_at)
SELECT
  client_id, scope_id, 'Monthly analytics report', 'Compiled Q4 metrics: traffic, conversions, email performance.', 'Marketing', 'completed'::delivery_status, 2.5, 2.5, false, now() - interval '2 days', now() - interval '2 days'
FROM acme
UNION ALL
SELECT
  client_id, scope_id, 'Email campaign setup', 'Built 4-email nurture sequence in ActiveCampaign.', 'Marketing', 'completed'::delivery_status, 1.5, 1.5, false, now() - interval '5 days', now() - interval '5 days'
FROM acme
UNION ALL
SELECT
  client_id, scope_id, 'Brand guidelines revision', 'Updated color palette and logo usage rules.', 'Design', 'pending_approval'::delivery_status, 1, 1, false, NULL, now() - interval '1 day'
FROM acme
UNION ALL
SELECT
  client_id, scope_id, 'Q1 marketing strategy deck', 'Outlined content themes, channels, budget allocation.', 'Strategy', 'approved'::delivery_status, 3, 3, false, now() - interval '12 days', now() - interval '12 days'
FROM acme
UNION ALL
SELECT
  client_id, scope_id, 'Social media calendar (Feb)', 'Planned 20 posts across LinkedIn, Instagram.', 'Content', 'completed'::delivery_status, 2, 2, false, now() - interval '8 days', now() - interval '8 days'
FROM acme
UNION ALL
SELECT
  client_id, scope_id, 'Website copy refresh', 'Rewrote homepage hero, about page, service descriptions.', 'Content', 'completed'::delivery_status, 2, 2, true, now() - interval '15 days', now() - interval '15 days'
FROM acme;

-- Bright Ideas deliveries (13/15 hours = 87% nearing limit)
WITH bright AS (
  SELECT c.id as client_id, sa.id as scope_id
  FROM clients c
  JOIN scope_allocations sa ON sa.client_id = c.id
  WHERE c.company_name = 'Bright Ideas Co' AND c.operator_id = '26d5a8ee-7746-4f46-99c6-620f805e7e01'
  LIMIT 1
)
INSERT INTO delivery_items (client_id, scope_allocation_id, title, description, category, status, scope_cost, hours_spent, is_out_of_scope, completed_at, created_at)
SELECT
  client_id, scope_id, 'Content strategy workshop', 'Facilitated 2-hour session with Mark and team.', 'Strategy', 'completed'::delivery_status, 2.5, 2.5, false, now() - interval '10 days', now() - interval '10 days'
FROM bright
UNION ALL
SELECT
  client_id, scope_id, 'Email automation flow build', 'Created welcome series + abandoned cart flow in Klaviyo.', 'Marketing', 'completed'::delivery_status, 4, 4, false, now() - interval '6 days', now() - interval '6 days'
FROM bright
UNION ALL
SELECT
  client_id, scope_id, 'Blog post: "Content Trends 2026"', 'Researched, wrote, edited 1,500-word post.', 'Content', 'completed'::delivery_status, 3, 3, false, now() - interval '3 days', now() - interval '3 days'
FROM bright
UNION ALL
SELECT
  client_id, scope_id, 'Competitor analysis report', 'Analyzed 5 competitors: positioning, messaging, channels.', 'Research', 'completed'::delivery_status, 2.5, 2.5, false, now() - interval '14 days', now() - interval '14 days'
FROM bright
UNION ALL
SELECT
  client_id, scope_id, 'Newsletter template redesign', 'New Mailchimp template with improved CTAs.', 'Design', 'in_progress'::delivery_status, 1::numeric, NULL::numeric, false, NULL, now() - interval '1 day'
FROM bright;

-- Summit deliveries (6/5 deliverables = 120% exceeded)
WITH summit AS (
  SELECT c.id as client_id, sa.id as scope_id
  FROM clients c
  JOIN scope_allocations sa ON sa.client_id = c.id
  WHERE c.company_name = 'Summit Strategies' AND c.operator_id = '26d5a8ee-7746-4f46-99c6-620f805e7e01'
  LIMIT 1
)
INSERT INTO delivery_items (client_id, scope_allocation_id, title, description, category, status, scope_cost, hours_spent, is_out_of_scope, completed_at, created_at)
SELECT
  client_id, scope_id, 'Client onboarding checklist', 'Created standardized 12-step checklist.', 'Operations', 'completed'::delivery_status, 1::numeric, NULL::numeric, false, now() - interval '20 days', now() - interval '20 days'
FROM summit
UNION ALL
SELECT
  client_id, scope_id, 'Proposal template library', 'Built 3 proposal templates: strategy, ops, growth.', 'Operations', 'completed'::delivery_status, 1::numeric, NULL::numeric, false, now() - interval '15 days', now() - interval '15 days'
FROM summit
UNION ALL
SELECT
  client_id, scope_id, 'Workshop slide deck', 'Created workshop slides on "Scaling Service Businesses".', 'Content', 'completed'::delivery_status, 1::numeric, NULL::numeric, false, now() - interval '10 days', now() - interval '10 days'
FROM summit
UNION ALL
SELECT
  client_id, scope_id, 'LinkedIn content plan', 'Outlined 8-week content calendar for Lisa.', 'Marketing', 'completed'::delivery_status, 1::numeric, NULL::numeric, false, now() - interval '6 days', now() - interval '6 days'
FROM summit
UNION ALL
SELECT
  client_id, scope_id, 'Website SEO audit', 'Full site audit: technical SEO, content gaps, backlink analysis.', 'Tech', 'completed'::delivery_status, 2::numeric, NULL::numeric, true, now() - interval '2 days', now() - interval '2 days'
FROM summit;

-- Evergreen deliveries (10/30 tasks = 33% on-track)
WITH evergreen AS (
  SELECT c.id as client_id, sa.id as scope_id
  FROM clients c
  JOIN scope_allocations sa ON sa.client_id = c.id
  WHERE c.company_name = 'Evergreen Growth' AND c.operator_id = '26d5a8ee-7746-4f46-99c6-620f805e7e01'
  LIMIT 1
)
INSERT INTO delivery_items (client_id, scope_allocation_id, title, description, category, status, scope_cost, hours_spent, is_out_of_scope, completed_at, created_at)
SELECT
  client_id, scope_id, 'Q1 launch project plan', 'Gantt chart + milestone tracker for product launch.', 'Operations', 'completed'::delivery_status, 3::numeric, NULL::numeric, false, now() - interval '15 days', now() - interval '15 days'
FROM evergreen
UNION ALL
SELECT
  client_id, scope_id, 'Go-to-market messaging', 'Positioning doc, value props, target personas.', 'Strategy', 'completed'::delivery_status, 3::numeric, NULL::numeric, false, now() - interval '10 days', now() - interval '10 days'
FROM evergreen
UNION ALL
SELECT
  client_id, scope_id, 'Partner outreach template', 'Email + LinkedIn templates for partnership development.', 'Marketing', 'completed'::delivery_status, 2::numeric, NULL::numeric, false, now() - interval '7 days', now() - interval '7 days'
FROM evergreen
UNION ALL
SELECT
  client_id, scope_id, 'Launch event logistics', 'Coordinated virtual launch event: Zoom setup, email invites.', 'Operations', 'in_progress'::delivery_status, 2::numeric, NULL::numeric, false, NULL, now() - interval '3 days'
FROM evergreen;

-- ============================================
-- STEP 3: Client approvals skipped (schema mismatch)
-- ============================================
-- You can add approvals manually via the UI later

-- ============================================
-- SUCCESS - Show summary
-- ============================================
SELECT
  c.company_name,
  sa.total_allocated || ' ' || sa.unit_label as scope,
  COUNT(di.id) as deliveries,
  COALESCE(SUM(di.scope_cost) FILTER (WHERE NOT di.is_out_of_scope), 0) as used,
  ROUND(COALESCE(SUM(di.scope_cost) FILTER (WHERE NOT di.is_out_of_scope), 0) / sa.total_allocated * 100) || '%' as percentage
FROM clients c
LEFT JOIN scope_allocations sa ON sa.client_id = c.id
LEFT JOIN delivery_items di ON di.client_id = c.id
WHERE c.operator_id = '26d5a8ee-7746-4f46-99c6-620f805e7e01'
AND c.company_name IN ('Acme Corp', 'Bright Ideas Co', 'Summit Strategies', 'Evergreen Growth')
GROUP BY c.company_name, sa.total_allocated, sa.unit_label
ORDER BY c.company_name;
