import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/query-keys';
import type { ScopeRequest, InsertScopeRequest, RequestStatus, GaRequestStatus } from '@/types/database';

export function useScopeRequests(clientId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.clients.scopeRequests(clientId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scope_requests')
        .select('*')
        .eq('client_id', clientId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ScopeRequest[];
    },
    enabled: !!clientId,
    staleTime: 30_000,
  });
}

export function useCreateScopeRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: InsertScopeRequest) => {
      const { data, error } = await supabase
        .from('scope_requests')
        .insert({ ...input, requested_by: 'operator' })
        .select()
        .single();

      if (error) throw error;
      return data as ScopeRequest;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.scopeRequests(data.client_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(data.client_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
    },
  });
}

export function useUpdateScopeRequestStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, clientId, status }: { id: string; clientId: string; status: RequestStatus }) => {
      const { data, error } = await supabase
        .from('scope_requests')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ScopeRequest;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.scopeRequests(variables.clientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(variables.clientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
    },
  });
}

export function useUpdateScopeRequestFields() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      clientId,
      ga_status,
      admin_note,
    }: {
      id: string;
      clientId: string;
      ga_status?: GaRequestStatus | null;
      admin_note?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('scope_requests')
        .update({ ga_status, admin_note })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ScopeRequest;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.scopeRequests(variables.clientId) });
    },
  });
}
