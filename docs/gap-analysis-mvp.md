# Grow Advantage Portal — MVP Gap Analysis & Implementation Plan

**Produced:** 2026-03-17
**Deadline:** 2026-03-25 (8 days)
**Analyst:** Andres (PM Agent)
**Reviewed against:** MVP document sections 4.1–4.7, 5.1–5.4, 6

---

## Legend

- ✅ BUILT — fully implemented and wired end-to-end
- ⚠️ PARTIAL — exists but has gaps that affect the Definition of Done
- ❌ MISSING — not built at all

---

## Section 4.1 — Dashboard (Home)

| Requirement | Status | Notes |
|---|---|---|
| Welcome greeting (personalised, time-aware) | ✅ | `Portal.tsx` — dynamic greeting with time-of-day and first name |
| "What to do next" banner based on onboarding stage | ⚠️ | There is a `this_month_focus` operator message, and a `PortalNeedsAttention` attention panel. There is NO logic that changes the banner based on the onboarding stage (e.g. "Sign your contract", "Complete your intake form"). The banner content is static operator text, not conditional on stage. |
| Quick links: Slack, Drive, Meetings, Submit a request | ✅ | All four present — Slack/Drive/Booking from `PortalDocumentsLinks`, Submit from `PortalRequestForm` button in header |
| Outstanding actions count (red if >0) | ✅ | `PortalNeedsAttention` panel + sidebar alert badge |
| Open requests count (red if >0) | ⚠️ | Sidebar shows task count alert, but open requests count is NOT surfaced as a red stat on the home screen. Only `pendingApproval` drives the "Awaiting You" stat card. Client-submitted pending requests are not counted separately as a visible "open requests" number. |
| This month's focus (operator-editable block) | ⚠️ | `this_month_focus` field renders in portal. BUT there is no operator UI to edit it — it is not exposed in `PortalLinksEditor` or anywhere in `ClientDetail`. The field exists in the DB (migration 021) and the portal type, but the operator cannot set it from the app. |
| "Completed this month" block | ⚠️ | Stat card shows count. Full "completed this month" block with editable/visible content is not a distinct section — it's folded into Work Visibility. MVP doc implies an editable summary block. |

**Section 4.1 Gap Summary:** The home screen is largely functional but missing: (a) onboarding-stage-aware "what to do next" prompt, (b) a visible open-requests count stat, (c) operator UI to write the "this month's focus" message.

---

## Section 4.2 — Onboarding Tracker (Stepper)

| Requirement | Status | Notes |
|---|---|---|
| Progress tracker with named SOP stages | ✅ | `PortalOnboardingStepper` — 8 stages, sorted, with status icons |
| Each stage has: status, owner, optional due date, notes | ✅ | All fields present in DB (migration 026) and editor (`OnboardingStagesEditor`) |
| Action URL per stage (client can tap "Take Action") | ✅ | `action_url` field rendered in stepper with a "Take Action" button |
| Blocked/Waiting on Client → dashboard flags red | ⚠️ | The stepper itself shows red left-border for blocked/waiting_on_client. BUT the home dashboard does NOT surface a specific "onboarding is blocked" flag or count. `needsAttentionCount` only counts `pendingApproval` deliveries and recently resolved requests — not blocked onboarding stages. |
| All 8 specific SOP stages pre-seeded | ✅ | `DEFAULT_ONBOARDING_STAGES` in constants matches spec exactly. `useInitOnboarding` seeds them with one click. |
| Operator can manage stages from ClientDetail | ✅ | `OnboardingStagesEditor` in Portal tab of `ClientDetail` |

**Section 4.2 Gap Summary:** Mostly complete. One gap: blocked onboarding stages do not bubble up to the home dashboard as an alert.

---

## Section 4.3 — Requests (Brain Dump)

