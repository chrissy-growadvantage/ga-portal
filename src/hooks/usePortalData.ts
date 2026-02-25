import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import type { PortalData } from '@/types/portal';

async function fetchPortalData(token: string): Promise<PortalData> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const response = await fetch(
    `${supabaseUrl}/functions/v1/client-portal?token=${encodeURIComponent(token)}`,
    {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Content-Type': 'application/json',
      },
    }
  );

  const result = await response.json();

  if (!response.ok) {
    const errorCode = result?.error?.code ?? 'INVALID_TOKEN';
    throw new Error(errorCode);
  }

  return result as PortalData;
}

export function usePortalData(token: string | undefined) {
  return useQuery({
    queryKey: queryKeys.portal.data(token!),
    queryFn: () => fetchPortalData(token!),
    enabled: !!token,
    staleTime: 60_000,
    retry: false,
  });
}
