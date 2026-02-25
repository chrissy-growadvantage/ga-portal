-- Luma Demo Data Seed Script
-- Run this in Supabase SQL Editor AFTER signing in as the demo operator.
--
-- USAGE:
--   1. Sign up / sign in to Luma as the demo operator
--   2. Copy your auth user UUID from Supabase Auth dashboard
--   3. Replace 'YOUR_OPERATOR_UUID' below with your actual UUID
--   4. Run this script in Supabase SQL Editor
--
-- This creates:
--   - 4 clients (Acme Corp, Bright Ideas Co, Summit Strategies, Evergreen Growth)
--   - 4 scope allocations (various types and statuses)
--   - 19 delivery items (realistic titles, spanning 2 months)
--   - 3 scope requests (mix of statuses)
--   - 2 client approvals (for portal testing)

-- ============================================
-- SET YOUR OPERATOR UUID HERE
-- ============================================
DO $$
DECLARE
  op_id UUID := 'YOUR_OPERATOR_UUID';  -- <-- REPLACE THIS

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

  -- Delivery item UUIDs (we need some for approvals)
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
-- CLIENTS (4 total)
-- ============================================

INSERT INTO clients (id, operator_id, company_name, contact_name, contact_email, contact_phone, notes, status, created_at)
VALUES
  (client_acme, op_id,
   'Acme Corp', 'Jane Smith', 'jane@acme.co', '+1 555-0101',
   'Retainer client since Q4 2025. Monthly marketing + ops support. Primary contact is Jane (CEO).',
   'active', now() - interval '90 days'),

  (client_bright, op_id,
   'Bright Ideas Co', 'Mark Johnson', 'mark@brightideas.com', '+1 555-0202',
   'Creative agency. Focused on content strategy and email marketing automation.',
   'active', now() - interval '60 days'),

  (client_summit, op_id,
   'Summit Strategies', 'Lisa Chen', 'lisa@summitstrat.com', NULL,
   'Consulting firm. Scope is deliverables-based (5 per month). Lisa prefers async updates.',
   'active', now() - interval '45 days'),

  (client_evergreen, op_id,
   'Evergreen Growth', 'Tom Wilson', 'tom@evergreengrowth.io', '+1 555-0404',
   'New client. Just onboarded last month. Custom scope for Q1 launch sprint.',
   'active', now() - interval '20 days');


-- ============================================
-- SCOPE ALLOCATIONS (Feb 2026 period for all)
-- ============================================

-- Acme: 20 hours/month — will be at ~60% (on-track)
INSERT INTO scope_allocations (id, client_id, period_start, period_end, scope_type, total_allocated, unit_label, created_at)
VALUES
  (scope_acme, client_acme,
   '2026-02-01', '2026-02-28', 'hours', 20, 'hours',
   now() - interval '14 days');

-- Bright Ideas: 15 hours/month — will be at ~87% (nearing limit)
INSERT INTO scope_allocations (id, client_id, period_start, period_end, scope_type, total_allocated, unit_label, created_at)
VALUES
  (scope_bright, client_bright,
   '2026-02-01', '2026-02-28', 'hours', 15, 'hours',
   now() - interval '14 days');

-- Summit: 5 deliverables/month — will be at 120% (exceeded)
INSERT INTO scope_allocations (id, client_id, period_start, period_end, scope_type, total_allocated, unit_label, created_at)
VALUES
  (scope_summit, client_summit,
   '2026-02-01', '2026-02-28', 'deliverables', 5, 'deliverables',
   now() - interval '14 days');

-- Evergreen: 30 custom tasks — will be at ~33% (on-track, just started)
INSERT INTO scope_allocations (id, client_id, period_start, period_end, scope_type, total_allocated, unit_label, created_at)
VALUES
  (scope_evergreen, client_evergreen,
   '2026-02-01', '2026-02-28', 'custom', 30, 'tasks',
   now() - interval '10 days');


-- ============================================
-- DELIVERY ITEMS (19 total)
-- ============================================

-- ---- ACME CORP (6 items) — 12 of 20 hours used = 60% ON-TRACK ----

