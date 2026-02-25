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

interface StatusBadgeProps {
  type: 'delivery' | 'client';
  status: string;
  className?: string;
}

export function StatusBadge({ type, status, className }: StatusBadgeProps) {
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
