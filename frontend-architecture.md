# Luma Frontend Architecture

> Frontend architecture plan for Luma - Client Delivery Operating System
> Tech Stack: React 18 + TypeScript + Vite 5 + Tailwind CSS v3 + shadcn/ui + react-router-dom v6

---

## 1. Current State Assessment

### What Exists (Phase 1a foundation)

| Layer | Files | Status |
|-------|-------|--------|
| **Routing** | `App.tsx` | Lazy-loaded routes, `ProtectedRoute` wrapper, `BrowserRouter` |
| **Auth** | `useAuth.tsx` | Context-based, Supabase email/password + Google OAuth, session listener |
| **Data Hooks** | `useClients.ts`, `useDeliveries.ts`, `useScope.ts` | TanStack Query CRUD hooks with proper invalidation |
| **Schemas** | `schemas.ts` | Zod schemas for client, delivery, scope creation |
| **Types** | `database.ts` | Full TypeScript types mirroring Supabase schema |
| **Query Keys** | `query-keys.ts` | Structured factory with `clients.*` and `operator.*` |
| **Layout** | `AppShell.tsx`, `Sidebar.tsx`, `Header.tsx` | Desktop sidebar + mobile sheet, fixed 264px sidebar |
| **Pages** | `Dashboard`, `ClientList`, `ClientDetail`, `Settings`, `Login`, `AuthCallback`, `NotFound` | Working pages with loading/empty states |
| **Dialogs** | `CreateClientDialog`, `LogDeliveryDialog` | Form dialogs with react-hook-form + zod |
| **UI Library** | 49 shadcn/ui components | Full component library installed |
| **Constants** | `constants.ts` | Delivery categories, status configs with color mappings |
| **Design System** | `index.css`, `tailwind.config.ts` | Custom theme (warm indigo primary, Plus Jakarta Sans, JetBrains Mono) |

### What's Missing (Gaps to Fill)

| Feature | Priority | Notes |
|---------|----------|-------|
| Client Portal (magic link) | P0 | Entire `/portal/:token` route + edge function integration |
| Scope Tracker component | P0 | Visual progress bar, used/remaining, exceeded state |
| Scope Allocation form | P0 | Create/edit scope per client per period |
| Scope Request management | P0 | Log and track out-of-scope requests |
| Client Approval flow | P0 (low) | Portal-side approve/revision actions |
| Capacity dashboard | P0 | Cross-client overview for the operator |
| Magic link generation UI | P0 | Generate/regenerate/copy link from ClientDetail |
| Error boundaries | P0 | Component-level error isolation |
| `usePortal` hook | P0 | Edge function data fetching for client portal |
| `useScopeRequests` hook | P0 | CRUD for scope_requests table |
| Empty state components | P1 | Reusable illustrated empty states |
| PDF export | P1 | Client summary export |
| Optimistic updates | P1 | Immediate UI feedback on mutations |

---

## 2. Folder Structure (Target)

> Updated to reflect UX/UI design system decisions from `docs/ux/design-system.md`

```
src/
├── components/
│   ├── ui/                          # shadcn/ui primitives (49 components, DO NOT EDIT)
│   │   ├── status-badge.tsx         # [NEW] Unified status display (color + icon + label)
│   │   ├── empty-state.tsx          # [NEW] Reusable empty state pattern
│   │   └── ... (49 existing shadcn components)
│   │
│   ├── layout/
│   │   ├── AppShell.tsx             # [EXISTS] Sidebar + Header + <Outlet />
│   │   ├── Sidebar.tsx              # [EXISTS] Desktop nav sidebar
│   │   ├── Header.tsx               # [EXISTS] Mobile header with sheet nav
│   │   ├── PortalShell.tsx          # [NEW] Minimal portal shell (no sidebar, max-w-2xl, branded)
│   │   └── index.ts                 # [EXISTS] Barrel export
│   │
│   ├── clients/
│   │   ├── CreateClientDialog.tsx   # [EXISTS] Add client form dialog
│   │   ├── ClientCard.tsx           # [NEW] Client card with ScopeTrackerCompact inline
│   │   ├── ClientAvatar.tsx         # [NEW] Reusable avatar ring (initials, color-coded)
│   │   └── MagicLinkPanel.tsx       # [NEW] Generate/copy/regenerate magic link panel
│   │
│   ├── deliveries/
│   │   ├── LogDeliveryDialog.tsx    # [EXISTS] Full delivery form dialog (Tier 2)
│   │   ├── QuickAddDelivery.tsx     # [NEW] Inline quick-add input (Tier 1, primary path)
│   │   ├── DeliveryTimeline.tsx     # [NEW] Grouped timeline view (by week/month)
│   │   ├── DeliveryCard.tsx         # [NEW] Single delivery item with timeline marker
│   │   └── DeliveryStatusIcon.tsx   # [NEW] Status icon (extracted from ClientDetail)
│   │
│   ├── scope/
│   │   ├── ScopeTracker.tsx         # [NEW] Full scope widget (bar + breakdown cards)
│   │   ├── ScopeTrackerCompact.tsx  # [NEW] Mini scope bar for client list cards
│   │   ├── ScopeAllocationForm.tsx  # [NEW] Create/edit scope allocation dialog
│   │   ├── ScopeRequestCard.tsx     # [NEW] Individual scope request card
│   │   ├── ScopeRequestList.tsx     # [NEW] List of scope change requests
│   │   ├── ScopeRequestDialog.tsx   # [NEW] Log scope request dialog
│   │   └── ScopeExceededBanner.tsx  # [NEW] Alert banner when scope > 100%
│   │
│   ├── portal/
│   │   ├── PortalScopeCard.tsx      # [NEW] Client-facing scope (simple bar, no breakdown)
│   │   ├── PortalTimeline.tsx       # [NEW] Client-facing delivery timeline (no hours shown)
│   │   ├── ApprovalCard.tsx         # [NEW] Approve/revision card with expandable textarea
│   │   ├── PortalExpired.tsx        # [NEW] Expired link error state
│   │   └── PortalNotFound.tsx       # [NEW] Invalid token error state
│   │
│   ├── onboarding/
│   │   └── OnboardingChecklist.tsx  # [NEW] 3-step progressive onboarding (0 clients state)
│   │
│   ├── dashboard/
│   │   ├── StatCard.tsx             # [NEW] Reusable stat card (extracted from Dashboard)
│   │   └── CapacityOverview.tsx     # [NEW] Cross-client capacity summary
│   │
│   └── shared/
│       ├── ErrorBoundary.tsx        # [NEW] React error boundary with fallback UI
│       ├── QueryErrorState.tsx      # [NEW] Error state for failed queries (compact + full)
│       └── PageHeader.tsx           # [NEW] Consistent page header (title + desc + actions)
│
├── hooks/
│   ├── useAuth.tsx                  # [EXISTS] Auth context + provider
│   ├── useClients.ts               # [EXISTS] Client CRUD queries
│   ├── useDeliveries.ts            # [EXISTS] Delivery CRUD queries
│   ├── useScope.ts                 # [EXISTS] Scope allocation CRUD queries
│   ├── useScopeRequests.ts         # [NEW] Scope request CRUD queries
│   ├── usePortal.ts                # [NEW] Client portal data (edge function)
│   ├── useCapacity.ts              # [NEW] Aggregate capacity across clients (derived, no API call)
│   ├── useMagicLink.ts             # [NEW] Generate/refresh magic link mutations
│   ├── useOnboarding.ts            # [NEW] Track onboarding step completion (localStorage)
│   └── use-mobile.ts               # [EXISTS] Mobile breakpoint hook
│
├── lib/
│   ├── supabase.ts                 # [EXISTS] Supabase client singleton
│   ├── query-keys.ts               # [EXISTS] TanStack Query key factory
│   ├── schemas.ts                  # [EXISTS] Zod validation schemas
│   ├── constants.ts                # [EXISTS] Enums, categories, status configs
│   ├── utils.ts                    # [EXISTS] cn() utility
│   ├── scope-utils.ts              # [NEW] Scope calculation helpers (5-tier status)
│   └── portal-api.ts               # [NEW] Edge function API wrapper for portal
│
├── pages/
│   ├── Dashboard.tsx                # [EXISTS] Overview + stats + capacity + onboarding
│   ├── ClientList.tsx               # [EXISTS] Full client list with search
│   ├── ClientDetail.tsx             # [EXISTS] Per-client tabs (deliveries, scope, requests)
│   ├── Settings.tsx                 # [EXISTS] Operator profile
│   ├── Login.tsx                    # [EXISTS] Auth page
│   ├── AuthCallback.tsx             # [EXISTS] OAuth callback handler
│   ├── Portal.tsx                   # [NEW] Client-facing single-scroll view (magic link)
│   └── NotFound.tsx                 # [EXISTS] 404 page
│
├── types/
│   └── database.ts                  # [EXISTS] Supabase type definitions
│
├── App.tsx                          # [EXISTS] Router + providers
├── main.tsx                         # [EXISTS] Entry point with QueryClient + AuthProvider
├── index.css                        # [EXISTS] Theme variables + base styles
└── vite-env.d.ts                    # [EXISTS] Vite type declarations
```