| Requirement | Status | Notes |
|---|---|---|
| Client submits request with title + optional category | ✅ | `PortalRequestForm` — title required, category optional dropdown |
| Optional attachment on request | ❌ | `attachment_url` column exists in DB (migration 025) and in the `PortalScopeRequest` type, but the request form has NO file upload field. Attachments cannot be submitted. |
| Request statuses: Submitted, Received, In progress, Waiting on client, Done | ✅ | `GA_REQUEST_STATUS_CONFIG` defines all 5. Displayed in `PortalRequestsSection`. |
| Categorised by Month | ✅ | `groupByMonth` in `PortalRequestsSection` |
| Operator can update ga_status on a request | ⚠️ | `ScopeRequestsTab` allows status updates but only manages the `status` field (pending/approved/declined/completed — the proposal-style flow). The `ga_status` field (the 5-state GA-specific flow) is NOT editable from the operator side. Operator has no UI to move a request from "submitted" → "received" → "in_progress" etc. |
| Operator can add admin_note to a request | ❌ | `admin_note` column exists in DB and is fetched/displayed in portal (`RequestCard`). But there is no operator UI to write or edit the admin note. |
| Internal notification on submission (email or Slack) | ❌ | `client-request` edge function inserts the row but sends NO notification. No Slack webhook call, no email. The MVP doc requires internal notification on submission. |
| Future: Asana task automation (placeholder OK) | ✅ | Not built, but the spec says placeholder is acceptable. |

**Section 4.3 Gap Summary:** Three gaps: (a) no file attachment on form, (b) operator cannot manage ga_status or add admin notes, (c) no submission notification.

---

## Section 4.4 — Actions / Client Tasks

| Requirement | Status | Notes |
|---|---|---|
| Task list with title, due date, status, link to doc | ✅ | `PortalClientTasks` — all fields present and rendered |
| Client can mark task complete | ✅ | Checkbox in `PortalClientTasks`, `portal-task-complete` edge function |
| Overdue items appear in Outstanding Actions | ⚠️ | Overdue tasks show "Overdue" badge in `PortalClientTasks`. BUT they do NOT feed into the home-screen "Outstanding Actions" count or appear in `PortalNeedsAttention`. The MVP doc says overdue items should flag red on the dashboard. Currently only `pendingApproval` deliveries appear in `PortalNeedsAttention`. |
| Operator can create/edit/delete client tasks | ✅ | `ClientTasksManager` — full CRUD |
| Tasks show on home screen (preview, max 3) | ✅ | Home screen shows max-3 preview with "View all" link |

**Section 4.4 Gap Summary:** Functionally solid. One gap: overdue client tasks do not appear in the home-screen `PortalNeedsAttention` panel as flagged items.

---

## Section 4.5 — Work Visibility (GA Delivery)

| Requirement | Status | Notes |
|---|---|---|
| "What we're working on" panel | ✅ | `PortalWorkVisibility` — in_progress deliveries panel |
| "What we've done" panel | ✅ | Completed this month + past months collapsible in `PortalWorkVisibility` |
| Monthly plan / catch-up notes section (links) | ⚠️ | Monthly snapshots are listed in `PortalDocumentsLinks` (just title + date). There is no full "monthly plan notes" readable view inside the portal — clients see the snapshot title but cannot read the snapshot content (wins, priorities, risks, etc.) in the portal. Only the index is returned; the detailed snapshot is only in operator-side `SnapshotDetail`. |
| Items tagged with pick-lists (phase/category/uplift/status) | ✅ | `phase` and `uplift` columns on `delivery_items` (migration 028). Rendered as badges in `InProgressCard` and `CompletedItem`. Category also shown. |

**Section 4.5 Gap Summary:** Mostly complete. Gap: clients cannot read monthly snapshot content inside the portal — they only see a list of snapshot titles.

---

## Section 4.6 — Documents + Links

| Requirement | Status | Notes |
|---|---|---|
| Proposal link or uploaded PDF | ✅ | Agreements are fetched and shown via `PortalAgreementCard`. Proposal page also accessible at `/portal/:token/proposals/:id`. |
| Signed contract (SignWell link + PDF copy) | ✅ | Agreement signed PDF shown via `PortalAgreement` page. `PortalAgreementCard` renders the "View Agreement" button. |
| Stripe payment link and/or customer portal link | ✅ | `portal_stripe_url` stored and rendered as "Payment Setup" DocCard |
| Intake form link | ✅ | `portal_intake_url` stored and rendered as "Intake Form" DocCard |
| Slack channel URL | ✅ | `portal_slack_url` stored and rendered as QuickLinkCard |
| Drive folder URL | ✅ | `portal_drive_url` stored and rendered as QuickLinkCard |
| Operator can manage all these links | ✅ | `PortalLinksEditor` in ClientDetail Portal tab — full form with validation |