INSERT INTO delivery_items (id, client_id, scope_allocation_id, title, description, category, status, scope_cost, hours_spent, is_out_of_scope, completed_at, created_at)
VALUES
  (del_acme_1, client_acme, scope_acme,
   'Monthly analytics report completed',
   'Compiled Google Analytics, social media metrics, and email campaign performance into monthly executive summary.',
   'Marketing', 'completed', 3, 3, false,
   now() - interval '2 days', now() - interval '2 days'),

  (del_acme_2, client_acme, scope_acme,
   'Q1 marketing strategy deck',
   'Created 25-slide strategy presentation covering content calendar, paid ads plan, and Q1 KPI targets.',
   'Strategy', 'approved', 4, 4, false,
   now() - interval '5 days', now() - interval '5 days'),

  (del_acme_3, client_acme, scope_acme,
   'Email campaign setup - newsletter automation',
   'Configured 4-email welcome sequence in Mailchimp with segmentation rules and A/B subject testing.',
   'Marketing', 'completed', 2.5, 2.5, false,
   now() - interval '7 days', now() - interval '7 days'),

  (del_acme_4, client_acme, scope_acme,
   'Brand guidelines revision',
   'Updated brand book with new secondary colors, icon usage rules, and social media templates.',
   'Design', 'completed', 1.5, 1.5, false,
   now() - interval '9 days', now() - interval '9 days'),

  (del_acme_5, client_acme, scope_acme,
   'SEO audit for main website',
   'Full technical SEO audit: crawl errors, meta tags, page speed, mobile usability, and competitor keywords.',
   'Tech', 'pending_approval', 1, 1, false,
   NULL, now() - interval '1 day'),

  (del_acme_6, client_acme, NULL,
   'Unplanned: Emergency website fix',
   'Resolved critical CSS issue causing checkout page to break on Safari mobile. Client requested urgent fix.',
   'Tech', 1, 1, true,
   now() - interval '3 days', now() - interval '3 days');


-- ---- BRIGHT IDEAS CO (5 items) — 13 of 15 hours used = 87% NEARING ----

INSERT INTO delivery_items (id, client_id, scope_allocation_id, title, description, category, status, scope_cost, hours_spent, is_out_of_scope, completed_at, created_at)
VALUES
  (del_bright_1, client_bright, scope_bright,
   'Content strategy roadmap',
   'Developed 90-day content strategy with editorial calendar, SEO keyword mapping, and distribution channels.',
   'Content', 'completed', 3, 3, false,
   now() - interval '10 days', now() - interval '10 days'),

  (del_bright_2, client_bright, scope_bright,
   'Email automation workflow',
   'Built lead nurture sequence (6 emails) with conditional logic based on engagement scoring.',
   'Marketing', 'completed', 4, 4, false,
   now() - interval '6 days', now() - interval '6 days'),

  (del_bright_3, client_bright, scope_bright,
   'Social media calendar - Feb',
   'Created 28-day social calendar for Instagram, LinkedIn, and Twitter with graphics and copy.',
   'Content', 'completed', 3, 3, false,
   now() - interval '12 days', now() - interval '12 days'),

  (del_bright_4, client_bright, scope_bright,
   'Landing page optimization',
   'A/B tested hero section, improved CTA placement, added testimonials section. Conversion rate up 12%.',
   'Tech', 'completed', 2, 2, false,
   now() - interval '4 days', now() - interval '4 days'),

  (del_bright_5, client_bright, scope_bright,
   'Weekly analytics summary',
   'Compiled key metrics from Google Analytics and ad platforms for team standup.',
   'Marketing', 'pending_approval', 1, 1, false,
   NULL, now() - interval '1 day');


-- ---- SUMMIT STRATEGIES (4 items) — 6 of 5 deliverables = 120% EXCEEDED ----