---

## 3. Component Architecture

### 3a. Component Hierarchy

> Updated to reflect design system: QuickAddDelivery, OnboardingChecklist, single-scroll portal,
> ScopeTrackerCompact on client cards, DeliveryTimeline grouped by week

```
main.tsx
└── QueryClientProvider
    └── AuthProvider
        └── App (BrowserRouter)
            ├── /login → Login
            ├── /auth/callback → AuthCallback
            │
            ├── ProtectedRoute → AppShell
            │   ├── / → Dashboard
            │   │   ├── OnboardingChecklist (shown when 0-2 steps done, then hidden)
            │   │   ├── StatCard[] (total, active, paused, archived)
            │   │   ├── CapacityOverview (active clients + mini scope bars)
            │   │   └── ClientCard[] (top 5, each with ScopeTrackerCompact)
            │   │
            │   ├── /clients → ClientList
            │   │   ├── PageHeader + CreateClientDialog trigger
            │   │   ├── Search input
            │   │   └── ClientCard[] (all, filterable, with ScopeTrackerCompact)
            │   │
            │   ├── /clients/:id → ClientDetail
            │   │   ├── PageHeader + ClientAvatar + client info
            │   │   ├── MagicLinkPanel (generate/copy/regenerate)
            │   │   ├── ScopeTracker (full variant, current period, with breakdown cards)
            │   │   ├── Tabs
            │   │   │   ├── Deliveries
            │   │   │   │   ├── QuickAddDelivery (inline, always visible at top)
            │   │   │   │   └── DeliveryTimeline (grouped by week)
            │   │   │   │       └── DeliveryCard[] (with timeline markers)
            │   │   │   ├── Scope → ScopeAllocationForm + scope period history
            │   │   │   └── Requests → ScopeRequestList + ScopeRequestDialog
            │   │   │       └── ScopeRequestCard[]
            │   │   └── ErrorBoundary (wraps each tab content independently)
            │   │
            │   └── /settings → Settings
            │
            ├── /portal/:token → PortalShell (no sidebar, max-w-2xl, branded)
            │   └── Portal (single scrollable page, NOT tabbed)
            │       ├── Trust banner (operator name + period)
            │       ├── PortalScopeCard (simple bar, used/remaining only)
            │       ├── PortalTimeline (grouped by week, no hours shown)
            │       ├── ApprovalCard[] (only if pending items exist)
            │       │   └── Expandable textarea on "Request Changes"
            │       ├── Past months (collapsible accordion)
            │       ├── PortalExpired (if token expired)
            │       └── PortalNotFound (if token invalid)
            │
            └── * → NotFound
```

### 3b. Key Component Specifications

> All specs aligned with `docs/ux/design-system.md` component designs

#### ScopeTracker (Full — Operator View)

Luma's #1 differentiator (RICE: 10.8). Communicates three things at a glance:
how much is used, is this OK, and what exactly.

```typescript
interface ScopeTrackerProps {
  allocated: number;          // total scope units
  used: number;               // in-scope usage
  outOfScope: number;         // out-of-scope usage
  unitLabel: string;          // "hours", "deliverables", etc.
  periodLabel: string;        // "Feb 2026"
  scopeType: ScopeType;
  className?: string;
}

// Visual structure (from design system):
// ┌─────────────────────────────────────────────────┐
// │  Scope Usage                        Feb 2026 ▾  │
// │                                                  │
// │  12 of 20 hours used                    60%     │
// │  ████████████░░░░░░░░░░░░░░░░░░░░░     On Track │
// │  ├─ green ──┤├──── gray (empty) ──┤             │
// │                                                  │
// │  ┌───────────┐ ┌───────────┐ ┌───────────┐     │
// │  │ In-scope  │ │ Out-scope │ │ Remaining │     │
// │  │   10 hrs  │ │   2 hrs   │ │   8 hrs   │     │
// │  └───────────┘ └───────────┘ └───────────┘     │
// └─────────────────────────────────────────────────┘
//
// 5-tier status (from design system, differs from original 3-tier):
//   0-60%:   on-track    → success green bar + green badge
//   61-85%:  active      → primary indigo bar + indigo badge
//   86-100%: nearing     → accent-warm amber bar + amber badge
//   100%:    at-limit    → full amber, no overflow
//   101%+:   exceeded    → destructive red bar + overflow indicator + ScopeExceededBanner
//
// Progress bar: Custom layered div (NOT shadcn Progress — it only supports single fill)
//   Outer: rounded-full h-3 bg-muted overflow-hidden
//   ├── In-scope fill: bg-{status-color}, width = (used / allocated) * 100%
//   └── Out-of-scope fill: bg-destructive/30, positioned after in-scope
//
// Breakdown cards use font-mono for numbers (signals "data"):
//   <span class="text-2xl font-mono font-semibold">10</span>
//   <span class="text-sm text-muted-foreground">hrs</span>
//
// No scope set: EmptyState with "Set up scope allocation" CTA
//
// ARIA:
//   role="progressbar" aria-valuenow={used} aria-valuemin={0} aria-valuemax={allocated}
//   aria-label="Scope usage: {used} of {allocated} {unit} used, {percentage}%, {status}"
```

#### ScopeTrackerCompact (Dashboard Client Cards)

Minimal scope indicator for client list cards.

```typescript
interface ScopeTrackerCompactProps {
  used: number;
  allocated: number;
  unitLabel: string;
  status: ScopeStatus;
}

// Visual: Thin progress bar + "X/Y unit" + status dot
// ████████░░░ 12/20 hrs  ● On Track
// No breakdown cards. Just bar + numbers + status.
```

#### QuickAddDelivery (Tier 1 — Primary Logging Path)

