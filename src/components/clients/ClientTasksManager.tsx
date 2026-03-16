import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Trash2, CheckCircle2, Circle, ExternalLink, ClipboardList, Loader2, Pencil, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useClientTasks, useCreateClientTask, useUpdateClientTask, useDeleteClientTask } from '@/hooks/useClientTasks';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import type { ClientTask } from '@/types/database';

// ── Props ──────────────────────────────────────────────────────────────────────

interface ClientTasksManagerProps {
  clientId: string;
}

// ── Add-task form ──────────────────────────────────────────────────────────────

interface AddTaskFormProps {
  clientId: string;
  onCancel: () => void;
}

function AddTaskForm({ clientId, onCancel }: AddTaskFormProps) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const createTask = useCreateClientTask();

  const handleSubmit = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      const session = await supabase.auth.getSession();
      const operatorId = session.data.session?.user.id;
      if (!operatorId) throw new Error('Not authenticated');

      await createTask.mutateAsync({
        client_id: clientId,
        operator_id: operatorId,
        title: trimmed,
        due_date: dueDate || undefined,
        link_url: linkUrl.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      toast.success('Task added');
      onCancel();
    } catch {
      toast.error('Failed to add task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="space-y-1">
          <Label htmlFor="add-task-title" className="sr-only">Task title</Label>
          <Input
            id="add-task-title"
            placeholder="Task title (required)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleSubmit();
              if (e.key === 'Escape') onCancel();
            }}
            autoFocus
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="add-task-due-date" className="sr-only">Due date</Label>
            <Input
              id="add-task-due-date"
              type="date"
              placeholder="Due date (optional)"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="add-task-link-url" className="sr-only">Link URL</Label>
            <Input
              id="add-task-link-url"
              placeholder="Link URL (optional)"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="add-task-notes" className="sr-only">Notes</Label>
          <Input
            id="add-task-notes"
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!title.trim() || submitting}
            onClick={() => void handleSubmit()}
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Add task
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Inline edit form ───────────────────────────────────────────────────────────

interface EditTaskFormProps {
  task: ClientTask;
  onDone: () => void;
}

function EditTaskForm({ task, onDone }: EditTaskFormProps) {
  const [title, setTitle] = useState(task.title);
  const [dueDate, setDueDate] = useState(task.due_date ?? '');
  const [linkUrl, setLinkUrl] = useState(task.link_url ?? '');
  const [notes, setNotes] = useState(task.notes ?? '');
  const updateTask = useUpdateClientTask();

  const handleSave = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;

    try {
      await updateTask.mutateAsync({
        id: task.id,
        clientId: task.client_id,
        title: trimmed,
        due_date: dueDate || null,
        link_url: linkUrl.trim() || null,
        notes: notes.trim() || null,
      });
      toast.success('Task updated');
      onDone();
    } catch {
      toast.error('Failed to update task');
    }
  };

  return (
    <div className="space-y-2">
      <div>
        <Label htmlFor="edit-task-title" className="sr-only">Task title</Label>
        <Input
          id="edit-task-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void handleSave();
            if (e.key === 'Escape') onDone();
          }}
          className="h-8 text-sm"
          autoFocus
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="edit-task-due-date" className="sr-only">Due date</Label>
          <Input
            id="edit-task-due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <div>
          <Label htmlFor="edit-task-link-url" className="sr-only">Link URL</Label>
          <Input
            id="edit-task-link-url"
            placeholder="Link URL"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="edit-task-notes" className="sr-only">Notes</Label>
        <Input
          id="edit-task-notes"
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="h-8 text-xs"
        />
      </div>
      <div className="flex gap-1.5 justify-end">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDone}>
          <X className="w-3.5 h-3.5" />
        </Button>
        <Button
          size="icon"
          className="h-7 w-7"
          disabled={!title.trim() || updateTask.isPending}
          onClick={() => void handleSave()}
        >
          {updateTask.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}

// ── Task row ───────────────────────────────────────────────────────────────────

interface TaskRowProps {
  task: ClientTask;
}

function TaskRow({ task }: TaskRowProps) {
  const [editing, setEditing] = useState(false);
  const updateTask = useUpdateClientTask();
  const deleteTask = useDeleteClientTask();

  const isCompleted = !!task.completed_at;

  const toggleComplete = () => {
    updateTask.mutate(
      {
        id: task.id,
        clientId: task.client_id,
        completed_at: isCompleted ? null : new Date().toISOString(),
      },
      { onError: () => toast.error('Failed to update task') },
    );
  };

  const handleDelete = async () => {
    try {
      await deleteTask.mutateAsync({ id: task.id, clientId: task.client_id });
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  return (
    <Card className={isCompleted ? 'opacity-60' : ''}>
      <CardContent className="p-3">
        {editing ? (
          <EditTaskForm task={task} onDone={() => setEditing(false)} />
        ) : (
          <div className="flex items-start gap-3">
            {/* Complete toggle */}
            <button
              className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors"
              onClick={toggleComplete}
              aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-4.5 h-4.5 text-status-success" />
              ) : (
                <Circle className="w-4.5 h-4.5" />
              )}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1">
              <p className={`text-sm font-medium leading-snug ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                {task.title}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {task.due_date && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                    Due {format(new Date(task.due_date), 'MMM d')}
                  </Badge>
                )}
                {task.link_url && (
                  <a
                    href={task.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-3 h-3" />
                    Link
                  </a>
                )}
                {task.notes && (
                  <span className="text-xs text-muted-foreground truncate max-w-48">
                    {task.notes}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-0.5 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setEditing(true)}
                aria-label="Edit task"
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    aria-label="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete task?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove "{task.title}". This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => void handleDelete()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

export function ClientTasksManager({ clientId }: ClientTasksManagerProps) {
  const [adding, setAdding] = useState(false);
  const { data: tasks, isLoading } = useClientTasks(clientId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const open = tasks?.filter((t) => !t.completed_at) ?? [];
  const done = tasks?.filter((t) => t.completed_at) ?? [];

  return (
    <div className="space-y-3">
      {/* Add button */}
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setAdding(true)} disabled={adding}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add task
        </Button>
      </div>

      {/* Inline form */}
      {adding && (
        <AddTaskForm clientId={clientId} onCancel={() => setAdding(false)} />
      )}

      {/* Open tasks */}
      {open.length > 0 && (
        <div className="space-y-2">
          {open.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!adding && !tasks?.length && (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={ClipboardList}
              title="No tasks yet"
              description="Add tasks for this client — due dates, links, and notes."
            />
          </CardContent>
        </Card>
      )}

      {/* Completed tasks */}
      {done.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
            Completed ({done.length})
          </p>
          {done.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
