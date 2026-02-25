import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type { DeliveryItem } from '@/types/database';
import { Check, Pencil, Loader2, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ApprovalCardProps {
  item: DeliveryItem;
  token: string;
  onAction: () => void;
}

async function submitAction(token: string, deliveryItemId: string, action: 'approved' | 'revision_requested', note?: string) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const response = await fetch(`${supabaseUrl}/functions/v1/client-action`, {
    method: 'POST',
    headers: {
      'apikey': anonKey,
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

export function ApprovalCard({ item, token, onAction }: ApprovalCardProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resolved, setResolved] = useState(false);

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      await submitAction(token, item.id, 'approved');
      setResolved(true);
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
      setResolved(true);
      toast.success('Feedback submitted');
      onAction();
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (resolved) {
    return (
      <Card className="border-border/60 bg-muted/30">
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>Response submitted for <span className="font-medium text-foreground">{item.title}</span></span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60">
      <CardContent className="pt-5 pb-5">
        <div className="mb-1">
          <p className="text-sm font-medium">{item.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="outline" className="text-xs px-1.5 py-0">
              {item.category}
            </Badge>
            {item.completed_at && (
              <span className="text-xs text-muted-foreground">
                Completed {format(new Date(item.completed_at), 'MMM d')}
              </span>
            )}
          </div>
        </div>

        {item.description && (
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {item.description}
          </p>
        )}

        {!showFeedback ? (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4">
            <Button
              onClick={handleApprove}
              disabled={submitting}
              className="min-h-[44px] min-w-[44px] gap-2"
              aria-label={`Approve: ${item.title}`}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Approve
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFeedback(true)}
              disabled={submitting}
              className="min-h-[44px] min-w-[44px] gap-2"
              aria-label={`Request changes to: ${item.title}`}
            >
              <Pencil className="w-4 h-4" />
              Request Changes
            </Button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                What would you like changed?
              </label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Describe the changes you'd like..."
                className="min-h-[80px] resize-none"
                autoFocus
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRequestChanges}
                disabled={submitting || !feedback.trim()}
                className="min-h-[44px] gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Submit Feedback'
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowFeedback(false);
                  setFeedback('');
                }}
                disabled={submitting}
                className="min-h-[44px]"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
