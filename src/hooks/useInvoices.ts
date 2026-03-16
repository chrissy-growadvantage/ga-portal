import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/query-keys';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'void';

export type InvoiceLineItem = {
  id: string;
  invoice_id: string;
  delivery_item_id: string | null;
  description: string;
  quantity: number;
  unit_price: number; // cents
  created_at: string;
};

export type Invoice = {
  id: string;
  operator_id: string;
  client_id: string;
  proposal_id: string | null;
  invoice_number: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  currency: string;
  notes: string | null;
  stripe_payment_intent_id: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  line_items: InvoiceLineItem[];
  client_name: string;
  client_email: string | null;
};

export type CreateInvoiceInput = {
  client_id: string;
  proposal_id?: string;
  due_date?: string;
  currency?: string;
  notes?: string;
  line_items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    delivery_item_id?: string;
  }>;
};

async function fetchInvoices(): Promise<Invoice[]> {
  const { data: invoicesData, error: invoicesError } = await supabase
    .from('invoices')
    .select(`
      *,
      invoice_line_items(*),
      clients(company_name, contact_name, contact_email)
    `)
    .order('created_at', { ascending: false });

  if (invoicesError) throw invoicesError;

  return (invoicesData ?? []).map((row) => {
    const client = row.clients as { company_name: string | null; contact_name: string | null; contact_email: string | null } | null;
    return {
      ...row,
      line_items: row.invoice_line_items ?? [],
      client_name: client?.company_name ?? client?.contact_name ?? 'Unknown',
      client_email: client?.contact_email ?? null,
    };
  });
}

async function createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Generate invoice number
  const { data: invoiceNumberData, error: rpcError } = await supabase.rpc('next_invoice_number', {
    p_operator_id: user.id,
  });
  if (rpcError) throw new Error(`Failed to generate invoice number: ${rpcError.message}`);

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      operator_id: user.id,
      client_id: input.client_id,
      proposal_id: input.proposal_id ?? null,
      invoice_number: invoiceNumberData,
      due_date: input.due_date ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      currency: input.currency ?? 'USD',
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (invoiceError) throw invoiceError;

  const lineItemsPayload = input.line_items.map((li) => ({
    invoice_id: invoice.id,
    description: li.description,
    quantity: li.quantity,
    unit_price: li.unit_price,
    delivery_item_id: li.delivery_item_id ?? null,
  }));

  const { error: lineItemsError } = await supabase
    .from('invoice_line_items')
    .insert(lineItemsPayload);

  if (lineItemsError) throw lineItemsError;

  return { ...invoice, line_items: [], client_name: '' };
}

async function updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<void> {
  const update: Record<string, unknown> = { status };
  if (status === 'paid') update.paid_at = new Date().toISOString();

  const { error } = await supabase.from('invoices').update(update).eq('id', id);
  if (error) throw error;
}

async function fetchInvoice(id: string): Promise<Invoice> {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      invoice_line_items(*),
      clients(company_name, contact_name, contact_email)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;

  const client = data.clients as { company_name: string | null; contact_name: string | null; contact_email: string | null } | null;
  return {
    ...data,
    line_items: data.invoice_line_items ?? [],
    client_name: client?.company_name ?? client?.contact_name ?? 'Unknown',
    client_email: client?.contact_email ?? null,
  };
}

export function useInvoices() {
  return useQuery({
    queryKey: queryKeys.invoices.list(),
    queryFn: fetchInvoices,
    staleTime: 30_000,
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: queryKeys.invoices.detail(id),
    queryFn: () => fetchInvoice(id),
    staleTime: 30_000,
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.list() });
    },
  });
}

export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: InvoiceStatus }) =>
      updateInvoiceStatus(id, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.detail(variables.id) });
    },
  });
}
