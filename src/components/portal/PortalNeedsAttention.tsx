import { ApprovalCard } from '@/components/portal/ApprovalCard';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { DeliveryItem } from '@/types/database';
import type { PortalScopeRequest } from '@/types/portal';
import { REQUEST_STATUS_CONFIG } from '@/lib/constants';
import { cn } from '@/lib/utils';

type PortalNeedsAttentionProps = {
  pendingApprovals: DeliveryItem[];
  recentlyResolvedRequests: PortalScopeRequest[];
  token: string;
  onApprovalAction: () => void;
  clientName?: string;
};

export function PortalNeedsAttention({
  pendingApprovals,
  recentlyResolvedRequests,
  token,
  onApprovalAction,
  clientName,
}: PortalNeedsAttentionProps) {
  const firstName = clientName?.split(' ')[0];
  const totalCount = pendingApprovals.length + recentlyResolvedRequests.length;

  if (totalCount === 0) return null;

  return (
    <section>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Header row */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="text-sm font-semibold">Needs Your Attention</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pendingApprovals.length > 0
                ? `${pendingApprovals.length} item${pendingApprovals.length === 1 ? '' : 's'} waiting on you`
                : 'Recently resolved items'}
            </p>
          </div>
          {pendingApprovals.length > 0 && (
            <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-status-danger text-white text-[10px] font-bold">
              {pendingApprovals.length}
            </span>
          )}
        </div>

        {/* Approval rows */}
        {pendingApprovals.map((item, index) => (
          <ApprovalCard
            key={item.id}
            item={item}
            token={token}
            onAction={onApprovalAction}
            isLast={index === pendingApprovals.length - 1 && recentlyResolvedRequests.length === 0}
          />
        ))}

        {/* Recently resolved requests */}
        {recentlyResolvedRequests.map((request, index) => {
          const isApproved = request.status === 'approved';
          const statusCfg = REQUEST_STATUS_CONFIG[request.status];
          const isLast = index === recentlyResolvedRequests.length - 1;

          return (
            <div
              key={request.id}
              className={cn('flex items-center gap-3 px-5 py-4', !isLast && 'border-b border-border')}
            >
              <div className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                isApproved ? 'bg-status-success/10' : 'bg-status-danger/10'
              )}>
                {isApproved
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
                  : <XCircle className="w-3.5 h-3.5 text-status-danger" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{request.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your request was{' '}
                  <span className={cn('font-medium', isApproved ? 'text-status-success' : 'text-status-danger')}>
                    {request.status}
                  </span>{' '}
                  — {format(new Date(request.created_at), 'MMM d')}
                </p>
              </div>
              <Badge variant="secondary" className={cn('shrink-0 text-xs', statusCfg.color)}>
                {statusCfg.label}
              </Badge>
            </div>
          );
        })}
      </div>
    </section>
  );
}
