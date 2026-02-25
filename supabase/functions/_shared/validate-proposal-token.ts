import { getServiceClient } from './supabase.ts';

export async function hashToken(rawToken: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(rawToken);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface ValidatedProposal {
  id: string;
  title: string;
  status: string;
  client_id: string;
  operator_id: string;
  token_hash: string;
  expires_at: string | null;
  token_expires_at: string | null;
}

export async function validateProposalToken(rawToken: string): Promise<
  | { ok: true; proposal: ValidatedProposal }
  | { ok: false; code: 'INVALID_TOKEN' | 'EXPIRED_TOKEN'; status: number }
> {
  const tokenHash = await hashToken(rawToken);
  const supabase = getServiceClient();

  const { data: proposal, error } = await supabase
    .from('proposals')
    .select('id, title, status, client_id, operator_id, token_hash, expires_at, token_expires_at')
    .eq('token_hash', tokenHash)
    .single();

  if (error || !proposal) {
    return { ok: false, code: 'INVALID_TOKEN', status: 404 };
  }

  // Check token expiry
  if (proposal.token_expires_at && new Date(proposal.token_expires_at) < new Date()) {
    return { ok: false, code: 'EXPIRED_TOKEN', status: 410 };
  }

  return {
    ok: true,
    proposal: {
      id: proposal.id,
      title: proposal.title,
      status: proposal.status,
      client_id: proposal.client_id,
      operator_id: proposal.operator_id,
      token_hash: proposal.token_hash,
      expires_at: proposal.expires_at,
      token_expires_at: proposal.token_expires_at,
    },
  };
}
