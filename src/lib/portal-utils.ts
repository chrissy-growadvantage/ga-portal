import type { DeliveryItem } from '@/types/database';
import type { PortalScopeRequest } from '@/types/portal';

export type ActivityEventType = 'delivery' | 'request';

export type ActivityEvent = {
  id: string;
  type: ActivityEventType;
  title: string;
  description: string | null;
  status: string;
  category: string | null;
  date: string;
};

/**
 * Merges deliveries and scope requests into a unified, date-sorted activity feed.
 * Excludes deliveries in `excludedIds` (e.g. pending_approval items shown in "Needs Attention").
 */
export function buildActivityEvents(
  deliveries: DeliveryItem[],
  scopeRequests: PortalScopeRequest[],
  excludedDeliveryIds: Set<string> = new Set(),
): ActivityEvent[] {
  const deliveryEvents: ActivityEvent[] = deliveries
    .filter((d) => !excludedDeliveryIds.has(d.id))
    .map((d) => ({
      id: d.id,
      type: 'delivery' as const,
      title: d.title,
      description: d.description,
      status: d.status,
      category: d.category,
      date: d.completed_at ?? d.created_at,
    }));

  const requestEvents: ActivityEvent[] = scopeRequests.map((r) => ({
    id: r.id,
    type: 'request' as const,
    title: r.title,
    description: r.description,
    status: r.status,
    category: null,
    date: r.created_at,
  }));

  return [...deliveryEvents, ...requestEvents].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}
