import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useClients } from '@/hooks/useClients';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Users } from 'lucide-react';
import { CLIENT_STATUS_CONFIG } from '@/lib/constants';
import { CreateClientDialog } from '@/components/clients/CreateClientDialog';
import { ScopeTrackerCompact } from '@/components/scope/ScopeTrackerCompact';
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your client roster and delivery tracking.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Client
        </Button>
      </div>

      {/* Status Filter Tabs */}
      <div className="border-b border-border">
        <div className="flex items-center gap-1">
          {(['active', 'paused', 'archived', 'all'] as const).map((status) => {
            const count = statusCounts[status];
            const label = status === 'all'
              ? 'All Clients'
              : CLIENT_STATUS_CONFIG[status]?.label ?? status;
            const isActive = statusFilter === status;

            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors relative',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                )}
              >
                {label}
                <span
                  className={cn(
                    'ml-1.5 text-xs font-mono',
                    isActive ? 'text-primary/70' : 'text-muted-foreground/70'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search clients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Result Summary */}
        {!isLoading && clients && (
          <p className="text-sm text-muted-foreground">
            {search || statusFilter !== 'all' ? (
              <>
                Showing {filtered.length} of {clients.length} client{clients.length !== 1 ? 's' : ''}
                {search && <> matching "{search}"</>}
              </>
            ) : (
              <>{clients.length} client{clients.length !== 1 ? 's' : ''}</>
            )}
          </p>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : !filtered.length ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {search
                ? 'No clients match your search.'
                : statusFilter !== 'all'
                ? `No ${CLIENT_STATUS_CONFIG[statusFilter as ClientStatus]?.label.toLowerCase()} clients yet.`
                : 'No clients yet.'}
            </p>
            {!search && !clients?.length && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add your first client
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-border">
            {filtered.map((client) => {
              const statusCfg = CLIENT_STATUS_CONFIG[client.status as ClientStatus];
              const latestScope = client.scope_allocations?.[0];

              return (
                <Link key={client.id} to={`/clients/${client.id}`}>
                  <div className="p-5 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                          {(client.company_name || client.contact_name)?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {client.company_name || client.contact_name}
                          </p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            {client.company_name && client.contact_name && (
                              <span className="truncate">{client.contact_name}</span>
                            )}
                            {client.contact_email && (
                              <span className="hidden sm:inline truncate">{client.contact_email}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className={`gap-1.5 shrink-0 ${statusCfg?.color ?? ''}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg?.dot ?? ''}`} aria-hidden="true" />
                        {statusCfg?.label ?? client.status}
                      </Badge>
                    </div>
                    {latestScope && (
                      <div className="flex items-center gap-4 mt-3">
                        <div className="w-10 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <ScopeTrackerCompact
                            allocation={latestScope}
                            deliveries={client.delivery_items ?? []}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      )}

      <CreateClientDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
