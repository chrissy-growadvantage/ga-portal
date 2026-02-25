import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { DeliveryItem } from '@/types/database';
import { CheckCircle2, Clock, MessageSquare } from 'lucide-react';
import { format, isThisWeek, isThisMonth, subWeeks, isWithinInterval } from 'date-fns';

interface PortalTimelineProps {
  deliveries: DeliveryItem[];
}

function getPortalStatus(status: string) {
  switch (status) {
    case 'completed':
    case 'approved':
      return { label: 'Done', icon: CheckCircle2, className: 'text-green-600' };
    case 'pending_approval':
      return { label: 'Needs your input', icon: MessageSquare, className: 'text-amber-600' };
    case 'revision_requested':
      return { label: 'Changes requested', icon: MessageSquare, className: 'text-amber-600' };
    default:
      return { label: 'In progress', icon: Clock, className: 'text-muted-foreground' };
  }
}

function groupDeliveries(deliveries: DeliveryItem[]) {
  const now = new Date();
  const lastWeekStart = subWeeks(now, 1);

  const thisWeek: DeliveryItem[] = [];
  const lastWeek: DeliveryItem[] = [];
  const earlier: DeliveryItem[] = [];

  for (const d of deliveries) {
    const date = new Date(d.completed_at || d.created_at);
    if (isThisWeek(date, { weekStartsOn: 1 })) {
      thisWeek.push(d);
    } else if (isWithinInterval(date, { start: lastWeekStart, end: now }) || isThisMonth(date)) {
      lastWeek.push(d);
    } else {
      earlier.push(d);
    }
  }

  return { thisWeek, lastWeek, earlier };
}

function TimelineGroup({ label, items }: { label: string; items: DeliveryItem[] }) {
  if (items.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        {label}
      </p>
      <div className="space-y-2">
        {items.map((item, i) => {
          const status = getPortalStatus(item.status);
          const StatusIcon = status.icon;
          return (
            <div
              key={item.id}
              className="flex items-start gap-3 py-3 px-4 rounded-lg bg-white border border-border/40"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <StatusIcon className={`w-4 h-4 mt-0.5 shrink-0 ${status.className}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{item.title}</p>
                  <Badge
                    variant="secondary"
                    className="text-xs shrink-0 font-normal"
                  >
                    {status.label}
                  </Badge>
                </div>
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {item.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant="outline" className="text-xs px-1.5 py-0">
                    {item.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(item.completed_at || item.created_at), 'MMM d')}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PortalTimeline({ deliveries }: PortalTimelineProps) {
  const { thisWeek, lastWeek, earlier } = groupDeliveries(deliveries);

  if (deliveries.length === 0) {
    return (
      <Card className="border-border/60">
        <CardContent className="py-10 text-center">
          <Clock className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No deliveries yet this period.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <section>
      <h2 className="text-base font-semibold mb-4">Recent Deliveries</h2>
      <div className="space-y-5">
        <TimelineGroup label="This Week" items={thisWeek} />
        <TimelineGroup label="Earlier This Month" items={lastWeek} />
        <TimelineGroup label="Previous" items={earlier} />
      </div>
    </section>
  );
}