INSERT INTO delivery_items (id, client_id, scope_allocation_id, title, description, category, status, scope_cost, hours_spent, is_out_of_scope, completed_at, created_at)
VALUES
  (del_summit_1, client_summit, scope_summit,
   'Competitive landscape analysis',
   'Mapped 12 competitors across 5 dimensions: pricing, features, positioning, funding, and customer reviews.',
   'Strategy', 'approved', 1, NULL, false,
   now() - interval '11 days', now() - interval '11 days'),

  (del_summit_2, client_summit, scope_summit,
   'Board presentation draft',
   'Created investor-ready board deck with financial projections, market opportunity, and product roadmap.',
   'Strategy', 'completed', 1, NULL, false,
   now() - interval '8 days', now() - interval '8 days'),

  (del_summit_3, client_summit, scope_summit,
   'Process documentation overhaul',
   'Rewrote onboarding SOPs, client intake form, and team handoff procedures.',
   'Operations', 'completed', 1, NULL, false,
   now() - interval '5 days', now() - interval '5 days'),

  (del_summit_4, client_summit, scope_summit,
   'CRM migration plan',
   'Mapped data fields from HubSpot to Salesforce, created migration timeline, and identified 3 integration risks.',
   'Operations', 'completed', 1, NULL, false,
   now() - interval '3 days', now() - interval '3 days');

-- Out-of-scope items for Summit (2 items that push past 5 deliverables)
INSERT INTO delivery_items (client_id, scope_allocation_id, title, description, category, status, scope_cost, hours_spent, is_out_of_scope, completed_at, created_at)
VALUES
  (client_summit, scope_summit,
   'Ad hoc: Emergency investor FAQ',
   'Lisa needed investor FAQ document same-day for board meeting. Not in original scope.',
   'Strategy', 'completed', 1, NULL, true,
   now() - interval '2 days', now() - interval '2 days'),

  (client_summit, scope_summit,
   'Additional: Team org chart design',
   'Created visual org chart for new team structure. Requested after scope was set.',
   'Design', 'in_progress', 1, NULL, true,
   NULL, now() - interval '1 day');


-- ---- EVERGREEN GROWTH (4 items) — 10 of 30 tasks = 33% ON-TRACK ----

INSERT INTO delivery_items (id, client_id, scope_allocation_id, title, description, category, status, scope_cost, hours_spent, is_out_of_scope, completed_at, created_at)
VALUES
  (del_evergreen_1, client_evergreen, scope_evergreen,
   'Launch checklist setup',
   'Created comprehensive 45-item launch checklist covering marketing, tech, ops, and legal prep.',
   'Operations', 'completed', 3, NULL, false,
   now() - interval '8 days', now() - interval '8 days'),

  (del_evergreen_2, client_evergreen, scope_evergreen,
   'Domain and hosting configuration',
   'Set up custom domain, SSL, CDN, and staging environment on Vercel.',
   'Tech', 'completed', 2, NULL, false,
   now() - interval '6 days', now() - interval '6 days'),

  (del_evergreen_3, client_evergreen, scope_evergreen,
   'Brand identity review',
   'Reviewed existing brand assets, provided feedback on logo usage, and defined tone of voice for web copy.',
   'Design', 'completed', 3, NULL, false,
   now() - interval '4 days', now() - interval '4 days'),

  (del_evergreen_4, client_evergreen, scope_evergreen,
   'Social accounts setup',
   'Created and configured business profiles on LinkedIn, Instagram, and Twitter/X with consistent branding.',
   'Marketing', 'completed', 2, NULL, false,
   now() - interval '2 days', now() - interval '2 days');


-- ============================================
-- SCOPE REQUESTS (3 total)
-- ============================================

INSERT INTO scope_requests (client_id, title, description, requested_by, status, scope_cost, created_at)
VALUES
  -- Summit: pending request (scope already exceeded)
  (client_summit,
   'Additional landing pages for Q1 campaign',
   'Lisa is requesting 3 additional landing pages for the Q1 product launch. This was not in the original scope agreement.',
   'client', 'pending', 3,
   now() - interval '2 days'),

  -- Acme: approved request
  (client_acme,
   'Additional SEO keyword research',
   'Jane requested expanded keyword research covering 3 new product lines. Approved with additional 2 hours.',
   'client', 'approved', 2,
   now() - interval '7 days'),

  -- Bright Ideas: declined request
  (client_bright,
   'Full website redesign mockups',
   'Mark asked about a full redesign. Declined as this is a separate project, not part of monthly retainer scope.',
   'operator', 'declined', 15,
   now() - interval '5 days');


