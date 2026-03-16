# Aniq UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Visually redesign Luma's operator app, portal, and login to match the Aniq UI reference (clean white sidebar, flat stat cards, neutral background) using `#E8667A` / `#FDF2F4` as accent colors.

**Architecture:** Update CSS design tokens first (unblocks all other work), then restructure the layout shell from fixed-sidebar to flex-row, add a desktop header, restyle individual pages. No data, routing, or API changes.

**Tech Stack:** React 18, TypeScript (strict), Tailwind CSS v3, shadcn/ui, Plus Jakarta Sans

**Reference:** `redesign-mockup.html` (project root) — open in browser to see the target for every screen.

**Spec:** `docs/superpowers/specs/2026-03-15-aniq-ui-redesign.md`

---

## Chunk 1: Foundation

### Task 1: CSS Design Tokens

**Files:**
- Modify: `src/index.css`

This task changes the CSS variable values that every other component inherits. It must land before any other task.

- [ ] **Step 1: Update light mode tokens in `src/index.css`**

Replace the `:root` block values (lines 8–80) with:

```css
@layer base {
  :root {
    --background: 220 14% 96%;           /* #F5F6F7 neutral app bg */
    --foreground: 221 39% 11%;           /* #111827 near-black */

    --card: 0 0% 100%;
    --card-foreground: 221 39% 11%;

    --popover: 0 0% 100%;
    --popover-foreground: 221 39% 11%;

    --primary: 350 76% 62%;              /* #E8667A coral pink */
    --primary-foreground: 0 0% 100%;
    --primary-glow: 350 76% 97%;         /* #FDF2F4 blush tint */

    --accent-warm: 28 92% 58%;           /* amber — kept for semantic use */
    --accent-warm-foreground: 0 0% 100%;

    --secondary: 220 14% 96%;
    --secondary-foreground: 221 39% 11%;

    --muted: 220 14% 96%;
    --muted-foreground: 220 9% 42%;      /* #6B7280 */

    --accent: 220 14% 96%;
    --accent-foreground: 221 39% 11%;
    --accent-light: 220 14% 98%;

    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;

    --success: 158 64% 40%;
    --success-foreground: 0 0% 100%;

    --border: 220 13% 91%;               /* #E5E7EB */
    --input: 220 13% 91%;
    --ring: 350 76% 62%;                 /* #E8667A */

    --radius: 0.5rem;                    /* tighter radius — matches Aniq */

    --sidebar-background: 0 0% 100%;     /* pure white sidebar */
    --sidebar-foreground: 220 9% 42%;
    --sidebar-primary: 350 76% 62%;      /* #E8667A */
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 350 76% 97%;       /* #FDF2F4 active bg */
    --sidebar-accent-foreground: 350 76% 62%;
    --sidebar-border: 220 13% 91%;
    --sidebar-ring: 350 76% 62%;

    --shadow-card: 0 1px 2px hsl(0 0% 0% / 0.06), 0 1px 3px hsl(0 0% 0% / 0.04);
    --shadow-card-hover: 0 4px 6px -1px hsl(0 0% 0% / 0.07), 0 2px 4px -1px hsl(0 0% 0% / 0.04);

    /* Scope status colors (semantic) — unchanged */
    --scope-on-track: 158 64% 40%;
    --scope-active: 350 76% 62%;
    --scope-nearing: 28 92% 58%;
    --scope-exceeded: 0 84% 60%;

    /* Semantic status colors — unchanged */
    --status-success: 158 64% 40%;
    --status-warning: 28 92% 58%;
    --status-danger: 0 84% 60%;
    --status-info: 226 70% 55%;
    --status-neutral: 220 9% 46%;

    /* Portal */
    --portal-background: 220 14% 98%;
    --portal-card: 0 0% 100%;
    --portal-max-width: 672px;

    /* Login */
    --login-bg: 240 5% 96%;
    --login-grid: 220 13% 83%;

    /* Quick-add */
    --quick-add-success: 158 64% 40%;
    --quick-add-border: 350 76% 62%;
  }
```

Keep the `.dark` block unchanged.

- [ ] **Step 2: Verify build still compiles**

