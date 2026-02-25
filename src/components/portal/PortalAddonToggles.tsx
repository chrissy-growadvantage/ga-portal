import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { BILLING_TYPE_LABELS } from '@/lib/constants';
import { generateHTML } from '@/lib/tiptap-extensions';
import type { JSONContent } from '@tiptap/react';
import type { ProposalAddon } from '@/types/database';

interface PortalAddonTogglesProps {
  addons: ProposalAddon[];
  token: string;
  proposalId: string;
  onToggle: (addonId: string, isSelected: boolean) => void;
  disabled?: boolean;
}

export function PortalAddonToggles({ addons, onToggle, disabled }: PortalAddonTogglesProps) {
  if (addons.length === 0) return null;

  return (
    <section>
      <h2 className="text-base font-semibold mb-3">Optional Add-ons</h2>
      <div className="space-y-3">
        {addons.map((addon) => (
          <Card key={addon.id} className="border-border/60">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <Switch
                  checked={addon.is_selected}
                  onCheckedChange={(checked) => onToggle(addon.id, checked as boolean)}
                  disabled={disabled}
                  aria-label={`Toggle ${addon.name}`}
                  className="shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{addon.name}</p>
                  {addon.description_json && typeof addon.description_json === 'object' && 'type' in addon.description_json && addon.description_json.type === 'doc' ? (
                    (() => {
                      try {
                        const html = generateHTML(addon.description_json as JSONContent);
                        return (
                          <div
                            className="prose prose-xs max-w-none text-muted-foreground mt-0.5 line-clamp-2"
                            dangerouslySetInnerHTML={{ __html: html }}
                          />
                        );
                      } catch {
                        return addon.description ? (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {addon.description}
                          </p>
                        ) : null;
                      }
                    })()
                  ) : addon.description ? (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {addon.description}
                    </p>
                  ) : null}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold font-mono">${addon.price.toFixed(2)}</p>
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
  );
}
