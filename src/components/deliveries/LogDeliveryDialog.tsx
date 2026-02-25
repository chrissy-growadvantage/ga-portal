import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateDelivery } from '@/hooks/useDeliveries';
import { createDeliveryItemSchema, type CreateDeliveryItemInput } from '@/lib/schemas';
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { DELIVERY_CATEGORIES, DELIVERY_STATUS_CONFIG } from '@/lib/constants';
import type { DeliveryStatus } from '@/types/database';

interface Props {
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefillTitle?: string;
}

export function LogDeliveryDialog({ clientId, open, onOpenChange, prefillTitle }: Props) {
  const createDelivery = useCreateDelivery();

  const form = useForm<CreateDeliveryItemInput>({
    resolver: zodResolver(createDeliveryItemSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      status: 'completed',
      hours_spent: undefined,
      is_out_of_scope: false,
    },
  });

  // Pre-fill title when opened from quick-add Tab escalation
  useEffect(() => {
    if (open && prefillTitle) {
      form.setValue('title', prefillTitle);
    }
    if (!open) {
      form.reset();
    }
  }, [open, prefillTitle, form]);

  const onSubmit = async (values: CreateDeliveryItemInput) => {
    try {
      await createDelivery.mutateAsync({
        ...values,
        client_id: clientId,
        hours_spent: values.hours_spent ?? null,
      });
      toast.success('Delivery logged');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to log delivery');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Delivery</DialogTitle>
          <DialogDescription>
            Record a deliverable or task completed for this client.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What did you deliver? *</FormLabel>
                  <FormControl>
                    <Input placeholder="Monthly analytics report" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any relevant details…"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select…" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DELIVERY_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(DELIVERY_STATUS_CONFIG).map(([key, cfg]) => (
                          <SelectItem key={key} value={key}>
                            {cfg.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="hours_spent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hours spent <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.25"
                      min="0"
                      placeholder="e.g. 1.5"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_out_of_scope"
              render={({ field }) => (
                <FormItem className="flex items-start gap-3 rounded-lg border border-border p-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-0.5 leading-none">
                    <FormLabel className="flex items-center gap-1.5 cursor-pointer">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      Out of scope
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Flag this item as beyond the agreed scope allocation.
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createDelivery.isPending}>
                {createDelivery.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Log Delivery
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
