import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useAddonTemplates,
  useCreateAddonTemplate,
  useUpdateAddonTemplate,
  useDeleteAddonTemplate,
} from '@/hooks/useAddonTemplates';
import { createAddonTemplateSchema, type CreateAddonTemplateInput } from '@/lib/proposal-schemas';
import { BILLING_TYPE_LABELS } from '@/lib/constants';
import type { AddonTemplate } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Loader2, Plus, Pencil, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';

function AddonFormFields({ form }: { form: ReturnType<typeof useForm<CreateAddonTemplateInput>> }) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input placeholder="e.g. Rush Delivery" {...field} />
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
                placeholder="Describe what this addon includes..."
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
          name="default_price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="billing_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Billing type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="one_time">One-time</SelectItem>
                  <SelectItem value="recurring">Recurring</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

function CreateAddonDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createAddon = useCreateAddonTemplate();

  const form = useForm<CreateAddonTemplateInput>({
    resolver: zodResolver(createAddonTemplateSchema),
    defaultValues: {
      name: '',
      description: '',
      default_price: 0,
      billing_type: 'one_time',
    },
  });

  const onSubmit = async (values: CreateAddonTemplateInput) => {
    try {
      await createAddon.mutateAsync(values);
      toast.success('Addon created');
      form.reset();
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create addon');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Addon</DialogTitle>
          <DialogDescription>
            Add a reusable addon to your library for proposals.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <AddonFormFields form={form} />

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createAddon.isPending}>
                {createAddon.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Addon
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function EditAddonDialog({
  addon,
  open,
  onOpenChange,
}: {
  addon: AddonTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateAddon = useUpdateAddonTemplate();

  const form = useForm<CreateAddonTemplateInput>({
    resolver: zodResolver(createAddonTemplateSchema),
    defaultValues: {
      name: addon.name,
      description: addon.description || '',
      default_price: addon.default_price,
      billing_type: addon.billing_type,
    },
  });

  const onSubmit = async (values: CreateAddonTemplateInput) => {
    try {
      await updateAddon.mutateAsync({ id: addon.id, ...values });
      toast.success('Addon updated');
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update addon');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Addon</DialogTitle>
          <DialogDescription>Update addon details.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <AddonFormFields form={form} />

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateAddon.isPending}>
                {updateAddon.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AddonCard({
  addon,
  onEdit,
  onDelete,
}: {
  addon: AddonTemplate;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{addon.name}</p>
            <Badge variant="secondary">
              {BILLING_TYPE_LABELS[addon.billing_type]}
            </Badge>
            {!addon.is_active && (
              <Badge variant="outline" className="text-muted-foreground">
                Inactive
              </Badge>
            )}
          </div>
          {addon.description && (
            <p className="text-sm text-muted-foreground">{addon.description}</p>
          )}
          <p className="text-sm font-medium">
            ${addon.default_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit} aria-label={`Edit ${addon.name}`}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} aria-label={`Delete ${addon.name}`}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function AddonLibrary() {
  const { data: addons, isLoading } = useAddonTemplates();
  const deleteAddon = useDeleteAddonTemplate();

  const [createOpen, setCreateOpen] = useState(false);
  const [editAddon, setEditAddon] = useState<AddonTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AddonTemplate | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAddon.mutateAsync(deleteTarget.id);
      toast.success('Addon deleted');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete addon');
    }
    setDeleteTarget(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Addon Library</h2>
          <p className="text-sm text-muted-foreground">
            Manage reusable addons for your proposals.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Addon
        </Button>
      </div>

      {!addons?.length ? (
        <EmptyState
          icon={Package}
          title="No addons yet"
          description="Create reusable addons to quickly add them to your proposals."
          action={{ label: 'Create Addon', onClick: () => setCreateOpen(true) }}
        />
      ) : (
        <div className="space-y-3">
          {addons.map((addon) => (
            <AddonCard
              key={addon.id}
              addon={addon}
              onEdit={() => setEditAddon(addon)}
              onDelete={() => setDeleteTarget(addon)}
            />
          ))}
        </div>
      )}

      <CreateAddonDialog open={createOpen} onOpenChange={setCreateOpen} />

      {editAddon && (
        <EditAddonDialog
          addon={editAddon}
          open={!!editAddon}
          onOpenChange={(open) => !open && setEditAddon(null)}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete addon</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteAddon.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
