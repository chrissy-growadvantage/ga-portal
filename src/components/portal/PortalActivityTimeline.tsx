import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  CheckCircle2,
  Clock,
  MessageSquare,
  Info,
  ChevronDown,
  Plus,
} from 'lucide-react';
import { format, isThisWeek, isThisMonth } from 'date-fns';
import type { ActivityEvent } from '@/lib/portal-utils';
import type { DeliveryItem } from '@/types/database';

type PortalActivityTimelineProps = {
  events: ActivityEvent[];
  pastByMonth: Record<string, DeliveryItem[]>;
  pastMonthKeys: string[];
  onRequestSomething: () => void;
};

function getEventIcon(event: ActivityEvent) {
  if (event.type === 'request') {
    return { icon: Info, className: 'text-primary' };
  }
  switch (event.status) {
    case 'completed':
    case 'approved':
      return { icon: CheckCircle2, className: 'text-status-success' };
    case 'pending_approval':
      return { icon: MessageSquare, className: 'text-status-warning' };
    case 'revision_requested':
      return { icon: MessageSquare, className: 'text-status-warning' };
    default:
      return { icon: Clock, className: 'text-muted-foreground' };
  }
}

function getEventBadge(event: ActivityEvent) {
  if (event.type === 'request') {
    const statusLabel =
      event.status === 'pending'
        ? 'Pending'
        : event.status.charAt(0).toUpperCase() + event.status.slice(1);
    return { label: 'Request', className: 'bg-status-info/10 text-status-info', statusLabel };
  }
  return { label: 'Delivery', className: 'bg-status-success/10 text-status-success', statusLabel: null };
}

function groupEvents(events: ActivityEvent[]) {
  const thisWeek: ActivityEvent[] = [];
  const earlierThisMonth: ActivityEvent[] = [];

  for (const e of events) {
    const date = new Date(e.date);
    if (isThisWeek(date, { weekStartsOn: 1 })) {
      thisWeek.push(e);
    } else if (isThisMonth(date)) {
      earlierThisMonth.push(e);
    } else {
      earlierThisMonth.push(e);
    }
  }

  return { thisWeek, earlierThisMonth };
}

function EventRow({ event }: { event: ActivityEvent }) {
  const { icon: Icon, className: iconClass } = getEventIcon(event);
  const badge = getEventBadge(event);

  return (
    <div className="flex items-start gap-3 py-3 px-4 rounded-lg bg-white border border-border/40">
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${iconClass}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium">{event.title}</p>
          <Badge
            variant="secondary"
            className={`text-xs shrink-0 font-normal ${badge.className}`}
          >
            {badge.label}
          </Badge>
        </div>
        {event.type === 'request' && badge.statusLabel && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {badge.statusLabel}
            {event.status === 'approved' && ' ·'}{' '}
          </p>
        )}
        {event.description && event.type === 'delivery' && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {event.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          {event.category && (
            <Badge variant="outline" className="text-xs px-1.5 py-0">
              {event.category}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {format(new Date(event.date), 'MMM d')}
          </span>
        </div>
      </div>
    </div>
  );
}

function EventGroup({
  label,
  events,
}: {
  label: string;
  events: ActivityEvent[];
}) {
  if (events.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        {label}
      </p>
      <div className="space-y-2">
        {events.map((event) => (
          <EventRow key={`${event.type}-${event.id}`} event={event} />
        ))}
      </div>
    </div>
  );
}

export function PortalActivityTimeline({
  events,
  pastByMonth,
  pastMonthKeys,
  onRequestSomething,
}: PortalActivityTimelineProps) {
  const { thisWeek, earlierThisMonth } = groupEvents(events);

  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Activity
      </h2>

      {events.length === 0 && pastMonthKeys.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="py-10 text-center">
            <Clock className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No activity yet this period.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          <EventGroup label="This Week" events={thisWeek} />
          <EventGroup label="Earlier This Month" events={earlierThisMonth} />
        </div>
      )}

      {/* Request Something CTA */}
      <div className="mt-5 text-center">
        <Button onClick={onRequestSomething} className="gap-2">
          <Plus className="w-4 h-4" />
          Need something else? Request it here
        </Button>
      </div>

      {/* Past months collapsible */}
      {pastMonthKeys.length > 0 && (
        <div className="mt-6 space-y-2">
          {pastMonthKeys.map((monthKey) => {
            const items = pastByMonth[monthKey];
            const date = new Date(monthKey + '-01');
            const completed = items.filter(
              (d) => d.status === 'completed' || d.status === 'approved',
            ).length;
            const totalCost = items.reduce(
              (s, d) => s + (d.scope_cost || 0),
              0,
            );

            return (
              <Collapsible key={monthKey}>
                <CollapsibleTrigger asChild>
                  <Card className="border-border/60 cursor-pointer hover:bg-muted/30 transition-colors">
                    <CardContent className="py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          {format(date, 'MMMM yyyy')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {completed}/{items.length} completed
                          {totalCost > 0 && ` · ${totalCost} units`}
                        </p>
                      </div>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 space-y-1.5 pl-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 py-1.5 text-sm text-muted-foreground"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            item.status === 'completed' ||
                            item.status === 'approved'
                              ? 'bg-status-success'
                              : 'bg-muted-foreground/30'
                          }`}
                        />
                        <span className="truncate">{item.title}</span>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      )}
    </section>
  );
}
