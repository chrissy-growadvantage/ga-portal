import { useState, useRef, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateDelivery, useDeleteDelivery } from '@/hooks/useDeliveries';
import { queryKeys } from '@/lib/query-keys';
import type { DeliveryItem } from '@/types/database';
import { Input } from '@/components/ui/input';
import { Plus, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

interface QuickAddDeliveryProps {
  clientId: string;
  lastCategory?: string;
  onExpandToDialog: (title: string) => void;
}

export function QuickAddDelivery({
  clientId,
  lastCategory,
  onExpandToDialog,
}: QuickAddDeliveryProps) {
  const [title, setTitle] = useState('');
  const [isOutOfScope, setIsOutOfScope] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const createDelivery = useCreateDelivery();
  const deleteDelivery = useDeleteDelivery();

  // Global "n" shortcut to focus quick-add (when not in another input)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.key === 'n' &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        !document.activeElement?.getAttribute('contenteditable')
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Parse optional "+Xh" or "+X.Xh" suffix from title for hours
  const parseHoursFromTitle = (raw: string): { cleanTitle: string; hours: number | null } => {
    const match = raw.match(/^(.*?)\s*\+(\d+(?:\.\d+)?)h\s*$/i);
    if (match) {
      return { cleanTitle: match[1].trim(), hours: parseFloat(match[2]) };
    }
    return { cleanTitle: raw, hours: null };
  };

  const handleSubmit = useCallback(async () => {
    const trimmed = title.trim();
    if (!trimmed || createDelivery.isPending) return;

    const { cleanTitle, hours } = parseHoursFromTitle(trimmed);

    // Snapshot previous cache value for rollback
    const previousData = queryClient.getQueryData<DeliveryItem[]>(
      queryKeys.clients.deliveries(clientId),
    );

    // Build optimistic item so the list updates instantly
    const now = new Date().toISOString();
    const optimisticItem: DeliveryItem = {
      id: crypto.randomUUID(),
      client_id: clientId,
      scope_allocation_id: null,
      title: cleanTitle,
      description: null,
      category: lastCategory || 'General',
      status: 'completed',
      scope_cost: 0,
      hours_spent: hours,
      is_out_of_scope: isOutOfScope,
      phase: null,
      uplift: null,
      completed_at: now,
      created_at: now,
      updated_at: now,
    };

    // Prepend optimistic item to cache
    queryClient.setQueryData<DeliveryItem[]>(
      queryKeys.clients.deliveries(clientId),
      (old) => [optimisticItem, ...(old ?? [])],
    );

    // Clear input immediately — operator can type the next one right away
    setTitle('');
    setIsOutOfScope(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 1500);

    try {
      const created = await createDelivery.mutateAsync({
        client_id: clientId,
        title: cleanTitle,
        category: lastCategory || 'General',
        status: 'completed',
        is_out_of_scope: isOutOfScope,
        ...(hours !== null ? { hours_spent: hours } : {}),
      });
      toast('Delivery logged', {
        action: {
          label: 'Undo',
          onClick: () => deleteDelivery.mutate({ id: created.id, clientId }),
        },
        duration: 4000,
      });
    } catch {
      // Roll back optimistic update and restore what the user typed
      queryClient.setQueryData(queryKeys.clients.deliveries(clientId), previousData);
      setTitle(trimmed);
      toast.error('Failed to log delivery');
    }
  }, [title, clientId, lastCategory, isOutOfScope, createDelivery, deleteDelivery, queryClient]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Tab' && title.trim()) {
      e.preventDefault();
      onExpandToDialog(title.trim());
      setTitle('');
    } else if (e.key === 'Escape') {
      setTitle('');
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative">
      <div
        className={cn(
          'relative flex items-center rounded-lg border bg-background transition-all duration-200',
          isFocused
            ? 'border-primary/50 ring-2 ring-primary/20'
            : 'border-border hover:border-primary/30',
          showSuccess && 'border-status-success/50 ring-2 ring-status-success/20'
        )}
      >
        <div className="pl-3 flex-shrink-0">
          {showSuccess ? (
            <Check className="w-4 h-4 text-status-success animate-in zoom-in-50 duration-200" />
          ) : (
            <Plus className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
        <Input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder="What did you deliver?"
          className="border-0 shadow-none focus-visible:ring-0 pl-2"
        />
        {(isFocused || isOutOfScope) && (
          <label
            className={cn(
              'flex items-center gap-1.5 pr-3 cursor-pointer shrink-0 select-none',
              isOutOfScope ? 'text-amber-600' : 'text-muted-foreground'
            )}
            onMouseDown={(e) => e.preventDefault()}
          >
            <Checkbox
              checked={isOutOfScope}
              onCheckedChange={(v) => setIsOutOfScope(v === true)}
              className="h-3.5 w-3.5"
            />
            <AlertTriangle className="w-3 h-3" />
            <span className="text-xs font-medium whitespace-nowrap">OOS</span>
          </label>
        )}
      </div>
      {isFocused && (
        <p className="text-xs text-muted-foreground mt-1.5 ml-1 animate-in fade-in-0 slide-in-from-top-1 duration-200">
          Enter to log · Tab for details · add <span className="font-mono">+2h</span> for hours · OOS = out of scope
        </p>
      )}
    </div>
  );
}
