import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useClients } from '@/hooks/useClients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Users, CheckCircle2, AlertTriangle, Archive } from 'lucide-react';
import { CLIENT_STATUS_CONFIG } from '@/lib/constants';
import { CreateClientDialog } from '@/components/clients/CreateClientDialog';
import { ScopeTrackerCompact } from '@/components/scope/ScopeTrackerCompact';
import { StatCard } from '@/components/ui/stat-card';
import { cn } from '@/lib/utils';
import type { ClientStatus } from '@/types/database';

type StatusFilter = ClientStatus | 'all';

export default function ClientList() {
  const { data: clients, isLoading } = useClients();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [dialogOpen, setDialogOpen] = useState(false);

  // Filter by status first, then by search
  const filtered = useMemo(() => {
    if (!clients) return [];

    // Filter by status
    const byStatus = statusFilter === 'all'
      ? clients
      : clients.filter((c) => c.status === statusFilter);

    // Then filter by search
    if (!search) return byStatus;

    const q = search.toLowerCase();
    return byStatus.filter((c) =>
      c.company_name?.toLowerCase().includes(q) ||
      c.contact_name?.toLowerCase().includes(q) ||
      c.contact_email?.toLowerCase().includes(q)
    );
  }, [clients, statusFilter, search]);

  // Calculate counts for each status
  const statusCounts = useMemo(() => {
    if (!clients) return { active: 0, paused: 0, archived: 0, all: 0 };

    return {
      active: clients.filter((c) => c.status === 'active').length,
      paused: clients.filter((c) => c.status === 'paused').length,
      archived: clients.filter((c) => c.status === 'archived').length,
      all: clients.length,
    };
  }, [clients]);

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
        <span>Home</span>
        <span className="text-muted-foreground/40">›</span>
        <span className="font-medium text-foreground">Clients</span>
      </nav>

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">All Clients</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your client accounts and delivery work</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} size="sm" className="gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          Add Client
        </Button>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Users}
          label="Total Clients"
          value={statusCounts.all}
          trend={{ direction: 'neutral', label: `${statusCounts.active} active` }}
        />
        <StatCard
          icon={CheckCircle2}
          label="Active"
          value={statusCounts.active}
          iconClassName="bg-success/10 text-success"
          trend={{ direction: 'neutral', label: 'Currently engaged' }}
        />
        <StatCard
          icon={AlertTriangle}
          label="Paused"
          value={statusCounts.paused}
          iconClassName="bg-warning/10 text-warning"
          trend={{ direction: statusCounts.paused > 0 ? 'down' : 'neutral', label: statusCounts.paused > 0 ? 'Needs follow-up' : 'None paused' }}
        />
        <StatCard
          icon={Archive}
          label="Archived"
          value={statusCounts.archived}
          iconClassName="bg-muted text-muted-foreground"
          trend={{ direction: 'neutral', label: 'Off retainer' }}
        />
      </div>

      {/* Filter card */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search clients…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 text-sm"
            />
          </div>

          {/* Status filter pills */}
          <div className="flex items-center gap-1 flex-wrap">
            {(['active', 'paused', 'archived', 'all'] as const).map((status) => {
              const count = statusCounts[status];
              const label = status === 'all' ? 'All' : CLIENT_STATUS_CONFIG[status]?.label ?? status;
              const isActive = statusFilter === status;
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    'px-3 py-1 text-[12.5px] font-medium rounded-md border transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {label} <span className="text-[11px] opacity-60">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {!isLoading && clients && (
          <p className="text-[12px] text-muted-foreground mt-2.5">
            {search || statusFilter !== 'all'
              ? `Showing ${filtered.length} of ${clients.length} clients${search ? ` matching "${search}"` : ''}`
              : `${clients.length} client${clients.length !== 1 ? 's' : ''} total`}
          </p>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
        </div>
      ) : !filtered.length ? (
        <div className="bg-card border border-border rounded-lg py-12 text-center">
          <Users className="w-9 h-9 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {search ? 'No clients match your search.' :
             statusFilter !== 'all' ? `No ${CLIENT_STATUS_CONFIG[statusFilter as ClientStatus]?.label.toLowerCase()} clients.` :
             'No clients yet.'}
          </p>
          {!search && !clients?.length && (
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setDialogOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Add your first client
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-2.5">Client</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-2.5 hidden sm:table-cell">Scope</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-2.5 hidden md:table-cell">Status</th>
                <th className="text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => {
                const statusCfg = CLIENT_STATUS_CONFIG[client.status as ClientStatus];
                const latestScope = client.scope_allocations?.[0];

                return (
                  <tr
                    key={client.id}
                    className="border-b border-border/40 last:border-0 hover:bg-muted/40 transition-colors cursor-pointer"
                    onClick={() => { window.location.href = `/clients/${client.id}`; }}
                  >
                    {/* Client name + email */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-[11px] shrink-0">
                          {(client.company_name || client.contact_name)?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13.5px] font-semibold truncate">
                            {client.company_name || client.contact_name}
                          </p>
                          {client.contact_email && (
                            <p className="text-[11.5px] text-muted-foreground truncate">{client.contact_email}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Scope progress */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {latestScope ? (
                        <ScopeTrackerCompact
                          allocation={latestScope}
                          deliveries={client.delivery_items ?? []}
                        />
                      ) : (
                        <span className="text-[12px] text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      {client.status !== 'active' ? (
                        <span className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold',
                          statusCfg?.color ?? 'bg-muted text-muted-foreground'
                        )}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', statusCfg?.dot ?? 'bg-muted-foreground')} />
                          {statusCfg?.label ?? client.status}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold bg-success/10 text-success">
                          <span className="w-1.5 h-1.5 rounded-full bg-success" />
                          Active
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/clients/${client.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border text-[12px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <CreateClientDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
