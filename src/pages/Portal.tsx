import { useParams } from 'react-router-dom';
import { usePortalData } from '@/hooks/usePortalData';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { PortalScopeCard } from '@/components/portal/PortalScopeCard';
import { PortalTimeline } from '@/components/portal/PortalTimeline';
import { ApprovalCard } from '@/components/portal/ApprovalCard';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, ShieldAlert, Clock, ChevronDown } from 'lucide-react';
import { format, isSameMonth } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';

export default function Portal() {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, error } = usePortalData(token);
  const queryClient = useQueryClient();

  const handleApprovalAction = () => {
    if (token) {
      queryClient.invalidateQueries({ queryKey: queryKeys.portal.data(token) });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(0 0% 99%)' }}>
        <div className="text-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading your delivery summary...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage = error.message;
    const isExpired = errorMessage === 'EXPIRED_TOKEN';

    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'hsl(0 0% 99%)' }}>
        <div className="text-center max-w-sm">
          {isExpired ? (
            <>
              <Clock className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <h1 className="text-lg font-semibold mb-1">Link Expired</h1>
              <p className="text-sm text-muted-foreground">
                This delivery summary link has expired. Please ask your service provider for a new link.
              </p>
            </>
          ) : (
            <>
              <ShieldAlert className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <h1 className="text-lg font-semibold mb-1">Link Not Found</h1>
              <p className="text-sm text-muted-foreground">
                This delivery summary link is not valid. Please check with your service provider.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { client, operator, deliveries, scope_allocations } = data;
  const now = new Date();

  // Items pending approval (shown in their own section)
  const pendingApproval = deliveries.filter((d) => d.status === 'pending_approval');
  const pendingIds = new Set(pendingApproval.map((d) => d.id));

  // Separate current-period deliveries from past (exclude pending_approval to avoid duplicates)
  const currentDeliveries = deliveries.filter((d) => {
    if (pendingIds.has(d.id)) return false;
    const date = new Date(d.completed_at || d.created_at);
    return isSameMonth(date, now);
  });

  const pastDeliveries = deliveries.filter((d) => {
    if (pendingIds.has(d.id)) return false;
    const date = new Date(d.completed_at || d.created_at);
    return !isSameMonth(date, now);
  });

  // Current period scope allocations
  const currentScopes = scope_allocations.filter((s) => {
    const start = new Date(s.period_start);
    const end = new Date(s.period_end);
    return now >= start && now <= end;
  });

  // Group past deliveries by month
  const pastByMonth = pastDeliveries.reduce<Record<string, typeof pastDeliveries>>((acc, d) => {
    const date = new Date(d.completed_at || d.created_at);
    const key = format(date, 'yyyy-MM');
    if (!acc[key]) acc[key] = [];
    acc[key].push(d);
    return acc;
  }, {});

  const pastMonthKeys = Object.keys(pastByMonth).sort().reverse();

  // Calculate scope percentage for hero stats
  const scopePercentage = currentScopes.length > 0
    ? (() => {
        const scope = currentScopes[0];
        const scopeDeliveries = currentDeliveries.filter(d => d.scope_allocation_id === scope.id);
        const used = scopeDeliveries.reduce((sum, d) => sum + (d.scope_cost || 0), 0);
        return Math.round((used / scope.total_allocated) * 100);
      })()
    : 0;

  return (
    <PortalLayout
      operatorName={operator.full_name}
      businessName={operator.business_name}
      clientName={client.company_name || client.contact_name || 'Client'}
    >
      {/* Hero Stats */}
      <section className="grid grid-cols-3 gap-3">
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-mono text-primary">
              {currentDeliveries.filter(d => d.status === 'completed' || d.status === 'approved').length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Deliveries this month
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-mono text-success">
              {scopePercentage}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Scope used
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-mono text-accent-warm">
              {pendingApproval.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Pending approval
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Scope Tracker */}
      {currentScopes.length > 0 && (
        <section>
          <h2 className="text-base font-semibold mb-3">Scope</h2>
          <div className="space-y-3">
            {currentScopes.map((scope) => (
              <PortalScopeCard
                key={scope.id}
                allocation={scope}
                deliveries={currentDeliveries}
              />
            ))}
          </div>
        </section>
      )}

      {/* Pending Approvals - moved before timeline */}
      {pendingApproval.length > 0 && (
        <section>
          <h2 className="text-base font-semibold mb-3">
            Needs Your Approval
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              ({pendingApproval.length})
            </span>
          </h2>
          <div className="space-y-3">
            {pendingApproval.map((item) => (
              <ApprovalCard
                key={item.id}
                item={item}
                token={token!}
                onAction={handleApprovalAction}
              />
            ))}
          </div>
        </section>
      )}

      {/* Delivery Timeline */}
      <PortalTimeline deliveries={currentDeliveries} />

      {/* Past Months */}
      {pastMonthKeys.length > 0 && (
        <section>
          <h2 className="text-base font-semibold mb-3">Past Months</h2>
          <div className="space-y-2">
            {pastMonthKeys.map((monthKey) => {
              const items = pastByMonth[monthKey];
              const date = new Date(monthKey + '-01');
              const completed = items.filter((d) => d.status === 'completed' || d.status === 'approved').length;
              const totalCost = items.reduce((s, d) => s + (d.scope_cost || 0), 0);

              return (
                <Collapsible key={monthKey}>
                  <CollapsibleTrigger asChild>
                    <Card className="border-border/60 cursor-pointer hover:bg-muted/30 transition-colors">
                      <CardContent className="py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            {format(date, 'MMMM yyyy')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {completed}/{items.length} completed
                            {totalCost > 0 && ` · ${totalCost} units`}
                          </p>
                        </div>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 space-y-1.5 pl-2">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 py-1.5 text-sm text-muted-foreground"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            item.status === 'completed' || item.status === 'approved'
                              ? 'bg-green-500'
                              : 'bg-muted-foreground/30'
                          }`} />
                          <span className="truncate">{item.title}</span>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </section>
      )}
    </PortalLayout>
  );
}
