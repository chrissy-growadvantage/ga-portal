import { useMemo } from 'react';
import { CheckCircle, MessageSquare, FileText, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useDeliveries } from '@/hooks/useDeliveries';
import { useScopeRequests } from '@/hooks/useScopeRequests';
import { useClientNotes } from '@/hooks/useClientNotes';
import { TypedStatusBadge, StatusBadge } from '@/components/ui/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { REQUEST_STATUS_CONFIG } from '@/lib/constants';
import type { RequestStatus } from '@/types/database';

type DeliveryEntry = {
  kind: 'delivery';
  id: string;
  title: string;
  status: string;
  created_at: string;
};

type RequestEntry = {
  kind: 'request';
  id: string;
  title: string;
  status: string;
  created_at: string;
};

type NoteEntry = {
  kind: 'note';
  id: string;
  body: string;
  created_at: string;
};

type TimelineEntry = DeliveryEntry | RequestEntry | NoteEntry;

function TimelineRow({ entry, isLast }: { entry: TimelineEntry; isLast: boolean }) {
  const timestamp = formatDistanceToNow(new Date(entry.created_at), { addSuffix: true });

  const connector = !isLast && (
    <div className="w-px flex-1 bg-border mt-1" />
  );

  if (entry.kind === 'delivery') {
    return (
      <div className="relative flex gap-3 pb-5 last:pb-0">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-status-success/10 flex items-center justify-center shrink-0">
            <CheckCircle className="w-4 h-4 text-status-success" />
          </div>
          {connector}
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium truncate">{entry.title}</p>
            <TypedStatusBadge type="delivery" status={entry.status} className="shrink-0" />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{timestamp}</p>
        </div>
      </div>
    );
  }

  if (entry.kind === 'request') {
    const cfg = REQUEST_STATUS_CONFIG[entry.status as RequestStatus];
    return (
      <div className="relative flex gap-3 pb-5 last:pb-0">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-status-info/10 flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4 text-status-info" />
          </div>
          {connector}
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium truncate">{entry.title}</p>
            {cfg && (
              <StatusBadge
                label={cfg.label}
                colorClasses={cfg.color}
                className="shrink-0"
              />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{timestamp}</p>
        </div>
      </div>
    );
  }

  // note
  return (
    <div className="relative flex gap-3 pb-5 last:pb-0">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-muted-foreground" />
        </div>
        {connector}
      </div>
      <div className="flex-1 min-w-0 pt-1">
        <p className="text-sm line-clamp-2">{entry.body}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{timestamp}</p>
      </div>
    </div>
  );
}

export function ClientCommunicationTimeline({ clientId }: { clientId: string }) {
  const { data: deliveries, isLoading: dLoading } = useDeliveries(clientId);
  const { data: requests, isLoading: rLoading } = useScopeRequests(clientId);
  const { data: notes, isLoading: nLoading } = useClientNotes(clientId);

  const isLoading = dLoading || rLoading || nLoading;

  const entries = useMemo((): TimelineEntry[] => {
    const items: TimelineEntry[] = [
      ...(deliveries ?? []).map((d): DeliveryEntry => ({
        kind: 'delivery',
        id: d.id,
        title: d.title,
        status: d.status,
        created_at: d.created_at,
      })),
      ...(requests ?? []).map((r): RequestEntry => ({
        kind: 'request',
        id: r.id,
        title: r.title,
        status: r.status,
        created_at: r.created_at,
      })),
      ...(notes ?? []).map((n): NoteEntry => ({
        kind: 'note',
        id: n.id,
        body: n.body,
        created_at: n.created_at,
      })),
    ];
    return items.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [deliveries, requests, notes]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!entries.length) {
    return (
      <div className="rounded-xl border border-border bg-card py-12 text-center">
        <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="font-medium text-foreground">No activity yet</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
          Activity will appear here as you log deliveries, handle requests, and add notes for this client.
        </p>
      </div>
    );
  }

  return (
    <div>
      {entries.map((entry, idx) => (
        <TimelineRow
          key={`${entry.kind}-${entry.id}`}
          entry={entry}
          isLast={idx === entries.length - 1}
        />
      ))}
    </div>
  );
}
