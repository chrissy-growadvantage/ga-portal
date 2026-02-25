import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { useClients } from '@/hooks/useClients';
import { useDeliveries } from '@/hooks/useDeliveries';
import { useCreateTimeEntry } from '@/hooks/useTimeEntries';
import { manualTimeEntrySchema, type ManualTimeEntryInput } from '@/lib/schemas';
import { calcDurationSeconds } from '@/lib/time-utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManualTimeEntryDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const { data: clients } = useClients();
  const createTimeEntry = useCreateTimeEntry();

  const form = useForm<ManualTimeEntryInput>({
    resolver: zodResolver(manualTimeEntrySchema),
    defaultValues: {
      client_id: '',
      description: '',
      delivery_item_id: undefined,
      started_at: '',
      ended_at: '',
    },
  });

  const selectedClientId = form.watch('client_id');
  const { data: deliveries } = useDeliveries(selectedClientId || undefined);

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const activeClients = clients?.filter((c) => c.status === 'active') ?? [];
  const linkableDeliveries = deliveries?.filter(
    (d) => d.status === 'in_progress' || d.status === 'completed'
  ) ?? [];

  const onSubmit = async (values: ManualTimeEntryInput) => {
    if (!user) return;

    const durationSeconds = calcDurationSeconds(values.started_at, values.ended_at);
    if (durationSeconds <= 0) {
      toast.error('End time must be after start time');
      return;
    }

    try {
      await createTimeEntry.mutateAsync({
        operator_id: user.id,
        client_id: values.client_id,
        description: values.description,
        started_at: new Date(values.started_at).toISOString(),
        ended_at: new Date(values.ended_at).toISOString(),
        duration_seconds: durationSeconds,
        delivery_item_id: values.delivery_item_id && values.delivery_item_id !== 'none'
          ? values.delivery_item_id
          : null,
        is_manual: true,
      });
      toast.success('Time entry added');
      onOpenChange(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add time entry';
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Time Entry</DialogTitle>
          <DialogDescription>
            Manually log time for work you forgot to track.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client…" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeClients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Input placeholder="What did you work on?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="started_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start time *</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ended_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End time *</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {selectedClientId && linkableDeliveries.length > 0 && (
              <FormField
                control={form.control}
                name="delivery_item_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Link to delivery{' '}
                      <span className="text-muted-foreground font-normal">(optional)</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="No link — standalone entry" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No link — standalone entry</SelectItem>
                        {linkableDeliveries.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createTimeEntry.isPending}>
                {createTimeEntry.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Add Entry
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
