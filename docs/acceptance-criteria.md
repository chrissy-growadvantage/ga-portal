# Luma MVP Acceptance Criteria

> Extracted from SPEC.md. For demo validation and investor readiness.
> Last updated: Feb 2026

---

## Phase 1b: Scope Management (The Differentiator)

### AC-1: Scope Allocation Setup
- [ ] Operator can define scope per client with `scope_type`: hours, deliverables, or custom
- [ ] Operator can set `total_allocated` amount and `unit_label`
- [ ] Operator can set period dates (`period_start`, `period_end`)
- [ ] Form validates: period_end >= period_start, total_allocated >= 0, unit_label required
- [ ] One allocation per client per period enforced (unique constraint)
- [ ] Empty state: "No scope defined" with CTA "Set up scope allocation"
- [ ] Empty state includes example text: "20 hours per month" or "5 deliverables per month"

### AC-2: Scope Tracker Widget (Operator View)
- [ ] Shows: `X of Y [unit] used` with percentage
- [ ] Multi-segment progress bar: in-scope (green/indigo/amber/red by status) + out-of-scope (red/30 tint)
- [ ] Bar uses custom layered approach (NOT shadcn Progress)
- [ ] Breakdown cards: In-scope / Out-of-scope / Remaining (font-mono for numbers)
- [ ] Period label shown (e.g., "Feb 2026")
- [ ] 5-tier status system with correct thresholds:
  - 0-60%: On Track (green)
  - 61-85%: Active (indigo)
  - 86-100%: Nearing Limit (amber)
  - 100% exactly: Fully Used (amber, full bar, no overflow)
  - 101%+: Exceeded (red, overflow indicator "+X over")
- [ ] Status badge uses triple encoding: color + icon + text label
- [ ] Click action opens scope detail panel (operator view)
- [ ] Period selector dropdown to switch months
- [ ] ARIA: `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label`
- [ ] Animated fill on load (600ms ease-out)

### AC-3: Scope Tracker Compact (Dashboard Cards)
- [ ] Thin progress bar + "X/Y unit" + status dot on each client card
- [ ] Matches scope tier colors
- [ ] No breakdown cards (compact only)
- [ ] Shows on Dashboard client list and ClientList page

### AC-4: Scope Usage Auto-Tracking
- [ ] When delivery item is logged, scope tracker updates automatically
- [ ] `scope_cost` field on delivery items consumed against `total_allocated`
- [ ] Items with `is_out_of_scope: true` tracked separately in breakdown
- [ ] Optimistic UI update (scope refreshes without full reload)

### AC-5: Scope Exceeded Indicators
- [ ] Visual indicator when scope > 100% (red bar with overflow badge)
- [ ] Client card on dashboard shows exceeded status
- [ ] Operator can identify scope creep within one click (SPEC acceptance criteria)
- [ ] New delivery logged when already exceeded shows warning

### AC-6: Out-of-Scope Request Log
- [ ] Separate log for out-of-scope requests (scope_requests table)
- [ ] Scope request has: title, description, requested_by (client/operator), status, estimated scope_cost
- [ ] Status flow: pending -> approved / declined / completed
- [ ] ScopeRequestCard component shows each request
- [ ] Empty state: "No scope requests — Scope requests will appear here when work goes beyond the agreed scope"

### AC-7: Scope Allocation Form
- [ ] Fields: Period (start/end dates), Type (hours/deliverables/custom dropdown), Amount (number), Unit label (text)
- [ ] Zod validation per `createScopeAllocationSchema`
- [ ] Creates scope_allocation record on submit
- [ ] Toast confirmation on success
- [ ] Appears in ClientDetail Scope tab

---

## Phase 1c: Client Portal (Client Value Prop)

### AC-8: Magic Link Generation
- [ ] Operator can generate magic link from ClientDetail
- [ ] MagicLinkPanel component in client header/sidebar area
- [ ] Token: `crypto.randomUUID()`, stored as SHA-256 hash in `magic_link_token_hash`
- [ ] Default expiry: 30 days, configurable
- [ ] Copy-to-clipboard button
- [ ] "Link generated" toast confirmation
- [ ] Regenerate button (invalidates previous link)
- [ ] Shows expiry date when link active
- [ ] POST to `/functions/v1/generate-magic-link` edge function

### AC-9: Portal Route & Layout
- [ ] Route: `/portal/:token` (no auth required)
- [ ] No sidebar, no header nav, no hamburger menu
- [ ] Single column, max-w-2xl, centered
- [ ] Cleaner white background (`--background: 0 0% 99%`)
- [ ] Operator name/business at top (trust signal)
- [ ] Period context: shows which month
- [ ] "Powered by Luma" footer
- [ ] Padding: 24px mobile / 48px desktop
- [ ] Font weight: headings 700, body 400 (lighter feel)

### AC-10: Portal Token Validation
- [ ] GET `/functions/v1/client-portal?token={raw_token}`
- [ ] Edge function hashes token with SHA-256, looks up `magic_link_token_hash`
- [ ] Checks `magic_link_expires_at` for expiry
- [ ] Error responses:
  - 400: missing_token
  - 404: not_found ("Portal link not found")
  - 410: expired ("This link has expired. Contact your operator for a new link.")
  - 429: rate_limited
- [ ] Rate limiting: max 60 requests per token per minute
- [ ] Returns read-only client data bundle (scope, deliveries, requests)

