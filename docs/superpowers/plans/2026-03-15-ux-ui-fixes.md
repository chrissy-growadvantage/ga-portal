# UX/UI Fixes Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply all UX/UI improvements identified by the design review — 13 targeted fixes across 9 files, ordered Critical → High → Medium.

**Architecture:** Each fix is self-contained in its file. No shared state changes, no new components needed. Pure edits: class changes, conditional renders, layout restructures, and copy updates.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, shadcn/ui, React Router v6, Lucide icons.

---

## Chunk 1: Critical Fixes

### Task 1: Make Desktop FAB Mobile-Only

**Problem:** The "Log Delivery" FAB floats on every desktop screen, obscuring content and using a mobile-native pattern on desktop. The tab header already has a "Log Delivery" button on desktop.

**Files:**
- Modify: `src/pages/ClientDetail.tsx:553-563`

- [ ] **Step 1: Add `md:hidden` to the FAB wrapper**

Find the FAB section (lines ~553-563):
```tsx
{/* Log Delivery FAB — visible on Deliveries tab */}
{activeTab === 'deliveries' && (
  <button
    className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-full shadow-lg hover:bg-primary/90 active:scale-95 transition-all font-medium text-sm"
    onClick={() => setDeliveryDialogOpen(true)}
    aria-label="Log delivery"
  >
    <Plus className="w-4 h-4" />
    Log Delivery
  </button>
)}
```

Change to:
```tsx
{/* Log Delivery FAB — mobile only (desktop has the tab header button) */}
{activeTab === 'deliveries' && (
  <button
    className="md:hidden fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-full shadow-lg hover:bg-primary/90 active:scale-95 transition-all font-medium text-sm"
    onClick={() => setDeliveryDialogOpen(true)}
    aria-label="Log delivery"
  >
    <Plus className="w-4 h-4" />
    Log Delivery
  </button>
)}
```

- [ ] **Step 2: Verify in browser** — Desktop (1280px) should show no FAB. Mobile (390px) should still show it on the Deliveries tab.

- [ ] **Step 3: Commit**
```bash
git add src/pages/ClientDetail.tsx
git commit -m "fix: hide Log Delivery FAB on desktop — redundant with tab header button"
```

---

### Task 2: Dashboard — Show Status Badge for ALL Client Statuses

**Problem:** The Recent Clients table only shows a status badge when `client.status !== 'active'`. Active clients show an empty cell, making the STATUS column appear broken.

**Files:**
- Modify: `src/pages/Dashboard.tsx:319-322`

- [ ] **Step 1: Show TypedStatusBadge for all statuses**

Find:
```tsx
<td className="px-4 py-3">
  {client.status !== 'active' && (
    <TypedStatusBadge type="client" status={client.status} className="text-xs" />
  )}
</td>
```

Replace with:
```tsx
<td className="px-4 py-3">
  <TypedStatusBadge type="client" status={client.status} className="text-xs" />
</td>
```

- [ ] **Step 2: Commit**
```bash
git add src/pages/Dashboard.tsx
git commit -m "fix: show status badge for all clients in dashboard Recent Clients table"
```

---

## Chunk 2: High Priority Fixes

### Task 3: Stat Card Values in JetBrains Mono

**Problem:** Stat card numbers look like body text. Using the monospaced font signals "data" and improves readability of numeric values.

**Files:**
- Modify: `src/components/ui/stat-card.tsx:44`

- [ ] **Step 1: Add `font-mono` to the value `<p>` tag**

Find:
```tsx
<p className="text-[26px] font-bold tracking-tight leading-none mb-1.5">{value}</p>
```

Replace with:
```tsx
<p className="text-[26px] font-bold tracking-tight leading-none mb-1.5 font-mono">{value}</p>
```

- [ ] **Step 2: Commit**
```bash
git add src/components/ui/stat-card.tsx
git commit -m "feat: use JetBrains Mono font for stat card values — clearer data readability"
```

---

### Task 4: Portal Approval Card — Stack Actions Below Content

**Problem:** With `justify-between`, the Approve/Decline buttons are far from the delivery title, violating Fitts's Law. Restructure so actions appear directly below the content within the same card.

