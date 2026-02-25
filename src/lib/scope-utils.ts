import type { ScopeAllocation, DeliveryItem, TimeEntry } from '@/types/database';
import type { ScopeStatusTier } from '@/lib/constants';

export interface ScopeCalculation {
  totalAllocated: number;
  totalUsed: number;
  inScopeUsed: number;
  outOfScopeUsed: number;
  remaining: number;
  percentage: number;
  status: ScopeStatusTier;
  unitLabel: string;
}

/**
 * Calculate scope usage from delivery items (deliverables/custom scope types).
 */
export function calculateScope(
  allocation: ScopeAllocation,
  deliveries: DeliveryItem[]
): ScopeCalculation {
  // For hours-based scopes, prefer calculateScopeWithTimeEntries
  const relevantDeliveries = deliveries.filter(
    (d) => d.scope_allocation_id === allocation.id || d.scope_allocation_id === null
  );

  const inScopeUsed = relevantDeliveries
    .filter((d) => !d.is_out_of_scope)
    .reduce((sum, d) => sum + (d.scope_cost ?? 0), 0);

  const outOfScopeUsed = relevantDeliveries
    .filter((d) => d.is_out_of_scope)
    .reduce((sum, d) => sum + (d.scope_cost ?? 0), 0);

  const totalUsed = inScopeUsed + outOfScopeUsed;
  const totalAllocated = allocation.total_allocated;
  const remaining = Math.max(0, totalAllocated - totalUsed);
  const percentage = totalAllocated > 0 ? Math.round((totalUsed / totalAllocated) * 100) : 0;

  return {
    totalAllocated,
    totalUsed,
    inScopeUsed,
    outOfScopeUsed,
    remaining,
    percentage,
    status: getScopeStatus(percentage),
    unitLabel: allocation.unit_label,
  };
}

/**
 * Calculate scope usage for hours-based scopes using time entries.
 * Sums duration_seconds from time entries linked to in-scope deliveries.
 */
export function calculateScopeWithTimeEntries(
  allocation: ScopeAllocation,
  deliveries: DeliveryItem[],
  timeEntries: TimeEntry[]
): ScopeCalculation {
  if (allocation.scope_type !== 'hours') {
    return calculateScope(allocation, deliveries);
  }

  const relevantDeliveries = deliveries.filter(
    (d) => d.scope_allocation_id === allocation.id || d.scope_allocation_id === null
  );

  const inScopeDeliveryIds = new Set(
    relevantDeliveries.filter((d) => !d.is_out_of_scope).map((d) => d.id)
  );
  const outOfScopeDeliveryIds = new Set(
    relevantDeliveries.filter((d) => d.is_out_of_scope).map((d) => d.id)
  );

  const inScopeUsed = timeEntries
    .filter((te) => te.delivery_item_id && inScopeDeliveryIds.has(te.delivery_item_id))
    .reduce((sum, te) => sum + (te.duration_seconds ?? 0), 0) / 3600;

  const outOfScopeUsed = timeEntries
    .filter((te) => te.delivery_item_id && outOfScopeDeliveryIds.has(te.delivery_item_id))
    .reduce((sum, te) => sum + (te.duration_seconds ?? 0), 0) / 3600;

  const totalUsed = inScopeUsed + outOfScopeUsed;
  const totalAllocated = allocation.total_allocated;
  const remaining = Math.max(0, totalAllocated - totalUsed);
  const percentage = totalAllocated > 0 ? Math.round((totalUsed / totalAllocated) * 100) : 0;

  return {
    totalAllocated,
    totalUsed,
    inScopeUsed,
    outOfScopeUsed,
    remaining,
    percentage,
    status: getScopeStatus(percentage),
    unitLabel: allocation.unit_label,
  };
}

export function getScopeStatus(percentage: number): ScopeStatusTier {
  if (percentage > 100) return 'exceeded';
  if (percentage === 100) return 'at-limit';
  if (percentage >= 86) return 'nearing';
  if (percentage >= 61) return 'active';
  return 'on-track';
}

export interface PartialDelivery {
  scope_cost: number;
  is_out_of_scope: boolean;
}

export function calculateScopeCompact(
  allocation: ScopeAllocation,
  deliveries: PartialDelivery[]
): ScopeCalculation {
  const inScopeUsed = deliveries
    .filter((d) => !d.is_out_of_scope)
    .reduce((sum, d) => sum + (d.scope_cost ?? 0), 0);

  const outOfScopeUsed = deliveries
    .filter((d) => d.is_out_of_scope)
    .reduce((sum, d) => sum + (d.scope_cost ?? 0), 0);

  const totalUsed = inScopeUsed + outOfScopeUsed;
  const totalAllocated = allocation.total_allocated;
  const remaining = Math.max(0, totalAllocated - totalUsed);
  const percentage = totalAllocated > 0 ? Math.round((totalUsed / totalAllocated) * 100) : 0;

  return {
    totalAllocated,
    totalUsed,
    inScopeUsed,
    outOfScopeUsed,
    remaining,
    percentage,
    status: getScopeStatus(percentage),
    unitLabel: allocation.unit_label,
  };
}

export function formatScopeValue(value: number, unitLabel: string): string {
  const rounded = Number.isInteger(value) ? value : Number(value.toFixed(1));
  return `${rounded} ${unitLabel}`;
}
