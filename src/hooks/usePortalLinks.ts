import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/query-keys';
import type { PortalLink } from '@/types/database';

// ── Fetch all active portal links for a client ────────────────────────────

export function usePortalLinks(clientId: string) {
  return useQuery({
    queryKey: queryKeys.portalLinks.list(clientId),
    queryFn: async (): Promise<PortalLink[]> => {
      const { data, error } = await supabase
        .from('portal_links')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!clientId,
  });
}

// ── Revoke a portal link (set is_active = false) ─────────────────────────

export function useRevokePortalLink(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase
        .from('portal_links')
        .update({ is_active: false })
        .eq('id', linkId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.portalLinks.list(clientId) });
    },
  });
}

// ── Update a portal link's label ─────────────────────────────────────────

export function useUpdatePortalLinkLabel(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ linkId, label }: { linkId: string; label: string | null }) => {
      const { error } = await supabase
        .from('portal_links')
        .update({ label })
        .eq('id', linkId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.portalLinks.list(clientId) });
    },
  });
}
