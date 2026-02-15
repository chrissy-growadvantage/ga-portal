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
import { calculateScope, formatScopeValue, type ScopeCalculation } from '@/lib/scope-utils';
import type { ScopeAllocation, DeliveryItem } from '@/types/database';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ScopeTrackerProps {
  allocation: ScopeAllocation;
  deliveries: DeliveryItem[];
  className?: string;
}

const STATUS_ICONS: Record<ScopeStatusTier, React.ElementType> = {
  'on-track': CheckCircle2,
  active: TrendingUp,
  nearing: AlertTriangle,
  'at-limit': ShieldAlert,
  exceeded: Flame,
};

export function ScopeTracker({ allocation, deliveries, className }: ScopeTrackerProps) {
  const calc = useMemo(
    () => calculateScope(allocation, deliveries),
    [allocation, deliveries]
  );

  const statusCfg = SCOPE_STATUS_CONFIG[calc.status];
  const StatusIcon = STATUS_ICONS[calc.status];
  const periodLabel = format(new Date(allocation.period_start), 'MMM yyyy');

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="pt-6 pb-5 space-y-5">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Scope Usage
          </h3>
          <span className="text-xs text-muted-foreground font-medium">{periodLabel}</span>
        </div>

        {/* Numeric summary */}
        <div className="flex items-end justify-between">
          <div>
            <span className="text-2xl font-bold font-mono tracking-tight">
              {calc.totalUsed}
            </span>
            <span className="text-sm text-muted-foreground ml-1.5">
              of {calc.totalAllocated} {calc.unitLabel} used
            </span>
          </div>
          <Badge
            variant="secondary"
            className={cn(
              'gap-1.5 px-2.5 py-1 text-xs font-semibold',
              statusCfg.bgColor,
              statusCfg.color
            )}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            {statusCfg.label}
          </Badge>
        </div>

        {/* Multi-segment progress bar */}
        <ScopeProgressBar calc={calc} />

        {/* Breakdown cards */}
        <div className="grid grid-cols-3 gap-3">
          <BreakdownCard
            label="In-scope"
            value={formatScopeValue(calc.inScopeUsed, calc.unitLabel)}
            accent="bg-success"
          />
          <BreakdownCard
            label="Out-of-scope"
            value={formatScopeValue(calc.outOfScopeUsed, calc.unitLabel)}
            accent="bg-accent-warm"
          />
          <BreakdownCard
            label="Remaining"
            value={formatScopeValue(calc.remaining, calc.unitLabel)}
            accent="bg-muted-foreground/30"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function ScopeProgressBar({ calc }: { calc: ScopeCalculation }) {
  const statusCfg = SCOPE_STATUS_CONFIG[calc.status];
  const total = calc.totalAllocated;

  const inScopePercent = total > 0 ? Math.min((calc.inScopeUsed / total) * 100, 100) : 0;
  const outOfScopePercent = total > 0 ? Math.min((calc.outOfScopeUsed / total) * 100, 100 - inScopePercent) : 0;
  const isExceeded = calc.percentage > 100;
  const overflowPercent = isExceeded ? Math.min(calc.percentage - 100, 30) : 0;

  return (
    <div className="space-y-1.5">
      <div className="relative">
        {/* Track */}
        <div className="h-3 rounded-full bg-muted overflow-hidden relative">
          {/* In-scope fill */}
          <div
            className={cn(
              'absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out',
              statusCfg.barColor
            )}
            style={{ width: `${inScopePercent}%` }}
          />
          {/* Out-of-scope fill (stacked after in-scope) */}
          {calc.outOfScopeUsed > 0 && (
            <div
              className="absolute inset-y-0 rounded-full bg-amber-400/70 transition-all duration-700 ease-out"
              style={{
                left: `${inScopePercent}%`,
                width: `${outOfScopePercent}%`,
              }}
            />
          )}
        </div>

        {/* Overflow indicator for exceeded scope */}
        {isExceeded && (
          <div
            className="absolute top-0 h-3 rounded-r-full bg-red-500 transition-all duration-700 ease-out opacity-90"
            style={{
              left: '100%',
              width: `${overflowPercent}%`,
              marginLeft: '-2px',
            }}
          />
        )}
      </div>

      {/* Percentage label */}
      <div className="flex justify-end">
        <span
          className={cn(
            'text-xs font-mono font-semibold',
            isExceeded ? 'text-red-600' : 'text-muted-foreground'
          )}
        >
          {calc.percentage}%
        </span>
      </div>
    </div>
  );
}

function BreakdownCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-1.5">
      <div className="flex items-center gap-1.5">
        <div className={cn('w-2 h-2 rounded-full', accent)} />
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
      <p className="text-sm font-bold font-mono">{value}</p>
    </div>
  );
}