**Section 4.6 Gap Summary:** Fully built. No gaps.

---

## Section 4.7 — Meetings + Time Tracking (MVP-lite)

| Requirement | Status | Notes |
|---|---|---|
| Next meeting card (manual date/time + link) | ✅ | `PortalMeetingCard` on home screen. `next_meeting_at` and `next_meeting_link` editable via `PortalLinksEditor`. |
| Manual field: "Hours used this month" | ⚠️ | `hours_used_this_month` column exists in DB (migration 021) and in `PortalClient` type. BUT there is no operator UI to set this value (not in `PortalLinksEditor` or elsewhere). And it is not displayed anywhere in the portal. The field is a DB ghost — no read or write path exists in the UI. |

**Section 4.7 Gap Summary:** Meeting card is fully built. "Hours used this month" is entirely unimplemented in the UI despite the DB column existing.

---

## Section 5 — Pick Lists

### 5.1 Phase (Roadmap)

| Requirement | Status |
|---|---|
| 5 phase items defined | ✅ `DEFAULT_PICK_LIST_PHASES` in constants — exact match |
| Phase pick-list editable by operator in Settings | ✅ `PickListsSettings` — Phase accordion panel |
| Phase field on delivery items | ✅ `delivery_items.phase` column (migration 028) |
| Phase available when logging deliveries | ⚠️ The `phase` column exists on `delivery_items` and renders in the portal, but `LogDeliveryDialog` / `QuickAddDelivery` do not expose a Phase selector. Operator cannot tag a delivery with a phase from the delivery logging UI. |

### 5.2 Category (Workstream)

| Requirement | Status |
|---|---|
| 10 category items defined | ✅ `DEFAULT_PICK_LIST_CATEGORIES` — exact match |
| Category pick-list editable in Settings | ✅ `PickListsSettings` — Category accordion panel |
| Category on deliveries | ✅ Already a core field on `delivery_items` |
| Category on requests | ✅ Field on `scope_requests`, shown in request form |

### 5.3 Uplift (Seed List)

| Requirement | Status |
|---|---|
| 8+ uplift items defined | ✅ `DEFAULT_PICK_LIST_UPLIFTS` — 9 items |
| Uplift pick-list editable in Settings | ✅ `PickListsSettings` — Uplift accordion panel |
| Uplift field on delivery items | ✅ `delivery_items.uplift` column (migration 028) |
| Uplift available when logging deliveries | ⚠️ Same as Phase — uplift exists on delivery_items and renders in portal badges, but cannot be set from the delivery logging UI. |

### 5.4 Status

| Requirement | Status |
|---|---|
| 5 work status options defined | ✅ `DEFAULT_PICK_LIST_WORK_STATUSES` — exact match including red colours for Waiting on client + Blocked |
| Work Status pick-list editable in Settings | ✅ `PickListsSettings` — Work Status accordion panel |

**Section 5 Gap Summary:** Pick-lists are well-designed. Critical gap: Phase and Uplift cannot be set when logging a delivery — the selectors are absent from `LogDeliveryDialog` and `QuickAddDelivery`.

---

## Section 6 — Grant Evidence Panel (Internal Only)

| Requirement | Status | Notes |
|---|---|---|
| Pilot Client A + B: start date, stage, notes | ✅ | `GrantEvidence.tsx` — full form with name, start date, current stage, notes |
| Endorsement status: requested/received + storage link | ✅ | Present in `PilotClientCard` with select + link field |
| Evidence checklist: screenshots, Loom, usage notes | ✅ | 3-item checklist with completion tracking |
| Basic KPIs: requests submitted, requests resolved, overdue actions count, time saved estimate | ✅ | All 4 manual KPI fields present |
| Internal only (not visible to clients) | ✅ | Page is operator-only behind auth, not in portal routes |
| Data persisted to DB | ❌ | Data is saved to `localStorage` only (`STORAGE_KEY = 'luma_grant_evidence'`). If the operator clears local storage or switches machines, data is lost. For a grant application, this is a significant risk. |

**Section 6 Gap Summary:** Functionally complete for a pilot, but localStorage-only persistence is a risk for grant evidence integrity.

---

## Definition of Done — Checklist

