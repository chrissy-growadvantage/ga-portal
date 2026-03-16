import { useMemo } from 'react';
import { useClients } from '@/hooks/useClients';
import { calculateScopeCompact } from '@/lib/scope-utils';

type ScopeAlert = {
  clientId: string;
  clientName: string;
  percentage: number;
  totalUsed: number;
  totalAllocated: number;
  unitLabel: string;
  alertLevel: 'warning' | 'critical';
};

export function useScopeAlerts() {
  const { data: clients, isLoading } = useClients();

  const alerts = useMemo(() => {
    if (!clients) return [] as ScopeAlert[];

    return clients
      .filter((c) => c.status === 'active' && c.scope_allocations.length > 0)
      .flatMap((c) =>
        c.scope_allocations.map((allocation) => {
          const calc = calculateScopeCompact(allocation, c.delivery_items ?? []);
          return {
            clientId: c.id,
            clientName: c.company_name || c.contact_name || 'Unknown',
            percentage: calc.percentage,
            totalUsed: calc.totalUsed,
            totalAllocated: calc.totalAllocated,
            unitLabel: calc.unitLabel,
            alertLevel: (calc.percentage >= 90 ? 'critical' : 'warning') as 'warning' | 'critical',
          };
        })
      )
      .filter((alert) => alert.percentage >= 80)
      .sort((a, b) => b.percentage - a.percentage);
  }, [clients]);

  return { alerts, isLoading };
}
