import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type ScopeAlertBannerProps = {
  percentage: number;
  clientName?: string;
  unitLabel: string;
  totalUsed: number;
  totalAllocated: number;
  action?: { label: string; onClick: () => void };
};

export function ScopeAlertBanner({ percentage, clientName, unitLabel, totalUsed, totalAllocated, action }: ScopeAlertBannerProps) {
  if (percentage < 80) return null;

  const isCritical = percentage >= 90;
  const Icon = isCritical ? ShieldAlert : AlertTriangle;
  const title = isCritical
    ? `Scope ${percentage >= 100 ? 'exceeded' : 'critical'}${clientName ? ` — ${clientName}` : ''}`
    : `Scope nearing limit${clientName ? ` — ${clientName}` : ''}`;
  const description = `${totalUsed} of ${totalAllocated} ${unitLabel} used (${percentage}%)`;

  return (
    <Card className={cn(
      'border',
      isCritical ? 'border-status-danger/30 bg-status-danger/5' : 'border-status-warning/30 bg-status-warning/5'
    )}>
      <CardContent className="py-3 flex items-start gap-3">
        <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', isCritical ? 'text-status-danger' : 'text-status-warning')} />
        <div className="flex-1">
          <p className={cn('text-sm font-medium', isCritical ? 'text-status-danger' : 'text-status-warning')}>
            {title}
          </p>
          <p className={cn('text-xs mt-0.5 opacity-80', isCritical ? 'text-status-danger' : 'text-status-warning')}>
            {description}
          </p>
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className={cn(
              'shrink-0 text-xs font-medium px-3 py-1 rounded-md border transition-colors',
              isCritical
                ? 'border-status-danger/30 text-status-danger hover:bg-status-danger/10'
                : 'border-status-warning/30 text-status-warning hover:bg-status-warning/10'
            )}
          >
            {action.label}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
