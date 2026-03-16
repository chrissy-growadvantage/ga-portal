import { StatusBadge } from '@/components/ui/status-badge';
import { PROPOSAL_STATUS_CONFIG } from '@/lib/constants';
import type { ProposalStatus } from '@/types/database';

type ProposalStatusBadgeProps = {
  status: ProposalStatus;
  size?: 'sm' | 'default' | 'lg';
};

export function ProposalStatusBadge({ status, size = 'default' }: ProposalStatusBadgeProps) {
  const config = PROPOSAL_STATUS_CONFIG[status];

  return (
    <StatusBadge
      label={config.label}
      colorClasses={config.color}
      dotColorClass={config.dot}
      size={size}
    />
  );
}