| DoD Item | Status |
|---|---|
| 1. One client onboarded end-to-end (contract, payment, intake, links, kickoff) | ⚠️ Partial — links work, but onboarding "what to do next" dashboard banner is not stage-aware |
| 2. Client can submit requests and see status | ✅ Functional (no attachment upload) |
| 3. Client can see outstanding items (red flags) and what GA is working/completed | ⚠️ Partial — overdue tasks and blocked onboarding don't feed dashboard red flags |
| 4. Internal team can manage pick-lists and tag to deliveries/requests | ⚠️ Partial — pick-lists exist but Phase/Uplift cannot be set on deliveries from the logging UI |
| 5. Portal is mobile-friendly and branded to GA | ✅ Mobile nav present, branding fields in DB and rendered in portal header |
| 6. Admin can set up new client portal in under 10 minutes | ⚠️ Partial — magic link, portal links, onboarding all work, but there is no branding settings UI (logo/colour fields in DB but no settings page section) |

---

## Prioritised Task List

Priority key: **P0** = blocks MVP done / **P1** = MVP completeness / **P2** = nice to have

---

### FRONTEND TASKS

---

#### FE-01 — Operator UI: Edit "This Month's Focus" message
**Priority:** P0
**Why:** The operator cannot set the `this_month_focus` message that appears prominently on the client home screen. It renders in the portal but has no input path.
**Files to modify:**
- `src/components/clients/PortalLinksEditor.tsx` — add a `Textarea` for `this_month_focus` (and optionally `this_month_outcomes`, `this_month_deliverables`) in the "Portal Links & Settings" card
- `src/types/database.ts` — already has the field
**DB change required:** No (column exists in migration 021)

---

#### FE-02 — Operator UI: Portal Branding Settings (logo, primary colour, accent colour)
**Priority:** P0
**Why:** Without a branding settings UI, the operator cannot customise the portal to Grow Advantage brand. The DB columns exist (`portal_logo_url`, `portal_primary_color`, `portal_accent_color` on `operators` table — migration 029) but there is no UI to set them.
**Files to create/modify:**
- `src/components/settings/PortalBrandingSettings.tsx` — new component: logo URL input, primary hex colour picker, accent hex colour picker, save to `operators` table
- `src/pages/Settings.tsx` — add a "Portal" tab that renders `PortalBrandingSettings`
**DB change required:** No (columns exist in migration 029)

---

#### FE-03 — Delivery Logging: Phase and Uplift tag selectors
**Priority:** P0
**Why:** DoD item 4 — internal team must be able to tag deliveries with pick-list values. Phase/Uplift render in the portal (badges visible) but cannot be set from the operator delivery form.
**Files to modify:**
- `src/components/deliveries/LogDeliveryDialog.tsx` — add Phase (Select) and Uplift (Select) fields populated from `usePickLists('phase')` and `usePickLists('uplift')`
- `src/components/deliveries/QuickAddDelivery.tsx` — add Phase/Uplift fields to the inline form (or ensure they are accessible via the expand-to-dialog path)
**DB change required:** No (columns exist in migration 028)

---

#### FE-04 — Operator UI: ga_status management + admin_note on requests
**Priority:** P0
**Why:** The GA-specific 5-state request workflow (Submitted → Received → In Progress → Waiting on Client → Done) is the client-facing status in the portal. Currently the operator can only change the old 4-state `status` field, not `ga_status`. The `admin_note` field (visible to the client as a quoted note) also has no operator input.
**Files to modify:**
- `src/components/scope/ScopeRequestsTab.tsx` — add `ga_status` selector (5 options from `GA_REQUEST_STATUS_CONFIG`) per request row, and an inline `admin_note` textarea/input
**DB change required:** No (columns exist in migration 025)

---

#### FE-05 — Home Dashboard: Onboarding-stage-aware "What to Do Next" banner
**Priority:** P0
**Why:** DoD item 1 — the portal banner must guide the client on what action to take based on their onboarding stage. Currently it shows a static "From your team" message.
**Files to modify:**
- `src/pages/Portal.tsx` — add logic: inspect `onboardingStages`, find the first non-done stage where `owner_label === 'client'`. If found, render a contextual call-to-action card above the greeting (e.g. "Next step: Sign your contract" with a link to `action_url`).
- `src/components/portal/` — optionally extract as `PortalNextStep.tsx`
**DB change required:** No

