# Luma MVP Enhancement - Team Coordination Plan

> **For Claude:** This is a TEAM-BASED parallel execution plan. Team lead spawns agents, coordinates work, handles integration.

**Goal:** Deliver Phase 1b (scope) + Phase 1c (portal) + UX polish for Chrissy investor demo in 2-3 days

**Architecture:** 6 specialized agents working in parallel streams with clear boundaries to minimize conflicts

**Tech Stack:** React 18, TypeScript, Vite 5, Tailwind v3, Supabase, TanStack Query, shadcn/ui

---

## Team Spawn Plan

### Agent 1: UX Audit Agent
**Type:** `ui-ux-designer`
**Task:** Audit current UI against design-system.md, identify visual gaps, implement quick wins
**Branch:** `feature/ux-audit`
**Deliverables:**
- Audit report with prioritized fixes
- Typography/color corrections applied
- Component pattern validation

### Agent 2: Scope Features Developer
**Type:** `frontend-developer`
**Task:** Build all Phase 1b scope management features
**Branch:** `feature/scope-tracker`
**Deliverables:**
- ScopeTracker component
- ScopeTrackerCompact component
- ScopeAllocationForm component
- Scope calculation logic
- Enhanced ClientDetail scope tab

### Agent 3: Portal Developer
**Type:** `frontend-developer`
**Task:** Build all Phase 1c client portal features
**Branch:** `feature/portal`
**Deliverables:**
- Portal page and layout
- Portal components (PortalScopeCard, PortalTimeline, ApprovalCard)
- Magic link generation UI
- Supabase edge function for portal auth

### Agent 4: Delivery UX Developer
**Type:** `frontend-developer`
**Task:** Polish delivery logging with quick-add and timeline
**Branch:** `feature/delivery-ux`
**Deliverables:**
- QuickAddDelivery component
- DeliveryTimeline component
- EmptyState component
- StatusBadge component
- Enhanced LogDeliveryDialog

### Agent 5: Architecture Reviewer
**Type:** `backend-architect`
**Task:** Validate data model, design portal auth, review security
**Branch:** N/A (advisory role)
**Deliverables:**
- Schema validation report
- Edge function architecture
- RLS policy review
- Performance considerations

### Agent 6: Product Validator
**Type:** `general-purpose`
**Task:** Validate against SPEC.md, create demo data, test flows
**Branch:** `feature/demo-data`
**Deliverables:**
- Acceptance criteria checklist
- Demo data SQL script
- Test scenarios for Chrissy demo
- Final validation report

---

## Execution Timeline

### Phase 1: Spawn & Discovery (Hours 0-4)
1. Team lead spawns all 6 agents with specific tasks
2. Agents run discovery in parallel:
   - UX Audit: Review against design-system.md
   - Architecture: Validate schema
   - Product: Extract acceptance criteria from SPEC.md
3. Team lead reviews discovery outputs, identifies blockers
4. Agents begin core development

### Phase 2: Parallel Development (Hours 4-24)
- Scope Features: Builds in `src/components/scope/`
- Portal: Builds in `src/components/portal/` + `src/pages/Portal.tsx`
- Delivery UX: Builds in `src/components/deliveries/` + enhances existing
- UX Audit: Applies global style fixes, coordinates with devs

### Phase 3: Integration (Hours 24-36)
- Team lead merges all feature branches
- Resolves conflicts (primarily ClientDetail.tsx)
- All agents test integrated build
- Bug fixes and polish

### Phase 4: Demo Ready (Hours 36-48)
- Demo data loaded
- Product validator confirms acceptance
- Ready for Chrissy presentation

---

## Coordination Protocol

### Branch Strategy
- Main: `main` (protected)
- Features: `feature/<agent-focus>`
- Team lead merges to main

### Conflict Management
**Independent work (no conflicts):**
- Scope ↔ Portal (completely separate)
- Portal ↔ Delivery UX (completely separate)

**Shared dependencies:**
- `ClientDetail.tsx` - Scope (tab 2), Delivery UX (tab 1) → different tabs
- Global styles - UX Audit applies early, others rebase

### Integration Checkpoints
1. **Hour 4:** Discovery complete, begin development
2. **Hour 12:** First components complete, early integration
3. **Hour 24:** Core features done, full integration
4. **Hour 36:** Demo ready

---

## Success Criteria

**Functional:**
- [ ] Scope tracker shows usage with 5-tier status
- [ ] Client portal accessible via magic link
- [ ] Quick-add delivery works
- [ ] Delivery timeline groups by week
- [ ] Empty states guide first-time users

**Visual:**
- [ ] Matches design-system.md (colors, typography)
- [ ] Triple encoding for all status
- [ ] Responsive on all devices

**Product:**
- [ ] Meets Phase 1b + 1c requirements
- [ ] Demo data realistic
- [ ] Feels like real SaaS product

---

## Next Step

Team lead (me) spawns agents and coordinates execution.
