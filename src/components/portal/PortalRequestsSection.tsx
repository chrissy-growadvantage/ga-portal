import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, ChevronDown, Inbox } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { GA_REQUEST_STATUS_CONFIG } from '@/lib/constants';
import type { PortalScopeRequest } from '@/types/portal';
import type { GaRequestStatus } from '@/types/database';

type PortalRequestsSectionProps = {
  requests: PortalScopeRequest[];
  onRequestSomething: () => void;
};

function getMonthKey(dateStr: string) {
  const d = parseISO(dateStr);
  return format(d, 'yyyy-MM');
}

function getMonthLabel(monthKey: string) {
  return format(parseISO(monthKey + '-01'), 'MMMM yyyy');
}

function groupByMonth(requests: PortalScopeRequest[]) {
  const groups: Record<string, PortalScopeRequest[]> = {};

  for (const req of requests) {
    const key = getMonthKey(req.created_at);
    if (!groups[key]) groups[key] = [];
    groups[key].push(req);
  }

  // Sort month keys newest first
  const keys = Object.keys(groups).sort((a, b) => b.localeCompare(a));
  return { groups, keys };
}

function RequestCard({ request }: { request: PortalScopeRequest }) {
  const gaStatus = request.ga_status as GaRequestStatus | null;
  const statusCfg = gaStatus
    ? GA_REQUEST_STATUS_CONFIG[gaStatus]
    : GA_REQUEST_STATUS_CONFIG.submitted;

  const isWaitingOnClient = gaStatus === 'waiting_on_client';

  return (
    <div
      className={cn(
        'rounded-lg border bg-background p-3',
        isWaitingOnClient
          ? 'border-destructive/40 border-l-4 border-l-destructive'
          : 'border-border/60',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{request.title}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {request.category && (
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                {request.category}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {format(parseISO(request.created_at), 'MMM d')}
            </span>
          </div>
          {request.admin_note && (
            <div className="mt-2 pl-3 border-l-2 border-border">
              <p className="text-xs text-muted-foreground italic">{request.admin_note}</p>
            </div>
          )}
        </div>
        <Badge
          variant="secondary"
          className={cn('shrink-0 text-xs whitespace-nowrap', statusCfg.color)}
        >
          {statusCfg.label}
        </Badge>
      </div>
    </div>
  );
}

function MonthGroup({
  monthKey,
  requests,
  defaultOpen,
}: {
  monthKey: string;
  requests: PortalScopeRequest[];
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const label = getMonthLabel(monthKey);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          className="w-full flex items-center justify-between py-2 text-left"
          aria-expanded={open}
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
            <span className="ml-2 font-normal normal-case tracking-normal text-muted-foreground/70">
              ({requests.length})
            </span>
          </span>
          <ChevronDown
            className={cn('w-4 h-4 text-muted-foreground transition-transform', open && 'rotate-180')}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-2 pb-4">
          {requests.map((req) => (
            <RequestCard key={req.id} request={req} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function PortalRequestsSection({
  requests,
  onRequestSomething,
}: PortalRequestsSectionProps) {
  const { groups, keys } = groupByMonth(requests);

  return (
    <div>
      {/* CTA card */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl px-5 py-4 flex items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-sm font-semibold">Got something on your mind?</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Ask your team to do something, flag an issue, or request a new deliverable.
          </p>
        </div>
        <Button onClick={onRequestSomething} className="gap-2 shrink-0 min-h-[40px] text-sm">
          <Plus className="w-4 h-4" />
          Request Something
        </Button>
      </div>

      {keys.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Inbox className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No requests yet</p>
          <p className="text-xs mt-1 opacity-70">Use the button above to send your team a message.</p>
        </div>
      ) : (
        <div className="divide-y divide-border/40">
          {keys.map((monthKey, index) => (
            <MonthGroup
              key={monthKey}
              monthKey={monthKey}
              requests={groups[monthKey]}
              defaultOpen={index === 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
