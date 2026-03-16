import { Card, CardContent } from '@/components/ui/card';
import { PortalAgreementCard } from '@/components/portal/PortalAgreementCard';
import { FileText, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import type { Agreement, MonthlySnapshotIndex } from '@/types/database';

type PortalReportsDocumentsProps = {
  monthlySnapshots: MonthlySnapshotIndex[];
  agreements: Agreement[];
  onViewAgreement: (agreement: Agreement) => void;
};

export function PortalReportsDocuments({
  monthlySnapshots,
  agreements,
  onViewAgreement,
}: PortalReportsDocumentsProps) {
  if (monthlySnapshots.length === 0 && agreements.length === 0) return null;

  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Reports & Documents
      </h2>
      <div className="space-y-3">
        {monthlySnapshots.map((snapshot) => (
          <Card key={snapshot.id} className="border-border/60">
            <CardContent className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{snapshot.month_label}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(snapshot.created_at), 'd MMM yyyy')}
                  </p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground/40" />
            </CardContent>
          </Card>
        ))}

        {agreements.map((agreement) => (
          <PortalAgreementCard
            key={agreement.id}
            agreement={agreement}
            onView={() => onViewAgreement(agreement)}
          />
        ))}
      </div>
    </section>
  );
}