Inline input at top of delivery list. Title + Enter = logged. Minimum friction.
Design system research: Todoist data shows 70%+ tasks created via quick-add.

```typescript
interface QuickAddDeliveryProps {
  clientId: string;
  onExpandToDialog: (title: string) => void; // Tab escalates to full form
}

// Visual:
// ┌────────────────────────────────────────────────────┐
// │ + │ What did you deliver?                    │ Tab ↹│
// └────────────────────────────────────────────────────┘
//
// Smart defaults on submit:
//   status: 'completed'
//   category: Last used category (or "General")
//   completed_at: now
//   scope_cost: 1
//   hours_spent: null (can edit later)
//
// States:
//   idle:       Placeholder text, muted plus icon
//   focused:    Border highlight (--primary), hint text "Enter to log · Tab for details"
//   submitting: Inline spinner replaces plus icon
//   success:    Brief green check flash (200ms), input clears
//   error:      Red border, error toast
//
// Keyboard:
//   n           → Focus quick-add (when not in another input)
//   Enter       → Submit with defaults
//   Tab         → Open full LogDeliveryDialog pre-filled with title
//   Escape      → Clear and blur
//   Cmd+Enter   → Submit even if Tab hint visible
//
// ARIA:
//   role="combobox" aria-label="Quick add delivery item"
//   aria-describedby="quick-add-hint"
//   <span id="quick-add-hint" class="sr-only">Press Enter to log, Tab for full form</span>
```

#### DeliveryTimeline (Operator View)

Deliveries grouped by time period with visual timeline markers.

```typescript
interface DeliveryTimelineProps {
  deliveries: DeliveryItem[];
  onEdit: (item: DeliveryItem) => void;
}

// Visual: Left border/line connects entries within a group
// Circle markers (●) — filled for completed, outlined for in-progress
// Group headers: text-xs font-semibold uppercase tracking-wider text-muted-foreground
//
// ┌─ This Week ────────────────────────────────┐
// │  ● Monthly analytics report    Completed    │
// │  │  Marketing · 2.5 hrs · Feb 14           │
// │  ● Email campaign setup        Completed    │
// │  │  Marketing · 1 hr · Feb 13              │
// ├─ Last Week ────────────────────────────────┤
// │  ● SEO audit completed         Approved     │
// │     Tech · 4 hrs · Feb 7                   │
// └─────────────────────────────────────────────┘
//
// Staggered entrance: animation-delay = min(index, 5) * 100ms
```

#### Portal (Single Scrollable Page)

Design decision: Single scroll, NOT tabbed. Evidence: <90s client sessions,
74% viewing time on first two screenfuls, scrolling is native mobile gesture.

```typescript
// Portal.tsx page structure (single scroll):
//
// ┌──────────────────────────────────┐
// │  [Operator Name]                 │  ← Trust banner
// │  Delivery summary for Acme Corp  │
// │  February 2026                   │
// ├──────────────────────────────────┤
// │  SCOPE TRACKER (simple bar)      │  ← Highest priority: "Am I getting value?"
// │  12 of 20 hours used   60%       │
// │  ██████████░░░░░░ On Track       │
// ├──────────────────────────────────┤
// │  DELIVERY TIMELINE               │  ← Grouped by week, no hours shown
// │  ┌─ This Week ──────────────┐    │
// │  │ ✓ Monthly analytics      │    │
// │  │ ✓ Email campaign setup   │    │
// │  └──────────────────────────┘    │
// ├──────────────────────────────────┤
// │  NEEDS YOUR APPROVAL (if any)    │  ← Only if pending items exist
// │  ┌──────────────────────────┐    │
// │  │ Newsletter draft         │    │
// │  │        [Approve] [Change]│    │
// │  └──────────────────────────┘    │
// ├──────────────────────────────────┤
// │  Past Months ▾                   │  ← Collapsible accordion
// ├──────────────────────────────────┤
// │  ── Powered by Luma ──           │
// └──────────────────────────────────┘
//
// Portal CSS overrides (cleaner than operator view):
//   --background: 0 0% 99%       (cleaner white, less warm)
//   --card: 0 0% 100%            (pure white, no noise texture)
//   max-width: 672px (max-w-2xl) (narrow reading column, 65-75 chars/line)
//   padding: 24px mobile / 48px desktop
```

#### ApprovalCard (Client Portal)

```typescript
interface ApprovalCardProps {
  deliveryItem: PortalDeliveryItem;
  token: string;
  onAction: (action: 'approved' | 'revision_requested', note?: string) => void;
}

// Visual:
// ┌─────────────────────────────────────────────┐
// │  Newsletter draft for March                  │
// │  Content · Completed Feb 12                  │
// │  "Please review the March newsletter..."     │
// │                                              │
// │  ┌─────────────┐  ┌───────────────────────┐ │
// │  │  ✓ Approve   │  │  ✎ Request Changes   │ │
// │  └─────────────┘  └───────────────────────┘ │
// └─────────────────────────────────────────────┘
//
// Approve = primary filled button, Request Changes = outline
// Both buttons: min 44x44px touch targets
//
// "Request Changes" expands inline textarea:
// ┌─────────────────────────────────────────────┐
// │  What would you like changed?                │
// │  ┌─────────────────────────────────────┐    │
// │  │                                     │    │
// │  └─────────────────────────────────────┘    │
// │                          [Submit Feedback]   │
// └─────────────────────────────────────────────┘
//
// ARIA: aria-label="Approve: {title}" / "Request changes to: {title}"
```

#### OnboardingChecklist (Dashboard — 0 clients state)

Progressive onboarding — no separate flow. Each empty state IS the onboarding.

```typescript
interface OnboardingChecklistProps {
  hasClients: boolean;
  hasDeliveries: boolean;
  hasMagicLink: boolean;
}

// Only shown when 0-2 of 3 steps completed. Disappears permanently after all 3.
// Track completion via localStorage or operator metadata.
//
// ┌─────────────────────────────────────────┐
// │  Welcome to Luma                        │
// │  You're 3 steps away from showing       │
// │  clients the value you deliver.         │
// │                                         │
// │  ┌─ Step 1 ──────────────────────────┐  │
// │  │ ● Add your first client           │  │  ← Active step (clickable CTA)
// │  └───────────────────────────────────┘  │
// │  ┌─ Step 2 ──────────────────────────┐  │
// │  │ ○ Log a delivery                  │  │  ← Inactive (greyed until step 1 done)
// │  └───────────────────────────────────┘  │
// │  ┌─ Step 3 ──────────────────────────┐  │
// │  │ ○ Share the client view           │  │  ← Inactive
// │  └───────────────────────────────────┘  │
// └─────────────────────────────────────────┘
```

#### MagicLinkPanel

Operator-side magic link management (replaces MagicLinkManager).

```typescript
interface MagicLinkPanelProps {
  clientId: string;
  currentToken: string | null;
  expiresAt: string | null;
}

// States:
//   1. No link → "Generate Portal Link" button
//   2. Link exists → Truncated URL + copy button + expiry badge + "Regenerate" button
//   3. Link expired → "Expired" badge + "Regenerate" button
//   4. Regenerating → confirmation dialog (invalidates old link)
// Uses useMagicLink hook → calls edge function
```

#### CapacityOverview

Cross-client capacity view for the operator dashboard.

