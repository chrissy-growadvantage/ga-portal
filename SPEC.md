# Luma — Client Delivery Operating System

> Make invisible delivery work visible. Turn operational effort into measurable value.

## Problem Statement

Service-based operators — OBMs, agencies, fractional COOs, senior VAs — complete high-value client work that is fragmented across CRMs, project management tools, email, and messaging platforms. As a result, clients cannot clearly see what has been delivered, scope boundaries blur, capacity becomes difficult to defend, and providers struggle to articulate measurable impact. Operators currently cobble together Notion templates, Loom walkthroughs, and manual end-of-month reports to communicate value. There is no purpose-built tool for this.

## Target Users

**Primary: The Operator** (the person who pays for Luma)
- Online Business Managers (OBMs)
- Fractional COOs / Integrators
- Senior Virtual Assistants
- Agency delivery leads
- Delivery-focused service providers managing 3-15 clients

**Secondary: The Client** (the person who views Luma)
- Small business owners
- Founders / CEOs of companies hiring operators
- Non-technical decision-makers who want clarity, not complexity
- **Key constraint: These people do not want another tool to learn. They want to open one link and instantly understand how their business is going.**

## Design Principles

1. **Operator builds, client views.** The operator has depth and controls. The client gets a clean, read-only experience.
2. **Simpler than a bank statement.** The client view should be immediately understandable with zero onboarding.
3. **No login required for clients.** Magic links or shareable URLs. No passwords, no accounts.
4. **Pull, don't duplicate.** Luma pulls work data from existing tools (ClickUp, Asana, GHL, etc.) — operators should not re-enter work.
5. **Scope is a first-class citizen.** Every feature considers: does this help the operator protect scope?

## Goals

1. Reduce time operators spend creating client reports by 80% (from ~2hrs/client/month to <15min)
2. Eliminate "what have you been doing?" conversations — clients can self-serve that answer
3. Give operators a defensible record of scope boundaries and change requests
4. Increase client retention for operators by making value visible (target: measurable in 6 months)
5. Create a category — "Client Delivery OS" — that Luma owns

## Non-Goals (MVP)

1. **Not a project management tool.** Luma does not replace ClickUp/Asana. It reads from them.
2. **Not an invoicing tool.** No billing, payments, or subscriptions in v1.
3. **Not a CRM.** Does not manage sales pipeline or leads.
4. **Not a communication tool.** No chat, no messaging, no email. Luma is a visibility layer.
5. **Not multi-team.** v1 is for solo operators or small teams, not enterprise agencies with 50+ staff.

## User Stories

### Operator Stories

- As an operator, I want to **connect my project management tool** so that completed tasks automatically flow into Luma without re-entry.
- As an operator, I want to **define scope allocations per client** (e.g., "20 hours/month" or "5 deliverables/month") so that I can track what's been used vs. what remains.
- As an operator, I want to **log delivery items** (tasks completed, deliverables shipped, approvals received) so that there is a structured record of work done.
- As an operator, I want to **flag scope change requests** separately from agreed work so that I can show clients when work exceeds the original agreement.
- As an operator, I want to **generate a client-facing summary** for any time period so that I don't have to manually create reports.
- As an operator, I want to **see a capacity dashboard** across all my clients so that I know if I'm overcommitted.
- As an operator, I want to **share a client view via magic link** so that my client can see their delivery status without creating an account.

### Client Stories

- As a client, I want to **open one link and see what's been delivered** this month so that I don't have to ask my operator for updates.
- As a client, I want to **see a simple summary** (not a task list) so that I understand the big picture without getting lost in details.
- As a client, I want to **approve or request changes** on deliverables so that my feedback is captured in one place.
- As a client, I want to **see how my scope is being used** so that I understand what I'm getting for what I pay.
- As a client, I want to **view past months' summaries** so that I can see the trajectory of work over time.

## Requirements

### P0 — Must Have (MVP)

**Operator Dashboard**
- Client list with status indicators (on track, needs attention, scope exceeded)
- Per-client view showing: scope allocation, delivery log, pending approvals, scope requests
- Manual entry for delivery items (title, category, date, status, notes)
- Scope allocation setup per client (hours-based or deliverables-based)
- Scope tracker showing used vs. remaining with visual progress bar
- Acceptance criteria: Operator can set up a client, log work, and share a view in under 5 minutes

**Client View (Magic Link)**
- No login required — unique shareable URL per client
- Monthly summary card: what was delivered, key metrics, scope usage
- Delivery timeline: chronological list of completed items grouped by week/month
- Scope usage visual: simple bar or ring showing "X of Y used"
- Approval actions: client can mark items as "approved" or "needs revision"
- Acceptance criteria: A non-technical business owner can understand the view in under 10 seconds

