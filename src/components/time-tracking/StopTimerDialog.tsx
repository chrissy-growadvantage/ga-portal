import { useState } from 'react';
import { useTimer } from '@/contexts/TimerContext';
import { useDeliveries } from '@/hooks/useDeliveries';
import { useCreateDelivery } from '@/hooks/useDeliveries';
import { useUpdateTimeEntry } from '@/hooks/useTimeEntries';
import { formatDuration, formatDurationShort } from '@/lib/time-utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, Square, Trash2, Timer } from 'lucide-react';
import { toast } from 'sonner';

type StopAction = 'save' | 'create-delivery';

export function StopTimerDialog() {
  const { isStopDialogOpen, setStopDialogOpen, timer, stopTimer, discardTimer } = useTimer();
  const { data: deliveries } = useDeliveries(timer.clientId || undefined);
  const createDelivery = useCreateDelivery();
  const updateTimeEntry = useUpdateTimeEntry();
  const [linkDeliveryId, setLinkDeliveryId] = useState<string>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const linkableDeliveries = deliveries?.filter(
    (d) => d.status === 'in_progress' || d.status === 'completed'
  ) ?? [];

  const handleStop = async (action: StopAction) => {
    setIsSubmitting(true);
    try {
      const result = await stopTimer();
      if (!result) {
        setIsSubmitting(false);
        return;
      }

      // Link to existing delivery if selected
      if (linkDeliveryId && linkDeliveryId !== 'none' && linkDeliveryId !== 'new') {
        await updateTimeEntry.mutateAsync({
          id: result.timeEntryId,
          delivery_item_id: linkDeliveryId,
        });
      }

      // Create new delivery from timer session
      if (action === 'create-delivery' || linkDeliveryId === 'new') {
        const hoursSpent = result.elapsedSeconds / 3600;
        await createDelivery.mutateAsync({
          client_id: result.clientId,
          title: result.description,
          category: 'General',
          status: 'completed',
          hours_spent: Math.round(hoursSpent * 100) / 100,
        });
        // Link the time entry to the new delivery (the delivery was just created)
        toast.success('Delivery created from timer session');
      }

      setStopDialogOpen(false);
      setLinkDeliveryId('none');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to stop timer';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscard = async () => {
    setIsSubmitting(true);
    try {
      await discardTimer();
      setStopDialogOpen(false);
      setLinkDeliveryId('none');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isStopDialogOpen} onOpenChange={setStopDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Stop Timer</DialogTitle>
          <DialogDescription>
            Save your tracked time or link it to a delivery.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Timer summary */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
            <Timer className="w-8 h-8 text-primary shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-2xl font-mono font-semibold tabular-nums">
                {formatDuration(timer.elapsedSeconds)}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {timer.clientName} — {timer.description}
              </p>
            </div>
          </div>

          {/* Link to delivery */}
          <div className="space-y-2">
            <Label>Link to delivery</Label>
            <Select value={linkDeliveryId} onValueChange={setLinkDeliveryId}>
              <SelectTrigger>
                <SelectValue placeholder="No link — save as standalone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No link — save time only</SelectItem>
                <SelectItem value="new">Create new delivery from this session</SelectItem>
                {linkableDeliveries.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={handleDiscard}
              disabled={isSubmitting}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Discard
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStopDialogOpen(false)}
                disabled={isSubmitting}
              >
                Keep Running
              </Button>
              <Button
                onClick={() => handleStop(linkDeliveryId === 'new' ? 'create-delivery' : 'save')}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Square className="w-4 h-4 mr-2" />
                )}
                Stop & Save
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