```typescript
interface CapacityOverviewProps {
  clients: ClientWithScope[];
}

// Shows each active client with ScopeTrackerCompact inline
// Sorted by "most over scope" first
// "X clients over scope" alert at top if any exceeded
// Clickable rows → navigate to client detail
```

#### EmptyState (Reusable)

```typescript
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  tip?: string;                                  // Helpful example text
  action?: { label: string; onClick: () => void };
}

// Layout: Centered, py-12
//   Icon: w-10 h-10 text-muted-foreground (small, NOT giant illustration)
//   Title: text-base font-semibold, mt-3
//   Description: text-sm text-muted-foreground, mt-1
//   Tip: text-xs text-muted-foreground italic, mt-3
//   Action: mt-4, primary button
// Research: NN Group shows users skip decorative imagery. The text IS the content.
```

#### StatusBadge (Unified)

```typescript
interface StatusBadgeProps {
  status: string;
  config: { label: string; color: string; dot?: string; icon?: LucideIcon };
}

// Triple encoding: color + icon + text label (never color alone)
// ARIA: role="status" aria-label="Status: {label}"
// <span class="bg-green-500 w-2 h-2 rounded-full" aria-hidden="true" />
```

---

## 4. State Management Strategy

### Server State (TanStack Query)

All data from Supabase flows through TanStack Query. No global store.

| Data | Hook | Query Key | staleTime |
|------|------|-----------|-----------|
| Client list | `useClients()` | `['clients']` | 30s |
| Client detail + relations | `useClient(id)` | `['clients', id]` | 30s |
| Deliveries per client | `useDeliveries(clientId)` | `['clients', cid, 'deliveries']` | 30s |
| Scope allocations | `useScope(clientId)` | `['clients', cid, 'scope']` | 30s |
| Scope requests | `useScopeRequests(clientId)` | `['clients', cid, 'scope-requests']` | 30s |
| Operator profile | `useOperator()` | `['operator', 'profile']` | 5min |
| Capacity aggregate | `useCapacity()` | `['operator', 'capacity']` | 30s |
| Portal data (edge fn) | `usePortal(token)` | `['portal', token]` | 5min |

### Mutation Invalidation Map

```
createClient      → invalidate ['clients']
updateClient      → invalidate ['clients'], ['clients', id]
deleteClient      → invalidate ['clients']
createDelivery    → invalidate ['clients', cid, 'deliveries'], ['clients', cid], ['clients']
updateDelivery    → invalidate ['clients', cid, 'deliveries'], ['clients', cid]
deleteDelivery    → invalidate ['clients', cid, 'deliveries'], ['clients', cid], ['clients']
createScope       → invalidate ['clients', cid, 'scope'], ['clients', cid]
updateScope       → invalidate ['clients', cid, 'scope'], ['clients', cid]
deleteScope       → invalidate ['clients', cid, 'scope'], ['clients', cid]
createScopeReq    → invalidate ['clients', cid, 'scope-requests']
updateScopeReq    → invalidate ['clients', cid, 'scope-requests']
generateMagicLink → invalidate ['clients', cid]
```

### Form State

All forms use `react-hook-form` + `@hookform/resolvers/zod`. Form state is component-local.

| Form | Schema | Location |
|------|--------|----------|
| Create Client | `createClientSchema` | `CreateClientDialog` |
| Log Delivery (full) | `createDeliveryItemSchema` | `LogDeliveryDialog` (Tier 2) |
| Quick-Add Delivery | Title-only (inline) | `QuickAddDelivery` (Tier 1) |
| Scope Allocation | `createScopeAllocationSchema` | `ScopeAllocationForm` |
| Scope Request | `createScopeRequestSchema` (new) | `ScopeRequestDialog` |
| Client Approval | `clientApprovalSchema` (new) | `ApprovalCard` (portal) |
| Login/Signup | Inline validation | `Login.tsx` |

### UI State

| State | Scope | Mechanism |
|-------|-------|-----------|
| Dialog open/close | Component | `useState` |
| Sidebar open (mobile) | Component | `useState` in `Header.tsx` |
| Search input | Component | `useState` in `ClientList.tsx` |
| Active tab | URL | `useSearchParams` or Tabs default |
| Selected period filter | URL | `useSearchParams` on ClientDetail |
| Quick-add focus state | Component | `useState` in `QuickAddDelivery` |
| Quick-add last category | Component | `useRef` persists across submissions |
| Onboarding steps done | Persistent | `localStorage` via `useOnboarding` hook |
| Approval textarea expanded | Component | `useState` per `ApprovalCard` |
| Theme (dark/light) | Global | CSS class on `<html>`, stored in `localStorage` |

### Auth State

Auth flows through React Context (`AuthProvider`):
- `user`, `session`, `loading` from Supabase auth listener
- Wraps entire app — available everywhere via `useAuth()`
- Auto-refreshes JWT via `supabase-js`
- On `null` session → `ProtectedRoute` redirects to `/login`

---

## 5. Routing Structure

### Operator Routes (Auth Required)

```typescript
// Wrapped in ProtectedRoute → AppShell
/                        → Dashboard       // Client overview + stats + capacity
/clients                 → ClientList      // Full client roster with search
/clients/:id             → ClientDetail    // Per-client detail (deliveries, scope, requests)
/settings                → Settings        // Operator profile + preferences
```

### Public Routes (No Auth)

```typescript
/login                   → Login           // Email/password + Google OAuth
/auth/callback           → AuthCallback    // OAuth redirect handler
/portal/:token           → Portal          // Client-facing read-only view (magic link)
```

### Portal Route Architecture

The portal route is **completely separate** from the operator app:
- No `AuthProvider` dependency (no auth context needed)
- Uses `PortalShell` layout (minimal, branded, no sidebar)
- Data fetched via edge function, not direct Supabase queries
- Client actions (approve/revision) sent via edge function POST

```typescript
// In App.tsx:
<Route path="/portal/:token" element={<PortalShell><Portal /></PortalShell>} />
```

---

## 6. Data Flow Patterns

### Operator → Supabase (Standard CRUD)

```
Component
  → useForm (react-hook-form + zod validation)
  → useMutation (TanStack Query)
  → supabase.from('table').insert/update/delete()
  → RLS validates auth.uid() ownership
  → onSuccess: invalidateQueries → UI re-renders
```

### Client Portal → Edge Function

```
Portal.tsx
  → usePortal(token) hook
  → GET /functions/v1/client-portal?token={token}
  → Edge function: validate token + expiry → return client data bundle
  → On error: show PortalExpired or PortalNotFound

Client Action (approve/revision):
  → POST /functions/v1/client-action
  → Body: { token, delivery_item_id, action, note }
  → Edge function: validate token → write to client_approvals
  → Invalidate portal query
```

### `portal-api.ts` — Edge Function Wrapper

```typescript
// src/lib/portal-api.ts
const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';

export async function fetchPortalData(token: string) {
  const res = await fetch(`${FUNCTIONS_URL}/client-portal?token=${token}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error('NOT_FOUND');
    if (res.status === 410) throw new Error('EXPIRED');
    throw new Error('PORTAL_ERROR');
  }
  return res.json();
}

