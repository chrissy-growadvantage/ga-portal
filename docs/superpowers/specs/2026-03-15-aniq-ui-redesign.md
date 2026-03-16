# Luma UI Redesign — Aniq-Inspired Design System

**Date:** 2026-03-15
**Status:** Approved for implementation
**Reference:** `redesign-mockup.html` (in project root)
**Accent colors:** `#E8667A` (coral pink) · `#FDF2F4` (blush)

---

## Overview

Full visual redesign of Luma — operator app, client portal, and login page — based on the Aniq UI template. The redesign is purely aesthetic: no functionality, routing, or data model changes. All Tailwind/shadcn primitives are preserved; only CSS variable values and component markup/classes change.

---

## Design Tokens (`src/index.css`)

### Core palette changes

| Token | Current HSL | New HSL | Hex |
|-------|-------------|---------|-----|
| `--background` | `210 20% 98%` | `220 14% 96%` | `#F5F6F7` |
| `--primary` | `340 82% 49%` | `350 76% 62%` | `#E8667A` |
| `--primary-glow` | `340 82% 92%` | `350 76% 97%` | `#FDF2F4` |
| `--radius` | `0.75rem` | `0.5rem` | — |
| `--sidebar-background` | `0 0% 98%` | `0 0% 100%` | `#FFFFFF` |
| `--sidebar-accent` | `240 4.8% 95.9%` | `350 76% 97%` | `#FDF2F4` |
| `--sidebar-primary` | `340 82% 49%` | `350 76% 62%` | `#E8667A` |
| `--muted` | `220 14% 96%` | `220 14% 96%` | keep |
| `--muted-foreground` | `220 9% 36%` | `220 9% 42%` | `#6B7280` |

Keep: success, warning, destructive, scope status colors — unchanged.

### Login-specific (add new tokens)
```css
--login-bg: 240 5% 96%;           /* #F4F4F5 */
--login-grid: 220 13% 83%;        /* #D1D5DB — grid line color */
```

---

## Layout Shell

### `src/components/layout/AppShell.tsx`
- Outer container: `flex flex-col h-screen overflow-hidden`
- Body: `flex flex-1 overflow-hidden`
- Background: `bg-background` (uses updated token)

### `src/components/layout/Header.tsx`
- Height: `h-14` (56px)
- Background: `bg-white border-b border-border`
- Left: hamburger toggle (3-line icon) + Luma wordmark logo
- Center: search input (flex-1, max-w-sm) with `⌘K` badge hint
- Right: notification bell (with dot indicator) + user avatar button
- Remove any heavy gradients or colored backgrounds currently present

### `src/components/layout/Sidebar.tsx`
- Width: `w-[220px]` fixed, `bg-white border-r border-border`
- Nav structure: grouped sections with uppercase tiny labels (`text-[10px] font-semibold tracking-widest text-muted-foreground/60`)
- Each nav item: icon (15px) + label, `text-[13.5px] font-medium`
- Active state: `bg-primary-glow text-primary border-l-2 border-primary` (left accent line)
- Inactive hover: `hover:bg-muted hover:text-foreground`
- Badge on nav item (count): `bg-primary-glow text-primary text-[10px] font-bold px-1.5 rounded-full`
- Bottom footer: user avatar + name + role (pinned to bottom)
- Sections: MAIN (Dashboard, Clients, Proposals, Deliveries, Revenue) · OPERATIONS (Approvals, Timesheets, Invoices, Snapshots) · WORKSPACE (Settings)

---

## Login Page (`src/pages/Login.tsx`)

### Background
```css
background-color: #F4F4F5;
background-image:
  linear-gradient(#D1D5DB 1px, transparent 1px),
  linear-gradient(90deg, #D1D5DB 1px, transparent 1px);
background-size: 44px 44px;
```
Grid masked with radial fade (center visible, edges dissolve):
```css
/* grid layer */
mask-image: radial-gradient(ellipse 60% 55% at 50% 50%, black 0%, transparent 100%);
opacity: 0.55;
```

