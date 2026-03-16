import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/query-keys';
import { useAuth } from '@/hooks/useAuth';

const DEFAULT_GOAL_CENTS = 2_000_000;

export function useRevenueGoal() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.operator.revenueGoal,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('operators')
        .select('revenue_goal_cents')
        .eq('id', user!.id)
        .single();

      if (error) throw error;
      return (data?.revenue_goal_cents as number | null) ?? DEFAULT_GOAL_CENTS;
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}

export function useUpdateRevenueGoal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (goalCents: number) => {
      const { error } = await supabase
        .from('operators')
        .update({ revenue_goal_cents: goalCents })
        .eq('id', user!.id);

      if (error) throw error;
      return goalCents;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.operator.revenueGoal });
    },
  });
}