export async function submitClientAction(payload: {
  token: string;
  delivery_item_id: string;
  action: 'approved' | 'revision_requested';
  note?: string;
}) {
  const res = await fetch(`${FUNCTIONS_URL}/client-action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('ACTION_FAILED');
  return res.json();
}
```

---

## 7. Styling & Design System

### shadcn/ui Customization Strategy

1. **Do NOT edit `components/ui/`** — treat as vendor code
2. **Compose** shadcn primitives into domain components (e.g., `ScopeTracker` uses `Progress` + `Card`)
3. **Override via CSS variables** in `index.css` for theme colors
4. **Extend via Tailwind** config for custom animations, shadows, colors

### Theme Tokens (Current)

| Token | Light Value | Purpose |
|-------|-------------|---------|
| `--primary` | 245 58% 51% (warm indigo) | Primary actions, active states |
| `--accent-warm` | 28 92% 58% (amber) | Accent highlights, scope warnings |
| `--success` | 158 64% 40% (teal-green) | On-track, approved states |
| `--destructive` | 0 84% 60% (red) | Errors, exceeded scope |
| `--background` | 40 20% 98% (warm off-white) | Page background |

### Status Color System (5-Tier — from Design System)

The design system specifies a 5-tier scope status system (not 3-tier). This provides
more nuanced communication and matches operator mental models.

| Usage | Status | Color Token | CSS Classes | Bar Fill |
|-------|--------|-------------|-------------|----------|
| 0-60% | On Track | `success` (green) | `text-emerald-600`, `bg-emerald-100` | Green fill |
| 61-85% | Active | `primary` (indigo) | `text-primary`, `bg-primary/10` | Indigo fill |
| 86-100% | Nearing Limit | `accent-warm` (amber) | `text-amber-600`, `bg-amber-100` | Amber fill |
| 100% exact | Fully Used | `accent-warm` (amber strong) | `text-amber-700`, `bg-amber-200` | Full amber, no overflow |
| 101%+ | Exceeded | `destructive` (red) | `text-red-600`, `bg-red-100` | Red + overflow indicator |
| No scope | — | `muted-foreground` | `text-muted-foreground` | No bar |

All status states use **triple encoding**: color + icon + text label (never color alone).

### Typography

- **Headings**: Plus Jakarta Sans, bold, tight tracking
- **Body**: Plus Jakarta Sans, regular
- **Code/IDs**: JetBrains Mono

### Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| < 768px (mobile) | Sheet nav, single column, stacked cards |
| >= 768px (tablet) | Fixed sidebar, 2-col grids where appropriate |
| >= 1024px (desktop) | Sidebar + max-w-6xl content area, 3-4 col grids |

---

## 8. Error Handling Architecture

### Error Boundary Strategy

```
App (GlobalErrorBoundary → "Something went wrong" + reload button)
├── AuthProvider (catches auth errors → redirect to login)
├── AppShell
│   ├── Dashboard
│   │   ├── StatCards → QueryErrorState per stat
│   │   └── CapacityOverview → QueryErrorState with retry
│   ├── ClientList → QueryErrorState with retry
│   ├── ClientDetail
│   │   ├── DeliveryList → QueryErrorState with retry (isolated)
│   │   ├── ScopeTracker → QueryErrorState (isolated)
│   │   └── ScopeRequestList → QueryErrorState (isolated)
│   └── Settings → QueryErrorState
└── Portal
    ├── PortalExpired (token expired → friendly message)
    ├── PortalNotFound (token invalid → generic 404)
    └── PortalError (edge function failed → retry prompt)
```

### TanStack Query Error Handling

```typescript
// Global defaults in main.tsx QueryClient:
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,                    // Retry once on failure
      refetchOnWindowFocus: false, // No refetch on tab focus
      staleTime: 30_000,          // 30s stale time
    },
    mutations: {
      onError: (error) => {
        // Global mutation error toast
        toast.error(error.message || 'Something went wrong');
      },
    },
  },
});
```

### QueryErrorState Component

```typescript
interface QueryErrorStateProps {
  error: Error;
  onRetry: () => void;
  compact?: boolean; // Inline vs. card-sized error
}

// Renders: error icon + message + "Try again" button
// Compact mode: inline text with retry link (for within cards)
// Full mode: centered card with icon (for page-level errors)
```

### Network Failure States

| Scenario | UX |
|----------|----|
| Query fetch fails (1st try) | Silent retry |
| Query fetch fails (after retry) | `QueryErrorState` with retry button |
| Mutation fails | Optimistic update reverts + toast error |
| Edge function timeout | Portal shows "Taking longer than expected" |
| Auth session expired | Auto-redirect to `/login` via auth listener |

---

## 9. Loading State Patterns

### Skeleton Loading

All list views and data-dependent components use skeleton placeholders:

```typescript
// Pattern: isLoading check renders skeleton, then data renders actual content
{isLoading ? (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <Skeleton key={i} className="h-20 w-full rounded-xl" />
    ))}
  </div>
) : (
  <ActualContent data={data} />
)}
```

### Loading States Per Page

Design system rule: **Never show a spinner for data fetching — always use skeletons.**
Spinners reserved for: button loading states, full-page initial auth check, mutation in-progress.

| Page | Loading UI |
|------|-----------|
| Dashboard | Skeleton stat cards (4-col) + skeleton client cards |
| ClientList | Skeleton card rows matching card layout |
| ClientDetail | Skeleton header + skeleton scope tracker + skeleton timeline |
| Portal | Skeleton trust banner + skeleton scope bar + skeleton timeline |
| Login | Inline button spinner during submit |

### Skeleton Components (from Design System)

Each skeleton mirrors the **exact layout** of loaded content — same heights, widths, spacing.

**Scope Tracker Skeleton:**
```
┌───────────────────────────────────────────┐
│ ░░░░░░░░░░░░                 ░░░░░░░░░░  │
│ ░░░░░░░░░░░░░░░░░                        │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░      │  ← bar height matches real bar
│                                           │
│ ░░░░░░ ░░░   ░░░░░░ ░░░   ░░░░░░ ░░░   │  ← breakdown cards
└───────────────────────────────────────────┘
```

**Client Card Skeleton (with compact scope):**
```
┌───────────────────────────────────────────┐
│ ░░ │ ░░░░░░░░░░░░░░░ │           │ ░░░░░ │
│    │ ░░░░░░░░░        │           │       │
│    │ ░░░░░░░░░░░░░░░░ │           │       │  ← compact scope bar
└───────────────────────────────────────────┘
```

### Suspense Boundaries

Pages are lazy-loaded via `React.lazy()` with a `<Suspense fallback={<PageLoader />}>` wrapper in `App.tsx`. This gives immediate page-transition feedback.

---

## 10. Key Feature Implementation Plans

### 10a. Scope Tracker (Phase 1b)

**New files:**
- `src/components/scope/ScopeTracker.tsx`
- `src/components/scope/ScopeAllocationForm.tsx`
- `src/components/scope/ScopeExceededBanner.tsx`
- `src/lib/scope-utils.ts`

**scope-utils.ts (5-tier status from design system):**
```typescript
export type ScopeStatus = 'on-track' | 'active' | 'nearing' | 'at-limit' | 'exceeded';

export interface ScopeUsage {
  used: number;
  outOfScope: number;
  total: number;
  remaining: number;
  percentage: number;
  status: ScopeStatus;
}

export function calculateScopeUsage(
  allocation: ScopeAllocation,
  deliveries: DeliveryItem[]
): ScopeUsage {
  const periodDeliveries = deliveries.filter(d =>
    d.completed_at &&
    new Date(d.completed_at) >= new Date(allocation.period_start) &&
    new Date(d.completed_at) <= new Date(allocation.period_end)
  );

  const used = periodDeliveries
    .filter(d => !d.is_out_of_scope)
    .reduce((sum, d) => sum + d.scope_cost, 0);

  const outOfScope = periodDeliveries
    .filter(d => d.is_out_of_scope)
    .reduce((sum, d) => sum + d.scope_cost, 0);

  const total = allocation.total_allocated;
  const remaining = Math.max(0, total - used);
  const percentage = total > 0 ? (used / total) * 100 : 0;

  // 5-tier status (design system Decision 2)
  let status: ScopeStatus;
  if (percentage > 100) status = 'exceeded';
  else if (percentage === 100) status = 'at-limit';
  else if (percentage >= 86) status = 'nearing';
  else if (percentage >= 61) status = 'active';
  else status = 'on-track';

  return { used, outOfScope, total, remaining, percentage, status };
}

// Status → color mapping (for ScopeTracker bar fill)
export const SCOPE_STATUS_COLORS = {
  'on-track': { bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700', label: 'On Track' },
  'active':   { bar: 'bg-primary', badge: 'bg-primary/10 text-primary', label: 'Active' },
  'nearing':  { bar: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700', label: 'Nearing Limit' },
  'at-limit': { bar: 'bg-amber-600', badge: 'bg-amber-200 text-amber-800', label: 'Fully Used' },
  'exceeded': { bar: 'bg-destructive', badge: 'bg-red-100 text-red-700', label: 'Exceeded' },
} as const;

export function getCurrentPeriodScope(allocations: ScopeAllocation[]): ScopeAllocation | null {
  const now = new Date();
  return allocations.find(a =>
    new Date(a.period_start) <= now && new Date(a.period_end) >= now
  ) ?? null;
}
```

**ScopeTracker renders:**
1. Custom layered progress bar (NOT shadcn Progress — need multi-segment support)
   - In-scope fill: `bg-{status-color}`, width = `(used / allocated) * 100%`
   - Out-of-scope fill: `bg-destructive/30`, positioned after in-scope
   - When >100%: full bar + overflow badge: `"+2 hrs over"`
2. Header: "Scope Usage" + period dropdown
3. "{used} of {total} {unit_label} used" + percentage + StatusBadge
4. Breakdown cards (3-col grid): In-scope / Out-of-scope / Remaining (font-mono numbers)
5. `ScopeExceededBanner` when status is `'exceeded'`

### 10b. Client Portal (Phase 1c)

**New files:**
- `src/pages/Portal.tsx`
- `src/components/layout/PortalShell.tsx`
- `src/components/portal/PortalSummaryCard.tsx`
- `src/components/portal/PortalDeliveryTimeline.tsx`
- `src/components/portal/PortalScopeUsage.tsx`
- `src/components/portal/PortalExpired.tsx`
- `src/components/portal/PortalNotFound.tsx`
- `src/components/approvals/ApprovalActions.tsx`
- `src/hooks/usePortal.ts`
- `src/lib/portal-api.ts`

**Portal page flow:**
1. Extract `token` from URL params
2. Call `usePortal(token)` → fetches via edge function
3. On success: render `PortalSummaryCard` + `PortalScopeUsage` + `PortalDeliveryTimeline`
4. On 404: render `PortalNotFound`
5. On 410 (expired): render `PortalExpired`
6. Approval actions POST via `submitClientAction()` → refetch portal data

**PortalShell (from design system):**
- No sidebar, no navigation chrome, no hamburger
- Trust banner: operator name/business at top (not Luma branding)
- Period context: always show which month this is for
- "Powered by Luma" footer
- max-w-2xl (672px) centered — optimal 65-75 chars/line reading width
- Generous padding: 24px mobile / 48px desktop
- Portal-specific CSS class overrides:
  - `--background: 0 0% 99%` (cleaner white, less warm = "printed document" feel)
  - `--card: 0 0% 100%` (pure white, no noise texture)
  - Remove body noise texture background for portal

### 10c. Magic Link Management (Phase 1c)

**New files:**
- `src/components/clients/MagicLinkManager.tsx`
- `src/hooks/useMagicLink.ts`

**MagicLinkManager UI:**
- Section within ClientDetail page (below contact info card)
- States:
  1. No link → "Generate Portal Link" button
  2. Link exists → Truncated URL + copy button + expiry badge + "Regenerate" button
  3. Link expired → "Expired" badge + "Regenerate" button

### 10d. Capacity Dashboard (Phase 1b)

**New files:**
- `src/components/dashboard/CapacityOverview.tsx`
- `src/components/dashboard/StatCard.tsx`
- `src/hooks/useCapacity.ts`

**CapacityOverview:**
- Shows all active clients with current-period scope usage
- Mini progress bars per client
- Color-coded by scope status
- "X clients over scope" alert at top if any exceeded
- Clickable rows → navigate to client detail

---

## 11. Implementation Priorities

Aligned with the SPEC.md build order:

### Phase 1a: Core Loop (Weeks 1-2) — MOSTLY DONE + Design System Components

| # | Task | Status | Files |
|---|------|--------|-------|
| 1 | Auth (login, signup, OAuth, callback) | Done | `Login.tsx`, `AuthCallback.tsx`, `useAuth.tsx` |
| 2 | Client CRUD (list, create, detail) | Done | `ClientList.tsx`, `ClientDetail.tsx`, `CreateClientDialog.tsx`, `useClients.ts` |
| 3 | Delivery logging (dialog form) | Done | `LogDeliveryDialog.tsx`, `useDeliveries.ts` |
| 4 | Dashboard (stats, client preview) | Done | `Dashboard.tsx` |
| 5 | Layout (sidebar, mobile nav) | Done | `AppShell.tsx`, `Sidebar.tsx`, `Header.tsx` |
| 6 | **EmptyState** reusable component | TODO | `src/components/ui/empty-state.tsx` |
| 7 | **StatusBadge** unified component | TODO | `src/components/ui/status-badge.tsx` |
| 8 | **ClientAvatar** reusable component | TODO | `src/components/clients/ClientAvatar.tsx` |
| 9 | **ClientCard** with ScopeTrackerCompact | TODO | `src/components/clients/ClientCard.tsx` |
| 10 | **StatCard** extracted from Dashboard | TODO | `src/components/dashboard/StatCard.tsx` |
| 11 | **PageHeader** consistent header | TODO | `src/components/shared/PageHeader.tsx` |
| 12 | **ErrorBoundary** + **QueryErrorState** | TODO | `src/components/shared/Error*.tsx` |
| 13 | **QuickAddDelivery** inline input | TODO | `src/components/deliveries/QuickAddDelivery.tsx` |
| 14 | **DeliveryTimeline** grouped view | TODO | `src/components/deliveries/DeliveryTimeline.tsx` |
| 15 | **OnboardingChecklist** (dashboard 0-state) | TODO | `src/components/onboarding/OnboardingChecklist.tsx` |
| 16 | **useOnboarding** hook (localStorage) | TODO | `src/hooks/useOnboarding.ts` |
| 17 | Staggered list animations | TODO | CSS `animation-delay` pattern in timeline/list components |
| 18 | Add portal-specific CSS variables | TODO | `src/index.css` additions |

### Phase 1b: Scope Management (Weeks 2-3)

| # | Task | Files |
|---|------|-------|
| 1 | `scope-utils.ts` — 5-tier calculation helpers | `src/lib/scope-utils.ts` |
| 2 | `ScopeTracker` full component (layered bar) | `src/components/scope/ScopeTracker.tsx` |
| 3 | `ScopeTrackerCompact` for client cards | `src/components/scope/ScopeTrackerCompact.tsx` |
| 4 | `ScopeAllocationForm` dialog | `src/components/scope/ScopeAllocationForm.tsx` |
| 5 | `ScopeExceededBanner` alert | `src/components/scope/ScopeExceededBanner.tsx` |
| 6 | `ScopeRequestCard` individual card | `src/components/scope/ScopeRequestCard.tsx` |
| 7 | `ScopeRequestDialog` + `ScopeRequestList` | `src/components/scope/ScopeRequest*.tsx` |
| 8 | `useScopeRequests` hook | `src/hooks/useScopeRequests.ts` |
| 9 | Add Scope Requests tab to ClientDetail | `src/pages/ClientDetail.tsx` |
| 10 | Integrate ScopeTracker into ClientDetail | `src/pages/ClientDetail.tsx` |
| 11 | `CapacityOverview` on Dashboard | `src/components/dashboard/CapacityOverview.tsx` |
| 12 | `useCapacity` derived hook | `src/hooks/useCapacity.ts` |

### Phase 1c: Client Portal + Magic Links (Weeks 3-5)

| # | Task | Files |
|---|------|-------|
| 1 | `portal-api.ts` — edge function wrapper | `src/lib/portal-api.ts` |
| 2 | `usePortal` + `useClientAction` hooks | `src/hooks/usePortal.ts` |
| 3 | `PortalShell` layout (max-w-2xl, branded) | `src/components/layout/PortalShell.tsx` |
| 4 | Portal CSS overrides (cleaner white) | `src/index.css` portal class |
| 5 | `Portal.tsx` page + routing (single scroll) | `src/pages/Portal.tsx`, `src/App.tsx` |
| 6 | `PortalScopeCard` (simple bar, no breakdown) | `src/components/portal/PortalScopeCard.tsx` |
| 7 | `PortalTimeline` (no hours, simplified status) | `src/components/portal/PortalTimeline.tsx` |
| 8 | `ApprovalCard` (with expandable textarea) | `src/components/portal/ApprovalCard.tsx` |
| 9 | `PortalExpired` + `PortalNotFound` | `src/components/portal/Portal*.tsx` |
| 10 | Past months collapsible section | `src/pages/Portal.tsx` (Accordion) |
| 11 | `MagicLinkPanel` + `useMagicLink` | `src/components/clients/MagicLinkPanel.tsx` |
| 12 | Add magic link section to ClientDetail | `src/pages/ClientDetail.tsx` |

### Phase 2: Polish + Approvals (Weeks 5-7)

| # | Task | Files |
|---|------|-------|
| 1 | Approval status badges on operator side | `src/components/deliveries/DeliveryCard.tsx` |
| 2 | Optimistic updates for delivery mutations | `src/hooks/useDeliveries.ts` |
| 3 | Pagination for delivery lists (20/page) | `src/components/deliveries/DeliveryTimeline.tsx` |
| 4 | Scope exceeded warning on new delivery | `QuickAddDelivery` / `LogDeliveryDialog` |
| 5 | Dark mode toggle | `Settings.tsx`, theme context |
| 6 | Operator profile editing | `Settings.tsx` |
| 7 | Delivery category templates | `src/lib/constants.ts` |
| 8 | `progress-fill` animation (600ms) for scope bar | `src/index.css` keyframe |

---

## 12. Technical Decisions

### Form Handling

- **Library**: react-hook-form v7 + @hookform/resolvers (zod)
- **Pattern**: Each form is a dialog component with its own `useForm` instance
- **Validation**: Zod schemas in `src/lib/schemas.ts` — single source of truth
- **Submit flow**: `form.handleSubmit(onSubmit)` → `useMutation.mutateAsync()` → toast + close dialog

### Code Splitting

- All pages are lazy-loaded via `React.lazy()` + `<Suspense>`
- The portal route is especially important to keep separate (different audience, no auth overhead)
- shadcn/ui components are tree-shaken by Vite (only imported components are bundled)

### Performance Considerations

1. **TanStack Query deduplication**: Multiple components reading the same query key share one network request
2. **staleTime: 30s**: Prevents unnecessary re-fetches on navigation within 30 seconds
3. **gcTime: 10min** (default): Keeps inactive query data in memory for fast back-navigation
4. **Lazy routes**: Only load page JS when navigated to
5. **Skeleton loading**: Perceived performance — layout renders immediately, data fills in (skeletons mirror exact layout of loaded content)
6. **Pagination**: Delivery lists paginate at 20 items to avoid DOM bloat with 1000+ items per client
7. **No heavy charting**: Custom CSS-based progress bars for scope (recharts available if needed for capacity view)
8. **Staggered animations capped**: Max 5 items staggered (100ms each), rest appear together — prevents long animation chains

### Motion & Animation (from Design System)

| Animation | Duration | Easing | Use |
|-----------|----------|--------|-----|
| `hover-lift` | 200ms | ease-out | Card hover (translateY -2px) — already in `.card-interactive` |
| `fade-in` | 500ms | ease-out | Page content reveal — already in `tailwind.config.ts` |
| `scale-in` | 300ms | ease-out | Dialog/sheet opening — already in `tailwind.config.ts` |
| `progress-fill` | 600ms | ease-out | Scope bar filling on load — **needs adding** |
| `success-flash` | 200ms | ease-out | QuickAddDelivery success — **needs adding** |
| `stagger-delay` | 100ms/item | — | List item entrance — CSS `animation-delay` pattern |

**Staggered reveals for list content:**
```tsx
<div
  className="animate-fade-in"
  style={{ animationDelay: `${Math.min(index, 5) * 100}ms` }}
>
```

**Button interactions:**
- Primary: subtle `scale(1.02)` on hover, `scale(0.98)` on active
- Destructive: no scale — direct color shift (reinforces "careful" feel)

**`prefers-reduced-motion`**: Already handled in `index.css` — all animations disabled

### Accessibility Checklist

- [ ] All interactive elements have visible focus indicators (shadcn/ui handles this)
- [ ] Form inputs have associated `<Label>` elements (react-hook-form `FormLabel`)
- [ ] Error messages are announced via `aria-live` regions
- [ ] Dialogs trap focus and have `aria-labelledby` (Radix handles this)
- [ ] Color is never the only indicator (text + color for status badges)
- [ ] `prefers-reduced-motion` respected (already in `index.css`)
- [ ] Skip navigation link for keyboard users
- [ ] Portal view readable at 200% zoom
- [ ] Minimum touch target 44x44px on mobile

### Security Notes (Frontend)

1. **No `dangerouslySetInnerHTML`** — React's JSX escaping prevents XSS
2. **Magic link tokens in URL only** — never stored in localStorage
3. **Portal has no auth context** — cannot access operator data even if compromised
4. **Form validation via Zod** — prevents malformed data from reaching the API
5. **Supabase RLS** is the real security boundary — frontend validation is UX, not security

---

## 13. New Hooks to Implement

### useScopeRequests

```typescript
// src/hooks/useScopeRequests.ts
export function useScopeRequests(clientId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.clients.scopeRequests(clientId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scope_requests')
        .select('*')
        .eq('client_id', clientId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ScopeRequest[];
    },
    enabled: !!clientId,
    staleTime: 30_000,
  });
}

export function useCreateScopeRequest() { /* ... mutation ... */ }
export function useUpdateScopeRequest() { /* ... mutation ... */ }
```

### usePortal

```typescript
// src/hooks/usePortal.ts
import { fetchPortalData, submitClientAction } from '@/lib/portal-api';

export function usePortalData(token: string | undefined) {
  return useQuery({
    queryKey: ['portal', token],
    queryFn: () => fetchPortalData(token!),
    enabled: !!token,
    staleTime: 5 * 60_000, // 5 min — portal data doesn't change frequently
    retry: false, // Don't retry on 404/410
  });
}

export function useClientAction(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { delivery_item_id: string; action: 'approved' | 'revision_requested'; note?: string }) =>
      submitClientAction({ ...payload, token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', token] });
    },
  });
}
```

### useMagicLink

```typescript
// src/hooks/useMagicLink.ts
export function useGenerateMagicLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (clientId: string) => {
      const res = await fetch(`${FUNCTIONS_URL}/generate-magic-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ client_id: clientId }),
      });
      if (!res.ok) throw new Error('Failed to generate link');
      return res.json(); // { token, expires_at, portal_url }
    },
    onSuccess: (_, clientId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(clientId) });
    },
  });
}
```

### useCapacity

```typescript
// src/hooks/useCapacity.ts
// Derives capacity data from existing client + scope queries
// Does not make a separate API call — uses useClients() data
export function useCapacity() {
  const { data: clients } = useClients();

  return useMemo(() => {
    if (!clients) return null;

    return clients
      .filter(c => c.status === 'active')
      .map(client => {
        const currentScope = getCurrentPeriodScope(client.scope_allocations);
        if (!currentScope) return { client, usage: null };

        const usage = calculateScopeUsage(currentScope, client.delivery_items);
        return { client, usage };
      })
      .sort((a, b) => (b.usage?.percentage ?? 0) - (a.usage?.percentage ?? 0));
  }, [clients]);
}
```

---

## 14. Zod Schemas to Add

```typescript
// Add to src/lib/schemas.ts

