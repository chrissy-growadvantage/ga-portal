# Luma Schema Validation & Architecture Review

**Date:** 2026-02-15
**Reviewer:** Architecture Agent
**Scope:** Phase 1b (scope management) + Phase 1c (magic link portal)

---

## 1. Schema Validation Summary

### Current State (after 10 migrations)

The database has 7 tables: `operators`, `clients`, `scope_allocations`, `delivery_items`, `scope_requests`, `client_approvals`, `audit_log`.

### CRITICAL: `operators` Table Identity Confusion

**Severity: HIGH**

Migrations 007/008 reference `operators.user_id` instead of `operators.id`. The initial schema (001) creates `operators` with `id UUID PRIMARY KEY REFERENCES auth.users(id)` — meaning the PK **is** the auth user ID. But migrations 007/008 attempt to reference `operators.user_id` which doesn't exist in the original schema.

**What likely happened:** A manual alteration added a `user_id` column to the live database, diverging from the migration trail. The FK constraint `clients.operator_id → operators.user_id` was applied in migration 008 with a `TRUNCATE TABLE clients CASCADE`.

**Recommendation:** Verify the live database schema. If `operators` has both `id` and `user_id`, consolidate to match the spec (use `id` as PK = auth.users.id). The TypeScript types in `database.ts` use `id`, the hooks use `auth.uid()` for operator identity, and RLS policies in 003 use `auth.uid() = id` — all consistent with the original design.

**Action needed:** Run this diagnostic query on production:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'operators'
ORDER BY ordinal_position;
```

### Schema vs. SPEC.md Comparison

| Feature | SPEC Says | Current Schema | Status |
|---------|-----------|----------------|--------|
| `clients.name` | `name TEXT` | `company_name TEXT` | DIVERGED — TypeScript uses `company_name`, which is fine. Spec says `name` but code says `company_name`. **No action needed** — `company_name` is more descriptive. |
| `clients.magic_link_token_hash` | SHA-256 hash stored | Column renamed in 002 | OK |
| `clients.contact_phone` | Not in spec | Exists in schema | OK — extra field, harmless |
| `scope_allocations` unique constraint | `(client_id, period_start, period_end)` | Added in 002 | OK |
| `delivery_items.hours_spent` | `NUMERIC CHECK >= 0` | Has check constraint | OK |
| `delivery_items.category` | TEXT | Converted from enum in 009/010 | OK |
| `audit_log` | Full spec table | Created in 002 | OK |
| `audit_log.action` | TEXT CHECK constraint | Uses `audit_action` ENUM | MINOR — enum is more restrictive but acceptable |

### Missing from Schema (Required for Phase 1b/1c)

#### 1. No `hours_spent` field on `DeliveryItem` (TypeScript has it, schema has it) — OK

#### 2. Missing: Operator branding fields for portal
The portal `PortalLayout` component references `operatorName` and `businessName`. These exist in the `operators` table. OK.

#### 3. Missing: `operator_id` on portal response
The edge function needs to join through `clients.operator_id → operators` to get operator branding for the portal. This join path exists. OK.

---

## 2. Scope Tracking Validation

### Scope Calculation Query Pattern

The 5-tier scope status requires computing: `used = SUM(scope_cost) WHERE is_out_of_scope = false AND scope_allocation_id = ?`

**Current hook (`useScope.ts`):** Only fetches `scope_allocations`, doesn't compute used scope. The frontend must calculate used scope from delivery items.

**Recommended approach:** Keep calculation client-side for MVP (simple SUM). For scale, add a database view:

```sql
CREATE VIEW scope_summary AS
SELECT
  sa.id AS allocation_id,
  sa.client_id,
  sa.total_allocated,
  sa.unit_label,
  sa.scope_type,
  sa.period_start,
  sa.period_end,
  COALESCE(SUM(di.scope_cost) FILTER (WHERE di.is_out_of_scope = false), 0) AS used,
  sa.total_allocated - COALESCE(SUM(di.scope_cost) FILTER (WHERE di.is_out_of_scope = false), 0) AS remaining,
  COALESCE(SUM(di.scope_cost) FILTER (WHERE di.is_out_of_scope = true), 0) AS out_of_scope_total