**Files:**
- Modify: `src/components/portal/ApprovalCard.tsx:105-170`

- [ ] **Step 1: Restructure the default (non-feedback) state layout**

Find the default render (starting at line ~105):
```tsx
return (
  <div className={cn('px-5 py-4', !isLast && 'border-b border-border')}>
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{item.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-xs px-1.5 py-0 font-normal">
            {item.category}
          </Badge>
          {item.completed_at && (
            <span className="text-xs text-muted-foreground">
              sent {format(new Date(item.completed_at), 'MMM d')}
            </span>
          )}
        </div>
        {item.description && (
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
            {item.description}
          </p>
        )}
      </div>

      {/* Buttons */}
      {!showFeedback ? (
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFeedback(true)}
            disabled={submitting}
            className="text-xs h-8 text-muted-foreground hover:text-foreground"
          >
            Decline
          </Button>
          <Button
            size="sm"
            onClick={handleApprove}
            disabled={submitting}
            className="text-xs h-8 gap-1.5 bg-status-success hover:bg-status-success/90 text-white"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Approve
          </Button>
        </div>
      ) : (
        <div className="w-full mt-3 space-y-2">
          ...
        </div>
      )}
    </div>
  </div>
);
```

Replace with a stacked layout where actions are always below content:
```tsx
return (
  <div className={cn('px-5 py-4', !isLast && 'border-b border-border')}>
    {/* Content */}
    <div className="min-w-0">
      <p className="text-sm font-semibold text-foreground">{item.title}</p>
      <div className="flex items-center gap-2 mt-1">
        <Badge variant="outline" className="text-xs px-1.5 py-0 font-normal">
          {item.category}
        </Badge>
        {item.completed_at && (
          <span className="text-xs text-muted-foreground">
            sent {format(new Date(item.completed_at), 'MMM d')}
          </span>
        )}
      </div>
      {item.description && (
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
          {item.description}
        </p>
      )}
    </div>

    {/* Actions — always below content */}
    {!showFeedback ? (
      <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFeedback(true)}
          disabled={submitting}
          className="text-xs h-8 text-muted-foreground hover:text-foreground"
        >
          Request Changes
        </Button>
        <Button
          size="sm"
          onClick={handleApprove}
          disabled={submitting}
          className="text-xs h-8 gap-1.5 bg-status-success hover:bg-status-success/90 text-white"
        >
          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Approve
        </Button>
      </div>
    ) : (
      <div className="mt-3 space-y-2">
        <Textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="What would you like changed?"
          className="min-h-[72px] resize-none text-sm"
          autoFocus
        />
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleRequestChanges} disabled={submitting || !feedback.trim()} className="gap-1.5">
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Submit Feedback'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setShowFeedback(false); setFeedback(''); }} disabled={submitting}>
            Cancel
          </Button>
        </div>
      </div>
    )}
  </div>
);
```

- [ ] **Step 2: Commit**
```bash
git add src/components/portal/ApprovalCard.tsx
git commit -m "fix: stack approval card actions below content — reduces Fitts's Law distance"
```

---

### Task 5: Client List — Remove Redundant "View" Button

**Problem:** Each table row already has an `onClick` that navigates to the client. The "View" link in the Actions column is redundant noise. Also, `window.location.href` bypasses React Router — switch to `useNavigate`.

**Files:**
- Modify: `src/pages/ClientList.tsx`

- [ ] **Step 1: Import `useNavigate` and remove `window.location.href` pattern**

Add `useNavigate` to the import:
```tsx
import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
```

Add `const navigate = useNavigate();` at the top of the component function (after `const [dialogOpen, setDialogOpen] = useState(false);`).

- [ ] **Step 2: Update row `onClick` to use `navigate()`**

Find:
```tsx
onClick={() => { window.location.href = `/clients/${client.id}`; }}
```

Replace with:
```tsx
onClick={() => navigate(`/clients/${client.id}`)}
```

- [ ] **Step 3: Remove the Actions column header and View cell**

Remove the `<th>` for Actions:
```tsx
<th className="text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-2.5">Actions</th>
```

