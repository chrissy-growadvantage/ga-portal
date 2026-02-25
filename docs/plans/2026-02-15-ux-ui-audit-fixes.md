# UX/UI Design Audit Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement all 12 design audit fixes to elevate Luma's professional appearance and UX

**Architecture:** Bottom-up foundation-first approach — refactor base components (button, card), then cascade changes through pages, domain components, and add new features (onboarding checklist, hero stats)

**Tech Stack:** React 18, TypeScript, Tailwind CSS, shadcn/ui, Lucide icons

---

## Task 1: Button Component Refactor

**Files:**
- Modify: `src/components/ui/button.tsx:7-31`

**Step 1: Update button base classes**

Change transition from `transition-all duration-200` to `transition-colors duration-150`:

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  // ... rest of cva config
```

**Step 2: Update default variant**

Remove scale effects and reduce shadow:

```tsx
variant: {
  default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
  // ... other variants
```

**Step 3: Update outline variant**

Tone down border and remove aggressive fill on hover:

```tsx
outline: "border border-input text-foreground bg-transparent hover:bg-muted",
```

**Step 4: Update size variants**

Reduce default and icon sizes for professional density:

```tsx
size: {
  default: "h-9 px-4 py-2",
  sm: "h-8 rounded-md px-3 text-xs",
  lg: "h-11 rounded-lg px-6",
  icon: "h-9 w-9",
},
```

**Step 5: Test button changes in browser**

Run dev server and verify:
- Buttons are smaller (36px height)
- No scale animation on hover
- Outline buttons subtle
- All variants render correctly

Expected: All buttons more professional, no visual bugs

**Step 6: Commit button refactor**

```bash
git add src/components/ui/button.tsx
git commit -m "refactor(ui): modernize button component for professional density

- Reduce default height from h-11 (44px) to h-9 (36px)
- Change transition from transition-all to transition-colors (faster, efficient)
- Remove scale effects (hover:scale-[1.02], too playful)
- Reduce shadow from shadow-md hover:shadow-lg to shadow-sm
- Tone down outline variant: border-2 border-primary → border border-input
- Icon size: h-10 → h-9

Aligns with 'warm precision' brand positioning and professional SaaS standards.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Empty State Padding & Card Documentation

**Files:**
- Modify: `src/components/ui/empty-state.tsx`
- Modify: `src/components/ui/card.tsx:32-34`

**Step 1: Read empty-state component**

Run: `cat src/components/ui/empty-state.tsx`

Expected: Find `py-12` in the className

**Step 2: Update empty state padding**

Change `py-12` to `py-10` (reduces 48px → 40px):

```tsx
// Find the main container div with py-12 and update to:
className="py-10 text-center"
```

**Step 3: Add card component documentation**

Add JSDoc comment above CardContent definition in `card.tsx`:

```tsx
/**
 * Card component with standardized padding tiers:
 *
 * Tier 1 - Compact cards (list items):
 *   <CardContent className="py-4"> — 16px top/bottom
 *
 * Tier 2 - Content cards (stats, forms, scope):
 *   <CardContent className="p-5"> — 20px all around
 *
 * Default base: p-6 pt-0. Override with className as needed.
 */
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />,
);
```

**Step 4: Commit Layer 1 changes**

```bash
git add src/components/ui/empty-state.tsx src/components/ui/card.tsx
git commit -m "refactor(ui): reduce empty state padding and document card tiers

- Empty state: py-12 → py-10 (48px → 40px vertical padding)
- Add card padding tier documentation for consistent usage
- Tier 1 (compact): py-4 for list items
- Tier 2 (content): p-5 for stats/forms/scope

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Dashboard Stat Card Refinements

**Files:**
- Modify: `src/pages/Dashboard.tsx:19-74,97`

**Step 1: Update stats color mapping**

Replace hard-coded colors with semantic tokens (lines 19-43):

```tsx
const stats = [
  {
    label: 'Total Clients',
    value: clients?.length ?? 0,
    icon: Users,
    color: 'text-primary',
  },
  {
    label: 'Active',
    value: activeClients.length,
    icon: TrendingUp,
    color: 'text-success', // was text-emerald-600
  },
  {
    label: 'Deliveries',
    value: totalDeliveries,
    icon: CheckCircle2,
    color: 'text-primary', // was text-indigo-600
  },
  {
    label: 'Paused',
    value: clients?.filter((c) => c.status === 'paused').length ?? 0,
    icon: Clock,
    color: 'text-accent-warm', // was text-amber-600
  },
];
```

**Step 2: Refine stat card rendering**

Update stat card CardContent and labels (lines 59-74):

```tsx
<Card key={stat.label}>
  <CardContent className="p-5"> {/* was pt-6 */}
    {isLoading ? (
      <Skeleton className="h-8 w-16" />
    ) : (
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {stat.label}
          </p>
          <p className="text-3xl font-bold font-mono mt-2">{stat.value}</p>
        </div>
        <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center">
          <stat.icon className={`w-5 h-5 ${stat.color}`} />
        </div>
      </div>
    )}
  </CardContent>
</Card>
```

**Step 3: Update empty state padding**

Change line 97 from `py-12` to `py-10`:

```tsx
<CardContent className="py-10 text-center">
```

**Step 4: Test Dashboard changes**

Navigate to Dashboard in browser and verify:
- Stat cards have refined labels (uppercase, smaller)
- Numbers are bigger (text-3xl)
- Icons wrapped in subtle background
- Colors use semantic tokens
- Empty state less padded

Expected: Dashboard looks more professional and refined

**Step 5: Commit Dashboard refinements**

```bash
git add src/pages/Dashboard.tsx
git commit -m "refactor(dashboard): refine stat cards and semantic colors

- Stat labels: text-sm → text-xs font-medium uppercase tracking-wider
- Stat values: text-2xl mt-1 → text-3xl mt-2 (bigger, more spacing)
- Icon wrapper: w-9 h-9 with subtle bg-primary/8 background
- CardContent: pt-6 → p-5 (consistent tier 2 padding)
- Empty state: py-12 → py-10
- Semantic colors: text-emerald-600 → text-success, text-indigo-600 → text-primary

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: ClientList Standardization

**Files:**
- Modify: `src/pages/ClientList.tsx`

**Step 1: Read ClientList to find spacing**

Run: `cat src/pages/ClientList.tsx | grep -n "space-y"`

Expected: Find `space-y-6` on main container

**Step 2: Update page spacing**

Change main container from `space-y-6` to `space-y-8`

**Step 3: Update client card padding**

Find CardContent with `pt-6` or similar and update to `p-5` for content tier

**Step 4: Fix scope tracker alignment**

Find code with `pl-14` and replace with flex spacer pattern:

```tsx
{latestScope && (
  <div className="flex items-center gap-4 mt-3">
    <div className="w-10 shrink-0" />
    <div className="flex-1 min-w-0">
      <ScopeTrackerCompact
        allocation={latestScope}
        deliveries={client.delivery_items ?? []}
      />
    </div>
  </div>
)}
```

**Step 5: Test ClientList changes**

Navigate to Clients page and verify:
- Section spacing looks consistent with Dashboard
- Scope tracker aligns properly below client name
- Card padding looks balanced

Expected: Consistent spacing, proper alignment

**Step 6: Commit ClientList changes**

```bash
git add src/pages/ClientList.tsx
git commit -m "refactor(clients): standardize spacing and scope alignment

- Page spacing: space-y-6 → space-y-8 (consistent with design system)
- Card padding: update to p-5 tier 2 standard
- Scope tracker: replace pl-14 magic number with flex spacer (w-10)
- Alignment: scope tracker now uses same layout mechanism as text

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: ClientDetail Standardization

**Files:**
- Modify: `src/pages/ClientDetail.tsx:109,159,224,244`

**Step 1: Update page spacing**

Change line 109 from `space-y-6` to `space-y-8`

**Step 2: Update contact card padding**

Change line 159 CardContent to `className="p-5"`

**Step 3: Update empty state padding**

Change lines 224 and 244 from `py-12` to `py-10`

**Step 4: Test ClientDetail changes**

Navigate to any client detail page and verify:
- Consistent spacing between sections
- Contact card padding balanced
- Empty states less dominant

Expected: Professional spacing throughout

**Step 5: Commit ClientDetail changes**

```bash
git add src/pages/ClientDetail.tsx
git commit -m "refactor(client-detail): standardize spacing throughout

- Page spacing: space-y-6 → space-y-8 (line 109)
- Contact card: CardContent className='p-5' (line 159)
- Empty states: py-12 → py-10 (lines 224, 244)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Settings & Header Standardization

**Files:**
- Modify: `src/pages/Settings.tsx`
- Modify: `src/components/layout/Header.tsx`

**Step 1: Update Settings page spacing**

Change main container from `space-y-6` to `space-y-8`

Update all content CardContent to `className="p-5"`

**Step 2: Update mobile header alignment**

In Header.tsx, find mobile-specific classes and update:
- Header height: `h-14` → `h-16`
- Logo icon: `w-7 h-7` → `w-8 h-8`
- Horizontal padding: ensure `px-4`

**Step 3: Test Settings and mobile header**

Check Settings page spacing and resize browser to mobile width to verify header alignment

Expected: Settings matches other pages, mobile header height consistent with sidebar

**Step 4: Commit Settings and Header changes**

```bash
git add src/pages/Settings.tsx src/components/layout/Header.tsx
git commit -m "refactor(settings,header): standardize spacing and mobile alignment

Settings:
- Page spacing: space-y-6 → space-y-8
- Card padding: all content cards use p-5

Header:
- Mobile height: h-14 → h-16 (matches desktop sidebar)
- Logo icon: w-7 h-7 → w-8 h-8
- Padding: standardize to px-4

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: ScopeTracker Semantic Colors

**Files:**
- Modify: `src/components/scope/ScopeTracker.tsx`

**Step 1: Read ScopeTracker to find hard-coded colors**

Run: `cat src/components/scope/ScopeTracker.tsx | grep -E "emerald|indigo|slate|amber"`

Expected: Find `bg-emerald-500`, `bg-amber-500`, `bg-slate-300` in breakdown cards

**Step 2: Replace hard-coded colors with semantic tokens**

Find BreakdownCard components and update accent props:

```tsx
<BreakdownCard
  label="In-scope"
  value={formatScopeValue(calc.inScopeUsed, calc.unitLabel)}
  accent="bg-success" // was bg-emerald-500
/>
<BreakdownCard
  label="Out-of-scope"
  value={formatScopeValue(calc.outOfScopeUsed, calc.unitLabel)}
  accent="bg-accent-warm" // was bg-amber-500
/>
<BreakdownCard
  label="Remaining"
  value={formatScopeValue(calc.remaining, calc.unitLabel)}
  accent="bg-muted-foreground/30" // was bg-slate-300
/>
```

**Step 3: Test scope tracker colors**

Navigate to client with scope allocation and verify colors use semantic tokens

Expected: Colors should match design system (sage green for success, terracotta for warm)

**Step 4: Commit scope tracker semantic colors**

```bash
git add src/components/scope/ScopeTracker.tsx
git commit -m "refactor(scope): enforce semantic color system

Replace hard-coded Tailwind colors with CSS variables:
- bg-emerald-500 → bg-success
- bg-amber-500 → bg-accent-warm
- bg-slate-300 → bg-muted-foreground/30

Maintains design system integrity and theme consistency.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: DeliveryTimeline Spacing Cleanup

**Files:**
- Modify: `src/components/deliveries/DeliveryTimeline.tsx`

**Step 1: Read DeliveryTimeline to find spacing**

Run: `cat src/components/deliveries/DeliveryTimeline.tsx | grep -n "pb-"`

Expected: Find `pb-4` and `pb-1` classes

**Step 2: Update timeline item wrapper spacing**

Change TimelineItem wrapper from `pb-4` to `pb-5`:

```tsx
<div className="relative flex gap-3 pb-5 last:pb-0">
```

**Step 3: Remove inner padding**

Find and remove any `pb-1` class from inner content wrapper

**Step 4: Remove ml offset if present**

Search for `ml-1` on timeline container and remove

**Step 5: Test timeline spacing**

Navigate to client with deliveries and verify timeline spacing looks consistent

Expected: Cleaner spacing, no visual gaps between dot and line

**Step 6: Commit timeline spacing**

```bash
git add src/components/deliveries/DeliveryTimeline.tsx
git commit -m "refactor(timeline): clean up spacing inconsistencies

- TimelineItem wrapper: pb-4 → pb-5 (20px, aligns with gap-5 standard)
- Remove pb-1 from inner content div (redundant)
- Remove ml-1 offset if present (unnecessary)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Portal Section Reordering

**Files:**
- Modify: `src/pages/Portal.tsx`

**Step 1: Read Portal to understand structure**

Run: `cat src/pages/Portal.tsx | grep -A5 "PortalTimeline"`

Expected: Find PortalTimeline render location relative to ApprovalCard section

**Step 2: Move approval section above timeline**

Reorder JSX so approvals appear BEFORE timeline:

```tsx
<PortalLayout {...}>
  {/* 1. Scope Card - stays first */}
  {scopeData && <PortalScopeCard ... />}

  {/* 2. APPROVALS - move to second position */}
  {pendingApprovals.length > 0 && (
    <section>
      <h2 className="text-base font-semibold mb-4">Needs Your Approval</h2>
      {pendingApprovals.map(item => (
        <ApprovalCard key={item.id} item={item} token={token} onAction={refetch} />
      ))}
    </section>
  )}

  {/* 3. Timeline - now third */}
  <PortalTimeline deliveries={deliveries} />
</PortalLayout>
```

**Step 3: Test portal ordering**

Open portal in browser (needs magic link or test token) and verify approvals appear before timeline

Expected: Clients see pending approvals immediately, don't have to scroll past deliveries

**Step 4: Commit portal reordering**

```bash
git add src/pages/Portal.tsx
git commit -m "refactor(portal): move approvals above timeline for better UX

Critical UX fix based on client persona (Marcus) feedback:
- Approval section now appears BEFORE delivery timeline
- Clients need to act on approvals first, not scroll past deliveries
- Prioritizes actionable items over informational timeline

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Onboarding Checklist Component

**Files:**
- Create: `src/components/onboarding/OnboardingChecklist.tsx`
- Modify: `src/pages/Dashboard.tsx` (add import and integration)

**Step 1: Create onboarding directory**

Run: `mkdir -p src/components/onboarding`

Expected: Directory created successfully

**Step 2: Create OnboardingChecklist component**

Create `src/components/onboarding/OnboardingChecklist.tsx`:

```tsx
import { CheckCircle2, Circle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ChecklistStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  action?: () => void;
  actionLabel?: string;
}

interface OnboardingChecklistProps {
  steps: ChecklistStep[];
}

export function OnboardingChecklist({ steps }: OnboardingChecklistProps) {
  const allComplete = steps.every(s => s.completed);

  if (allComplete) return null; // Hide when done

  return (
    <Card>
      <CardContent className="p-5">
        <h2 className="text-lg font-semibold mb-1">Welcome to Luma</h2>
        <p className="text-sm text-muted-foreground mb-4">
          You're 3 steps away from showing clients the value you deliver.
        </p>

        <div className="space-y-3">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                step.completed ? 'bg-muted/30 border-border/60' : 'bg-background border-border'
              }`}
            >
              {step.completed ? (
                <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              )}

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${
                  step.completed ? 'text-muted-foreground' : 'text-foreground'
                }`}>
                  {step.title}
                </p>
                {!step.completed && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {step.description}
                  </p>
                )}
              </div>

              {!step.completed && step.action && (
                <Button size="sm" onClick={step.action}>
                  {step.actionLabel || 'Start'}
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 3: Integrate into Dashboard**

In `src/pages/Dashboard.tsx`, add import and checklist logic:

1. Add import:
```tsx
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';
import { useState } from 'react'; // if not already imported
```

2. Add state after existing stats calculation:
```tsx
const [createClientDialogOpen, setCreateClientDialogOpen] = useState(false);

