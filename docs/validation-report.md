# Luma MVP Validation Report

> Product Validator assessment of current build state vs SPEC.md requirements.
> Date: Feb 2026

---

## Build State Summary

**Phase 1a: Core Loop** — Mostly complete. Auth, client CRUD, basic delivery logging, layout shell all working.

**Phase 1b: Scope Management** — In progress. Utilities and constants done. Components being built.

**Phase 1c: Client Portal** — Not started. No portal route, no edge functions, no portal components.

---

## Feature-by-Feature Gap Analysis

### Status Key
- DONE = Implemented and functional
- PARTIAL = Started but incomplete
- BLOCKED = Waiting on dependencies
- MISSING = Not started

---

### Phase 1a (Core Loop)

| Feature | Status | Notes | Risk |
|---------|--------|-------|------|
| Supabase Auth (email + Google) | DONE | Login, AuthCallback, useAuth all working | None |
| Operator row auto-creation | DONE | DB trigger on auth.users | None |
| Client CRUD | DONE | Create, read, update, delete with RLS | None |
| Client list on Dashboard | DONE | Shows cards with avatar, name, status badge | Low |
| Client detail page | DONE | Contact info, tabs for deliveries/scope | Low |
| Manual delivery entry (dialog) | DONE | LogDeliveryDialog with title, desc, category, status, hours | Low |
| Delivery list in client detail | DONE | Cards with status icons, category badges, dates | Low |
| AppShell layout (sidebar + header) | DONE | Responsive sidebar, header, Outlet | None |
| RLS policies | DONE | All tables secured, operator isolation verified | None |

**Phase 1a Assessment:** Solid foundation. Minor UX polish needed (see below).

---

### Phase 1b (Scope Management)

| Feature | Status | Notes | Risk |
|---------|--------|-------|------|
| scope_allocations table + CRUD | DONE | DB schema, hooks (useScope, useCreateScope, etc.) | None |
| Scope calculation utilities | DONE | `scope-utils.ts` with calculateScope, getScopeStatus, formatScopeValue | None |
| Scope status constants | DONE | SCOPE_STATUS_CONFIG with 5 tiers, colors, labels | None |
| Scope CSS variables | DONE | `--scope-on-track`, `--scope-active`, etc. in index.css | None |
| **ScopeTracker component** | IN PROGRESS | Task #6 completed, but component not yet in file system | **HIGH** |
| **ScopeTrackerCompact component** | MISSING | Task #7 pending | **HIGH** |
| **ScopeAllocationForm component** | MISSING | Task #8 pending | **HIGH** |
| **ScopeRequestCard component** | MISSING | No task created | **MEDIUM** |
| Scope tab in ClientDetail | PARTIAL | Basic list of allocations, no tracker widget, placeholder text | **HIGH** |
| Dashboard scope indicators | MISSING | Client cards don't show scope progress | **HIGH** |
| Out-of-scope delivery flagging | PARTIAL | DB field exists, LogDeliveryDialog lacks out-of-scope toggle | **MEDIUM** |
| Scope request CRUD | PARTIAL | DB table exists, no UI components | **MEDIUM** |
| Empty state for scope | PARTIAL | Says "Scope tracking will be available in Phase 1b" — needs real CTA | **LOW** |

**Phase 1b Assessment: CRITICAL GAP.** The scope tracker is the #1 differentiator (RICE: 10.8). Without the ScopeTracker rendering in ClientDetail and ScopeTrackerCompact on Dashboard, the demo fails. These are the most important visual components to build.

---

### Phase 1c (Client Portal)

