import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ExternalLink, ClipboardCheck } from 'lucide-react';
import { format, parseISO, isBefore, startOfDay, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { PortalClientTask } from '@/types/portal';

type PortalClientTasksProps = {
  tasks: PortalClientTask[];
  token: string;
  onTaskComplete: () => void;
};

async function completeTask(token: string, taskId: string) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const response = await fetch(`${supabaseUrl}/functions/v1/portal-task-complete`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, task_id: taskId }),
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result?.error?.message ?? 'Request failed');
  }

  return response.json();
}

function isOverdue(task: PortalClientTask) {
  if (!task.due_date || task.completed_at) return false;
  return isBefore(parseISO(task.due_date), startOfDay(new Date()));
}

function isDueSoon(task: PortalClientTask) {
  if (!task.due_date || task.completed_at || isOverdue(task)) return false;
  const daysUntilDue = differenceInDays(parseISO(task.due_date), startOfDay(new Date()));
  return daysUntilDue <= 3;
}

type TaskRowProps = {
  task: PortalClientTask;
  token: string;
  onTaskComplete: () => void;
};

function TaskRow({ task, token, onTaskComplete }: TaskRowProps) {
  const [completed, setCompleted] = useState(!!task.completed_at);
  const [submitting, setSubmitting] = useState(false);
  const overdue = isOverdue(task);
  const dueSoon = isDueSoon(task);

  const handleCheck = async () => {
    if (completed || submitting) return;

    // Optimistic update
    setCompleted(true);
    setSubmitting(true);

    try {
      await completeTask(token, task.id);
      toast.success('Task marked complete!');
      onTaskComplete();
    } catch {
      setCompleted(false);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 py-3 px-4 rounded-lg border',
        submitting && 'opacity-70',
        completed
          ? 'border-border/40 bg-muted/20'
          : overdue
            ? 'border-status-danger/30 bg-status-danger/5'
            : 'border-border/60 bg-background',
      )}
    >
      {/* Checkbox — min 44x44 touch target */}
      <button
        className="flex items-center justify-center w-11 h-11 -m-2 rounded-md shrink-0 hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
        onClick={handleCheck}
        disabled={completed || submitting}
        aria-label={completed ? `${task.title} (completed)` : `Mark "${task.title}" as complete`}
      >
        <Checkbox
          checked={completed}
          disabled={completed || submitting}
          className="w-5 h-5 pointer-events-none"
          aria-hidden="true"
        />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'text-sm font-medium',
              completed && 'line-through text-muted-foreground',
            )}
          >
            {task.title}
          </p>
          {overdue && !completed && (
            <Badge
              variant="secondary"
              className="shrink-0 text-xs bg-status-danger/10 text-status-danger"
            >
              Overdue
            </Badge>
          )}
          {dueSoon && !completed && (
            <Badge
              variant="secondary"
              className="shrink-0 text-xs bg-status-warning/10 text-status-warning"
            >
              Due soon
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1">
          {task.due_date && (
            <span
              className={cn(
                'text-xs',
                overdue && !completed ? 'text-destructive' : 'text-muted-foreground',
              )}
            >
              Due {format(parseISO(task.due_date), 'MMM d, yyyy')}
            </span>
          )}
          {task.link_url && !completed && (
            <a
              href={task.link_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="ghost"
                size="sm"
                className="px-2 gap-1 text-xs min-h-[44px]"
                aria-label={`Open document for ${task.title} (opens in new tab)`}
              >
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
                Open
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function PortalClientTasks({ tasks, token, onTaskComplete }: PortalClientTasksProps) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="No tasks assigned"
        description="Your service provider hasn't assigned any tasks yet."
        variant="inline"
      />
    );
  }

  // Split into pending and completed
  const pending = [...tasks]
    .filter((t) => !t.completed_at)
    .sort((a, b) => {
      const aOverdue = isOverdue(a);
      const bOverdue = isOverdue(b);
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
      const aDueSoon = isDueSoon(a);
      const bDueSoon = isDueSoon(b);
      if (aDueSoon !== bDueSoon) return aDueSoon ? -1 : 1;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

  const completed = tasks.filter((t) => !!t.completed_at);

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <div className="space-y-2">
          {pending.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              token={token}
              onTaskComplete={onTaskComplete}
            />
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-2">
            Completed ({completed.length})
          </p>
          {completed.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              token={token}
              onTaskComplete={onTaskComplete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
