import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { ProposalWithDetails } from '@/types/database';

// --- Timeline Types ---

interface TimelineEvent {
  date: string;
  label: string;
  icon: 'create' | 'send' | 'view' | 'accept' | 'decline';
}

// --- Helpers ---

function buildTimeline(proposal: ProposalWithDetails): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  events.push({
    date: proposal.created_at,
    label: 'Draft created',
    icon: 'create',
  });

  if (proposal.sent_at) {
    const email = proposal.client?.contact_email;
    events.push({
      date: proposal.sent_at,
      label: email ? `Proposal sent to ${email}` : 'Proposal sent',
      icon: 'send',
    });
  }

  if (proposal.viewed_at) {
    events.push({
      date: proposal.viewed_at,
      label: 'Client viewed proposal',
      icon: 'view',
    });
  }

  if (proposal.accepted_at) {
    const signer = proposal.agreement?.signer_name;
    events.push({
      date: proposal.accepted_at,
      label: signer ? `Client accepted proposal (signer: ${signer})` : 'Client accepted proposal',
      icon: 'accept',
    });
  }

  if (proposal.declined_at) {
    events.push({
      date: proposal.declined_at,
      label: 'Client declined proposal',
      icon: 'decline',
    });
  }

  // Most recent first
  return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// --- TimelineDot ---

function TimelineDot({ icon, compact }: { icon: TimelineEvent['icon']; compact: boolean }) {
  const colorMap = {
    create: 'bg-status-neutral',
    send: 'bg-primary',
    view: 'bg-status-info',
    accept: 'bg-status-success',
    decline: 'bg-status-danger',
  };

  return (
    <div
      className={cn(
        'rounded-full shrink-0',
        compact ? 'w-2 h-2 mt-1' : 'w-2.5 h-2.5 mt-1.5',
        colorMap[icon]
      )}
      aria-hidden="true"
    />
  );
}

// --- ProposalActivityTimeline ---

interface ProposalActivityTimelineProps {
  proposal: ProposalWithDetails;
  variant?: 'default' | 'compact';
}

export function ProposalActivityTimeline({ proposal, variant = 'default' }: ProposalActivityTimelineProps) {
  const events = useMemo(() => buildTimeline(proposal), [proposal]);
  const isCompact = variant === 'compact';

  return (
    <Card>
      <CardContent className={isCompact ? 'p-4' : 'p-5'}>
        <h3 className={cn(
          'font-semibold mb-4',
          isCompact ? 'text-xs uppercase tracking-wide' : 'text-sm'
        )}>
          Activity
        </h3>
        <div className={isCompact ? 'space-y-3' : 'space-y-4'}>
          {events.map((event, i) => (
            <div key={i} className="flex items-start gap-3">
              <TimelineDot icon={event.icon} compact={isCompact} />
              <div className="min-w-0 flex-1">
                <p className={isCompact ? 'text-xs' : 'text-sm'}>{event.label}</p>
                <p className={cn(
                  'text-muted-foreground',
                  isCompact ? 'text-[10px]' : 'text-xs'
                )}>
                  {format(new Date(event.date), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