**Scope Management**
- Define scope per client (hours, deliverables, or custom units)
- Track usage against scope automatically as delivery items are logged
- Flag when scope is exceeded with clear visual indicators
- Separate log for out-of-scope requests
- Acceptance criteria: Operator can identify scope creep within one click

**Auth & Multi-Client**
- Supabase Auth for operators (email/password + Google OAuth)
- No auth for clients (magic links with expiring tokens)
- Multi-client support per operator account
- Acceptance criteria: Single operator can manage 15 clients from one account

### P1 — Nice to Have (v1.1)

**Integrations**
- Pull completed tasks from ClickUp, Asana, or Trello
- Pull activity from GoHighLevel (for GHL-based operators)
- Auto-categorize imported tasks into delivery categories
- Acceptance criteria: Operator connects tool once, tasks flow in automatically

**Reporting**
- Auto-generated monthly summary (exportable as PDF)
- Impact metrics per client (custom KPIs the operator defines)
- Historical comparison (this month vs. last month)
- Acceptance criteria: Monthly report generated in one click

**Templates**
- Scope templates for common service packages (OBM retainer, VA package, etc.)
- Delivery category templates (Marketing, Operations, Finance, Tech, Admin)
- Acceptance criteria: New client setup takes under 2 minutes using a template

### P2 — Future Considerations

- **Client-side login** for clients who want to bookmark their portal
- **Team support** — multiple operators under one account sharing clients
- **AI summaries** — Vercel AI SDK to auto-generate natural language delivery summaries
- **Billing integration** — connect to Stripe/invoicing to tie delivery to payments
- **White-labeling** — operators can brand the client view with their own logo/colors
- **Mobile app** — push notifications when clients approve or request changes
- **API** — allow operators to push delivery data from custom tools

## Data Model

### Core Tables

```
operators
├── id (uuid, PK)
├── email (text, unique)
├── full_name (text)
├── business_name (text, nullable)
├── avatar_url (text, nullable)
├── created_at (timestamptz)
└── updated_at (timestamptz)

clients
├── id (uuid, PK)
├── operator_id (uuid, FK → operators)
├── name (text) — client's business or person name
├── contact_email (text, nullable)
├── status (enum: active, paused, archived)
├── magic_link_token_hash (text, unique) — SHA-256 hash of magic link token
├── magic_link_expires_at (timestamptz, nullable)
├── created_at (timestamptz)
└── updated_at (timestamptz)

scope_allocations
├── id (uuid, PK)
├── client_id (uuid, FK → clients)
├── period_start (date) — e.g., 2026-02-01
├── period_end (date) — e.g., 2026-02-28
├── scope_type (enum: hours, deliverables, custom)
├── total_allocated (numeric) — e.g., 20 (hours) or 10 (deliverables)
├── unit_label (text) — e.g., "hours", "deliverables", "tasks"
├── created_at (timestamptz)
└── updated_at (timestamptz)

delivery_items
├── id (uuid, PK)
├── client_id (uuid, FK → clients)
├── scope_allocation_id (uuid, FK → scope_allocations, nullable)
├── title (text)
├── description (text, nullable)
├── category (text) — e.g., "Marketing", "Operations", "Tech"
├── status (enum: completed, in_progress, pending_approval, approved, revision_requested)
├── scope_cost (numeric, default 1) — how many scope units this consumed
├── is_out_of_scope (boolean, default false)
├── completed_at (timestamptz, nullable)
├── created_at (timestamptz)
└── updated_at (timestamptz)

scope_requests
├── id (uuid, PK)
├── client_id (uuid, FK → clients)
├── title (text)
├── description (text, nullable)
├── requested_by (enum: client, operator)
├── status (enum: pending, approved, declined, completed)
├── scope_cost (numeric, nullable) — estimated cost if approved
├── created_at (timestamptz)
└── updated_at (timestamptz)

client_approvals
├── id (uuid, PK)
├── delivery_item_id (uuid, FK → delivery_items)
├── action (enum: approved, revision_requested)
├── note (text, nullable) — client's comment
├── acted_at (timestamptz)
└── created_at (timestamptz)

audit_log
├── id (uuid, PK)
├── actor_type (text, CHECK: operator|client|system)
├── actor_id (text, nullable) — operator UUID, token hash, or 'system'
├── action (enum: create, update, delete, approve, revision_requested, magic_link_generated, magic_link_regenerated, scope_exceeded)
├── entity_type (text, CHECK: client|delivery_item|scope_allocation|scope_request|client_approval)
├── entity_id (uuid)
├── metadata (jsonb, default '{}')
└── created_at (timestamptz)
```

