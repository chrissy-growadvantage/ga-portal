# Luma MVP Gaps — Implementation Plan

> **Status:** In progress
> **Date:** 2026-03-02
> **Priority:** P0 — required for MVP completeness
> **Reference:** `grow-advantage-store/luma-mvp-requirements.md`, `SPEC.md`

---

## Overview

These are the five P0 features missing from the current Luma build. Each item maps directly to a requirement in the original MVP doc. They are ordered by implementation dependency — request submission must come before scope alerts can reference request data, and digest email depends on both.

---

## 1. Client Request Submission (Portal)

**What it is:** A "Request Something" button on the client-facing portal where clients can submit new scope requests or flag items they need from the operator.

**Current state:** The `scope_requests` table exists in the database schema, but there is no UI on the portal for clients to submit a request.

**Data model:** Uses existing `scope_requests` table.

```sql
-- Already exists in migrations
scope_requests (
  id, client_id, title, description,
  status, created_at, updated_at
)
```

### Files to create

**`src/components/portal/PortalRequestForm.tsx`**
- Modal/sheet triggered by a "Request Something" button
- Fields: `title` (required), `description` (optional textarea)
- On submit: insert into `scope_requests` with `status = 'pending'`
- Show success confirmation after submission

**`src/hooks/useSubmitScopeRequest.ts`**
- TanStack Query `useMutation` wrapping Supabase insert
- Invalidates `scope_requests` query on success

### Files to modify

**`src/pages/Portal.tsx`**
- Add "Request Something" button (primary CTA in the portal header or a dedicated section)
- Import and render `PortalRequestForm`

**`src/components/portal/PortalTimeline.tsx`**
- Display submitted requests in the timeline with a `pending` / `in-review` / `done` badge

### Acceptance criteria
- [ ] Client can open the request form from the portal
- [ ] Form validates that title is present before submitting
- [ ] Submitted request appears in the portal timeline immediately
- [ ] Operator sees the request in the client detail view (Scope Requests tab)

---

## 2. Operator-Side Scope Request Management

**What it is:** The operator view for managing client scope requests — reviewing pending requests, updating status, and flagging deliveries as out-of-scope.

**Current state:** No operator-facing component exists for `scope_requests`.

### Files to create

**`src/components/clients/ScopeRequestsTab.tsx`**
- List of all scope requests for a client
- Each row shows: title, description, status badge, submitted date
- Actions: "Mark In Review", "Approve", "Decline" — updates `scope_requests.status`
- "Flag as Out-of-Scope" toggle on existing delivery items (updates `deliveries.is_out_of_scope`)

**`src/hooks/useScopeRequests.ts`**
- `useQuery` to fetch requests by `client_id`
- `useMutation` for status updates

### Files to modify

**`src/pages/ClientDetail.tsx`**
- Add a **Scope Requests** tab alongside the existing tabs
- Render `ScopeRequestsTab` when tab is active

**`supabase/migrations/025_scope_requests_status_index.sql`** *(new migration)*
```sql
-- Add index for faster lookups by client + status
CREATE INDEX IF NOT EXISTS scope_requests_client_status_idx
  ON scope_requests (client_id, status);
```

### Acceptance criteria
- [ ] Operator sees all scope requests for a client in its own tab
- [ ] Operator can update request status (pending → in-review → approved/declined)
- [ ] Out-of-scope flag can be toggled on any delivery item
- [ ] Status changes persist and reflect in the client's portal view

---

## 3. Scope Threshold Alerts (80% / 90%)

**What it is:** Visual warnings when a client's scope usage crosses 80% or 90% of their allocated hours/budget, surfaced to the operator in the dashboard and client detail view.

**Current state:** `ScopeTracker` displays the percentage number and a progress bar but has no alert/warning behavior at threshold values.

### Files to create

**`src/components/clients/ScopeAlertBanner.tsx`**
```tsx
// Props: usedPercent: number, clientName: string
// Renders nothing below 80%
// Renders amber warning banner at 80–89%
// Renders red critical banner at 90%+
```

**`src/hooks/useScopeAlerts.ts`**
- Queries all clients where `scope_used / scope_allocated >= 0.8`
- Returns array of clients with their alert level (`warning` | `critical`)
- Used by the Dashboard to surface an alerts summary

### Files to modify

**`src/components/clients/ScopeTracker.tsx`**
- Import `ScopeAlertBanner`
- Render banner above the progress bar when threshold is reached

**`src/components/clients/ScopeTrackerCompact.tsx`**
- Change progress bar color to amber at ≥80%, red at ≥90% (already partially possible via Tailwind conditionals)
- Add a small warning icon at threshold

**`src/pages/Dashboard.tsx`**
- Add an "Alerts" section at the top of the dashboard
- Uses `useScopeAlerts` to render a list of clients needing attention
- Each alert links to the client detail page

### Acceptance criteria
- [ ] Progress bar turns amber when usage ≥ 80%
- [ ] Progress bar turns red when usage ≥ 90%
- [ ] Alert banner appears in the client detail view at thresholds
- [ ] Dashboard shows a consolidated alert list for all clients at threshold
- [ ] No alert shown below 80%