const onboardingSteps = [
  {
    id: 'add-client',
    title: 'Add your first client',
    description: 'Start by adding one client — you can add more anytime.',
    completed: (clients?.length ?? 0) > 0,
    action: () => setCreateClientDialogOpen(true),
    actionLabel: 'Add Client',
  },
  {
    id: 'log-delivery',
    title: 'Log a delivery',
    description: 'Record something you've done for them.',
    completed: totalDeliveries > 0,
  },
  {
    id: 'share-link',
    title: 'Share the client view',
    description: 'Generate a magic link to show your client.',
    completed: clients?.some(c => c.magic_link_token_hash) ?? false,
  },
];
```

3. Render before stat cards:
```tsx
{/* Add after header section, before stat cards */}
{!onboardingSteps.every(s => s.completed) && (
  <OnboardingChecklist steps={onboardingSteps} />
)}
```

**Step 4: Test onboarding checklist**

Clear local data or use fresh account to see checklist. Verify:
- Shows for new users with 0 clients
- Hides when all steps complete
- "Add Client" button works

Expected: Progressive onboarding visible for new users, disappears when done

**Step 5: Commit onboarding checklist**

```bash
git add src/components/onboarding/OnboardingChecklist.tsx src/pages/Dashboard.tsx
git commit -m "feat(onboarding): add 3-step checklist for new users

