import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  Flame,
} from 'lucide-react';
import { calculateScope } from '@/lib/scope-utils';
import { SCOPE_STATUS_CONFIG, type ScopeStatusTier } from '@/lib/constants';
import { SkeletonPortalSection } from '@/components/ui/skeleton-patterns';
import type { DeliveryItem, ScopeAllocation } from '@/types/database';
import type { PortalClient } from '@/types/portal';

type PortalRightNowProps = {
  client: PortalClient;
  currentDeliveries: DeliveryItem[];
  currentScopes: ScopeAllocation[];
  pendingCount: number;
  scopePercentage: number;
  isLoading?: boolean;
};

const STATUS_ICONS: Record<ScopeStatusTier, React.ElementType> = {
  'on-track': CheckCircle2,
  active: TrendingUp,
  nearing: AlertTriangle,
  'at-limit': ShieldAlert,
  exceeded: Flame,
};

export function PortalRightNow({
  currentDeliveries,
  currentScopes,
  pendingCount,
  isLoading = false,
}: PortalRightNowProps) {
  if (isLoading) {
    return <SkeletonPortalSection />;
  }

  const scopeCalc = useMemo(() => {
    if (currentScopes.length === 0) return null;
    return calculateScope(currentScopes[0], currentDeliveries);
  }, [currentScopes, currentDeliveries]);

  const statusCfg = scopeCalc ? SCOPE_STATUS_CONFIG[scopeCalc.status] : null;
  const StatusIcon = scopeCalc ? STATUS_ICONS[scopeCalc.status] : null;
  const fillPercent = scopeCalc ? Math.min(scopeCalc.percentage, 100) : 0;

  const totalThisMonth = currentDeliveries.length + pendingCount;

  const approvedCount = currentDeliveries.filter(
    (d) => d.status === 'completed' || d.status === 'approved',
  ).length;

  return (
    <section>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Deliveries This Month */}
        <Card className="border-border/60">
          <CardContent className="pt-5 pb-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Deliveries This Month
            </p>
            <p className="text-4xl font-bold tracking-tight">{totalThisMonth}</p>
            {approvedCount > 0 ? (
              <p className="text-xs text-status-success mt-2">
                {approvedCount} approved this month
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-2">
                None approved yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Plan Usage */}
        <Card className="border-border/60">
          <CardContent className="pt-5 pb-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Plan Usage
            </p>
            {scopeCalc && statusCfg && StatusIcon ? (
              <>
                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-2xl font-bold font-mono">
                    {scopeCalc.totalUsed}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / {scopeCalc.totalAllocated}{' '}
                    {scopeCalc.unitLabel.toLowerCase()} used
                  </span>
                </div>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-medium ${statusCfg.color}`}
                >
                  <StatusIcon className="w-3.5 h-3.5" />
                  {statusCfg.label}
                </span>
                <div className="h-1.5 w-full rounded-full bg-muted mt-3">
                  <div
                    className={`h-full rounded-full ${statusCfg.barColor} transition-all duration-500 ease-out`}
                    style={{ width: `${fillPercent}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {scopeCalc.remaining} {scopeCalc.unitLabel.toLowerCase()}{' '}
                  still available
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No budget set up yet — ask your team if you have questions.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Card 3: Awaiting You */}
        <Card className="border-border/60">
          <CardContent className="pt-5 pb-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Awaiting You
            </p>
            <p
              className={`text-4xl font-bold tracking-tight ${pendingCount > 0 ? 'text-status-warning' : ''}`}
            >
              {pendingCount}
            </p>
            {pendingCount > 0 ? (
              <p className="text-xs text-muted-foreground mt-2">
                items pending your approval
              </p>
            ) : (
              <p className="text-xs text-status-success mt-2">All caught up</p>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
