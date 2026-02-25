import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/query-keys';
import { useAuth } from '@/hooks/useAuth';
import type { TimeEntry, InsertTimeEntry } from '@/types/database';

export function useTimeEntries(clientId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.timeEntries.list(clientId ? { clientId } : undefined),
    queryFn: async () => {
      let query = supabase
        .from('time_entries')
        .select('*')
        .order('started_at', { ascending: false });

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TimeEntry[];
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}

export function useRunningTimer() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.timeEntries.running,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as TimeEntry | null;
    },
    enabled: !!user,
    staleTime: 5_000,
    refetchInterval: 5_000,
  });
}

export function useCreateTimeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: InsertTimeEntry) => {
      const { data, error } = await supabase
        .from('time_entries')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as TimeEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.timeEntries.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.timeEntries.running });
    },
  });
}

export function useUpdateTimeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TimeEntry> & { id: string }) => {
      const { data, error } = await supabase
        .from('time_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as TimeEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.timeEntries.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.timeEntries.running });
    },
  });
}

export function useDeleteTimeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('time_entries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.timeEntries.all });
    },
  });
}
