import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { cn } from '@/lib/utils';
import { format, isThisWeek, startOfWeek, subWeeks, isAfter } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import type { DeliveryItem } from '@/types/database';

interface DeliveryTimelineProps {
  deliveries: DeliveryItem[];
}

interface TimelineGroup {
  label: string;
  items: DeliveryItem[];
}

function groupDeliveries(deliveries: DeliveryItem[]): TimelineGroup[] {
  const now = new Date();
  const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

  const thisWeek: DeliveryItem[] = [];
  const lastWeek: DeliveryItem[] = [];
  const older: DeliveryItem[] = [];

  for (const delivery of deliveries) {
    const date = new Date(delivery.created_at);
    if (isThisWeek(date, { weekStartsOn: 1 })) {
      thisWeek.push(delivery);
    } else if (isAfter(date, lastWeekStart)) {
      lastWeek.push(delivery);
    } else {
      older.push(delivery);
    }
  }

  const groups: TimelineGroup[] = [];
  if (thisWeek.length) groups.push({ label: 'This Week', items: thisWeek });
  if (lastWeek.length) groups.push({ label: 'Last Week', items: lastWeek });
  if (older.length) groups.push({ label: 'Older', items: older });
  return groups;
}

function TimelineItem({
  delivery,
  isLast,
}: {
  delivery: DeliveryItem;
  isLast: boolean;
}) {
  const isComplete = delivery.status === 'completed' || delivery.status === 'approved';

  return (
    <div className="relative flex gap-3 pb-5 last:pb-0">
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ring-2 ring-background',
            isComplete
              ? 'bg-emerald-500'
              : delivery.status === 'in_progress'
                ? 'border-2 border-indigo-500 bg-background'
                : delivery.status === 'revision_requested'
                  ? 'bg-red-500'
                  : 'bg-amber-500'
          )}
        />
        {!isLast && (
          <div className="w-px flex-1 bg-border mt-1" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <p className="font-medium text-sm truncate">{delivery.title}</p>
          <StatusBadge
            type="delivery"
            status={delivery.status}
            className="flex-shrink-0 text-xs"
          />
        </div>
        {delivery.description && (
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
            {delivery.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {delivery.is_out_of_scope && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0 gap-1 bg-amber-50 text-amber-700">
              <AlertTriangle className="w-3 h-3" />
              Out of scope
            </Badge>
          )}
          {delivery.category && (
            <Badge variant="outline" className="text-xs px-1.5 py-0">
              {delivery.category}
            </Badge>
          )}
          {delivery.hours_spent != null && delivery.hours_spent > 0 && (
            <span className="text-xs text-muted-foreground font-mono">
              {delivery.hours_spent}h
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {format(new Date(delivery.created_at), 'MMM d')}
          </span>
        </div>
      </div>
    </div>
  );
}

export function DeliveryTimeline({ deliveries }: DeliveryTimelineProps) {
  const groups = useMemo(() => groupDeliveries(deliveries), [deliveries]);

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.label}>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            {group.label}
          </h4>
          <div>
            {group.items.map((delivery, idx) => (
              <TimelineItem
                key={delivery.id}
                delivery={delivery}
                isLast={idx === group.items.length - 1}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
