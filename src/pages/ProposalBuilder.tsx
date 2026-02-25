import { useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProposalSchema, type CreateProposalInput } from '@/lib/proposal-schemas';
import { useCreateProposal, useUpdateProposal, useProposal } from '@/hooks/useProposals';
import { useClients } from '@/hooks/useClients';
import { useAddonTemplates } from '@/hooks/useAddonTemplates';
import { ProposalLineItems } from '@/components/proposals/ProposalLineItems';
import { ProposalAddonSelector } from '@/components/proposals/ProposalAddonSelector';
import { ProposalPreviewPanel } from '@/components/proposals/ProposalPreviewPanel';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  ArrowLeft,
  Loader2,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_LINE_ITEM = {
  name: '',
  description: '',
  quantity: 1,
  unit_price: 0,
  billing_type: 'one_time' as const,
  sort_order: 0,
};

export default function ProposalBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const { data: existingProposal, isLoading: proposalLoading } = useProposal(id ?? '');
  const { data: clients, isLoading: clientsLoading } = useClients();
  const { data: addonTemplates } = useAddonTemplates();
  const createProposal = useCreateProposal();
  const updateProposal = useUpdateProposal();

  const form = useForm<CreateProposalInput>({
    resolver: zodResolver(createProposalSchema),
    defaultValues: {
      client_id: '',
      title: '',
      summary: '',
      notes: '',
      valid_days: 30,
      line_items: [{ ...DEFAULT_LINE_ITEM }],
      addons: [],
    },
  });

  // Pre-fill form when editing an existing proposal
  useEffect(() => {
    if (isEditMode && existingProposal) {
      form.reset({
        client_id: existingProposal.client_id,
        title: existingProposal.title,
        summary: existingProposal.summary ?? '',
        notes: existingProposal.notes ?? '',
        valid_days: existingProposal.valid_days ?? 30,
        line_items: existingProposal.line_items.length > 0
          ? existingProposal.line_items.map((item) => ({
              name: item.name,
              description: item.description ?? '',
              quantity: item.quantity,
              unit_price: item.unit_price,
              billing_type: item.billing_type,
              sort_order: item.sort_order,
            }))
          : [{ ...DEFAULT_LINE_ITEM }],
        addons: existingProposal.addons.map((addon) => ({
          addon_template_id: addon.addon_template_id ?? null,
          name: addon.name,
          description: addon.description ?? '',
          price: addon.price,
          billing_type: addon.billing_type,
          is_included: addon.is_included,
          sort_order: addon.sort_order,
        })),
      });
    }
  }, [isEditMode, existingProposal, form]);

  // Watch all form values for the live preview
  const watchedValues = form.watch();

  const selectedClient = useMemo(() => {
    if (!clients || !watchedValues.client_id) return null;
    return clients.find((c) => c.id === watchedValues.client_id) ?? null;
  }, [clients, watchedValues.client_id]);

  const clientDisplayName = selectedClient
    ? (selectedClient.company_name || selectedClient.contact_name)
    : '';

  const lineItemsTotal = useMemo(() => {
    return (watchedValues.line_items ?? []).reduce(
      (sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0),
      0,
    );
  }, [watchedValues.line_items]);

  const includedAddons = useMemo(() => {
    return (watchedValues.addons ?? []).filter((a) => a.is_included);
  }, [watchedValues.addons]);

  const addonsTotal = useMemo(() => {
    return includedAddons.reduce((sum, addon) => sum + (addon.price || 0), 0);
  }, [includedAddons]);

  const total = lineItemsTotal + addonsTotal;

  const handleSave = async (values: CreateProposalInput) => {
    try {
      const { line_items, addons, ...proposalData } = values;

      if (isEditMode) {
        await updateProposal.mutateAsync({
          id: id!,
          ...proposalData,
          line_items: line_items.map((item, i) => ({ ...item, sort_order: i })),
          addons: addons.map((addon, i) => ({ ...addon, sort_order: i })),
        });
        toast.success('Proposal updated');
        navigate(`/proposals/${id}`);
      } else {
        const proposal = await createProposal.mutateAsync({
          ...proposalData,
          line_items: line_items.map((item, i) => ({ ...item, sort_order: i })),
          addons: addons.map((addon, i) => ({ ...addon, sort_order: i })),
        });
        toast.success('Proposal created');
        navigate(`/proposals/${proposal.id}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save proposal';
      toast.error(message);
    }
  };

  const saveDraft = () => {
    form.handleSubmit(handleSave)();
  };

  const isSaving = createProposal.isPending || updateProposal.isPending;

  // Loading state for edit mode
  if (isEditMode && proposalLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  // Not found state for edit mode
  if (isEditMode && !proposalLoading && !existingProposal) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Proposal not found.</p>
        <Link to="/proposals" className="text-primary hover:underline text-sm mt-2 inline-block">
          Back to proposals
        </Link>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSave)} className="flex gap-6">
        {/* Builder Form */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Back link + Header */}
          <div className="flex items-center gap-4">
            <Link to="/proposals">
              <Button variant="ghost" size="icon" type="button">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                {isEditMode ? 'Edit Proposal' : 'New Proposal'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isEditMode
                  ? 'Update your proposal details and line items.'
                  : 'Create a new service proposal for your client.'}
              </p>
            </div>
          </div>

          {/* Client Selection */}
          <Card className="border-border/60">
            <CardContent className="p-5">
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={clientsLoading ? 'Loading clients...' : 'Select a client'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients?.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.company_name || client.contact_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Proposal Details */}
          <Card className="border-border/60">
            <CardContent className="p-5 space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proposal Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Monthly Marketing Retainer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Summary</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the services you're proposing..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valid_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid for (days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="365"
                        placeholder="30"
                        className="w-32"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value ? Number(e.target.value) : null)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Service Line Items */}
          <ProposalLineItems form={form} />

          {/* Addons */}
          <ProposalAddonSelector form={form} addonTemplates={addonTemplates} />

          {/* Internal Notes */}
          <Card className="border-border/60">
            <CardContent className="p-5">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internal Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notes for your reference (not shown to client)"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 bg-background border-t border-border p-4 flex justify-between items-center -mx-6 -mb-6 mt-6 z-10">
            <Button
              type="button"
              variant="outline"
              onClick={saveDraft}
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Draft
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="lg:hidden gap-2"
                onClick={() => {
                  // Scroll to top on mobile to show a preview summary via toast
                  toast.info(`Preview: ${watchedValues.title || 'Untitled'} - Total: $${total.toLocaleString()}`);
                }}
              >
                <Eye className="w-4 h-4" />
                Preview
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
              >
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditMode ? 'Save & Continue' : 'Preview & Send'}
              </Button>
            </div>
          </div>
        </div>

        {/* Preview Panel (desktop only) */}
        <ProposalPreviewPanel
          title={watchedValues.title}
          summary={watchedValues.summary}
          clientName={clientDisplayName || undefined}
          lineItems={watchedValues.line_items ?? []}
          addons={watchedValues.addons ?? []}
          validDays={watchedValues.valid_days}
        />
      </form>
    </Form>
  );
}
