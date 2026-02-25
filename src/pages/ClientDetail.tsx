import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useClient, useDeleteClient } from '@/hooks/useClients';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { useDeliveries } from '@/hooks/useDeliveries';
import { useProposals } from '@/hooks/useProposals';
import { useScope } from '@/hooks/useScope';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  Loader2,
  BarChart3,
  FileText,
} from 'lucide-react';
import { CLIENT_STATUS_CONFIG, PROPOSAL_STATUS_CONFIG, BILLING_TYPE_LABELS } from '@/lib/constants';
import { LogDeliveryDialog } from '@/components/deliveries/LogDeliveryDialog';
import { QuickAddDelivery } from '@/components/deliveries/QuickAddDelivery';
import { DeliveryTimeline } from '@/components/deliveries/DeliveryTimeline';
import { EmptyState } from '@/components/ui/empty-state';
import { ScopeTracker } from '@/components/scope/ScopeTracker';
import { ScopeAllocationForm } from '@/components/scope/ScopeAllocationForm';
import { MagicLinkPanel } from '@/components/clients/MagicLinkPanel';
import type { ClientStatus, ProposalStatus } from '@/types/database';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: client, isLoading } = useClient(id);
  const { data: deliveries, isLoading: deliveriesLoading } = useDeliveries(id);
  const { data: scopes } = useScope(id);
  const { data: proposals, isLoading: proposalsLoading } = useProposals({ clientId: id });
  const deleteClient = useDeleteClient();
  const tanstackQueryClient = useQueryClient();
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  const [deliveryPrefillTitle, setDeliveryPrefillTitle] = useState('');
  const [scopeFormOpen, setScopeFormOpen] = useState(false);

  // Derive last-used category from most recent delivery for quick-add defaults
  const lastCategory = useMemo(() => {
    if (!deliveries?.length) return undefined;
    return deliveries[0].category || undefined;
  }, [deliveries]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Client not found.</p>
        <Link to="/clients" className="text-primary hover:underline text-sm mt-2 inline-block">
          ← Back to clients
        </Link>
      </div>
    );
  }

  const statusCfg = CLIENT_STATUS_CONFIG[client.status as ClientStatus];

  const handleDelete = async () => {
    try {
      await deleteClient.mutateAsync(client.id);
      toast.success('Client deleted');
      navigate('/clients');
    } catch {
      toast.error('Failed to delete client');
    }
  };

  const handleExpandToDialog = (title: string) => {
    setDeliveryPrefillTitle(title);
    setDeliveryDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDeliveryDialogOpen(open);
    if (!open) setDeliveryPrefillTitle('');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link to="/clients">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight">
                {client.company_name || client.contact_name}
              </h1>
              <Badge variant="secondary" className={`gap-1.5 ${statusCfg?.color ?? ''}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg?.dot ?? ''}`} aria-hidden="true" />
                {statusCfg?.label ?? client.status}
              </Badge>
            </div>
            {client.company_name && client.contact_name && (
              <p className="text-muted-foreground mt-0.5">{client.contact_name}</p>
            )}
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete client?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove {client.company_name || client.contact_name} and all associated delivery records. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {deleteClient.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Contact Info */}
      <Card>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {client.contact_email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="truncate">{client.contact_email}</span>
              </div>
            )}
            {client.contact_phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>{client.contact_phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>Added {format(new Date(client.created_at), 'MMM d, yyyy')}</span>
            </div>
          </div>
          {client.notes && (
            <p className="text-sm text-muted-foreground mt-4 pt-4 border-t border-border">
              {client.notes}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Magic Link Panel */}
      <MagicLinkPanel
        clientId={client.id}
        hasExistingLink={!!client.magic_link_token_hash}
        expiresAt={client.magic_link_expires_at}
        onTokenUpdated={() => {
          tanstackQueryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(client.id) });
        }}
      />

      {/* Tabs: Deliveries & Scope */}
      <Tabs defaultValue="deliveries">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
            <TabsTrigger value="scope">Scope</TabsTrigger>
            <TabsTrigger value="proposals">Proposals</TabsTrigger>
          </TabsList>
          <Button size="sm" variant="outline" className="gap-2" onClick={() => setDeliveryDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Log Delivery
          </Button>
        </div>

        <TabsContent value="deliveries" className="mt-4 space-y-4">
          <QuickAddDelivery
            clientId={id!}
            lastCategory={lastCategory}
            onExpandToDialog={handleExpandToDialog}
          />
          {deliveriesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : !deliveries?.length ? (
            <Card>
              <CardContent className="p-0">
                <EmptyState
                  icon={CheckCircle2}
                  title="No deliveries logged yet"
                  description="Log your first delivery to start building this client's record."
                  tip="Most operators start by logging this week's completed work."
                  action={{
                    label: 'Log your first delivery',
                    onClick: () => setDeliveryDialogOpen(true),
                  }}
                />
              </CardContent>
            </Card>
          ) : (
            <DeliveryTimeline deliveries={deliveries} />
          )}
        </TabsContent>

        <TabsContent value="scope" className="mt-4">
          {!scopes?.length ? (
            <Card>
              <CardContent className="py-10 text-center">
                <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium text-foreground">No scope allocation yet</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                  Set up a scope budget to track how much of this client's allocation has been used.
                </p>
                <Button
                  className="mt-4 gap-2"
                  onClick={() => setScopeFormOpen(true)}
                >
                  <Plus className="w-4 h-4" />
                  Set up scope allocation
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={() => setScopeFormOpen(true)}
                >
                  <Plus className="w-4 h-4" />
                  New Period
                </Button>
              </div>
              {scopes.map((scope) => (
                <ScopeTracker
                  key={scope.id}
                  allocation={scope}
                  deliveries={deliveries ?? []}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="proposals" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Link to={`/proposals/new?client=${id}`}>
              <Button size="sm" variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                New Proposal
              </Button>
            </Link>
          </div>
          {proposalsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : !proposals?.length ? (
            <Card>
              <CardContent className="p-0">
                <EmptyState
                  icon={FileText}
                  title="No proposals yet"
                  description="Create a proposal to outline your scope of work and pricing for this client."
                  action={{
                    label: 'Create your first proposal',
                    onClick: () => navigate(`/proposals/new?client=${id}`),
                  }}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {proposals.map((proposal) => {
                const statusCfg = PROPOSAL_STATUS_CONFIG[proposal.status as ProposalStatus];
                const totalPrice = proposal.line_items.reduce(
                  (sum, item) => sum + item.quantity * item.unit_price,
                  0
                );

                return (
                  <Link key={proposal.id} to={`/proposals/${proposal.id}`}>
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{proposal.title}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{format(new Date(proposal.created_at), 'MMM d, yyyy')}</span>
                            <span>${totalPrice.toLocaleString()}</span>
                          </div>
                        </div>
                        <Badge variant="secondary" className={statusCfg?.color ?? ''}>
                          {statusCfg?.label ?? proposal.status}
                        </Badge>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <LogDeliveryDialog
        clientId={id!}
        open={deliveryDialogOpen}
        onOpenChange={handleDialogOpenChange}
        prefillTitle={deliveryPrefillTitle}
      />

      <ScopeAllocationForm
        clientId={id!}
        open={scopeFormOpen}
        onOpenChange={setScopeFormOpen}
      />
    </div>
  );
}
