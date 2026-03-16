import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ThumbsUp, RotateCcw, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAllPendingApprovals, type PendingApprovalItem } from '@/hooks/useAllPendingApprovals';
import { useUpdateDelivery } from '@/hooks/useDeliveries';
import { format } from 'date-fns';
import { toast } from 'sonner';

type ClientGroup = {
  clientId: string;
  clientName: string;
  items: PendingApprovalItem[];
};

type ProcessingState = { id: string; action: 'approve' | 'changes' } | null;

function groupByClient(items: PendingApprovalItem[]): ClientGroup[] {
  const map = new Map<string, ClientGroup>();

  for (const item of items) {
    const clientId = item.clients?.id ?? item.client_id;
    const clientName =
      item.clients?.company_name || item.clients?.contact_name || 'Unknown Client';

    const existing = map.get(clientId);
    if (existing) {
      existing.items.push(item);
    } else {
      map.set(clientId, { clientId, clientName, items: [item] });
    }
  }

  return Array.from(map.values());
}

export default function Approvals() {
  const { data: items = [], isLoading } = useAllPendingApprovals();
  const updateDelivery = useUpdateDelivery();
  const queryClient = useQueryClient();
  const [processing, setProcessing] = useState<ProcessingState>(null);

  useEffect(() => {
    document.title = 'Approvals — Luma';
    return () => { document.title = 'Luma'; };
  }, []);

  const groups = useMemo(() => groupByClient(items), [items]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['deliveries', 'pending-approvals'] });
  };

  const handleApprove = async (item: PendingApprovalItem) => {
    setProcessing({ id: item.id, action: 'approve' });
    try {
      await updateDelivery.mutateAsync({ id: item.id, client_id: item.client_id, status: 'approved' });
      invalidate();
      toast.success('Delivery approved');
    } catch {
      toast.error('Failed to approve delivery');
    } finally {
      setProcessing(null);
    }
  };

  const handleRequestChanges = async (item: PendingApprovalItem) => {
    setProcessing({ id: item.id, action: 'changes' });
    try {
      await updateDelivery.mutateAsync({ id: item.id, client_id: item.client_id, status: 'revision_requested' });
      invalidate();
      toast.success('Changes requested');
    } catch {
      toast.error('Failed to request changes');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            Approvals{!isLoading && items.length > 0 ? ` (${items.length})` : ''}
          </h1>
          {!isLoading && items.length > 0 && (
            <Badge className="bg-status-warning text-white text-xs font-bold">
              {items.length}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          Deliveries awaiting review across all clients
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent className="space-y-2">
                {[1, 2].map((j) => (
                  <Skeleton key={j} className="h-16 w-full rounded-lg" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <CheckCircle2 className="w-12 h-12 text-status-success mb-4" />
          <h2 className="text-lg font-semibold">All caught up</h2>
          <p className="text-sm text-muted-foreground mt-1">
            No deliveries waiting for approval
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <Card key={group.clientId}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                    {group.clientName[0]?.toUpperCase() ?? '?'}
                  </div>
                  <Link
                    to={`/clients/${group.clientId}`}
                    className="hover:text-primary transition-colors"
                  >
                    {group.clientName}
                  </Link>
                  <Badge variant="secondary" className="text-xs">
                    {group.items.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {group.items.map((item) => {
                  const isThisItem = processing?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Submitted {format(new Date(item.updated_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          disabled={isThisItem}
                          onClick={() => handleRequestChanges(item)}
                        >
                          {isThisItem && processing?.action === 'changes' ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3.5 h-3.5" />
                          )}
                          Changes
                        </Button>
                        <Button
                          size="sm"
                          className="gap-1.5 bg-status-success hover:bg-status-success/90 text-white"
                          disabled={isThisItem}
                          onClick={() => handleApprove(item)}
                        >
                          {isThisItem && processing?.action === 'approve' ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ThumbsUp className="w-3.5 h-3.5" />
                          )}
                          Approve
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