```bash
cd /Users/mervindecastro/Documents/Projects/apps/luma
npm run build 2>&1 | tail -20
```
Expected: no errors. Warnings about unused variables are OK.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat: update CSS design tokens to Aniq-inspired palette (#E8667A accent)"
```

---

### Task 2: AppShell + Sidebar Restructure

**Files:**
- Modify: `src/components/layout/AppShell.tsx`
- Modify: `src/components/layout/Sidebar.tsx`

The current layout uses a `md:fixed` sidebar with `md:pl-64` offset on main. We replace it with a flex-row layout so sidebar and content sit side by side naturally. The sidebar gets grouped nav sections with uppercase labels and a left-border active indicator.

- [ ] **Step 1: Rewrite `AppShell.tsx`**

```tsx
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { DesktopHeader } from './DesktopHeader';
import { TimerWidget, StartTimerDialog, StopTimerDialog } from '@/components/time-tracking';

export function AppShell() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Mobile header — only shown on small screens */}
      <div className="md:hidden no-print">
        <Header />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — hidden on mobile */}
        <div className="hidden md:flex no-print">
          <Sidebar />
        </div>

        {/* Main content column */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Desktop header */}
          <div className="hidden md:block no-print">
            <DesktopHeader />
          </div>

          <main className="flex-1 overflow-y-auto">
            <div className="px-6 py-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <TimerWidget />
      <StartTimerDialog />
      <StopTimerDialog />
    </div>
  );
}
```

- [ ] **Step 2: Rewrite `Sidebar.tsx`**

```tsx
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, DollarSign, Clock,
  Settings, LogOut, Zap, Receipt, ClipboardCheck, CalendarDays,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const mainNav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/proposals', icon: FileText, label: 'Proposals' },
  { to: '/revenue', icon: DollarSign, label: 'Revenue' },
];

const opsNav = [
  { to: '/approvals', icon: ClipboardCheck, label: 'Approvals' },
  { to: '/timesheet', icon: Clock, label: 'Timesheet' },
  { to: '/invoices', icon: Receipt, label: 'Invoices' },
  { to: '/snapshots', icon: BarChart3, label: 'Snapshots' },
];

const workspaceNav = [
  { to: '/settings', icon: Settings, label: 'Settings' },
];

type NavItemProps = {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
};

function NavItem({ to, icon: Icon, label, badge }: NavItemProps) {
  const location = useLocation();
  const isActive = to === '/'
    ? location.pathname === '/'
    : location.pathname.startsWith(to);

  return (
    <NavLink
      to={to}
      className={cn(
        'flex items-center gap-2.5 px-4 py-[7px] text-[13.5px] font-medium transition-colors border-l-2',
        isActive
          ? 'bg-sidebar-accent text-sidebar-primary border-l-sidebar-primary font-semibold'
          : 'text-muted-foreground border-l-transparent hover:bg-muted hover:text-foreground'
      )}
    >
      <Icon className={cn('w-[15px] h-[15px] shrink-0', isActive ? 'opacity-100' : 'opacity-70')} />
      <span className="flex-1">{label}</span>
      {badge != null && (
        <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
          {badge}
        </span>
      )}
    </NavLink>
  );
}

function NavSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <p className="px-4 pt-3 pb-1 text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/60">
        {label}
      </p>
      {children}
    </div>
  );
}

