import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProposals, useDeleteProposal, useDuplicateProposal } from '@/hooks/useProposals';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, FileText, MoreHorizontal, Copy, Send, Trash2, Eye, Pencil, Loader2 } from 'lucide-react';
import { ProposalStatusBadge } from '@/components/proposals/ProposalStatusBadge';
import { PROPOSAL_STATUS_CONFIG, BILLING_TYPE_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { ProposalStatus, ProposalWithDetails } from '@/types/database';

type StatusFilter = ProposalStatus | 'all';

const STATUS_TABS: StatusFilter[] = ['all', 'draft', 'sent', 'viewed', 'accepted', 'declined', 'expired'];

function calculateProposalTotal(proposal: ProposalWithDetails) {
  const lineItemsTotal = proposal.line_items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0,
  );
  const addonsTotal = proposal.addons
    .filter((a) => a.is_included && a.is_selected)
    .reduce((sum, addon) => sum + addon.price, 0);
  return lineItemsTotal + addonsTotal;
}

function formatCurrency(amount: number) {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function getBillingSummary(proposal: ProposalWithDetails) {
  const recurring = proposal.line_items
    .filter((i) => i.billing_type === 'recurring')
    .reduce((sum, i) => sum + i.quantity * i.unit_price, 0)
    + proposal.addons
      .filter((a) => a.is_included && a.is_selected && a.billing_type === 'recurring')
      .reduce((sum, a) => sum + a.price, 0);

  const oneTime = proposal.line_items
    .filter((i) => i.billing_type === 'one_time')
    .reduce((sum, i) => sum + i.quantity * i.unit_price, 0)
    + proposal.addons
      .filter((a) => a.is_included && a.is_selected && a.billing_type === 'one_time')
      .reduce((sum, a) => sum + a.price, 0);

  const parts: string[] = [];
  if (recurring > 0) parts.push(`${formatCurrency(recurring)}/mo`);
  if (oneTime > 0) parts.push(`${formatCurrency(oneTime)} one-time`);

  return parts.join(' + ') || null;
}

function getDateInfo(proposal: ProposalWithDetails) {
  if (proposal.sent_at) {
    return `Sent ${format(new Date(proposal.sent_at), 'MMM d, yyyy')}`;
  }
  if (proposal.expires_at) {
    return `Expires ${format(new Date(proposal.expires_at), 'MMM d, yyyy')}`;
  }
  return `Created ${format(new Date(proposal.created_at), 'MMM d, yyyy')}`;
}

export default function ProposalList() {
  const { data: proposals, isLoading } = useProposals();
  const deleteProposal = useDeleteProposal();
  const duplicateProposal = useDuplicateProposal();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [deleteTarget, setDeleteTarget] = useState<ProposalWithDetails | null>(null);

  const filtered = useMemo(() => {
    if (!proposals) return [];
    if (statusFilter === 'all') return proposals;
    return proposals.filter((p) => p.status === statusFilter);
  }, [proposals, statusFilter]);

  const statusCounts = useMemo(() => {
    if (!proposals) return {} as Record<StatusFilter, number>;

    const counts: Record<string, number> = { all: proposals.length };
    for (const status of ['draft', 'sent', 'viewed', 'accepted', 'declined', 'expired'] as ProposalStatus[]) {
      counts[status] = proposals.filter((p) => p.status === status).length;
    }
    return counts as Record<StatusFilter, number>;
  }, [proposals]);

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateProposal.mutateAsync(id);
      toast.success('Proposal duplicated');
    } catch {
      toast.error('Failed to duplicate proposal');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProposal.mutateAsync(deleteTarget.id);
      toast.success('Proposal deleted');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete proposal');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Proposals</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and track your service proposals.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/proposals/new">
            <Plus className="w-4 h-4" />
            New Proposal
          </Link>
        </Button>
      </div>

      {/* Status Filter Tabs */}
      <div className="border-b border-border">
        <div className="flex items-center gap-1 overflow-x-auto">
          {STATUS_TABS.map((status) => {
            const count = statusCounts[status] ?? 0;
            const label = status === 'all'
              ? 'All'
              : PROPOSAL_STATUS_CONFIG[status]?.label ?? status;
            const isActive = statusFilter === status;

            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors relative whitespace-nowrap',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30',
                )}
              >
                {label}
                <span
                  className={cn(
                    'ml-1.5 text-xs font-mono',
                    isActive ? 'text-primary/70' : 'text-muted-foreground/70',
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : !filtered.length ? (
        <Card>
          <CardContent className="py-10 text-center">
            <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-foreground">
              {statusFilter !== 'all'
                ? `No ${PROPOSAL_STATUS_CONFIG[statusFilter]?.label.toLowerCase()} proposals`
                : 'No proposals yet'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {statusFilter !== 'all'
                ? 'Try a different filter or create a new proposal.'
                : 'Create your first proposal to get started.'}
            </p>
            {statusFilter === 'all' && !proposals?.length && (
              <Button asChild variant="outline" className="mt-4 gap-2">
                <Link to="/proposals/new">
                  <Plus className="w-4 h-4" />
                  Create your first proposal
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-border">
            {filtered.map((proposal) => {
              const total = calculateProposalTotal(proposal);
              const billingSummary = getBillingSummary(proposal);
              const dateInfo = getDateInfo(proposal);
              const clientName = proposal.client?.company_name
                || proposal.client?.contact_name
                || 'Unknown client';

              return (
                <div key={proposal.id} className="p-5 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Link
                          to={`/proposals/${proposal.id}`}
                          className="font-medium truncate hover:underline"
                        >
                          {proposal.title}
                        </Link>
                        <ProposalStatusBadge status={proposal.status} />
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 truncate">
                        {clientName}
                      </p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <MoreHorizontal className="w-4 h-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/proposals/${proposal.id}`)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        {proposal.status === 'draft' && (
                          <DropdownMenuItem onClick={() => navigate(`/proposals/${proposal.id}`)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleDuplicate(proposal.id)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        {(proposal.status === 'sent' || proposal.status === 'viewed') && (
                          <DropdownMenuItem disabled>
                            <Send className="w-4 h-4 mr-2" />
                            Resend
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget(proposal)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center gap-4 mt-3 flex-wrap text-sm text-muted-foreground">
                    <span className="font-mono font-medium text-foreground">
                      {formatCurrency(total)}
                    </span>
                    {billingSummary && (
                      <span className="hidden sm:inline">{billingSummary}</span>
                    )}
                    <span>{dateInfo}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete proposal?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTarget?.title}". This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProposal.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Deleting</> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
