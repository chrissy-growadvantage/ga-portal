import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/query-keys';
import { useAuth } from '@/hooks/useAuth';
import type { WebhookEndpoint, WebhookDelivery } from '@/types/database';

export function useWebhookEndpoints() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.webhooks.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_endpoints')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WebhookEndpoint[];
    },
    enabled: !!user,
  });
}

export function useWebhookDeliveries(endpointId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.webhooks.deliveries(endpointId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_deliveries')
        .select('*')
        .eq('webhook_endpoint_id', endpointId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as WebhookDelivery[];
    },
    enabled: !!user && !!endpointId,
  });
}

export function useCreateWebhookEndpoint() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: { url: string; events: string[]; secret?: string }) => {
      const secret = input.secret || crypto.randomUUID().replace(/-/g, '');
      const { data, error } = await supabase
        .from('webhook_endpoints')
        .insert({
          operator_id: user!.id,
          url: input.url,
          secret,
          events: input.events,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data as WebhookEndpoint;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.webhooks.all });
    },
  });
}

export function useUpdateWebhookEndpoint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; url?: string; events?: string[]; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('webhook_endpoints')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as WebhookEndpoint;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.webhooks.all });
    },
  });
}

export function useDeleteWebhookEndpoint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('webhook_endpoints').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.webhooks.all });
    },
  });
}