export function Sidebar() {
  const { signOut, user } = useAuth();

  return (
    <aside className="w-[220px] flex flex-col bg-sidebar border-r border-sidebar-border h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-14 border-b border-sidebar-border shrink-0">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-primary-foreground shrink-0">
          <Zap className="w-3.5 h-3.5" />
        </div>
        <span className="font-bold text-base tracking-tight">Luma</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        <NavSection label="Main">
          {mainNav.map((item) => <NavItem key={item.to} {...item} />)}
        </NavSection>

        <div className="mx-4 my-1.5 h-px bg-border/60" />

        <NavSection label="Operations">
          {opsNav.map((item) => <NavItem key={item.to} {...item} />)}
        </NavSection>

        <div className="mx-4 my-1.5 h-px bg-border/60" />

        <NavSection label="Workspace">
          {workspaceNav.map((item) => <NavItem key={item.to} {...item} />)}
        </NavSection>
      </nav>

      {/* Footer */}
      <div className="shrink-0 px-3 py-3 border-t border-sidebar-border">
        {user && (
          <div className="flex items-center gap-2.5 px-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
              {user.email?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-semibold text-foreground truncate leading-tight">
                {user.email?.split('@')[0]}
              </p>
              <p className="text-[11px] text-muted-foreground truncate leading-tight">Admin</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2.5 text-muted-foreground hover:text-foreground text-[13px]"
          onClick={() => signOut()}
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}

// Keep backward-compat export so Header.tsx import doesn't break
export const navItems = [...mainNav, ...opsNav, ...workspaceNav];
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -30
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/AppShell.tsx src/components/layout/Sidebar.tsx
git commit -m "feat: restructure layout shell — flex-row sidebar, grouped nav sections"
```

---

### Task 3: Desktop Header (new component)

**Files:**
- Create: `src/components/layout/DesktopHeader.tsx`
- Modify: `src/components/layout/Header.tsx` (mobile — minor cleanup only)

The desktop currently has no header bar. We add one with a search input and user avatar.

- [ ] **Step 1: Create `src/components/layout/DesktopHeader.tsx`**

```tsx
import { Search, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export function DesktopHeader() {
  const { user } = useAuth();
  const initials = user?.email?.[0]?.toUpperCase() ?? 'U';

  return (
    <header className="h-14 flex items-center gap-3 px-5 bg-card border-b border-border shrink-0">
      {/* Search */}
      <div className="flex items-center gap-2 flex-1 max-w-sm h-[34px] bg-background border border-border rounded-md px-3 text-muted-foreground cursor-text">
        <Search className="w-3.5 h-3.5 shrink-0" />
        <span className="text-[13px] flex-1 select-none">Search clients, deliveries…</span>
        <kbd className="text-[10px] bg-card border border-border rounded px-1.5 py-0.5 font-mono leading-none">
          ⌘K
        </kbd>
      </div>

      {/* Actions */}
      <div className="ml-auto flex items-center gap-2">
        {/* Notification bell */}
        <button
          className={cn(
            'relative w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground',
            'hover:bg-muted hover:text-foreground transition-colors'
          )}
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary border-[1.5px] border-card" />
        </button>

        {/* Avatar */}
        <button
          className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary hover:bg-primary/20 transition-colors"
          aria-label="User menu"
        >
          {initials}
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/DesktopHeader.tsx
git commit -m "feat: add desktop header with search bar and notification bell"
```

---

### Task 4: Login Page

**Files:**
- Modify: `src/pages/Login.tsx`

Adds the grid background with radial fade. All auth logic (signIn, signUp, useState) stays untouched.

- [ ] **Step 1: Replace the outer wrapper and logo section in `Login.tsx`**

Replace the `return` statement entirely with:

```tsx
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
         style={{ backgroundColor: 'hsl(var(--login-bg))' }}>

      {/* Grid background with radial fade */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--login-grid)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--login-grid)) 1px, transparent 1px)
          `,
          backgroundSize: '44px 44px',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 55% at 50% 50%, black 0%, transparent 100%)',
          maskImage: 'radial-gradient(ellipse 60% 55% at 50% 50%, black 0%, transparent 100%)',
          opacity: 0.55,
        }}
      />

      {/* Top-left logo */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-4 z-10">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-primary-foreground">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-base tracking-tight">Luma</span>
        </div>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-[400px] px-4">
        <Card className="shadow-card border-border">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 mx-auto mb-3">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-xl">
              {isSignUp ? 'Create an account' : 'Welcome Back'}
            </CardTitle>
            <CardDescription>
              {isSignUp
                ? 'Start tracking delivery for your clients'
                : 'Sign in to your Luma workspace'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Smith"
                    required={isSignUp}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-foreground text-background hover:bg-foreground/90"
                disabled={submitting}
              >
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isSignUp ? 'Create account' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isSignUp
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="absolute bottom-5 text-[12px] text-muted-foreground z-10">
        © 2026 Luma. All rights reserved.
      </p>
    </div>
  );
```

Keep the loading spinner and `if (user) return <Navigate>` guards above the return — do not touch them.

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/Login.tsx
git commit -m "feat: redesign login page — grid background with radial fade, dark sign-in button"
```

---

## Chunk 2: Shared UI + Pages

### Task 5: StatCard UI Component

**Files:**
- Create: `src/components/ui/stat-card.tsx`

A reusable stat card matching the Aniq pattern: icon + label row, large value, optional trend line.

- [ ] **Step 1: Create `src/components/ui/stat-card.tsx`**

```tsx
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type TrendDirection = 'up' | 'down' | 'neutral';

type StatCardProps = {
  icon: LucideIcon;
  iconClassName?: string;
  label: string;
  value: string | number;
  trend?: {
    direction: TrendDirection;
    label: string;
  };
  className?: string;
};

const trendConfig: Record<TrendDirection, { icon: LucideIcon; className: string }> = {
  up:      { icon: TrendingUp,   className: 'text-success' },
  down:    { icon: TrendingDown, className: 'text-destructive' },
  neutral: { icon: Minus,        className: 'text-muted-foreground' },
};

export function StatCard({ icon: Icon, iconClassName, label, value, trend, className }: StatCardProps) {
  const trendCfg = trend ? trendConfig[trend.direction] : null;
  const TrendIcon = trendCfg?.icon;

  return (
    <div className={cn('bg-card border border-border rounded-lg p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-7 h-7 rounded-md flex items-center justify-center',
            iconClassName ?? 'bg-primary/10 text-primary'
          )}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="text-[12.5px] font-medium text-muted-foreground">{label}</span>
        </div>
        <button className="text-muted-foreground/50 hover:text-muted-foreground text-base leading-none">
          ···
        </button>
      </div>

      <p className="text-[26px] font-bold tracking-tight leading-none mb-1.5">{value}</p>

      {trend && TrendIcon && (
        <p className={cn('text-xs flex items-center gap-1', trendCfg?.className)}>
          <TrendIcon className="w-3 h-3" />
          {trend.label}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/stat-card.tsx
git commit -m "feat: add StatCard UI component for Aniq-style metric cards"
```

---

### Task 6: Dashboard Page

**Files:**
- Modify: `src/pages/Dashboard.tsx`

Replace the existing layout with a 4-col stat row at top, then a 2-col grid (left: scope alerts + recent deliveries, right: pending approvals + revenue summary). Data hooks are unchanged — only layout and presentation change.

- [ ] **Step 1: Read current file**

```bash
cat src/pages/Dashboard.tsx
```

Note what hooks are used (useScopeAlerts, useDeliveries, useAllPendingApprovals, etc.) and what data shapes they return — preserve all of them.

- [ ] **Step 2: Update page header pattern**

The page should start with:
```tsx
<div className="space-y-6">
  {/* Page header */}
  <div className="flex items-start justify-between">
    <div>
      <h1 className="text-[22px] font-bold tracking-tight">Overview</h1>
      <p className="text-sm text-muted-foreground mt-0.5">Monitor your client work and revenue</p>
    </div>
    <div className="flex gap-2">
      <Button variant="outline" size="sm" className="gap-1.5 text-xs">
        <CalendarDays className="w-3.5 h-3.5" /> This Month
      </Button>
    </div>
  </div>

  {/* Stat row */}
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
    <StatCard icon={Users} label="Active Clients" value={activeClients} trend={{ direction: 'up', label: '+2 this month' }} />
    <StatCard icon={CheckCircle2} label="Deliveries Done" value={deliveriesDone}
      iconClassName="bg-success/10 text-success"
      trend={{ direction: 'up', label: '+12% vs last month' }} />
    <StatCard icon={AlertTriangle} label="Scope Alerts" value={alertCount}
      iconClassName="bg-warning/10 text-warning"
      trend={{ direction: alertCount > 0 ? 'down' : 'neutral', label: alertCount > 0 ? 'Needs attention' : 'All clear' }} />
    <StatCard icon={DollarSign} label="MRR" value={`$${mrr}`}
      iconClassName="bg-info/10 text-info"
      trend={{ direction: 'up', label: '+8.3% growth' }} />
  </div>

  {/* Two-col content */}
  <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
    {/* Left column — scope alerts + recent deliveries */}
    ...

    {/* Right column — pending approvals + revenue */}
    ...
  </div>
</div>
```

Wire the actual values from the existing hooks. Keep all `useQuery` calls as-is — only change what's rendered.

- [ ] **Step 3: Ensure page header uses breadcrumb pattern**

Breadcrumbs are not required on Dashboard (it's the root page). Skip breadcrumbs here.

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat: redesign Dashboard — stat cards, two-col layout, Aniq-style sections"
```

---

### Task 7: ClientList Page

**Files:**
- Modify: `src/pages/ClientList.tsx`

Replace layout with stat row + filter card + clean table. No data changes.

- [ ] **Step 1: Read current file**

```bash
cat src/pages/ClientList.tsx
```

Note hooks and data shapes.

- [ ] **Step 2: Add page header + breadcrumb**

```tsx
{/* Breadcrumb */}
<nav className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground mb-1">
  <span>Home</span>
  <span className="text-muted-foreground/50">›</span>
  <span className="font-medium text-foreground">Clients</span>
</nav>

{/* Page header */}
<div className="flex items-start justify-between mb-5">
  <div>
    <h1 className="text-[22px] font-bold tracking-tight">All Clients</h1>
    <p className="text-sm text-muted-foreground mt-0.5">Manage your client accounts and delivery work</p>
  </div>
  <Button size="sm" className="gap-1.5">
    <Plus className="w-3.5 h-3.5" /> Add Client
  </Button>
</div>
```

- [ ] **Step 3: Add 4-col stat row**

```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
  <StatCard icon={Users} label="Total Clients" value={clients.length}
    trend={{ direction: 'up', label: '+2 this month' }} />
  <StatCard icon={CheckCircle2} label="Active" value={activeCount}
    iconClassName="bg-success/10 text-success"
    trend={{ direction: 'neutral', label: 'Stable' }} />
  <StatCard icon={AlertTriangle} label="Scope Alerts" value={alertCount}
    iconClassName="bg-warning/10 text-warning"
    trend={{ direction: 'down', label: 'Needs attention' }} />
  <StatCard icon={DollarSign} label="Monthly Retainer" value={`$${totalMrr}`}
    iconClassName="bg-info/10 text-info"
    trend={{ direction: 'up', label: '+8.3%' }} />
</div>
```

- [ ] **Step 4: Wrap filters in a white card**

```tsx
<div className="bg-card border border-border rounded-lg p-4 mb-4">
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
    {/* existing filter inputs — keep as-is */}
  </div>
  <div className="flex justify-end gap-2">
    <Button variant="outline" size="sm">Reset</Button>
    <Button size="sm" className="gap-1.5"><Search className="w-3.5 h-3.5" /> Filter</Button>
  </div>
</div>
```

- [ ] **Step 5: Update table**

Wrap table in `<div className="bg-card border border-border rounded-lg overflow-hidden">`.

Update `<thead>` styles:
```tsx
<th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground border-b border-border whitespace-nowrap">
```

Update `<tbody tr>` styles:
```tsx
<tr className="hover:bg-muted/40 transition-colors border-b border-border/50 last:border-0">
```

For the scope column — render an inline progress bar:
```tsx
<td>
  <p className={cn('text-[13px] font-semibold mb-1',
    pct >= 100 ? 'text-destructive' : pct >= 90 ? 'text-warning' : 'text-foreground'
  )}>{pct}%</p>
  <div className="w-20 h-1.5 bg-border rounded-full overflow-hidden">
    <div className={cn('h-full rounded-full transition-all',
      pct >= 100 ? 'bg-destructive' : pct >= 90 ? 'bg-warning' : 'bg-primary'
    )} style={{ width: `${Math.min(pct, 100)}%` }} />
  </div>
</td>
```

Action column:
```tsx
<td>
  <div className="flex items-center gap-1">
    <Button variant="outline" size="sm" className="h-7 text-xs gap-1 px-2.5">
      <Eye className="w-3 h-3" /> View
    </Button>
    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
      <MoreHorizontal className="w-4 h-4" />
    </Button>
  </div>
</td>
```

- [ ] **Step 6: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 7: Commit**

```bash
git add src/pages/ClientList.tsx
git commit -m "feat: redesign ClientList — stat cards, filter card, clean table with inline scope bars"
```

---

### Task 8: Portal Pages

**Files:**
- Modify: `src/pages/Portal.tsx`
- Modify: `src/components/portal/PortalLayout.tsx`

- [ ] **Step 1: Update `PortalLayout.tsx` header**

The portal header should be:
```tsx
<header className="bg-card border-b border-border">
  <div className="max-w-[860px] mx-auto px-6 h-14 flex items-center justify-between">
    {/* Logo + client name */}
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
          <Zap className="w-3 h-3 text-primary-foreground" />
        </div>
        <span className="font-bold text-sm tracking-tight">Luma</span>
      </div>
      <div className="w-px h-4 bg-border" />
      <span className="text-[13.5px] text-muted-foreground">{clientName}</span>
    </div>
    {/* Request button */}
    <Button size="sm" className="gap-1.5 text-xs">
      <Plus className="w-3.5 h-3.5" /> Request Something
    </Button>
  </div>
</header>
```

Content area: `<div className="max-w-[860px] mx-auto px-6 py-7">`

- [ ] **Step 2: Update portal background color**

In `src/index.css`, ensure `--portal-background: 220 14% 98%` (already set in Task 1).

The portal wrapper should use `bg-[hsl(var(--portal-background))] min-h-screen`.

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/Portal.tsx src/components/portal/PortalLayout.tsx
git commit -m "feat: update portal header and background to match Aniq-style layout"
```

---

## Final Verification

- [ ] **Full build**

```bash
npm run build 2>&1 | tail -30
```
Expected: Build succeeds with no errors.

- [ ] **Dev server smoke test**

```bash
npm run dev
```

Open http://localhost:5173 and verify:
1. Login page — grid background with radial fade visible, coral pink accents
2. Dashboard — sidebar has grouped sections with uppercase labels, left-border active indicator
3. Desktop header appears at top with search bar
4. Client list — stat cards + filter card + clean table
5. Portal — clean header with Luma + client name

- [ ] **Final commit**

```bash
git add -A
git commit -m "feat: complete Aniq UI redesign — tokens, shell, login, stat cards, pages"
```
