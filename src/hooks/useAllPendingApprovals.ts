import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { DeliveryItem } from '@/types/database';

type ClientInfo = {
  id: string;
  company_name: string;
  contact_name: string | null;
};

export type PendingApprovalItem = DeliveryItem & {
  clients: ClientInfo | null;
};

export function useAllPendingApprovals() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['deliveries', 'pending-approvals'] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_items')
        .select('*, clients(id, company_name, contact_name)')
        .eq('status', 'pending_approval')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as PendingApprovalItem[];
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}
