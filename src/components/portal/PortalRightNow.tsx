import { useMemo } from 'react';
import { motion } from 'framer-motion';
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
import { cn } from '@/lib/utils';

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

/** Small SVG progress ring — used in the deliverables stat card */
function ProgressRing({
  value,
  max,
  size = 52,
  strokeWidth = 5,
  className,
}: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circumference * (1 - pct);

  return (
    <svg
      width={size}
      height={size}
      className={cn('-rotate-90', className)}
      aria-hidden="true"
    >
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        className="stroke-muted"
      />
      {/* Progress */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.1, ease: 'easeOut', delay: 0.4 }}
        className="stroke-primary"
      />
    </svg>
  );
}

export function PortalRightNow({
  currentDeliveries,
  currentScopes,
  pendingCount,
  isLoading = false,
}: PortalRightNowProps) {
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

  // Cap ring max at a round number — at least 10 or round up to next 5
  const ringMax = Math.max(10, Math.ceil(totalThisMonth / 5) * 5);

  if (isLoading) {
    return <SkeletonPortalSection />;
  }

  return (
    <section>
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      >
        {/* Card 1: Deliverables This Month — with progress ring */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}
        >
          <Card className="border-border/60 overflow-hidden">
            <CardContent className="pt-5 pb-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Deliverables This Month
              </p>
              <div className="flex items-center gap-4">
                {/* Progress ring */}
                <div className="relative shrink-0">
                  <ProgressRing value={approvedCount} max={ringMax} />
                  <motion.span
                    className="absolute inset-0 flex items-center justify-center text-xl font-bold tracking-tight rotate-90"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                  >
                    {totalThisMonth}
                  </motion.span>
                </div>
                <div className="min-w-0">
                  {approvedCount > 0 ? (
                    <p className="text-xs text-status-success font-medium leading-snug">
                      {approvedCount} approved
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground leading-snug">
                      None approved yet
                    </p>
                  )}
                  {pendingCount > 0 && (
                    <p className="text-xs text-amber-600 font-medium mt-1 leading-snug">
                      {pendingCount} awaiting you
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Card 2: Plan Usage — thicker bar + % label */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}
        >
          <Card className="border-border/60">
            <CardContent className="pt-5 pb-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Plan Usage
              </p>
              {scopeCalc && statusCfg && StatusIcon ? (
                <>
                  {/* Percentage + label inline */}
                  <div className="flex items-baseline justify-between mb-1.5">
                    <motion.span
                      className="text-3xl font-bold tracking-tight font-mono"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                    >
                      {fillPercent}%
                    </motion.span>
                    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', statusCfg.color)}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusCfg.label}
                    </span>
                  </div>

                  {/* Thicker animated progress bar */}
                  <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className={cn('h-full rounded-full', statusCfg.barColor)}
                      initial={{ width: 0 }}
                      animate={{ width: `${fillPercent}%` }}
                      transition={{ duration: 0.9, ease: 'easeOut', delay: 0.35 }}
                    />
                  </div>

                  <p className="text-xs text-muted-foreground mt-2.5">
                    {scopeCalc.totalUsed} / {scopeCalc.totalAllocated}{' '}
                    {scopeCalc.unitLabel.toLowerCase()} — {scopeCalc.remaining} remaining
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No budget set up yet.
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Card 3: Awaiting You — pulses when > 0 */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}
        >
          <Card
            className={cn(
              pendingCount > 0
                ? 'border-amber-400/70 bg-gradient-to-br from-amber-50/80 to-orange-50/40'
                : 'border-border/60',
            )}
          >
            <CardContent className="pt-5 pb-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Awaiting You
              </p>
              <div className="flex items-center gap-3">
                {/* Pulsing ring when > 0 */}
                {pendingCount > 0 && (
                  <div className="relative shrink-0">
                    <span className="absolute inset-0 rounded-full bg-amber-400/30 animate-ping" />
                    <span className="relative flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 border-2 border-amber-400">
                      <motion.span
                        className="text-lg font-bold text-amber-700"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.3, type: 'spring', stiffness: 250 }}
                      >
                        {pendingCount}
                      </motion.span>
                    </span>
                  </div>
                )}
                <div>
                  {pendingCount > 0 ? (
                    <>
                      <motion.p
                        className="text-3xl font-bold tracking-tight text-amber-700"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.25, duration: 0.3, type: 'spring', stiffness: 200 }}
                      >
                        {pendingCount}
                      </motion.p>
                      <p className="text-xs text-amber-700/80 mt-1 font-medium">
                        {pendingCount === 1 ? 'item needs' : 'items need'} your approval
                      </p>
                    </>
                  ) : (
                    <>
                      <motion.p
                        className="text-3xl font-bold tracking-tight"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.25, duration: 0.4 }}
                      >
                        0
                      </motion.p>
                      <p className="text-xs text-status-success mt-1 font-medium">All caught up</p>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </section>
  );
}
