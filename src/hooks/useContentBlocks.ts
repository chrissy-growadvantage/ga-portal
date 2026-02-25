import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/query-keys';
import { useAuth } from '@/hooks/useAuth';
import type { ProposalContentBlock, InsertProposalContentBlock, ContentBlockType } from '@/types/database';

export function useContentBlocks(proposalId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.contentBlocks.byProposal(proposalId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposal_content_blocks')
        .select('*')
        .eq('proposal_id', proposalId)
        .order('position', { ascending: true });

      if (error) throw error;
      return data as ProposalContentBlock[];
    },
    enabled: !!user && !!proposalId,
    staleTime: 30_000,
  });
}

export function useCreateContentBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: InsertProposalContentBlock) => {
      const { data, error } = await supabase
        .from('proposal_content_blocks')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as ProposalContentBlock;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.contentBlocks.byProposal(data.proposal_id),
      });
    },
  });
}

type UpdateContentBlockInput = {
  id: string;
  proposal_id: string;
  type?: ContentBlockType;
  position?: number;
  content_json?: Record<string, unknown>;
};

export function useUpdateContentBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, proposal_id, ...updates }: UpdateContentBlockInput) => {
      const { data, error } = await supabase
        .from('proposal_content_blocks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, proposal_id } as ProposalContentBlock;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.contentBlocks.byProposal(data.proposal_id),
      });
    },
  });
}

type DeleteContentBlockInput = {
  id: string;
  proposalId: string;
};

export function useDeleteContentBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: DeleteContentBlockInput) => {
      const { error } = await supabase
        .from('proposal_content_blocks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.contentBlocks.byProposal(variables.proposalId),
      });
    },
  });
}
