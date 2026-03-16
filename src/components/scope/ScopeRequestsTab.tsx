import { useState, useCallback } from 'react';
import { useScopeRequests, useUpdateScopeRequestStatus, useUpdateScopeRequestFields } from '@/hooks/useScopeRequests';
import { CreateScopeRequestDialog } from '@/components/scope/CreateScopeRequestDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/ui/empty-state';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MessageSquarePlus, Plus, MoreHorizontal } from 'lucide-react';
import { REQUEST_STATUS_CONFIG, GA_REQUEST_STATUS_CONFIG } from '@/lib/constants';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { RequestStatus, GaRequestStatus } from '@/types/database';

type Props = {
  clientId: string;
};

type StatusFilter = 'all' | RequestStatus;

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'declined', label: 'Declined' },
  { value: 'completed', label: 'Completed' },
];

function AdminNoteField({
  requestId,
  initialNote,
  onBlur,
}: {
  requestId: string;
  initialNote: string;
  onBlur: (note: string) => void;
}) {
  const [note, setNote] = useState(initialNote);
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs text-muted-foreground w-20 shrink-0 pt-1.5">Note</span>
      <Textarea
        key={requestId}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={() => onBlur(note)}
        placeholder="Internal note…"
        className="text-xs min-h-[52px] resize-none"
      />
    </div>
  );
}

const GA_STATUS_OPTIONS: { value: GaRequestStatus; label: string }[] = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'received', label: 'Received' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting_on_client', label: 'Waiting on Client' },
  { value: 'done', label: 'Done' },
];

export function ScopeRequestsTab({ clientId }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const { data: requests, isLoading } = useScopeRequests(clientId);
  const updateStatus = useUpdateScopeRequestStatus();
  const updateFields = useUpdateScopeRequestFields();

  const handleGaStatusChange = useCallback(async (id: string, ga_status: GaRequestStatus) => {
    try {
      await updateFields.mutateAsync({ id, clientId, ga_status });
    } catch {
      toast.error('Failed to update status');
    }
  }, [clientId, updateFields]);

  const handleAdminNoteBlur = useCallback(async (id: string, admin_note: string) => {
    try {
      await updateFields.mutateAsync({ id, clientId, admin_note: admin_note || null });
    } catch {
      toast.error('Failed to save note');
    }
  }, [clientId, updateFields]);

  const handleStatusChange = async (id: string, status: RequestStatus) => {
    try {
      await updateStatus.mutateAsync({ id, clientId, status });
      toast.success(`Request ${REQUEST_STATUS_CONFIG[status].label.toLowerCase()}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update request';
      toast.error(message);
    }
  };

  const filteredRequests =
    statusFilter === 'all'
      ? requests
      : requests?.filter((r) => r.status === statusFilter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">Scope Requests</h3>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" variant="outline" className="gap-2 shrink-0" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4" />
          New Request
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : !requests?.length ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={MessageSquarePlus}
              title="No requests yet"
              description="Create a scope request or your clients can submit them through the portal."
              action={{
                label: 'Create first request',
                onClick: () => setDialogOpen(true),
              }}
            />
          </CardContent>
        </Card>
      ) : !filteredRequests?.length ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={MessageSquarePlus}
              title="No matching requests"
              description={`No ${statusFilter} requests found. Try a different filter.`}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <p className="font-medium text-foreground">{request.title}</p>
                    {request.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {request.description.length > 200
                          ? `${request.description.slice(0, 200)}…`
                          : request.description}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                        Internal:
                      </span>
                      <Badge variant="secondary" className={REQUEST_STATUS_CONFIG[request.status].color}>
                        {REQUEST_STATUS_CONFIG[request.status].label}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {request.requested_by === 'client' ? 'Client' : 'Operator'}
                      </Badge>
                      {request.scope_cost != null && (
                        <span className="text-xs text-muted-foreground">
                          Cost: {request.scope_cost}
                        </span>
                      )}
                      {request.category && (
                        <span className="text-xs text-muted-foreground">{request.category}</span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(request.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>

                    {/* GA status + admin note */}
                    <div className="pt-2 space-y-2 border-t border-border/40 mt-2">
                      <div className="space-y-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                          Client-Facing Status
                        </p>
                        <p className="text-[10px] text-muted-foreground/60">
                          This status is shown to the client
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="sr-only">GA Status</span>
                        <Select
                          value={request.ga_status ?? ''}
                          onValueChange={(v) => void handleGaStatusChange(request.id, v as GaRequestStatus)}
                        >
                          <SelectTrigger className="h-7 text-xs w-44">
                            <SelectValue placeholder="Set status…" />
                          </SelectTrigger>
                          <SelectContent>
                            {GA_STATUS_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                <span className={GA_REQUEST_STATUS_CONFIG[opt.value].color}>
                                  {opt.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <AdminNoteField
                        requestId={request.id}
                        initialNote={request.admin_note ?? ''}
                        onBlur={(note) => void handleAdminNoteBlur(request.id, note)}
                      />
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {request.status === 'pending' && (
                        <>
                          <DropdownMenuItem onClick={() => handleStatusChange(request.id, 'approved')}>
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(request.id, 'declined')}>
                            Decline
                          </DropdownMenuItem>
                        </>
                      )}
                      {request.status === 'approved' && (
                        <DropdownMenuItem onClick={() => handleStatusChange(request.id, 'completed')}>
                          Mark Completed
                        </DropdownMenuItem>
                      )}
                      {request.status === 'declined' && (
                        <DropdownMenuItem onClick={() => handleStatusChange(request.id, 'pending')}>
                          Reopen
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateScopeRequestDialog
        clientId={clientId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
