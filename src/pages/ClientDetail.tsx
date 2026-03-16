import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useClient, useDeleteClient } from '@/hooks/useClients';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { useDeliveries } from '@/hooks/useDeliveries';
import { useProposals } from '@/hooks/useProposals';
import { useScope } from '@/hooks/useScope';
import { Card, CardContent } from '@/components/ui/card';
import { TypedStatusBadge, StatusBadge } from '@/components/ui/status-badge';
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
  Plus,
  Trash2,
  Mail,
  Phone,
  CheckCircle2,
  Loader2,
  BarChart3,
  FileText,
  Link2,
  Save,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { PROPOSAL_STATUS_CONFIG } from '@/lib/constants';
import { LogDeliveryDialog } from '@/components/deliveries/LogDeliveryDialog';
import { QuickAddDelivery } from '@/components/deliveries/QuickAddDelivery';
import { DeliveryTimeline } from '@/components/deliveries/DeliveryTimeline';
import { EmptyState } from '@/components/ui/empty-state';
import { ScopeTracker } from '@/components/scope/ScopeTracker';
import { ScopeAllocationForm } from '@/components/scope/ScopeAllocationForm';
import { ScopeRequestsTab } from '@/components/scope/ScopeRequestsTab';
import { MagicLinkPanel } from '@/components/clients/MagicLinkPanel';
import { ClientNotes } from '@/components/clients/ClientNotes';
import type { ProposalStatus } from '@/types/database';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { LumaGA4Dashboard } from '@/components/ga4/LumaGA4Dashboard';
import { OnboardingStagesEditor } from '@/components/clients/OnboardingStagesEditor';
import { ClientTasksManager } from '@/components/clients/ClientTasksManager';
import { PortalLinksEditor } from '@/components/clients/PortalLinksEditor';
import { ClientCommunicationTimeline } from '@/components/clients/ClientCommunicationTimeline';

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
    </div>
  );
}

type PortalContentEditorProps = {
  client: import('@/types/database').Client;
  onSaved: () => void;
};