New component: OnboardingChecklist
- Shows 3-step onboarding: Add client → Log delivery → Share link
- Hides automatically when all steps complete
- Uses CheckCircle2/Circle icons for completion state
- Integrates with Dashboard state

Dashboard integration:
- Tracks completion via client count, delivery count, magic link existence
- Renders before stat cards for new users
- No separate onboarding flow needed

Based on NN Group progressive onboarding research.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 11: Portal Hero Stats

**Files:**
- Modify: `src/pages/Portal.tsx`

**Step 1: Read Portal to understand layout**

Run: `cat src/pages/Portal.tsx | grep -B5 -A5 "PortalLayout"`

Expected: Find PortalLayout opening and first section (likely PortalScopeCard)

**Step 2: Add hero stats section**

Add immediately after PortalLayout opening, before other content:

```tsx
<PortalLayout operatorName={...} businessName={...} clientName={...}>
  {/* Hero stats - new section */}
  <section className="grid grid-cols-3 gap-3 mb-6">
    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-2xl font-bold font-mono">{deliveries.length}</p>
        <p className="text-xs text-muted-foreground mt-1">Deliveries</p>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-2xl font-bold font-mono">
          {scopeData ? Math.round((scopeData.used / scopeData.allocated) * 100) : 0}%
        </p>
        <p className="text-xs text-muted-foreground mt-1">Scope Used</p>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-2xl font-bold font-mono">{pendingApprovals.length}</p>
        <p className="text-xs text-muted-foreground mt-1">Pending</p>
      </CardContent>
    </Card>
  </section>

  {/* Rest of portal content */}
  {scopeData && <PortalScopeCard ... />}
  {/* ... */}
</PortalLayout>
```

