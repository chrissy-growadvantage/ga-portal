# Luma Demo Walkthrough

> For Mervin to walk Chrissy through the MVP. Follow this script to showcase core value.
> Uses demo data from `supabase/seed-demo.sql`.

---

## Pre-Demo Checklist

- [ ] Demo data seeded (run `seed-demo.sql` with your operator UUID)
- [ ] App running locally (`npm run dev`) or deployed to Vercel
- [ ] Logged in as demo operator account
- [ ] Browser: Chrome, incognito tab ready for portal demo
- [ ] Screen recording on (if capturing for async review)

---

## Part 1: Operator View (3-5 minutes)

### Scene 1: Dashboard Overview

**Open:** Dashboard (`/`)

**Talk track:** "This is your command center. At a glance you can see all your clients, who's on track, and who needs attention."

**What to show:**
1. Stat cards: 4 total clients, 4 active
2. Client list with scope indicators on each card:
   - Acme Corp: green bar, 60%, "On Track"
   - Bright Ideas: amber bar, 87%, "Nearing Limit"
   - Summit Strategies: red bar, 120%, "Exceeded" (draw attention here)
   - Evergreen Growth: green bar, 33%, "On Track"
3. Point out: "Summit Strategies is over scope. You can see that instantly without digging into anything."

**Key line:** "No more guessing. No more 'let me check my spreadsheet.' One look."

---

### Scene 2: Client Detail — Happy Path (Acme Corp)

**Click:** Acme Corp card -> Client Detail (`/clients/:id`)

**Talk track:** "Let's look at your best client. Everything about Acme is right here."

**What to show:**
1. Client header: name, contact email, phone, "Added" date, status badge
2. **Scope Tracker** (hero moment):
   - "12 of 20 hours used — 60% — On Track"
   - Multi-segment bar: green fill, gray remaining
   - Breakdown cards: In-scope 11 hrs, Out-of-scope 1 hr, Remaining 8 hrs
   - Point out: "That 1 out-of-scope hour? Emergency website fix. Tracked separately."
3. **Delivery timeline**: 6 items grouped by date
   - Mix of completed, approved, pending approval
   - Each has: title, category badge, date, hours, status icon
4. **Quick-add delivery** (demo the flow):
   - Type "Weekly status meeting prep" in quick-add
   - Press Enter
   - Show: delivery appears, scope tracker updates (now 13/20 = 65%, still on-track but ticks toward "Active")
   - "Logged in 2 seconds. No forms. No friction."

**Key line:** "This is what your client relationship looks like at any given moment. And it took zero effort to build."

---

### Scene 3: Scope Creep Detection (Summit Strategies)

**Navigate:** Back to Dashboard -> Click Summit Strategies

**Talk track:** "Now let's look at a problem scenario. Summit is over scope."

**What to show:**
1. Scope Tracker: "6 of 5 deliverables — 120% — Exceeded"
   - Red bar with overflow indicator: "+1 over"
   - 2 items flagged as out-of-scope
2. Out-of-scope items highlighted in delivery list
3. **Scope requests** section:
   - "Additional landing pages for Q1 campaign" — pending, 3 deliverables estimated
   - Point out: "Lisa asked for more work. You have a record. You can have the conversation with data."
4. The already-approved and declined requests show the history

**Key line:** "Scope creep is the #1 profit killer for service operators. Luma catches it automatically."

---

### Scene 4: Generate Magic Link

**From:** Acme Corp client detail

**What to show:**
1. Click "Share" / Magic Link panel
2. Link generates with 30-day expiry
3. Copy to clipboard
4. "Now let's see what Jane sees when she opens this."

**Transition:** Open incognito tab for portal demo

---

## Part 2: Client Portal View (2-3 minutes)

### Scene 5: Client Portal — Acme Corp

**Open:** Incognito tab -> `/portal/demo-acme-portal-token-2026`

**Talk track:** "This is what your client sees. No login. No app to install. One link."

**What to show:**
1. **Trust banner**: Operator name/business at top, "Delivery Summary for Acme Corp"
2. **Scope card**: "12 of 20 hours used" — simple bar, Used/Remaining only
   - "Jane sees exactly how much of her retainer you've used. No questions."
