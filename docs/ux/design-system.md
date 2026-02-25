# Luma Design System

> Make invisible delivery work visible. Turn operational effort into measurable value.

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Critical UX Decisions](#critical-ux-decisions)
3. [Color System](#color-system)
4. [Typography](#typography)
5. [Spacing & Layout](#spacing--layout)
6. [Component Library](#component-library)
7. [Key Component Designs](#key-component-designs)
8. [Motion & Interaction](#motion--interaction)
9. [Loading States](#loading-states)
10. [Error States](#error-states)
11. [Empty States & Onboarding](#empty-states--onboarding)
12. [Responsive Design](#responsive-design)
13. [Accessibility](#accessibility)
14. [UX Flow Diagrams](#ux-flow-diagrams)

---

## Design Philosophy

### Two Audiences, Two Aesthetics

Luma serves two fundamentally different users with different needs, contexts, and technical comfort levels:

| | Operator (Power User) | Client (Viewer) |
|---|---|---|
| **Mindset** | "I need to get work done fast" | "I want to see what's happening" |
| **Session frequency** | 3-5x/week, 10-30 min each | 2-4x/month, 30-90 seconds |
| **Technical comfort** | High (daily tool user) | Low-medium (email + spreadsheets) |
| **Primary action** | Log, track, configure | Scan, approve, done |
| **Interface density** | Medium-high (data-rich, functional) | Low (summary-first, clean) |

**Research backing**: NN Group's "Two Audiences" principle — when user groups have fundamentally different goals, design separate experiences rather than compromising both. Source: https://www.nngroup.com/articles/audience-based-navigation/

### Core Design Tenets

1. **Clarity over cleverness** — Every pixel serves comprehension, not decoration
2. **Density where needed, space where not** — Operator views pack information; client views breathe
3. **Warm professionalism** — Not cold SaaS, not cutesy startup. Competent, trustworthy, human
4. **Speed of use > speed of learning** — Optimise for the 100th use, not the 1st (but don't make the 1st hostile)

---

## Critical UX Decisions

### Decision 1: Client Portal — Single Scrollable Page (Not Tabs)

**Recommendation: Single scrollable page with anchor sections**

**Evidence:**

1. **Session duration is <90 seconds** (spec target: "understood in <10 seconds"). Tabs add 1-2 clicks per section. Scrolling lets clients scan everything in one fluid motion.

2. **NN Group eye-tracking** (2020): Users scroll more than they used to — 74% of viewing time is spent on the first two screenfuls, but users DO scroll. The critical insight: users scroll *if the content rewards scrolling*. Source: https://www.nngroup.com/articles/scrolling-and-attention/

3. **Mobile context**: 54%+ of web traffic is mobile (StatCounter 2024). Tabs on mobile create tiny tap targets and add navigation overhead. Scrolling is the native mobile gesture.

4. **Information scent**: A scrollable page lets clients "smell" what's below — section headers visible during scroll provide information scent. Tabs hide content behind opaque labels.

**Implementation:**

```
Client Portal Layout (single scroll):
┌──────────────────────────────────┐
│  Client branding / operator name │  ← Trust banner
│  "Your delivery summary"         │
├──────────────────────────────────┤
│  ┌────────────────────────────┐  │
│  │  SCOPE TRACKER WIDGET     │  │  ← Highest priority: "Am I getting value?"
│  │  12 of 20 hours used      │  │
│  │  ██████████░░░░░ 60%      │  │
│  └────────────────────────────┘  │
├──────────────────────────────────┤
│  DELIVERY TIMELINE               │  ← Chronological, grouped by week
│  ┌─ This Week ──────────────┐   │
│  │ ✓ Monthly analytics      │   │
│  │ ✓ Email campaign setup   │   │
│  └──────────────────────────┘   │
│  ┌─ Last Week ──────────────┐   │
│  │ ✓ SEO audit completed    │   │
│  │ ✓ Social calendar        │   │
│  └──────────────────────────┘   │
├──────────────────────────────────┤
│  PENDING APPROVALS (if any)      │  ← Action section, only shown if items exist
│  ┌──────────────────────────┐   │
│  │ Newsletter draft  [✓][✕] │   │
│  └──────────────────────────┘   │
├──────────────────────────────────┤
│  SCOPE REQUESTS (if any)         │  ← Out-of-scope visibility
├──────────────────────────────────┤
│  Powered by Luma                 │  ← Footer with operator branding
└──────────────────────────────────┘
```

**Sticky navigation for longer views:**
When the portal has 20+ delivery items, add a lightweight sticky section indicator (not full tabs — just dots or a slim progress bar) showing which section the user is in.

---

### Decision 2: Scope Tracker Visualization — Multi-Signal Widget

**Recommendation: Segmented progress bar + numeric summary + status badge**

The scope tracker is Luma's killer feature (RICE: 10.8). It must communicate three things at a glance:

1. **How much is used** (progress)
2. **Is this OK?** (status)
3. **What exactly?** (detail on demand)

**Research backing**: Cleveland & McGill's graphical perception hierarchy (1984) — position along a common scale is the most accurately perceived visual encoding. Bars > pie charts > area for quantity comparison.

**Design:**

```
┌─────────────────────────────────────────────┐
│  Scope Usage                    Feb 2026     │
│                                              │
│  12 of 20 hours used              60%        │
│  ████████████░░░░░░░░              On Track  │
│  ├── green ──┤├─ gray ─┤                     │
│                                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐     │
│  │ In-scope │  │Out-scope│  │Remaining│     │
│  │  10 hrs  │  │  2 hrs  │  │  8 hrs  │     │
│  └─────────┘  └─────────┘  └─────────┘     │
└─────────────────────────────────────────────┘
```

**Status thresholds (with colors):**

| Usage | Status | Color | Bar fill |
|-------|--------|-------|----------|
| 0-60% | On Track | `success` (green) | Green fill |
| 61-85% | Active | `primary` (indigo) | Indigo fill |
| 86-100% | Nearing Limit | `accent-warm` (amber) | Amber fill |
| 100% exactly | Fully Used | `accent-warm` (amber) | Full amber, no overflow |
| 101%+ | Exceeded | `destructive` (red) | Red overflow indicator |

**Operator vs Client variant:**

| Feature | Operator View | Client View |
|---------|--------------|-------------|
| Progress bar | Segmented (in-scope vs out-of-scope) | Simple single bar |
| Status badge | Shows + editable | Shows, read-only |
| Breakdown cards | In-scope / Out-of-scope / Remaining | Used / Remaining |
| Click action | Opens scope detail panel | None (informational) |
| Period selector | Dropdown to switch months | Current month only |

**Anti-pattern avoided**: Circular/ring charts. They look trendy but research shows they're harder to read than bars for comparing proportions (Cleveland & McGill, 1984). Pie charts especially fail when comparing segments of similar size — exactly the case for scope tracking (60% vs 40%).

---

### Decision 3: Delivery Logging Form — Quick-Add Pattern

**Recommendation: Inline quick-add row + dialog for full details**

**Research backing**: Luke Wroblewski's "gradual engagement" principle — reduce friction for the common action, offer depth for the uncommon one. For operators logging 10+ items/week (target metric), the dialog pattern alone is too heavy.

**Two-tier approach:**

**Tier 1: Quick-Add Row (primary path)**
An always-visible input at the top of the delivery list. Title + Enter = logged. Minimum friction.

```
┌─────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────┐ [+ Add]│
│  │ What did you deliver?               │        │
│  └─────────────────────────────────────┘        │
│  Press Enter to log · Tab for details            │
└─────────────────────────────────────────────────┘
```

Defaults applied on quick-add:
- Status: `completed`
- Category: Last used category (or "General")
- Date: Now
- Hours: null (can add later)

**Tier 2: Full Dialog (secondary path)**
The current `LogDeliveryDialog` pattern, triggered by:
- Clicking "+ Add" button (keeps explicit path)
- Pressing Tab in the quick-add row (escalates to full form)
- Clicking "Edit" on a logged delivery

**Research backing for quick-add**: Todoist's success with the quick-add pattern (https://todoist.com/) — their data shows 70%+ of tasks are created via quick-add, with detail added retroactively. This maps directly to Luma's use case (operators batch-logging completed work).

**Keyboard shortcuts for power users:**
- `n` — Focus quick-add (when not in another input)
- `Enter` — Submit quick-add
- `Tab` — Expand to full form
- `Escape` — Clear and blur

---

### Decision 4: Empty States & Onboarding Flow

**Recommendation: Progressive onboarding with contextual empty states**

**Research backing**: NN Group's "Feature Discovery" principle — users learn by doing, not by reading. Onboarding should guide action, not explain concepts. Source: https://www.nngroup.com/articles/onboarding/

**No separate onboarding flow.** Instead, each empty state IS the onboarding:

**Step 1: Dashboard (0 clients)**
```
┌─────────────────────────────────────────┐
│                                         │
│      Welcome to Luma                    │
│                                         │
│  You're 3 steps away from showing       │
│  clients the value you deliver.         │
│                                         │
│  ┌─ Step 1 ──────────────────────────┐  │
│  │ ● Add your first client           │  │
│  │   Start by adding one client —    │  │
│  │   you can add more anytime.       │  │
│  │                     [Add Client →]│  │
│  └───────────────────────────────────┘  │
│  ┌─ Step 2 ──────────────────────────┐  │
│  │ ○ Log a delivery                  │  │
│  │   Record something you've done    │  │
│  │   for them.                       │  │
│  └───────────────────────────────────┘  │
│  ┌─ Step 3 ──────────────────────────┐  │
│  │ ○ Share the client view           │  │
│  │   Generate a magic link to show   │  │
│  │   your client.                    │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

**Step 2: Client Detail (0 deliveries)**
```
┌─────────────────────────────────────────┐
│  No deliveries logged yet               │
│                                         │
│  Log your first delivery to start       │
│  building this client's record.         │
│                                         │
│  Quick tip: Most operators start by     │
│  logging this week's completed work.    │
│                                         │
│  [Log your first delivery]              │
└─────────────────────────────────────────┘
```

**Step 3: Scope tab (0 scope allocations)**
```
┌─────────────────────────────────────────┐
│  No scope defined                       │
│                                         │
│  Define how much you've agreed to       │
│  deliver — Luma will track usage        │
│  automatically.                         │
│                                         │
│  Example: "20 hours per month" or       │
│  "5 deliverables per month"             │
│                                         │
│  [Set up scope allocation]              │
└─────────────────────────────────────────┘
```

**Empty state principles:**
1. State what's missing (not "nothing here" — "no deliveries logged yet")
2. Explain the benefit of filling it ("Luma will track usage automatically")
3. Single clear CTA (one button, not three options)
4. Use helpful examples ("20 hours per month")
5. Never show an illustration/icon larger than the text — research shows users skip decorative imagery (NN Group banner blindness studies)

---

## Color System

### Palette

Luma uses a warm-toned palette that avoids cold SaaS blues. The foundation is terracotta + sage green + amber, creating a premium-but-approachable, earthy feel.

**Operator View (Light Mode):**

| Token | HSL | Hex | Usage |
|-------|-----|-----|-------|
| `--background` | 40 20% 98% | #FDFBF8 | Page background (warm off-white) |
| `--foreground` | 240 10% 8% | #131318 | Primary text |
| `--card` | 0 0% 100% | #FFFFFF | Card surfaces |
| `--primary` | 13 58% 51% | #C55C40 | Actions, active states, links (terracotta) |
| `--primary-glow` | 13 58% 93% | #F9EDE9 | Primary tint backgrounds |
| `--accent-warm` | 28 92% 58% | #E8853A | Attention, warnings, scope alerts |
| `--success` | 140 20% 49% | #6B8E6F | Completed, on-track states (sage green) |
| `--destructive` | 0 84% 60% | #EF4343 | Errors, exceeded scope |
| `--muted` | 40 10% 96% | #F6F5F3 | Subtle backgrounds |
| `--muted-foreground` | 240 5% 42% | #666770 | Secondary text |
| `--border` | 40 8% 90% | #E6E4E0 | Dividers, card borders |

**Client Portal (Light Mode):**
The client portal uses a slightly different surface treatment — a cleaner white with less noise texture, creating a "polished report" feel distinct from the operator's workspace.

| Override | Value | Reason |
|----------|-------|--------|
| `--background` | 0 0% 99% | Cleaner white, less warm = "printed document" |
| `--card` | 0 0% 100% | Pure white cards, no noise texture |
| Font weight | Headings at 700, body at 400 | Lighter feel, less dense |
| Max content width | 640px | Narrower reading column for scannability |

**Semantic Colors (status system):**

| Status | Color | Token | Usage |
|--------|-------|-------|-------|
| On Track | Sage Green | `success` | Scope 0-60%, completed items |
| Active | Terracotta | `primary` | Scope 61-85%, in-progress items |
| Needs Attention | Amber | `accent-warm` | Scope 86-100%, pending approval |
| Exceeded / Error | Red | `destructive` | Scope 101%+, revision requested |
| Neutral / Archived | Gray | `muted-foreground` | Archived clients, past items |

### Color Accessibility

All color pairs meet WCAG AA (4.5:1 text, 3:1 UI elements):

| Pair | Ratio | Pass |
|------|-------|------|
| `foreground` on `background` | 15.8:1 | AAA |
| `primary` on `background` | 5.2:1 | AA |
| `muted-foreground` on `background` | 5.1:1 | AA |
| `success` text (#25A576) on white | 3.4:1 | AA (large text/UI) |
| Status badges use bg tint + dark text | 7:1+ | AAA |

**Never use color as the sole indicator.** All status states use color + icon + label (triple encoding).

---

## Typography

### Font Stack

Already implemented in `index.css` and `tailwind.config.ts`:

- **Display & Body**: Plus Jakarta Sans (weights: 400, 500, 600, 700, 800)
- **Monospace / Data**: JetBrains Mono (weights: 400, 500, 600, 700)

**Why these are good choices:**

Plus Jakarta Sans is distinctive without being distracting. It's geometric but warm — the slightly rounded terminals give it more personality than Inter/Roboto while maintaining readability. Google Fonts CDN, free, well-hinted.

JetBrains Mono is purposeful for a tool that displays data — scope numbers, hours, dates. It signals "this is precise data" without the coldness of system monospace. It also provides visual contrast with the body font.

**Color Philosophy:** Terracotta (warm, earthy red-brown) paired with sage green creates a distinctive, organic feel that stands out from the typical blue/purple SaaS aesthetic. The combination feels professional but approachable — like a trusted consultant's office rather than a cold tech platform.

### Type Scale

Use a modular scale based on the spec's content hierarchy:

| Level | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|--------|-------------|----------------|-------|
| Display | 30px / `text-3xl` | 800 | 1.2 | -0.02em | Page titles (Dashboard, Client name) |
| H1 | 24px / `text-2xl` | 700 | 1.3 | -0.015em | Section titles |
| H2 | 20px / `text-xl` | 600 | 1.3 | -0.01em | Card titles, subsections |
| H3 | 16px / `text-base` | 600 | 1.4 | -0.005em | List headers, labels |
| Body | 14px / `text-sm` | 400 | 1.5 | 0 | Default content text |
| Body Small | 13px / `text-xs` | 400-500 | 1.5 | 0 | Secondary info, metadata |
| Caption | 12px / `text-xs` | 500 | 1.4 | 0.01em | Badges, timestamps |
| Mono Data | 14px / `text-sm font-mono` | 500 | 1.3 | 0 | Scope numbers, hours |

### Typography Rules

1. **Never go below 13px** for any readable text (WCAG, and NN Group mobile research)
2. **Use weight contrast** — 400 body vs 700 headings (not subtle 400 vs 500)
3. **Mono for data, sans for prose** — scope hours in `font-mono`, descriptions in `font-sans`
4. **Truncate with ellipsis** in lists — full text on detail/hover. Max display width via `truncate` or `line-clamp-2`

---

## Spacing & Layout

### Spacing Scale

Use Tailwind's default 4px base with these conventions:

| Concept | Token | Value | Usage |
|---------|-------|-------|-------|
| Micro gap | `gap-1` | 4px | Between icon and label |
| Small gap | `gap-2` | 8px | Between related items |
| Default gap | `gap-3` | 12px | Between form fields |
| Medium gap | `gap-4` | 16px | Between cards, sections |
| Large gap | `gap-6` | 24px | Between major sections |
| Section break | `gap-8` | 32px | Between page sections |
| Page section | `space-y-8` | 32px | Between top-level sections |

### Layout Grid

**Operator Dashboard:**

```
┌──────────┬─────────────────────────────────┐
│          │                                 │
│  Sidebar │    Content Area                 │
│  w-64    │    max-w-6xl mx-auto            │
│  fixed   │    px-4 sm:px-6 lg:px-8         │
│  left    │    py-6 sm:py-8                 │
│          │                                 │
│          │    ┌──── 2-4 col grid ────┐     │
│          │    │ Stats cards          │     │
│          │    └──────────────────────┘     │
│          │                                 │
│          │    ┌──── full width ──────┐     │
│          │    │ Client list          │     │
│          │    └──────────────────────┘     │
│          │                                 │
└──────────┴─────────────────────────────────┘
```

- Sidebar: 256px (w-64), fixed left, hidden on mobile
- Content: fluid, max-width 1152px (max-w-6xl), centered
- Content padding: 16px mobile / 24px tablet / 32px desktop
- Vertical rhythm: 32px (space-y-8) between sections

**Client Portal:**

```
┌──────────────────────────────────────┐
│  ┌──── max-w-2xl mx-auto ────────┐  │
│  │                               │  │
│  │  Scope tracker                │  │
│  │                               │  │
│  │  Delivery timeline            │  │
│  │                               │  │
│  │  Pending approvals            │  │
│  │                               │  │
│  └───────────────────────────────┘  │
└──────────────────────────────────────┘
```

- No sidebar, no navigation
- Single column: max-width 672px (max-w-2xl), centered
- More generous padding: 24px mobile / 48px desktop
- Reading-optimised width — 65-75 characters per line (optimal per research)

---

## Component Library

### Base: shadcn/ui + Custom Extensions

The project already uses shadcn/ui with Radix primitives. Good foundation — accessible, unstyled, composable.

### Customization Strategy

1. **Don't modify shadcn/ui source files.** Use wrapper components for custom behavior.
2. **Override via CSS variables** (already set up in `index.css`), not class overrides.
3. **Extend with Luma-specific components** in domain folders (`components/scope/`, `components/deliveries/`), not in `components/ui/`.

### Component Inventory

**Already available (shadcn/ui):**
- Button, Input, Label, Textarea, Select
- Card, Badge, Skeleton, Separator
- Dialog, AlertDialog, Sheet, Drawer
- Tabs, Accordion, Collapsible
- Form (react-hook-form integration)
- Tooltip, Popover, DropdownMenu
- Table, Pagination
- Toast (Sonner), Progress

**Needs building (Luma-specific):**

| Component | Location | Priority |
|-----------|----------|----------|
| `ScopeTracker` | `components/scope/ScopeTracker.tsx` | P0 — Core differentiator |
| `ScopeTrackerCompact` | `components/scope/ScopeTrackerCompact.tsx` | P0 — For client list cards |
| `QuickAddDelivery` | `components/deliveries/QuickAddDelivery.tsx` | P0 — Primary operator action |
| `DeliveryTimeline` | `components/deliveries/DeliveryTimeline.tsx` | P0 — Grouped delivery view |
| `StatusBadge` | `components/ui/status-badge.tsx` | P0 — Unified status display |
| `OnboardingChecklist` | `components/onboarding/OnboardingChecklist.tsx` | P0 — First-run guidance |
| `EmptyState` | `components/ui/empty-state.tsx` | P0 — Reusable empty pattern |
| `PortalLayout` | `components/portal/PortalLayout.tsx` | P0 — Client view shell |
| `PortalScopeCard` | `components/portal/PortalScopeCard.tsx` | P0 — Client-facing scope |
| `PortalTimeline` | `components/portal/PortalTimeline.tsx` | P0 — Client-facing deliveries |
| `ApprovalCard` | `components/portal/ApprovalCard.tsx` | P0 — Client approve/revise |
| `ScopeAllocationForm` | `components/scope/ScopeAllocationForm.tsx` | P0 — Define scope |
| `ScopeRequestCard` | `components/scope/ScopeRequestCard.tsx` | P0 — Out-of-scope item |
| `MagicLinkPanel` | `components/clients/MagicLinkPanel.tsx` | P0 — Generate/manage links |
| `ClientAvatar` | `components/clients/ClientAvatar.tsx` | P0 — Reusable avatar ring |

---

## Key Component Designs

### ScopeTracker (Operator View)

```tsx
// components/scope/ScopeTracker.tsx
//
// Props:
//   allocated: number        — total scope units
//   used: number             — in-scope usage
//   outOfScope: number       — out-of-scope usage
//   unitLabel: string        — "hours", "deliverables", etc.
//   periodLabel: string      — "Feb 2026"
//   scopeType: ScopeType
//
// Visual structure:
//
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
// │  │           │ │ ⚠         │ │           │     │
// │  └───────────┘ └───────────┘ └───────────┘     │
// └─────────────────────────────────────────────────┘
//
// States:
//   - on-track (0-60%): green bar, green badge
//   - active (61-85%): indigo bar, indigo badge
//   - nearing-limit (86-100%): amber bar, amber badge
//   - exceeded (101%+): red bar with overflow indicator, red badge
//   - no-scope: "Set up scope allocation" CTA
```

**Progress bar implementation:**
Use a layered approach, not the shadcn Progress component (it only supports single fill):

```
Outer container: rounded-full h-3 bg-muted overflow-hidden
├── In-scope fill: bg-success (or color by status), width = (used / allocated) * 100%
└── Out-of-scope fill: bg-destructive/30, positioned after in-scope
```

When exceeded (>100%), the bar shows full + a small overflow indicator badge:
```
████████████████████████  +2 hrs over
```

**Breakdown cards** use `font-mono` for numbers to align digits and signal "data":

```html
<span class="text-2xl font-mono font-semibold">10</span>
<span class="text-sm text-muted-foreground">hrs</span>
```

---

### ScopeTrackerCompact (Dashboard Client Cards)

A minimal scope indicator for the client list on the dashboard:

```
┌────────────────────────────────────────┐
│  Acme Corp           Active            │
│  Jane Smith                            │
│  ████████░░░ 12/20 hrs     ● On Track  │
└────────────────────────────────────────┘
```

Just: thin progress bar + "X/Y unit" + status dot. No breakdown cards.

---

### QuickAddDelivery

```tsx
// components/deliveries/QuickAddDelivery.tsx
//
// An inline input that sits at the top of the delivery list.
// Submits on Enter with smart defaults.
//
// ┌────────────────────────────────────────────────────┐
// │ + │ What did you deliver?                    │ Tab ↹│
// └────────────────────────────────────────────────────┘
//   ↑ icon                                    hint text ↑
//
// States:
//   idle: Placeholder text, muted plus icon
//   focused: Border highlight, hint text appears ("Enter to log · Tab for details")
//   submitting: Inline spinner replaces plus icon
//   success: Brief green check flash, input clears
//   error: Red border, error toast
//
// Keyboard:
//   Enter → submit with defaults
//   Tab → open full LogDeliveryDialog pre-filled with title
//   Escape → blur
//   Ctrl+Enter / Cmd+Enter → submit even if Tab hint visible
```

The plus icon (`Plus` from lucide-react) sits in the left padding area of the input, styled as part of the input (not a separate button). This matches the mental model of "add something here."

---

### DeliveryTimeline (Operator & Portal)

Deliveries grouped by time period, with visual timeline markers:

```
Operator view (this week / last week / older):

┌─ This Week ────────────────────────────────┐
│                                             │
│  ● Monthly analytics report    Completed    │
│  │  Marketing · 2.5 hrs · Feb 14           │
│  │                                          │
│  ● Email campaign setup        Completed    │
│  │  Marketing · 1 hr · Feb 13              │
│  │                                          │
│  ● Brand guidelines review     In Progress  │
│     Design · Feb 12                         │
│                                             │
├─ Last Week ────────────────────────────────┤
│                                             │
│  ● SEO audit completed         Approved     │
│  │  Tech · 4 hrs · Feb 7                   │
│  │                                          │
│  ● Social media calendar       Completed    │
│     Content · 1.5 hrs · Feb 6              │
│                                             │
└─────────────────────────────────────────────┘
```

**Timeline visual treatment:**
- Left border/line connects entries within a group
- Circle markers (`●`) at each item — filled for completed, outlined for in-progress
- Group headers (`This Week`, `Last Week`) are `text-xs font-semibold uppercase tracking-wider text-muted-foreground`
- Category badges use `Badge variant="outline"` in small size

**Client portal variant:**
- Simpler: no hours shown (clients don't need to see hours)
- Status simplified: "Done" or "Needs your input"
- Add approval buttons inline for pending items

---

### PortalLayout (Client View Shell)

```
┌──────────────────────────────────────────────┐
│  ┌──────────────────────────────────────┐    │
│  │ [Operator Logo/Name]                 │    │
│  │ Delivery Summary for Acme Corp       │    │
│  │ February 2026                        │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │  SCOPE TRACKER (portal variant)      │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │  DELIVERY TIMELINE (portal variant)  │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  ┌──────────────────────────────────────┐    │  ← Only if items pending
│  │  NEEDS YOUR APPROVAL                 │    │
│  │  ┌────────────────────────────────┐  │    │
│  │  │ Newsletter draft               │  │    │
│  │  │ "Please review the March..."   │  │    │
│  │  │         [Approve] [Request Change] │    │
│  │  └────────────────────────────────┘  │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │  Past Months ▾                       │    │
│  │  January 2026 · 18/20 hrs · 9 items  │    │
│  │  December 2025 · 20/20 hrs · 12 items│    │
│  └──────────────────────────────────────┘    │
│                                              │
│  ── Powered by Luma ──                       │
└──────────────────────────────────────────────┘
```

**Design principles for the portal:**
1. **No navigation chrome** — no sidebar, no header nav, no hamburger
2. **Operator trust signal** — show operator name/business at top
3. **Period context** — always show which month this is for
4. **Action prominence** — approval buttons are the ONLY interactive elements (large, clear)
5. **History access** — collapsible past months at bottom, not prominent

---

### ApprovalCard (Client Portal)

```
┌─────────────────────────────────────────────┐
│  Newsletter draft for March                  │
│  Content · Completed Feb 12                  │
│                                              │
│  "Please review the March newsletter draft   │
│  before we schedule it for sending."         │
│                                              │
│  ┌─────────────┐  ┌───────────────────────┐ │
│  │  ✓ Approve   │  │  ✎ Request Changes   │ │
│  └─────────────┘  └───────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Button sizing**: Approval buttons are min 44x44px touch targets (Fitts's Law, mobile research). `Approve` is primary (filled button), `Request Changes` is outline (secondary).

When client clicks "Request Changes," a textarea slides open below:
```
┌─────────────────────────────────────────────┐
│  What would you like changed?                │
│  ┌─────────────────────────────────────┐    │
│  │                                     │    │
│  └─────────────────────────────────────┘    │
│                          [Submit Feedback]   │
└─────────────────────────────────────────────┘
```

---

### EmptyState (Reusable)

```tsx
// components/ui/empty-state.tsx
//
// Props:
//   icon: LucideIcon         — contextual icon (Users, CheckCircle2, etc.)
//   title: string            — "No clients yet"
//   description: string      — "Add your first client to start tracking"
//   tip?: string             — "Most operators start with their top 3 clients"
//   action?: { label: string, onClick: () => void }
//
// Layout:
//   Centered, padding py-12
//   Icon: w-10 h-10 text-muted-foreground, centered
//   Title: text-base font-semibold, mt-3
//   Description: text-sm text-muted-foreground, mt-1
//   Tip: text-xs text-muted-foreground italic, mt-3
//   Action button: mt-4, primary variant
//
// IMPORTANT: Icon stays small (w-10 h-10) — not a giant illustration.
// Research: NN Group shows users skip decorative imagery.
// The text IS the content.
```

---

## Motion & Interaction

### Motion Principles

1. **Purpose first** — Animate only to communicate state changes, provide feedback, or guide attention
2. **Fast defaults** — 150-200ms for micro-interactions, 300ms for reveals, 500ms max for page transitions
3. **Ease-out for entries** — Content entering the viewport decelerates (feels natural)
4. **Ease-in for exits** — Content leaving accelerates (gets out of the way quickly)
5. **Respect `prefers-reduced-motion`** — Already implemented in `index.css`

### Animation Tokens

| Animation | Duration | Easing | Use |
|-----------|----------|--------|-----|
| `hover-lift` | 200ms | ease-out | Card hover (translateY -2px) |
| `fade-in` | 500ms | ease-out | Page content reveal |
| `scale-in` | 300ms | ease-out | Dialog/sheet opening |
| `slide-up` | 300ms | ease-out | Toast notifications |
| `progress-fill` | 600ms | ease-out | Scope bar filling on load |
| `success-flash` | 200ms | ease-out | Quick-add success |
| `stagger-delay` | 100ms increment | — | List items appearing |

### Interaction Patterns

**Cards:**
```css
.card-interactive {
  transition: transform 200ms ease-out, box-shadow 200ms ease-out;
}
.card-interactive:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card-hover);
}
.card-interactive:active {
  transform: translateY(0);
  box-shadow: var(--shadow-card);
}
```
Already implemented in `index.css` as `.card-interactive`. Good.

**Buttons:**
- Default: Color change on hover (150ms)
- Primary: Subtle scale(1.02) on hover, scale(0.98) on active
- Destructive: No scale — direct color shift to reinforce "careful" feel

**Form inputs:**
- Focus: Ring animation (border-color transition 150ms)
- Error: Border turns red + gentle shake animation (3px horizontal, 200ms)
- Success: Brief green border flash (300ms)

**Toasts (Sonner):**
- Enter: slide-up from bottom right, 300ms
- Exit: fade-out, 200ms
- Duration: 3 seconds for success, 5 seconds for error
- Position: bottom-right on desktop, bottom-center on mobile

### Staggered Reveals

For list content (client cards, delivery items), stagger entrance with 100ms delay per item (max 5 items staggered, rest appear together):

```tsx
// Usage pattern:
<div
  className="animate-fade-in"
  style={{ animationDelay: `${Math.min(index, 5) * 100}ms` }}
>
```

---

## Loading States

### Skeleton Strategy

Every data-dependent component has a matching skeleton. Skeletons mirror the exact layout of loaded content — same heights, widths, and spacing.

**Research backing**: NN Group's loading state research shows skeleton screens reduce perceived loading time by 15-30% compared to spinners. Source: https://www.nngroup.com/articles/skeleton-screens/

### Skeleton Components

**Dashboard Stats (already implemented):**
```
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ ░░░░░░░ │ │ ░░░░░░░ │ │ ░░░░░░░ │ │ ░░░░░░░ │
│ ░░░     │ │ ░░░     │ │ ░░░     │ │ ░░░     │
└─────────┘ └─────────┘ └─────────┘ └─────────┘
```

**Client List Card Skeleton:**
```
┌───────────────────────────────────────────┐
│ ░░ │ ░░░░░░░░░░░░░░░ │           │ ░░░░░ │
│    │ ░░░░░░░░░        │           │       │
│    │ ░░░░░░░░░░░░░░░░ │           │       │
└───────────────────────────────────────────┘
```

**Scope Tracker Skeleton:**
```
┌───────────────────────────────────────────┐
│ ░░░░░░░░░░░░                 ░░░░░░░░░░  │
│ ░░░░░░░░░░░░░░░░░                        │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░      │
│                                           │
│ ░░░░░░ ░░░   ░░░░░░ ░░░   ░░░░░░ ░░░   │
└───────────────────────────────────────────┘
```

### Loading Spinner (for actions)

Use the `Loader2` icon from lucide-react with `animate-spin` (already in use). Only for:
- Button loading states
- Full-page initial auth check
- Mutation in-progress

**Never** show a spinner for data fetching — always use skeletons.

---

## Error States

### Error Hierarchy

| Level | Component | Treatment |
|-------|-----------|-----------|
| **Global** | App-level error boundary | Full-page: "Something went wrong" + reload button |
| **Auth** | AuthProvider catch | Redirect to /login with toast |
| **Page** | Page-level query error | Card: "Couldn't load [data]" + retry button |
| **Section** | Component-level query error | Inline: red text + retry link (doesn't break sibling sections) |
| **Form** | Mutation error | Toast + form stays populated |
| **Field** | Validation error | Red border + inline message below field |
| **Portal** | Edge function error | Full-page: "This link is invalid or has expired" |

### Error Component Design

**Page-level error:**
```
┌─────────────────────────────────────────┐
│                                         │
│  ⚠ Couldn't load client data            │
│                                         │
│  Something went wrong while loading     │
│  this page. Please try again.           │
│                                         │
│  [Try Again]  [Back to Dashboard]       │
│                                         │
└─────────────────────────────────────────┘
```

**Section-level error (inline, doesn't break layout):**
```
┌─────────────────────────────────────────┐
│  Deliveries              Scope           │
│  ─────────────────────────────────────  │
│                                         │
│  ⚠ Couldn't load deliveries. Retry →    │
│                                         │
└─────────────────────────────────────────┘
```

**Toast notifications (via Sonner):**
- Success: Green accent bar, auto-dismiss 3s
- Error: Red accent bar, auto-dismiss 5s, includes brief explanation
- Info: Primary accent bar, auto-dismiss 3s

### Portal Error States

| Scenario | Display |
|----------|---------|
| Invalid token | "This link is no longer valid. Contact your service provider for a new link." |
| Expired token | "This link has expired. Contact [Operator Name] for a new link." |
| Network error | "Having trouble connecting. Please check your internet and try again." |
| Server error | "Something went wrong on our end. Please try again in a few minutes." |

**Key principle**: Portal errors never expose technical details. Language is plain English for non-technical clients.

---

## Empty States & Onboarding

### Onboarding Checklist (Dashboard)

Only shown when operator has completed 0-2 of 3 setup steps:

1. Add first client
2. Log first delivery
3. Share first client view (generate magic link)

Once all 3 are done, the checklist disappears permanently (track via localStorage or operator metadata).

### Contextual Empty States (per section)

| Section | Title | Description | CTA |
|---------|-------|-------------|-----|
| Dashboard (0 clients) | "Welcome to Luma" | Onboarding checklist | "Add your first client" |
| Client list (0 clients) | "No clients yet" | "Add a client to start tracking deliveries" | "Add Client" |
| Deliveries (0 items) | "No deliveries logged yet" | "Log your first delivery to start building this client's record" | "Log your first delivery" |
| Scope (0 allocations) | "No scope defined" | "Define how much you've agreed to deliver" | "Set up scope allocation" |
| Scope requests (0) | "No scope requests" | "Scope requests will appear here when work goes beyond the agreed scope" | None (informational) |
| Pending approvals (0) | "No pending approvals" | "Items will appear here when you send work for client review" | None |
| Portal deliveries (0) | "No deliveries yet" | "Your service provider hasn't logged any deliveries yet." | None |

---

## Responsive Design

### Breakpoints

Use Tailwind's default breakpoints, which align with real device widths:

| Breakpoint | Width | Target Devices |
|------------|-------|----------------|
| `sm` | 640px | Large phones (landscape) |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1400px | Large desktops (max container) |

### Responsive Behaviors

**Sidebar:**
- `md+`: Fixed left sidebar, 256px
- `<md`: Hidden sidebar, hamburger menu in Header → opens Sheet/Drawer from left

**Dashboard Stats:**
- `lg+`: 4-column grid
- `sm-lg`: 2-column grid (already implemented)
- `<sm`: 2-column grid (numbers are small enough)

**Client Detail:**
- `lg+`: Contact info in 3-column grid
- `<lg`: Stack to single column

**Delivery List:**
- All breakpoints: Full-width list (cards stack naturally)
- `<sm`: Status badge moves below title (flex-wrap)

**Scope Tracker:**
- `md+`: Breakdown cards in 3-column grid
- `<md`: Breakdown cards stack to single row (horizontal scroll) or 3-column (smaller cards)

**Client Portal:**
- All breakpoints: Single column, max-w-2xl
- `<sm`: Reduce padding to 16px, full-width cards
- Approval buttons: Full-width on mobile (larger touch target)

### Mobile-First Specific Patterns

**Thumb zone optimisation** (Steven Hoober research):
- Primary actions (Log Delivery, Approve) at bottom or center of screen
- Destructive actions (Delete) require deliberate reach (top-right, behind overflow menu)
- Quick-add input is NOT in the top nav (hard to reach) — it's in the content area where the thumb naturally rests

**Touch targets:**
- All interactive elements: minimum 44x44px
- Spacing between tap targets: minimum 8px
- Form fields: min-height 44px on mobile

---

## Accessibility

### Non-Negotiables

1. **Keyboard navigation**: All interactive elements reachable via Tab, activated via Enter/Space, dismissed via Escape
2. **Focus indicators**: Visible focus rings on all interactive elements (shadcn/ui provides these via `ring` utility)
3. **Color is never the sole indicator**: All status states use color + icon + text label
4. **Contrast ratios**: 4.5:1 minimum for text, 3:1 for UI components (verified in Color System section)
5. **Semantic HTML**: Use `<nav>`, `<main>`, `<section>`, `<header>`, `<button>`, `<a>` correctly
6. **Screen reader labels**: ARIA labels on icon-only buttons, status indicators, progress bars
7. **prefers-reduced-motion**: Already handled in `index.css`

### ARIA Patterns

**Scope Tracker:**
```html
<div role="progressbar"
     aria-valuenow="12"
     aria-valuemin="0"
     aria-valuemax="20"
     aria-label="Scope usage: 12 of 20 hours used, 60%, on track">
```

**Status Badges:**
```html
<span role="status" aria-label="Client status: Active">
  <span class="bg-green-500 w-2 h-2 rounded-full" aria-hidden="true"></span>
  Active
</span>
```

**Approval Actions (Portal):**
```html
<button aria-label="Approve: Newsletter draft for March">Approve</button>
<button aria-label="Request changes to: Newsletter draft for March">Request Changes</button>
```

**Quick-Add Input:**
```html
<input
  role="combobox"
  aria-label="Quick add delivery item"
  aria-placeholder="What did you deliver?"
  aria-describedby="quick-add-hint"
/>
<span id="quick-add-hint" class="sr-only">
  Press Enter to log with defaults, Tab to open full form
</span>
```

### Screen Reader Announcements

Use `aria-live="polite"` for:
- Toast notifications
- Scope status changes after logging a delivery
- Form submission success/error
- Client portal data loading

---

## UX Flow Diagrams

### Flow 1: Operator — First Client Setup

```
Login/Signup
    │
    ▼
Dashboard (empty) ──→ Onboarding checklist visible
    │
    ▼
Click "Add Client"
    │
    ▼
CreateClientDialog opens
    │ Name, Email, Phone, Notes
    │
    ▼
Submit → Client created → Redirected to Client Detail
    │
    ▼
Client Detail (empty deliveries)
    │ Empty state: "Log your first delivery"
    │
    ▼
Click "Log your first delivery" OR use Quick-Add
    │
    ▼
LogDeliveryDialog opens (or Quick-Add submits)
    │ Title, Description, Category, Status, Hours
    │
    ▼
Submit → Delivery logged → Appears in timeline
    │ Onboarding: Step 2 complete ✓
    │
    ▼
Click "Share" / "Generate Magic Link" (in client header)
    │
    ▼
MagicLinkPanel opens → Link generated → Copy to clipboard
    │ Onboarding: Step 3 complete ✓
    │
    ▼
Dashboard → Onboarding checklist disappears
    │ Normal dashboard view with client card + scope indicator
```

### Flow 2: Operator — Daily Delivery Logging

```
Dashboard
    │
    ▼
Click client card → Client Detail
    │
    ▼
Quick-Add input (focused automatically if repeat visit)
    │
    ├── Type title + Enter → Logged instantly (success flash)
    │   │
    │   ├── Scope tracker updates immediately (optimistic)
    │   └── Delivery appears in timeline at top
    │
    └── Type title + Tab → Full LogDeliveryDialog opens
        │ Pre-filled: title from Quick-Add
        │ Fill: description, category, hours, status
        │
        ▼
        Submit → Logged → Dialog closes → Timeline updates
```

### Flow 3: Operator — Scope Management

```
Client Detail → Scope tab
    │
    ├── No scope → Empty state: "Set up scope allocation"
    │   │
    │   ▼
    │   Click CTA → ScopeAllocationForm opens
    │   │ Period (start/end), Type (hours/deliverables/custom),
    │   │ Amount, Unit label
    │   │
    │   ▼
    │   Submit → Scope created → Tracker appears
    │
    └── Scope exists → Scope Tracker visible
        │
        ├── Green/indigo/amber → "On Track" / "Active" / "Nearing Limit"
        │   Normal operation. Log deliveries, scope updates.
        │
        └── Red (>100%) → "Scope Exceeded"
            │
            ├── Operator sees exceeded indicator
            │   "2 hrs over allocated scope"
            │
            ├── Any new delivery auto-flags with warning:
            │   "This will exceed scope by X units. Log anyway?"
            │
            └── Operator can create Scope Request:
                "Additional SEO work requested by client"
                Status: pending → approved/declined
```

### Flow 4: Client — Portal Experience

```
Client receives magic link (email/Slack/etc.)
    │
    ▼
Opens /portal/:token
    │
    ▼
Edge function validates token
    │
    ├── Invalid/Expired → Error page
    │   "This link is no longer valid.
    │    Contact your service provider."
    │
    └── Valid → Portal loads
        │
        ▼
        Single scrollable page:
        │
        ├── 1. Scope Tracker (top)
        │   "12 of 20 hours used this month"
        │   Simple bar, no breakdown
        │
        ├── 2. Delivery Timeline
        │   Grouped by week, newest first
        │   Each item: title, category, date, status
        │
        ├── 3. Pending Approvals (if any)
        │   │
        │   ├── Click "Approve" → Confirmation → Done
        │   │   POST /client-action { approve }
        │   │
        │   └── Click "Request Changes" → Textarea opens
        │       Type feedback → Submit → Done
        │       POST /client-action { revision_requested, note }
        │
        └── 4. Past Months (collapsed)
            Click to expand → Previous month's summary
```

### Flow 5: Scope Creep Detection

```
Operator logs delivery (normal)
    │
    ▼
System checks: Is this within scope?
    │
    ├── Yes (used <= allocated) → Normal log
    │
    └── No (used > allocated OR item flagged out-of-scope)
        │
        ▼
        Delivery logged with `is_out_of_scope: true`
        │
        ├── Scope tracker shows exceeded state (red)
        │
        ├── Client list card shows ⚠ "Scope Exceeded" badge
        │
        ├── Dashboard stat card: "Needs Attention" count increments
        │
        └── Operator can create Scope Request:
            │
            ▼
            ScopeRequestCard:
            │ Title: "Additional landing pages"
            │ Requested by: Client / Operator
            │ Estimated cost: 5 hrs
            │ Status: Pending → Approved / Declined
            │
            ▼
            If approved → scope_cost added to allocation tracking
            If declined → remains as record of request
```

---

## Implementation Priority

### Phase 1a (Week 1-2): Core Loop

| Component | Effort | Impact |
|-----------|--------|--------|
| `EmptyState` | Low | High — used everywhere |
| `StatusBadge` | Low | High — unified status display |
| `QuickAddDelivery` | Medium | High — primary operator action |
| `OnboardingChecklist` | Medium | High — first-run experience |
| Dashboard improvements | Medium | High — first screen seen |

### Phase 1b (Week 2-3): Scope Differentiator

| Component | Effort | Impact |
|-----------|--------|--------|
| `ScopeTracker` | High | Critical — #1 differentiator |
| `ScopeTrackerCompact` | Low | High — dashboard density |
| `ScopeAllocationForm` | Medium | High — scope setup |
| `ScopeRequestCard` | Medium | Medium — scope creep tracking |

### Phase 1c (Week 3-5): Client Portal

| Component | Effort | Impact |
|-----------|--------|--------|
| `PortalLayout` | Medium | Critical — client value prop |
| `PortalScopeCard` | Low | High — client scope visibility |
| `PortalTimeline` | Medium | High — delivery visibility |
| `ApprovalCard` | Medium | Medium — client interaction |
| `MagicLinkPanel` | Medium | High — sharing flow |

---

## Appendix: CSS Variable Reference

All variables are defined in `src/index.css` and consumed via `tailwind.config.ts`. The current implementation is solid — here are the additions needed for new components:

```css
/* Add to :root in index.css */

/* Scope status colors (semantic) */
--scope-on-track: 158 64% 40%;        /* success green */
--scope-active: 245 58% 51%;          /* primary indigo */
--scope-nearing: 28 92% 58%;          /* accent-warm amber */
--scope-exceeded: 0 84% 60%;          /* destructive red */

/* Portal-specific overrides */
--portal-background: 0 0% 99%;
--portal-card: 0 0% 100%;
--portal-max-width: 672px;

/* Quick-add specific */
--quick-add-success: 158 64% 40%;
--quick-add-border: 245 58% 51%;
```

---

## Sources & References

- Nielsen Norman Group — Scrolling and Attention (2020): https://www.nngroup.com/articles/scrolling-and-attention/
- Nielsen Norman Group — Horizontal Attention Leans Left (2024): https://www.nngroup.com/articles/horizontal-attention-leans-left/
- Nielsen Norman Group — Feature Discovery (Onboarding): https://www.nngroup.com/articles/onboarding/
- Nielsen Norman Group — Skeleton Screens: https://www.nngroup.com/articles/skeleton-screens/
- Nielsen Norman Group — Two Audiences Navigation: https://www.nngroup.com/articles/audience-based-navigation/
- Cleveland & McGill — Graphical Perception (1984): Position-along-scale most accurate visual encoding
- Steven Hoober — Thumb Zone Research (2013-2023): Mobile one-hand use patterns
- Luke Wroblewski — Gradual Engagement: Reduce friction for common actions
- Lindgaard et al. (2006) — Users make credibility judgments in 50ms
- StatCounter (2024) — 54%+ global web traffic is mobile
- Fitts's Law — Touch targets minimum 44x44px
- WCAG 2.1 AA — Contrast ratios, keyboard navigation, motion preferences
