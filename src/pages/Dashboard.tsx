import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useClients } from '@/hooks/useClients';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { CLIENT_STATUS_CONFIG } from '@/lib/constants';
import { ScopeTrackerCompact } from '@/components/scope/ScopeTrackerCompact';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';
import type { ClientStatus } from '@/types/database';

export default function Dashboard() {
  const { data: clients, isLoading } = useClients();
  const [createClientDialogOpen, setCreateClientDialogOpen] = useState(false);
  const [logDeliveryDialogOpen, setLogDeliveryDialogOpen] = useState(false);

  const activeClients = clients?.filter((c) => c.status === 'active') ?? [];
  const totalDeliveries = clients?.reduce((sum, c) => {
    return sum + (c.delivery_items?.length ?? 0);
  }, 0) ?? 0;

  // Onboarding checklist logic
  const hasClients = (clients?.length ?? 0) > 0;
  const hasDeliveries = totalDeliveries > 0;
  const hasMagicLink = clients?.some(c => c.magic_link_token) ?? false;

  const onboardingSteps = [
    {
      id: 'add-client',
      title: 'Add your first client',
      description: 'Create a client to start tracking deliveries.',
      completed: hasClients,
      action: () => setCreateClientDialogOpen(true),
      actionLabel: 'Add Client',
    },
    {
      id: 'log-delivery',
      title: 'Log a delivery',
      description: 'Record the value you deliver to clients.',
      completed: hasDeliveries,
    },
    {
      id: 'share-portal',
      title: 'Share your client portal',
      description: 'Generate a magic link to show clients their summary.',
      completed: hasMagicLink,
    },
  ];

  const stats = [
    {
      label: 'Total Clients',
      value: clients?.length ?? 0,
      icon: Users,
      color: 'text-primary',
    },
    {
      label: 'Active',
      value: activeClients.length,
      icon: TrendingUp,
      color: 'text-success',
    },
    {
      label: 'Deliveries',
      value: totalDeliveries,
      icon: CheckCircle2,
      color: 'text-primary',
    },
    {
      label: 'Paused',
      value: clients?.filter((c) => c.status === 'paused').length ?? 0,
      icon: Clock,
      color: 'text-accent-warm',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your client delivery operations.
        </p>
      </div>

      {/* Onboarding Checklist */}
      <OnboardingChecklist steps={onboardingSteps} />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold font-mono mt-2">{stat.value}</p>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center">
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Client List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Clients</h2>
          <Link
            to="/clients"
            className="text-sm text-primary hover:underline font-medium"
          >
            View all →
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : !clients?.length ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No clients yet.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add your first client to start tracking deliveries.
              </p>
              <Link
                to="/clients"
                className="inline-block mt-4 text-sm text-primary hover:underline font-medium"
              >
                Add a client →
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {clients.slice(0, 5).map((client) => {
              const statusCfg = CLIENT_STATUS_CONFIG[client.status as ClientStatus];
              const latestScope = client.scope_allocations?.[0];

              return (
                <Link key={client.id} to={`/clients/${client.id}`}>
                  <Card className="card-interactive">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                            {(client.company_name || client.contact_name)?.[0]?.toUpperCase() ?? '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              {client.company_name || client.contact_name}
                            </p>
                            {client.company_name && client.contact_name && (
                              <p className="text-sm text-muted-foreground truncate">
                                {client.contact_name}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`gap-1.5 shrink-0 ${statusCfg?.color ?? ''}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg?.dot ?? ''}`} aria-hidden="true" />
                          {statusCfg?.label ?? client.status}
                        </Badge>
                      </div>
                      {latestScope && (
                        <div className="mt-3 pl-14">
                          <ScopeTrackerCompact
                            allocation={latestScope}
                            deliveries={client.delivery_items ?? []}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