### Database Indexes

```
-- Primary lookup indexes (on FK columns)
clients(operator_id)
clients(magic_link_token_hash)
delivery_items(client_id)
delivery_items(scope_allocation_id)
scope_requests(client_id)
client_approvals(delivery_item_id)

-- Composite indexes for common query patterns
delivery_items(client_id, completed_at)        — date-range delivery queries
scope_allocations(client_id, period_start, period_end) — period lookups
scope_requests(client_id, status)              — filtered request lists

-- Audit log indexes
audit_log(entity_type, entity_id)
audit_log(actor_type, actor_id)
audit_log(created_at)
```

### Constraints

```
-- Unique constraints
scope_allocations(client_id, period_start, period_end) — one allocation per client per period
clients(magic_link_token_hash) — unique token hashes

-- CHECK constraints
scope_allocations: period_end >= period_start
delivery_items: scope_cost >= 0
scope_allocations: total_allocated >= 0
delivery_items: hours_spent >= 0
scope_requests: scope_cost >= 0
audit_log: actor_type IN ('operator', 'client', 'system')
audit_log: entity_type IN ('client', 'delivery_item', 'scope_allocation', 'scope_request', 'client_approval')

-- ON DELETE CASCADE rules
clients → operators: CASCADE (deleting operator deletes all their clients)
scope_allocations → clients: CASCADE (deleting client deletes allocations)
delivery_items → clients: CASCADE (deleting client deletes delivery items)
delivery_items → scope_allocations: SET NULL (deleting allocation preserves items)
scope_requests → clients: CASCADE (deleting client deletes requests)
client_approvals → delivery_items: CASCADE (deleting item deletes approvals)
```

### RLS Policies
- All tables: RLS enabled
- operators: `auth.uid() = id`
- clients: `operator_id = auth.uid()`
- scope_allocations: via client → operator chain
- delivery_items: via client → operator chain
- scope_requests: via client → operator chain
- client_approvals: via delivery_item → client → operator chain
- Magic link access: separate Supabase edge function that validates token and returns read-only client data

### Supabase Conventions
- Client in `src/lib/supabase.ts`
- Edge function for magic link validation (`/functions/v1/client-portal`)
- Migrations in `supabase/migrations/` with descriptive snake_case names
- Seed data for demo operator with 3 sample clients

## Tech Stack

```
Frontend: React 19 + TypeScript + Vite 6+
Styling: Tailwind CSS v4 + shadcn/ui (Radix) + lucide-react
Routing: react-router-dom v7
Data: TanStack React Query + react-hook-form + zod
Backend: Supabase (Auth, Database, RLS, Edge Functions)
Deployment: Vercel
```

## Success Metrics

**Leading Indicators (track from day 1)**
- Time to first client setup (target: <5 minutes)
- Operator weekly active usage (target: 3+ sessions/week)
- Client view opens per client per month (target: 2+ views = clients are checking)
- Delivery items logged per operator per week (target: 10+ = operators are using it)

**Lagging Indicators (track after 3 months)**
- Operator retention at 90 days (target: >60%)
- Net Promoter Score from operators (target: >40)
- Reduction in "what have you been doing?" client conversations (qualitative survey)
- Client retention rate improvement for operators using Luma (target: measurable lift)

## Open Questions

1. **[Design]** What is the ideal client view layout? Single scrollable page vs. tabbed sections?
2. **[Product]** Should scope periods be fixed monthly or allow custom periods (fortnightly, quarterly)?
3. **[Product]** Do operators want to set scope at the category level (e.g., "10 hours for marketing, 5 for ops") or just total?
4. **[Engineering]** Which PM tool integrations to prioritize first? ClickUp vs. Asana vs. Trello — survey operators.
5. **[Business]** Pricing model — per operator flat fee, or per client seat, or tiered by client count?

## Prioritization (RICE Analysis)

All P0 features validated — RICE scores range from 4.5 (Client Approvals) to 14.3 (Supabase Auth). Key insights:

- **Scope management is the differentiator** — Scope Tracker (10.8) and Scope Allocation (10.2) score highest among non-auth features. No competitor owns this.
- **Client Approval Actions (4.5) is lowest P0** — consider deferring to post-MVP v1.1 release based on user feedback.
- **Templates are quick wins** — Category Templates (6.8) and Scope Templates (4.5) have low effort, high impact on onboarding.
- **Mobile app is a money pit** — RICE score of 0.15. Defer indefinitely; responsive web covers the need.
- **AI summaries (3.0) should be P1 priority** once data foundation exists — directly serves the core value prop.

