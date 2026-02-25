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

function TimelineDot({ icon }: { icon: TimelineEvent['icon'] }) {
  const colorMap = {
    create: 'bg-gray-400',
    send: 'bg-primary',
    view: 'bg-blue-500',
    accept: 'bg-emerald-500',
    decline: 'bg-red-500',
  };

  return (
    <div className={cn('w-2.5 h-2.5 rounded-full shrink-0 mt-1.5', colorMap[icon])} />
  );
}

// --- ProposalActivityTimeline ---

interface ProposalActivityTimelineProps {
  proposal: ProposalWithDetails;
}

export function ProposalActivityTimeline({ proposal }: ProposalActivityTimelineProps) {
  const events = useMemo(() => buildTimeline(proposal), [proposal]);

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold mb-4">Activity</h3>
        <div className="space-y-4">
          {events.map((event, i) => (
            <div key={i} className="flex items-start gap-3">
              <TimelineDot icon={event.icon} />
              <div className="min-w-0 flex-1">
                <p className="text-sm">{event.label}</p>
                <p className="text-xs text-muted-foreground">
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
