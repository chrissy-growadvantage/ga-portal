# Luma UX Audit Report

**Date:** February 15, 2026
**Auditor:** UX Audit Agent
**Scope:** Current Phase 1a UI vs `docs/ux/design-system.md` specification

---

## Verdict

The structural foundation is solid — layout grid, sidebar, responsive shell, font imports, and shadcn/ui integration are all well-implemented. However, the **color palette has drifted significantly** from the design system spec (terracotta instead of warm indigo), typography lacks the specified weight/size hierarchy, and status badges use raw Tailwind colors instead of semantic design tokens. These are all high-impact, low-effort fixes.

---

## Critical Issues

### 1. Primary Color: Terracotta vs Warm Indigo

**Problem**: `--primary` is set to `13 53% 51%` (#C55C40, terracotta). Design system specifies `245 58% 51%` (#5B4DC7, warm indigo).

**Evidence**: Design system Color System section (line 283-300) explicitly states: "Luma uses a warm-toned palette that avoids cold SaaS blues. The foundation is warm indigo + amber."

**Impact**: Every primary-colored element (buttons, links, active nav, badges, logo backgrounds, rings) renders in terracotta instead of indigo. This fundamentally changes the product's visual identity. Users make credibility judgments in 50ms (Lindgaard et al., 2006) — wrong brand color = wrong first impression.

**Fix**: Update `--primary` and related variables in `index.css`:
- `--primary: 245 58% 51%` (warm indigo)
- `--primary-glow: 245 58% 93%` (#EDEAFC)
- All sidebar/ring references to match

**Priority**: CRITICAL - Affects every screen

---

### 2. Success Color: Sage Green vs Vibrant Green

**Problem**: `--success` is `126 14% 48%` (#6B8E6F, muted sage). Design system specifies `158 64% 40%` (#25A576, vibrant green).

**Impact**: Completed/on-track states appear washed out and low-contrast. The sage green has only ~2.8:1 contrast on white — fails WCAG AA for text. The spec green (#25A576) at 3.4:1 passes for large text/UI elements.

**Fix**: `--success: 158 64% 40%`

**Priority**: HIGH - Affects status readability

---

### 3. Accent-Warm Color: Slightly Off

**Problem**: `--accent-warm` is `28 65% 54%` (#D97D3E). Design system specifies `28 92% 58%` (#E8853A) — more saturated amber.

**Impact**: Warning/attention states are less attention-grabbing than intended. The lower saturation (65% vs 92%) reduces the urgency signal for scope alerts.

**Fix**: `--accent-warm: 28 92% 58%`

**Priority**: MEDIUM - Affects scope warning visibility

---

### 4. Typography: Missing Type Scale Implementation

**Problem**: All page titles use `text-2xl font-bold` (24px/700). Design system specifies:
- Display: 30px (`text-3xl`) / weight 800 / letter-spacing -0.02em
- H1: 24px (`text-2xl`) / weight 700 / -0.015em
- H2: 20px (`text-xl`) / weight 600 / -0.01em

Current headings (`h1, h2, h3...`) all get `font-bold tracking-tight` generically.

**Evidence**: Design system Typography section specifies distinct weight + spacing per level, not uniform `font-bold`.

**Impact**: Visual hierarchy is flat. "Dashboard" title looks the same weight as "Clients" section header. NN Group F-pattern research shows users rely on heading size/weight contrast to scan page structure. Without it, scan-ability drops.

**Fix**:
- Dashboard/page titles: `text-3xl font-extrabold tracking-tight` (Display level)
- Section titles (H2): `text-xl font-semibold` with `-0.01em` spacing
- Card titles: `text-base font-semibold`
- Body text: `text-sm font-normal` (14px/400)

**Priority**: HIGH - Affects scan-ability of every page

---

### 5. Status Badges: Raw Tailwind Instead of Semantic Tokens

**Problem**: `CLIENT_STATUS_CONFIG` uses `bg-green-100 text-green-700`, `bg-yellow-100 text-yellow-700`, etc. These are raw Tailwind colors, not the design system's semantic tokens.

**Evidence**: Design system specifies semantic colors:
- Active → `success` token (green)
- Paused → `accent-warm` token (amber)
- Archived → `muted-foreground` token (gray)

**Impact**: Colors won't update when theme changes. Also inconsistent with the 5-tier scope status system that uses the same tokens. Creates visual inconsistency between badge colors and scope tracker colors.

**Fix**: Update `constants.ts` to use design system token-based classes.

**Priority**: HIGH - Visual consistency + theme support

---

### 6. Missing Triple Encoding on Client Status Badges

**Problem**: Client status badges show only color + text. Design system requires color + icon + text label (triple encoding). Current delivery status icons exist in `ClientDetail.tsx` but aren't used in the badges themselves on the client list.

**Evidence**: Design system Accessibility section: "Never use color as the sole indicator. All status states use color + icon + text label (triple encoding)." Also references WCAG color-as-sole-indicator requirement.

**Impact**: Accessibility failure. Users with color vision deficiency can't distinguish Active from Completed by color alone. The dot field exists in `CLIENT_STATUS_CONFIG` but isn't rendered.

**Fix**: Add status dot indicator to Badge rendering in client list cards.

**Priority**: HIGH - Accessibility requirement

---

### 7. Missing CSS Variables (Scope & Portal)

**Problem**: Design system appendix specifies scope-specific and portal-specific CSS variables that aren't in `index.css`:
- `--scope-on-track`, `--scope-active`, `--scope-nearing`, `--scope-exceeded`
- `--portal-background`, `--portal-card`, `--portal-max-width`
- `--quick-add-success`, `--quick-add-border`

**Impact**: When Phase 1b/1c components are built, they'll lack consistent tokens and each developer will hardcode colors differently.

**Fix**: Add the variables to `:root` in `index.css`.

**Priority**: MEDIUM - Foundation for upcoming phases

---

### 8. Stat Card Numbers: Missing Mono Font for Data

**Problem**: Dashboard stat card values use default sans-serif (`text-2xl font-bold`). Design system specifies mono font for data values: "Mono for data, sans for prose — scope hours in `font-mono`, descriptions in `font-sans`".

**Evidence**: Design system Typography Rules, line 371: "Mono for data, sans for prose"

**Impact**: Numbers don't signal "this is precise data" and lack the visual contrast the design system intends. Also, digit alignment is worse in proportional fonts.

**Fix**: Add `font-mono` to stat card values.

**Priority**: MEDIUM - Visual quality improvement

---

## Aesthetic Assessment

**Typography**: Plus Jakarta Sans + JetBrains Mono are imported and configured correctly. The font stack is distinctive and well-chosen per design system. Issue is only in weight/size application across components.

**Color**: Currently terracotta-themed instead of warm indigo. Once fixed, the indigo + amber palette will be distinctive and premium-feeling. The warm off-white background (#FDFBF8) and noise texture are already implemented correctly.

**Layout**: AppShell grid (sidebar w-64 fixed + content max-w-6xl centered) matches spec exactly. Spacing scale (space-y-8 between sections, gap-4 between cards) is correct. Responsive breakpoints working.

**Motion**: `card-interactive` hover animation, `fade-in` and `scale-in` keyframes, and `prefers-reduced-motion` are all implemented. Missing: `progress-fill` keyframe (needed for scope tracker), `stagger-delay` utility.

---

## What's Working

- Font imports (Plus Jakarta Sans + JetBrains Mono) correctly loaded via Google Fonts
- Warm off-white background with noise texture (`--background: 40 20% 98%`)
- `card-interactive` hover/active animation pattern
- AppShell layout grid matches spec (sidebar w-64 fixed, max-w-6xl content)
- Skeleton loading states for all data-dependent sections
- `prefers-reduced-motion` media query
- Proper responsive sidebar/header swap at `md` breakpoint
- Empty states with contextual messaging (not generic "nothing here")
- Left-aligned navigation in sidebar (respects NN Group left-side bias)
- Sheet-based mobile menu (proper touch pattern)
- Reasonable content padding scale (px-4 sm:px-6 lg:px-8)

---

## Implementation Priority

### Critical (Fix Now)
1. **Primary color** → terracotta to warm indigo — Effort: Low (CSS only)
2. **Success color** → sage to vibrant green — Effort: Low (CSS only)

### High (Fix Next)
3. **Typography scale** → apply Display/H1/H2/H3 weights — Effort: Low-Medium
4. **Status badges** → semantic tokens + triple encoding — Effort: Low-Medium
5. **Stat card numbers** → add `font-mono` — Effort: Low

### Medium (Pre-Phase 1b)
6. **Accent-warm saturation** → increase to match spec — Effort: Low
7. **Scope CSS variables** → add to index.css — Effort: Low
8. **Portal CSS variables** → add to index.css — Effort: Low
9. **Missing animation tokens** → progress-fill, stagger utilities — Effort: Low

---

## One Big Win

**Fix the primary color from terracotta to warm indigo.** This single CSS variable change (`--primary: 245 58% 51%`) cascades to every button, link, active nav state, badge, and focus ring in the app. It transforms the entire visual identity from "random warm palette" to the intentional "warm professionalism" the design system targets. 5 minutes of work, 100% visual impact.