Full scoring in `Luma-PM-Analysis.docx`.

## Metrics Framework

**North Star Metric:** Client Views per Active Operator per Month
- Captures full value chain: operators log work → create views → clients engage
- Target: 2+ client views per active operator per month within 90 days

**Launch Quarter OKRs:**
1. **Prove operator adoption** — 80% complete first client setup in <5min, 60% log 10+ items/week, 50% return 3x/week
2. **Prove client value** — 50% of shared links opened 2x/month, >30s avg time on view, 60% report fewer "what have you been doing?" conversations
3. **Validate scope as killer feature** — 70% set up scope allocations, 40% log out-of-scope requests, 60% cite scope tracker as top-3 feature

## Competitive Positioning

**Category:** Client Delivery OS (no current owner)

**Key competitors:** Motion.io/LaunchBay ($17-59/user/mo, client portals, no scope tracking), SPP.co ($129+/mo, agency ops suite, weak scope), SuiteDash ($19+/mo, all-in-one CRM, overwhelming), Manual process (Notion + Loom + Sheets, fragmented)

**Luma's wedge:** Only tool with Strong delivery logging + Strong scope management + Strong simple client view. Competitors are either too broad (SuiteDash), too expensive (SPP.co), or missing scope (Motion.io).

**Positioning:** For service-based operators who need to show clients what they've delivered and protect their scope, Luma is a Client Delivery OS that turns invisible work into a clear, shareable client view with built-in scope tracking. Unlike PM tools or agency suites, Luma is purpose-built for making the operator's value undeniable.

**Pricing signal:** $29-49/mo per operator, unlimited clients. Below SPP.co, above SuiteDash.

## Technical Design (Phase 7)

### 7a. Architecture

**Data Flow**

```
Operator (browser)
  → React app (Vite SPA on Vercel)
    → Supabase JS client (supabase-js v2)
      → Supabase PostgREST (CRUD via RLS)
      → Supabase Auth (JWT tokens)
      → Supabase Edge Functions (magic link validation, PDF export)
    → TanStack Query (client-side cache + optimistic updates)

Client (browser, no auth)
  → GET /functions/v1/client-portal?token={raw_token}
    → Edge function hashes token with SHA-256, looks up magic_link_token_hash
    → Returns read-only client data (deliveries, scope, approvals)
  → React client view (separate route, no auth context)
    → POST /functions/v1/client-action (approve/request revision)
      → Edge function validates token, writes to client_approvals
```

**State Management Strategy**

| State Type | Where It Lives | Tool |
|-----------|---------------|------|
| Server state (clients, deliveries, scope) | Supabase → TanStack Query cache | `useQuery` / `useMutation` with optimistic updates |
| Form state (create client, log delivery) | Component-local | `react-hook-form` + `zod` validation |
| UI state (modals, sidebar, filters) | Component-local or context | `useState` / lightweight React context |
| URL state (active client, date range, tab) | URL search params | `react-router-dom` `useSearchParams` |
| Auth state | Supabase session | `supabase.auth.onAuthStateChange` → React context |

No global state library needed. TanStack Query handles server state; everything else is local or URL-driven.

**API Design**

Luma uses Supabase PostgREST directly for all CRUD — no custom REST API layer. This means:

- **Reads**: `supabase.from('clients').select('*').eq('operator_id', userId)` — RLS handles authorization
- **Writes**: `supabase.from('delivery_items').insert({...})` — RLS validates operator owns the client
- **Joins**: Use Supabase's nested select syntax for related data (e.g., client with scope allocations and delivery items in one query)

Edge Functions (Deno) handle the two cases PostgREST can't:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/functions/v1/client-portal` | GET | Validate magic link token, return client data bundle |
| `/functions/v1/client-action` | POST | Accept approval/revision from unauthenticated client |
| `/functions/v1/generate-magic-link` | POST | Generate/refresh magic link token for a client |
| `/functions/v1/export-pdf` | POST | Generate PDF summary for a client period (P1) |

**Edge Function Response Schemas**

`GET /functions/v1/client-portal?token={raw_token}&page=1&per_page=20`

