import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/query-keys';
import type { Period, GA4ApiResponse } from '@/components/ga4/types';
import { getPreviousPeriodDates } from '@/components/ga4/utils';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export type GA4Connection = {
  property_id: string;
  property_name: string | null;
};

export type GA4DashboardRaw = {
  overview: GA4ApiResponse;
  devices: GA4ApiResponse;
  pages: GA4ApiResponse;
  sources: GA4ApiResponse;
  geography: GA4ApiResponse;
  prevOverview: GA4ApiResponse;
  channelQuality: GA4ApiResponse;
  heatmap: GA4ApiResponse;
  videoEvents: GA4ApiResponse;
  newReturning: GA4ApiResponse;
  landingPages: GA4ApiResponse;
  stickiness: GA4ApiResponse;
};

export class GA4FetchError extends Error {
  readonly code: string;
  readonly needsReauth: boolean;

  constructor(code: string, needsReauth = false) {
    super(code);
    this.name = 'GA4FetchError';
    this.code = code;
    this.needsReauth = needsReauth;
  }
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not authenticated');
  return {
    Authorization: `Bearer ${token}`,
    apikey: supabaseAnonKey,
  };
}

async function fetchGA4Data(
  clientId: string,
  params: Record<string, string>,
): Promise<GA4ApiResponse> {
  const headers = await getAuthHeaders();
  const qs = new URLSearchParams({ client_id: clientId, ...params });
  const res = await fetch(`${supabaseUrl}/functions/v1/ga4-data?${qs.toString()}`, { headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as {
      error?: { code?: string; needsReauth?: boolean };
    };
    const code = body.error?.code ?? 'UNKNOWN_ERROR';
    throw new GA4FetchError(code, body.error?.needsReauth ?? false);
  }

  return res.json() as Promise<GA4ApiResponse>;
}

// ── Hooks ──────────────────────────────────────────────────────────────────────

export function useGA4Connections(clientId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.ga4.connections(clientId ?? ''),
    queryFn: async (): Promise<GA4Connection[]> => {
      const { data, error } = await supabase
        .from('client_ga4_connections')
        .select('property_id, property_name')
        .eq('client_id', clientId!);
      if (error) throw new Error(error.message);
      return (data ?? []) as GA4Connection[];
    },
    enabled: !!clientId,
  });
}

export function useGA4Auth() {
  return useMutation({
    mutationFn: async ({
      clientId,
      returnUrl,
    }: {
      clientId: string;
      returnUrl: string;
    }): Promise<{ authUrl: string }> => {
      const headers = await getAuthHeaders();
      const qs = new URLSearchParams({ clientId, returnUrl });
      const res = await fetch(
        `${supabaseUrl}/functions/v1/ga4-auth?${qs.toString()}`,
        { headers },
      );
      if (!res.ok) throw new Error('Failed to get Google Auth URL');
      return res.json() as Promise<{ authUrl: string }>;
    },
  });
}

export function useGA4DashboardData(
  clientId: string | undefined,
  period: Period,
  propertyId: string | null,
  enabled: boolean,
) {
  return useQuery({
    queryKey: queryKeys.ga4.dashboard(clientId ?? '', period, propertyId),
    queryFn: async (): Promise<GA4DashboardRaw> => {
      const extra: Record<string, string> = propertyId ? { property: propertyId } : {};
      const { startDate, endDate } = getPreviousPeriodDates(period);

      const [
        overview,
        devices,
        pages,
        sources,
        geography,
        prevOverview,
        channelQuality,
        heatmap,
        videoEvents,
        newReturning,
        landingPages,
        stickiness,
      ] = await Promise.all([
        fetchGA4Data(clientId!, { period, ...extra }),
        fetchGA4Data(clientId!, { type: 'devices', period, ...extra }),
        fetchGA4Data(clientId!, { type: 'top_pages', period, ...extra }),
        fetchGA4Data(clientId!, { type: 'sources', period, ...extra }),
        fetchGA4Data(clientId!, { type: 'geography', period, ...extra }),
        fetchGA4Data(clientId!, { startDate, endDate, ...extra }),
        fetchGA4Data(clientId!, { type: 'channel_quality', period, ...extra }),
        fetchGA4Data(clientId!, { type: 'heatmap', period, ...extra }),
        fetchGA4Data(clientId!, { type: 'video_events', period, ...extra }),
        fetchGA4Data(clientId!, { type: 'new_returning', period, ...extra }),
        fetchGA4Data(clientId!, { type: 'landing_pages', period, ...extra }),
        fetchGA4Data(clientId!, { type: 'stickiness', period, ...extra }),
      ]);

      return {
        overview,
        devices,
        pages,
        sources,
        geography,
        prevOverview,
        channelQuality,
        heatmap,
        videoEvents,
        newReturning,
        landingPages,
        stickiness,
      };
    },
    enabled: !!clientId && enabled,
    staleTime: 5 * 60 * 1000,
    retry: (_count, error) => !(error instanceof GA4FetchError),
  });
}
