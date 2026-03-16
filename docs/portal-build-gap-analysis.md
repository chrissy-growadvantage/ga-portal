# Grow Advantage Portal — Build Gap Analysis
**Deadline: 25 March 2026 · Days remaining: 23**
**Prepared: 2 March 2026 · Based on: Grow-Advantage-Portal-MVP-Scope-Project-Plan.docx**

---

## Summary

The portal foundation in Luma is ~40% complete. Auth, magic links, delivery timeline, scope card, proposal view, and agreement card are all working. The remaining 60% is new feature work concentrated in three areas: **Requests/Brain Dump**, **Client Tasks/Actions**, and **Onboarding Tracker** (rework). Supporting additions (links hub, meeting card, pick-lists, grant panel) are lower complexity.

| Screen | Scope Doc Ref | Status | Effort |
|---|---|---|---|
| Client Portal Shell + Magic Link | §4 | ✅ Done | — |
| Work Visibility (timeline + scope) | §4.5 | ✅ Done | — |
| Agreement card (SignWell link) | §4.6 | ✅ Done | — |
| Proposal view | §4.6 | ✅ Done | — |
| Dashboard — hero stats | §4.1 | ✅ Done | — |
| Dashboard — welcome banner + stage banner | §4.1 | 🔴 Not built | S |
| Dashboard — quick links strip | §4.1 | 🔴 Not built | S |
| Dashboard — outstanding actions count | §4.1 | ⚠️ Partial | S |
| Dashboard — open requests count | §4.1 | 🔴 Not built | S |
| Onboarding Tracker (client-visible stepper) | §4.2 | 🔴 Not built (exists operator-side only) | M |
| Requests / Brain Dump | §4.3 | 🔴 Not built | L |
| Client Actions / Tasks | §4.4 | 🔴 Not built | M |
| Documents + Links hub | §4.6 | ⚠️ Partial (contract + proposal only) | S |
| Meeting card + hours used | §4.7 | 🔴 Not built | S |
| Pick-lists (Phase / Category / Uplift / Status) | §5 | 🔴 Not built | M |
| Grant Evidence Panel (internal) | §6 | 🔴 Not built | S |
| GA branding applied to portal | §10 | 🔴 Not applied | S |

**Effort key: S = Small (≤1 day) · M = Medium (2–3 days) · L = Large (4–5 days)**

---

## What still needs to be built

### 1. Dashboard additions — screen 4.1
*Effort: Small · Priority: High (it's the first thing clients see)*

The portal already has hero stats cards. These additions go on top of that.

**a) Stage-aware welcome banner**
A top-of-page banner that changes copy based on the client's current onboarding stage. While any onboarding stage is incomplete it shows "Here's what's next →". Once onboarding is done it shows a standard welcome message. If any stage is `Blocked` or `Waiting on Client` it shows a red alert.

**b) Quick links strip**
A row of icon + label links beneath the banner. Admin configures each link per client. Links needed:
- Slack channel URL
- Google Drive folder URL
- Meetings / booking link
- Submit a request (scrolls to or routes to Requests screen)

**c) Open requests count card**
A 4th hero stat card: count of open requests. Red if > 0 unresolved. (Outstanding actions count is partially there via pending approvals — needs to also include overdue client tasks.)

---

### 2. Onboarding Tracker — screen 4.2
*Effort: Medium · Priority: High (needed for pilot client onboarding)*

The existing `OnboardingChecklist.tsx` is operator-facing and lives in the internal dashboard. This needs a separate client-visible version in the portal.

**What to build:**
- A stepper component in the client portal showing GA's 8 fixed onboarding stages (in order):
  1. Sanity Call — completed
  2. Proposal — sent
  3. Contract — sent / signed (SignWell)
  4. Payment — Week 1 paid + subscription active (Stripe)
  5. Intake form — sent / received
  6. Tech setup — Slack channel created + Drive folder created
  7. Kickoff call — booked (with date/time + link) / completed
  8. Week 1 started — roadmap shared + BAU confirmed

