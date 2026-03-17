import { getServiceClient } from './supabase.ts';

export async function hashToken(rawToken: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(rawToken);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface ValidatedClient {
  id: string;
  company_name: string;
  contact_name: string | null;
  status: string;
  operator_id: string;
}

export async function validateToken(rawToken: string): Promise<
  | { ok: true; client: ValidatedClient }
  | { ok: false; code: 'INVALID_TOKEN' | 'EXPIRED_TOKEN'; status: number }
> {
  const tokenHash = await hashToken(rawToken);
  const supabase = getServiceClient();

  // ── Primary: check portal_links table (multi-token system) ────────────────
  const { data: link } = await supabase
    .from('portal_links')
    .select('client_id, expires_at, is_active')
    .eq('token_hash', tokenHash)
    .eq('is_active', true)
    .maybeSingle();

  if (link) {
    if (new Date(link.expires_at) < new Date()) {
      return { ok: false, code: 'EXPIRED_TOKEN', status: 410 };
    }

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, company_name, contact_name, status, operator_id')
      .eq('id', link.client_id)
      .single();

    if (clientError || !client) {
      return { ok: false, code: 'INVALID_TOKEN', status: 404 };
    }

    return {
      ok: true,
      client: {
        id: client.id,
        company_name: client.company_name,
        contact_name: client.contact_name,
        status: client.status,
        operator_id: client.operator_id,
      },
    };
  }

  // ── Fallback: legacy magic_link_token_hash on clients table ───────────────
  const { data: legacyClient, error } = await supabase
    .from('clients')
    .select('id, company_name, contact_name, status, operator_id, magic_link_expires_at')
    .eq('magic_link_token_hash', tokenHash)
    .single();

  if (error || !legacyClient) {
    return { ok: false, code: 'INVALID_TOKEN', status: 404 };
  }

  if (legacyClient.magic_link_expires_at && new Date(legacyClient.magic_link_expires_at) < new Date()) {
    return { ok: false, code: 'EXPIRED_TOKEN', status: 410 };
  }

  return {
    ok: true,
    client: {
      id: legacyClient.id,
      company_name: legacyClient.company_name,
      contact_name: legacyClient.contact_name,
      status: legacyClient.status,
      operator_id: legacyClient.operator_id,
    },
  };
}