Remove the entire Actions `<td>` block:
```tsx
{/* Actions */}
<td className="px-4 py-3 text-right">
  <Link
    to={`/clients/${client.id}`}
    onClick={(e) => e.stopPropagation()}
    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border text-[12px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
  >
    View
  </Link>
</td>
```

- [ ] **Step 4: Commit**
```bash
git add src/pages/ClientList.tsx
git commit -m "fix: remove redundant View button from client list — row click navigates to detail"
```

---

### Task 6: Portal Request Button — Increase Mobile Touch Target

**Problem:** The "Request Something" button in the portal header is `h-8` (32px), below the 44px minimum touch target per Fitts's Law / WCAG 2.5.5.

**Files:**
- Modify: `src/components/portal/PortalLayout.tsx:70-78`

- [ ] **Step 1: Increase button height on mobile**

Find:
```tsx
<Button
  onClick={onRequestSomething}
  size="sm"
  className="gap-1.5 text-xs h-8"
  aria-label="Request something"
>
  <Plus className="w-3.5 h-3.5" />
  <span className="hidden sm:inline">Request Something</span>
</Button>
```

Replace with:
```tsx
<Button
  onClick={onRequestSomething}
  size="sm"
  className="gap-1.5 text-xs h-11 sm:h-8 min-w-[44px]"
  aria-label="Request something"
>
  <Plus className="w-3.5 h-3.5" />
  <span className="hidden sm:inline">Request Something</span>
</Button>
```

- [ ] **Step 2: Commit**
```bash
git add src/components/portal/PortalLayout.tsx
git commit -m "fix: increase portal request button touch target to 44px on mobile (WCAG 2.5.5)"
```

---

## Chunk 3: Medium Priority Fixes

### Task 7: Portal Error State — Add Recovery Path

**Problem:** The error state shows no actionable next step. Clients hitting an invalid/expired link are abandoned with no way to self-serve.

**Files:**
- Modify: `src/pages/Portal.tsx:86-115`

- [ ] **Step 1: Add retry button and clearer copy to both error states**

Find:
```tsx
if (error) {
  const errorMessage = error.message;
  const isExpired = errorMessage === 'EXPIRED_TOKEN';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-portal-background">
      <div className="text-center max-w-sm">
        {isExpired ? (
          <>
            <Clock className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <h1 className="text-lg font-semibold mb-1">Link Expired</h1>
            <p className="text-sm text-muted-foreground">
              This portal link has expired. Please ask your service
              provider for a new link.
            </p>
          </>
        ) : (
          <>
            <ShieldAlert className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <h1 className="text-lg font-semibold mb-1">Link Not Found</h1>
            <p className="text-sm text-muted-foreground">
              This portal link is not valid. Please check with your
              service provider.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
```