export const createScopeRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().max(5000).optional(),
  requested_by: z.enum(['client', 'operator']).default('operator'),
  scope_cost: z.number().min(0).max(10000).optional(),
});

export const clientApprovalSchema = z.object({
  delivery_item_id: z.string().uuid(),
  action: z.enum(['approved', 'revision_requested']),
  note: z.string().max(2000).optional(),
});

export type CreateScopeRequestInput = z.infer<typeof createScopeRequestSchema>;
export type ClientApprovalInput = z.infer<typeof clientApprovalSchema>;
```

---

## 15. Query Key Factory Update

```typescript
// Updated src/lib/query-keys.ts
export const queryKeys = {
  clients: {
    all: ['clients'] as const,
    detail: (id: string) => ['clients', id] as const,
    deliveries: (clientId: string) => ['clients', clientId, 'deliveries'] as const,
    scope: (clientId: string) => ['clients', clientId, 'scope'] as const,
    scopeRequests: (clientId: string) => ['clients', clientId, 'scope-requests'] as const,
  },
  operator: {
    profile: ['operator', 'profile'] as const,
    capacity: ['operator', 'capacity'] as const,
  },
  portal: {
    data: (token: string) => ['portal', token] as const,
  },
};
```

---

## 16. Dependencies (Current)

All dependencies are already installed. No new packages needed:

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^18.3.1 | UI framework |
| `react-router-dom` | ^6.30.1 | Client-side routing |
| `@supabase/supabase-js` | ^2.95.2 | Supabase client |
| `@tanstack/react-query` | ^5.83.0 | Server state management |
| `react-hook-form` | ^7.61.1 | Form state |
| `@hookform/resolvers` | ^3.10.0 | Zod resolver for RHF |
| `zod` | ^3.25.76 | Schema validation |
| `tailwindcss` | ^3.4.17 | Utility CSS |
| `lucide-react` | ^0.462.0 | Icons |
| `date-fns` | ^3.6.0 | Date formatting |
| `sonner` | ^1.7.4 | Toast notifications |
| `recharts` | ^2.15.4 | Charts (capacity view if needed) |
| `framer-motion` | ^12.23.26 | Animations (portal transitions) |
| shadcn/ui (Radix) | Various | Component primitives |

---

## 17. CSS Variable Additions (from Design System)

Add to `:root` in `src/index.css`:

```css
/* Scope status colors (semantic — maps to SCOPE_STATUS_COLORS in scope-utils.ts) */
--scope-on-track: 158 64% 40%;        /* success green */
--scope-active: 245 58% 51%;          /* primary indigo */
--scope-nearing: 28 92% 58%;          /* accent-warm amber */
--scope-exceeded: 0 84% 60%;          /* destructive red */