```typescript
// Success (200)
{
  client: {
    id: string;
    company_name: string;
    status: "active" | "paused" | "archived";
  };
  scope: {
    allocation: {
      id: string;
      period_start: string;        // ISO date
      period_end: string;          // ISO date
      scope_type: "hours" | "deliverables" | "custom";
      total_allocated: number;
      unit_label: string;
    } | null;                      // null if no scope set for current period
    used: number;                  // sum of scope_cost for in-scope items
    remaining: number;             // total_allocated - used (can be negative)
    is_exceeded: boolean;
  };
  deliveries: {
    items: Array<{
      id: string;
      title: string;
      description: string | null;
      category: string;
      status: "completed" | "in_progress" | "pending_approval" | "approved" | "revision_requested";
      scope_cost: number;
      is_out_of_scope: boolean;
      completed_at: string | null; // ISO timestamp
      approval: {
        action: "approved" | "revision_requested";
        note: string | null;
        acted_at: string;
      } | null;
    }>;
    pagination: {
      page: number;
      per_page: number;
      total_count: number;
      total_pages: number;
    };
  };
  scope_requests: Array<{
    id: string;
    title: string;
    description: string | null;
    status: "pending" | "approved" | "declined" | "completed";
    scope_cost: number | null;
    created_at: string;            // ISO timestamp
  }>;
}

// Error responses
// 400 — { error: "missing_token", message: "Token parameter is required" }
// 404 — { error: "not_found", message: "Portal link not found" }
// 410 — { error: "expired", message: "This link has expired. Contact your operator for a new link." }
// 429 — { error: "rate_limited", message: "Too many requests. Please try again later." }
```

`POST /functions/v1/client-action`

```typescript
// Request body
{
  token: string;                   // raw magic link token
  delivery_item_id: string;        // UUID
  action: "approved" | "revision_requested";
  note?: string;                   // optional comment (max 2000 chars)
}

// Success (200)
{
  success: true;
  approval: {
    id: string;
    delivery_item_id: string;
    action: "approved" | "revision_requested";
    note: string | null;
    acted_at: string;
  };
}

// Error responses
// 400 — { error: "validation_error", message: "..." }
// 403 — { error: "unauthorized", message: "This delivery item does not belong to your portal" }
// 404 — { error: "not_found", message: "Portal link not found" }
// 410 — { error: "expired", message: "This link has expired" }
// 429 — { error: "rate_limited", message: "Too many requests" }
```

`POST /functions/v1/generate-magic-link`

```typescript
// Request (requires operator auth via Authorization header)
{
  client_id: string;               // UUID
  expires_in_days?: number;        // default: 30, max: 365
}

// Success (200)
{
  success: true;
  magic_link_url: string;          // full URL: {APP_URL}/portal/{raw_token}
  expires_at: string;              // ISO timestamp
}

// Error responses
// 401 — { error: "unauthorized", message: "Authentication required" }
// 403 — { error: "forbidden", message: "You do not own this client" }
// 404 — { error: "not_found", message: "Client not found" }
```

**Query Key Structure (TanStack Query)**

```typescript
queryKeys = {
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
}
```

**Caching Strategy**

- TanStack Query `staleTime`: 30 seconds for dashboard data, 5 minutes for client portal data
- `gcTime`: 10 minutes — keep inactive queries in memory for fast back-navigation
- Optimistic updates for: creating delivery items, updating scope, submitting approvals — revert on error
- Invalidation: After any mutation, invalidate the parent query key
- Client portal data fetched once per session via edge function (no real-time subscription needed)

**Folder Structure**

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── layout/          # Shell, sidebar, header
│   ├── clients/         # Client list, client card, client detail
│   ├── deliveries/      # Delivery log, delivery form, delivery item
│   ├── scope/           # Scope tracker, scope allocation form, scope request
│   ├── approvals/       # Approval badge, approval actions
│   └── portal/          # Client-facing view components
├── hooks/
│   ├── useClients.ts
│   ├── useDeliveries.ts
│   ├── useScope.ts
│   ├── useAuth.ts
│   └── usePortal.ts     # Client portal data hook (uses edge function)
├── lib/
│   ├── supabase.ts      # Supabase client singleton
│   ├── query-keys.ts    # TanStack Query key factory
│   └── utils.ts         # Shared utilities
├── pages/
│   ├── Dashboard.tsx     # Client list + capacity overview
│   ├── ClientDetail.tsx  # Per-client view with tabs
│   ├── Settings.tsx      # Operator profile + preferences
│   ├── Login.tsx         # Auth page
│   └── Portal.tsx        # Client-facing magic link view (no auth)
├── types/
│   └── database.ts      # Generated Supabase types
└── App.tsx              # Router + providers
```

**Routing**

```typescript
// Operator routes (auth required)
/                     → Dashboard (client list + capacity)
/clients/:id          → Client detail (deliveries, scope, requests)
/clients/:id/edit     → Edit client settings
/settings             → Operator profile

// Client portal routes (no auth — token in URL)
/portal/:token        → Client view (read-only deliveries + scope + approvals)