| Feature | Status | Notes | Risk |
|---------|--------|-------|------|
| Portal route (`/portal/:token`) | IN PROGRESS | Task #11 in progress | **CRITICAL** |
| Portal layout (no sidebar, max-w-2xl) | MISSING | No PortalLayout component | **CRITICAL** |
| Token validation edge function | MISSING | Task #17 pending | **CRITICAL** |
| client-action edge function | MISSING | No edge function for approvals | **CRITICAL** |
| generate-magic-link edge function | MISSING | No edge function for link generation | **CRITICAL** |
| PortalScopeCard | MISSING | Task #12 pending (blocked on #11) | **HIGH** |
| PortalTimeline | MISSING | Task #12 pending | **HIGH** |
| ApprovalCard | MISSING | Task #12 pending | **HIGH** |
| MagicLinkPanel (operator UI) | MISSING | Task #14 pending | **HIGH** |
| Portal error states | MISSING | No error pages for invalid/expired tokens | **MEDIUM** |
| Portal past months | MISSING | Collapsible history section | **LOW** |
| usePortalData hook | MISSING | Task #17 pending | **HIGH** |

**Phase 1c Assessment: NOT STARTED.** Portal is in progress (route being set up) but none of the portal components, edge functions, or magic link flows exist yet. This is the entire "client sees value" proof point.

---

### Cross-Cutting UX Components

| Feature | Status | Notes | Risk |
|---------|--------|-------|------|
| EmptyState component | DONE | In `components/ui/empty-state.tsx`, matches spec | None |
| StatusBadge component | IN PROGRESS | Task #13 in progress | **MEDIUM** |
| QuickAddDelivery component | MISSING | Task #15 pending | **HIGH** |
| DeliveryTimeline component | MISSING | Task #16 pending | **HIGH** |
| OnboardingChecklist | MISSING | No task created | **LOW** |

---

## Design System Compliance Check