### AC-11: Portal Scope Card (Client View)
- [ ] Simple single bar (not segmented like operator view)
- [ ] Shows "X of Y [unit] used" with percentage
- [ ] Status badge (read-only)
- [ ] Breakdown: Used / Remaining only (no in-scope/out-of-scope distinction for clients)
- [ ] Current month only (no period selector)
- [ ] null scope = "No scope set for this period"

### AC-12: Portal Delivery Timeline
- [ ] Chronological list grouped by week/month
- [ ] Each item: title, category badge, date, status
- [ ] No hours shown (clients don't need to see hours)
- [ ] Status simplified: "Done" or "Needs your input"
- [ ] Newest first
- [ ] Pagination for 20+ items (spec: 20 per page via edge function)
- [ ] Staggered entrance animation (100ms delay, max 5)

### AC-13: Portal Approval Actions
- [ ] Items with `status: pending_approval` shown in "Needs Your Approval" section
- [ ] Section only shown if pending items exist
- [ ] ApprovalCard: title, category, description, date
- [ ] Two buttons: "Approve" (primary/filled) and "Request Changes" (outline/secondary)
- [ ] Min 44x44px touch targets (Fitts's Law)
- [ ] Full-width buttons on mobile
- [ ] "Request Changes" opens textarea for feedback
- [ ] POST to `/functions/v1/client-action` with token + delivery_item_id + action
- [ ] Validates delivery_item belongs to token's client (403 if not)
- [ ] Success state: item moves from pending to approved/revision_requested
- [ ] ARIA labels: "Approve: [item title]", "Request changes to: [item title]"

### AC-14: Portal Error States
- [ ] Invalid token: "This link is no longer valid. Contact your service provider for a new link."
- [ ] Expired token: "This link has expired. Contact [Operator Name] for a new link."
- [ ] Network error: "Having trouble connecting. Please check your internet and try again."
- [ ] Server error: "Something went wrong on our end. Please try again in a few minutes."
- [ ] No technical details exposed in any error message

### AC-15: Portal Past Months
- [ ] Collapsible section at bottom
- [ ] Each month: period label, scope summary, delivery count
- [ ] Click to expand previous month's data
- [ ] Not prominent (collapsed by default)

---

## Cross-Cutting Requirements (Both Phases)

### AC-16: Empty States
- [ ] EmptyState component: icon (small, w-10 h-10), title, description, optional tip, optional CTA
- [ ] Used for: 0 clients, 0 deliveries, 0 scope, 0 scope requests, 0 pending approvals
- [ ] Never show illustration larger than text
- [ ] Each empty state has contextual copy per design-system.md table

### AC-17: StatusBadge Component
- [ ] Unified component for all status display
- [ ] Triple encoding: color + icon + text label
- [ ] Works for: client status, delivery status, scope status
- [ ] Uses semantic colors from design system

### AC-18: Design System Compliance
- [ ] Primary color: warm indigo (#5B4DC7), NOT blue/terracotta
- [ ] Accent: amber (#E8853A), Success: green (#25A576)
- [ ] Font: Plus Jakarta Sans (body) + JetBrains Mono (data)
- [ ] Heading weights per type scale (Display 800, H1 700, H2 600, H3 600)
- [ ] Letter spacing: Display -0.02em, H1 -0.015em, H2 -0.01em
- [ ] Scope numbers in font-mono
- [ ] Background: warm off-white (#FDFBF8)
- [ ] Card hover: translateY(-2px) + shadow lift (200ms ease-out)
- [ ] Staggered animations: 100ms delay per item, max 5

### AC-19: QuickAddDelivery
- [ ] Inline input at top of delivery list
- [ ] Enter to submit with defaults (status: completed, category: last used or "General", date: now)
- [ ] Tab to escalate to full LogDeliveryDialog (pre-filled with title)
- [ ] States: idle, focused (hint text visible), submitting (spinner), success (green flash), error (red border)
- [ ] Plus icon in left padding of input
- [ ] Keyboard: n to focus, Enter to submit, Tab to expand, Escape to blur

### AC-20: DeliveryTimeline Component
- [ ] Groups deliveries by time period (This Week, Last Week, older)
- [ ] Left border/line connects entries within group
- [ ] Circle markers: filled for completed, outlined for in-progress
- [ ] Group headers: text-xs font-semibold uppercase tracking-wider text-muted-foreground
- [ ] Category badges: Badge variant="outline" small
- [ ] Shows: title, status, category, hours (operator view), date

### AC-21: Performance & Reliability
- [ ] TanStack Query staleTime: 30s (dashboard), 5min (portal)
- [ ] Optimistic updates for: delivery items, scope, approvals
- [ ] Skeleton screens for all loading states (never spinners for data fetching)
- [ ] Error boundaries at page level (isolated failures)
- [ ] Pagination for 20+ delivery items

---

## Demo-Critical Acceptance Criteria (Investor Readiness)

### Must-Pass for Demo
1. [ ] Dashboard shows clients with scope indicators (compact tracker)
2. [ ] Client detail shows scope tracker with correct math and colors
3. [ ] Quick-add delivery updates scope in real time
4. [ ] Magic link generates and copies to clipboard
5. [ ] Portal loads from magic link with scope + deliveries visible
6. [ ] Client can approve/request changes from portal
7. [ ] Exceeded scope scenario renders correctly (red, overflow indicator)
8. [ ] Empty states guide user naturally through setup
9. [ ] "Feels like a real SaaS product" — no broken layouts, no placeholder text, no console errors

### Nice-to-Have for Demo
- [ ] Past months collapsible in portal
- [ ] Scope request cards functional
- [ ] Onboarding checklist on empty dashboard
- [ ] PDF export hint (P1 teaser)
