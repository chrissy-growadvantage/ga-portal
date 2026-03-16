import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/query-keys';
import type { ClientNote, InsertClientNote } from '@/types/database';

// ── List hook ──────────────────────────────────────────────────────────────────

export function useClientNotes(clientId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.clientNotes.list(clientId ?? ''),
    queryFn: async (): Promise<ClientNote[]> => {
      const { data, error } = await supabase
        .from('client_notes')
        .select('*')
        .eq('client_id', clientId!)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as ClientNote[];
    },
    enabled: !!clientId,
  });
}

// ── Create hook ────────────────────────────────────────────────────────────────

export function useCreateClientNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: InsertClientNote): Promise<ClientNote> => {
      const { data, error } = await supabase
        .from('client_notes')
        .insert(payload)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as ClientNote;
    },
    onSuccess: (note) => {
      qc.invalidateQueries({ queryKey: queryKeys.clientNotes.list(note.client_id) });
    },
  });
}

// ── Delete hook ────────────────────────────────────────────────────────────────

export function useDeleteClientNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      clientId,
    }: {
      id: string;
      clientId: string;
    }): Promise<void> => {
      const { error } = await supabase
        .from('client_notes')
        .delete()
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_, { clientId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.clientNotes.list(clientId) });
    },
  });
}