FROM scope_allocations sa
LEFT JOIN delivery_items di ON di.scope_allocation_id = sa.id
GROUP BY sa.id;
```

**Note:** This view is optional for MVP. The frontend already has `src/lib/constants.ts` with tier thresholds. Client-side calculation is fine for <1000 delivery items per client per period.

### Out-of-Scope Tracking

The `delivery_items.is_out_of_scope` boolean is present. Items flagged as out-of-scope should NOT count toward `used` in scope calculations. The `scope_cost` on OOS items still tracks the effort cost for reporting purposes.

**Status: Schema supports this correctly.**

---

## 3. Portal Authentication Architecture

### Design: Token-Based Stateless Auth

```
┌─────────────────┐          ┌──────────────────────┐         ┌────────────┐
│  Client Browser  │──GET────▶│  Edge Function        │────────▶│  Supabase  │
│  /portal/:token  │          │  /client-portal       │  service │  PostgreSQL│
│  (no auth)       │◀─JSON───│  (Deno, service role) │◀─role───│            │
└─────────────────┘          └──────────────────────┘         └────────────┘
                                      │
                              ┌───────┴───────┐
                              │ 1. Hash token  │
                              │ 2. Lookup hash │
                              │ 3. Check expiry│
                              │ 4. Return data │
                              └───────────────┘
```

### Edge Function: `client-portal` (GET)

**Authentication flow:**
1. Client visits `/portal/{raw_token}` — React extracts token from URL
2. React calls `GET /functions/v1/client-portal?token={raw_token}`
3. Edge function computes `SHA-256(raw_token)` → `token_hash`
4. Queries `clients WHERE magic_link_token_hash = token_hash`
5. Checks `magic_link_expires_at > now()` — returns 410 if expired
6. Fetches client + scope + deliveries + approvals using **service role key** (bypasses RLS)
7. Returns shaped response (see SPEC.md response schema)

### Edge Function: `client-action` (POST)

**Client approval flow:**
1. Client clicks "Approve" or "Request Revision" on a delivery item
2. React POSTs to `/functions/v1/client-action` with `{ token, delivery_item_id, action, note? }`
3. Edge function validates token (same SHA-256 lookup + expiry check)
4. Verifies `delivery_item.client_id` matches the token's client — returns 403 if mismatch
5. Inserts into `client_approvals` table
6. Updates `delivery_items.status` to `approved` or `revision_requested`
7. Writes audit log entry with `actor_type = 'client'`

### Edge Function: `generate-magic-link` (POST, Operator Auth Required)

**Token generation flow:**
1. Operator clicks "Generate Portal Link" in client settings
2. React POSTs to `/functions/v1/generate-magic-link` with `{ client_id, expires_in_days? }`
3. Edge function verifies operator auth via JWT
4. Verifies operator owns the client (`clients.operator_id = auth.uid()`)
5. Generates `raw_token = crypto.randomUUID()`
6. Computes `token_hash = SHA-256(raw_token)`
7. Updates `clients SET magic_link_token_hash = token_hash, magic_link_expires_at = now() + interval`
8. Returns `{ magic_link_url, expires_at }` — raw token only sent once, never stored

### Security Considerations

| Concern | Mitigation |
|---------|------------|
| Token in URL visible in logs/referer | Use fragment (`#token=...`) OR accept risk for MVP (short-lived tokens) |
| Service role key exposure | Edge functions run server-side in Deno — key never reaches browser |
| Token brute force | 128-bit UUID = 2^128 possibilities. Rate limiting adds defense in depth |
| Replay after expiry | Edge function checks `magic_link_expires_at` on every request |
| Cross-client data access | Edge function validates `delivery_item.client_id = token_client.id` |
| Token regeneration | Old hash overwritten — previous link immediately invalid |

### Rate Limiting Strategy

Supabase Edge Functions don't have built-in per-token rate limiting. Options:

**Option A (Recommended for MVP):** Use Supabase's built-in rate limiting at the project level (default: 500 req/sec). Accept this for launch.

**Option B (Phase 2):** Implement token-based rate limiting using a `rate_limits` table:

```sql
CREATE TABLE portal_rate_limits (
  token_hash TEXT PRIMARY KEY,
  request_count INT DEFAULT 0,
  window_start TIMESTAMPTZ DEFAULT now()
);

-- Check/increment in edge function:
-- If window_start < now() - interval '1 minute', reset counter
-- If request_count >= 60, return 429
```

**Recommendation:** Go with Option A for MVP. The 128-bit token entropy makes brute force infeasible regardless. Rate limiting is a defense-in-depth measure, not primary security.

