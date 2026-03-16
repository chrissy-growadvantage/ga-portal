import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format, parse } from 'date-fns';
import { ArrowLeft, Plus, CalendarDays, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useClient } from '@/hooks/useClients';
import { useMonthlySnapshots, useCreateSnapshot, useDeleteSnapshot } from '@/hooks/useMonthlySnapshots';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';

// ── Month helpers ──────────────────────────────────────────────────────────────

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const SHORT_MONTHS = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
];

function buildSlug(month: string, year: string): string {
  const idx = MONTHS.indexOf(month);
  return `${SHORT_MONTHS[idx]}-${year}`;
}

function buildLabel(month: string, year: string): string {
  return `${month} ${year}`;
}

function currentYear(): string {
  return String(new Date().getFullYear());
}

function yearRange(): string[] {
  const y = new Date().getFullYear();
  return [String(y - 1), String(y), String(y + 1)];
}

// ── Create dialog ─────────────────────────────────────────────────────────────

interface CreateDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (month: string, year: string) => void;
  isPending: boolean;
  existingSlugs: Set<string>;
}

function CreateSnapshotDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
  existingSlugs,
}: CreateDialogProps) {
  const [month, setMonth] = useState(MONTHS[new Date().getMonth()]);
  const [year, setYear] = useState(currentYear());

  const slug = buildSlug(month, year);
  const alreadyExists = existingSlugs.has(slug);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New Monthly Snapshot</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Month</Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Year</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearRange().map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {alreadyExists && (
            <p className="text-sm text-destructive">
              A snapshot for {buildLabel(month, year)} already exists.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={isPending || alreadyExists}
            onClick={() => onConfirm(month, year)}
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SnapshotList() {
  const { id: clientId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);

  const { data: client, isLoading: clientLoading } = useClient(clientId);
  const { data: snapshots, isLoading: snapshotsLoading } = useMonthlySnapshots(clientId);
  const createSnapshot = useCreateSnapshot();
  const deleteSnapshot = useDeleteSnapshot();

  const existingSlugs = new Set(snapshots?.map((s) => s.month_slug) ?? []);

  const handleCreate = async (month: string, year: string) => {
    const session = await supabase.auth.getSession();
    const operatorId = session.data.session?.user.id;
    if (!operatorId || !clientId) return;

    try {
      const snapshot = await createSnapshot.mutateAsync({
        client_id: clientId,
        operator_id: operatorId,
        month_label: buildLabel(month, year),
        month_slug: buildSlug(month, year),
      });
      setCreateOpen(false);
      navigate(`/clients/${clientId}/snapshots/${snapshot.month_slug}`);
    } catch {
      toast.error('Failed to create snapshot');
    }
  };

  const handleDelete = async (id: string) => {
    if (!clientId) return;
    try {
      await deleteSnapshot.mutateAsync({ id, clientId });
      toast.success('Snapshot deleted');
    } catch {
      toast.error('Failed to delete snapshot');
    }
  };

  if (clientLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/clients/${clientId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Monthly Snapshots</h1>
            {client && (
              <p className="text-muted-foreground text-sm mt-0.5">
                {client.company_name || client.contact_name}
              </p>
            )}
          </div>
        </div>
        <Button
          className="gap-2"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="w-4 h-4" />
          New Snapshot
        </Button>
      </div>

      {/* List */}
      {snapshotsLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : !snapshots?.length ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={CalendarDays}
              title="No snapshots yet"
              description="Create your first monthly snapshot to start tracking progress and client reviews."
              action={{
                label: 'Create first snapshot',
                onClick: () => setCreateOpen(true),
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {snapshots.map((snapshot) => {
            // Parse month_slug like "jan-2026" into a Date for formatting
            let formattedDate = snapshot.month_label;
            try {
              const parsed = parse(snapshot.month_slug, 'MMM-yyyy', new Date());
              formattedDate = format(parsed, 'MMMM yyyy');
            } catch {
              // fallback to stored label
            }

            return (
              <Card
                key={snapshot.id}
                className="hover:bg-muted/40 transition-colors"
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <Link
                    to={`/clients/${clientId}/snapshots/${snapshot.month_slug}`}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <div className="w-9 h-9 rounded-lg bg-status-success/10 flex items-center justify-center shrink-0">
                      <CalendarDays className="w-4 h-4 text-status-success" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{formattedDate}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Created {format(new Date(snapshot.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </Link>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete snapshot?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the {formattedDate} snapshot. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(snapshot.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreateSnapshotDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onConfirm={handleCreate}
        isPending={createSnapshot.isPending}
        existingSlugs={existingSlugs}
      />
    </div>
  );
}
