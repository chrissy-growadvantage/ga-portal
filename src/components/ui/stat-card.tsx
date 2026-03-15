import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type TrendDirection = 'up' | 'down' | 'neutral';

type StatCardProps = {
  icon: LucideIcon;
  iconClassName?: string;
  label: string;
  value: string | number;
  trend?: {
    direction: TrendDirection;
    label: string;
  };
  className?: string;
};

const trendConfig: Record<TrendDirection, { icon: LucideIcon; className: string }> = {
  up:      { icon: TrendingUp,   className: 'text-success' },
  down:    { icon: TrendingDown, className: 'text-destructive' },
  neutral: { icon: Minus,        className: 'text-muted-foreground' },
};

export function StatCard({ icon: Icon, iconClassName, label, value, trend, className }: StatCardProps) {
  const trendCfg = trend ? trendConfig[trend.direction] : null;
  const TrendIcon = trendCfg?.icon;

  return (
    <div className={cn('bg-card border border-border rounded-lg p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-7 h-7 rounded-md flex items-center justify-center',
            iconClassName ?? 'bg-primary/10 text-primary'
          )}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="text-[12.5px] font-medium text-muted-foreground">{label}</span>
        </div>
        <span className="text-muted-foreground/40 text-base leading-none select-none">···</span>
      </div>

      <p className="text-[26px] font-bold tracking-tight leading-none mb-1.5 font-mono">{value}</p>

      {trend && TrendIcon && (
        <p className={cn('text-xs flex items-center gap-1', trendCfg?.className)}>
          <TrendIcon className="w-3 h-3" />
          {trend.label}
        </p>
      )}
    </div>
  );
}