---

#### FE-06 — Home Dashboard: Overdue tasks and blocked onboarding stages in PortalNeedsAttention
**Priority:** P1
**Why:** DoD item 3 — outstanding red flags should include overdue client tasks and blocked onboarding stages, not just pending-approval deliveries.
**Files to modify:**
- `src/pages/Portal.tsx` — compute `overdueTaskCount` (tasks where `due_date < today` and `completed_at` is null) and `blockedStageCount` (stages with status `blocked` or `waiting_on_client`). Include these in `needsAttentionCount`. Pass overdue tasks to `PortalNeedsAttention`.
- `src/components/portal/PortalNeedsAttention.tsx` — accept `overdueTasks: PortalClientTask[]` and `blockedStages: PortalOnboardingStage[]` props. Render overdue task rows and blocked stage rows with red indicators.
**DB change required:** No

---

#### FE-07 — Home Dashboard: Open Requests count as a visible stat
**Priority:** P1
**Why:** The MVP doc specifies "Open requests count (red if >0)" as a home dashboard stat. Currently only "Awaiting You" (pending approvals) is shown, not open/unresolved client requests.
**Files to modify:**
- `src/pages/Portal.tsx` — compute `openRequestsCount` = requests where `ga_status` is not `done`
- `src/components/portal/PortalRightNow.tsx` — replace or augment the 3-card grid. Either replace "Deliveries This Month" with "Open Requests" or add a 4th card. Design decision required. At minimum, if `openRequestsCount > 0`, it should be visually red.
**DB change required:** No

---

#### FE-08 — Request Form: File attachment upload
**Priority:** P1
**Why:** MVP doc specifies optional attachment on requests. The DB column `attachment_url` exists but the form has no file input.
**Files to modify:**
- `src/components/portal/PortalRequestForm.tsx` — add a file input (image or PDF). On selection, upload to Supabase Storage bucket (see BE-02) and store the public URL, then pass `attachment_url` in the request body.
**DB change required:** No (column exists). Requires BE-02 (Storage bucket + edge function update).

---

#### FE-09 — Operator UI: "Hours Used This Month" field
**Priority:** P1
**Why:** MVP doc section 4.7 specifies this field. It's in the DB and type but has no UI anywhere.
**Files to modify:**
- `src/components/clients/PortalLinksEditor.tsx` — add a number input for `hours_used_this_month`
- `src/components/portal/PortalMeetingCard.tsx` or a new section — display the hours value in the portal for the client
**DB change required:** No (column exists in migration 021)

---

#### FE-10 — Portal: Monthly Snapshot content readable by client
**Priority:** P1
**Why:** Section 4.5 requires a "monthly plan / catch-up notes section." Currently clients only see a list of snapshot titles — they cannot read the wins, priorities, risks content.
**Files to create/modify:**
- `src/pages/Portal.tsx` — add a route or section for a snapshot detail view. Either render it inline in the "Resources" section or create a `/portal/:token/snapshots/:snapshotId` route.
- New edge function or extend `client-portal` to return snapshot detail on demand (see BE-03).
**DB change required:** No

---

#### FE-11 — Settings: Portal tab with branding preview
**Priority:** P1
**Why:** Required as part of FE-02. The branding settings need a tab in Settings.
**(Covered by FE-02 — listed here for tracking completeness.)**

---

#### FE-12 — Grant Evidence: Persist to Supabase instead of localStorage
**Priority:** P2
**Why:** Grant application data stored in localStorage is fragile. A simple DB table or JSONB column on `operators` would make it reliable.
**Files to modify:**
- `src/pages/GrantEvidence.tsx` — switch from localStorage read/write to a Supabase upsert
**DB change required:** Yes — see BE-04

---

---

### BACKEND TASKS

---

#### BE-01 — Edge Function: Send internal notification on request submission
**Priority:** P0
**Why:** MVP doc section 4.3 requires internal notification (email or Slack) when a client submits a request. Currently `client-request/index.ts` inserts the row and returns — no notification fires.
**Files to modify:**
- `supabase/functions/client-request/index.ts` — after successful insert, send a notification. Implementation options (pick one):
  - **Email via Resend**: `POST https://api.resend.com/emails` — same pattern as `weekly-digest`. Send to the operator's email with request title, client name, category, description.
  - **Slack webhook**: Read `SLACK_WEBHOOK_URL` from env, POST a formatted message.
  - Prefer email (Resend is already integrated). Slack can be a placeholder env variable that short-circuits gracefully if not set.
