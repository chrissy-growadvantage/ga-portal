import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/query-keys';
import { useAuth } from '@/hooks/useAuth';
import type {
  Proposal,
  ProposalWithDetails,
  ProposalLineItem,
  ProposalAddon,
  InsertProposal,
  InsertProposalLineItem,
  InsertProposalAddon,
  Agreement,
} from '@/types/database';

// --- Proposal Queries ---

export function useProposals(filters?: { status?: string; clientId?: string }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.proposals.list(filters),
    queryFn: async () => {
      let query = supabase
        .from('proposals')
        .select('*, client:clients(company_name, contact_name, contact_email), line_items:proposal_line_items(*), addons:proposal_addons(*)')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.clientId) {
        query = query.eq('client_id', filters.clientId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ProposalWithDetails[];
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}

export function useProposal(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.proposals.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select('*, client:clients(company_name, contact_name, contact_email), line_items:proposal_line_items(*), addons:proposal_addons(*), agreement:agreements(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as ProposalWithDetails;
    },
    enabled: !!user && !!id,
  });
}

// --- Proposal Mutations ---

interface CreateProposalInput {
  title: string;
  client_id: string;
  summary?: string | null;
  notes?: string | null;
  valid_days?: number | null;
  line_items: Omit<InsertProposalLineItem, 'proposal_id'>[];
  addons: Omit<InsertProposalAddon, 'proposal_id'>[];
}

export function useCreateProposal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateProposalInput) => {
      const { line_items, addons, ...proposalData } = input;

      const { data: proposal, error: proposalError } = await supabase
        .from('proposals')
        .insert({
          ...proposalData,
          operator_id: user!.id,
          status: 'draft' as const,
        })
        .select()
        .single();

      if (proposalError) throw proposalError;

      if (line_items.length > 0) {
        const { error: lineItemsError } = await supabase
          .from('proposal_line_items')
          .insert(line_items.map((item) => ({ ...item, proposal_id: proposal.id })));

        if (lineItemsError) throw lineItemsError;
      }

      if (addons.length > 0) {
        const { error: addonsError } = await supabase
          .from('proposal_addons')
          .insert(addons.map((addon) => ({ ...addon, proposal_id: proposal.id })));

        if (addonsError) throw addonsError;
      }

      return proposal as Proposal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.proposals.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.proposals.list() });
    },
  });
}

interface UpdateProposalInput {
  id: string;
  title?: string;
  client_id?: string;
  summary?: string | null;
  notes?: string | null;
  status?: string;
  valid_days?: number | null;
  line_items?: Omit<InsertProposalLineItem, 'proposal_id'>[];
  addons?: Omit<InsertProposalAddon, 'proposal_id'>[];
}

export function useUpdateProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, line_items, addons, ...updates }: UpdateProposalInput) => {
      const { data, error } = await supabase
        .from('proposals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (line_items) {
        const { error: deleteLineItemsError } = await supabase
          .from('proposal_line_items')
          .delete()
          .eq('proposal_id', id);

        if (deleteLineItemsError) throw deleteLineItemsError;

        if (line_items.length > 0) {
          const { error: insertLineItemsError } = await supabase
            .from('proposal_line_items')
            .insert(line_items.map((item) => ({ ...item, proposal_id: id })));

          if (insertLineItemsError) throw insertLineItemsError;
        }
      }

      if (addons) {
        const { error: deleteAddonsError } = await supabase
          .from('proposal_addons')
          .delete()
          .eq('proposal_id', id);

        if (deleteAddonsError) throw deleteAddonsError;

        if (addons.length > 0) {
          const { error: insertAddonsError } = await supabase
            .from('proposal_addons')
            .insert(addons.map((addon) => ({ ...addon, proposal_id: id })));

          if (insertAddonsError) throw insertAddonsError;
        }
      }

      return data as Proposal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.proposals.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.proposals.list() });
    },
  });
}

export function useDeleteProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('proposals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.proposals.all });
    },
  });
}

export function useDuplicateProposal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (sourceId: string) => {
      const { data: source, error: fetchError } = await supabase
        .from('proposals')
        .select('*, line_items:proposal_line_items(*), addons:proposal_addons(*)')
        .eq('id', sourceId)
        .single();

      if (fetchError) throw fetchError;

      const { data: newProposal, error: createError } = await supabase
        .from('proposals')
        .insert({
          operator_id: user!.id,
          client_id: source.client_id,
          title: `Copy of ${source.title}`,
          summary: source.summary,
          notes: source.notes,
          valid_days: source.valid_days,
          status: 'draft' as const,
        })
        .select()
        .single();

      if (createError) throw createError;

      const lineItems = source.line_items as ProposalLineItem[];
      if (lineItems.length > 0) {
        const { error: lineItemsError } = await supabase
          .from('proposal_line_items')
          .insert(
            lineItems.map(({ id, proposal_id, created_at, ...item }) => ({
              ...item,
              proposal_id: newProposal.id,
            }))
          );

        if (lineItemsError) throw lineItemsError;
      }

      const addonItems = source.addons as ProposalAddon[];
      if (addonItems.length > 0) {
        const { error: addonsError } = await supabase
          .from('proposal_addons')
          .insert(
            addonItems.map(({ id, proposal_id, created_at, ...addon }) => ({
              ...addon,
              proposal_id: newProposal.id,
            }))
          );

        if (addonsError) throw addonsError;
      }

      return newProposal as Proposal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.proposals.all });
    },
  });
}

export function useSendProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (proposalId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/send-proposal`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ proposal_id: proposalId }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result?.error?.message ?? 'Failed to send proposal');
      }

      return response.json() as Promise<{ raw_token: string; proposal_id: string; expires_at: string; portal_url: string }>;
    },
    onSuccess: (_, proposalId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.proposals.detail(proposalId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.proposals.list() });
    },
  });
}

// --- Agreement Queries ---

export function useAgreements(clientId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.agreements.list(clientId),
    queryFn: async () => {
      let query = supabase
        .from('agreements')
        .select('*, proposal:proposals(title)')
        .order('created_at', { ascending: false });

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as (Agreement & { proposal: { title: string } })[];
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}

export function useAgreement(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.agreements.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agreements')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Agreement;
    },
    enabled: !!user && !!id,
  });
}
