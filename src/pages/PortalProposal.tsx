import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { PortalAddonToggles } from '@/components/portal/PortalAddonToggles';
import { PortalAcceptanceForm } from '@/components/portal/PortalAcceptanceForm';
import { PortalSignatureDisplay } from '@/components/portal/PortalSignatureDisplay';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldAlert, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { BILLING_TYPE_LABELS } from '@/lib/constants';
import { differenceInDays, format } from 'date-fns';
import type { AcceptProposalInput } from '@/lib/proposal-schemas';
import type { ProposalLineItem, ProposalAddon, Agreement } from '@/types/database';

interface ProposalData {
  proposal: {
    id: string;
    title: string;
    summary: string | null;
    notes: string | null;
    status: string;
    expires_at: string | null;
    accepted_at: string | null;
    declined_at: string | null;
  };
  line_items: ProposalLineItem[];
  addons: ProposalAddon[];
  client: {
    company_name: string;
    contact_name: string | null;
  };
  operator: {
    full_name: string;
    business_name: string | null;
  };
  agreement?: Agreement;
}

type ViewState = 'loading' | 'error' | 'expired' | 'proposal' | 'accepted' | 'declined' | 'already_accepted';

export default function PortalProposal() {
  const { token, proposalId } = useParams<{ token: string; proposalId: string }>();
  const [data, setData] = useState<ProposalData | null>(null);
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [addons, setAddons] = useState<ProposalAddon[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptedName, setAcceptedName] = useState('');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Fetch proposal data
  useEffect(() => {
    if (!token || !proposalId) return;

    async function fetchProposal() {
      try {
        const response = await fetch(
          `${supabaseUrl}/functions/v1/view-proposal?token=${encodeURIComponent(token!)}`,
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
          const code = result?.error?.code ?? 'INVALID_TOKEN';
          if (code === 'EXPIRED_TOKEN') {
            setViewState('expired');
          } else {
            setErrorMessage(code);
            setViewState('error');
          }
          return;
        }

        const proposalData = result as ProposalData;
        setData(proposalData);
        setAddons(proposalData.addons);

        if (proposalData.proposal.status === 'expired') {
          setViewState('expired');
        } else if (proposalData.proposal.status === 'accepted' || proposalData.agreement) {
          setViewState('already_accepted');
        } else if (proposalData.proposal.status === 'declined') {
          setViewState('declined');
        } else {
          setViewState('proposal');
        }
      } catch {
        setErrorMessage('NETWORK_ERROR');
        setViewState('error');
      }
    }

    fetchProposal();
  }, [token, proposalId, supabaseUrl, anonKey]);

  // Toggle addon selection
  const handleAddonToggle = useCallback(async (addonId: string, isSelected: boolean) => {
    setAddons((prev) => prev.map((a) => a.id === addonId ? { ...a, is_selected: isSelected } : a));

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/toggle-proposal-addon`, {
        method: 'POST',
        headers: {
          'apikey': anonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, addon_id: addonId, is_selected: isSelected }),
      });

      if (!response.ok) {
        setAddons((prev) => prev.map((a) => a.id === addonId ? { ...a, is_selected: !isSelected } : a));
        toast.error('Failed to update add-on. Please try again.');
      }
    } catch {
      setAddons((prev) => prev.map((a) => a.id === addonId ? { ...a, is_selected: !isSelected } : a));
      toast.error('Failed to update add-on. Please try again.');
    }
  }, [token, supabaseUrl, anonKey]);

  // Calculate totals
  const { baseTotal, addonsTotal, grandTotal } = useMemo(() => {
    const base = (data?.line_items ?? []).reduce(
      (sum, li) => sum + li.quantity * li.unit_price, 0
    );
    const addonsSum = addons
      .filter((a) => a.is_selected)
      .reduce((sum, a) => sum + a.price, 0);
    return { baseTotal: base, addonsTotal: addonsSum, grandTotal: base + addonsSum };
  }, [data?.line_items, addons]);

  // Expiration info
  const expirationInfo = useMemo(() => {
    if (!data?.proposal.expires_at) return null;
    const expiresAt = new Date(data.proposal.expires_at);
    const daysLeft = differenceInDays(expiresAt, new Date());
    return { expiresAt, daysLeft };
  }, [data?.proposal.expires_at]);

  // Accept handler
  const handleAccept = async (formData: AcceptProposalInput) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/accept-proposal`, {
        method: 'POST',
        headers: {
          'apikey': anonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          signer_name: formData.signer_name,
          signer_email: formData.signer_email,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result?.error?.message ?? 'Failed to accept proposal');
      }

      setAcceptedName(formData.signer_name);
      setViewState('accepted');
      toast.success('Proposal accepted!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Decline handler
  const handleDecline = async (reason?: string) => {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/decline-proposal`, {
        method: 'POST',
        headers: {
          'apikey': anonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, reason }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result?.error?.message ?? 'Failed to decline proposal');
      }

      setViewState('declined');
      toast.success('Proposal declined');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  // Loading state
  if (viewState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(0 0% 99%)' }}>
        <div className="text-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading proposal...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (viewState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'hsl(0 0% 99%)' }}>
        <div className="text-center max-w-sm">
          <ShieldAlert className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <h1 className="text-lg font-semibold mb-1">
            {errorMessage === 'NETWORK_ERROR' ? 'Connection Error' : 'Link Not Found'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {errorMessage === 'NETWORK_ERROR'
              ? 'Unable to connect. Please check your internet and try again.'
              : 'This proposal link is not valid. Please check with your service provider.'}
          </p>
        </div>
      </div>
    );
  }

  // Expired state
  if (viewState === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'hsl(0 0% 99%)' }}>
        <div className="text-center max-w-sm">
          <Clock className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h1 className="text-lg font-semibold mb-1">Proposal Expired</h1>
          <p className="text-sm text-muted-foreground">
            This proposal has expired. Please contact your service provider for a new one.
          </p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { proposal, line_items, client, operator, agreement } = data;
  const clientDisplayName = client.company_name || client.contact_name || 'Client';
  const includedAddons = addons.filter((a) => a.is_included);

  return (
    <PortalLayout
      operatorName={operator.full_name}
      businessName={operator.business_name}
      clientName={clientDisplayName}
    >
      {/* Expiration warning */}
      {viewState === 'proposal' && expirationInfo && expirationInfo.daysLeft <= 7 && expirationInfo.daysLeft > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <p className="text-sm">
            This proposal expires in {expirationInfo.daysLeft} day{expirationInfo.daysLeft !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Proposal header */}
      <section>
        <h2 className="text-xl font-bold tracking-tight">{proposal.title}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Proposal for {clientDisplayName}
        </p>
        {proposal.summary && (
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{proposal.summary}</p>
        )}
      </section>

      {/* Service items */}
      <section>
        <h2 className="text-base font-semibold mb-3">Services</h2>
        <Card className="border-border/60">
          <CardContent className="py-4">
            <div className="divide-y divide-border/50">
              {line_items.map((item) => (
                <div key={item.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-mono">
                        {item.quantity} x ${item.unit_price.toFixed(2)}
                      </p>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-1">
                        {BILLING_TYPE_LABELS[item.billing_type]}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/50">
              <p className="text-sm font-medium">Subtotal</p>
              <p className="text-sm font-semibold font-mono">${baseTotal.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Add-ons */}
      {includedAddons.length > 0 && (
        <PortalAddonToggles
          addons={includedAddons}
          token={token!}
          proposalId={proposalId!}
          onToggle={handleAddonToggle}
          disabled={viewState !== 'proposal'}
        />
      )}

      {/* Pricing summary */}
      <section>
        <Card className="border-border/60">
          <CardContent className="py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Base services</span>
                <span className="font-mono">${baseTotal.toFixed(2)}</span>
              </div>
              {addonsTotal > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Add-ons</span>
                  <span className="font-mono">${addonsTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <span className="text-base font-semibold">Total</span>
                <span className="text-xl font-bold font-mono text-primary transition-all duration-300">
                  ${grandTotal.toFixed(2)}
                </span>
              </div>
              {expirationInfo && (
                <p className="text-xs text-muted-foreground text-right">
                  Valid until {format(expirationInfo.expiresAt, 'MMMM d, yyyy')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Notes */}
      {proposal.notes && viewState === 'proposal' && (
        <section>
          <h2 className="text-base font-semibold mb-2">Notes</h2>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{proposal.notes}</p>
        </section>
      )}

      {/* Acceptance form */}
      {viewState === 'proposal' && (
        <PortalAcceptanceForm
          onAccept={handleAccept}
          onDecline={handleDecline}
          total={grandTotal}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Success: accepted */}
      {viewState === 'accepted' && (
        <section className="text-center py-8">
          <CheckCircle2 className="w-16 h-16 text-[#6B8E6F] mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Proposal Accepted</h2>
          <p className="text-sm text-muted-foreground">
            Thank you, {acceptedName}. Your agreement has been recorded.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Your service provider has been notified.
          </p>
        </section>
      )}

      {/* Declined */}
      {viewState === 'declined' && (
        <section className="text-center py-8">
          <Clock className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Proposal Declined</h2>
          <p className="text-sm text-muted-foreground">
            Thank you for letting us know.
          </p>
        </section>
      )}

      {/* Already accepted */}
      {viewState === 'already_accepted' && agreement && (
        <section className="text-center py-8">
          <CheckCircle2 className="w-16 h-16 text-[#6B8E6F] mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Proposal Accepted</h2>
          <p className="text-sm text-muted-foreground mb-4">
            This proposal was accepted on {format(new Date(agreement.signed_at), 'MMMM d, yyyy')}.
          </p>
          <div className="inline-block text-left">
            <PortalSignatureDisplay
              name={agreement.signer_name}
              date={agreement.signed_at}
            />
          </div>
        </section>
      )}
    </PortalLayout>
  );
}
