import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/query-keys';
import type { Operator } from '@/types/database';

export function useOperatorProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.operator.profile,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('operators')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (error) throw error;
      return data as Operator;
    },
    enabled: !!user,
  });
}

export function useConnectStripe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/stripe-connect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result?.error?.message ?? 'Failed to connect Stripe');
      }

      return response.json() as Promise<{ url: string }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.operator.profile });
    },
  });
}

export function useVerifyStripeConnect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/stripe-connect-callback`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result?.error?.message ?? 'Failed to verify');
      }

      return response.json() as Promise<{ onboarding_complete: boolean }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.operator.profile });
    },
  });
}

export function useDisconnectStripe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/stripe-connect-callback`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'disconnect' }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result?.error?.message ?? 'Failed to disconnect');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.operator.profile });
    },
  });
}