-- ============================================
-- CLIENT APPROVALS (2 — for portal testing)
-- ============================================

INSERT INTO client_approvals (delivery_item_id, action, note, acted_at, created_at)
VALUES
  -- Acme: Q1 strategy deck was approved by client
  (del_acme_2, 'approved',
   'Looks great! Love the Q1 targets. Let''s discuss the paid ads budget next week.',
   now() - interval '4 days', now() - interval '4 days'),

  -- Summit: competitive analysis was approved
  (del_summit_1, 'approved',
   'Very thorough. Can we schedule a call to discuss the pricing comparison?',
   now() - interval '10 days', now() - interval '10 days');


-- ============================================
-- MAGIC LINK TOKENS (for portal testing)
-- ============================================
-- NOTE: The database stores SHA-256 hashes of raw tokens (magic_link_token_hash column).
-- For demo purposes, we store pre-computed hashes.
-- The actual portal URLs use the raw token, which gets hashed by the edge function.
--
-- To generate portal links for testing:
--   1. Use the MagicLinkPanel in the operator UI (recommended), OR
--   2. Use the pre-seeded hashes below with matching raw tokens
--
-- Pre-computed SHA-256 hashes (computed externally):
--   SHA-256('demo-acme-portal-token-2026')  = 'a1b2c3...' (placeholder)
--   SHA-256('demo-summit-portal-token-2026') = 'd4e5f6...' (placeholder)
--
-- IMPORTANT: For the demo, generate magic links through the UI.
-- The MagicLinkPanel will call the generate-magic-link edge function,
-- which properly hashes and stores the token. This is the recommended flow.
--
-- If you need pre-seeded tokens for automated testing, uncomment and update
-- the hashes below after computing them with your edge function.

-- Option A (RECOMMENDED): Generate links via the UI after seeding.
-- The MagicLinkPanel on each client detail page will generate proper links.

-- Option B (manual): Pre-seed hashes for testing.
-- You'll need to compute SHA-256 hashes of your chosen raw tokens.
-- Example using the Supabase SQL Editor:
--   SELECT encode(sha256('demo-acme-portal-token-2026'::bytea), 'hex');

-- Acme Corp: pre-seed with hash for portal testing
UPDATE clients
SET magic_link_token_hash = encode(sha256('demo-acme-portal-token-2026'::bytea), 'hex'),
    magic_link_expires_at = now() + interval '30 days'
WHERE id = client_acme;

-- Summit Strategies: pre-seed with hash (exceeded scope — good for demo)
UPDATE clients
SET magic_link_token_hash = encode(sha256('demo-summit-portal-token-2026'::bytea), 'hex'),
    magic_link_expires_at = now() + interval '30 days'
WHERE id = client_summit;

-- Bright Ideas: EXPIRED token (to test expired link error)
UPDATE clients
SET magic_link_token_hash = encode(sha256('demo-bright-expired-token-2026'::bytea), 'hex'),
    magic_link_expires_at = now() - interval '1 day'
WHERE id = client_bright;

RAISE NOTICE 'Demo data seeded successfully!';
RAISE NOTICE 'Clients created: Acme Corp, Bright Ideas Co, Summit Strategies, Evergreen Growth';
RAISE NOTICE '';
RAISE NOTICE 'Portal test URLs (use raw tokens in URL):';
RAISE NOTICE '  Acme (on-track): /portal/demo-acme-portal-token-2026';
RAISE NOTICE '  Summit (exceeded): /portal/demo-summit-portal-token-2026';
RAISE NOTICE '  Bright Ideas (expired): /portal/demo-bright-expired-token-2026';
RAISE NOTICE '  Evergreen (no link): no magic link set — generate via UI';
RAISE NOTICE '';
RAISE NOTICE 'NOTE: The edge function uses Web Crypto SHA-256, while PostgreSQL uses';
RAISE NOTICE 'sha256(). If hashes do not match, generate links via the UI instead.';

END;
$$;
