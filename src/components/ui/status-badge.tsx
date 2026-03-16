import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  CircleDot,
  ShieldCheck,
} from 'lucide-react';
import type { DeliveryStatus, ClientStatus } from '@/types/database';
import { CLIENT_STATUS_CONFIG, DELIVERY_STATUS_CONFIG } from '@/lib/constants';
import { cn } from '@/lib/utils';

const sizeStyles = {
  sm: {
    badge: 'text-[10px] px-2 py-0.5',
    dot: 'w-1 h-1',
    icon: 'w-3 h-3',
  },
  default: {
    badge: 'text-xs px-2.5 py-0.5',
    dot: 'w-1.5 h-1.5',
    icon: 'w-3.5 h-3.5',
  },
  lg: {
    badge: 'text-sm px-3 py-1',
    dot: 'w-2 h-2',
    icon: 'w-4 h-4',
  },
} as const;

// ── Generic StatusBadge ────────────────────────────────────────────
type GenericStatusBadgeProps = {
  label: string;
  colorClasses: string;
  dotColorClass?: string;
  icon?: LucideIcon;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
};

export function StatusBadge({
  label,
  colorClasses,
  dotColorClass,
  icon: Icon,
  size = 'default',
  className,
}: GenericStatusBadgeProps) {
  const styles = sizeStyles[size];

  return (
    <Badge
      variant="secondary"
      className={cn('gap-1.5', styles.badge, colorClasses, className)}
    >
      {Icon ? (
        <Icon className={cn(styles.icon)} aria-hidden="true" />
      ) : dotColorClass ? (
        <span
          className={cn('rounded-full', styles.dot, dotColorClass)}
          aria-hidden="true"
        />
      ) : null}
      {label}
    </Badge>
  );
}

// ── Pre-wired typed badges (backward compat) ───────────────────────
const DELIVERY_STATUS_ICONS: Record<DeliveryStatus, React.ReactNode> = {
  completed: <CheckCircle2 className="w-3.5 h-3.5" />,
  in_progress: <Clock className="w-3.5 h-3.5" />,
  approved: <ShieldCheck className="w-3.5 h-3.5" />,
  pending_approval: <CircleDot className="w-3.5 h-3.5" />,
  revision_requested: <AlertCircle className="w-3.5 h-3.5" />,
};

const CLIENT_STATUS_ICONS: Record<ClientStatus, React.ReactNode> = {
  active: <CheckCircle2 className="w-3.5 h-3.5" />,
  paused: <Clock className="w-3.5 h-3.5" />,
  archived: <CircleDot className="w-3.5 h-3.5" />,
};

type TypedStatusBadgeProps = {
  type: 'delivery' | 'client';
  status: string;
  className?: string;
};

export function TypedStatusBadge({ type, status, className }: TypedStatusBadgeProps) {
  if (type === 'delivery') {
    const cfg = DELIVERY_STATUS_CONFIG[status as DeliveryStatus];
    const icon = DELIVERY_STATUS_ICONS[status as DeliveryStatus];
    if (!cfg) return null;
    return (
      <Badge variant="secondary" className={cn('gap-1.5', cfg.color, className)}>
        {icon}
        {cfg.label}
      </Badge>
    );
  }

  const cfg = CLIENT_STATUS_CONFIG[status as ClientStatus];
  const icon = CLIENT_STATUS_ICONS[status as ClientStatus];
  if (!cfg) return null;
  return (
    <Badge variant="secondary" className={cn('gap-1.5', cfg.color, className)}>
      {icon}
      {cfg.label}
    </Badge>
  );
}
