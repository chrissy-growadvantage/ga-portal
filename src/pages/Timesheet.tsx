import { useState, useMemo } from 'react';
import { useTimeEntries, useDeleteTimeEntry } from '@/hooks/useTimeEntries';
import { useClients } from '@/hooks/useClients';
import { formatDuration, formatDurationShort, formatDecimalHours } from '@/lib/time-utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Clock, Plus, Trash2, Timer, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { ManualTimeEntryDialog } from '@/components/time-tracking';
import type { TimeEntry } from '@/types/database';

/** Group time entries by date (YYYY-MM-DD) */
function groupByDate(entries: TimeEntry[]): Map<string, TimeEntry[]> {
  const groups = new Map<string, TimeEntry[]>();
  for (const entry of entries) {
    const date = new Date(entry.started_at).toLocaleDateString('en-CA'); // YYYY-MM-DD
    const group = groups.get(date) ?? [];
    group.push(entry);
    groups.set(date, group);
  }
  return groups;
}

function formatDateHeading(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

function formatTimeRange(startedAt: string, endedAt: string | null): string {
  const start = new Date(startedAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  if (!endedAt) return `${start} — running`;
  const end = new Date(endedAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${start} — ${end}`;
}

export default function Timesheet() {
  const { data: entries, isLoading } = useTimeEntries();
  const { data: clients } = useClients();
  const deleteEntry = useDeleteTimeEntry();
  const [filterClientId, setFilterClientId] = useState<string>('all');
  const [manualEntryOpen, setManualEntryOpen] = useState(false);

  const filteredEntries = useMemo(() => {
    if (!entries) return [];
    if (filterClientId === 'all') return entries;
    return entries.filter((e) => e.client_id === filterClientId);
  }, [entries, filterClientId]);

  const grouped = useMemo(() => groupByDate(filteredEntries), [filteredEntries]);

  // Total duration for filtered entries (only completed)
  const totalSeconds = useMemo(() => {
    return filteredEntries.reduce((sum, e) => sum + (e.duration_seconds ?? 0), 0);
  }, [filteredEntries]);

  const clientMap = useMemo(() => {
    const map = new Map<string, string>();
    clients?.forEach((c) => map.set(c.id, c.company_name));
    return map;
  }, [clients]);

  const handleDelete = async (id: string) => {
    try {
      await deleteEntry.mutateAsync(id);
      toast.success('Time entry deleted');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete';
      toast.error(message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Timesheet</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and manage time spent on client work.
          </p>
        </div>
        <Button onClick={() => setManualEntryOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Time
        </Button>
      </div>

      {/* Filters & Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">Client:</label>
          <Select value={filterClientId} onValueChange={setFilterClientId}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All clients</SelectItem>
              {clients
                ?.filter((c) => c.status === 'active')
                .map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.company_name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {!isLoading && filteredEntries.length > 0 && (
          <div className="flex items-center gap-4 ml-auto text-sm">
            <span className="text-muted-foreground">
              {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
            </span>
            <Badge variant="secondary" className="gap-1.5 font-mono">
              <Clock className="w-3 h-3" />
              {formatDecimalHours(totalSeconds)} hrs
            </Badge>
          </div>
        )}
      </div>

      {/* Time entries grouped by date */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredEntries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Timer className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">No time entries yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Start a timer or add manual time to begin tracking.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([dateStr, dateEntries]) => {
            const dayTotal = dateEntries.reduce((s, e) => s + (e.duration_seconds ?? 0), 0);

            return (
              <div key={dateStr}>
                {/* Date heading */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {formatDateHeading(dateStr)}
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    {formatDurationShort(dayTotal)}
                  </span>
                </div>

                {/* Entries */}
                <div className="space-y-2">
                  {dateEntries.map((entry) => (
                    <Card key={entry.id}>
                      <CardContent className="py-3">
                        <div className="flex items-center gap-4">
                          {/* Duration */}
                          <div className="w-20 shrink-0 text-right">
                            <span className="font-mono text-sm font-medium tabular-nums">
                              {entry.duration_seconds
                                ? formatDurationShort(entry.duration_seconds)
                                : '—'}
                            </span>
                          </div>

                          {/* Details */}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{entry.description}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground">
                                {clientMap.get(entry.client_id) ?? 'Unknown client'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatTimeRange(entry.started_at, entry.ended_at)}
                              </span>
                              {entry.is_manual && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  Manual
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                                aria-label="Delete time entry"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete time entry?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete this time entry. This action cannot
                                  be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(entry.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ManualTimeEntryDialog open={manualEntryOpen} onOpenChange={setManualEntryOpen} />
    </div>
  );
}
