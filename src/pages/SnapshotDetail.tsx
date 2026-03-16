import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Edit3,
  Save,
  X,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useClient } from '@/hooks/useClients';
import { useMonthlySnapshot, useSaveSnapshot } from '@/hooks/useMonthlySnapshots';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExportReportButton } from '@/components/reports/ExportReportButton';
import { cn } from '@/lib/utils';
import type {
  MonthlySnapshot,
  PriorityItem,
  ProcessItem,
  AdhocItem,
  MeetingItem,
  DecisionItem,
  AgreementSnapshotItem,
} from '@/types/database';

// ── ID generator ───────────────────────────────────────────────────────────────

function newId(): string {
  return crypto.randomUUID();
}

// ── Editable field helpers ─────────────────────────────────────────────────────

interface TextFieldProps {
  label: string;
  value: string | null;
  editing: boolean;
  placeholder?: string;
  onChange: (v: string) => void;
  rows?: number;
}

function TextField({ label, value, editing, placeholder, onChange, rows = 3 }: TextFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {label}
      </Label>
      {editing ? (
        <Textarea
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? `Enter ${label.toLowerCase()}…`}
          rows={rows}
          className="resize-none"
        />
      ) : (
        <p className="text-sm whitespace-pre-wrap text-foreground min-h-[2rem]">
          {value || <span className="text-muted-foreground italic">—</span>}
        </p>
      )}
    </div>
  );
}

interface ScoreFieldProps {
  label: string;
  value: number | null;
  editing: boolean;
  onChange: (v: number | null) => void;
}

