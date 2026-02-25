import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTimer } from '@/contexts/TimerContext';
import { useClients } from '@/hooks/useClients';
import { useDeliveries } from '@/hooks/useDeliveries';
import { startTimerSchema, type StartTimerInput } from '@/lib/schemas';
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
import { Loader2, Play } from 'lucide-react';

export function StartTimerDialog() {
  const { isStartDialogOpen, setStartDialogOpen, startTimer, timer } = useTimer();
  const { data: clients } = useClients();

  const form = useForm<StartTimerInput>({
    resolver: zodResolver(startTimerSchema),
    defaultValues: {
      client_id: '',
      description: '',
      delivery_item_id: undefined,
    },
  });

  const selectedClientId = form.watch('client_id');
  const { data: deliveries } = useDeliveries(selectedClientId || undefined);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!isStartDialogOpen) {
      form.reset();
    }
  }, [isStartDialogOpen, form]);

  const onSubmit = async (values: StartTimerInput) => {
    const client = clients?.find((c) => c.id === values.client_id);
    await startTimer({
      clientId: values.client_id,
      clientName: client?.company_name ?? '',
      description: values.description,
      deliveryItemId: values.delivery_item_id,
    });
    setStartDialogOpen(false);
  };

  // Filter active clients only
  const activeClients = clients?.filter((c) => c.status === 'active') ?? [];

  // Filter in-progress deliveries for linking
  const linkableDeliveries = deliveries?.filter(
    (d) => d.status === 'in_progress' || d.status === 'completed'
  ) ?? [];

  const isSubmitting = timer.isRunning; // Prevent double-start

  return (
    <Dialog open={isStartDialogOpen} onOpenChange={setStartDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start Timer</DialogTitle>
          <DialogDescription>
            Track time spent on client work. Select a client and describe what you're working on.
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
                  <FormLabel>What are you working on? *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Monthly analytics report" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                onClick={() => setStartDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Start Timer
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