- Each stage has: status (Not started / In progress / Waiting on client / Blocked / Done), owner label (GA or Client), optional due date, optional notes visible to client.
- Stages with status `Blocked` or `Waiting on Client` surface a red banner on the dashboard.
- Admin (operator) updates stages from the internal client detail page.
- Client sees the stepper read-only in their portal.

**Database:** New `onboarding_stages` table per client (or extend existing client record with a JSONB stages field).

---

### 3. Requests / Brain Dump — screen 4.3
*Effort: Large · Priority: High (core new feature)*

This is a full new feature — nothing exists in Luma today.

**Client side (portal):**
- A "Submit a request" form: title (required), category dropdown (optional), description (optional), file attachment (optional).
- A list of the client's submitted requests, each showing: title, category, date submitted, current status, and a note/response from GA if provided.
- Requests grouped by month (newest month first, collapsible).
- Status options: `Submitted` · `Received` · `In progress` · `Waiting on client` · `Done`
- Status chips: `Waiting on client` and `Blocked` show red.

**Admin side (internal):**
- Requests appear in the client detail page (new Requests tab or section).
- Admin can update status and add a response note visible to the client.
- On submission: trigger an internal notification (email to ops@growadvantage.com.au or Slack webhook to ops channel — make the destination configurable in Settings).
- *Stretch / post-MVP:* auto-create an Asana task on submission.

**Database:** New `requests` table: `id`, `client_id`, `title`, `category`, `description`, `attachment_url`, `status`, `admin_note`, `created_at`, `updated_at`.

---

### 4. Client Actions / Tasks — screen 4.4
*Effort: Medium · Priority: High (needed for onboarding flow)*

