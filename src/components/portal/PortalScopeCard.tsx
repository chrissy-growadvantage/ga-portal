import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { ScopeAllocation, DeliveryItem } from '@/types/database';
import { SCOPE_TYPE_LABELS, SCOPE_STATUS_CONFIG, type ScopeStatusTier } from '@/lib/constants';
import { calculateScope } from '@/lib/scope-utils';
import {
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  Flame,
} from 'lucide-react';

interface PortalScopeCardProps {
  allocation: ScopeAllocation;
  deliveries: DeliveryItem[];
}

const STATUS_ICONS: Record<ScopeStatusTier, React.ElementType> = {
  'on-track': CheckCircle2,
  active: TrendingUp,
  nearing: AlertTriangle,
  'at-limit': ShieldAlert,
  exceeded: Flame,
};

export function PortalScopeCard({ allocation, deliveries }: PortalScopeCardProps) {
  const calc = useMemo(
    () => calculateScope(allocation, deliveries),
    [allocation, deliveries]
  );

  const statusCfg = SCOPE_STATUS_CONFIG[calc.status];
  const StatusIcon = STATUS_ICONS[calc.status];
  const fillPercent = Math.min(calc.percentage, 100);

  const typeLabel = SCOPE_TYPE_LABELS[allocation.scope_type as keyof typeof SCOPE_TYPE_LABELS] || allocation.scope_type;

  return (
    <Card className="border-border/60">
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium">{typeLabel} — {allocation.unit_label}</p>
          </div>
          <div className={`flex items-center gap-1.5 text-xs font-medium ${statusCfg.color}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {statusCfg.label}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full ${statusCfg.barColor} transition-all duration-500 ease-out`}
            style={{ width: `${fillPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">
            {calc.totalUsed} of {calc.totalAllocated} {allocation.unit_label.toLowerCase()} used
          </span>
          <span className="text-xs font-mono text-muted-foreground">
            {calc.percentage}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