**DB change required:** No
**Env vars required:** `RESEND_API_KEY` (already configured), `NOTIFICATION_FROM_EMAIL`

---

#### BE-02 — Supabase Storage: Request attachment bucket + upload path
**Priority:** P1
**Why:** Required for FE-08 (file attachments on requests).
**Files to create:**
- A Supabase Storage bucket named `request-attachments` must be created (via dashboard or migration). RLS policy: only authenticated operators and service role can read; public read for portal display is acceptable if files are non-sensitive.
- `supabase/functions/client-request/index.ts` — accept `attachment_url` in the POST body (client uploads directly to Storage via Supabase JS and passes the resulting URL)
**DB change required:** No (column exists)
**Note:** The file upload itself happens client-side in the portal using the Supabase anon key with a signed upload URL. The edge function just stores the returned URL.

---

#### BE-03 — Edge Function: Expose monthly snapshot detail to portal
**Priority:** P1
**Why:** Required for FE-10. Client portal currently only fetches `monthly_snapshots` index (id, month_label, month_slug, created_at). Full snapshot content is never sent to the portal.
**Options:**
- **Option A (preferred):** Add a query parameter to `client-portal/index.ts`: `?token=...&snapshot_id=...` returns the full snapshot row for that ID. Simple to implement.
- **Option B:** New edge function `portal-snapshot/index.ts` that validates the token and returns one snapshot by ID.
**Files to modify:**
- `supabase/functions/client-portal/index.ts` — add conditional snapshot fetch based on query param
**DB change required:** No

---

#### BE-04 — DB: Grant Evidence persistence table (optional, P2)
**Priority:** P2
**Why:** Required for FE-12.
**Files to create:**
- `supabase/migrations/033_grant_evidence.sql` — a simple `grant_evidence` table with one row per operator: `operator_id` (FK, unique), `data jsonb` (stores the whole `GrantEvidenceData` shape), `updated_at`. Alternatively, add a `grant_evidence jsonb` column to the `operators` table to avoid a new table.
**DB change required:** Yes

---

#### BE-05 — DB + Operator UI: "This Month's Focus" and other editable blocks
**Priority:** P0
**Why:** Supports FE-01. The columns already exist (`this_month_focus`, `this_month_outcomes`, `this_month_deliverables`, `this_month_improvements`, `this_month_risks`) from migration 021. The `client-portal` edge function already returns `this_month_focus`. This is purely a frontend task wrapped in a backend note.
**Files to modify:**
- `supabase/functions/client-portal/index.ts` — verify `this_month_outcomes` etc. are also returned if needed for a richer display
**DB change required:** No

---

#### BE-06 — Edge Function: Update ga_status and admin_note on requests
**Priority:** P0
**Why:** The operator needs to update `ga_status` and `admin_note` on `scope_requests`. Currently `useUpdateScopeRequestStatus` only updates `status`. A separate mutation or extension of the existing hook is needed.
**Files to modify:**
- `src/hooks/useScopeRequests.ts` — add `useUpdateGaStatus` and `useUpdateAdminNote` mutations (or extend `useUpdateScopeRequestStatus` to accept additional fields). These go direct to Supabase (operator is authenticated, RLS allows it).
**DB change required:** No (columns exist in migration 025)
**Note:** This is purely a frontend hook task — no edge function needed since the operator is authenticated and the `scope_requests` table has correct RLS.

---

## Consolidated Priority Matrix

### P0 — Must be done before MVP is shipped (blocks DoD)

| ID | Task | Type | Estimated effort |
|---|---|---|---|
| FE-01 | Operator can set "This Month's Focus" message | Frontend | 1h |
| FE-02 | Portal Branding settings UI (logo, colours) | Frontend | 2h |
| FE-03 | Phase + Uplift selectors in delivery logging | Frontend | 2h |
| FE-04 | Operator can manage ga_status + admin_note on requests | Frontend | 2h |
| FE-05 | Onboarding-stage-aware "what to do next" home banner | Frontend | 2h |
| BE-01 | Internal notification on request submission (email) | Backend | 2h |
| BE-06 | useScopeRequests hook: ga_status + admin_note mutations | Frontend/Hook | 1h |

