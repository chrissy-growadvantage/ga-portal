import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  Flame,
} from 'lucide-react';
import { SCOPE_STATUS_CONFIG, type ScopeStatusTier } from '@/lib/constants';
import { calculateScope, type ScopeCalculation } from '@/lib/scope-utils';
import type { ScopeAllocation, DeliveryItem } from '@/types/database';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScopeAlertBanner } from '@/components/scope/ScopeAlertBanner';

interface ScopeTrackerProps {
  allocation: ScopeAllocation;
  deliveries: DeliveryItem[];
  clientName?: string;
  className?: string;
}

const STATUS_ICONS: Record<ScopeStatusTier, React.ElementType> = {
  'on-track': CheckCircle2,
  active: TrendingUp,
  nearing: AlertTriangle,
  'at-limit': ShieldAlert,
  exceeded: Flame,
};

export function ScopeTracker({ allocation, deliveries, clientName, className }: ScopeTrackerProps) {
  const calc = useMemo(
    () => calculateScope(allocation, deliveries),
    [allocation, deliveries]
  );

  const statusCfg = SCOPE_STATUS_CONFIG[calc.status];
  const StatusIcon = STATUS_ICONS[calc.status];
  const periodLabel = format(new Date(allocation.period_start), 'MMM yyyy');

  const remaining = Math.max(0, calc.totalAllocated - calc.totalUsed);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    deliveries.forEach(d => {
      if (d.category && d.hours_spent) {
        map.set(d.category, (map.get(d.category) ?? 0) + d.hours_spent);
      }
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [deliveries]);

  const barColor =
    calc.percentage >= 90 ? 'bg-status-danger' :
    calc.percentage >= 80 ? 'bg-status-warning' :
    'bg-primary';

  const fillPercent = Math.min(calc.percentage, 100);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="pt-5 pb-5 space-y-4">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Scope Tracker</h3>
            <p className="text-xs text-muted-foreground">Monthly allocation hours</p>
          </div>
          <span className="text-xs text-muted-foreground font-medium">{periodLabel}</span>
        </div>

        {/* Numeric summary */}
        <div className="flex items-end justify-between">
          <div>
            <span className="text-3xl font-bold font-mono tracking-tight">
              {calc.totalUsed}
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">hrs used</p>
          </div>
          <span className="text-sm text-muted-foreground font-medium">
            {remaining} remaining
          </span>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-700 ease-out',
                barColor
              )}
              style={{ width: `${fillPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <Badge
              variant="secondary"
              className={cn(
                'gap-1 px-2 py-0.5 text-xs font-medium',
                statusCfg.bgColor,
                statusCfg.color
              )}
            >
              <StatusIcon className="w-3 h-3" />
              {statusCfg.label}
            </Badge>
            <span
              className={cn(
                'text-xs font-mono font-semibold',
                calc.percentage > 100 ? 'text-status-danger' : 'text-muted-foreground'
              )}
            >
              {calc.percentage}%
            </span>
          </div>
        </div>

        {/* Alert banner */}
        {calc.percentage >= 80 && (
          <ScopeAlertBanner
            percentage={calc.percentage}
            clientName={clientName}
            unitLabel={calc.unitLabel}
            totalUsed={calc.totalUsed}
            totalAllocated={calc.totalAllocated}
          />
        )}

        {/* By Category */}
        {byCategory.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              By Category
            </p>
            <div className="space-y-1.5">
              {byCategory.map(([category, hours]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{category}</span>
                  <span className="text-sm font-mono text-muted-foreground">{hours} hrs</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
