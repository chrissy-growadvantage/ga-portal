import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/query-keys';
import { useAuth } from '@/hooks/useAuth';
import type { Client, ClientListItem, ClientWithScope, InsertClient } from '@/types/database';

export function useClients() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.clients.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*, scope_allocations(*), delivery_items(scope_cost, is_out_of_scope)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ClientListItem[];
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}

export function useClient(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.clients.detail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*, scope_allocations(*), delivery_items(*)')
        .eq('id', id!)
        .single();

      if (error) throw error;
      return data as ClientWithScope;
    },
    enabled: !!user && !!id,
    staleTime: 30_000,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: Omit<InsertClient, 'operator_id'>) => {
      const { data, error } = await supabase
        .from('clients')
        .insert({ ...input, operator_id: user!.id })
        .select()
        .single();

      if (error) throw error;
      return data as Client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Client> & { id: string }) => {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Client;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(data.id) });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
    },
  });
}
