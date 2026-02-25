import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { PortalSignatureDisplay } from '@/components/portal/PortalSignatureDisplay';
import { PortalAgreementCard } from '@/components/portal/PortalAgreementCard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldAlert, Clock } from 'lucide-react';
import { BILLING_TYPE_LABELS } from '@/lib/constants';
import type { Agreement } from '@/types/database';

interface AgreementSnapshot {
  title: string;
  summary?: string;
  line_items: {
    name: string;
    description?: string;
    quantity: number;
    unit_price: number;
    billing_type: 'one_time' | 'recurring';
  }[];
  addons: {
    name: string;
    description?: string;
    price: number;
    billing_type: 'one_time' | 'recurring';
    is_selected: boolean;
  }[];
}

interface AgreementData {
  agreements: (Agreement & { proposal_title?: string })[];
  client: {
    company_name: string;
    contact_name: string | null;
  };
  operator: {
    full_name: string;
    business_name: string | null;
  };
}

export default function PortalAgreement() {
  const { token, agreementId } = useParams<{ token: string; agreementId?: string }>();
  const [data, setData] = useState<AgreementData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(agreementId ?? null);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  useEffect(() => {
    if (!token) return;

    async function fetchAgreements() {
      try {
        const response = await fetch(
          `${supabaseUrl}/functions/v1/view-agreements?token=${encodeURIComponent(token!)}`,
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
          setError(code);
          return;
        }

        const agreementData = result as AgreementData;
        setData(agreementData);

        if (agreementId) {
          setSelectedId(agreementId);
        } else if (agreementData.agreements.length === 1) {
          setSelectedId(agreementData.agreements[0].id);
        }
      } catch {
        setError('NETWORK_ERROR');
      } finally {
        setIsLoading(false);
      }
    }

    fetchAgreements();
  }, [token, agreementId, supabaseUrl, anonKey]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(0 0% 99%)' }}>
        <div className="text-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading agreement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isExpired = error === 'EXPIRED_TOKEN';
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'hsl(0 0% 99%)' }}>
        <div className="text-center max-w-sm">
          {isExpired ? (
            <>
              <Clock className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <h1 className="text-lg font-semibold mb-1">Link Expired</h1>
              <p className="text-sm text-muted-foreground">
                This link has expired. Please ask your service provider for a new link.
              </p>
            </>
          ) : (
            <>
              <ShieldAlert className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <h1 className="text-lg font-semibold mb-1">
                {error === 'NETWORK_ERROR' ? 'Connection Error' : 'Link Not Found'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {error === 'NETWORK_ERROR'
                  ? 'Unable to connect. Please check your internet and try again.'
                  : 'This link is not valid. Please check with your service provider.'}
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { agreements, client, operator } = data;
  const clientDisplayName = client.company_name || client.contact_name || 'Client';
  const selectedAgreement = selectedId ? agreements.find((a) => a.id === selectedId) : null;

  // Detail view for a specific agreement
  if (selectedAgreement) {
    const snapshot = selectedAgreement.snapshot as unknown as AgreementSnapshot;
    const lineItems = snapshot.line_items || [];
    const snapshotAddons = snapshot.addons || [];

    const baseTotal = lineItems.reduce((sum, li) => sum + li.quantity * li.unit_price, 0);
    const addonsTotal = snapshotAddons
      .filter((a) => a.is_selected)
      .reduce((sum, a) => sum + a.price, 0);
    const grandTotal = baseTotal + addonsTotal;

    return (
      <PortalLayout
        operatorName={operator.full_name}
        businessName={operator.business_name}
        clientName={clientDisplayName}
      >
        {/* Back to list (if multiple agreements and not deep-linked) */}
        {agreements.length > 1 && !agreementId && (
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="text-sm text-primary hover:underline"
            aria-label="Back to agreements list"
          >
            &larr; All agreements
          </button>
        )}

        {/* Agreement header */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-[#6B8E6F]" />
            <span className="text-xs font-medium text-[#6B8E6F] uppercase tracking-wide">Signed Agreement</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            {snapshot.title || selectedAgreement.proposal_title || 'Agreement'}
          </h2>
          {snapshot.summary && (
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{snapshot.summary}</p>
          )}
        </section>

        {/* Line items */}
        <section>
          <h2 className="text-base font-semibold mb-3">Services</h2>
          <Card className="border-border/60">
            <CardContent className="py-4">
              <div className="divide-y divide-border/50">
                {lineItems.map((item, i) => (
                  <div key={i} className="py-3 first:pt-0 last:pb-0">
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

        {/* Add-ons from snapshot */}
        {snapshotAddons.length > 0 && (
          <section>
            <h2 className="text-base font-semibold mb-3">Add-ons</h2>
            <div className="space-y-3">
              {snapshotAddons.map((addon, i) => (
                <Card key={i} className="border-border/60">
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${addon.is_selected ? 'bg-[#6B8E6F]' : 'bg-muted-foreground/30'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{addon.name}</p>
                        {addon.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{addon.description}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-mono ${!addon.is_selected ? 'text-muted-foreground line-through' : ''}`}>
                          ${addon.price.toFixed(2)}
                        </p>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-1">
                          {BILLING_TYPE_LABELS[addon.billing_type]}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Pricing total */}
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
                  <span className="text-xl font-bold font-mono text-[#6B8E6F]">
                    ${grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Signature */}
        <section>
          <h2 className="text-base font-semibold mb-3">Signature</h2>
          <Card className="border-border/60 border-l-4 border-l-[#6B8E6F]">
            <CardContent className="py-4">
              <PortalSignatureDisplay
                name={selectedAgreement.signer_name}
                date={selectedAgreement.signed_at}
              />
              {selectedAgreement.signer_email && (
                <p className="text-xs text-muted-foreground mt-2">
                  {selectedAgreement.signer_email}
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      </PortalLayout>
    );
  }

  // List view (multiple agreements or none)
  return (
    <PortalLayout
      operatorName={operator.full_name}
      businessName={operator.business_name}
      clientName={clientDisplayName}
    >
      <section>
        <h2 className="text-xl font-bold tracking-tight mb-1">Your Agreements</h2>
        <p className="text-sm text-muted-foreground">
          {agreements.length} signed agreement{agreements.length !== 1 ? 's' : ''}
        </p>
      </section>

      <section className="space-y-3">
        {agreements.map((agreement) => (
          <PortalAgreementCard
            key={agreement.id}
            agreement={agreement}
            onView={() => setSelectedId(agreement.id)}
          />
        ))}
      </section>

      {agreements.length === 0 && (
        <section className="text-center py-8">
          <p className="text-sm text-muted-foreground">No agreements found.</p>
        </section>
      )}
    </PortalLayout>
  );
}