// Auth routes
/login                → Sign in / sign up
/auth/callback        → OAuth callback
```

### 7b. Security

**Auth Flow**

1. **Sign up**: Email/password or Google OAuth → Supabase Auth → creates `auth.users` row → database trigger creates matching `operators` row
2. **Sign in**: Email/password or Google OAuth → Supabase returns JWT → stored in `localStorage` via `supabase-js`
3. **Password reset**: Supabase built-in flow → email with reset link → `/auth/callback` handles token
4. **Session management**: `supabase.auth.onAuthStateChange` listens for token refresh. JWT refresh automatic via `supabase-js`.

**Database trigger for operator creation:**

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.operators (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**RLS Policies (detailed)**

```sql
-- operators: only read/update own row
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "operators_select_own" ON operators FOR SELECT USING (auth.uid() = id);
CREATE POLICY "operators_update_own" ON operators FOR UPDATE USING (auth.uid() = id);

-- clients: operator can CRUD their own clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clients_select" ON clients FOR SELECT USING (operator_id = auth.uid());
CREATE POLICY "clients_insert" ON clients FOR INSERT WITH CHECK (operator_id = auth.uid());
CREATE POLICY "clients_update" ON clients FOR UPDATE USING (operator_id = auth.uid());
CREATE POLICY "clients_delete" ON clients FOR DELETE USING (operator_id = auth.uid());

-- scope_allocations: via client ownership chain
ALTER TABLE scope_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scope_alloc_select" ON scope_allocations FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE operator_id = auth.uid()));
CREATE POLICY "scope_alloc_insert" ON scope_allocations FOR INSERT
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE operator_id = auth.uid()));
CREATE POLICY "scope_alloc_update" ON scope_allocations FOR UPDATE
  USING (client_id IN (SELECT id FROM clients WHERE operator_id = auth.uid()));
CREATE POLICY "scope_alloc_delete" ON scope_allocations FOR DELETE
  USING (client_id IN (SELECT id FROM clients WHERE operator_id = auth.uid()));

-- delivery_items: via client ownership chain
ALTER TABLE delivery_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "delivery_select" ON delivery_items FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE operator_id = auth.uid()));
CREATE POLICY "delivery_insert" ON delivery_items FOR INSERT
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE operator_id = auth.uid()));
CREATE POLICY "delivery_update" ON delivery_items FOR UPDATE
  USING (client_id IN (SELECT id FROM clients WHERE operator_id = auth.uid()));
CREATE POLICY "delivery_delete" ON delivery_items FOR DELETE
  USING (client_id IN (SELECT id FROM clients WHERE operator_id = auth.uid()));

-- scope_requests: via client ownership chain
ALTER TABLE scope_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scope_req_select" ON scope_requests FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE operator_id = auth.uid()));
CREATE POLICY "scope_req_insert" ON scope_requests FOR INSERT
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE operator_id = auth.uid()));
CREATE POLICY "scope_req_update" ON scope_requests FOR UPDATE
  USING (client_id IN (SELECT id FROM clients WHERE operator_id = auth.uid()));

-- client_approvals: via delivery_item → client → operator chain
ALTER TABLE client_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "approval_select" ON client_approvals FOR SELECT
  USING (delivery_item_id IN (
    SELECT id FROM delivery_items WHERE client_id IN (
      SELECT id FROM clients WHERE operator_id = auth.uid()
    )
  ));
-- No direct insert/update for operators — client_approvals written by edge function
```

**Magic Link Security**

- Token format: `crypto.randomUUID()` — 128-bit random, not guessable
- Tokens stored hashed in database: `magic_link_token_hash` stores `SHA-256(raw_token)`, client URL contains raw token
- Expiry: 30 days default, configurable per client. Edge function checks `magic_link_expires_at`.
- Regeneration: Operator can regenerate token at any time (invalidates previous link)
- Rate limiting on edge function: max 60 requests per token per minute
- Client actions (approvals) require: valid token + delivery_item belongs to that client

**Input Validation**

| Layer | What's Validated | How |
|-------|-----------------|-----|
| Client (forms) | All form inputs | `zod` schemas via `react-hook-form` |
| Edge functions | Token format, request body | `zod` in Deno edge function |
| Database | Constraints, RLS | PostgreSQL CHECK constraints + RLS policies |

**Key Zod Schemas**

```typescript
const createClientSchema = z.object({
  name: z.string().min(1).max(200),
  contact_email: z.string().email().optional().or(z.literal('')),
  status: z.enum(['active', 'paused', 'archived']).default('active'),
});

const createDeliveryItemSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  category: z.string().min(1).max(100),
  scope_cost: z.number().min(0).max(10000).default(1),
  is_out_of_scope: z.boolean().default(false),
});

