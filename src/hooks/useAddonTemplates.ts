import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/query-keys';
import { useAuth } from '@/hooks/useAuth';
import type { AddonTemplate, InsertAddonTemplate } from '@/types/database';

export function useAddonTemplates() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.addonTemplates.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('addon_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AddonTemplate[];
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}

export function useCreateAddonTemplate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: Omit<InsertAddonTemplate, 'operator_id'>) => {
      const { data, error } = await supabase
        .from('addon_templates')
        .insert({ ...input, operator_id: user!.id })
        .select()
        .single();

      if (error) throw error;
      return data as AddonTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.addonTemplates.all });
    },
  });
}

export function useUpdateAddonTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AddonTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from('addon_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as AddonTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.addonTemplates.all });
    },
  });
}

export function useDeleteAddonTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('addon_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.addonTemplates.all });
    },
  });
}