**Step 3: Test portal hero stats**

Open portal and verify hero stats show:
- Delivery count
- Scope percentage (if scope exists)
- Pending approvals count

Expected: Three stat cards at top showing key metrics at a glance

**Step 4: Commit portal hero stats**

```bash
git add src/pages/Portal.tsx
git commit -m "feat(portal): add hero stats at top for quick overview

Add 3-column stat grid showing:
- Total deliveries this period
- Scope usage percentage
- Pending approvals count

Client personas (Marcus) want to see key metrics immediately.
Stats use font-mono for precision signal.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 12: Final Verification & Testing

**Files:**
- None (testing only)

**Step 1: Visual regression check - Base components**

Test in browser:
- [ ] All buttons h-9 default (36px)
- [ ] Outline buttons subtle border
- [ ] No scale on hover
- [ ] Empty states py-10

**Step 2: Visual regression check - Pages**

Navigate through all pages:
- [ ] Dashboard: space-y-8, refined stat cards, onboarding checklist
- [ ] ClientList: space-y-8, scope tracker aligned
- [ ] ClientDetail: space-y-8, balanced padding
- [ ] Settings: space-y-8, consistent cards

**Step 3: Visual regression check - Domain**

Test specific features:
- [ ] Scope tracker uses semantic colors (no hard-coded)
- [ ] Timeline spacing consistent (pb-5)
- [ ] Portal approvals above timeline
- [ ] Portal hero stats display

**Step 4: Mobile responsive check**

Resize browser to mobile width (375px):
- [ ] Header height h-16 matches desktop
- [ ] Buttons still tappable (36px minimum)
- [ ] Portal hero stats stack properly
- [ ] Onboarding checklist readable

**Step 5: Semantic color audit**

Search codebase for hard-coded colors:

Run: `grep -r "text-emerald-\|text-indigo-\|bg-emerald-\|bg-indigo-" src/ --include="*.tsx"`

Expected: No matches (all should use semantic tokens)

**Step 6: Document verification results**

Create verification checklist summary. All items should pass.

---

## Success Criteria

After completing all tasks, verify:

✅ **Button Refactor**
- Default height: 44px → 36px (h-11 → h-9)
- Transition: transition-all → transition-colors duration-150
- Shadow: shadow-md hover:shadow-lg → shadow-sm
- No scale effects

✅ **Page Spacing**
- All pages use space-y-8 consistently
- Dashboard, ClientList, ClientDetail, Settings aligned

✅ **Stat Cards**
- Labels: text-xs font-medium uppercase tracking-wider
- Values: text-3xl font-bold font-mono mt-2
- Icons: wrapped in bg-primary/8 container

✅ **Portal UX**
- Approvals section above timeline
- Hero stats at top showing key metrics

✅ **Onboarding**
- 3-step checklist for new users
- Hides when all complete

✅ **Semantic Colors**
- No hard-coded emerald/indigo colors
- All use CSS variables (--success, --primary, --accent-warm)

✅ **Empty States**
- py-10 (40px padding) instead of py-12

✅ **Card Padding**
- Two-tier system documented
- Consistent usage across components

---

## Troubleshooting

**Issue: Buttons look too small**
- Verify h-9 (36px) was applied, not smaller
- Check that padding px-4 provides adequate width
- Industry standard for professional SaaS is 36-40px

**Issue: Onboarding checklist won't hide**
- Check that `allComplete` logic uses `every()`
- Verify state tracking is accurate (clients.length, totalDeliveries, magic_link_token_hash)

**Issue: Portal hero stats show wrong data**
- Verify scopeData calculation includes used/allocated
- Check pendingApprovals filter logic
- Ensure deliveries array is correct

**Issue: Semantic colors don't match design**
- Check index.css for CSS variable definitions
- Verify Tailwind config extends colors correctly
- Confirm no hard-coded colors override semantic tokens

---

## References

- Design Document: `docs/plans/2026-02-15-ux-ui-audit-fixes-design.md`
- Design System: `docs/ux/design-system.md`
- Brand Identity: `docs/brand-identity.md`
- NN Group Research: Professional SaaS standards, progressive onboarding