const createScopeAllocationSchema = z.object({
  period_start: z.string().date(),
  period_end: z.string().date(),
  scope_type: z.enum(['hours', 'deliverables', 'custom']),
  total_allocated: z.number().min(0).max(100000),
  unit_label: z.string().min(1).max(50),
});
```

**Threat Surface**

| Threat | Mitigation |
|--------|------------|
| Operator A reads Operator B's clients | RLS policies — all queries filtered by `auth.uid()` |
| Client guesses another client's magic link | 128-bit UUID tokens — computationally infeasible |
| Expired magic link reuse | Edge function checks `magic_link_expires_at` |
| Client submits approval for wrong delivery item | Edge function validates delivery_item belongs to token's client |
| SQL injection via form inputs | Supabase parameterized queries + zod validation |
| XSS via delivery item titles/descriptions | React's default JSX escaping + no `dangerouslySetInnerHTML` |
| CSRF | Supabase Auth uses JWT in `Authorization` header |
| Brute force login | Supabase Auth built-in rate limiting |
| Magic link token scraping | Rate limiting on edge function (60 req/min/token) |

### 7b-2. Audit Logging Strategy

**Purpose:** Provide a lightweight, append-only audit trail for compliance, debugging, and operator visibility into client actions.

**What gets logged:**
| Event | Actor | Trigger |
|-------|-------|---------|
| Delivery item created/updated/deleted | operator | DB trigger on `delivery_items` |
| Client approval submitted | client | DB trigger on `client_approvals` |
| Magic link generated/regenerated | operator | Edge function `generate-magic-link` |
| Scope exceeded threshold | system | Application logic when `used > total_allocated` |

**What does NOT get logged (MVP):**
- Read access / portal views (too noisy, use Supabase analytics instead)
- Auth events (Supabase Auth has its own audit log)
- Scope allocation CRUD (low risk, can add post-MVP)

**Retention:** No automatic cleanup in MVP. Post-MVP: add a `pg_cron` job to archive entries older than 12 months.

**Access:** Operators can read audit entries for their own entities via RLS. No direct INSERT/UPDATE/DELETE for operators — entries written by `SECURITY DEFINER` functions only (append-only guarantee).

**Schema:** See `audit_log` table in Data Model above. Uses `JSONB metadata` column for flexible context without schema migrations.

### 7c. Testing Strategy

**Critical Paths (must have tests)**

1. **Auth flow**: Sign up → operator row created → can access dashboard
2. **Client CRUD**: Create client → appears in list → can edit → can archive
3. **Delivery logging**: Log item → scope usage updates → appears in client view
4. **Scope tracking**: Set allocation → log items → tracker shows correct remaining
5. **Magic link flow**: Generate link → open portal → see correct client data → cannot see other clients' data
6. **Client approval**: Client opens portal → approves item → operator sees approval
7. **Scope exceeded**: Log items beyond allocation → visual indicator shows exceeded

**RLS Policy Tests (most critical for multi-tenant)**

```sql
-- Test: Operator A cannot see Operator B's clients
SET request.jwt.claims = '{"sub": "operator-a-uuid"}';
SELECT count(*) FROM clients WHERE operator_id = 'operator-b-uuid';
-- Expected: 0

-- Test: Operator can see their own clients
SET request.jwt.claims = '{"sub": "operator-a-uuid"}';
SELECT count(*) FROM clients WHERE operator_id = 'operator-a-uuid';
-- Expected: > 0

-- Test: Operator cannot insert client for another operator
SET request.jwt.claims = '{"sub": "operator-a-uuid"}';
INSERT INTO clients (operator_id, name) VALUES ('operator-b-uuid', 'Sneak');
-- Expected: RLS policy violation