### Card
- Centered white card, `w-[400px]`, `rounded-xl border border-border shadow-card p-10`
- Luma icon (logo mark) in `bg-primary-glow rounded-xl` container at top
- Title: "Welcome Back" · Subtitle: "Sign in to your Luma workspace"
- Inputs: email + password with left icon, `rounded-md border-border`, focus ring uses `ring-primary`
- Sign In button: `bg-foreground text-white w-full rounded-md` (dark button, NOT accent — matches Aniq)
- Remove Google/Apple OAuth buttons (Luma uses magic link)

---

## Shared UI Components

### Stat Cards (new pattern — not a shadcn component)
Create `src/components/ui/stat-card.tsx`:
```tsx
// Props: icon, label, value, trend (optional: { direction: 'up'|'down'|'neutral', label: string })
// Layout: icon+label row at top, large value, small trend below
// Style: bg-white border border-border rounded-lg p-4
```

### Status Badges (`src/components/ui/status-badge.tsx`)
- Pill shape: `rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold`
- Optional leading dot: `w-1.5 h-1.5 rounded-full`
- Variants: success, warning, danger, info, neutral, accent

### Tables
Standard pattern for list pages:
- `<thead>`: `text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground border-b`
- `<tbody tr>`: `hover:bg-muted/40 transition-colors`, `border-b border-border/50 last:border-0`
- Action column: View button (`border border-border rounded-md text-xs`) + kebab menu icon

### Breadcrumbs
Add `src/components/ui/breadcrumb.tsx` (if not exists):
- `text-[12.5px] text-muted-foreground`, separator `›`, current page slightly darker

---

## Page-Level Changes

### `src/pages/Dashboard.tsx`
- Top: 4-column stat card row (Active Clients, Deliveries Done, Scope Alerts, MRR)
- Below: 2-column grid — left: scope alerts list + recent deliveries table · right: pending approvals + revenue breakdown
- Page header: title + subtitle + date picker / export button

### `src/pages/ClientList.tsx`
- Stat row (4 cards) above filter bar
- Filter bar: white card, 4-column filter grid, Filter + Reset buttons
- Table: client avatar + name/domain, scope progress bar inline in cell, retainer value, last active

### `src/pages/ClientDetail.tsx`
- Page header: large avatar + name + badges, action buttons top-right
- Tabs: Overview · Deliveries · Scope Requests · Notes · Settings
- Overview: 3-column summary cards row + 2-column grid below (onboarding checklist + activity timeline)

### `src/pages/Portal.tsx` (client-facing)
- Header: Luma logo + client name, accent "Request Something" button
- Content max-w-[860px] centered, bg slightly off-white `#FAFAFA`
- Hero welcome card, 3-col stats, pending approvals section, recent deliveries table

### `src/pages/Login.tsx`
- As described above

---

## Implementation Order (for parallel execution)

| Track | Files | Notes |
|-------|-------|-------|
| **A — Tokens** | `src/index.css`, `tailwind.config.ts` | Must land first; unblocks all other tracks |
| **B — Shell** | `AppShell.tsx`, `Sidebar.tsx`, `Header.tsx` | Depends on Track A |
| **C — Login** | `src/pages/Login.tsx` | Depends on Track A |
| **D — Shared UI** | `stat-card.tsx`, `status-badge.tsx`, breadcrumb | Depends on Track A |
| **E — Pages** | `Dashboard.tsx`, `ClientList.tsx`, `ClientDetail.tsx` | Depends on B + D |
| **F — Portal** | `Portal.tsx`, portal components | Depends on B + D |

Tracks B, C, D can run in parallel once Track A is merged. Tracks E and F can run in parallel once B and D are done.

---

## Constraints

- No functionality changes — data fetching hooks, routing, Supabase queries: untouched
- Keep all existing shadcn/ui component APIs — only update CSS variables and class names
- TypeScript strict mode: no `any`, no type assertions
- No new dependencies
- Plus Jakarta Sans and JetBrains Mono fonts: keep as-is
