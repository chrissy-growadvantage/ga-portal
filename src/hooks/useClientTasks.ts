import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/query-keys';
import type { ClientTask, InsertClientTask } from '@/types/database';

export function useClientTasks(clientId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.clientTasks.list(clientId ?? ''),
    queryFn: async (): Promise<ClientTask[]> => {
      const { data, error } = await supabase
        .from('client_tasks')
        .select('*')
        .eq('client_id', clientId!)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as ClientTask[];
    },
    enabled: !!clientId,
  });
}

export function useCreateClientTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: InsertClientTask): Promise<ClientTask> => {
      const { data, error } = await supabase
        .from('client_tasks')
        .insert(payload)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as ClientTask;
    },
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: queryKeys.clientTasks.list(task.client_id) });
    },
  });
}

export function useUpdateClientTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      clientId: _clientId,
      ...updates
    }: Partial<ClientTask> & { id: string; clientId: string }): Promise<ClientTask> => {
      const { data, error } = await supabase
        .from('client_tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as ClientTask;
    },
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: queryKeys.clientTasks.list(task.client_id) });
    },
  });
}

export function useDeleteClientTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, clientId }: { id: string; clientId: string }): Promise<void> => {
      const { error } = await supabase
        .from('client_tasks')
        .delete()
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_, { clientId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.clientTasks.list(clientId) });
    },
  });
}
