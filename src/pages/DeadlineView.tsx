import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TypedStatusBadge } from '@/components/ui/status-badge';
import {
  format,
  parseISO,
  isBefore,
  isAfter,
  startOfDay,
  startOfWeek,
  endOfWeek,
  addWeeks,
} from 'date-fns';
import type { DeliveryItem } from '@/types/database';

// DeliveryItem doesn't yet have due_date in the TS types — it's added via migration
// We extend locally until the type is updated centrally
type DeliveryWithDueDateAndClient = DeliveryItem & {
  due_date: string;
  clients: {
    id: string;
    company_name: string;
    contact_name: string | null;
  } | null;
};

type DeadlineGroup = {
  label: string;
  accentClass: string;
  items: DeliveryWithDueDateAndClient[];
};

function groupByDeadline(items: DeliveryWithDueDateAndClient[]): DeadlineGroup[] {
  const today = startOfDay(new Date());
  const thisWeekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const nextWeekStart = addWeeks(startOfWeek(today, { weekStartsOn: 1 }), 1);
  const nextWeekEnd = endOfWeek(nextWeekStart, { weekStartsOn: 1 });

  const overdue: DeliveryWithDueDateAndClient[] = [];
  const thisWeek: DeliveryWithDueDateAndClient[] = [];
  const nextWeek: DeliveryWithDueDateAndClient[] = [];
  const later: DeliveryWithDueDateAndClient[] = [];

  for (const item of items) {
    const due = parseISO(item.due_date);
    if (isBefore(due, today)) {
      overdue.push(item);
    } else if (!isAfter(due, thisWeekEnd)) {
      thisWeek.push(item);
    } else if (!isAfter(due, nextWeekEnd)) {
      nextWeek.push(item);
    } else {
      later.push(item);
    }
  }

  const groups: DeadlineGroup[] = [];
  if (overdue.length > 0) {
    groups.push({ label: 'Overdue', accentClass: 'border-l-status-danger', items: overdue });
  }
  if (thisWeek.length > 0) {
    groups.push({ label: 'This Week', accentClass: 'border-l-status-warning', items: thisWeek });
  }
  if (nextWeek.length > 0) {
    groups.push({ label: 'Next Week', accentClass: 'border-l-status-info', items: nextWeek });
  }
  if (later.length > 0) {
    groups.push({ label: 'Later', accentClass: 'border-l-border', items: later });
  }
  return groups;
}

export default function DeadlineView() {
  const { user } = useAuth();

  const { data: rawItems = [], isLoading } = useQuery({
    queryKey: ['deliveries', 'with-due-dates'] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_items')
        .select('*, clients(id, company_name, contact_name)')
        .not('due_date', 'is', null)
        .neq('status', 'completed')
        .neq('status', 'approved')
        .order('due_date', { ascending: true });

      if (error) throw error;
      return (data ?? []) as DeliveryWithDueDateAndClient[];
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const groups = useMemo(() => groupByDeadline(rawItems), [rawItems]);

  const clientName = (item: DeliveryWithDueDateAndClient) =>
    item.clients?.company_name || item.clients?.contact_name || 'Unknown Client';

  const clientId = (item: DeliveryWithDueDateAndClient) =>
    item.clients?.id ?? item.client_id;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Upcoming deadlines across all clients
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-14 w-full rounded-lg" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : rawItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <CalendarDays className="w-12 h-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold">No upcoming deadlines set</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Add due dates to deliveries to see them here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <Card key={group.label} className={`border-l-4 ${group.accentClass}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">{group.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <TypedStatusBadge type="delivery" status={item.status} className="text-[10px]" />
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <Link
                          to={`/clients/${clientId(item)}`}
                          className="text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                          {clientName(item)}
                        </Link>
                        {item.hours_spent != null && item.hours_spent > 0 && (
                          <span className="text-xs text-muted-foreground font-mono">
                            {item.hours_spent}h
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-medium font-mono text-muted-foreground">
                        {format(parseISO(item.due_date), 'MMM d')}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {format(parseISO(item.due_date), 'yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
