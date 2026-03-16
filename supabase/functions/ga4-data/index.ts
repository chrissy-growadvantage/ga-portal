import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsResponse, jsonResponse } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase.ts';

// ============================================================
// Types
// ============================================================

type QueryType =
  | 'overview'
  | 'devices'
  | 'top_pages'
  | 'sources'
  | 'geography'
  | 'channel_quality'
  | 'heatmap'
  | 'video_events'
  | 'new_returning'
  | 'landing_pages'
  | 'stickiness';

interface GA4ReportConfig {
  dimensions: Array<{ name: string }>;
  metrics: Array<{ name: string }>;
  orderBys?: Array<{ metric?: { metricName: string }; desc?: boolean }>;
  limit?: number;
}

interface GA4Row {
  dimensionValues: Array<{ value: string }>;
  metricValues: Array<{ value: string }>;
}

interface GA4ReportResponse {
  rows?: GA4Row[];
}

interface DailyPoint {
  date: string;
  activeUsers: number;
  sessions: number;
}

interface PropertyBreakdown {
  property_id: string;
  property_name: string;
  activeUsers: number;
  newUsers: number;
  sessions: number;
  engagementRate: number;
  bounceRate: number;
  dailyData: DailyPoint[];
}

interface FormattedReport {
  result: (string | number)[][];
}

interface GA4DataResponse extends FormattedReport {
  propertyBreakdown?: PropertyBreakdown[];
}

interface Ga4Connection {
  property_id: string;
  property_name: string | null;
  refresh_token: string | null;
}

// ============================================================
// Period helpers
// ============================================================

