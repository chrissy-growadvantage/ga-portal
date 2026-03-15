import { useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { usePortalData } from '@/hooks/usePortalData';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { PortalProvider } from '@/contexts/PortalContext';
import {
  PortalDesktopSidebar,
  PortalMobileNav,
  SECTION_ICONS,
  type PortalSection,
} from '@/components/portal/PortalSidebar';
import { PortalRightNow } from '@/components/portal/PortalRightNow';
import { PortalNeedsAttention } from '@/components/portal/PortalNeedsAttention';
import { PortalMeetingCard } from '@/components/portal/PortalMeetingCard';
import { PortalOnboardingStepper } from '@/components/portal/PortalOnboardingStepper';
import { PortalRequestsSection } from '@/components/portal/PortalRequestsSection';
import { PortalClientTasks } from '@/components/portal/PortalClientTasks';
import { PortalWorkVisibility } from '@/components/portal/PortalWorkVisibility';
import { PortalDocumentsLinks } from '@/components/portal/PortalDocumentsLinks';
import { PortalRequestForm } from '@/components/portal/PortalRequestForm';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DELIVERY_STATUS_CONFIG } from '@/lib/constants';
import { Loader2, ShieldAlert, Clock, Sparkles } from 'lucide-react';
import { isSameMonth, isAfter, subDays, format } from 'date-fns';
import type { PortalData } from '@/types/portal';

