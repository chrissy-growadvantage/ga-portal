# Bento Portal Layout — Design Specification

> Designed for the Grow Advantage client portal. Transforms the existing single-scroll layout into a dashboard-style bento grid that surfaces actionable content at a glance.

---

## Design Rationale

### Why Bento?

The current portal is a vertical stack (`max-w-2xl`, single column). This works on mobile but wastes desktop screen real estate and forces clients to scroll through ~7 sections linearly.

**Research backing:**
- Clients visit 2–4x/month for **30–90 seconds** (from design system doc)
- Their primary actions: **Scan, approve, done** — not deep reading
- NN Group dashboard studies show users scan dashboards in a **Z-pattern** on grid layouts, hitting top-left first, then sweeping across (https://www.nngroup.com/articles/dashboard-design/)
- Bento grids increase **information density without increasing cognitive load** when cells are well-sized and visually distinct (Card Sorting + Dashboard Design, NN Group 2019)

### Key Principles

1. **Largest card = most urgent action** (F-pattern / left-side bias)
2. **No redundancy between cards** — each card owns unique content
3. **Conditional sections collapse gracefully** — grid adapts when sections are empty
4. **Desktop-first grid, mobile-first stack** — bento on desktop, clean single-column on mobile

---

## Grid System

### Container

```
Current:  max-w-2xl (672px), single column
Proposed: max-w-5xl (1024px), 3-column CSS Grid

Breakpoints:
- Desktop (≥768px):  3-column grid, gap-4 (16px)
- Mobile  (<768px):  1-column stack, gap-3 (12px)
```

### CSS Grid Definition

```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  max-width: 1024px;
  margin: 0 auto;
  padding: 0 16px;
}

@media (max-width: 767px) {
  .bento-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
```

---

## Layout Map

### Desktop Grid (3 columns)

```
┌─────────────────────────────────────────────────────────┐
│                    WELCOME BAR                          │  Row 1
│  Welcome, Sarah — Week 3                                │  3 cols × auto
│  [# Slack] [📁 Drive] [📅 Book a call] [+ Request]     │  ~56px tall
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────┬───────────────────────┐
│                                 │                       │
│   🔴 ACTION NEEDED              │   📊 SCOPE & STATS    │  Row 2–3
│                                 │                       │  Action: 2 cols × 2 rows
│   2 items need your attention   │   ━━━━━━━━━━ 60%     │  Scope:  1 col × 2 rows
│                                 │   ✓ On Track          │
│   ┌─────────────────────────┐   │                       │
│   │ ☐ Complete intake form  │   │   8        2    14.5  │
│   │   Due Mar 5 · OVERDUE   │   │   Deliv  Pend  Hours │
│   │              [Open →]   │   │                       │
│   ├─────────────────────────┤   │   ─────────────────   │
│   │ ☐ Review kickoff agenda │   │   Focus: Launch new   │
│   │   Due Mar 6             │   │   onboarding flow     │
│   │              [View →]   │   │   and migrate users   │
│   ├─────────────────────────┤   │                       │
│   │ 📋 Request: Blog brief  │   │   📅 Next Meeting     │
│   │   [Received]            │   │   Thu, Mar 6, 2:00pm  │
│   └─────────────────────────┘   │   [Join Call →]       │
│                                 │                       │
└─────────────────────────────────┴───────────────────────┘

┌─────────────┬───────────────────┬───────────────────────┐
│             │                   │                       │
│  ✅ TASKS    │  🔨 WORK          │  📩 REQUESTS          │  Row 4
│             │  ACTIVITY         │                       │  3 × 1 col
│  3 open     │                   │  1 open               │  ~220px tall
│             │  3 in progress    │                       │
│  ☐ Intake   │                   │  Blog content brief   │
│  ☐ Agenda   │  • Email tmpl     │  [Received]           │
│  ☑ Logins   │    In Progress    │                       │
│             │  • Blog post      │  ──────────           │
│             │    In Review      │  8 completed          │
│             │  • Homepage       │  this month           │
│             │    Drafting       │                       │
│             │                   │  [+ Request           │
│             │                   │   Something]          │
│             │                   │                       │
└─────────────┴───────────────────┴───────────────────────┘

┌─────────────┬───────────────────────────────────────────┐
│             │                                           │
│  📈 ONBOARD │  📄 DOCUMENTS & LINKS                     │  Row 5
│  (1 col)    │  (2 cols)                                 │  Onboard: 1 col
│             │                                           │  Docs:    2 cols
│  6/8 done   │  ┌──────────┐  ┌──────────┐  ┌────────┐  │  ~200px tall
│             │  │💳 Payment │  │📝 Intake  │  │📋 Agree│  │
│  ✓✓✓✓✓✓●○  │  │  Setup   │  │   Form   │  │  ment  │  │
│  (mini bar) │  └──────────┘  └──────────┘  └────────┘  │
│             │                                           │
│             │  [# Slack]  [📁 Drive]  [📅 Calendar]     │
│             │                                           │
└─────────────┴───────────────────────────────────────────┘
```

### Grid Area Assignments (CSS)

```css
/* Named areas for clarity */
.bento-grid {
  grid-template-areas:
    "welcome   welcome   welcome"
    "action    action    scope"
    "action    action    scope"
    "tasks     work      requests"
    "onboard   docs      docs";
}

/* When no onboarding */
.bento-grid--no-onboarding {
  grid-template-areas:
    "welcome   welcome   welcome"
    "action    action    scope"
    "action    action    scope"
    "tasks     work      requests"
    "docs      docs      docs";
}

/* When no action items (all caught up) */
.bento-grid--no-actions {
  grid-template-areas:
    "welcome   welcome   welcome"
    "scope     scope     meeting"
    "tasks     work      requests"
    "onboard   docs      docs";
}
```

---

## Card Specifications

### Card 1: Welcome Bar

**Grid position:** 3 cols, 1 row (full width, thin)
**Visual weight:** Low — utility strip, not a focal point

**Content:**
- Left: Greeting text — "Welcome, {firstName} — {partnershipType}, Week {weekNumber}"
- Subtitle: "Primary comms: {channel}" (small, muted)
- Right: Quick action buttons — inline flex, wrapping on narrow

**Quick Action Buttons:**
- `[# Slack]` — ghost button, icon + label
- `[📁 Drive]` — ghost button, icon + label
- `[📅 Book a call]` — ghost button, icon + label
- `[+ Request Something]` — **primary filled button** (indigo), stands out

**Visual Treatment:**
```
Background:   primary/5 (rgba(91,77,199,0.05)) — very subtle indigo tint
Border:       primary/10 (rgba(91,77,199,0.10))
Border-radius: 12px (rounded-xl)
Padding:      12px 16px
Shadow:       none
Height:       auto (~56px)
```

**Mobile:** Buttons wrap to second line. Greeting stays left-aligned.

---

### Card 2: Action Needed (Hero Card)

**Grid position:** 2 cols wide × 2 rows tall (top-left — highest visual weight per F-pattern)
**Visual weight:** HIGHEST — this is what the client sees first

**Content — aggregates 3 sources of urgency:**
1. **Overdue/pending tasks** (from `clientTasks` where `!completed_at`)
2. **Pending delivery approvals** (from `deliveries` where `status === 'pending_approval'`)
3. **Waiting-on-client requests** (from `scopeRequests` where `ga_status === 'waiting_on_client'`)

**Card header:**
- Title: "Needs Your Attention"
- Count badge: red circle with total count (e.g., `3`)
- If 0 items: Show positive empty state (see below)

**Item rendering (vertical list inside card):**
Each item is a mini-row with:
- **Task items:** Checkbox (44×44 touch target) + title + due date + overdue badge + action link
- **Approval items:** Indigo icon + title + "Pending your approval" + [Approve] [Decline] buttons
- **Request items:** Amber icon + title + status badge + admin note if present

Items sorted: overdue tasks first, then approvals, then waiting-on-client requests.

**Visual Treatment:**
```
Background:   white
Border:       2px solid red-200 (#fecaca) — strong red signal
Border-left:  4px solid red-500 (#ef4444) — LEFT ACCENT (draws F-pattern eye)
Border-radius: 16px (rounded-2xl)
Padding:      20px
Shadow:       0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)
             (subtle elevation, not heavy)
```

**Empty State (0 items):**
When all caught up, the card transforms:
```
Background:   emerald-50/30
Border:       1px solid emerald-200
Border-left:  4px solid emerald-500
Content:      ✓ icon (large, emerald)
              "You're all caught up!"
              "No tasks, approvals, or requests need your attention."
Height:       Reduced (1 row instead of 2, grid adapts)
```

**Hover:** `translateY(-2px)` + slightly deeper shadow on the whole card.

---

### Card 3: Scope & Stats

**Grid position:** 1 col wide × 2 rows tall (top-right, alongside hero)
**Visual weight:** High — the primary metric clients track

**Content (top to bottom, single card):**

**Section A — Scope Progress:**
- Status badge: `{icon} {label}` (e.g., ✓ On Track) with color from SCOPE_STATUS_CONFIG
- Progress bar: Full-width, rounded-full, 8px tall, colored by status
- Text: `{used} / {allocated} {unit}` (JetBrains Mono) + `{percentage}% used · {remaining} remaining`

**Section B — Stat Pills (3 items, horizontal row):**
```
┌────────┬────────┬────────┐
│   8    │   2    │  14.5  │
│ Deliv  │ Pend   │ Hours  │
└────────┴────────┴────────┘
```
- Each pill: large number (text-xl, JetBrains Mono, bold) + small label below
- Colors: Delivered = primary (#5B4DC7), Pending = amber (#E8853A), Hours = foreground
- Separated by 1px borders (like current stat pills pattern)
- Note: Scope % is NOT repeated here (already shown in the bar above)

**Section C — This Month's Focus:**
- Label: "FOCUS" (xs, uppercase, tracking-wider, muted)
- Text: `{this_month_focus}` (sm, 2-line clamp)
- Icon: Target icon in primary/10 bg circle

**Section D — Next Meeting:**
- Label: "NEXT MEETING" (xs, uppercase, muted)
- Date: `{day}, {date}` (sm, font-medium)
- Time: `{time}` (xs, muted)
- Button: `[Join →]` (primary, small, with ExternalLink icon)
- If no meeting: Section D hidden, card is shorter

**Visual Treatment:**
```
Background:   white
Border:       1px solid border/60
Border-radius: 16px (rounded-2xl)
Padding:      20px (sections separated by border-t border-border/50)
Shadow:       0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)
```

**Internal dividers:** Thin horizontal lines (`border-t border-border/50`) between sections A/B/C/D.

---

### Card 4: Your Tasks

**Grid position:** 1 col, Row 4 (left)
**Visual weight:** Medium

**Content:**
- Header: "Your Tasks" + open count badge (e.g., `3 open`)
- Task list: Max 5 visible, "View all" link if more
- Each task: Checkbox + title + due date + overdue badge
- Completed tasks: Shown with strikethrough, sorted to bottom, max 2 visible

**Visual Treatment:**
```
Background:   white
Border:       1px solid border/60
Border-radius: 16px
Padding:      16px
Shadow:       0 1px 2px rgba(0,0,0,0.03)
Hover:        translateY(-1px), slightly deeper shadow
```

**Card accent:** Small indigo dot or left-border accent (2px) only if has overdue items.

**Empty state:** "No tasks right now" with checkmark icon.

---

### Card 5: Work Activity

**Grid position:** 1 col, Row 4 (center)
**Visual weight:** Medium

**Content (two sub-sections):**

**Sub A — "In Progress" (top half):**
- Count: `{n} active`
- List: In-progress deliveries with status badges and category tags
- Max 4 visible, "+{n} more" if additional

**Sub B — "Completed This Month" (bottom half):**
- Count: `{n} delivered`
- Compact list: ✓ icon + title (no badges, just names)
- Max 3 visible, "+{n} more" link

**Visual Treatment:**
```
Background:   white
Border:       1px solid border/60
Border-radius: 16px
Padding:      16px
Shadow:       0 1px 2px rgba(0,0,0,0.03)
```

Internal divider between In Progress and Completed sections.

**Empty state:** Briefcase icon + "No active work this period."

---

### Card 6: Requests

**Grid position:** 1 col, Row 4 (right)
**Visual weight:** Medium

**Content:**
- Header: "Requests" + open count if any
- Open requests: Show latest 2-3 with status badges (Submitted, Received, In Progress, etc.)
- Each request: Title + category badge + status badge + date
- Completed count summary: `{n} completed this month` (muted, bottom)
- CTA: `[+ Request Something]` button at bottom of card (primary, full-width within card)

**Visual Treatment:**
```
Background:   white
Border:       1px solid border/60
Border-radius: 16px
Padding:      16px
Shadow:       0 1px 2px rgba(0,0,0,0.03)
```

**CTA button styling:** Primary filled (indigo bg, white text), rounded-lg, 36px tall, full card width.

**Empty state:** Inbox icon + "No requests yet" + CTA button still visible.

---

### Card 7: Onboarding Progress

**Grid position:** 1 col, Row 5 (left) — CONDITIONAL, only shown during onboarding
**Visual weight:** Low-Medium

**Content:**
- Header: "Onboarding" + `{done}/{total} complete`
- **Mini progress bar:** Horizontal segmented bar (not the full vertical stepper)
  - Each segment = 1 stage
  - Done = emerald fill, In Progress = primary fill + pulse, Not Started = gray
- Current stage highlight: Label + status badge + action button if applicable
- Completed stages: Just checkmarks in the bar, no detailed list

**Why mini-bar instead of full stepper?**
The full 8-step vertical stepper is too tall for a bento card. The mini-bar gives progress-at-a-glance. Clicking the card can expand to full stepper (or link to a detail view).

**Visual Treatment:**
```
Background:   white
Border:       1px solid border/60
Border-radius: 16px
Padding:      16px
Shadow:       0 1px 2px rgba(0,0,0,0.03)
```

**When onboarding is absent:** This card doesn't render. Documents & Links expands to full width (3 cols).

---

### Card 8: Documents & Links

**Grid position:** 2 cols (or 3 cols if no onboarding), Row 5 (right)
**Visual weight:** Low — reference material, not action-oriented

**Content:**

**Document grid (internal 3-col or 2-col sub-grid):**
Each document = small card-within-card:
```
┌──────────────┐
│  💳           │
│  Payment      │
│  Setup        │
│  [Open →]     │
└──────────────┘
```

Documents shown (conditional):
- Payment Setup (Stripe)
- Intake Form
- Agreements (latest 1-2)
- Monthly Reports (latest 1-2)

**Quick Links row (below documents):**
- Horizontal row of pill buttons: `[# Slack]` `[📁 Drive]` `[📅 Calendar]`
- These duplicate the Welcome Bar links but are also here for clients who scroll past the top

**Visual Treatment:**
```
Background:   white
Border:       1px solid border/60
Border-radius: 16px
Padding:      16px
Shadow:       0 1px 2px rgba(0,0,0,0.03)

Internal doc cards:
  Background:   muted/30 (very light gray)
  Border:       1px solid border/40
  Border-radius: 12px
  Padding:      12px
  Hover:        bg-muted/50, translateY(-1px)
```

---

## Card Visual Hierarchy Summary

| Card | Grid Span | Visual Weight | Border Treatment | Shadow |
|------|-----------|--------------|-----------------|--------|
| Welcome Bar | 3×1 | Low | primary/10 border | None |
| Action Needed | 2×2 | **Highest** | **2px red-200 + 4px left red-500** | Medium elevation |
| Scope & Stats | 1×2 | High | 1px border/60 | Medium elevation |
| Tasks | 1×1 | Medium | 1px border/60 (+ red accent if overdue) | Light |
| Work Activity | 1×1 | Medium | 1px border/60 | Light |
| Requests | 1×1 | Medium | 1px border/60 | Light |
| Onboarding | 1×1 | Low-Med | 1px border/60 | Light |
| Docs & Links | 2×1 | Low | 1px border/60 | Light |

---

## Mobile Stacking Order

On mobile (<768px), the grid collapses to single column. Order follows **priority-first** (most actionable content at top per F-pattern research):

```
1. Welcome Bar (full width, thin)
2. Action Needed (hero — still full width, same red treatment)
3. Scope & Stats (full width)
4. Tasks (full width)
5. Work Activity (full width)
6. Requests (full width)
7. Onboarding (full width, if applicable)
8. Documents & Links (full width)
```

Use CSS `order` property to ensure this sequence regardless of grid area assignment:

```css
@media (max-width: 767px) {
  .bento-welcome   { order: 1; }
  .bento-action     { order: 2; }
  .bento-scope      { order: 3; }
  .bento-tasks      { order: 4; }
  .bento-work       { order: 5; }
  .bento-requests   { order: 6; }
  .bento-onboarding { order: 7; }
  .bento-docs       { order: 8; }
}
```

---

## Conditional Layout Adaptations

### When Action Needed is empty (all caught up)

The hero card shrinks to a compact "All caught up" card (1 row instead of 2):

```css
.bento-grid--no-actions {
  grid-template-areas:
    "welcome   welcome   welcome"
    "caught-up scope     scope"
    "tasks     work      requests"
    "onboard   docs      docs";
}
```

```
┌───────────────────────────────────────────────────────┐
│ WELCOME BAR                                            │
└───────────────────────────────────────────────────────┘
┌─────────────┬─────────────────────────────────────────┐
│  ✓ All      │  SCOPE & STATS (2 cols, 1 row)         │
│  caught up! │  Progress bar + stats inline            │
│  (1 col)    │  + Focus + Meeting side-by-side         │
└─────────────┴─────────────────────────────────────────┘
┌─────────────┬───────────────────┬─────────────────────┐
│  TASKS      │  WORK ACTIVITY    │  REQUESTS           │
└─────────────┴───────────────────┴─────────────────────┘
┌─────────────┬─────────────────────────────────────────┐
│  ONBOARDING │  DOCUMENTS & LINKS                      │
└─────────────┴─────────────────────────────────────────┘
```

### When no onboarding

Row 5 becomes full-width Documents & Links:

```css
.bento-grid--no-onboarding .bento-docs {
  grid-column: 1 / -1;  /* span all 3 cols */
}
```

### When no tasks

Tasks card shows empty state but remains in grid (maintains layout stability):
```
┌─────────────┐
│  ✓ No tasks │
│  right now  │
│             │
│  (icon)     │
└─────────────┘
```

### When no meeting scheduled

Meeting section inside Scope & Stats card hides. Focus section gets more vertical space. Card height auto-adjusts (may become shorter than Action Needed — that's fine, CSS Grid handles it).

---

## Animation & Motion

### Card Load Animation

Staggered fade-in on page load (consistent with design system: 100ms delay per item, max 500ms total):

```css
.bento-card {
  opacity: 0;
  transform: translateY(12px);
  animation: bento-appear 0.4s ease-out forwards;
}

.bento-card:nth-child(1) { animation-delay: 0ms; }
.bento-card:nth-child(2) { animation-delay: 80ms; }
.bento-card:nth-child(3) { animation-delay: 120ms; }
.bento-card:nth-child(4) { animation-delay: 180ms; }
.bento-card:nth-child(5) { animation-delay: 220ms; }
.bento-card:nth-child(6) { animation-delay: 260ms; }
.bento-card:nth-child(7) { animation-delay: 300ms; }
.bento-card:nth-child(8) { animation-delay: 340ms; }

@keyframes bento-appear {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .bento-card {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
```

### Card Hover (Desktop Only)

```css
@media (hover: hover) {
  .bento-card {
    transition: transform 0.15s ease-out, box-shadow 0.15s ease-out;
  }
  .bento-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  }
}
```

### Scope Progress Bar

Animate width on load with a 0.6s ease-out transition (existing pattern from PortalRightNow).

---

## Color Reference

Consistent with the existing design system:

| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `#5B4DC7` | CTA buttons, scope bar (on-track), stat highlights |
| `--primary/5` | `rgba(91,77,199,0.05)` | Welcome bar bg, subtle card tints |
| `--primary/10` | `rgba(91,77,199,0.10)` | Icon backgrounds, hover states |
| `--success` | `#25A576` | Completed items, on-track status |
| `--accent-warm` | `#E8853A` | Pending count, warning states |
| `--destructive` | `#EF4444` | Overdue badges, action-needed border |
| `--background` | `hsl(0 0% 99%)` | Page background (off-white) |
| `--border` | `hsl(0 0% 90%)` | Card borders (at 60% opacity) |

**Stat pill accent colors:**
- Delivered count: `text-primary` (#5B4DC7)
- Pending count: `text-accent-warm` (#E8853A)
- Hours used: `text-foreground` (default dark)

---

## Typography

All existing font pairings maintained:

| Element | Font | Weight | Size |
|---------|------|--------|------|
| Card headers | Plus Jakarta Sans | 600 (semibold) | 13px (text-sm) |
| Section labels | Plus Jakarta Sans | 600 | 11px (text-xs), uppercase, tracking-wider |
| Stat numbers | JetBrains Mono | 700 (bold) | 20px (text-xl) |
| Stat labels | Plus Jakarta Sans | 400 | 11px (text-xs) |
| Body text | Plus Jakarta Sans | 400 | 14px (text-sm) |
| Task titles | Plus Jakarta Sans | 500 | 14px (text-sm) |
| Muted helper | Plus Jakarta Sans | 400 | 11px (text-xs) |

---

## Accessibility Requirements

1. **Touch targets:** All buttons/checkboxes minimum 44×44px (Fitts's Law)
2. **Color contrast:** All text meets WCAG AA (4.5:1 for body, 3:1 for large text)
3. **Triple encoding:** All status communicated via color + icon + text label (never color alone)
4. **Keyboard navigation:** Tab order follows visual grid (left-to-right, top-to-bottom)
5. **Screen readers:** Each card has a semantic `<section>` with `aria-label`
6. **Reduced motion:** All animations respect `prefers-reduced-motion: reduce`
7. **Focus indicators:** Visible focus ring (2px solid primary, 2px offset) on all interactive elements

---

## Implementation Notes for Frontend Developer

### Component Mapping

| Bento Card | Existing Component(s) | Changes Needed |
|---|---|---|
| Welcome Bar | None (new) | New component: `BentoWelcomeBar` |
| Action Needed | `PortalNeedsAttention` + `PortalClientTasks` (subset) | New component: `BentoActionNeeded` — aggregates urgent items from tasks, approvals, and requests |
| Scope & Stats | `PortalRightNow` | Refactor into `BentoScopeStats` — same data, new layout |
| Tasks | `PortalClientTasks` | Wrap in `BentoTasksCard` — same task list, card wrapper, max 5 shown |
| Work Activity | `PortalWorkVisibility` | Refactor into `BentoWorkActivity` — compact, no past months (those go in expandable detail) |
| Requests | `PortalRequestsSection` | Refactor into `BentoRequestsCard` — summary view, latest 2-3 only |
| Onboarding | `PortalOnboardingStepper` | New component: `BentoOnboardingCard` — mini progress bar, not full stepper |
| Docs & Links | `PortalDocumentsLinks` | Refactor into `BentoDocsLinks` — grid of mini doc cards |

### Data Flow

No new data fetching needed. All data comes from the existing `usePortalData` hook which returns:
- `client` (PortalClient)
- `deliveries` (DeliveryItem[])
- `scope_allocations` (ScopeAllocation[])
- `agreements` (Agreement[])
- `monthly_snapshots` (MonthlySnapshotIndex[])
- `scope_requests` (PortalScopeRequest[])
- `onboarding_stages` (PortalOnboardingStage[])
- `client_tasks` (PortalClientTask[])
- `operator` (operator info)

### Grid Container Component

The main `Portal.tsx` page should replace the `<div className="space-y-8">{children}</div>` inside `PortalLayout` with a `<div className="bento-grid">` container. The `PortalLayout` max-width should increase from `max-w-2xl` to `max-w-5xl` (or make it configurable).

### Anchor Nav

The existing `PortalAnchorNav` (pill-based sticky nav) is **removed** in the bento layout. The bento grid IS the navigation — everything is visible at once (or within one scroll). No need for section-jumping pills.

On mobile, where content stacks linearly, you may optionally re-add a simplified anchor nav, but it's not required for MVP.

---

## What This Spec Does NOT Cover

- **Past month work history** — not shown in bento grid. Consider an expandable "Past Months" section below the grid, or a separate page.
- **Full request history grouped by month** — bento shows latest 2-3. Full history could be a modal or detail view.
- **Full onboarding stepper** — bento shows mini progress bar. Full stepper accessible via card click/expand.
- **This Month Details** (outcomes, deliverables, improvements, risks) — collapsible section within Scope card or accessible via "View details" link.
- **Agreement detail/e-signature** — existing separate route (`/portal/:token/agreements/:id`), unchanged.