Nothing exists today. This is the list of things *the client* must complete (distinct from GA's delivery work).

**Client side (portal):**
- A "Your actions" section showing tasks assigned to the client.
- Each task: title, due date, status, optional link to a supporting doc or form.
- Client can mark a task as complete.
- Overdue tasks (past due date, not complete) show in red.
- Count of overdue/outstanding tasks feeds the dashboard's "Outstanding actions" stat card.

**Admin side (internal):**
- Admin creates/edits client tasks from the client detail page.
- Fields: title, due date, link (optional), notes (optional).
- Admin can see completion status.

**Database:** New `client_tasks` table: `id`, `client_id`, `title`, `due_date`, `link_url`, `notes`, `completed_at`, `created_at`.

---

### 5. Documents + Links hub — screen 4.6 (gap portion)
*Effort: Small · Priority: Medium*

Proposal and contract cards already exist in the portal. What's missing is a dedicated links section for the remaining items.

**Add a "Links & Documents" card to the portal with:**
- Stripe payment link (one-time Week 1 payment link + subscription link)
- Intake form link (Google Form URL)
- Slack channel URL
- Google Drive folder URL
- Any uploaded PDF attachments (e.g. signed contract PDF copy)

All fields are configured by admin per client. Empty fields are hidden from the client view. Admin edits these from the client detail page in a new "Portal Links" section.

---

### 6. Meetings + Hours used — screen 4.7
*Effort: Small · Priority: Medium*

**Add to portal:**
- A "Next meeting" card: admin sets date/time + meeting link manually. Displays a formatted card to the client. Card is hidden if no meeting is set.
- A "Hours used this month" field: manual number field, admin-updated. Shown as a stat in the portal (alongside or replacing one of the hero stats).

These can both live as simple fields on the client record, edited from the internal client detail page.

---

### 7. Pick-lists (admin-managed) — section 5
*Effort: Medium · Priority: Medium (needed before requests + work visibility are useful)*

Admin-managed dropdowns used across Requests, Work Visibility items, and Monthly Plan entries.

**Four pick-list types to build:**

| Pick-list | Options (seed data) |
|---|---|
| **Phase** | Month 1 – Strategise · Month 2 – Optimise · Month 3 – Maximise · Month 4–6 – Scale · Month 7–12 – Sustain |
| **Category** | Audit & findings · Process improvement · Automation · Systems/tech stack · Team & roles · Cadence & comms · Reporting & dashboards · Delivery quality · Capacity/scaling · Strategy reset |
| **Uplift** | As-is audit completed · Operational gaps identified · Reduce admin/inbox · Automate workflows · Dashboards established · SOPs refined · Leadership rhythms embedded · Growth KPIs introduced · Quarterly strategy reset |
| **Status** | Not started · In progress · Waiting on client *(red)* · Blocked *(red)* · Done |

**Implementation:**
- A new Settings section (admin-only): "Pick-lists" where the four lists can be viewed and edited (add/remove/reorder items).
- Seed data is pre-populated on first load.
- Pick-lists are used as dropdowns in: Request category, Work Visibility item phase/category/uplift/status.

**Database:** A `pick_list_items` table: `id`, `list_type` (enum: phase/category/uplift/status), `label`, `colour` (for status), `sort_order`.

---

### 8. Grant Evidence Panel — section 6
*Effort: Small · Priority: Medium (needed for grant application)*

An internal-only section (not visible to clients) for tracking pilot evidence. Lives in the admin area, not the client portal.

**Add an internal "Grant / Pilot Evidence" page or section with:**
- Pilot Client A + B: name, start date, current stage, notes field.
- Endorsement tracker: status (Not requested / Requested / Received) + storage link per client.
- Evidence checklist (checkboxes): Screenshots saved · Loom walkthrough recorded · Usage notes written.
- Manual KPI fields: requests submitted count, requests resolved count, overdue actions count, estimated time saved (hours).

This can be a simple internal-only page in Settings or as a pinned section in the operator dashboard.

---

### 9. GA branding applied to portal — section 10
*Effort: Small · Priority: High (pilot clients will see this)*

The current portal renders under the Luma brand. For GA pilots it needs to show Grow Advantage branding.

**Required:**
- Logo: Grow Advantage logo replaces Luma logo in `PortalLayout.tsx`.
- Colour theme: GA brand colours applied via CSS variables (or a per-operator theme setting).
- Portal domain: configure `portal.growadvantage.com.au` via CNAME to the deployed app — requires DNS access (GoDaddy / Cloudflare / VentraIP).
- "Powered by" attribution: small, optional footer link back to Luma (decide: keep or remove for MVP).

---

## Suggested 3-week build order

### Week 1 (2–8 March) — Foundation & onboarding flow
1. GA branding + PortalLayout update *(S)*
2. Dashboard: welcome banner + quick links strip *(S)*
3. Onboarding Tracker: DB schema + admin edit UI + client portal stepper *(M)*
4. Documents + Links hub card in portal *(S)*

### Week 2 (9–15 March) — Core new features
5. Client Tasks/Actions: DB + admin create/edit + client portal list + mark-complete *(M)*
6. Requests/Brain Dump: DB + client submit form + client request list + admin status update + notification *(L)*
7. Dashboard: open requests count + outstanding actions count wired up *(S)*

### Week 3 (16–22 March) — Polish + grant
8. Pick-lists: DB + Settings admin UI + wire into requests + work visibility *(M)*
9. Meeting card + hours used field *(S)*
10. Grant Evidence Panel *(S)*
11. QA pass: mobile check, client isolation check, red-flag states, empty states *(buffer)*

**Buffer: 23–25 March** — Final demo recording (Loom), pilot client setup, grant evidence capture.

---

## Open questions (carry-forward from scope doc)

These were flagged as needing Chrissy's input and are still unresolved:

- [ ] **Pilot clients confirmed?** Who are Client A and Client B, and when do they onboard?
- [ ] **Portal name externally?** What do clients see as the product name — "Grow Advantage Portal" or something else?
- [ ] **Notification channel for requests?** Email to ops@growadvantage.com.au, Slack webhook, or both?
- [ ] **Endorsement format for grant?** Email testimonial, signed letter, or Loom video?
- [ ] **GA brand assets ready?** Logo file, hex colours, fonts — or use placeholder GA brand for now?
- [ ] **DNS access confirmed?** Who manages growadvantage.com.au domain and can add a CNAME record?
