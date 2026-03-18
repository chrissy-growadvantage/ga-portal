import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type { DeliveryItem } from '@/types/database';
import { Check, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ApprovalCardProps {
  item: DeliveryItem;
  token: string;
  onAction: () => void;
  isLast?: boolean;
}

async function submitAction(token: string, deliveryItemId: string, action: 'approved' | 'revision_requested', note?: string) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const response = await fetch(`${supabaseUrl}/functions/v1/client-action`, {
    method: 'POST',
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token,
      delivery_item_id: deliveryItemId,
      action,
      note,
    }),
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result?.error?.message ?? 'Request failed');
  }

  return response.json();
}

type ResolvedAction = 'approved' | 'revision_requested' | null;

export function ApprovalCard({ item, token, onAction, isLast }: ApprovalCardProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resolvedAction, setResolvedAction] = useState<ResolvedAction>(null);

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      await submitAction(token, item.id, 'approved');
      setResolvedAction('approved');
      toast.success('Approved!');
      onAction();
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!feedback.trim()) return;
    setSubmitting(true);
    try {
      await submitAction(token, item.id, 'revision_requested', feedback.trim());
      setResolvedAction('revision_requested');
      toast.success('Feedback submitted');
      onAction();
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (resolvedAction === 'approved') {
    return (
      <div className={cn('flex items-center gap-2.5 px-5 py-4 bg-status-success/5', !isLast && 'border-b border-border')}>
        <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium text-status-success">Approved</p>
          <p className="text-xs text-muted-foreground mt-0.5">{item.title}</p>
        </div>
      </div>
    );
  }

  if (resolvedAction === 'revision_requested') {
    return (
      <div className={cn('flex items-center gap-2.5 px-5 py-4 bg-status-warning/5', !isLast && 'border-b border-border')}>
        <AlertTriangle className="w-4 h-4 text-status-warning shrink-0" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium text-status-warning">Feedback submitted</p>
          <p className="text-xs text-muted-foreground mt-0.5">{item.title}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('px-5 py-5', !isLast && 'border-b border-border')}>
      {/* Content */}
      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-foreground leading-snug">{item.title}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <Badge variant="outline" className="text-xs px-1.5 py-0 font-normal">
            {item.category}
          </Badge>
          {item.completed_at && (
            <span className="text-xs text-muted-foreground">
              sent {format(new Date(item.completed_at), 'MMM d')}
            </span>
          )}
        </div>
        {item.description && (
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-2">
            {item.description}
          </p>
        )}
      </div>

      {/* Actions — always below content */}
      {!showFeedback ? (
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
          <Button
            variant="outline"
            onClick={() => setShowFeedback(true)}
            disabled={submitting}
            className="flex-1 h-11 text-sm text-muted-foreground hover:text-foreground"
          >
            Request Changes
          </Button>
          <Button
            onClick={handleApprove}
            disabled={submitting}
            className="flex-1 h-11 text-sm gap-2 bg-status-success hover:bg-status-success/90 text-white font-semibold shadow-sm"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Approve
          </Button>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="What would you like changed?"
            className="min-h-[72px] resize-none text-sm"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleRequestChanges} disabled={submitting || !feedback.trim()} className="gap-1.5 min-h-[44px]">
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Submit Feedback'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowFeedback(false); setFeedback(''); }} disabled={submitting} className="min-h-[44px]">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