function ScoreField({ label, value, editing, onChange }: ScoreFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {label}
        </Label>
        <span className="text-sm font-bold text-foreground">
          {value !== null ? `${value}/10` : '—'}
        </span>
      </div>
      {editing ? (
        <div className="flex gap-1 flex-wrap">
          {Array.from({ length: 11 }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChange(i)}
              className={cn(
                'w-7 h-7 rounded text-xs font-semibold transition-colors',
                value === i
                  ? 'bg-status-success text-white'
                  : 'bg-muted hover:bg-muted/70 text-foreground',
              )}
            >
              {i}
            </button>
          ))}
        </div>
      ) : value !== null ? (
        <div className="flex gap-1">
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={i}
              className={cn(
                'h-2 flex-1 rounded-sm',
                i < value ? 'bg-status-success' : 'bg-muted',
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────────

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-base">
          <span className="w-7 h-7 rounded-full bg-status-success/10 text-status-success text-xs font-bold flex items-center justify-center shrink-0">
            {number}
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

// ── Page component ─────────────────────────────────────────────────────────────

export default function SnapshotDetail() {
  const { id: clientId, monthSlug } = useParams<{ id: string; monthSlug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const editing = searchParams.get('edit') === 'true';

  const { data: client } = useClient(clientId);
  const { data: snapshot, isLoading } = useMonthlySnapshot(clientId, monthSlug);
  const saveSnapshot = useSaveSnapshot();

  // Local draft state
  const [draft, setDraft] = useState<MonthlySnapshot | null>(null);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const initialDraft = useRef<MonthlySnapshot | null>(null);

  // Sync draft from server snapshot when NOT editing (or on first load)
  useEffect(() => {
    if (snapshot && !dirty) {
      setDraft(snapshot);
      initialDraft.current = snapshot;
    }
  }, [snapshot, dirty]);

  // Start editing
  const startEdit = () => {
    setSearchParams({ edit: 'true' }, { replace: true });
    setDirty(false);
  };

  // Cancel editing — discard draft
  const cancelEdit = () => {
    setDraft(initialDraft.current);
    setDirty(false);
    setSearchParams({}, { replace: true });
  };

  // Warn before unload
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  // Save
  const handleSave = useCallback(async () => {
    if (!draft) return;
    try {
      await saveSnapshot.mutateAsync({
        id: draft.id,
        client_id: draft.client_id,
        month_label: draft.month_label,
        month_slug: draft.month_slug,
        meeting_date: draft.meeting_date,
        attendees: draft.attendees,
        wins: draft.wins,
        deliverables_completed: draft.deliverables_completed,
        slipped: draft.slipped,
        insights: draft.insights,
        upcoming_priorities: draft.upcoming_priorities,
        key_deadlines: draft.key_deadlines,
        risks_constraints: draft.risks_constraints,
        process_improvements: draft.process_improvements,
        adhoc_requests: draft.adhoc_requests,
        primary_comms: draft.primary_comms,
        recurring_meetings: draft.recurring_meetings,
        response_times: draft.response_times,
        working_well: draft.working_well,
        unclear_messy: draft.unclear_messy,
        more_visibility: draft.more_visibility,
        priorities_score: draft.priorities_score,
        delivery_score: draft.delivery_score,
        communication_score: draft.communication_score,
        capacity_score: draft.capacity_score,
        decisions_actions: draft.decisions_actions,
        blockers: draft.blockers,
        time_saved: draft.time_saved,
        friction_removed: draft.friction_removed,
        systems_implemented: draft.systems_implemented,
        agreement_snapshot: draft.agreement_snapshot,
      });
      initialDraft.current = draft;
      setDirty(false);
      setSavedAt(new Date());
      setSearchParams({}, { replace: true });
      toast.success('Snapshot saved');
    } catch {
      toast.error('Failed to save snapshot');
    }
  }, [draft, saveSnapshot, setSearchParams]);

  // Generic field updater
  const update = useCallback(
    <K extends keyof MonthlySnapshot>(field: K, value: MonthlySnapshot[K]) => {
      setDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
      setDirty(true);
    },
    [],
  );

  // JSONB array helpers
  function updateArrayItem<T extends { id: string }>(
    field: keyof MonthlySnapshot,
    id: string,
    patch: Partial<T>,
  ) {
    setDraft((prev) => {
      if (!prev) return prev;
      const arr = (prev[field] as T[]).map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      );
      return { ...prev, [field]: arr };
    });
    setDirty(true);
  }

  function addArrayItem<T>(field: keyof MonthlySnapshot, item: T) {
    setDraft((prev) => {
      if (!prev) return prev;
      return { ...prev, [field]: [...(prev[field] as T[]), item] };
    });
    setDirty(true);
  }

  function removeArrayItem(field: keyof MonthlySnapshot, id: string) {
    setDraft((prev) => {
      if (!prev) return prev;
      const arr = (prev[field] as { id: string }[]).filter((item) => item.id !== id);
      return { ...prev, [field]: arr };
    });
    setDirty(true);
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!snapshot || !draft) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Snapshot not found.</p>
        <Link
          to={`/clients/${clientId}/snapshots`}
          className="text-primary hover:underline text-sm mt-2 inline-block"
        >
          ← Back to snapshots
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to={`/clients/${clientId}/snapshots`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">{draft.month_label}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {client?.company_name || client?.contact_name} · Monthly Snapshot
            </p>
          </div>
        </div>
        {!editing && (
          <div className="flex items-center gap-2">
            <ExportReportButton clientId={clientId!} monthSlug={monthSlug!} />
            <Button variant="outline" className="gap-2" onClick={startEdit}>
              <Edit3 className="w-4 h-4" />
              Edit
            </Button>
          </div>
        )}
      </div>

      {/* ── Section 1: Meeting Details ───────────────────────────────────────── */}
      <Section number="1" title="Meeting Details">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Meeting Date
            </Label>
            {editing ? (
              <Input
                type="date"
                value={draft.meeting_date ?? ''}
                onChange={(e) => update('meeting_date', e.target.value || null)}
              />
            ) : (
              <p className="text-sm">
                {draft.meeting_date
                  ? format(new Date(draft.meeting_date + 'T00:00:00'), 'MMMM d, yyyy')
                  : <span className="text-muted-foreground italic">—</span>}
              </p>
            )}
          </div>
          <TextField
            label="Attendees"
            value={draft.attendees}
            editing={editing}
            rows={2}
            onChange={(v) => update('attendees', v || null)}
          />
        </div>
      </Section>

      {/* ── Section 2: Purpose of Meeting (static) ───────────────────────────── */}
      <Section number="2" title="Purpose of Meeting">
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Review last month's deliverables and performance</li>
          <li>Confirm upcoming month priorities</li>
          <li>Surface any blockers or risks</li>
          <li>Align on communication and expectations</li>
          <li>Capture decisions and action items</li>
        </ul>
      </Section>

      {/* ── Section 3: Agreement Snapshot ───────────────────────────────────── */}
      <Section number="3" title="Agreement Snapshot">
        <div className="space-y-2">
          {draft.agreement_snapshot.map((item: AgreementSnapshotItem) => (
            <div key={item.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start">
              {editing ? (
                <>
                  <Input
                    placeholder="Label"
                    value={item.label}
                    onChange={(e) =>
                      updateArrayItem<AgreementSnapshotItem>('agreement_snapshot', item.id, {
                        label: e.target.value,
                      })
                    }
                  />
                  <Input
                    placeholder="Value"
                    value={item.value}
                    onChange={(e) =>
                      updateArrayItem<AgreementSnapshotItem>('agreement_snapshot', item.id, {
                        value: e.target.value,
                      })
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => removeArrayItem('agreement_snapshot', item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.value}</p>
                </>
              )}
            </div>
          ))}
          {editing && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 mt-1"
              onClick={() =>
                addArrayItem<AgreementSnapshotItem>('agreement_snapshot', {
                  id: newId(),
                  label: '',
                  value: '',
                })
              }
            >
              <Plus className="w-3 h-3" />
              Add item
            </Button>
          )}
          {!editing && draft.agreement_snapshot.length === 0 && (
            <p className="text-sm text-muted-foreground italic">No items recorded.</p>
          )}
        </div>
      </Section>

      {/* ── Section 4: Previous Month Review ────────────────────────────────── */}
      <Section number="4" title="Previous Month Review">
        <TextField
          label="Wins"
          value={draft.wins}
          editing={editing}
          onChange={(v) => update('wins', v || null)}
        />
        <TextField
          label="Deliverables Completed"
          value={draft.deliverables_completed}
          editing={editing}
          onChange={(v) => update('deliverables_completed', v || null)}
        />
        <TextField
          label="Slipped / Not Done"
          value={draft.slipped}
          editing={editing}
          onChange={(v) => update('slipped', v || null)}
        />
        <TextField
          label="Insights"
          value={draft.insights}
          editing={editing}
          onChange={(v) => update('insights', v || null)}
        />
      </Section>

      {/* ── Section 5: Upcoming Month Priorities ────────────────────────────── */}
      <Section number="5" title="Upcoming Month Priorities">
        <div className="space-y-3">
          {draft.upcoming_priorities.map((item: PriorityItem) => (
            <Card key={item.id} className="border-border/60">
              <CardContent className="p-3 space-y-2">
                {editing ? (
                  <>
                    <div className="flex gap-2 items-start">
                      <Textarea
                        placeholder="Priority / outcome…"
                        value={item.text}
                        rows={2}
                        className="resize-none flex-1"
                        onChange={(e) =>
                          updateArrayItem<PriorityItem>('upcoming_priorities', item.id, {
                            text: e.target.value,
                          })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => removeArrayItem('upcoming_priorities', item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        placeholder="Phase"
                        value={item.phase}
                        onChange={(e) =>
                          updateArrayItem<PriorityItem>('upcoming_priorities', item.id, {
                            phase: e.target.value,
                          })
                        }
                      />
                      <Input
                        placeholder="Category"
                        value={item.category}
                        onChange={(e) =>
                          updateArrayItem<PriorityItem>('upcoming_priorities', item.id, {
                            category: e.target.value,
                          })
                        }
                      />
                      <Input
                        placeholder="Status"
                        value={item.status}
                        onChange={(e) =>
                          updateArrayItem<PriorityItem>('upcoming_priorities', item.id, {
                            status: e.target.value,
                          })
                        }
                      />
                    </div>
                    <Input
                      placeholder="Expected uplift / impact"
                      value={item.uplift}
                      onChange={(e) =>
                        updateArrayItem<PriorityItem>('upcoming_priorities', item.id, {
                          uplift: e.target.value,
                        })
                      }
                    />
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium">{item.text}</p>
                    <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
                      {item.phase && <span>Phase: {item.phase}</span>}
                      {item.category && <span>· {item.category}</span>}
                      {item.status && <span>· {item.status}</span>}
                      {item.uplift && <span>· {item.uplift}</span>}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
          {editing && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() =>
                addArrayItem<PriorityItem>('upcoming_priorities', {
                  id: newId(),
                  text: '',
                  phase: '',
                  category: '',
                  uplift: '',
                  status: '',
                })
              }
            >
              <Plus className="w-3 h-3" />
              Add priority
            </Button>
          )}
          {!editing && draft.upcoming_priorities.length === 0 && (
            <p className="text-sm text-muted-foreground italic">No priorities recorded.</p>
          )}
        </div>
        <TextField
          label="Key Deadlines"
          value={draft.key_deadlines}
          editing={editing}
          rows={2}
          onChange={(v) => update('key_deadlines', v || null)}
        />
        <TextField
          label="Risks & Constraints"
          value={draft.risks_constraints}
          editing={editing}
          rows={2}
          onChange={(v) => update('risks_constraints', v || null)}
        />
      </Section>

      {/* ── Section 6: Process Improvements ─────────────────────────────────── */}
      <Section number="6" title="Process Improvements">
        <div className="space-y-3">
          {draft.process_improvements.map((item: ProcessItem) => (
            <div key={item.id} className="flex gap-2 items-start">
              {editing ? (
                <>
                  <Textarea
                    placeholder="Describe the improvement…"
                    value={item.text}
                    rows={2}
                    className="resize-none flex-1"
                    onChange={(e) =>
                      updateArrayItem<ProcessItem>('process_improvements', item.id, {
                        text: e.target.value,
                      })
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => removeArrayItem('process_improvements', item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <p className="text-sm">{item.text}</p>
              )}
            </div>
          ))}
          {editing && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() =>
                addArrayItem<ProcessItem>('process_improvements', {
                  id: newId(),
                  text: '',
                })
              }
            >
              <Plus className="w-3 h-3" />
              Add improvement
            </Button>
          )}
          {!editing && draft.process_improvements.length === 0 && (
            <p className="text-sm text-muted-foreground italic">No improvements recorded.</p>
          )}
        </div>
      </Section>

      {/* ── Section 7: Ad Hoc Requests ───────────────────────────────────────── */}
      <Section number="7" title="Ad Hoc Requests">
        <div className="space-y-3">
          {draft.adhoc_requests.map((item: AdhocItem) => (
            <Card key={item.id} className="border-border/60">
              <CardContent className="p-3 space-y-2">
                {editing ? (
                  <>
                    <div className="flex gap-2 items-start">
                      <Input
                        placeholder="Request title"
                        value={item.title}
                        className="flex-1"
                        onChange={(e) =>
                          updateArrayItem<AdhocItem>('adhoc_requests', item.id, {
                            title: e.target.value,
                          })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => removeArrayItem('adhoc_requests', item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Category"
                        value={item.category}
                        onChange={(e) =>
                          updateArrayItem<AdhocItem>('adhoc_requests', item.id, {
                            category: e.target.value,
                          })
                        }
                      />
                      <Input
                        placeholder="Status"
                        value={item.status}
                        onChange={(e) =>
                          updateArrayItem<AdhocItem>('adhoc_requests', item.id, {
                            status: e.target.value,
                          })
                        }
                      />
                    </div>
                    <Textarea
                      placeholder="Note / context"
                      value={item.note}
                      rows={2}
                      className="resize-none"
                      onChange={(e) =>
                        updateArrayItem<AdhocItem>('adhoc_requests', item.id, {
                          note: e.target.value,
                        })
                      }
                    />
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium">{item.title}</p>
                    <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
                      {item.category && <span>{item.category}</span>}
                      {item.status && <span>· {item.status}</span>}
                    </div>
                    {item.note && <p className="text-sm text-muted-foreground">{item.note}</p>}
                  </>
                )}
              </CardContent>
            </Card>
          ))}
          {editing && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() =>
                addArrayItem<AdhocItem>('adhoc_requests', {
                  id: newId(),
                  title: '',
                  category: '',
                  status: '',
                  note: '',
                })
              }
            >
              <Plus className="w-3 h-3" />
              Add request
            </Button>
          )}
          {!editing && draft.adhoc_requests.length === 0 && (
            <p className="text-sm text-muted-foreground italic">No ad hoc requests recorded.</p>
          )}
        </div>
      </Section>

      {/* ── Section 8: Communication Tools & Cadence ─────────────────────────── */}
      <Section number="8" title="Communication Tools & Cadence">
        <TextField
          label="Primary Communication Channel"
          value={draft.primary_comms}
          editing={editing}
          rows={2}
          onChange={(v) => update('primary_comms', v || null)}
        />
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Recurring Meetings
          </Label>
          {draft.recurring_meetings.map((item: MeetingItem) => (
            <Card key={item.id} className="border-border/60">
              <CardContent className="p-3">
                {editing ? (
                  <div className="space-y-2">
                    <div className="flex gap-2 items-center">
                      <Input
                        placeholder="Meeting name"
                        value={item.name}
                        className="flex-1"
                        onChange={(e) =>
                          updateArrayItem<MeetingItem>('recurring_meetings', item.id, {
                            name: e.target.value,
                          })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => removeArrayItem('recurring_meetings', item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        placeholder="Frequency"
                        value={item.frequency}
                        onChange={(e) =>
                          updateArrayItem<MeetingItem>('recurring_meetings', item.id, {
                            frequency: e.target.value,
                          })
                        }
                      />
                      <Input
                        placeholder="Owner"
                        value={item.owner}
                        onChange={(e) =>
                          updateArrayItem<MeetingItem>('recurring_meetings', item.id, {
                            owner: e.target.value,
                          })
                        }
                      />
                      <Input
                        placeholder="Status"
                        value={item.status}
                        onChange={(e) =>
                          updateArrayItem<MeetingItem>('recurring_meetings', item.id, {
                            status: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <div className="flex gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                      {item.frequency && <span>{item.frequency}</span>}
                      {item.owner && <span>· {item.owner}</span>}
                      {item.status && <span>· {item.status}</span>}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {editing && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() =>
                addArrayItem<MeetingItem>('recurring_meetings', {
                  id: newId(),
                  name: '',
                  frequency: '',
                  owner: '',
                  status: '',
                })
              }
            >
              <Plus className="w-3 h-3" />
              Add meeting
            </Button>
          )}
          {!editing && draft.recurring_meetings.length === 0 && (
            <p className="text-sm text-muted-foreground italic">No recurring meetings recorded.</p>
          )}
        </div>
        <TextField
          label="Response Time Expectations"
          value={draft.response_times}
          editing={editing}
          rows={2}
          onChange={(v) => update('response_times', v || null)}
        />
      </Section>

      {/* ── Section 9: Client Feedback & Confidence Check ────────────────────── */}
      <Section number="9" title="Client Feedback & Confidence Check">
        <TextField
          label="What's Working Well"
          value={draft.working_well}
          editing={editing}
          onChange={(v) => update('working_well', v || null)}
        />
        <TextField
          label="What's Unclear or Messy"
          value={draft.unclear_messy}
          editing={editing}
          onChange={(v) => update('unclear_messy', v || null)}
        />
        <TextField
          label="Where Would You Like More Visibility"
          value={draft.more_visibility}
          editing={editing}
          onChange={(v) => update('more_visibility', v || null)}
        />
        <div className="grid sm:grid-cols-2 gap-6 pt-2">
          <ScoreField
            label="Priorities Score"
            value={draft.priorities_score}
            editing={editing}
            onChange={(v) => update('priorities_score', v)}
          />
          <ScoreField
            label="Delivery Score"
            value={draft.delivery_score}
            editing={editing}
            onChange={(v) => update('delivery_score', v)}
          />
          <ScoreField
            label="Communication Score"
            value={draft.communication_score}
            editing={editing}
            onChange={(v) => update('communication_score', v)}
          />
          <ScoreField
            label="Capacity Score"
            value={draft.capacity_score}
            editing={editing}
            onChange={(v) => update('capacity_score', v)}
          />
        </div>
      </Section>

      {/* ── Section 10: Decisions, Actions & Owners ──────────────────────────── */}
      <Section number="10" title="Decisions, Actions & Owners">
        <div className="space-y-3">
          {draft.decisions_actions.map((item: DecisionItem) => (
            <Card key={item.id} className="border-border/60">
              <CardContent className="p-3 space-y-2">
                {editing ? (
                  <>
                    <div className="flex gap-2 items-start">
                      <Textarea
                        placeholder="Decision or action item…"
                        value={item.text}
                        rows={2}
                        className="resize-none flex-1"
                        onChange={(e) =>
                          updateArrayItem<DecisionItem>('decisions_actions', item.id, {
                            text: e.target.value,
                          })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => removeArrayItem('decisions_actions', item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Owner"
                        value={item.owner}
                        onChange={(e) =>
                          updateArrayItem<DecisionItem>('decisions_actions', item.id, {
                            owner: e.target.value,
                          })
                        }
                      />
                      <Input
                        type="date"
                        placeholder="Due date"
                        value={item.due}
                        onChange={(e) =>
                          updateArrayItem<DecisionItem>('decisions_actions', item.id, {
                            due: e.target.value,
                          })
                        }
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium">{item.text}</p>
                    <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
                      {item.owner && <span>Owner: {item.owner}</span>}
                      {item.due && (
                        <span>
                          · Due:{' '}
                          {(() => {
                            try {
                              return format(new Date(item.due + 'T00:00:00'), 'MMM d, yyyy');
                            } catch {
                              return item.due;
                            }
                          })()}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
          {editing && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() =>
                addArrayItem<DecisionItem>('decisions_actions', {
                  id: newId(),
                  text: '',
                  owner: '',
                  due: '',
                })
              }
            >
              <Plus className="w-3 h-3" />
              Add item
            </Button>
          )}
          {!editing && draft.decisions_actions.length === 0 && (
            <p className="text-sm text-muted-foreground italic">No decisions or actions recorded.</p>
          )}
        </div>
        <TextField
          label="Blockers"
          value={draft.blockers}
          editing={editing}
          rows={2}
          onChange={(v) => update('blockers', v || null)}
        />
      </Section>

      {/* ── Section 11: Efficiency / Impact Notes ────────────────────────────── */}
      <Section number="11" title="Efficiency / Impact Notes">
        <TextField
          label="Time Saved"
          value={draft.time_saved}
          editing={editing}
          rows={2}
          onChange={(v) => update('time_saved', v || null)}
        />
        <TextField
          label="Friction Removed"
          value={draft.friction_removed}
          editing={editing}
          rows={2}
          onChange={(v) => update('friction_removed', v || null)}
        />
        <TextField
          label="Systems Implemented"
          value={draft.systems_implemented}
          editing={editing}
          rows={2}
          onChange={(v) => update('systems_implemented', v || null)}
        />
      </Section>

      {/* ── Sticky save bar ──────────────────────────────────────────────────── */}
      {editing && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm px-4 py-3 flex items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            {dirty ? (
              'Unsaved changes'
            ) : savedAt ? (
              <span className="flex items-center gap-1.5 text-status-success">
                <CheckCircle2 className="w-4 h-4" />
                Saved {format(savedAt, 'h:mm a')}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={cancelEdit}>
              <X className="w-4 h-4" />
              Cancel
            </Button>
            <Button
              size="sm"
              className="gap-2"
              disabled={!dirty || saveSnapshot.isPending}
              onClick={handleSave}
            >
              {saveSnapshot.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
