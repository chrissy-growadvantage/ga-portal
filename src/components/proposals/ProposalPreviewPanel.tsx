import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { generateHTML } from '@/lib/tiptap-extensions';
import type { JSONContent } from '@tiptap/react';

interface PreviewLineItem {
  name: string;
  description?: string;
  description_json?: JSONContent | Record<string, unknown> | null;
  quantity: number;
  unit_price: number;
}

interface PreviewAddon {
  name: string;
  description?: string;
  description_json?: JSONContent | Record<string, unknown> | null;
  price: number;
  is_included: boolean;
}

interface ProposalPreviewPanelProps {
  title: string;
  summary?: string;
  summaryJSON?: JSONContent | Record<string, unknown> | null;
  clientName?: string;
  lineItems: PreviewLineItem[];
  addons: PreviewAddon[];
  validDays?: number | null;
}

function renderDescriptionHtml(
  descJson?: JSONContent | Record<string, unknown> | null,
): string | null {
  if (
    descJson &&
    typeof descJson === 'object' &&
    'type' in descJson &&
    descJson.type === 'doc'
  ) {
    try {
      return generateHTML(descJson as JSONContent);
    } catch {
      return null;
    }
  }
  return null;
}

export function ProposalPreviewPanel({
  title,
  summary,
  summaryJSON,
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

  const summaryHtml = useMemo(() => {
    if (summaryJSON && typeof summaryJSON === 'object' && 'type' in summaryJSON && summaryJSON.type === 'doc') {
      try {
        return generateHTML(summaryJSON as JSONContent);
      } catch {
        return null;
      }
    }
    return null;
  }, [summaryJSON]);

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

            {summaryHtml ? (
              <div
                className="prose prose-sm max-w-none text-muted-foreground line-clamp-5"
                dangerouslySetInnerHTML={{ __html: summaryHtml }}
              />
            ) : summary ? (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {summary}
              </p>
            ) : null}

            {/* Line items summary */}
            {lineItems.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Services
                </p>
                {lineItems.map((item, i) => {
                  const itemTotal = (item.quantity || 0) * (item.unit_price || 0);
                  const descHtml = renderDescriptionHtml(item.description_json);
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm">
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
                      {descHtml ? (
                        <div
                          className="prose prose-xs max-w-none text-muted-foreground/70 line-clamp-2 mt-0.5"
                          dangerouslySetInnerHTML={{ __html: descHtml }}
                        />
                      ) : item.description ? (
                        <p className="text-xs text-muted-foreground/70 line-clamp-2 mt-0.5">
                          {item.description}
                        </p>
                      ) : null}
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
                {includedAddons.map((addon, i) => {
                  const addonDescHtml = renderDescriptionHtml(addon.description_json);
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span className="truncate mr-2">{addon.name || 'Unnamed addon'}</span>
                        <span className="font-mono shrink-0">
                          +${(addon.price || 0).toLocaleString()}
                        </span>
                      </div>
                      {addonDescHtml ? (
                        <div
                          className="prose prose-xs max-w-none text-muted-foreground/70 line-clamp-2 mt-0.5"
                          dangerouslySetInnerHTML={{ __html: addonDescHtml }}
                        />
                      ) : addon.description ? (
                        <p className="text-xs text-muted-foreground/70 line-clamp-2 mt-0.5">
                          {addon.description}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
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