---

## 4. RLS Policy Review

### Operator Isolation — PASS

All tables use the pattern:
- Direct: `operator_id = auth.uid()` (clients)
- Chain: `client_id IN (SELECT id FROM clients WHERE operator_id = auth.uid())` (scope_allocations, delivery_items, scope_requests)
- Deep chain: `delivery_item_id IN (SELECT ... WHERE client_id IN (SELECT ... WHERE operator_id = auth.uid()))` (client_approvals)

**This is correct.** Operator A cannot see Operator B's data.

### Portal Edge Function vs RLS — CORRECT PATTERN

Edge functions use the **service role key** which bypasses RLS entirely. This is the correct approach because:
- Portal users are unauthenticated (no `auth.uid()`)
- Token validation happens in application code (edge function)
- The edge function acts as a controlled gateway — it queries exactly what's needed and shapes the response

**No RLS changes needed for portal.** The edge function handles access control via token validation.

### Potential Issues

#### Issue 1: `client_approvals` — No INSERT policy for operators
The schema has no INSERT policy on `client_approvals` for operators (comments say "written by edge function"). This is correct for the portal flow. But if an operator ever needs to manually add an approval record, they can't.

**Recommendation:** Keep as-is. Approvals should only come from clients via the portal. If operator needs to override, use `client-action` edge function with a separate operator endpoint.

#### Issue 2: `audit_log` — No INSERT policy
The `write_audit_log` function is `SECURITY DEFINER`, so it bypasses RLS to insert. This is correct. Operators can only SELECT their own audit entries.

**Status: PASS — No issues found.**

#### Issue 3: Nested subqueries in RLS could be slow
The 3-level chain for `client_approvals` does:
```sql
delivery_item_id IN (SELECT ... WHERE client_id IN (SELECT ... WHERE operator_id = auth.uid()))
```

For operators with many clients × many delivery items, this could get slow. PostgreSQL's query planner usually handles this well with the existing indexes, but monitor.

**Recommendation:** If performance degrades, add a denormalized `operator_id` column to `delivery_items` and `client_approvals`. But NOT for MVP.

---

## 5. Performance Recommendations

### Indexes — Current State Assessment

| Index | Purpose | Status |
|-------|---------|--------|
| `idx_clients_operator` | RLS policy queries | EXISTS |
| `idx_clients_magic_token_hash` | Portal token lookup | EXISTS |
| `idx_scope_alloc_client` | Scope queries by client | EXISTS |
| `idx_scope_alloc_client_period` | Period-based scope lookups | EXISTS |
| `idx_delivery_client` | Delivery queries by client | EXISTS |
| `idx_delivery_scope_alloc` | Join deliveries to allocations | EXISTS |
| `idx_delivery_client_completed` | Date-range delivery queries | EXISTS |
| `idx_scope_req_client` | Scope request queries | EXISTS |
| `idx_scope_req_client_status` | Filtered request lists | EXISTS |
| `idx_approval_delivery` | Approval lookups | EXISTS |
| `idx_audit_entity` | Audit log entity queries | EXISTS |
| `idx_audit_actor` | Audit log actor queries | EXISTS |
| `idx_audit_created` | Audit log time queries | EXISTS |

**All spec-required indexes exist. No additions needed.**

### Portal Query Performance

The portal edge function needs to fetch in a single call:
1. Client basic info
2. Current period scope allocation
3. Delivery items (paginated)
4. Latest approval per delivery item
5. Scope requests

**Recommended query strategy for edge function:**

```sql
-- Single query using Supabase's PostgREST joins:
-- 1. Client + current scope allocation
SELECT c.id, c.company_name, c.status,
       o.full_name AS operator_name, o.business_name
FROM clients c
JOIN operators o ON o.id = c.operator_id  -- or user_id, depending on live schema
WHERE c.magic_link_token_hash = $1;

-- 2. Current scope allocation
SELECT * FROM scope_allocations
WHERE client_id = $client_id
  AND period_start <= CURRENT_DATE
  AND period_end >= CURRENT_DATE
ORDER BY created_at DESC
LIMIT 1;

-- 3. Delivery items with latest approval (paginated)
SELECT di.*,
       ca.action AS approval_action,
       ca.note AS approval_note,
       ca.acted_at AS approval_acted_at
FROM delivery_items di
LEFT JOIN LATERAL (
  SELECT action, note, acted_at
  FROM client_approvals
  WHERE delivery_item_id = di.id
  ORDER BY acted_at DESC
  LIMIT 1
) ca ON true
WHERE di.client_id = $client_id
ORDER BY di.created_at DESC
LIMIT $per_page OFFSET ($page - 1) * $per_page;

-- 4. Scope requests
SELECT * FROM scope_requests
WHERE client_id = $client_id
ORDER BY created_at DESC;
```

