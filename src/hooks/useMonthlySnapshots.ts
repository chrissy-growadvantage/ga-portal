import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/query-keys';
import type {
  MonthlySnapshot,
  MonthlySnapshotIndex,
  InsertMonthlySnapshot,
} from '@/types/database';

// ── List hook ──────────────────────────────────────────────────────────────────

export function useMonthlySnapshots(clientId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.snapshots.list(clientId ?? ''),
    queryFn: async (): Promise<MonthlySnapshotIndex[]> => {
      const { data, error } = await supabase
        .from('monthly_snapshots')
        .select('id, month_label, month_slug, created_at')
        .eq('client_id', clientId!)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as MonthlySnapshotIndex[];
    },
    enabled: !!clientId,
  });
}

// ── Detail hook ────────────────────────────────────────────────────────────────

export function useMonthlySnapshot(
  clientId: string | undefined,
  monthSlug: string | undefined,
) {
  return useQuery({
    queryKey: queryKeys.snapshots.detail(clientId ?? '', monthSlug ?? ''),
    queryFn: async (): Promise<MonthlySnapshot | null> => {
      const { data, error } = await supabase
        .from('monthly_snapshots')
        .select('*')
        .eq('client_id', clientId!)
        .eq('month_slug', monthSlug!)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as MonthlySnapshot | null;
    },
    enabled: !!clientId && !!monthSlug,
  });
}

// ── Create hook ────────────────────────────────────────────────────────────────

export function useCreateSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: InsertMonthlySnapshot): Promise<MonthlySnapshot> => {
      const { data, error } = await supabase
        .from('monthly_snapshots')
        .insert(payload)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as MonthlySnapshot;
    },
    onSuccess: (snapshot) => {
      qc.invalidateQueries({ queryKey: queryKeys.snapshots.list(snapshot.client_id) });
    },
  });
}

// ── Save (upsert) hook ─────────────────────────────────────────────────────────

type UpdatePayload = Partial<
  Omit<MonthlySnapshot, 'id' | 'client_id' | 'operator_id' | 'created_at' | 'updated_at'>
> & { id: string; client_id: string };

export function useSaveSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdatePayload): Promise<MonthlySnapshot> => {
      const { id, client_id, ...rest } = payload;
      const { data, error } = await supabase
        .from('monthly_snapshots')
        .update(rest)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      const updated = data as MonthlySnapshot;
      qc.setQueryData(
        queryKeys.snapshots.detail(client_id, updated.month_slug),
        updated,
      );
      return updated;
    },
    onSuccess: (snapshot) => {
      qc.invalidateQueries({ queryKey: queryKeys.snapshots.list(snapshot.client_id) });
    },
  });
}

// ── Delete hook ────────────────────────────────────────────────────────────────

export function useDeleteSnapshot() {
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
        .from('monthly_snapshots')
        .delete()
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_, { clientId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.snapshots.list(clientId) });
    },
  });
}
