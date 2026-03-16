import { describe, it, expect } from 'vitest';
import {
  getScopeStatus,
  calculateScope,
  calculateScopeCompact,
  calculateScopeWithTimeEntries,
  formatScopeValue,
} from '@/lib/scope-utils';
import type { ScopeAllocation, DeliveryItem, TimeEntry } from '@/types/database';

// ─── Factories ────────────────────────────────────────────────────────────────

function makeAllocation(overrides: Partial<ScopeAllocation> = {}): ScopeAllocation {
  return {
    id: 'alloc-1',
    client_id: 'client-1',
    operator_id: 'op-1',
    scope_type: 'deliverables',
    total_allocated: 100,
    unit_label: 'deliverables',
    price_per_unit: null,
    notes: null,
    reset_cadence: null,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeDelivery(overrides: Partial<DeliveryItem> = {}): DeliveryItem {
  return {
    id: 'delivery-1',
    client_id: 'client-1',
    operator_id: 'op-1',
    title: 'Test Delivery',
    description: null,
    category: 'Design',
    phase: null,
    uplift: null,
    status: 'completed',
    scope_cost: 10,
    is_out_of_scope: false,
    scope_allocation_id: 'alloc-1',
    completed_at: '2024-01-15T00:00:00Z',
    attachment_url: null,
    work_status: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeTimeEntry(overrides: Partial<TimeEntry> = {}): TimeEntry {
  return {
    id: 'te-1',
    operator_id: 'op-1',
    client_id: 'client-1',
    delivery_item_id: 'delivery-1',
    duration_seconds: 3600, // 1 hour
    notes: null,
    started_at: '2024-01-01T09:00:00Z',
    ended_at: '2024-01-01T10:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// ─── getScopeStatus ───────────────────────────────────────────────────────────

describe('getScopeStatus', () => {
  it('returns on-track for 0%', () => {
    expect(getScopeStatus(0)).toBe('on-track');
  });

  it('returns on-track for 60%', () => {
    expect(getScopeStatus(60)).toBe('on-track');
  });

  it('returns active for 61%', () => {
    expect(getScopeStatus(61)).toBe('active');
  });

  it('returns active for 85%', () => {
    expect(getScopeStatus(85)).toBe('active');
  });

  it('returns nearing for 86%', () => {
    expect(getScopeStatus(86)).toBe('nearing');
  });

  it('returns nearing for 99%', () => {
    expect(getScopeStatus(99)).toBe('nearing');
  });

  it('returns at-limit for exactly 100%', () => {
    expect(getScopeStatus(100)).toBe('at-limit');
  });

  it('returns exceeded for 101%', () => {
    expect(getScopeStatus(101)).toBe('exceeded');
  });

  it('returns exceeded for 150%', () => {
    expect(getScopeStatus(150)).toBe('exceeded');
  });
});

// ─── calculateScope ───────────────────────────────────────────────────────────

describe('calculateScope', () => {
  describe('happy path', () => {
    it('calculates basic in-scope usage', () => {
      const allocation = makeAllocation({ total_allocated: 100 });
      const deliveries = [
        makeDelivery({ scope_cost: 30, is_out_of_scope: false }),
        makeDelivery({ id: 'd2', scope_cost: 20, is_out_of_scope: false }),
      ];
      const result = calculateScope(allocation, deliveries);

      expect(result.totalAllocated).toBe(100);
      expect(result.inScopeUsed).toBe(50);
      expect(result.outOfScopeUsed).toBe(0);
      expect(result.totalUsed).toBe(50);
      expect(result.remaining).toBe(50);
      expect(result.percentage).toBe(50);
      expect(result.status).toBe('on-track');
      expect(result.unitLabel).toBe('deliverables');
    });

    it('tracks out-of-scope usage separately', () => {
      const allocation = makeAllocation({ total_allocated: 10 });
      const deliveries = [
        makeDelivery({ scope_cost: 8, is_out_of_scope: false }),
        makeDelivery({ id: 'd2', scope_cost: 3, is_out_of_scope: true }),
      ];
      const result = calculateScope(allocation, deliveries);

      expect(result.inScopeUsed).toBe(8);
      expect(result.outOfScopeUsed).toBe(3);
      expect(result.totalUsed).toBe(11);
      expect(result.percentage).toBe(110); // 11/10 = 110%
      expect(result.status).toBe('exceeded');
    });
  });

  describe('edge cases', () => {
    it('returns 0% when total_allocated is 0', () => {
      const allocation = makeAllocation({ total_allocated: 0 });
      const deliveries = [makeDelivery({ scope_cost: 10 })];
      const result = calculateScope(allocation, deliveries);

      expect(result.percentage).toBe(0);
    });

    it('returns 0 remaining when exceeded, not negative', () => {
      const allocation = makeAllocation({ total_allocated: 10 });
      const deliveries = [makeDelivery({ scope_cost: 20 })];
      const result = calculateScope(allocation, deliveries);

      expect(result.remaining).toBe(0);
    });

    it('handles empty deliveries array', () => {
      const allocation = makeAllocation({ total_allocated: 100 });
      const result = calculateScope(allocation, []);

      expect(result.totalUsed).toBe(0);
      expect(result.percentage).toBe(0);
      expect(result.status).toBe('on-track');
    });

    it('only includes deliveries for this allocation or null allocation_id', () => {
      const allocation = makeAllocation({ id: 'alloc-A', total_allocated: 100 });
      const deliveries = [
        makeDelivery({ scope_cost: 50, scope_allocation_id: 'alloc-A' }),
        makeDelivery({ id: 'd2', scope_cost: 20, scope_allocation_id: 'alloc-B' }), // different allocation — excluded
        makeDelivery({ id: 'd3', scope_cost: 10, scope_allocation_id: null }), // null — included
      ];
      const result = calculateScope(allocation, deliveries);

      expect(result.inScopeUsed).toBe(60); // 50 + 10
    });
  });
});

// ─── calculateScopeCompact ────────────────────────────────────────────────────

describe('calculateScopeCompact', () => {
  it('works with partial delivery objects', () => {
    const allocation = makeAllocation({ total_allocated: 50 });
    const deliveries = [
      { scope_cost: 20, is_out_of_scope: false },
      { scope_cost: 5, is_out_of_scope: true },
    ];
    const result = calculateScopeCompact(allocation, deliveries);

    expect(result.inScopeUsed).toBe(20);
    expect(result.outOfScopeUsed).toBe(5);
    expect(result.totalUsed).toBe(25);
    expect(result.percentage).toBe(50);
  });

  it('returns same percentage as calculateScope for equivalent data', () => {
    const allocation = makeAllocation({ total_allocated: 100 });
    const delivery = makeDelivery({ scope_cost: 75, is_out_of_scope: false });
    const compact = calculateScopeCompact(allocation, [delivery]);
    const full = calculateScope(allocation, [delivery]);

    expect(compact.percentage).toBe(full.percentage);
  });
});

// ─── calculateScopeWithTimeEntries ────────────────────────────────────────────

describe('calculateScopeWithTimeEntries', () => {
  describe('hours scope type', () => {
    it('sums time entries for in-scope deliveries', () => {
      const allocation = makeAllocation({
        scope_type: 'hours',
        total_allocated: 10, // 10 hours
        unit_label: 'hours',
      });
      const delivery = makeDelivery({ scope_allocation_id: 'alloc-1', is_out_of_scope: false });
      const timeEntry = makeTimeEntry({ delivery_item_id: 'delivery-1', duration_seconds: 7200 }); // 2 hours

      const result = calculateScopeWithTimeEntries(allocation, [delivery], [timeEntry]);

      expect(result.inScopeUsed).toBe(2); // 7200s / 3600 = 2h
      expect(result.percentage).toBe(20); // 2/10 = 20%
    });

    it('handles out-of-scope time entries separately', () => {
      const allocation = makeAllocation({
        scope_type: 'hours',
        total_allocated: 10,
        unit_label: 'hours',
      });
      const inScopeDelivery = makeDelivery({ id: 'in-1', is_out_of_scope: false, scope_allocation_id: 'alloc-1' });
      const outDelivery = makeDelivery({ id: 'out-1', is_out_of_scope: true, scope_allocation_id: 'alloc-1' });
      const inTime = makeTimeEntry({ id: 'te-in', delivery_item_id: 'in-1', duration_seconds: 3600 });
      const outTime = makeTimeEntry({ id: 'te-out', delivery_item_id: 'out-1', duration_seconds: 1800 });

      const result = calculateScopeWithTimeEntries(allocation, [inScopeDelivery, outDelivery], [inTime, outTime]);

      expect(result.inScopeUsed).toBe(1); // 1 hour
      expect(result.outOfScopeUsed).toBe(0.5); // 0.5 hours
    });
  });

  describe('non-hours scope type', () => {
    it('falls back to calculateScope for deliverables type', () => {
      const allocation = makeAllocation({ scope_type: 'deliverables', total_allocated: 100 });
      const delivery = makeDelivery({ scope_cost: 40 });
      const result = calculateScopeWithTimeEntries(allocation, [delivery], []);

      // Should use delivery scope_cost, not time entries
      expect(result.inScopeUsed).toBe(40);
    });
  });
});

// ─── formatScopeValue ─────────────────────────────────────────────────────────

describe('formatScopeValue', () => {
  it('formats integer value without decimal', () => {
    expect(formatScopeValue(5, 'deliverables')).toBe('5 deliverables');
  });

  it('formats decimal to 1 decimal place', () => {
    expect(formatScopeValue(2.5, 'hours')).toBe('2.5 hours');
  });

  it('strips trailing zeros from decimals', () => {
    expect(formatScopeValue(3.0, 'tasks')).toBe('3 tasks');
  });

  it('handles zero', () => {
    expect(formatScopeValue(0, 'items')).toBe('0 items');
  });
});
