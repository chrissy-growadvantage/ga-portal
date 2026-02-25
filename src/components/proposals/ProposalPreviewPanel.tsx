import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface PreviewLineItem {
  name: string;
  quantity: number;
  unit_price: number;
}

interface PreviewAddon {
  name: string;
  price: number;
  is_included: boolean;
}

interface ProposalPreviewPanelProps {
  title: string;
  summary?: string;
  clientName?: string;
  lineItems: PreviewLineItem[];
  addons: PreviewAddon[];
  validDays?: number | null;
}

export function ProposalPreviewPanel({
  title,
  summary,
  clientName,
  lineItems,
  addons,
  validDays,
}: ProposalPreviewPanelProps) {
  const lineItemsTotal = lineItems.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0),
    0,
  );

  const includedAddons = addons.filter((a) => a.is_included);

  const addonsTotal = includedAddons.reduce(
    (sum, addon) => sum + (addon.price || 0),
    0,
  );

  const total = lineItemsTotal + addonsTotal;

  return (
    <div className="hidden lg:block w-80 xl:w-96 shrink-0">
      <div className="sticky top-6 space-y-4">
        <Card className="overflow-hidden border-border/60">
          <div className="bg-muted/30 p-4 border-b border-border/60">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Preview
            </p>
          </div>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold">
              {title || 'Untitled Proposal'}
            </h3>
            {clientName && (
              <p className="text-sm text-muted-foreground">{clientName}</p>
            )}

            {summary && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {summary}
              </p>
            )}

            {/* Line items summary */}
            {lineItems.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Services
                </p>
                {lineItems.map((item, i) => {
                  const itemTotal = (item.quantity || 0) * (item.unit_price || 0);
                  return (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="truncate mr-2">
                        {item.name || 'Unnamed service'}
                        {item.quantity > 1 && (
                          <span className="text-muted-foreground"> x{item.quantity}</span>
                        )}
                      </span>
                      <span className="font-mono shrink-0">
                        ${itemTotal.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Addons summary */}
            {includedAddons.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Add-ons
                </p>
                {includedAddons.map((addon, i) => (
                  <div key={i} className="flex justify-between text-sm text-muted-foreground">
                    <span className="truncate mr-2">{addon.name || 'Unnamed addon'}</span>
                    <span className="font-mono shrink-0">
                      +${(addon.price || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <Separator />

            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span className="font-mono">${total.toLocaleString()}</span>
            </div>

            {validDays && (
              <p className="text-xs text-muted-foreground">
                Valid for {validDays} days
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