function PortalContentEditor({ client, onSaved }: PortalContentEditorProps) {
  const [focus, setFocus] = useState(client.this_month_focus ?? '');
  const [completedThisMonth, setCompletedThisMonth] = useState(client.completed_this_month ?? '');
  const [monthlyPlanNotes, setMonthlyPlanNotes] = useState(client.monthly_plan_notes ?? '');
  const [hours, setHours] = useState<string>(
    client.hours_used_this_month !== null ? String(client.hours_used_this_month) : '',
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          this_month_focus: focus.trim() || null,
          completed_this_month: completedThisMonth.trim() || null,
          monthly_plan_notes: monthlyPlanNotes.trim() || null,
          hours_used_this_month: hours !== '' ? Number(hours) : null,
        })
        .eq('id', client.id);

      if (error) throw error;

      toast.success('Portal content saved');
      onSaved();
    } catch {
      toast.error('Failed to save portal content');
    } finally {
      setSaving(false);
    }
  };

  const isDirty =
    focus !== (client.this_month_focus ?? '') ||
    completedThisMonth !== (client.completed_this_month ?? '') ||
    monthlyPlanNotes !== (client.monthly_plan_notes ?? '') ||
    hours !== (client.hours_used_this_month !== null ? String(client.hours_used_this_month) : '');

  return (
    <section>
      <SectionHeading
        title="Portal Home Content"
        description="Shown to the client on their portal home screen."
      />
      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="this_month_focus" className="text-xs">
            This month's focus <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="this_month_focus"
            placeholder="Write a short message for the client about this month's priorities…"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            rows={3}
            className="resize-none text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="completed_this_month" className="text-xs">
            Completed this month <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="completed_this_month"
            placeholder="Summarise what was delivered this month…"
            value={completedThisMonth}
            onChange={(e) => setCompletedThisMonth(e.target.value)}
            rows={3}
            className="resize-none text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="monthly_plan_notes" className="text-xs">
            Monthly plan / catch-up notes <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="monthly_plan_notes"
            placeholder="Notes about the monthly plan, what's coming up, or catch-up context…"
            value={monthlyPlanNotes}
            onChange={(e) => setMonthlyPlanNotes(e.target.value)}
            rows={3}
            className="resize-none text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="hours_used" className="text-xs">
            Hours used this month <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="hours_used"
            type="number"
            min={0}
            step={0.5}
            placeholder="e.g. 12"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="max-w-[120px] text-sm"
          />
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            disabled={saving || !isDirty}
            onClick={() => void handleSave()}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Save
          </button>
        </div>
      </div>
    </section>
  );
}

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: client, isLoading } = useClient(id);
  const { data: deliveries, isLoading: deliveriesLoading } = useDeliveries(id);
  const { data: scopes, isLoading: scopesLoading } = useScope(id);
  const { data: proposals, isLoading: proposalsLoading } = useProposals({ clientId: id });
  const deleteClient = useDeleteClient();
  const tanstackQueryClient = useQueryClient();
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  const [deliveryPrefillTitle, setDeliveryPrefillTitle] = useState('');
  const [scopeFormOpen, setScopeFormOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') ?? 'deliveries';

  // Set page title once client data is available
  useEffect(() => {
    if (client) {
      const name = client.company_name || client.contact_name || 'Client';
      document.title = `${name} — Luma`;
    }
    return () => { document.title = 'Luma'; };
  }, [client]);

  // Handle ga4_connected / ga4_error params injected by the OAuth callback redirect
  const ga4CallbackHandled = useRef(false);
  useEffect(() => {
    if (ga4CallbackHandled.current) return;
    const connected = searchParams.get('ga4_connected');
    const ga4Error = searchParams.get('ga4_error');
    if (!connected && !ga4Error) return;
    ga4CallbackHandled.current = true;
    if (connected === 'true') {
      toast.success('Google Analytics connected successfully!');
    } else if (ga4Error) {
      toast.error('Google Analytics connection failed');
    }
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('ga4_connected');
        next.delete('ga4_error');
        return next;
      },
      { replace: true },
    );
  }, [searchParams, setSearchParams]);

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
          Back to clients
        </Link>
      </div>
    );
  }

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

  const displayName = client.company_name || client.contact_name;
  const initials = displayName.slice(0, 2).toUpperCase();
  const deliveryCount = deliveries?.length ?? 0;
  const activeScope = scopes?.[0];
  const hoursUsed = deliveries?.reduce((sum, d) => sum + (d.hours_spent ?? 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-[12.5px] text-muted-foreground" aria-label="Breadcrumb">
        <Link to="/clients" className="hover:text-foreground transition-colors">
          Clients
        </Link>
        <span className="mx-1">›</span>
        <span className="text-foreground font-medium">{displayName}</span>
      </nav>

      {/* Client Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-base font-bold text-primary shrink-0">
            {initials}
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight">{displayName}</h1>
              <TypedStatusBadge type="client" status={client.status} />
            </div>
            <div className="flex items-center gap-4 mt-1 text-[12.5px] text-muted-foreground flex-wrap">
              {client.company_name && client.contact_name && (
                <span>{client.contact_name}</span>
              )}
              {client.contact_email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3 h-3" />
                  {client.contact_email}
                </span>
              )}
              {client.contact_phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3" />
                  {client.contact_phone}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-[13px]"
            onClick={() => setSearchParams({ tab: 'portal' }, { replace: true })}
          >
            <Link2 className="w-3.5 h-3.5" />
            Share Portal
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" aria-label="Delete client">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete client?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove {displayName} and all associated delivery records. This cannot be undone.
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
      </div>

      {/* Summary stat strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-lg px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Deliveries</p>
          <p className="text-2xl font-bold tracking-tight mt-1">{deliveryCount}</p>
        </div>
        <div className="bg-card border border-border rounded-lg px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Scope Used</p>
          <p className="text-2xl font-bold tracking-tight mt-1">
            {activeScope
              ? `${Math.round((hoursUsed / activeScope.total_allocated) * 100)}%`
              : '—'}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Hours Logged</p>
          <p className="text-2xl font-bold tracking-tight mt-1">{hoursUsed.toFixed(1)}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(tab) => {
          setSearchParams({ tab }, { replace: true });
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="relative min-w-0 flex-1">
            <TabsList className="overflow-x-auto flex-nowrap scrollbar-none">
              <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
              <TabsTrigger value="scope">Scope</TabsTrigger>
              <TabsTrigger value="requests">Requests</TabsTrigger>
              <TabsTrigger value="proposals">Proposals</TabsTrigger>
              <TabsTrigger value="portal">Portal</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent" />
          </div>

          {activeTab === 'deliveries' && (
            <Button size="sm" variant="outline" className="gap-2 shrink-0" onClick={() => setDeliveryDialogOpen(true)}>
              <Plus className="w-4 h-4" />
              Log Delivery
            </Button>
          )}
        </div>

        <TabsContent value="deliveries" className="mt-4">
          <div className="flex gap-6 items-start">
            {/* Main delivery content */}
            <main className="flex-1 min-w-0 space-y-4">
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
            </main>

            {/* Scope Tracker sidebar */}
            {scopes?.[0] && (
              <aside className="w-72 shrink-0 hidden lg:block sticky top-4">
                <ScopeTracker
                  allocation={scopes[0]}
                  deliveries={deliveries ?? []}
                />
              </aside>
            )}
          </div>
        </TabsContent>

        <TabsContent value="scope" className="mt-4">
          {scopesLoading ? (
            <div className="space-y-3 animate-pulse">
              <span className="sr-only">Loading scope data</span>
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          ) : !scopes?.length ? (
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

        <TabsContent value="requests" className="mt-4">
          <ScopeRequestsTab clientId={id!} />
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
                        <StatusBadge
                          label={statusCfg?.label ?? proposal.status}
                          colorClasses={statusCfg?.color ?? ''}
                        />
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="portal" className="mt-4 space-y-8">
          <section>
            <SectionHeading
              title="Portal Access"
              description="Generate and manage the client's magic link."
            />
            <MagicLinkPanel
              clientId={client.id}
              companyName={client.company_name}
              contactEmail={client.contact_email}
              contactName={client.contact_name}
              hasExistingLink={!!client.magic_link_token_hash}
              expiresAt={client.magic_link_expires_at}
              onTokenUpdated={() => {
                tanstackQueryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(client.id) });
              }}
            />
          </section>

          <section>
            <SectionHeading
              title="Portal Links"
              description="Quick links shown to the client in their portal."
            />
            <PortalLinksEditor clientId={id!} client={client} />
          </section>

          <section>
            <SectionHeading
              title="Onboarding"
              description="Track onboarding stages for this client."
            />
            <OnboardingStagesEditor clientId={id!} />
          </section>

          <section>
            <SectionHeading
              title="Client Tasks"
              description="Tasks assigned to or visible by this client."
            />
            <ClientTasksManager clientId={id!} />
          </section>

          <PortalContentEditor client={client} onSaved={() => {
            tanstackQueryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(client.id) });
          }} />
        </TabsContent>

        <TabsContent value="reports" className="mt-4 space-y-8">
          <section>
            <SectionHeading
              title="Analytics"
              description="Google Analytics data for this client."
            />
            <LumaGA4Dashboard
              clientId={client.id}
              returnUrl={`${window.location.origin}/clients/${client.id}?tab=reports`}
            />
          </section>

          <section>
            <SectionHeading
              title="Monthly Snapshots"
              description="View and manage monthly review notes."
            />
            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="font-medium">Monthly Review History</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Export reports and review past months.</p>
                </div>
                <Link to={`/clients/${id}/snapshots`}>
                  <Button variant="outline" size="sm">Open Snapshots</Button>
                </Link>
              </CardContent>
            </Card>
          </section>

          <section>
            <SectionHeading
              title="Notes"
              description="Internal notes about this client."
            />
            <ClientNotes clientId={id!} />
          </section>
        </TabsContent>
        <TabsContent value="timeline" className="mt-4">
          <ClientCommunicationTimeline clientId={id!} />
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

      {/* Log Delivery FAB — mobile only (desktop has the tab header button) */}
      {activeTab === 'deliveries' && (
        <button
          className="md:hidden fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-full shadow-lg hover:bg-primary/90 active:scale-95 transition-all font-medium text-sm"
          onClick={() => setDeliveryDialogOpen(true)}
          aria-label="Log delivery"
        >
          <Plus className="w-4 h-4" />
          Log Delivery
        </button>
      )}
    </div>
  );
}