Replace with:
```tsx
if (error) {
  const errorMessage = error.message;
  const isExpired = errorMessage === 'EXPIRED_TOKEN';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-portal-background">
      <div className="text-center max-w-sm">
        {isExpired ? (
          <>
            <Clock className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <h1 className="text-lg font-semibold mb-1">Link Expired</h1>
            <p className="text-sm text-muted-foreground">
              This portal link has expired. Ask your service provider
              to send you a fresh one.
            </p>
          </>
        ) : (
          <>
            <ShieldAlert className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <h1 className="text-lg font-semibold mb-1">Link Not Found</h1>
            <p className="text-sm text-muted-foreground">
              This portal link isn't valid. Double-check the link or
              ask your service provider to resend it.
            </p>
          </>
        )}
        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            Try again
          </button>
          <p className="text-xs text-muted-foreground/60">
            If this keeps happening, let your provider know the link isn't working.
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**
```bash
git add src/pages/Portal.tsx
git commit -m "fix: add recovery path to portal error states — retry button and clearer copy"
```

---

### Task 8: Revenue Chart — Empty State Message

**Problem:** When there's no revenue data, Recharts renders a flat $0 line across a full chart. This looks broken, not informative. Show a message instead.

**Files:**
- Modify: `src/pages/Revenue.tsx` (find the BarChart section)

- [ ] **Step 1: Find the BarChart render and wrap with empty state check**

Find the `chartData` definition (around line 128):
```tsx
const chartData = (stats?.revenueByMonth ?? []).map((m) => ({
  month: m.label.split(' ')[0],
  amount: m.amount / 100,
}));
```

Find where the BarChart is rendered (search for `<BarChart` or `<ResponsiveContainer`). Wrap it with a condition:

```tsx
{/* Revenue Over Time chart */}
{chartData.every(d => d.amount === 0) ? (
  <div className="flex items-center justify-center h-48 text-center">
    <div>
      <p className="text-sm font-medium text-muted-foreground">No revenue recorded yet</p>
      <p className="text-xs text-muted-foreground/60 mt-1">
        Revenue data will appear here once payments are logged.
      </p>
    </div>
  </div>
) : (
  <ResponsiveContainer width="100%" height={200}>
    <BarChart data={chartData} ...>
      ...
    </BarChart>
  </ResponsiveContainer>
)}
```

- [ ] **Step 2: Commit**
```bash
git add src/pages/Revenue.tsx
git commit -m "fix: show empty state instead of flat zero chart when no revenue data"
```

---

### Task 9: Settings — Remove UUID Display and Coming Soon Card

**Problem:** Raw UUIDs in Settings confuse real users and signal "unfinished." The "Coming Soon" card signals incompleteness.

**Files:**
- Modify: `src/pages/Settings.tsx:46-55` (User ID block) and `59-66` (Coming Soon card)

- [ ] **Step 1: Remove the User ID row**

Find:
```tsx
<div>
  <p className="text-sm text-muted-foreground">User ID</p>
  <p className="text-sm font-mono text-xs">{user?.id}</p>
</div>
```

Delete it entirely.

- [ ] **Step 2: Remove the Coming Soon card**

Find:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Coming Soon</CardTitle>
    <CardDescription>
      Profile editing, notification preferences, and team management will be available in future releases.
    </CardDescription>
  </CardHeader>
</Card>
```

Delete it entirely.

- [ ] **Step 3: Remove unused imports if any become unused** — `CardDescription` may still be used elsewhere. Check before removing.

- [ ] **Step 4: Commit**
```bash
git add src/pages/Settings.tsx
git commit -m "fix: remove UUID display and Coming Soon card from settings — cleaner operator experience"
```

---

### Task 10: Dashboard Greeting — Shorten First Name on Mobile

**Problem:** "Good evening, Mervin De Castro 👋" wraps to 3 lines on mobile, pushing stat cards below the fold.

**Files:**
- Modify: `src/pages/Dashboard.tsx:94-101, 147-151`

- [ ] **Step 1: Compute firstName separately**

After the `operatorName` computation (line ~94):
```tsx
const operatorName =
  (user?.user_metadata?.full_name as string | undefined) ??
  user?.email?.split('@')[0] ??
  'there';
```

Add:
```tsx
const firstName = operatorName.split(' ')[0];
```

- [ ] **Step 2: Use `firstName` on mobile, `operatorName` on desktop**

Find:
```tsx
<h1 className="text-[22px] font-bold tracking-tight">
  {timeGreeting}, {operatorName} 👋
</h1>
```

Replace with:
```tsx
<h1 className="text-[22px] font-bold tracking-tight">
  <span className="sm:hidden">{timeGreeting}, {firstName} 👋</span>
  <span className="hidden sm:inline">{timeGreeting}, {operatorName} 👋</span>
</h1>
```

- [ ] **Step 3: Commit**
```bash
git add src/pages/Dashboard.tsx
git commit -m "fix: shorten greeting to first name on mobile — prevents 3-line wrap pushing content down"
```

---

## Verification

After all tasks are complete:

- [ ] Run `npx playwright test tests/e2e/screenshots.spec.ts --reporter=list` to regenerate screenshots
- [ ] Visually confirm: no FAB on desktop, status badges visible, mono font on stat cards, stacked approval card, no View button in client list, try-again button on portal error, no UUID in settings, shorter greeting on mobile
- [ ] Run `npm run build` — ensure no TypeScript errors
- [ ] Final commit if any cleanup needed