---

## 4. Weekly Digest Email

**What it is:** A scheduled email sent to each client summarizing their week — deliveries completed, approvals pending, current scope usage.

**Current state:** No email system exists. No Edge Function for scheduled sends.

### Files to create

**`supabase/functions/weekly-digest/index.ts`**
```ts
// Triggered by Supabase cron (pg_cron) every Monday at 9am
// For each active client with a magic link:
//   1. Fetch deliveries completed in the past 7 days
//   2. Fetch pending approvals
//   3. Fetch current scope usage
//   4. Send email via Resend (or SendGrid) with digest template
```

**`supabase/functions/weekly-digest/template.ts`**
- Plain HTML email template
- Sections: "This week's deliveries", "Awaiting your approval", "Scope usage"
- Includes a "View your portal" CTA button with the magic link

**`supabase/migrations/026_weekly_digest_cron.sql`** *(new migration)*
```sql
-- Enable pg_cron extension and schedule weekly digest
SELECT cron.schedule(
  'weekly-client-digest',
  '0 9 * * 1',  -- Every Monday at 9am UTC
  $$SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/weekly-digest',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key'))
  )$$
);
```

**`src/pages/Settings.tsx`** *(add digest settings section)*
- Toggle to enable/disable weekly digest per client
- Day/time preference (default: Monday 9am)
- "Send test digest" button for the operator

### Environment variables needed
```
RESEND_API_KEY=        # or SENDGRID_API_KEY
FROM_EMAIL=noreply@yourdomain.com
```

### Acceptance criteria
- [ ] Edge Function runs every Monday at 9am
- [ ] Each active client receives an email with their weekly summary
- [ ] Email includes portal link
- [ ] Operator can disable digest per client from Settings
- [ ] "Send test digest" sends immediately to the operator's email

---

## 5. Monthly PDF Report

**What it is:** A one-click export of a client's monthly summary as a downloadable PDF — scope used, deliveries completed, approvals, and a notes/comments section.

**Current state:** Monthly Snapshot data exists (`SnapshotList.tsx`, `SnapshotDetail.tsx`) but there is no export functionality.

### Approach

Use [`@react-pdf/renderer`](https://react-pdf.org/) for client-side PDF generation. This avoids a server-side dependency and keeps the export entirely in the browser.

```bash
npm install @react-pdf/renderer
```

### Files to create

**`src/components/reports/MonthlyReportPDF.tsx`**
```tsx
// @react-pdf/renderer Document component
// Sections:
//   - Cover: client name, month, generated date, Luma branding
//   - Scope Summary: allocated vs used, visual bar
//   - Deliveries: table of completed items with dates
//   - Approvals: approved / pending list
//   - Notes: operator notes for the period
//   - Footer: "Generated by Luma"
```

**`src/hooks/useMonthlyReportData.ts`**
- Fetches all data needed for a given client + month
- Combines: deliveries, approvals, scope snapshot, client notes

**`src/components/reports/ExportReportButton.tsx`**
- Button that triggers `pdf()` from `@react-pdf/renderer` and calls `saveAs()`
- Shows loading state while PDF is generating
- Props: `clientId`, `month`, `year`

### Files to modify

**`src/pages/SnapshotDetail.tsx`**
- Add `<ExportReportButton />` to the page header
- Pass the snapshot's `clientId`, `month`, `year` as props

**`src/components/clients/ClientDetail.tsx`** *(optional quick access)*
- Add "Export Monthly Report" action in the client header dropdown

### Acceptance criteria
- [ ] "Export PDF" button appears on the Snapshot Detail page
- [ ] Clicking it generates and downloads a PDF named `{ClientName}-{Month}-{Year}-Report.pdf`
- [ ] PDF includes: scope summary, deliveries table, approvals, notes
- [ ] PDF is readable and reasonably styled (Luma brand colors, clean layout)
- [ ] Works without any server-side calls — fully client-side generation

---

## Implementation Order

| # | Feature | Depends on | Estimated effort |
|---|---------|-----------|-----------------|
| 1 | Client request submission (portal) | — | Small |
| 2 | Operator scope request management | #1 | Small |
| 3 | Scope threshold alerts | — | Small |
| 4 | Monthly PDF report | SnapshotDetail data (exists) | Medium |
| 5 | Weekly digest email | Edge Functions infra | Medium–Large |

Start with **#1 + #3** in parallel (no dependencies), then **#2**, then **#4**, and finally **#5** (most infrastructure-heavy).

---

## Non-code tasks required

- [ ] Apply Supabase migrations 021–024 manually in the Supabase dashboard
- [ ] Deploy GA4 Edge Functions (`ga4-auth`, `ga4-auth-callback`, `ga4-data`)
- [ ] Set up Resend (or SendGrid) account and add API key to Edge Function secrets for weekly digest
- [ ] Enable `pg_cron` extension in Supabase dashboard before applying migration 026