function getPeriodDates(period: string): { startDate: string; endDate: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (period === 'last7days') {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return { startDate: fmt(start), endDate: fmt(now) };
  }
  if (period === 'last30days') {
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    return { startDate: fmt(start), endDate: fmt(now) };
  }
  // thismonth (default)
  return {
    startDate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`,
    endDate: fmt(now),
  };
}

// ============================================================
// Token refresh (with invalid_grant cleanup)
// ============================================================

async function getAccessToken(
  refreshToken: string,
  clientId: string
): Promise<string> {
  const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

  if (!googleClientId || !googleClientSecret) {
    throw new Error('Missing Google OAuth credentials in environment variables');
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: googleClientId,
      client_secret: googleClientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    let errorDetails: { error?: string } | string;
    try {
      errorDetails = JSON.parse(errorBody) as { error?: string };
    } catch {
      errorDetails = errorBody;
    }

    if (res.status === 400) {
      const errorMsg =
        typeof errorDetails === 'object' ? errorDetails.error : errorDetails;
      if (typeof errorMsg === 'string' && errorMsg.includes('invalid_grant')) {
        // Delete the stale connection record so the UI shows "not connected"
        const supabase = getServiceClient();
        const { error: delErr } = await supabase
          .from('client_ga4_connections')
          .delete()
          .eq('client_id', clientId)
          .eq('refresh_token', refreshToken);
        if (delErr) {
          console.error('Failed to delete invalid GA4 connection:', delErr);
        }
        throw new Error(
          'AUTH_REQUIRED: Token has been revoked. Please reconnect your Google Analytics account.'
        );
      }
      throw new Error(
        `Token refresh failed: ${errorMsg ?? 'Invalid request'}. Check Google OAuth credentials.`
      );
    }
    throw new Error(
      `Token refresh failed: ${res.status} — ${JSON.stringify(errorDetails)}`
    );
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
  };

  // If Google rotated the refresh token, persist the new one
  if (data.refresh_token && data.refresh_token !== refreshToken) {
    const supabase = getServiceClient();
    const { error: updErr } = await supabase
      .from('client_ga4_connections')
      .update({ refresh_token: data.refresh_token, updated_at: new Date().toISOString() })
      .eq('client_id', clientId)
      .eq('refresh_token', refreshToken);
    if (updErr) {
      console.error('Failed to rotate GA4 refresh token:', updErr);
    }
  }

  return data.access_token;
}

// ============================================================
// GA4 report runner
// ============================================================

async function runGA4Report(
  propertyId: string,
  accessToken: string,
  startDate: string,
  endDate: string,
  config: GA4ReportConfig
): Promise<GA4ReportResponse> {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        ...config,
      }),
    }
  );
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`GA4 report failed: ${res.status} ${errText}`);
  }
  return res.json() as Promise<GA4ReportResponse>;
}

// ============================================================
// Formatters — each returns (string|number)[][]
// ============================================================

function formatOverview(report: GA4ReportResponse, propertyName: string): FormattedReport {
  const headers: (string | number)[] = [
    'date', 'propertyName', 'activeUsers', 'newUsers', 'sessions',
    'engagementRate', 'bounceRate', 'avgSessionDuration',
  ];
  const rows = (report.rows ?? []).map((row): (string | number)[] => [
    row.dimensionValues[0].value,
    propertyName,
    Number(row.metricValues[0].value),
    Number(row.metricValues[1].value),
    Number(row.metricValues[2].value),
    Number(row.metricValues[3].value) * 100,
    Number(row.metricValues[4].value) * 100,
    Number(row.metricValues[5].value),
  ]);
  return { result: [headers, ...rows] };
}

function formatDevices(report: GA4ReportResponse, propertyName: string): FormattedReport {
  const headers: (string | number)[] = ['date', 'deviceCategory', 'propertyName', 'activeUsers', 'sessions'];
  const rows = (report.rows ?? []).map((row): (string | number)[] => [
    row.dimensionValues[0].value,
    row.dimensionValues[1].value,
    propertyName,
    Number(row.metricValues[0].value),
    Number(row.metricValues[1].value),
  ]);
  return { result: [headers, ...rows] };
}

function formatTopPages(report: GA4ReportResponse): FormattedReport {
  const headers: (string | number)[] = [
    'date', 'pagePath', 'pageTitle', 'activeUsers',
    'screenPageViews', 'avgEngagementTime', 'bounceRate',
  ];
  const rows = (report.rows ?? []).map((row): (string | number)[] => [
    row.dimensionValues[0].value,
    row.dimensionValues[1].value,
    row.dimensionValues[2].value,
    Number(row.metricValues[0].value),
    Number(row.metricValues[1].value),
    Number(row.metricValues[2].value),
    Number(row.metricValues[3].value) * 100,
  ]);
  return { result: [headers, ...rows] };
}

function formatSources(report: GA4ReportResponse): FormattedReport {
  const headers: (string | number)[] = ['sessionMedium', 'date', 'activeUsers'];
  const rows = (report.rows ?? []).map((row): (string | number)[] => [
    row.dimensionValues[0].value,
    row.dimensionValues[1].value,
    Number(row.metricValues[0].value),
  ]);
  return { result: [headers, ...rows] };
}

function formatGeography(report: GA4ReportResponse): FormattedReport {
  const headers: (string | number)[] = ['country', 'date', 'sessions', 'activeUsers'];
  const rows = (report.rows ?? []).map((row): (string | number)[] => [
    row.dimensionValues[0].value,
    row.dimensionValues[1].value,
    Number(row.metricValues[0].value),
    Number(row.metricValues[1].value),
  ]);
  return { result: [headers, ...rows] };
}

function formatChannelQuality(report: GA4ReportResponse): FormattedReport {
  const headers: (string | number)[] = [
    'channel', 'activeUsers', 'sessions',
    'engagementRate', 'avgSessionDuration', 'pagesPerSession',
  ];
  const rows = (report.rows ?? []).map((row): (string | number)[] => [
    row.dimensionValues[0].value,
    Number(row.metricValues[0].value),
    Number(row.metricValues[1].value),
    Number(row.metricValues[2].value) * 100,
    Number(row.metricValues[3].value),
    Number(row.metricValues[4].value),
  ]);
  return { result: [headers, ...rows] };
}

function formatHeatmap(report: GA4ReportResponse): FormattedReport {
  const headers: (string | number)[] = ['dayOfWeek', 'hour', 'activeUsers', 'sessions'];
  const rows = (report.rows ?? []).map((row): (string | number)[] => [
    Number(row.dimensionValues[0].value),
    Number(row.dimensionValues[1].value),
    Number(row.metricValues[0].value),
    Number(row.metricValues[1].value),
  ]);
  return { result: [headers, ...rows] };
}

function formatVideoEvents(report: GA4ReportResponse): FormattedReport {
  const headers: (string | number)[] = ['eventName', 'eventCount', 'totalUsers'];
  const rows = (report.rows ?? [])
    .filter(row =>
      ['video_start', 'video_progress', 'video_complete'].includes(
        row.dimensionValues[0].value
      )
    )
    .map((row): (string | number)[] => [
      row.dimensionValues[0].value,
      Number(row.metricValues[0].value),
      Number(row.metricValues[1].value),
    ]);
  return { result: [headers, ...rows] };
}

function formatNewReturning(report: GA4ReportResponse): FormattedReport {
  const headers: (string | number)[] = [
    'segment', 'activeUsers', 'sessions',
    'engagementRate', 'avgSessionDuration', 'pagesPerSession',
  ];
  const rows = (report.rows ?? []).map((row): (string | number)[] => [
    row.dimensionValues[0].value,
    Number(row.metricValues[0].value),
    Number(row.metricValues[1].value),
    Number(row.metricValues[2].value) * 100,
    Number(row.metricValues[3].value),
    Number(row.metricValues[4].value),
  ]);
  return { result: [headers, ...rows] };
}

function formatLandingPages(report: GA4ReportResponse): FormattedReport {
  const headers: (string | number)[] = [
    'landingPage', 'sessions', 'activeUsers',
    'engagementRate', 'pagesPerSession', 'avgSessionDuration',
  ];
  const rows = (report.rows ?? [])
    .filter(row => {
      const page = row.dimensionValues[0].value;
      return page && page !== '(not set)';
    })
    .map((row): (string | number)[] => [
      row.dimensionValues[0].value,
      Number(row.metricValues[0].value),
      Number(row.metricValues[1].value),
      Number(row.metricValues[2].value) * 100,
      Number(row.metricValues[3].value),
      Number(row.metricValues[4].value),
    ]);
  return { result: [headers, ...rows] };
}

function formatStickiness(report: GA4ReportResponse): FormattedReport {
  const headers: (string | number)[] = [
    'dauPerMau', 'wauPerMau', 'dauPerWau',
    'active7DayUsers', 'active28DayUsers', 'activeUsers',
  ];
  if (!report.rows || report.rows.length === 0) {
    return { result: [headers, [0, 0, 0, 0, 0, 0]] };
  }
  const row = report.rows[0];
  const values: (string | number)[] = [
    Number(row.metricValues[0].value) * 100,
    Number(row.metricValues[1].value) * 100,
    Number(row.metricValues[2].value) * 100,
    Number(row.metricValues[3].value),
    Number(row.metricValues[4].value),
    Number(row.metricValues[5].value),
  ];
  return { result: [headers, values] };
}

// ============================================================
// Query configs
// ============================================================

const QUERY_CONFIGS: Record<QueryType, GA4ReportConfig> = {
  overview: {
    dimensions: [{ name: 'date' }],
    metrics: [
      { name: 'activeUsers' },
      { name: 'newUsers' },
      { name: 'sessions' },
      { name: 'engagementRate' },
      { name: 'bounceRate' },
      { name: 'averageSessionDuration' },
    ],
  },
  devices: {
    dimensions: [{ name: 'date' }, { name: 'deviceCategory' }],
    metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
  },
  top_pages: {
    dimensions: [{ name: 'date' }, { name: 'pagePath' }, { name: 'pageTitle' }],
    metrics: [
      { name: 'activeUsers' },
      { name: 'screenPageViews' },
      { name: 'averageSessionDuration' },
      { name: 'bounceRate' },
    ],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 500,
  },
  sources: {
    dimensions: [{ name: 'sessionMedium' }, { name: 'date' }],
    metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
  },
  geography: {
    dimensions: [{ name: 'country' }, { name: 'date' }],
    metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    limit: 200,
  },
  channel_quality: {
    dimensions: [{ name: 'sessionDefaultChannelGroup' }],
    metrics: [
      { name: 'activeUsers' },
      { name: 'sessions' },
      { name: 'engagementRate' },
      { name: 'averageSessionDuration' },
      { name: 'screenPageViewsPerSession' },
    ],
    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
  },
  heatmap: {
    dimensions: [{ name: 'dayOfWeek' }, { name: 'hour' }],
    metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
  },
  video_events: {
    dimensions: [{ name: 'eventName' }],
    metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
  },
  new_returning: {
    dimensions: [{ name: 'newVsReturning' }],
    metrics: [
      { name: 'activeUsers' },
      { name: 'sessions' },
      { name: 'engagementRate' },
      { name: 'averageSessionDuration' },
      { name: 'screenPageViewsPerSession' },
    ],
  },
  landing_pages: {
    dimensions: [{ name: 'landingPage' }],
    metrics: [
      { name: 'sessions' },
      { name: 'activeUsers' },
      { name: 'engagementRate' },
      { name: 'screenPageViewsPerSession' },
      { name: 'averageSessionDuration' },
    ],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 50,
  },
  stickiness: {
    dimensions: [],
    metrics: [
      { name: 'dauPerMau' },
      { name: 'wauPerMau' },
      { name: 'dauPerWau' },
      { name: 'active7DayUsers' },
      { name: 'active28DayUsers' },
      { name: 'activeUsers' },
    ],
  },
};

const VALID_QUERY_TYPES = new Set<string>(Object.keys(QUERY_CONFIGS));

// ============================================================
// Formatter dispatch
// ============================================================

function formatReport(
  type: QueryType,
  report: GA4ReportResponse,
  propertyName: string
): FormattedReport {
  switch (type) {
    case 'overview':        return formatOverview(report, propertyName);
    case 'devices':         return formatDevices(report, propertyName);
    case 'top_pages':       return formatTopPages(report);
    case 'sources':         return formatSources(report);
    case 'geography':       return formatGeography(report);
    case 'channel_quality': return formatChannelQuality(report);
    case 'heatmap':         return formatHeatmap(report);
    case 'video_events':    return formatVideoEvents(report);
    case 'new_returning':   return formatNewReturning(report);
    case 'landing_pages':   return formatLandingPages(report);
    case 'stickiness':      return formatStickiness(report);
  }
}

// ============================================================
// Handler
// ============================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse();

  // Require a valid Supabase JWT (operator must be authenticated)
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse({ error: { code: 'UNAUTHORIZED', message: 'Missing authorization header' } }, 401);
  }

  const url = new URL(req.url);
  const clientId = url.searchParams.get('client_id');
  const period = url.searchParams.get('period') ?? 'thismonth';
  const typeParam = url.searchParams.get('type') ?? 'overview';
  const startDateParam = url.searchParams.get('startDate') ?? undefined;
  const endDateParam = url.searchParams.get('endDate') ?? undefined;
  const propertyFilter = url.searchParams.get('property') ?? undefined;

  if (!clientId) {
    return jsonResponse({ error: { code: 'BAD_REQUEST', message: 'client_id is required' } }, 400);
  }

  if (!VALID_QUERY_TYPES.has(typeParam)) {
    return jsonResponse({
      error: {
        code: 'BAD_REQUEST',
        message: `Unknown type: ${typeParam}. Valid: ${[...VALID_QUERY_TYPES].join(', ')}`,
      },
    }, 400);
  }

  const type = typeParam as QueryType;

  try {
    // Use a scoped client (anon key + operator JWT) so RLS ensures the operator
    // can only access their own clients' connections.
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const scopedClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    let query = scopedClient
      .from('client_ga4_connections')
      .select('property_id, property_name, refresh_token')
      .eq('client_id', clientId);

    if (propertyFilter) {
      query = query.eq('property_id', propertyFilter);
    }

    const { data: connections, error: dbError } = await query;

    if (dbError) {
      console.error('DB error fetching GA4 connections:', dbError);
      return jsonResponse({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch connections' } }, 500);
    }

    if (!connections || connections.length === 0) {
      return jsonResponse({ error: { code: 'NOT_CONNECTED', message: 'No GA4 connection found for this client' } }, 404);
    }

    const typedConnections = connections as Ga4Connection[];

    const { startDate, endDate } =
      startDateParam && endDateParam
        ? { startDate: startDateParam, endDate: endDateParam }
        : getPeriodDates(period);

    // All properties in the same OAuth session share the first connection's token
    const firstToken = typedConnections[0].refresh_token;
    if (!firstToken) {
      return jsonResponse({ error: { code: 'NOT_CONNECTED', message: 'No refresh token stored for this client' } }, 404);
    }

    const accessToken = await getAccessToken(firstToken, clientId);
    const config = QUERY_CONFIGS[type];

    const reports = await Promise.all(
      typedConnections.map(conn =>
        runGA4Report(conn.property_id, accessToken, startDate, endDate, config)
      )
    );

    // Merge rows across all properties
    const allRows: (string | number)[][] = [];
    let headers: (string | number)[] = [];

    reports.forEach((report, i) => {
      const conn = typedConnections[i];
      const propertyName = conn.property_name ?? conn.property_id;
      const formatted = formatReport(type, report, propertyName);
      const [hdr, ...rows] = formatted.result;
      headers = hdr;
      allRows.push(...rows);
    });

    const response: GA4DataResponse = { result: [headers, ...allRows] };

    // Append per-property breakdown for the overview query (all properties)
    if (!propertyFilter && type === 'overview') {
      const breakdown: PropertyBreakdown[] = typedConnections.map((conn, i) => {
        const report = reports[i];
        const totals = (report.rows ?? []).reduce(
          (acc, row) => {
            const sessions = Number(row.metricValues[2].value);
            const engagementRate = Number(row.metricValues[3].value);
            const bounceRate = Number(row.metricValues[4].value);
            return {
              activeUsers: acc.activeUsers + Number(row.metricValues[0].value),
              newUsers: acc.newUsers + Number(row.metricValues[1].value),
              sessions: acc.sessions + sessions,
              engagedSessions: acc.engagedSessions + sessions * engagementRate,
              bouncedSessions: acc.bouncedSessions + sessions * bounceRate,
            };
          },
          { activeUsers: 0, newUsers: 0, sessions: 0, engagedSessions: 0, bouncedSessions: 0 }
        );

        const dailyData: DailyPoint[] = (report.rows ?? [])
          .map(row => ({
            date: row.dimensionValues[0].value,
            activeUsers: Number(row.metricValues[0].value),
            sessions: Number(row.metricValues[2].value),
          }))
          .sort((a, b) => a.date.localeCompare(b.date));

        return {
          property_id: conn.property_id,
          property_name: conn.property_name ?? conn.property_id,
          activeUsers: totals.activeUsers,
          newUsers: totals.newUsers,
          sessions: totals.sessions,
          engagementRate:
            totals.sessions > 0
              ? (totals.engagedSessions / totals.sessions) * 100
              : 0,
          bounceRate:
            totals.sessions > 0
              ? (totals.bouncedSessions / totals.sessions) * 100
              : 0,
          dailyData,
        };
      });

      response.propertyBreakdown = breakdown;
    }

    return jsonResponse(response, 200, { 'Cache-Control': 'public, max-age=300' });
  } catch (err) {
    console.error('ga4-data error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';

    if (message.includes('AUTH_REQUIRED')) {
      return jsonResponse({
        error: {
          code: 'AUTH_REQUIRED',
          message: message.replace('AUTH_REQUIRED: ', ''),
          needsReauth: true,
        },
      }, 401);
    }

    return jsonResponse({ error: { code: 'SERVER_ERROR', message } }, 500);
  }
});
