import { useState } from 'react';
import { format } from 'date-fns';
import { Trash2, Loader2, StickyNote } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useClientNotes, useCreateClientNote, useDeleteClientNote } from '@/hooks/useClientNotes';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
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
import type { ClientNoteType } from '@/types/database';

// ── Type config ────────────────────────────────────────────────────────────────

const NOTE_TYPE_CONFIG: Record<
  ClientNoteType,
  { label: string; color: string }
> = {
  note: { label: 'Note', color: 'bg-status-neutral/10 text-status-neutral' },
  request: { label: 'Request', color: 'bg-status-info/10 text-status-info' },
  todo: { label: 'To-Do', color: 'bg-status-warning/10 text-status-warning' },
  idea: { label: 'Idea', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
};

const NOTE_TYPES: ClientNoteType[] = ['note', 'request', 'todo', 'idea'];

// ── Props ──────────────────────────────────────────────────────────────────────

interface ClientNotesProps {
  clientId: string;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function ClientNotes({ clientId }: ClientNotesProps) {
  const [body, setBody] = useState('');
  const [type, setType] = useState<ClientNoteType>('note');
  const [submitting, setSubmitting] = useState(false);

  const { data: notes, isLoading } = useClientNotes(clientId);
  const createNote = useCreateClientNote();
  const deleteNote = useDeleteClientNote();

  const handleSubmit = async () => {
    const trimmed = body.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      const session = await supabase.auth.getSession();
      const operatorId = session.data.session?.user.id;
      if (!operatorId) throw new Error('Not authenticated');

      await createNote.mutateAsync({
        client_id: clientId,
        operator_id: operatorId,
        body: trimmed,
        type,
      });

      setBody('');
      setType('note');
      toast.success('Note added');
    } catch {
      toast.error('Failed to add note');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNote.mutateAsync({ id, clientId });
      toast.success('Note deleted');
    } catch {
      toast.error('Failed to delete note');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      void handleSubmit();
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick-add form */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <Textarea
            placeholder="Capture a note, request, to-do, or idea… (⌘↵ to submit)"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            className="resize-none"
          />
          <div className="flex items-center gap-2 justify-between">
            <Select value={type} onValueChange={(v) => setType(v as ClientNoteType)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NOTE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {NOTE_TYPE_CONFIG[t].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              disabled={!body.trim() || submitting}
              onClick={handleSubmit}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notes list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : !notes?.length ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={StickyNote}
              title="No notes yet"
              description="Capture requests, ideas, and to-dos for this client."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => {
            const cfg = NOTE_TYPE_CONFIG[note.type];
            return (
              <Card key={note.id}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                      {note.body}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={`text-xs px-1.5 py-0 ${cfg.color}`}>
                        {cfg.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(note.created_at), 'MMM d, yyyy · h:mm a')}
                      </span>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive shrink-0 h-7 w-7"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete note?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove this note. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => void handleDelete(note.id)}
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
    </div>
  );
}
