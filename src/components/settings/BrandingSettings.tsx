import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Save, Loader2, AlertTriangle, Palette } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { brandingFormResponseSchema } from '@/lib/schemas';

type BrandingForm = {
  portal_logo_url: string;
  portal_primary_color: string;
  portal_accent_color: string;
};

function fromOperator(data: Partial<BrandingForm>): BrandingForm {
  return {
    portal_logo_url: data.portal_logo_url ?? '',
    portal_primary_color: data.portal_primary_color ?? '#5B4DC7',
    portal_accent_color: data.portal_accent_color ?? '#E8853A',
  };
}

export function BrandingSettings() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: operator, isLoading } = useQuery({
    queryKey: ['operator', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('operators')
        .select('portal_logo_url, portal_primary_color, portal_accent_color')
        .eq('id', user!.id)
        .single();
      if (error) throw error;
      return brandingFormResponseSchema.parse(data);
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const [form, setForm] = useState<BrandingForm>(fromOperator({}));
  const [initialForm, setInitialForm] = useState<BrandingForm>(fromOperator({}));

  useEffect(() => {
    if (operator) {
      const next = fromOperator(operator);
      setForm(next);
      setInitialForm(next);
    }
  }, [operator]);

  const isDirty = useMemo(
    () => (Object.keys(form) as (keyof BrandingForm)[]).some((k) => form[k] !== initialForm[k]),
    [form, initialForm],
  );

  const set = (field: keyof BrandingForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('operators')
        .update({
          portal_logo_url: form.portal_logo_url || null,
          portal_primary_color: form.portal_primary_color || null,
          portal_accent_color: form.portal_accent_color || null,
        })
        .eq('id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['operator', user?.id] });
      setInitialForm(form);
      toast.success('Branding saved');
    },
    onError: () => toast.error('Failed to save branding'),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Portal Branding
        </CardTitle>
        <CardDescription>
          Customise the logo and colours shown in your client portal.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo URL */}
        <div className="space-y-1.5">
          <Label htmlFor="logo_url">Logo URL</Label>
          <Input
            id="logo_url"
            type="url"
            placeholder="https://example.com/logo.png"
            value={form.portal_logo_url}
            onChange={(e) => set('portal_logo_url', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Displayed at the top of your client portal. Use a hosted image URL (PNG or SVG, recommended height 40px).
          </p>
        </div>

        {/* Colour pickers */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="primary_color">Primary colour</Label>
            <div className="flex items-center gap-2">
              <input
                id="primary_color"
                type="color"
                value={form.portal_primary_color}
                onChange={(e) => set('portal_primary_color', e.target.value)}
                className="h-9 w-12 rounded border border-input cursor-pointer"
              />
              <Input
                value={form.portal_primary_color}
                onChange={(e) => set('portal_primary_color', e.target.value)}
                placeholder="#5B4DC7"
                className="font-mono text-sm"
                maxLength={7}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="accent_color">Accent colour</Label>
            <div className="flex items-center gap-2">
              <input
                id="accent_color"
                type="color"
                value={form.portal_accent_color}
                onChange={(e) => set('portal_accent_color', e.target.value)}
                className="h-9 w-12 rounded border border-input cursor-pointer"
              />
              <Input
                value={form.portal_accent_color}
                onChange={(e) => set('portal_accent_color', e.target.value)}
                placeholder="#E8853A"
                className="font-mono text-sm"
                maxLength={7}
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-lg border border-border overflow-hidden">
          <div
            className="flex items-center gap-3 px-4 py-3"
            style={{ backgroundColor: form.portal_primary_color }}
          >
            {form.portal_logo_url ? (
              <img
                src={form.portal_logo_url}
                alt="Portal logo preview"
                className="h-6 object-contain"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="h-6 w-24 rounded bg-white/20" />
            )}
            <span className="text-white text-sm font-semibold opacity-80">Client Portal</span>
          </div>
          <div className="p-4 bg-card flex items-center gap-3">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${form.portal_accent_color}20` }}
            >
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: form.portal_accent_color }} />
            </div>
            <span className="text-sm text-muted-foreground">Portal preview</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 gap-3">
          <div className="flex items-center gap-2 min-h-[20px]">
            {isDirty && (
              <span className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Unsaved changes
              </span>
            )}
          </div>
          <Button
            size="sm"
            onClick={() => void save.mutateAsync()}
            disabled={save.isPending || !isDirty}
          >
            {save.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
