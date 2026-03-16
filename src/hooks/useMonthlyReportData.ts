import { useMemo } from 'react';
import { useClient } from '@/hooks/useClients';
import { useMonthlySnapshot } from '@/hooks/useMonthlySnapshots';
import { useDeliveries } from '@/hooks/useDeliveries';
import { useScope } from '@/hooks/useScope';
import { calculateScope } from '@/lib/scope-utils';
import type { MonthlySnapshot, DeliveryItem, ClientWithScope } from '@/types/database';
import type { ScopeCalculation } from '@/lib/scope-utils';

type ReportData = {
  client: ClientWithScope;
  snapshot: MonthlySnapshot;
  deliveries: DeliveryItem[];
  scopeCalc: ScopeCalculation | null;
};

export function useMonthlyReportData(clientId: string | undefined, monthSlug: string | undefined) {
  const { data: client } = useClient(clientId);
  const { data: snapshot } = useMonthlySnapshot(clientId, monthSlug);
  const { data: deliveries } = useDeliveries(clientId);
  const { data: scopes } = useScope(clientId);

  const data = useMemo((): ReportData | null => {
    if (!client || !snapshot || !deliveries) return null;

    // Filter deliveries to the snapshot's month
    const monthPrefix = snapshot.month_slug; // e.g., "2025-03"
    const monthDeliveries = deliveries.filter((d) => {
      const dateStr = d.completed_at ?? d.created_at;
      return dateStr.startsWith(monthPrefix);
    });

    // Get scope calculation for the most relevant allocation
    const relevantScope = scopes?.find((s) => {
      const start = s.period_start;
      const end = s.period_end;
      return monthPrefix >= start.slice(0, 7) && monthPrefix <= end.slice(0, 7);
    });

    const scopeCalc = relevantScope
      ? calculateScope(relevantScope, monthDeliveries)
      : null;

    return { client, snapshot, deliveries: monthDeliveries, scopeCalc };
  }, [client, snapshot, deliveries, scopes]);

  const isLoading = !client || !snapshot || !deliveries;

  return { data, isLoading };
}
