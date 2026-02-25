import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateScope } from '@/hooks/useScope';
import { createScopeAllocationSchema, type CreateScopeAllocationInput } from '@/lib/schemas';
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
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { SCOPE_TYPE_LABELS } from '@/lib/constants';
import type { ScopeType } from '@/types/database';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface ScopeAllocationFormProps {
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UNIT_SUGGESTIONS: Record<ScopeType, string> = {
  hours: 'hrs',
  deliverables: 'deliverables',
  custom: 'units',
};

export function ScopeAllocationForm({
  clientId,
  open,
  onOpenChange,
}: ScopeAllocationFormProps) {
  const createScope = useCreateScope();

  const now = new Date();
  const defaultStart = format(startOfMonth(now), 'yyyy-MM-dd');
  const defaultEnd = format(endOfMonth(now), 'yyyy-MM-dd');

  const form = useForm<CreateScopeAllocationInput>({
    resolver: zodResolver(createScopeAllocationSchema),
    defaultValues: {
      period_start: defaultStart,
      period_end: defaultEnd,
      scope_type: 'hours',
      total_allocated: 20,
      unit_label: 'hrs',
    },
  });

  const selectedType = form.watch('scope_type') as ScopeType;

  const onSubmit = async (values: CreateScopeAllocationInput) => {
    try {
      await createScope.mutateAsync({
        ...values,
        client_id: clientId,
      });
      toast.success('Scope allocation created');
      form.reset();
      onOpenChange(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create scope allocation';
      toast.error(message);
    }
  };

  const handleTypeChange = (value: string, onChange: (value: string) => void) => {
    onChange(value);
    const suggestion = UNIT_SUGGESTIONS[value as ScopeType] ?? 'units';
    form.setValue('unit_label', suggestion);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Up Scope Allocation</DialogTitle>
          <DialogDescription>
            Define the scope budget for this client's billing period.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Period row */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="period_start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period Start</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="period_end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period End</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Scope type */}
            <FormField
              control={form.control}
              name="scope_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scope Type</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(v) => handleTypeChange(v, field.onChange)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(SCOPE_TYPE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount + unit row */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="total_allocated"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Allocated</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="20"
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value ? Number(e.target.value) : 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit_label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Label</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={UNIT_SUGGESTIONS[selectedType] ?? 'units'}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createScope.isPending}>
                {createScope.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Create Allocation
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
