import { useState, useEffect, useMemo, useRef } from 'react';
import { isSameMonth } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/query-keys';
import { useClients } from '@/hooks/useClients';
import { useAuth } from '@/hooks/useAuth';
import { StatusBadge, TypedStatusBadge } from '@/components/ui/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { Users, CheckCircle2, Bell, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SCOPE_STATUS_CONFIG } from '@/lib/constants';
import { useScopeAlerts } from '@/hooks/useScopeAlerts';
import { getScopeStatus } from '@/lib/scope-utils';

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const hasAnimated = useRef(value !== 0);
  const [displayed, setDisplayed] = useState(hasAnimated.current ? value : 0);

  useEffect(() => {
    if (value === 0) return;
    if (hasAnimated.current) {
      setDisplayed(value);
      return;
    }
    const duration = 800;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * value));
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        hasAnimated.current = true;
      }
    };

    requestAnimationFrame(tick);
  }, [value]);

  return <span className={className}>{displayed}</span>;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    document.title = 'Dashboard — Luma';
    return () => { document.title = 'Luma'; };
  }, []);
  const { data: clients, isLoading } = useClients();
  const { alerts } = useScopeAlerts();

  const now = new Date();
  const stats = useMemo(() => {
    const thisMonthDeliveries = clients?.reduce((sum, c) =>
      sum + (c.delivery_items ?? []).filter((d) => {
        const date = new Date(d.completed_at || d.created_at);
        return isSameMonth(date, now);
      }).length, 0) ?? 0;
    return {
      total: clients?.length ?? 0,
      active: clients?.filter(c => c.status === 'active').length ?? 0,
      paused: clients?.filter(c => c.status === 'paused').length ?? 0,
      deliveries: thisMonthDeliveries,
    };
  }, [clients, now]);

  const { data: proposalsCount } = useQuery({
    queryKey: queryKeys.proposals.all,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('proposals')
        .select('id', { count: 'exact', head: true })
        .eq('operator_id', user!.id);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const hasClients = stats.total > 0;
  const hasDeliveries = stats.deliveries > 0;
  const hasMagicLink = clients?.some((c) => c.magic_link_token_hash) ?? false;
  const hasProposals = (proposalsCount ?? 0) > 0;

  const operatorName =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split('@')[0] ??
    'there';
  const firstName = operatorName.split(' ')[0];

  const hour = new Date().getHours();
  const morningGreetings = ['Good morning', 'Rise and shine', 'Morning'];
  const afternoonGreetings = ['Good afternoon', 'Hey there', 'Welcome back'];
  const eveningGreetings = ['Good evening', 'Evening', 'Hey there'];
  const greetingPool = hour < 12 ? morningGreetings : hour < 17 ? afternoonGreetings : eveningGreetings;
  const timeGreeting = greetingPool[Math.floor(Math.random() * greetingPool.length)];

  // Cross-client pending approvals for the dashboard action list
  const pendingApprovalItems = useMemo(() => {
    if (!clients) return [];
    return clients.flatMap((c) =>
      (c.delivery_items ?? [])
        .filter((d) => d.status === 'pending_approval')
        .map((d) => ({
          ...d,
          clientName: c.company_name || c.contact_name || 'Unknown',
          clientId: c.id,
        })),
    );
  }, [clients]);

  // Getting Started card: auto-collapse once all 4 steps done OR user dismisses
  const allDone = hasClients && hasDeliveries && hasMagicLink && hasProposals;
  const [startedDismissed, setStartedDismissed] = useState(() =>
    localStorage.getItem('luma_gs_dismissed') === '1',
  );
  const showGettingStarted = !startedDismissed && !allDone;

  const checklistItems = [
    { id: 'new-client', label: 'New Client', completed: hasClients, action: () => navigate('/clients') },
    {
      id: 'log-delivery',
      label: 'Log Delivery',
      completed: hasDeliveries,
      action: clients?.[0] ? () => navigate(`/clients/${clients[0].id}?tab=deliveries`) : () => navigate('/clients'),
    },
    {
      id: 'share-portal',
      label: 'Share Portal',
      completed: hasMagicLink,
      active: !hasMagicLink && hasClients,
      action: clients?.[0] ? () => navigate(`/clients/${clients[0].id}?tab=portal`) : undefined,
    },
    { id: 'try-template', label: 'Try Template', completed: hasProposals, active: !hasProposals && hasClients, action: () => navigate('/proposals/new') },
  ];

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">
            <span className="sm:hidden">{timeGreeting}, {firstName}</span>
            <span className="hidden sm:inline">{timeGreeting}, {operatorName}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Here's your business at a glance</p>
        </div>
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Users}
          label="Total Clients"
          value={isLoading ? '—' : stats.total}
          trend={{ direction: 'up', label: `${stats.active} active` }}
        />
        <StatCard
          icon={CheckCircle2}
          label="Deliveries This Month"
          value={isLoading ? '—' : stats.deliveries}
          iconClassName="bg-success/10 text-success"
          trend={{ direction: 'up', label: 'This month' }}
        />
        <StatCard
          icon={Bell}
          label="Pending Approvals"
          value={isLoading ? '—' : pendingApprovalItems.length}
          iconClassName={pendingApprovalItems.length > 0 ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'}
          trend={{
            direction: pendingApprovalItems.length > 0 ? 'down' : 'neutral',
            label: pendingApprovalItems.length > 0 ? 'Needs attention' : 'All clear',
          }}
        />
        <StatCard
          icon={AlertTriangle}
          label="Scope Alerts"
          value={isLoading ? '—' : alerts.length}
          iconClassName={alerts.length > 0 ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}
          trend={{
            direction: alerts.length > 0 ? 'down' : 'neutral',
            label: alerts.length > 0 ? `${alerts.length} client${alerts.length > 1 ? 's' : ''}` : 'All clear',
          }}
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4">

        {/* LEFT: Scope Alerts + Recent Clients */}
        <div className="space-y-4">

          {/* Scope Alerts card */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
              <div>
                <p className="text-[14px] font-semibold">Scope Alerts</p>
                <p className="text-[12px] text-muted-foreground">Clients nearing or exceeding allocated hours</p>
              </div>
              <Link to="/clients" className="text-xs text-primary hover:underline font-medium">
                View all →
              </Link>
            </div>
            <div>
              {isLoading ? (
                <div className="p-4 space-y-2">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
                </div>
              ) : alerts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No scope alerts — everything looks good!
                </p>
              ) : (
                alerts.map((alert, index) => {
                  const tier = getScopeStatus(alert.percentage);
                  const statusCfg = SCOPE_STATUS_CONFIG[tier];
                  return (
                    <Link
                      key={alert.clientId}
                      to={`/clients/${alert.clientId}?tab=scope`}
                      className="flex items-center justify-between py-2.5 px-4 border-b border-border/40 last:border-0 hover:bg-muted/40 transition-colors"
                      style={{ animationDelay: `${index * 60}ms` }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-[11px] shrink-0">
                          {alert.clientName[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13.5px] font-medium truncate">{alert.clientName}</p>
                          <div className="w-32 h-1.5 bg-border rounded-full overflow-hidden mt-1">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                alert.percentage >= 100 ? 'bg-destructive' :
                                alert.percentage >= 90 ? 'bg-warning' : 'bg-primary'
                              )}
                              style={{ width: `${Math.min(alert.percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="font-mono text-xs text-muted-foreground">
                          {Math.round(alert.percentage)}%
                        </span>
                        <StatusBadge
                          label={statusCfg.label}
                          colorClasses={`${statusCfg.bgColor} ${statusCfg.color}`}
                          size="sm"
                        />
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Clients table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
              <p className="text-[14px] font-semibold">Recent Clients</p>
              <Link to="/clients" className="text-xs text-primary hover:underline font-medium">
                View all →
              </Link>
            </div>
            {isLoading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : !clients?.length ? (
              <div className="py-10 text-center">
                <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No clients yet.</p>
                <Link to="/clients" className="inline-block mt-3 text-sm text-primary hover:underline font-medium">
                  Add a client →
                </Link>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-2.5">Client</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-2.5">Deliveries</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.slice(0, 6).map((client) => {
                    const deliveryCount = client.delivery_items?.length ?? 0;
                    return (
                      <tr
                        key={client.id}
                        className="hover:bg-muted/40 transition-colors cursor-pointer border-b border-border/40 last:border-0"
                        onClick={() => navigate(`/clients/${client.id}`)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-[11px] shrink-0">
                              {(client.company_name || client.contact_name)?.[0]?.toUpperCase() ?? '?'}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13.5px] font-medium truncate">
                                {client.company_name || client.contact_name}
                              </p>
                              {client.company_name && client.contact_name && (
                                <p className="text-[11.5px] text-muted-foreground truncate">{client.contact_name}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[13.5px] font-semibold">{deliveryCount}</span>
                        </td>
                        <td className="px-4 py-3">
                          <TypedStatusBadge type="client" status={client.status} className="text-xs" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* RIGHT: Pending Approvals + Getting Started */}
        <div className="space-y-4">

          {/* Pending Approvals */}
          {pendingApprovalItems.length > 0 && (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
                <div>
                  <p className="text-[14px] font-semibold flex items-center gap-2">
                    Pending Approvals
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-warning/10 text-warning text-[10px] font-bold">
                      {pendingApprovalItems.length}
                    </span>
                  </p>
                  <p className="text-[12px] text-muted-foreground">Clients waiting for sign-off</p>
                </div>
              </div>
              <div>
                {pendingApprovalItems.slice(0, 5).map((item) => (
                  <Link
                    key={item.id}
                    to={`/clients/${item.clientId}?tab=deliveries`}
                    className="flex items-center justify-between py-2.5 px-4 border-b border-border/40 last:border-0 hover:bg-muted/40 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium truncate">{item.title}</p>
                      <p className="text-[11.5px] text-muted-foreground">{item.clientName}</p>
                    </div>
                    <span className="text-xs text-primary font-medium shrink-0 ml-3">Review →</span>
                  </Link>
                ))}
                {pendingApprovalItems.length > 5 && (
                  <p className="text-xs text-muted-foreground px-4 py-2">+{pendingApprovalItems.length - 5} more</p>
                )}
              </div>
            </div>
          )}

          {/* Getting Started checklist */}
          {showGettingStarted && (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
                <div>
                  <p className="text-[14px] font-semibold">Getting Started</p>
                  <p className="text-[12px] text-muted-foreground">Complete these steps to get running</p>
                </div>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => {
                    localStorage.setItem('luma_gs_dismissed', '1');
                    setStartedDismissed(true);
                  }}
                >
                  ✕
                </button>
              </div>
              <div className="p-3 space-y-1">
                {checklistItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.action}
                    disabled={!item.action}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-left',
                      item.active ? 'bg-primary/8 border border-primary/20' :
                      item.completed ? 'opacity-60' :
                      item.action ? 'hover:bg-muted/50 cursor-pointer' : 'cursor-default'
                    )}
                  >
                    <div className={cn(
                      'w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0',
                      item.completed ? 'bg-success' :
                      item.active ? 'border-2 border-primary' : 'border-2 border-muted-foreground/30'
                    )}>
                      {item.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <span className={cn(
                      'text-[13px] font-medium',
                      item.active ? 'text-primary' : item.completed ? 'text-muted-foreground' : 'text-foreground'
                    )}>
                      {item.label}
                    </span>
                    {item.active && <span className="ml-auto text-xs text-primary font-medium">→</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