export default function Portal() {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, isFetching, error } = usePortalData(token);
  const queryClient = useQueryClient();
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);

  const handleApprovalAction = () => {
    if (token) {
      queryClient.invalidateQueries({ queryKey: queryKeys.portal.data(token) });
    }
  };

  const handleRefetch = () => {
    if (token) {
      queryClient.invalidateQueries({ queryKey: queryKeys.portal.data(token) });
    }
  };

  // Use isLoading && isFetching to prevent eternal spinner when token is undefined
  if (isLoading && isFetching) {
    return (
      <div className="min-h-screen bg-[hsl(var(--portal-background))]">
        {/* Header skeleton */}
        <div className="border-b border-border/40 bg-background/80 px-4 py-3 flex items-center justify-between">
          <div className="h-5 w-32 rounded bg-muted animate-pulse" />
          <div className="h-4 w-20 rounded bg-muted animate-pulse" />
        </div>
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
          {/* Greeting card skeleton */}
          <div className="rounded-xl border border-border/50 bg-muted/20 px-5 py-4 space-y-2">
            <div className="h-4 w-40 rounded bg-muted animate-pulse" />
            <div className="h-3 w-64 rounded bg-muted animate-pulse" />
          </div>
          {/* Content card skeletons */}
          <div className="rounded-xl border border-border/60 bg-background p-5 space-y-3">
            <div className="h-4 w-28 rounded bg-muted animate-pulse" />
            <div className="h-3 w-full rounded bg-muted animate-pulse" />
            <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
          </div>
          <div className="rounded-xl border border-border/60 bg-background p-5 space-y-3">
            <div className="h-4 w-36 rounded bg-muted animate-pulse" />
            <div className="h-3 w-full rounded bg-muted animate-pulse" />
            <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
          </div>
          {/* Status text */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Securely loading your client portal…
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage = error.message;
    const isExpired = errorMessage === 'EXPIRED_TOKEN';

    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-portal-background">
        <div className="text-center max-w-sm">
          {isExpired ? (
            <>
              <Clock className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <h1 className="text-lg font-semibold mb-1">Link Expired</h1>
              <p className="text-sm text-muted-foreground">
                This portal link has expired. Ask your service provider
                to send you a fresh one.
              </p>
            </>
          ) : (
            <>
              <ShieldAlert className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <h1 className="text-lg font-semibold mb-1">Link Not Found</h1>
              <p className="text-sm text-muted-foreground">
                This portal link isn't valid. Double-check the link or
                ask your service provider to resend it.
              </p>
            </>
          )}
          <div className="mt-6 flex flex-col items-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Try again
            </button>
            <p className="text-xs text-muted-foreground/60">
              If this keeps happening, let your provider know the link isn't working.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <PortalProvider token={token!} data={data} refetch={handleRefetch}>
      <PortalContent
        token={token!}
        data={data}
        requestDialogOpen={requestDialogOpen}
        setRequestDialogOpen={setRequestDialogOpen}
        onApprovalAction={handleApprovalAction}
        onRefetch={handleRefetch}
      />
    </PortalProvider>
  );
}

type PortalContentProps = {
  token: string;
  data: PortalData;
  requestDialogOpen: boolean;
  setRequestDialogOpen: (open: boolean) => void;
  onApprovalAction: () => void;
  onRefetch: () => void;
};

// Extracted to a separate component so PortalProvider is available above
function PortalContent({
  token,
  data,
  requestDialogOpen,
  setRequestDialogOpen,
  onApprovalAction,
  onRefetch,
}: PortalContentProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSection = searchParams.get('section') ?? 'home';
  const {
    client,
    operator,
    deliveries = [],
    scope_allocations: scopeAllocations = [],
    agreements = [],
    monthly_snapshots: monthlySnapshots = [],
    scope_requests: scopeRequests = [],
    onboarding_stages: onboardingStages = [],
    client_tasks: clientTasks = [],
  } = data;
  const now = new Date();

  const clientDisplayName =
    client.contact_name || client.company_name || 'Client';

  // Pending approvals
  const pendingApproval = deliveries.filter(
    (d) => d.status === 'pending_approval',
  );
  const pendingIds = new Set(pendingApproval.map((d) => d.id));

  // Current-month deliveries (excluding pending_approval to avoid duplicates)
  const currentDeliveries = deliveries.filter((d) => {
    if (pendingIds.has(d.id)) return false;
    const date = new Date(d.completed_at || d.created_at);
    return isSameMonth(date, now);
  });

  // Past deliveries for collapsible past months
  const pastDeliveries = deliveries.filter((d) => {
    if (pendingIds.has(d.id)) return false;
    const date = new Date(d.completed_at || d.created_at);
    return !isSameMonth(date, now);
  });

  // Current period scope allocations
  const currentScopes = scopeAllocations.filter((s) => {
    const start = new Date(s.period_start);
    const end = new Date(s.period_end);
    return now >= start && now <= end;
  });

  // Group past deliveries by month
  const pastByMonth = pastDeliveries.reduce<
    Record<string, typeof pastDeliveries>
  >((acc, d) => {
    const date = new Date(d.completed_at || d.created_at);
    const key = format(date, 'yyyy-MM');
    if (!acc[key]) acc[key] = [];
    acc[key].push(d);
    return acc;
  }, {});

  const pastMonthKeys = Object.keys(pastByMonth).sort().reverse();

  // Scope percentage for stat pills
  const scopePercentage =
    currentScopes.length > 0
      ? (() => {
          const scope = currentScopes[0];
          const scopeDeliveries = currentDeliveries.filter(
            (d) => d.scope_allocation_id === scope.id,
          );
          const used = scopeDeliveries.reduce(
            (sum, d) => sum + (d.scope_cost || 0),
            0,
          );
          return Math.round((used / scope.total_allocated) * 100);
        })()
      : 0;

  // Recently resolved requests (approved/declined within 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentlyResolvedRequests = scopeRequests.filter(
    (r) =>
      (r.status === 'approved' || r.status === 'declined') &&
      new Date(r.created_at) >= sevenDaysAgo,
  );

  // Section visibility
  const hasOnboarding = onboardingStages.length > 0;
  const hasTasks = clientTasks.length > 0;
  const pendingTasks = clientTasks.filter((t) => !t.completed_at);
  const needsAttentionCount =
    pendingApproval.length + recentlyResolvedRequests.length;
  const hasAgreements =
    !!client.portal_stripe_url ||
    !!client.portal_intake_url ||
    agreements.length > 0;
  const hasFilesTools =
    !!client.portal_slack_url ||
    !!client.portal_drive_url ||
    !!client.portal_booking_url ||
    (monthlySnapshots && monthlySnapshots.length > 0);
  const hasScope = currentScopes.length > 0;

  // This week's deliveries (last 7 days, completed/approved only)
  const sevenDaysAgoDate = subDays(now, 7);
  const thisWeekDeliveries = useMemo(
    () =>
      deliveries.filter((d) => {
        if (d.status !== 'completed' && d.status !== 'approved') return false;
        const date = new Date(d.completed_at || d.updated_at || d.created_at);
        return isAfter(date, sevenDaysAgoDate);
      }),
    [deliveries, sevenDaysAgoDate],
  );

  // Greeting narrative — plain English summary for the client
  const greeting = useMemo(() => {
    const hour = now.getHours();
    const timeGreeting =
      hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const firstName = (client.contact_name ?? client.company_name)?.split(' ')[0] ?? 'there';
    const suffixes = [
      `, ${firstName}.`,
      `, ${firstName} — here's your update.`,
      `. Here's where things stand, ${firstName}.`,
      `, ${firstName} — everything's in one place.`,
      `. Good to have you here, ${firstName}.`,
    ];
    const idx = Math.floor(Math.random() * suffixes.length);
    return `${timeGreeting}${suffixes[idx]}`;
  }, [client, now]);

  const narrativeSentence = useMemo(() => {
    const monthName = format(now, 'MMMM');
    const parts: string[] = [];
    if (currentDeliveries.length > 0) {
      parts.push(
        `Your team completed ${currentDeliveries.length} ${currentDeliveries.length === 1 ? 'delivery' : 'deliveries'} in ${monthName}`,
      );
    } else {
      parts.push(`Your team is working on ${monthName}'s deliveries`);
    }
    if (currentScopes.length > 0 && scopePercentage > 0) {
      parts.push(`and you're ${scopePercentage}% through your monthly budget`);
    }
    const sentence = parts.join(' ') + '.';
    if (pendingApproval.length > 0) {
      return (
        sentence +
        ` ${pendingApproval.length} ${pendingApproval.length === 1 ? 'item needs' : 'items need'} your approval.`
      );
    }
    return sentence;
  }, [currentDeliveries, currentScopes, scopePercentage, pendingApproval, now]);

  // All deliveries sorted newest-first for the delivery timeline
  const allDeliveriesSorted = useMemo(
    () =>
      [...deliveries].sort((a, b) => {
        const aDate = new Date(a.completed_at || a.created_at);
        const bDate = new Date(b.completed_at || b.created_at);
        return bDate.getTime() - aDate.getTime();
      }),
    [deliveries],
  );

  // Build sidebar sections
  const sections: PortalSection[] = useMemo(
    () => [
      {
        id: 'home',
        label: 'Home',
        icon: SECTION_ICONS.home,
        visible: true,
        hasAlert: needsAttentionCount > 0,
        alertCount: needsAttentionCount,
      },
      {
        id: 'plan',
        label: 'My Plan',
        icon: SECTION_ICONS.scope,
        visible: hasScope,
      },
      {
        id: 'requests',
        label: 'Ask Your Team',
        icon: SECTION_ICONS.requests,
        visible: true,
      },
      {
        id: 'resources',
        label: 'Resources',
        icon: SECTION_ICONS['files-tools'],
        visible: !!(hasFilesTools || hasAgreements),
      },
      {
        id: 'tasks',
        label: 'Tasks',
        icon: SECTION_ICONS.tasks,
        visible: hasTasks,
        hasAlert: pendingTasks.length > 0,
        alertCount: pendingTasks.length,
      },
      {
        id: 'work',
        label: 'Work Done',
        icon: SECTION_ICONS.work,
        visible: true,
      },
      {
        id: 'onboarding',
        label: 'Onboarding',
        icon: SECTION_ICONS.onboarding,
        visible: hasOnboarding,
      },
    ],
    [
      hasOnboarding,
      needsAttentionCount,
      hasTasks,
      pendingTasks.length,
      hasAgreements,
      hasFilesTools,
      hasScope,
    ],
  );

  // Render the active section's content
  const renderContent = () => {
    switch (activeSection) {
      case 'home':
        return (
          <>
            {/* Operator message — shown when the operator has set a focus note */}
            {client.this_month_focus && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-primary mb-1">
                  From your team
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                  {client.this_month_focus}
                </p>
              </div>
            )}

            {/* Pending Approvals — action items first */}
            {needsAttentionCount > 0 && (
              <PortalNeedsAttention
                pendingApprovals={pendingApproval}
                recentlyResolvedRequests={recentlyResolvedRequests}
                token={token}
                onApprovalAction={onApprovalAction}
                clientName={clientDisplayName}
              />
            )}

            {/* Greeting narrative */}
            <div className="rounded-xl border border-border/50 bg-muted/20 px-5 py-4 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-foreground">{greeting}</p>
                <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                  {narrativeSentence}
                </p>
                {thisWeekDeliveries.length > 0 && (
                  <p className="text-xs text-primary font-medium mt-1.5">
                    {thisWeekDeliveries.length} new{' '}
                    {thisWeekDeliveries.length === 1 ? 'delivery' : 'deliveries'} in
                    the last 7 days
                  </p>
                )}
              </div>
            </div>

            {/* Meeting card (time-sensitive) */}
            {client.next_meeting_at && (
              <PortalMeetingCard
                meetingAt={client.next_meeting_at}
                meetingLink={client.next_meeting_link ?? null}
              />
            )}

            {/* 3 stat cards */}
            <PortalRightNow
              client={client}
              currentDeliveries={currentDeliveries}
              currentScopes={currentScopes}
              pendingCount={pendingApproval.length}
              scopePercentage={scopePercentage}
            />

            {/* Tasks — max 3, then link to full tasks */}
            {hasTasks && pendingTasks.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold tracking-tight">
                    Your Tasks
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      ({pendingTasks.length} open)
                    </span>
                  </h2>
                  {pendingTasks.length > 3 && (
                    <button
                      onClick={() => setSearchParams({ section: 'tasks' })}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      View all
                    </button>
                  )}
                </div>
                <PortalClientTasks
                  tasks={clientTasks.filter((t) => !t.completed_at).slice(0, 3)}
                  token={token}
                  onTaskComplete={onRefetch}
                />
              </section>
            )}

            {/* Recent work — 3 items only, link to full Work Done */}
            {allDeliveriesSorted.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold tracking-tight">Recent Work</h2>
                  <button
                    onClick={() => setSearchParams({ section: 'work' })}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    See all
                  </button>
                </div>
                <div className="rounded-xl border border-border/60 bg-background overflow-hidden">
                  <div className="divide-y divide-border/40">
                    {allDeliveriesSorted.slice(0, 3).map((d) => {
                      const date = new Date(d.completed_at || d.created_at);
                      const statusCfg = DELIVERY_STATUS_CONFIG[d.status];
                      return (
                        <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                          <span className="text-xs text-muted-foreground whitespace-nowrap w-12 shrink-0">
                            {format(date, 'MMM d')}
                          </span>
                          <span className="flex-1 text-sm font-medium truncate">{d.title}</span>
                          <Badge
                            variant="secondary"
                            className={cn('text-xs shrink-0', statusCfg.color)}
                          >
                            {statusCfg.label}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}
          </>
        );

      case 'plan':
        return (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight">My Plan</h2>
            <PortalRightNow
              client={client}
              currentDeliveries={currentDeliveries}
              currentScopes={currentScopes}
              pendingCount={pendingApproval.length}
              scopePercentage={scopePercentage}
            />
          </section>
        );

      case 'requests':
        return (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight">Ask Your Team</h2>
            <PortalRequestsSection
              requests={scopeRequests}
              onRequestSomething={() => setRequestDialogOpen(true)}
            />
          </section>
        );

      case 'resources':
        return (
          <section className="space-y-6">
            <h2 className="text-lg font-semibold tracking-tight">Resources</h2>
            <PortalDocumentsLinks
              client={client}
              agreements={agreements}
              monthlySnapshots={monthlySnapshots ?? []}
              onViewAgreement={(agreement) =>
                navigate(`/portal/${token}/agreements/${agreement.id}`)
              }
            />
          </section>
        );

      case 'tasks':
        return (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight">
              Your Tasks
              {pendingTasks.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({pendingTasks.length} open)
                </span>
              )}
            </h2>
            <PortalClientTasks
              tasks={clientTasks}
              token={token}
              onTaskComplete={onRefetch}
            />
          </section>
        );

      case 'work':
        return (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight">Work Done</h2>
            <PortalWorkVisibility
              deliveries={currentDeliveries}
              pastByMonth={pastByMonth}
              pastMonthKeys={pastMonthKeys}
            />
          </section>
        );

      case 'onboarding':
        return (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight">Onboarding</h2>
            <PortalOnboardingStepper stages={onboardingStages} />
          </section>
        );

      default:
        return null;
    }
  };

  const sidebarProps = {
    sections,
    activeSection,
    onSectionChange: (section: string) => setSearchParams({ section }),
  };

  return (
    <PortalLayout
      operatorName={operator.full_name}
      businessName={operator.business_name}
      clientName={clientDisplayName}
      logoUrl={operator.portal_logo_url ?? undefined}
      primaryColor={operator.portal_primary_color ?? undefined}
      accentColor={operator.portal_accent_color ?? undefined}
      onRequestSomething={() => setRequestDialogOpen(true)}
      sidebar={<PortalDesktopSidebar {...sidebarProps} />}
      mobileNav={
        <div className="md:hidden">
          <PortalMobileNav {...sidebarProps} clientName={clientDisplayName} />
        </div>
      }
    >
      {renderContent()}

      {/* Request dialog — always mounted */}
      <PortalRequestForm
        token={token}
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
        onSuccess={onRefetch}
      />
    </PortalLayout>
  );
}
