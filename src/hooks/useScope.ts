import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/query-keys';
import type { ScopeAllocation, InsertScopeAllocation } from '@/types/database';

export function useScope(clientId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.clients.scope(clientId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scope_allocations')
        .select('*')
        .eq('client_id', clientId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ScopeAllocation[];
    },
    enabled: !!clientId,
    staleTime: 30_000,
  });
}

export function useCreateScope() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: InsertScopeAllocation) => {
      const { data, error } = await supabase
        .from('scope_allocations')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as ScopeAllocation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.scope(data.client_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(data.client_id) });
    },
  });
}

export function useUpdateScope() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ScopeAllocation> & { id: string; client_id: string }) => {
      const { data, error } = await supabase
        .from('scope_allocations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ScopeAllocation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.scope(data.client_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(data.client_id) });
    },
  });
}

export function useDeleteScope() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, clientId }: { id: string; clientId: string }) => {
      const { error } = await supabase.from('scope_allocations').delete().eq('id', id);
      if (error) throw error;
      return { clientId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.scope(data.clientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(data.clientId) });
    },
  });
}
