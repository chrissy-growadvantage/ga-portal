import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/query-keys';
import { DEFAULT_ONBOARDING_STAGES } from '@/lib/constants';
import type { OnboardingStage, InsertOnboardingStage } from '@/types/database';

export function useOnboardingStages(clientId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.onboarding.list(clientId ?? ''),
    queryFn: async (): Promise<OnboardingStage[]> => {
      const { data, error } = await supabase
        .from('onboarding_stages')
        .select('*')
        .eq('client_id', clientId!)
        .order('sort_order', { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as OnboardingStage[];
    },
    enabled: !!clientId,
  });
}

export function useCreateOnboardingStages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (stages: InsertOnboardingStage[]): Promise<OnboardingStage[]> => {
      const { data, error } = await supabase
        .from('onboarding_stages')
        .insert(stages)
        .select();
      if (error) throw new Error(error.message);
      return (data ?? []) as OnboardingStage[];
    },
    onSuccess: (created) => {
      const clientId = created[0]?.client_id;
      if (clientId) {
        qc.invalidateQueries({ queryKey: queryKeys.onboarding.list(clientId) });
      }
    },
  });
}

type BlockedOnboardingEntry = {
  clientId: string;
  clientName: string;
  stage: string;
  status: 'blocked' | 'waiting_on_client';
};

/** Fetch all blocked/waiting-on-client onboarding stages across all clients for the operator. */
export function useBlockedOnboardingStages() {
  const { data: clients } = useQuery({
    queryKey: ['clients-minimal'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, company_name, contact_name')
        .order('company_name', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });

  return useQuery({
    queryKey: ['onboarding-blocked'],
    queryFn: async (): Promise<BlockedOnboardingEntry[]> => {
      const { data, error } = await supabase
        .from('onboarding_stages')
        .select('client_id, stage_label, status')
        .in('status', ['blocked', 'waiting_on_client'])
        .order('client_id');
      if (error) throw error;
      if (!data?.length) return [];

      const clientMap = new Map((clients ?? []).map((c) => [
        c.id,
        c.company_name || c.contact_name || 'Unknown',
      ]));

      return data.map((row) => ({
        clientId: row.client_id,
        clientName: clientMap.get(row.client_id) ?? 'Unknown',
        stage: row.stage_label,
        status: row.status as 'blocked' | 'waiting_on_client',
      }));
    },
    enabled: !!clients,
    staleTime: 30_000,
  });
}

export function useUpdateOnboardingStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      clientId,
      ...updates
    }: Partial<OnboardingStage> & { id: string; clientId: string }): Promise<OnboardingStage> => {
      const { data, error } = await supabase
        .from('onboarding_stages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as OnboardingStage;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.onboarding.list(variables.clientId) });
    },
  });
}

export function useInitOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (clientId: string): Promise<OnboardingStage[]> => {
      const session = await supabase.auth.getSession();
      const operatorId = session.data.session?.user.id;
      if (!operatorId) throw new Error('Not authenticated');

      const stages: InsertOnboardingStage[] = DEFAULT_ONBOARDING_STAGES.map((s, i) => ({
        client_id: clientId,
        operator_id: operatorId,
        stage_key: s.stage_key,
        stage_label: s.stage_label,
        sort_order: i,
        owner_label: s.owner_label,
        status: 'not_started' as const,
      }));

      const { data, error } = await supabase
        .from('onboarding_stages')
        .insert(stages)
        .select();
      if (error) throw new Error(error.message);
      return (data ?? []) as OnboardingStage[];
    },
    onSuccess: (created) => {
      const clientId = created[0]?.client_id;
      if (clientId) {
        qc.invalidateQueries({ queryKey: queryKeys.onboarding.list(clientId) });
      }
    },
  });
}
