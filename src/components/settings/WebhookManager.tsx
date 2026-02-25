import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useWebhookEndpoints,
  useWebhookDeliveries,
  useCreateWebhookEndpoint,
  useUpdateWebhookEndpoint,
  useDeleteWebhookEndpoint,
} from '@/hooks/useWebhooks';
import { createWebhookEndpointSchema, type CreateWebhookEndpointInput } from '@/lib/proposal-schemas';
import { WEBHOOK_EVENTS } from '@/lib/constants';
import type { WebhookEndpoint } from '@/types/database';
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
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { EmptyState } from '@/components/ui/empty-state';
import { Loader2, Plus, Pencil, Trash2, Webhook, ChevronDown, Copy, Check, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

// --- Event checkbox grid ---

function EventCheckboxGrid({
  value,
  onChange,
}: {
  value: string[];
  onChange: (events: string[]) => void;
}) {
  const toggle = (event: string) => {
    if (value.includes(event)) {
      onChange(value.filter((e) => e !== event));
    } else {
      onChange([...value, event]);
    }
  };

  const allSelected = value.length === WEBHOOK_EVENTS.length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <FormLabel>Events</FormLabel>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs h-auto py-1"
          onClick={() => onChange(allSelected ? [] : [...WEBHOOK_EVENTS])}
        >
          {allSelected ? 'Deselect all' : 'Select all'}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {WEBHOOK_EVENTS.map((event) => (
          <label
            key={event}
            className="flex items-center gap-2 text-sm cursor-pointer"
          >
            <Checkbox
              checked={value.includes(event)}
              onCheckedChange={() => toggle(event)}
            />
            <span className="font-mono text-xs">{event}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// --- Create Dialog ---

function CreateWebhookDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createEndpoint = useCreateWebhookEndpoint();
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm<CreateWebhookEndpointInput>({
    resolver: zodResolver(createWebhookEndpointSchema),
    defaultValues: {
      url: '',
      events: [],
      is_active: true,
    },
  });

  const onSubmit = async (values: CreateWebhookEndpointInput) => {
    try {
      const result = await createEndpoint.mutateAsync({
        url: values.url,
        events: values.events,
      });
      setCreatedSecret(result.secret);
      form.reset();
      toast.success('Webhook endpoint created');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create webhook endpoint');
    }
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setCreatedSecret(null);
      setCopied(false);
      form.reset();
    }
    onOpenChange(nextOpen);
  };

  const copySecret = async () => {
    if (!createdSecret) return;
    await navigator.clipboard.writeText(createdSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (createdSecret) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Webhook Secret</DialogTitle>
            <DialogDescription>
              Copy this secret now. It won't be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-md border p-3 bg-muted/50">
            <code className="text-xs font-mono flex-1 break-all">{createdSecret}</code>
            <Button type="button" variant="ghost" size="icon" onClick={copySecret}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={() => handleClose(false)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Endpoint</DialogTitle>
          <DialogDescription>
            Configure a new webhook endpoint to receive event notifications.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/webhooks" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Controller
              control={form.control}
              name="events"
              render={({ field, fieldState }) => (
                <div className="space-y-1">
                  <EventCheckboxGrid value={field.value} onChange={field.onChange} />
                  {fieldState.error && (
                    <p className="text-sm font-medium text-destructive">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createEndpoint.isPending}>
                {createEndpoint.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add Endpoint
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// --- Edit Dialog ---

function EditWebhookDialog({
  endpoint,
  open,
  onOpenChange,
}: {
  endpoint: WebhookEndpoint;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateEndpoint = useUpdateWebhookEndpoint();

  const form = useForm<CreateWebhookEndpointInput>({
    resolver: zodResolver(createWebhookEndpointSchema),
    defaultValues: {
      url: endpoint.url,
      events: endpoint.events,
      is_active: endpoint.is_active,
    },
  });

  const onSubmit = async (values: CreateWebhookEndpointInput) => {
    try {
      await updateEndpoint.mutateAsync({
        id: endpoint.id,
        url: values.url,
        events: values.events,
        is_active: values.is_active,
      });
      toast.success('Webhook endpoint updated');
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update webhook endpoint');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Endpoint</DialogTitle>
          <DialogDescription>Update webhook endpoint configuration.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/webhooks" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Controller
              control={form.control}
              name="events"
              render={({ field, fieldState }) => (
                <div className="space-y-1">
                  <EventCheckboxGrid value={field.value} onChange={field.onChange} />
                  {fieldState.error && (
                    <p className="text-sm font-medium text-destructive">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <FormLabel className="text-sm font-normal">Active</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateEndpoint.isPending}>
                {updateEndpoint.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// --- Delivery Log ---

function DeliveryLog({ endpointId }: { endpointId: string }) {
  const { data: deliveries, isLoading } = useWebhookDeliveries(endpointId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!deliveries?.length) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No deliveries yet.
      </p>
    );
  }

  return (
    <div className="divide-y">
      {deliveries.map((delivery) => (
        <div key={delivery.id} className="flex items-center justify-between py-2 text-sm">
          <div className="flex items-center gap-2">
            <Badge
              variant={
                delivery.response_status && delivery.response_status >= 200 && delivery.response_status < 300
                  ? 'default'
                  : 'destructive'
              }
              className="text-xs"
            >
              {delivery.response_status ?? 'pending'}
            </Badge>
            <span className="font-mono text-xs">{delivery.event_type}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {delivery.delivered_at
              ? new Date(delivery.delivered_at).toLocaleString()
              : `Attempt ${delivery.attempts}`}
          </span>
        </div>
      ))}
    </div>
  );
}

// --- Endpoint Card ---

function EndpointCard({
  endpoint,
  onEdit,
  onDelete,
}: {
  endpoint: WebhookEndpoint;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const updateEndpoint = useUpdateWebhookEndpoint();
  const [secretVisible, setSecretVisible] = useState(false);

  const handleToggleActive = async () => {
    try {
      await updateEndpoint.mutateAsync({ id: endpoint.id, is_active: !endpoint.is_active });
      toast.success(endpoint.is_active ? 'Endpoint deactivated' : 'Endpoint activated');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update endpoint');
    }
  };

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium font-mono truncate">{endpoint.url}</p>
                {endpoint.is_active ? (
                  <Badge variant="default" className="shrink-0">Active</Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground shrink-0">Inactive</Badge>
                )}
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {endpoint.events.slice(0, 3).map((event) => (
                  <Badge key={event} variant="secondary" className="text-xs">
                    {event}
                  </Badge>
                ))}
                {endpoint.events.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{endpoint.events.length - 3} more
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Switch
                checked={endpoint.is_active}
                onCheckedChange={handleToggleActive}
                disabled={updateEndpoint.isPending}
              />
              <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edit endpoint">
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete endpoint">
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Secret:</span>
            <code className="text-xs font-mono">
              {secretVisible ? endpoint.secret : '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
            </code>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setSecretVisible(!secretVisible)}
            >
              {secretVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </Button>
          </div>

          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full text-xs">
              <ChevronDown
                className={`w-4 h-4 mr-1 transition-transform ${expanded ? 'rotate-180' : ''}`}
              />
              Recent Deliveries
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <DeliveryLog endpointId={endpoint.id} />
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
}

// --- Main Component ---

export function WebhookManager() {
  const { data: endpoints, isLoading } = useWebhookEndpoints();
  const deleteEndpoint = useDeleteWebhookEndpoint();

  const [createOpen, setCreateOpen] = useState(false);
  const [editEndpoint, setEditEndpoint] = useState<WebhookEndpoint | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WebhookEndpoint | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEndpoint.mutateAsync(deleteTarget.id);
      toast.success('Webhook endpoint deleted');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete webhook endpoint');
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
          <h2 className="text-lg font-semibold">Webhooks</h2>
          <p className="text-sm text-muted-foreground">
            Manage webhook endpoints to receive real-time event notifications.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Endpoint
        </Button>
      </div>

      {!endpoints?.length ? (
        <EmptyState
          icon={Webhook}
          title="No webhook endpoints"
          description="Add a webhook endpoint to start receiving event notifications via HTTP."
          action={{ label: 'Add Endpoint', onClick: () => setCreateOpen(true) }}
        />
      ) : (
        <div className="space-y-3">
          {endpoints.map((endpoint) => (
            <EndpointCard
              key={endpoint.id}
              endpoint={endpoint}
              onEdit={() => setEditEndpoint(endpoint)}
              onDelete={() => setDeleteTarget(endpoint)}
            />
          ))}
        </div>
      )}

      <CreateWebhookDialog open={createOpen} onOpenChange={setCreateOpen} />

      {editEndpoint && (
        <EditWebhookDialog
          endpoint={editEndpoint}
          open={!!editEndpoint}
          onOpenChange={(open) => !open && setEditEndpoint(null)}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete webhook endpoint</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the endpoint for "{deleteTarget?.url}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteEndpoint.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