3. **Delivery timeline**: Same items, but simplified
   - No hours shown (clients don't need to see that)
   - Status: "Done" / "Needs your input"
4. **Pending approval section**: SEO audit awaiting Jane's sign-off
   - Two clear buttons: Approve / Request Changes
   - Click "Approve" -> item status updates
   - "Jane just approved your SEO audit. You'll see it in your operator view immediately."
5. Scroll to show it's one clean page, not tabs
6. Footer: "Powered by Luma"

**Key line:** "10 seconds. Jane opened a link and understood exactly what you've been doing. No more 'what have you been doing?' conversations."

---

### Scene 6: Portal — Exceeded Scope (Summit)

**Open:** `/portal/demo-summit-portal-token-2026`

**Talk track:** "Here's what an exceeded scope looks like from the client's perspective."

**What to show:**
1. Red scope indicator: "6 of 5 deliverables — Exceeded"
2. Out-of-scope items visible in timeline
3. "Lisa can see she's asked for more than what was agreed. This protects you."

---

### Scene 7: Portal Error — Expired Link

**Open:** `/portal/demo-bright-expired-token-2026`

**Talk track:** "And if a link expires..."

**What to show:**
1. Clean error message: "This link has expired. Contact your service provider for a new link."
2. No technical jargon. No stack traces. Just helpful plain English.

---

## Part 3: Closing (1 minute)

**Recap the story:**

1. "Operator logs work in seconds" (quick-add)
2. "Scope tracked automatically" (tracker updates)
3. "Scope creep caught instantly" (red indicators)
4. "Client sees value in one click" (portal)
5. "Approvals captured in one place" (approval actions)

**Leave-behind:** "Every service operator managing 3-15 clients has this problem. Nobody has built this. We're building the category."

---

## Test Scenarios / Edge Cases

### Must Test Before Demo

| # | Scenario | Expected | How to Test |
|---|----------|----------|-------------|
| 1 | Dashboard with scope indicators | Each client card shows compact scope bar + status | Seed data shows 4 different states |
| 2 | Client detail scope tracker | Correct math: used/allocated, percentage, tier color | Acme = 60% green, Bright = 87% amber, Summit = 120% red |
| 3 | Quick-add delivery | Submit with Enter, item appears, scope updates | Type + Enter on any client detail |
| 4 | Full delivery dialog | All fields work (title, description, category, hours, out-of-scope) | Click "+ Log Delivery" button |
| 5 | Scope exceeded rendering | Red bar, "+X over" badge, exceeded label | Summit Strategies |
| 6 | Magic link generation | Link created, copied to clipboard, expiry shown | Any client detail -> Share panel |
| 7 | Portal loads from link | Scope + deliveries + approvals visible | `/portal/demo-acme-portal-token-2026` |
| 8 | Portal approval action | Approve button works, item status changes | Click Approve on pending item in portal |
| 9 | Portal expired link | Clean error message, no tech details | `/portal/demo-bright-expired-token-2026` |
| 10 | Empty state (new client) | Friendly empty state with CTA | Create a new client with no deliveries |

### Edge Cases to Verify

| # | Scenario | Expected |
|---|----------|----------|
| 11 | Scope at exactly 100% | Amber "Fully Used", full bar, no overflow badge |
| 12 | 0 deliveries, scope set | Tracker shows 0/X used, 0%, "On Track" |
| 13 | Deliveries but no scope | "No scope defined" empty state in scope tab |
| 14 | Very long delivery title | Truncated with ellipsis in list, full title on detail |
| 15 | Client with no contact info | Contact section still renders cleanly (no blank gaps) |
| 16 | Invalid portal token | 404-style error: "Portal link not found" |
| 17 | Multiple pending approvals | All shown in approval section, each actionable |
| 18 | Mobile viewport (portal) | Single column, full-width buttons, readable |
| 19 | Out-of-scope items | Visually distinguished in delivery list |
| 20 | Delete client confirmation | Modal with warning, cascade delete noted |

### Performance Checks

| # | Check | Target |
|---|-------|--------|
| P1 | Dashboard load time | < 1 second with 4 clients |
| P2 | Client detail load time | < 1 second including scope calculation |
| P3 | Portal load time | < 2 seconds (edge function + render) |
| P4 | Quick-add response | Optimistic UI — appears instantly |
| P5 | No console errors | Zero errors in Chrome DevTools |
| P6 | No layout shifts | No CLS visible during page loads |

---

## Demo Data Summary

| Client | Scope | Usage | Status | Demo Purpose |
|--------|-------|-------|--------|--------------|
| Acme Corp | 20 hrs/mo | 12 used (60%) | On Track | Happy path, approvals, out-of-scope item |
| Bright Ideas | 15 hrs/mo | 13 used (87%) | Nearing Limit | Almost at cap, expired portal link |
| Summit Strategies | 5 deliverables/mo | 6 used (120%) | Exceeded | Scope creep story, pending scope request |
| Evergreen Growth | 30 tasks/mo | 10 used (33%) | On Track | New client, custom scope type |

**Portal test URLs:**
- Acme (on-track): `/portal/demo-acme-portal-token-2026`
- Summit (exceeded): `/portal/demo-summit-portal-token-2026`
- Bright Ideas (expired): `/portal/demo-bright-expired-token-2026`
- Evergreen (no link): no portal link set

---

## Potential Chrissy Questions & Answers

| Question | Answer |
|----------|--------|
| "Can I customize the categories?" | "Yes, categories are configurable. We ship with Marketing, Operations, Finance, Tech, Admin, Strategy, Content, Design, and General." |
| "What if a client has multiple months of scope?" | "Each month gets its own allocation. You can switch between periods." |
| "Can clients see the hours?" | "No. The portal only shows titles and status. Hours are operator-only data." |
| "What happens if I forget to log deliveries?" | "You can backdate entries. The system doesn't force real-time logging." |
| "Can I have different scope types for different clients?" | "Yes. Acme uses hours, Summit uses deliverables, Evergreen uses custom tasks." |
| "How does the client know something needs approval?" | "Items marked 'pending approval' show up in a dedicated section with clear Approve/Request Changes buttons." |
| "Can I white-label this?" | "That's on the roadmap for v2. Right now it says 'Powered by Luma.'" |
| "What about team access?" | "v1 is single operator. Multi-team support is planned." |
| "What integrations are coming?" | "ClickUp first, then Asana and GHL. Post-MVP priority." |