| Area | Status | Issue |
|------|--------|-------|
| Primary color (warm indigo #5B4DC7) | DONE | CSS variable correct in index.css |
| Background (warm off-white #FDFBF8) | DONE | `--background: 40 20% 98%` correct |
| Fonts (Plus Jakarta Sans + JetBrains Mono) | DONE | Google Fonts import in index.css |
| Heading weights (800/700/600/600) | PARTIAL | h1 uses `font-extrabold` (800) OK, but pages use `text-2xl font-bold` — should be `text-3xl font-extrabold` for Display level |
| Letter spacing | DONE | h1 -0.02em, h2 -0.015em, h3 -0.01em in CSS |
| Card hover animation | DONE | `.card-interactive` class with translateY + shadow |
| Status badges triple encoding | IN PROGRESS | Currently only color + text, missing icons |
| Scope numbers in font-mono | DONE IN SPEC | Not yet implemented (no scope tracker rendering) |
| Portal overrides | DONE IN CSS | Variables defined, no portal page to use them |
| Reduced motion | DONE | `prefers-reduced-motion` media query in CSS |
| Noise texture on body | DONE | SVG background-image in body styles |

---

## Critical Path to Demo-Ready

### Priority 1: MUST BUILD (Demo Blockers)

1. **ScopeTracker component** — Render in ClientDetail scope tab with real data
2. **ScopeTrackerCompact** — Show on Dashboard client cards
3. **ScopeAllocationForm** — Let operator create scope (otherwise tracker has no data)
4. **Portal route + layout** — `/portal/:token` with clean single-scroll page
5. **Portal edge functions** — At minimum `client-portal` (GET) and `generate-magic-link` (POST)
6. **MagicLinkPanel** — Operator needs to generate the link
7. **PortalScopeCard + PortalTimeline** — Client must see scope and deliveries
8. **QuickAddDelivery** — Primary operator action, demo centerpiece

### Priority 2: SHOULD BUILD (Demo Polish)

9. **ApprovalCard** — Client approval flow in portal
10. **DeliveryTimeline** — Grouped timeline replaces flat list
11. **StatusBadge** — Unified status display with triple encoding
12. **client-action edge function** — Approval submission from portal
13. **Out-of-scope toggle** in LogDeliveryDialog
14. **Portal error states** — Invalid/expired token pages

### Priority 3: NICE TO HAVE (Post-Demo)

15. **OnboardingChecklist** — First-run guidance
16. **ScopeRequestCard** — Out-of-scope request management
17. **Portal past months** — History view
18. **PDF export** — P1 feature teaser

---

## Specific Issues Found

### Issue 1: Scope Tab Placeholder Text
**File:** `src/pages/ClientDetail.tsx:254`
**Problem:** Scope empty state says "Scope tracking will be available in Phase 1b" — this is developer placeholder text, not a user-facing empty state.
**Fix:** Use EmptyState component: title "No scope defined", description "Define how much you've agreed to deliver — Luma will track usage automatically", CTA "Set up scope allocation".

### Issue 2: Dashboard Doesn't Show Scope
**File:** `src/pages/Dashboard.tsx`
**Problem:** Client cards show avatar + name + status badge only. No scope indicator.
**Fix:** Add ScopeTrackerCompact below client name in each card once component is built.

### Issue 3: DeliveryItem Missing Fields in Dialog
**File:** `src/components/deliveries/LogDeliveryDialog.tsx`
**Problem:** Dialog doesn't have `is_out_of_scope` toggle or `scope_cost` field. These are critical for scope tracking to work.
**Fix:** Add out-of-scope checkbox and scope_cost number input.

### Issue 4: No Portal Route in App.tsx
**File:** `src/App.tsx`
**Problem:** No `/portal/:token` route defined. Portal page will 404.
**Fix:** Add public route (outside ProtectedRoute) for portal.

### Issue 5: `totalDeliveries` Stat Never Calculated
**File:** `src/pages/Dashboard.tsx:14-17`
**Problem:** `totalDeliveries` always returns 0 — the reduce function body just returns `sum` without adding anything.
**Fix:** Count delivery_items from nested select: `sum + (c.delivery_items?.length ?? 0)`.

### Issue 6: Status Badges Use Generic Colors
**File:** `src/lib/constants.ts`
**Problem:** CLIENT_STATUS_CONFIG and DELIVERY_STATUS_CONFIG use Tailwind utility classes (`bg-green-100 text-green-700`) instead of design system semantic tokens (`success`, `primary`, `accent-warm`).
**Fix:** Align colors with design system tokens once StatusBadge component is built.

### Issue 7: Client Type Mismatch
**File:** `src/types/database.ts:32`
**Problem:** Client type has `magic_link_token` (plaintext field) but SPEC.md says `magic_link_token_hash` (SHA-256 hash). The actual DB migration uses `magic_link_token` (plaintext).
**Note:** For MVP this is acceptable — can add hashing post-launch. Flag for security review.

---

## Chrissy's Perspective: Would This Impress?

### What Would Impress
- The warm indigo palette feels professional, not cold SaaS
- Client cards with hover animation feel polished
- The scope status tiers (5 levels) are thoughtful — Chrissy specifically asked for scope management
- EmptyState component is well-designed (small icon, clear copy, single CTA)
- Database schema is solid — RLS, triggers, proper constraints

### What Would Disappoint (Right Now)
- **No scope tracker visible anywhere** — The #1 feature is invisible
- **No portal** — "Show clients what you've done" doesn't work yet
- **No quick-add** — The "log work in 2 seconds" promise doesn't exist
- **Placeholder text** ("Phase 1b") looks unfinished
- **Flat delivery list** — No timeline grouping, no visual hierarchy

### What Needs to "Feel Real"
- Dashboard with scope bars on every client card (ScopeTrackerCompact)
- Client detail with the multi-segment scope tracker (ScopeTracker)
- Quick-add that snaps a delivery in and updates scope
- Portal that a real client could open and understand in 10 seconds
- Magic link that copies to clipboard with one click

---

## Recommendation

**Focus all engineering effort on the critical path:**

1. ScopeTracker + ScopeTrackerCompact (renders the differentiator)
2. QuickAddDelivery (proves the workflow)
3. Portal route + edge functions + components (proves client value)
4. MagicLinkPanel (connects operator to portal)

Everything else is polish. These 4 areas are the demo.
