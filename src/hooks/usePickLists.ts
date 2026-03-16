import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/query-keys';
import {
  DEFAULT_PICK_LIST_PHASES,
  DEFAULT_PICK_LIST_CATEGORIES,
  DEFAULT_PICK_LIST_UPLIFTS,
  DEFAULT_PICK_LIST_WORK_STATUSES,
} from '@/lib/constants';
import type { PickListItem, InsertPickListItem, PickListType } from '@/types/database';

export function usePickLists(listType: PickListType) {
  return useQuery({
    queryKey: queryKeys.pickLists.list(listType),
    queryFn: async (): Promise<PickListItem[]> => {
      const { data, error } = await supabase
        .from('pick_list_items')
        .select('*')
        .eq('list_type', listType)
        .order('sort_order', { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as PickListItem[];
    },
  });
}

export function useAllPickLists() {
  return useQuery({
    queryKey: queryKeys.pickLists.list(),
    queryFn: async (): Promise<PickListItem[]> => {
      const { data, error } = await supabase
        .from('pick_list_items')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as PickListItem[];
    },
  });
}

export function useCreatePickListItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: InsertPickListItem): Promise<PickListItem> => {
      const { data, error } = await supabase
        .from('pick_list_items')
        .insert(payload)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as PickListItem;
    },
    onSuccess: (item) => {
      qc.invalidateQueries({ queryKey: queryKeys.pickLists.list(item.list_type) });
      qc.invalidateQueries({ queryKey: queryKeys.pickLists.list() });
    },
  });
}

export function useUpdatePickListItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<PickListItem> & { id: string }): Promise<PickListItem> => {
      const { data, error } = await supabase
        .from('pick_list_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as PickListItem;
    },
    onSuccess: (item) => {
      qc.invalidateQueries({ queryKey: queryKeys.pickLists.list(item.list_type) });
      qc.invalidateQueries({ queryKey: queryKeys.pickLists.list() });
    },
  });
}

export function useDeletePickListItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      listType,
    }: {
      id: string;
      listType: PickListType;
    }): Promise<void> => {
      const { error } = await supabase
        .from('pick_list_items')
        .delete()
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_, { listType }) => {
      qc.invalidateQueries({ queryKey: queryKeys.pickLists.list(listType) });
      qc.invalidateQueries({ queryKey: queryKeys.pickLists.list() });
    },
  });
}

export function useSeedPickLists() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<void> => {
      const session = await supabase.auth.getSession();
      const operatorId = session.data.session?.user.id;
      if (!operatorId) throw new Error('Not authenticated');

      const phases: InsertPickListItem[] = DEFAULT_PICK_LIST_PHASES.map((label, i) => ({
        operator_id: operatorId,
        list_type: 'phase' as const,
        label,
        sort_order: i,
      }));

      const categories: InsertPickListItem[] = DEFAULT_PICK_LIST_CATEGORIES.map((label, i) => ({
        operator_id: operatorId,
        list_type: 'category' as const,
        label,
        sort_order: i,
      }));

      const uplifts: InsertPickListItem[] = DEFAULT_PICK_LIST_UPLIFTS.map((label, i) => ({
        operator_id: operatorId,
        list_type: 'uplift' as const,
        label,
        sort_order: i,
      }));

      const workStatuses: InsertPickListItem[] = DEFAULT_PICK_LIST_WORK_STATUSES.map((item, i) => ({
        operator_id: operatorId,
        list_type: 'work_status' as const,
        label: item.label,
        colour: item.colour ?? null,
        sort_order: i,
      }));

      const { error } = await supabase
        .from('pick_list_items')
        .insert([...phases, ...categories, ...uplifts, ...workStatuses]);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.pickLists.list() });
      qc.invalidateQueries({ queryKey: queryKeys.pickLists.list('phase') });
      qc.invalidateQueries({ queryKey: queryKeys.pickLists.list('category') });
      qc.invalidateQueries({ queryKey: queryKeys.pickLists.list('uplift') });
      qc.invalidateQueries({ queryKey: queryKeys.pickLists.list('work_status') });
    },
  });
}
