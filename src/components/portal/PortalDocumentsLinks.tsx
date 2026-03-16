import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PortalAgreementCard } from '@/components/portal/PortalAgreementCard';
import {
  CreditCard,
  FileCheck,
  FileText,
  MessageSquare,
  FolderOpen,
  Calendar,
  ExternalLink,
  ScrollText,
  PenLine,
} from 'lucide-react';
import { format } from 'date-fns';
import type { PortalClient } from '@/types/portal';
import type { Agreement, MonthlySnapshotIndex } from '@/types/database';

type PortalDocumentsLinksProps = {
  client: PortalClient;
  agreements: Agreement[];
  monthlySnapshots: MonthlySnapshotIndex[];
  onViewAgreement: (agreement: Agreement) => void;
  onViewSnapshot?: (snapshot: MonthlySnapshotIndex) => void;
  /** Filter to show only a subset: 'agreements' (docs + agreements) or 'links' (quick links + snapshots) */
  showOnly?: 'agreements' | 'links';
};

type DocCardProps = {
  icon: React.ElementType;
  label: string;
  href: string;
};

function DocCard({ icon: Icon, label, href }: DocCardProps) {
  return (
    <Card className="border-border/60">
      <CardContent className="py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Icon className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">{label}</p>
        </div>
        <a href={href} target="_blank" rel="noopener noreferrer">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 shrink-0 min-h-[44px]"
            aria-label={`Open ${label} (opens in new tab)`}
          >
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            Open
          </Button>
        </a>
      </CardContent>
    </Card>
  );
}

type QuickLinkCardProps = {
  icon: React.ElementType;
  label: string;
  href: string;
};

function QuickLinkCard({ icon: Icon, label, href }: QuickLinkCardProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-2.5 text-sm font-medium hover:bg-muted/30 transition-colors min-h-[44px]"
      aria-label={`Open ${label} (opens in new tab)`}
    >
      <Icon className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
      {label}
    </a>
  );
}

export function PortalDocumentsLinks({
  client,
  agreements,
  monthlySnapshots,
  onViewAgreement,
  onViewSnapshot,
  showOnly,
}: PortalDocumentsLinksProps) {
  const hasDocs =
    !!client.portal_stripe_url ||
    !!client.portal_intake_url ||
    !!client.portal_proposal_url ||
    !!client.portal_contract_url;
  const hasAgreements = agreements.length > 0;
  const hasSnapshots = monthlySnapshots.length > 0;
  const hasQuickLinks =
    !!client.portal_slack_url ||
    !!client.portal_drive_url ||
    !!client.portal_booking_url;

  const showAgreements = !showOnly || showOnly === 'agreements';
  const showLinks = !showOnly || showOnly === 'links';

  const hasContent =
    (showAgreements && (hasDocs || hasAgreements)) ||
    (showLinks && (hasSnapshots || hasQuickLinks));
  if (!hasContent) return null;

  return (
    <div className="space-y-6">
      {/* Quick access docs */}
      {showAgreements && hasDocs && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Documents
          </h3>
          <div className="space-y-2">
            {client.portal_proposal_url && (
              <DocCard
                icon={ScrollText}
                label="Proposal"
                href={client.portal_proposal_url}
              />
            )}
            {client.portal_contract_url && (
              <DocCard
                icon={PenLine}
                label="Signed Contract"
                href={client.portal_contract_url}
              />
            )}
            {client.portal_stripe_url && (
              <DocCard
                icon={CreditCard}
                label="Payment Setup"
                href={client.portal_stripe_url}
              />
            )}
            {client.portal_intake_url && (
              <DocCard
                icon={FileCheck}
                label="Intake Form"
                href={client.portal_intake_url}
              />
            )}
          </div>
        </div>
      )}

      {/* Agreements */}
      {showAgreements && hasAgreements && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Agreements
          </h3>
          <div className="space-y-2">
            {agreements.map((agreement) => (
              <PortalAgreementCard
                key={agreement.id}
                agreement={agreement}
                onView={() => onViewAgreement(agreement)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Monthly snapshots */}
      {showLinks && hasSnapshots && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Monthly Reports
          </h3>
          <div className="space-y-2">
            {monthlySnapshots.map((snapshot) => (
              <Card key={snapshot.id} className="border-border/60">
                <CardContent className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{snapshot.month_label}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(snapshot.created_at), 'd MMM yyyy')}
                      </p>
                    </div>
                  </div>
                  {onViewSnapshot && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 shrink-0 min-h-[44px]"
                      onClick={() => onViewSnapshot(snapshot)}
                      aria-label={`Open ${snapshot.month_label} report`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                      Open
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      {showLinks && hasQuickLinks && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Quick Links
          </h3>
          <div className="space-y-2">
            {client.portal_slack_url && (
              <QuickLinkCard
                icon={MessageSquare}
                label="Slack Channel"
                href={client.portal_slack_url}
              />
            )}
            {client.portal_drive_url && (
              <QuickLinkCard
                icon={FolderOpen}
                label="Shared Drive"
                href={client.portal_drive_url}
              />
            )}
            {client.portal_booking_url && (
              <QuickLinkCard
                icon={Calendar}
                label="Book a Meeting"
                href={client.portal_booking_url}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
