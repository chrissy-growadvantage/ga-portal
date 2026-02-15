# Time Tracking Feature - Design Document

**Date:** 2026-02-15
**Timeline:** ASAP for Chrissy demo (1.5-2 days)
**Approach:** Core features now (Phase 1), team members post-demo (Phase 2)

---

## Overview

Add Toggl-like time tracking to Luma so operators can track time spent on client work, with floating timer widget and timesheet view.

## Phase 1: Solo Operator MVP (For Demo)

### Features
- ✅ Floating timer widget (draggable, minimizable)
- ✅ Start/stop timer with client + description
- ✅ Link time to existing delivery OR create new delivery on stop
- ✅ Manual time entry (for forgotten timers)
- ✅ Timesheet page (list, edit, delete entries)
- ✅ Auto-calculate hours_spent on deliveries from time entries
- ✅ Integrate with scope calculations (hours-based scopes)

### Out of Scope (Phase 2)
- ❌ Team member invites
- ❌ Assigned client permissions
- ❌ Approval workflows
- ❌ Billable/non-billable tracking
- ❌ Reports/exports

---

## Data Model

### New Table: `time_entries`

```sql
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES operators(user_id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  delivery_item_id UUID REFERENCES delivery_items(id) ON DELETE SET NULL,

  description TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  is_manual BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_time_entries_operator ON time_entries(operator_id);
CREATE INDEX idx_time_entries_client ON time_entries(client_id);
CREATE INDEX idx_time_entries_started ON time_entries(started_at);
```

### RLS Policies

```sql
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "time_entries_select" ON time_entries FOR SELECT
  USING (operator_id = auth.uid());

CREATE POLICY "time_entries_insert" ON time_entries FOR INSERT
  WITH CHECK (operator_id = auth.uid());

CREATE POLICY "time_entries_update" ON time_entries FOR UPDATE
  USING (operator_id = auth.uid());

CREATE POLICY "time_entries_delete" ON time_entries FOR DELETE
  USING (operator_id = auth.uid());
```

---

## Architecture

### Timer State Management

**React Context** (`src/contexts/TimerContext.tsx`):
```typescript
interface TimerState {
  isRunning: boolean;
  timeEntryId: string | null;
  startedAt: Date | null;
  elapsedSeconds: number;
  description: string;
  clientId: string;
  deliveryItemId: string | null;
}
```

**localStorage persistence:**
- Key: `luma_timer_state`
- Survives page refresh
- Resume timer on app load if `ended_at` is NULL in DB

### Components

1. **TimerWidget** (`src/components/time-tracking/TimerWidget.tsx`)
   - Floating in bottom-right
   - Draggable, minimizable
   - Shows elapsed time (HH:MM:SS)
   - Global keyboard shortcut: Ctrl+T

2. **StartTimerDialog** (`src/components/time-tracking/StartTimerDialog.tsx`)
   - Client dropdown (required)
   - Description input (required)
   - Link to delivery dropdown (optional)

3. **StopTimerDialog** (`src/components/time-tracking/StopTimerDialog.tsx`)
   - Shows elapsed time
   - Option: Create delivery OR save standalone
   - If linked to delivery, auto-updates it

4. **TimesheetPage** (`src/pages/Timesheet.tsx`)
   - Route: `/timesheet`
   - Table: Date, Client, Description, Duration, Delivery Link, Actions
   - Group by date
   - "Add Time" button for manual entry

5. **ManualTimeEntryDialog** (`src/components/time-tracking/ManualTimeEntryDialog.tsx`)
   - Client, description, start time, end time (or duration)
   - Creates time_entry with `is_manual=true`

---

## Integration with Existing Features

### DeliveryItem.hours_spent

**Before:** Stored directly on delivery_items table

**After:** Computed from sum of linked time_entries

**Database View:**
```sql
CREATE VIEW delivery_items_with_hours AS
SELECT
  di.*,
  COALESCE(SUM(te.duration_seconds) / 3600.0, 0) as hours_spent
FROM delivery_items di
LEFT JOIN time_entries te ON te.delivery_item_id = di.id
GROUP BY di.id;
```

### Scope Calculations

**Update `src/lib/scope-utils.ts`:**

For `scope_type = 'hours'`:
- Query time_entries linked to deliveries in current scope
- SUM(duration_seconds / 3600)
- Include in-scope deliveries only (is_out_of_scope=false)

For `scope_type = 'deliverables'` or `'custom'`:
- No change (count deliveries or use scope_cost)

---

## Error Handling

1. **Timer running when browser closes** → Resume on next load
2. **Multiple tabs** → Sync via localStorage events
3. **Timer > 12 hours** → Show warning, allow manual adjustment
4. **Network failure** → Retry, show error toast
5. **Client deleted while timer running** → Auto-stop timer

---

## Acceptance Criteria

- ✅ Start timer in <3 clicks
- ✅ Timer visible on all pages
- ✅ Stop timer updates scope calculations
- ✅ Timesheet shows accurate totals
- ✅ Can demo full flow in <2 minutes

---

## Phase 2 (Post-Demo)

- Team member invites + role management
- Assigned client permissions
- Approval workflows (operator reviews team time)
- Billable/non-billable flags
- Reports/exports (CSV, weekly summaries)
- Timer sync across devices (via DB polling)
