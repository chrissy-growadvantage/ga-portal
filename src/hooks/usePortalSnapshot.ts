import { useQuery } from '@tanstack/react-query';
import type { MonthlySnapshot } from '@/types/database';

async function fetchPortalSnapshot(token: string, monthSlug: string): Promise<MonthlySnapshot> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const response = await fetch(
    `${supabaseUrl}/functions/v1/client-portal?token=${encodeURIComponent(token)}&snapshot=${encodeURIComponent(monthSlug)}`,
    {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const result = await response.json();

  if (!response.ok) {
    const errorCode = result?.error?.code ?? 'NOT_FOUND';
    throw new Error(errorCode);
  }

  return result.snapshot as MonthlySnapshot;
}

export function usePortalSnapshot(token: string | undefined, monthSlug: string | undefined) {
  return useQuery({
    queryKey: ['portal-snapshot', token, monthSlug],
    queryFn: () => fetchPortalSnapshot(token!, monthSlug!),
    enabled: !!token && !!monthSlug,
    staleTime: 120_000,
    retry: false,
  });
}
