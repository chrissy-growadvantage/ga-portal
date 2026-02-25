import { UseFormReturn, useFieldArray } from 'react-hook-form';
import type { CreateProposalInput } from '@/lib/proposal-schemas';
import type { AddonTemplate } from '@/types/database';
import { BILLING_TYPE_LABELS } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, X, Package } from 'lucide-react';

const DEFAULT_ADDON = {
  addon_template_id: null,
  name: '',
  description: '',
  price: 0,
  billing_type: 'one_time' as const,
  is_included: true,
  sort_order: 0,
};

interface ProposalAddonSelectorProps {
  form: UseFormReturn<CreateProposalInput>;
  addonTemplates?: AddonTemplate[];
}

export function ProposalAddonSelector({ form, addonTemplates }: ProposalAddonSelectorProps) {
  const {
    fields: addonFields,
    append: appendAddon,
    remove: removeAddon,
  } = useFieldArray({ control: form.control, name: 'addons' });

  const addAddonFromTemplate = (template: AddonTemplate) => {
    appendAddon({
      addon_template_id: template.id,
      name: template.name,
      description: template.description ?? '',
      price: template.default_price,
      billing_type: template.billing_type,
      is_included: true,
      sort_order: addonFields.length,
    });
  };

  const addCustomAddon = () => {
    appendAddon({ ...DEFAULT_ADDON, sort_order: addonFields.length });
  };

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div>
          <CardTitle className="text-base">Optional Add-ons</CardTitle>
          <p className="text-sm text-muted-foreground mt-0.5">
            Clients can select these when reviewing the proposal.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {addonFields.map((field, index) => (
          <div
            key={field.id}
            className="flex items-start gap-3 p-3 rounded-lg border border-border/60"
          >
            <FormField
              control={form.control}
              name={`addons.${index}.is_included`}
              render={({ field }) => (
                <FormItem className="mt-1">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-label={`Include addon ${addonFields[index]?.name || `addon ${index + 1}`}`}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name={`addons.${index}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Addon name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`addons.${index}.description`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Description (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`addons.${index}.price`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="$ Price"
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value ? Number(e.target.value) : 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`addons.${index}.billing_type`}
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(BILLING_TYPE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground hover:text-destructive mt-1"
              onClick={() => removeAddon(index)}
              aria-label={`Remove addon ${index + 1}`}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}

        <div className="flex gap-2 mt-3">
          {addonTemplates && addonTemplates.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="gap-2">
                  <Package className="w-4 h-4" />
                  From Library
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {addonTemplates.map((template) => (
                  <DropdownMenuItem
                    key={template.id}
                    onClick={() => addAddonFromTemplate(template)}
                  >
                    <span className="flex-1">{template.name}</span>
                    <span className="text-muted-foreground font-mono ml-3">
                      ${template.default_price.toLocaleString()}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={addCustomAddon}
          >
            <Plus className="w-4 h-4" />
            Custom Addon
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
