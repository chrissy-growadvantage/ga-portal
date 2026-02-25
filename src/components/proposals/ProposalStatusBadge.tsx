import { Badge } from '@/components/ui/badge';
import { PROPOSAL_STATUS_CONFIG } from '@/lib/constants';
import type { ProposalStatus } from '@/types/database';

interface ProposalStatusBadgeProps {
  status: ProposalStatus;
}

export function ProposalStatusBadge({ status }: ProposalStatusBadgeProps) {
  const config = PROPOSAL_STATUS_CONFIG[status];
  return (
    <Badge variant="secondary" className={`gap-1.5 ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} aria-hidden="true" />
      {config.label}
    </Badge>
  );
}