**Performance notes:**
- All queries use existing indexes
- LATERAL join for latest approval avoids N+1
- Pagination prevents unbounded result sets
- Expected latency: <50ms for typical client with <100 delivery items

### Edge Function Cold Start

Supabase Edge Functions (Deno) have ~200-500ms cold start. Mitigations:
1. **Keep functions warm** with a cron health check (optional)
2. **Minimize dependencies** — use only `@supabase/supabase-js` and built-in Deno crypto
3. **Response caching** — Portal data is read-heavy. Add `Cache-Control: max-age=30` for GET requests

---

## 6. Required SQL Migration (011)

Based on the review, one migration is needed to align the schema with the spec. The TypeScript types reference `magic_link_token` (not `_hash`) and the column was renamed in migration 002. The types need updating, not the schema.

### TypeScript Type Fix Needed

In `src/types/database.ts`, the `Client` interface has:
```typescript
magic_link_token: string | null;     // Should be: magic_link_token_hash
magic_link_expires_at: string | null;
```

This needs to be updated to match the actual column name after migration 002.

### Optional: Scope Summary View

```sql
-- Migration 011: Add scope summary view for portal performance
CREATE OR REPLACE VIEW scope_summary AS
SELECT
  sa.id AS allocation_id,
  sa.client_id,
  sa.total_allocated,
  sa.unit_label,
  sa.scope_type,
  sa.period_start,
  sa.period_end,
  COALESCE(SUM(di.scope_cost) FILTER (WHERE di.is_out_of_scope = false), 0) AS used,
  sa.total_allocated - COALESCE(SUM(di.scope_cost) FILTER (WHERE di.is_out_of_scope = false), 0) AS remaining,
  COALESCE(SUM(di.scope_cost) FILTER (WHERE di.is_out_of_scope = true), 0) AS out_of_scope_total,
  COUNT(di.id) FILTER (WHERE di.is_out_of_scope = false) AS in_scope_count,
  COUNT(di.id) FILTER (WHERE di.is_out_of_scope = true) AS out_of_scope_count
FROM scope_allocations sa
LEFT JOIN delivery_items di ON di.scope_allocation_id = sa.id
GROUP BY sa.id;
```

---

## 7. Summary of Findings

### Blockers (Fix before Phase 1b/1c)

| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| 1 | `operators` table identity confusion (`id` vs `user_id`) | HIGH | Run diagnostic query, consolidate |
| 2 | `Client.magic_link_token` type should be `magic_link_token_hash` | MEDIUM | Update `database.ts` |

### Non-Blockers (Noted for awareness)

| # | Issue | Priority | Notes |
|---|-------|----------|-------|
| 3 | Nested RLS subqueries on `client_approvals` | LOW | Monitor performance, denormalize if needed |
| 4 | No per-token rate limiting on portal | LOW | Rely on Supabase project-level limits for MVP |
| 5 | Edge function cold starts | LOW | Add `Cache-Control` header, consider warm-up cron |
| 6 | `scope_summary` view | NICE-TO-HAVE | Optional perf optimization |

### What's Ready

- Scope tracking (allocations, delivery items, out-of-scope) — **schema complete**
- Client approval flow (client_approvals table, statuses) — **schema complete**
- Magic link token storage (hashed, with expiry) — **schema complete**
- Audit logging — **schema complete**
- All required indexes — **present**
- RLS policies — **correctly isolate tenants**
- Portal data model — **schema supports full portal response**

---

## 8. Edge Function File Structure (Recommended)

```
supabase/
  functions/
    client-portal/
      index.ts          # GET handler — token validation + data fetch
    client-action/
      index.ts          # POST handler — approve/revision delivery items
    generate-magic-link/
      index.ts          # POST handler — operator generates portal link
    _shared/
      cors.ts           # CORS headers
      validate-token.ts # Shared token validation logic
      supabase.ts       # Service role client init
```

Each function should be <200 lines. The `_shared` directory keeps common logic DRY.
