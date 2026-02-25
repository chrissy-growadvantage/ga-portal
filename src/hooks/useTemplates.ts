import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/query-keys';
import { useAuth } from '@/hooks/useAuth';
import type { ProposalTemplate, InsertProposalTemplate } from '@/types/database';

export function useTemplates(category?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.proposalTemplates.list(category),
    queryFn: async () => {
      let query = supabase
        .from('proposal_templates')
        .select('*')
        .order('is_system', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ProposalTemplate[];
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: InsertProposalTemplate) => {
      const { data, error } = await supabase
        .from('proposal_templates')
        .insert({
          ...input,
          operator_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ProposalTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.proposalTemplates.all });
    },
  });
}

type UpdateTemplateInput = {
  id: string;
  name?: string;
  description?: string;
  content_json?: Record<string, unknown>;
  category?: string;
};

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateTemplateInput) => {
      const { data, error } = await supabase
        .from('proposal_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ProposalTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.proposalTemplates.all });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('proposal_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.proposalTemplates.all });
    },
  });
}
