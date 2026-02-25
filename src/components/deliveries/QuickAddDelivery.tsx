import { useState, useRef, useCallback, useEffect } from 'react';
import { useCreateDelivery } from '@/hooks/useDeliveries';
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
  const createDelivery = useCreateDelivery();

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

  const handleSubmit = useCallback(async () => {
    const trimmed = title.trim();
    if (!trimmed || createDelivery.isPending) return;

    try {
      await createDelivery.mutateAsync({
        client_id: clientId,
        title: trimmed,
        category: lastCategory || 'General',
        status: 'completed',
        is_out_of_scope: isOutOfScope,
      });
      setTitle('');
      setIsOutOfScope(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1500);
    } catch {
      toast.error('Failed to log delivery');
    }
  }, [title, clientId, lastCategory, isOutOfScope, createDelivery]);

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
          showSuccess && 'border-emerald-500/50 ring-2 ring-emerald-500/20'
        )}
      >
        <div className="pl-3 flex-shrink-0">
          {showSuccess ? (
            <Check className="w-4 h-4 text-emerald-600 animate-in zoom-in-50 duration-200" />
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
          disabled={createDelivery.isPending}
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
          Press Enter to log · Tab for details · Escape to clear · OOS = out of scope
        </p>
      )}
    </div>
  );
}
