import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { format } from 'date-fns';
import type { Agreement } from '@/types/database';

interface PortalAgreementCardProps {
  agreement: Agreement & { proposal_title?: string };
  onView?: () => void;
}

export function PortalAgreementCard({ agreement, onView }: PortalAgreementCardProps) {
  const snapshot = agreement.snapshot as {
    title?: string;
    total?: number;
    line_items?: { quantity: number; unit_price: number }[];
    addons?: { price: number; is_selected: boolean }[];
  };

  const title = agreement.proposal_title || snapshot.title || 'Agreement';

  const total = snapshot.total ?? (() => {
    const itemsTotal = (snapshot.line_items || []).reduce(
      (sum, li) => sum + li.quantity * li.unit_price, 0
    );
    const addonsTotal = (snapshot.addons || [])
      .filter((a) => a.is_selected)
      .reduce((sum, a) => sum + a.price, 0);
    return itemsTotal + addonsTotal;
  })();

  return (
    <Card className="border-border/60 border-l-4 border-l-[#6B8E6F]">
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Accepted {format(new Date(agreement.signed_at), 'MMM d, yyyy')} by {agreement.signer_name}
            </p>
            <p className="text-sm font-semibold font-mono mt-1">${total.toFixed(2)}</p>
          </div>
          {onView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onView}
              className="shrink-0 gap-1.5 min-h-[44px]"
              aria-label={`View agreement: ${title}`}
            >
              <FileText className="w-4 h-4" />
              View
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
