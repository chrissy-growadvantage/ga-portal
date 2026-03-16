import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getServiceClient } from '../_shared/supabase.ts';

// ga4-auth-callback — OAuth 2.0 callback called directly by Google.
// IMPORTANT: This function MUST be deployed with verify_jwt: false
// because the request comes from Google, not from an authenticated user.

// ── Types ──────────────────────────────────────────────────────────────────────

type OAuthState = {
  clientId: string;
  operatorId: string;
  returnUrl: string;
};

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  error?: string;
  error_description?: string;
};

type PropertySummary = {
  property: string;
  displayName: string;
};

type AccountSummary = {
  propertySummaries?: PropertySummary[];
};

type AccountSummariesResponse = {
  accountSummaries?: AccountSummary[];
};

type GA4Property = {
  id: string;
  name: string;
};

type Ga4ConnectionUpsert = {
  client_id: string;
  operator_id: string;
  property_id: string;
  property_name: string;
  refresh_token: string;
  updated_at: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function decodeState(raw: string): OAuthState | null {
  try {
    const parsed = JSON.parse(atob(raw)) as unknown;
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'clientId' in parsed &&
      'operatorId' in parsed &&
      'returnUrl' in parsed
    ) {
      return parsed as OAuthState;
    }
    return null;
  } catch {
    return null;
  }
}

function redirectWithError(baseUrl: string, code: string): Response {
  try {
    const url = new URL(baseUrl);
    url.searchParams.set('ga4_error', code);
    return Response.redirect(url.toString(), 302);
  } catch {
    // baseUrl may be relative or malformed — fall back to a root redirect
    return Response.redirect(`/?ga4_error=${encodeURIComponent(code)}`, 302);
  }
}

function redirectWithSuccess(baseUrl: string): Response {
  try {
    const url = new URL(baseUrl);
    url.searchParams.set('ga4_connected', 'true');
    return Response.redirect(url.toString(), 302);
  } catch {
    return Response.redirect('/?ga4_connected=true', 302);
  }
}

async function exchangeCode(
  code: string,
  redirectUri: string
): Promise<TokenResponse> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  const data = (await res.json()) as TokenResponse;
  if (!res.ok) {
    throw new Error(
      data.error_description ?? data.error ?? `Token exchange failed: ${res.status}`
    );
  }
  return data;
}

async function listGA4Properties(accessToken: string): Promise<GA4Property[]> {
  const res = await fetch(
    'https://analyticsadmin.googleapis.com/v1beta/accountSummaries',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    throw new Error(`Failed to list GA4 properties: ${res.status}`);
  }
  const data = (await res.json()) as AccountSummariesResponse;

  const properties: GA4Property[] = [];
  for (const account of data.accountSummaries ?? []) {
    for (const prop of account.propertySummaries ?? []) {
      properties.push({
        id: prop.property.replace('properties/', ''),
        name: prop.displayName,
      });
    }
  }
  return properties;
}

// ── Handler ────────────────────────────────────────────────────────────────────

serve(async (req) => {
  // Google always calls this as GET
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const stateParam = url.searchParams.get('state');
  const oauthError = url.searchParams.get('error');

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const appUrl = Deno.env.get('APP_URL') ?? '';
  const redirectUri = `${supabaseUrl}/functions/v1/ga4-auth-callback`;

  // Decode state early so we can redirect back on any error
  const state = stateParam ? decodeState(stateParam) : null;
  const fallbackUrl = state?.returnUrl ?? appUrl;

  // ── Google denied access ──────────────────────────────────────────────────
  if (oauthError) {
    return redirectWithError(fallbackUrl, oauthError);
  }

  // ── Missing required params ───────────────────────────────────────────────
  if (!code || !state) {
    return redirectWithError(fallbackUrl || `${appUrl}/`, 'missing_params');
  }

  try {
    // ── Exchange code for tokens ────────────────────────────────────────────
    const { access_token, refresh_token } = await exchangeCode(code, redirectUri);

    if (!refresh_token) {
      // Google only returns a refresh_token on the first consent or when
      // prompt=consent is set. If it's missing, re-auth is needed.
      return redirectWithError(fallbackUrl, 'no_refresh_token');
    }

    // ── Discover GA4 properties accessible to this account ─────────────────
    const properties = await listGA4Properties(access_token);

    if (properties.length === 0) {
      return redirectWithError(fallbackUrl, 'no_properties');
    }

    // ── Upsert all properties into client_ga4_connections ──────────────────
    const supabase = getServiceClient();

    const upserts: Ga4ConnectionUpsert[] = properties.map((property) => ({
      client_id: state.clientId,
      operator_id: state.operatorId,
      property_id: property.id,
      property_name: property.name,
      refresh_token,
      updated_at: new Date().toISOString(),
    }));

    const { error: dbError } = await supabase
      .from('client_ga4_connections')
      .upsert(upserts, { onConflict: 'client_id,property_id' });

    if (dbError) throw new Error(dbError.message);

    // ── Redirect back to analytics tab ─────────────────────────────────────
    return redirectWithSuccess(fallbackUrl);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown_error';
    return redirectWithError(fallbackUrl, encodeURIComponent(msg));
  }
});
