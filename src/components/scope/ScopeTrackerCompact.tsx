import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { SCOPE_STATUS_CONFIG } from '@/lib/constants';
import { calculateScope, calculateScopeCompact, type PartialDelivery } from '@/lib/scope-utils';
import type { ScopeAllocation, DeliveryItem } from '@/types/database';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ScopeTrackerCompactProps {
  allocation: ScopeAllocation;
  deliveries: DeliveryItem[] | PartialDelivery[];
  className?: string;
}

function isFullDeliveries(items: DeliveryItem[] | PartialDelivery[]): items is DeliveryItem[] {
  return items.length > 0 && 'id' in items[0];
}

export function ScopeTrackerCompact({
  allocation,
  deliveries,
  className,
}: ScopeTrackerCompactProps) {
  const calc = useMemo(
    () =>
      isFullDeliveries(deliveries)
        ? calculateScope(allocation, deliveries)
        : calculateScopeCompact(allocation, deliveries),
    [allocation, deliveries]
  );

  const statusCfg = SCOPE_STATUS_CONFIG[calc.status];
  const fillPercent = Math.min(calc.percentage, 100);
  const barColor =
    calc.percentage >= 90 ? 'bg-status-danger' :
    calc.percentage >= 80 ? 'bg-status-warning' :
    'bg-primary';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('flex items-center gap-2.5', className)}>
            {/* Status dot */}
            <div className={cn('w-2 h-2 rounded-full shrink-0', statusCfg.dotColor, calc.percentage >= 90 && 'animate-pulse')} />

            {/* Thin progress bar */}
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full animate-progress-fill',
                  barColor
                )}
                style={{
                  '--progress-width': `${fillPercent}%`,
                  width: `${fillPercent}%`,
                } as React.CSSProperties}
              />
            </div>

            {/* Usage label */}
            <span className="text-xs font-mono font-medium text-muted-foreground whitespace-nowrap flex items-center gap-1">
              {calc.percentage >= 80 && (
                <AlertTriangle
                  className={cn(
                    'w-3 h-3 shrink-0',
                    calc.percentage >= 90 ? 'text-status-danger' : 'text-status-warning'
                  )}
                />
              )}
              {calc.totalUsed}/{calc.totalAllocated} {calc.unitLabel}
            </span>

            {/* Mobile status label (tooltip not accessible on touch) */}
            <span className={cn('text-xs font-medium sm:hidden whitespace-nowrap', statusCfg.color)}>
              {statusCfg.label}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <p className="font-semibold">{statusCfg.label}</p>
          <p className="text-muted-foreground">
            {calc.percentage}% used &middot; {calc.remaining} {calc.unitLabel} remaining
          </p>
          {calc.percentage >= 80 && (
            <p className={calc.percentage >= 90 ? 'text-status-danger font-medium' : 'text-status-warning font-medium'}>
              {calc.percentage >= 90 ? 'Scope critical — action needed' : 'Approaching scope limit'}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
