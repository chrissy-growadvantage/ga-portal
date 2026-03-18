import { ApprovalCard } from '@/components/portal/ApprovalCard';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { format, isBefore, parseISO, startOfDay } from 'date-fns';
import { motion } from 'framer-motion';
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
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="bg-card border-2 border-amber-400/80 rounded-2xl overflow-hidden shadow-md shadow-amber-100/60">
        {/* Header row — bold and unmissable */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-amber-200/70 bg-gradient-to-r from-amber-50 to-orange-50/40">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shadow-sm">
                <AlertTriangle className="w-4.5 h-4.5 text-white" />
              </div>
              {(pendingApprovals.length + actualOverdue.length) > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 text-white text-[9px] font-bold items-center justify-center">
                    {pendingApprovals.length + actualOverdue.length}
                  </span>
                </span>
              )}
            </div>
            <div>
              <p className="text-base font-bold text-amber-900 leading-tight">Requires Your Action</p>
              <p className="text-xs text-amber-700/80 mt-0.5">
                {pendingApprovals.length > 0
                  ? `${pendingApprovals.length} item${pendingApprovals.length === 1 ? '' : 's'} waiting on you`
                  : actualOverdue.length > 0
                    ? `${actualOverdue.length} overdue task${actualOverdue.length === 1 ? '' : 's'}`
                    : 'Recently resolved items'}
              </p>
            </div>
          </div>
        </div>

        {/* Approval rows */}
        {pendingApprovals.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08, duration: 0.25 }}
          >
            <ApprovalCard
              item={item}
              token={token}
              onAction={onApprovalAction}
              isLast={
                index === pendingApprovals.length - 1 &&
                recentlyResolvedRequests.length === 0 &&
                actualOverdue.length === 0
              }
            />
          </motion.div>
        ))}

        {/* Overdue tasks */}
        {actualOverdue.map((task, index) => {
          const isLast = index === actualOverdue.length - 1 && recentlyResolvedRequests.length === 0;
          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (pendingApprovals.length + index) * 0.08, duration: 0.25 }}
              className={cn('flex items-center gap-3 px-5 py-5', !isLast && 'border-b border-border')}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-status-danger/10">
                <AlertTriangle className="w-4.5 h-4.5 text-status-danger" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{task.title}</p>
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
            </motion.div>
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
              className={cn('flex items-center gap-3 px-5 py-3', !isLast && 'border-b border-border')}
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
    </motion.section>
  );
}
