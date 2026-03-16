import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/query-keys';
import { useAuth } from '@/hooks/useAuth';
import { grantEvidenceRowSchema } from '@/lib/schemas';
import type {
  GrantEvidencePilotClient,
  GrantEvidenceChecklist,
  GrantEvidenceKPIs,
} from '@/types/database';

const defaultPilotClient = (): GrantEvidencePilotClient => ({
  name: '',
  startDate: '',
  currentStage: '',
  notes: '',
  endorsementStatus: 'not_requested',
  endorsementLink: '',
});

export const defaultGrantEvidence = {
  clientA: defaultPilotClient(),
  clientB: defaultPilotClient(),
  checklist: { screenshotsSaved: false, loomRecorded: false, usageNotesWritten: false } satisfies GrantEvidenceChecklist,
  kpis: { requestsSubmitted: '', requestsResolved: '', overdueActionsCount: '', estimatedTimeSavedHours: '' } satisfies GrantEvidenceKPIs,
};

type GrantEvidenceFormData = typeof defaultGrantEvidence;

/** Map DB row → form shape */
function rowToForm(row: GrantEvidence): GrantEvidenceFormData {
  return {
    clientA: row.client_a,
    clientB: row.client_b,
    checklist: row.checklist,
    kpis: row.kpis,
  };
}

export function useGrantEvidence() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.grantEvidence.all,
    queryFn: async (): Promise<GrantEvidenceFormData> => {
      const { data, error } = await supabase
        .from('grant_evidence')
        .select('*')
        .eq('operator_id', user!.id)
        .single();

      if (error) {
        // PGRST116 = no rows found — return defaults
        if (error.code === 'PGRST116') return { ...defaultGrantEvidence };
        throw error;
      }

      return rowToForm(grantEvidenceRowSchema.parse(data));
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}

export function useSaveGrantEvidence() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (form: GrantEvidenceFormData) => {
      const { error } = await supabase
        .from('grant_evidence')
        .upsert(
          {
            operator_id: user!.id,
            client_a: form.clientA,
            client_b: form.clientB,
            checklist: form.checklist,
            kpis: form.kpis,
          },
          { onConflict: 'operator_id' },
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.grantEvidence.all });
    },
  });
}