**P0 total estimate: ~12 hours**

---

### P1 — MVP completeness (should be done before deadline)

| ID | Task | Type | Estimated effort |
|---|---|---|---|
| FE-06 | Overdue tasks + blocked onboarding in PortalNeedsAttention | Frontend | 2h |
| FE-07 | Open Requests count on home dashboard | Frontend | 1h |
| FE-08 | File attachment upload on request form | Frontend + BE-02 | 3h |
| FE-09 | "Hours Used This Month" field (operator input + client display) | Frontend | 1h |
| FE-10 | Monthly snapshot content readable in portal | Frontend + BE-03 | 3h |
| BE-02 | Supabase Storage bucket for request attachments | Backend | 1h |
| BE-03 | Expose snapshot detail to portal edge function | Backend | 1h |

**P1 total estimate: ~12 hours**

---

### P2 — Nice to have, not required for DoD

| ID | Task | Type | Estimated effort |
|---|---|---|---|
| FE-12 | Grant Evidence: persist to Supabase not localStorage | Frontend | 1h |
| BE-04 | DB migration: grant_evidence persistence | Backend | 0.5h |

**P2 total estimate: ~1.5 hours**

---

## Implementation Order (Recommended)

Given the 8-day deadline, recommended sequence:

**Day 1–2 (P0 backend):**
1. BE-01 — notification email on request submission
2. BE-06 — hook mutations for ga_status/admin_note

**Day 2–4 (P0 frontend):**
3. FE-04 — ga_status + admin_note operator UI
4. FE-01 — "this month's focus" field in PortalLinksEditor
5. FE-03 — Phase + Uplift in LogDeliveryDialog
6. FE-02 — Branding settings (PortalBrandingSettings + Settings tab)
7. FE-05 — Stage-aware home banner

**Day 4–6 (P1):**
8. FE-06 — overdue tasks + blocked stages in PortalNeedsAttention
9. FE-07 — open requests stat
10. FE-09 — hours used field
11. BE-02 + BE-03 — storage bucket + snapshot detail endpoint
12. FE-08 — attachment upload
13. FE-10 — snapshot content in portal

**Day 7–8 (QA + P2 if time):**
14. End-to-end smoke test with a real client setup (covers all 6 DoD items)
15. FE-12 + BE-04 — grant evidence persistence (if time permits)

---

## Files Not Yet Created (New Files Required)

| File | Purpose |
|---|---|
| `src/components/settings/PortalBrandingSettings.tsx` | Logo/colour branding settings UI |
| `src/components/portal/PortalNextStep.tsx` (optional) | Stage-aware "what to do next" card extracted from Portal.tsx |
| `supabase/migrations/033_grant_evidence.sql` | P2 — grant evidence DB persistence |

---

## Files To Modify (Key Modifications Only)

| File | What changes |
|---|---|
| `src/components/clients/PortalLinksEditor.tsx` | Add this_month_focus textarea + hours_used_this_month number input |
| `src/pages/Settings.tsx` | Add "Portal" tab, render PortalBrandingSettings |
| `src/components/deliveries/LogDeliveryDialog.tsx` | Add Phase + Uplift select fields |
| `src/components/deliveries/QuickAddDelivery.tsx` | Add Phase + Uplift (or remove and only in dialog) |
| `src/components/scope/ScopeRequestsTab.tsx` | Add ga_status select + admin_note input per request |
| `src/hooks/useScopeRequests.ts` | Add useUpdateGaStatus, useUpdateAdminNote mutations |
| `src/pages/Portal.tsx` | Stage-aware banner logic, overdue task/blocked stage computation, open requests count |
| `src/components/portal/PortalNeedsAttention.tsx` | Accept + render overdue tasks and blocked stages |
| `src/components/portal/PortalRightNow.tsx` | Open requests count card |
| `src/components/portal/PortalRequestForm.tsx` | File attachment input + upload |
| `supabase/functions/client-request/index.ts` | Send notification email after insert |
| `supabase/functions/client-portal/index.ts` | Add snapshot detail endpoint (query param driven) |
