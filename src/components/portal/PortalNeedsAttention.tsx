import { ApprovalCard } from '@/components/portal/ApprovalCard';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { format, isBefore, parseISO, startOfDay } from 'date-fns';
import type { DeliveryItem } from '@/types/database';
import type { PortalScopeRequest, PortalClientTask } from '@/types/portal';
import { REQUEST_STATUS_CONFIG } from '@/lib/constants';
import { cn } from '@/lib/utils';

type PortalNeedsAttentionProps = {
  pendingApprovals: DeliveryItem[];
  recentlyResolvedRequests: PortalScopeRequest[];
  overdueTasks?: PortalClientTask[];
  token: string;
  onApprovalAction: () => void;
  clientName?: string;
};

function isTaskOverdue(task: PortalClientTask): boolean {
  if (!task.due_date || task.completed_at) return false;
  return isBefore(parseISO(task.due_date), startOfDay(new Date()));
}

export function PortalNeedsAttention({
  pendingApprovals,
  recentlyResolvedRequests,
  overdueTasks = [],
  token,
  onApprovalAction,
  clientName,
}: PortalNeedsAttentionProps) {
  const actualOverdue = overdueTasks.filter(isTaskOverdue);
  const totalCount = pendingApprovals.length + recentlyResolvedRequests.length + actualOverdue.length;

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
                : actualOverdue.length > 0
                  ? `${actualOverdue.length} overdue task${actualOverdue.length === 1 ? '' : 's'}`
                  : 'Recently resolved items'}
            </p>
          </div>
          {(pendingApprovals.length > 0 || actualOverdue.length > 0) && (
            <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-status-danger text-white text-[10px] font-bold">
              {pendingApprovals.length + actualOverdue.length}
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
            isLast={
              index === pendingApprovals.length - 1 &&
              recentlyResolvedRequests.length === 0 &&
              actualOverdue.length === 0
            }
          />
        ))}

        {/* Overdue tasks */}
        {actualOverdue.map((task, index) => {
          const isLast = index === actualOverdue.length - 1 && recentlyResolvedRequests.length === 0;
          return (
            <div
              key={task.id}
              className={cn('flex items-center gap-3 px-5 py-4', !isLast && 'border-b border-border')}
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-status-danger/10">
                <AlertTriangle className="w-3.5 h-3.5 text-status-danger" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{task.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Task was due{' '}
                  <span className="font-medium text-status-danger">
                    {format(parseISO(task.due_date!), 'MMM d')}
                  </span>
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0 text-xs bg-status-danger/10 text-status-danger">
                Overdue
              </Badge>
            </div>
          );
        })}

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
