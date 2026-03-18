import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle2, ChevronDown, Briefcase } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { DELIVERY_STATUS_CONFIG } from '@/lib/constants';
import type { DeliveryItem } from '@/types/database';

type PortalWorkVisibilityProps = {
  deliveries: DeliveryItem[];
  pastByMonth: Record<string, DeliveryItem[]>;
  pastMonthKeys: string[];
};

function DeliveryBadge({ label }: { label: string }) {
  return (
    <Badge variant="outline" className="text-xs px-1.5 py-0 font-normal">
      {label}
    </Badge>
  );
}

function InProgressCard({ item }: { item: DeliveryItem }) {
  const statusCfg = DELIVERY_STATUS_CONFIG[item.status];

  return (
    <div className="rounded-lg border border-border/60 bg-background p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{item.title}</p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <Badge
              variant="secondary"
              className={cn('text-xs', statusCfg.color)}
            >
              {statusCfg.label}
            </Badge>
            <DeliveryBadge label={item.category} />
            {item.phase && <DeliveryBadge label={item.phase} />}
            {item.uplift && <DeliveryBadge label={item.uplift} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function CompletedItem({ item, index }: { item: DeliveryItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
      className="flex items-center gap-2.5 py-2.5 px-2"
    >
      <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground truncate">{item.title}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {item.completed_at && (
          <span className="text-[10px] text-muted-foreground/60">
            {format(parseISO(item.completed_at), 'MMM d')}
          </span>
        )}
        <DeliveryBadge label={item.category} />
      </div>
    </motion.div>
  );
}

export function PortalWorkVisibility({
  deliveries,
  pastByMonth,
  pastMonthKeys,
}: PortalWorkVisibilityProps) {
  const inProgress = deliveries.filter((d) => d.status === 'in_progress');
  const completedThisMonth = deliveries.filter(
    (d) => d.status === 'completed' || d.status === 'approved',
  );

  const hasAnyContent =
    inProgress.length > 0 ||
    completedThisMonth.length > 0 ||
    pastMonthKeys.length > 0;

  if (!hasAnyContent) {
    return (
      <Card className="border-border/60">
        <CardContent className="py-10 text-center">
          <Briefcase className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No work activity yet this period.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Working On */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          What We're Working On
        </h3>
        {inProgress.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing in progress right now.</p>
        ) : (
          <div className="space-y-2">
            {inProgress.map((item) => (
              <InProgressCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* Completed This Month */}
      {completedThisMonth.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Delivered For You This Month{' '}
            <span className="text-foreground ml-1">({completedThisMonth.length})</span>
          </h3>
          <Card className="border-border/40 bg-muted/10">
            <CardContent className="p-4 divide-y divide-border/30">
              {completedThisMonth.map((item, index) => (
                <CompletedItem key={item.id} item={item} index={index} />
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Past Months */}
      {pastMonthKeys.length > 0 && (
        <motion.div className="space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          {pastMonthKeys.map((monthKey) => {
            const items = pastByMonth[monthKey];
            const date = new Date(monthKey + '-01');
            const completed = items.filter(
              (d) => d.status === 'completed' || d.status === 'approved',
            ).length;

            return (
              <PastMonthCollapsible
                key={monthKey}
                monthKey={monthKey}
                date={date}
                items={items}
                completedCount={completed}
                defaultOpen={monthKey === pastMonthKeys[0]}
              />
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}

function PastMonthCollapsible({
  monthKey,
  date,
  items,
  completedCount,
  defaultOpen = false,
}: {
  monthKey: string;
  date: Date;
  items: DeliveryItem[];
  completedCount: number;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible key={monthKey} open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Card className="border-border/60 cursor-pointer hover:bg-muted/30 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{format(date, 'MMMM yyyy')}</p>
              <p className="text-xs text-muted-foreground">
                {completedCount}/{items.length} completed
              </p>
            </div>
            <ChevronDown
              className={cn('w-4 h-4 text-muted-foreground transition-transform', open && 'rotate-180')}
            />
          </CardContent>
        </Card>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-3 space-y-1 pl-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2.5 py-2.5 text-sm text-muted-foreground"
            >
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full shrink-0',
                  item.status === 'completed' || item.status === 'approved'
                    ? 'bg-status-success'
                    : 'bg-muted-foreground/30',
                )}
              />
              <span className="truncate">{item.title}</span>
              <DeliveryBadge label={item.category} />
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
