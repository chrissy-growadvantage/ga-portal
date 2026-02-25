import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/query-keys';
import type { DeliveryItem, InsertDeliveryItem } from '@/types/database';

export function useDeliveries(clientId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.clients.deliveries(clientId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_items')
        .select('*')
        .eq('client_id', clientId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DeliveryItem[];
    },
    enabled: !!clientId,
    staleTime: 30_000,
  });
}

export function useCreateDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: InsertDeliveryItem) => {
      const row = {
        ...input,
        completed_at: input.status === 'completed' ? new Date().toISOString() : null,
      };

      const { data, error } = await supabase
        .from('delivery_items')
        .insert(row)
        .select()
        .single();

      if (error) throw error;
      return data as DeliveryItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.deliveries(data.client_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(data.client_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
    },
  });
}

export function useUpdateDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DeliveryItem> & { id: string; client_id: string }) => {
      const { data, error } = await supabase
        .from('delivery_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as DeliveryItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.deliveries(data.client_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(data.client_id) });
    },
  });
}

export function useDeleteDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, clientId }: { id: string; clientId: string }) => {
      const { error } = await supabase.from('delivery_items').delete().eq('id', id);
      if (error) throw error;
      return { clientId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.deliveries(data.clientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(data.clientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
    },
  });
}