-- Test: Delivery items follow client ownership chain
SET request.jwt.claims = '{"sub": "operator-a-uuid"}';
SELECT count(*) FROM delivery_items
WHERE client_id IN (SELECT id FROM clients WHERE operator_id = 'operator-b-uuid');
-- Expected: 0
```

**Edge Case Inventory**

| Scenario | Expected Behavior |
|----------|-------------------|
| Operator has 0 clients | Empty state with CTA to add first client |
| Client has 0 delivery items | Portal shows "No deliveries logged yet" message |
| Scope at exactly 100% | Show "fully used" state (amber, not red) |
| Scope at 101%+ | Show "exceeded" state (red) with clear indicator |
| Magic link expired | Portal shows "This link has expired — contact your operator" |
| Magic link doesn't exist | 404 — generic "link not found" (don't leak info) |
| Operator deletes client with deliveries | Cascade delete — confirm with modal first |
| Delivery logged without scope allocation | Item logged, scope tracker shows "No scope set" |
| Client approves item, operator edits it | Approval stands — operator can re-request approval |
| Operator account deleted mid-session | Auth state change → redirect to login |

**Manual QA Checklist (Launch)**

- [ ] Sign up with email → verify operator row created
- [ ] Sign up with Google → verify operator row created
- [ ] Create 3 clients with different scope types
- [ ] Log 10+ delivery items across clients
- [ ] Verify scope tracker math is correct
- [ ] Generate magic link → open in incognito → verify correct data
- [ ] Test expired magic link → verify error message
- [ ] Approve item from client portal → verify operator sees it
- [ ] Request revision from client portal → verify operator sees it
- [ ] Check all empty states (0 clients, 0 deliveries, 0 scope)
- [ ] Test on mobile (responsive layout)
- [ ] Verify RLS: create 2 operator accounts, verify data isolation
- [ ] Test 15 clients on one account → verify performance

### 7d. Error Handling & Edge Cases

**Network Failures**

| Scenario | Behavior |
|----------|----------|
| API call fails (network error) | TanStack Query retries 3x with exponential backoff. Toast: "Connection issue — retrying..." |
| API call fails after retries | Error state in component. Toast: "Couldn't load data." Retry button. |
| Mutation fails (save delivery item) | Optimistic update reverts. Toast: "Couldn't save — please try again." Form stays populated. |
| Edge function timeout | Portal shows: "Taking longer than expected. Please refresh." |
| Supabase downtime | Global error boundary: "Luma is temporarily unavailable." |

**Auth Edge Cases**

| Scenario | Behavior |
|----------|----------|
| JWT expired mid-session | `supabase-js` auto-refreshes. If refresh fails → redirect to `/login` |
| Concurrent sessions (two tabs) | Both work — auth state syncs via `localStorage` |
| Deleted user mid-session | Next API call gets 401 → redirect to login |
| OAuth provider unavailable | Show: "Google sign-in unavailable. Try email/password." |
| Password reset with wrong email | Show: "If that email exists, we sent a reset link." (no enumeration) |

**Data Edge Cases**

| Scenario | Behavior |
|----------|----------|
| Empty state — no clients | Onboarding card: "Add your first client to get started" |
| Empty state — no deliveries | "No deliveries logged yet" with CTA |
| Empty state — no scope set | "Set up scope allocation" prompt |
| 15+ clients | Paginate or virtual scroll. Monitor performance. |
| 1000+ delivery items per client | Paginate delivery log (20 per page) |
| Malformed scope dates (end before start) | Zod validation catches. Database CHECK constraint as backup. |
| Very long delivery item titles | Truncate with ellipsis in lists. Full title in detail. Max 500 chars. |

**Graceful Degradation**

| Dependency Down | What Still Works | What Breaks |
|----------------|-----------------|-------------|
| Supabase Database | Nothing | Everything — show maintenance page |
| Supabase Auth | Existing sessions with valid JWT | New logins, sign ups |
| Supabase Edge Functions | All operator CRUD (PostgREST) | Magic link portal, PDF export |
| Google OAuth provider | Email/password auth | Google sign-in button |

**Error Boundary Strategy**

```
App (global error boundary → "Something went wrong" + reload)
├── AuthProvider (catches auth errors → redirect to login)
├── Dashboard (query error → "Couldn't load clients" + retry)
│   ├── ClientList (error → error card per failed query)
│   └── CapacityOverview (error → placeholder)
├── ClientDetail (query error → "Couldn't load client" + back to dashboard)
│   ├── DeliveryLog (error → inline error + retry)
│   ├── ScopeTracker (error → inline error)
│   └── ScopeRequests (error → inline error)
└── Portal (edge function error → "Link invalid or expired")
```

Each level catches its own errors. Failures are isolated — a broken scope tracker doesn't take down the delivery log.

---

## MVP Scope Summary

Build the operator dashboard and client magic link view. Manual entry first, integrations second. The MVP proves the core hypothesis: **operators who can show clients a clear delivery summary retain those clients longer and experience less scope creep.**

### Build Order (RICE-validated)

| Phase | Features | Timeline | Validates |
|-------|----------|----------|-----------|
| 1a | Auth + Client List + Per-Client View + Manual Entry | Week 1-2 | Core loop |
| 1b | Scope Allocation + Tracker + Out-of-Scope Log | Week 2-3 | Differentiator |
| 1c | Magic Link + Summary Card + Delivery Timeline | Week 3-5 | Client value |
| 2 | Approvals + Templates + PDF Export | Week 5-7 | Retention |
| 3 | ClickUp Integration + Historical Comparison | Week 7-10 | Automation |