/* Quick-add specific */
--quick-add-success: 158 64% 40%;
--quick-add-border: 245 58% 51%;
```

Add portal-specific class to `src/index.css`:

```css
/* Portal overrides — cleaner, less warm than operator view */
.portal-view {
  --background: 0 0% 99%;
  --card: 0 0% 100%;
  background-image: none;  /* Remove noise texture */
}
```

Add new keyframes to `tailwind.config.ts`:

```typescript
keyframes: {
  // ... existing keyframes ...
  "progress-fill": {
    from: { width: "0%" },
    to: { width: "var(--progress-target)" },
  },
  "success-flash": {
    "0%": { borderColor: "hsl(var(--success))", opacity: "1" },
    "100%": { borderColor: "hsl(var(--border))", opacity: "1" },
  },
},
animation: {
  // ... existing animations ...
  "progress-fill": "progress-fill 600ms ease-out forwards",
  "success-flash": "success-flash 200ms ease-out",
},
```

---

## 18. Design System Integration Reference

This architecture document is aligned with `docs/ux/design-system.md` (task #4, completed).
Key decisions incorporated:

| Design Decision | Architecture Impact |
|----------------|---------------------|
| Single-scroll client portal (not tabs) | Portal.tsx is one page, sections scroll |
| 5-tier scope status | `scope-utils.ts` returns `ScopeStatus` type |
| QuickAddDelivery inline input | New Tier 1 component, `LogDeliveryDialog` is Tier 2 |
| ScopeTrackerCompact variant | Separate component for client cards |
| Progressive onboarding (no wizard) | `OnboardingChecklist` + `useOnboarding` hook |
| Triple encoding for status | `StatusBadge` always shows color + icon + label |
| Staggered list animations | CSS `animation-delay` pattern, max 5 items |
| Portal CSS overrides | `.portal-view` class with cleaner white theme |
| Custom layered progress bar | Not using shadcn `Progress` for scope (needs multi-segment) |
| DeliveryTimeline grouped by week | Replaces flat `DeliveryList` concept |
| ApprovalCard with expandable textarea | Inline expansion, not separate dialog |
| 44x44px min touch targets | All portal buttons, form inputs on mobile |
| Skeletons mirror exact layout | Per-component skeleton specs |

---

## Notes

- **React version**: Currently React 18 (not 19 as mentioned in SPEC.md). Upgrade post-MVP. No React 19 features used.
- **react-router-dom version**: Currently v6 (not v7 as mentioned in SPEC.md). v6 API is stable.
- **Tailwind version**: Currently v3 (not v4 as mentioned in SPEC.md). v3 is fully functional.
- **Vite version**: Currently v5 (not v6 as mentioned in SPEC.md). No blocking issues.
- Backend schema updates (task #5) are complete — types in `database.ts` already match.
