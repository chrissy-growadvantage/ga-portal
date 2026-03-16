import { useState, useEffect, useMemo } from 'react';
import { Save, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Client } from '@/types/database';

// ── Props ──────────────────────────────────────────────────────────────────────

interface PortalLinksEditorProps {
  clientId: string;
  client: Client;
}

// ── Comms channel options ──────────────────────────────────────────────────────

const COMMS_CHANNELS = ['Slack', 'Email', 'Other'] as const;
type CommsChannel = (typeof COMMS_CHANNELS)[number];

// ── Form state ─────────────────────────────────────────────────────────────────

type FormState = {
  integrator_name: string;
  primary_comms_channel: string;
  portal_stripe_url: string;
  portal_intake_url: string;
  portal_slack_url: string;
  portal_drive_url: string;
  portal_booking_url: string;
  next_meeting_at: string;
  next_meeting_link: string;
};

function fromClient(client: Client): FormState {
  return {
    integrator_name: client.integrator_name ?? '',
    primary_comms_channel: client.primary_comms_channel ?? '',
    portal_stripe_url: client.portal_stripe_url ?? '',
    portal_intake_url: client.portal_intake_url ?? '',
    portal_slack_url: client.portal_slack_url ?? '',
    portal_drive_url: client.portal_drive_url ?? '',
    portal_booking_url: client.portal_booking_url ?? '',
    next_meeting_at: client.next_meeting_at
      ? client.next_meeting_at.slice(0, 16) // format for datetime-local input
      : '',
    next_meeting_link: client.next_meeting_link ?? '',
  };
}

// ── URL field keys that need http/https validation ─────────────────────────────

const URL_FIELDS: (keyof FormState)[] = [
  'portal_stripe_url',
  'portal_intake_url',
  'portal_slack_url',
  'portal_drive_url',
  'portal_booking_url',
  'next_meeting_link',
];

function isValidUrl(value: string) {
  if (!value) return true; // empty is fine
  return value.startsWith('http://') || value.startsWith('https://');
}

// ── Component ──────────────────────────────────────────────────────────────────

export function PortalLinksEditor({ clientId, client }: PortalLinksEditorProps) {
  const [form, setForm] = useState<FormState>(fromClient(client));
  const [saving, setSaving] = useState(false);
  const [initialForm, setInitialForm] = useState<FormState>(fromClient(client));
  const qc = useQueryClient();

  // Sync if client prop changes (e.g. after a refetch)
  useEffect(() => {
    const next = fromClient(client);
    setForm(next);
    setInitialForm(next);
  }, [client]);

  const isDirty = useMemo(
    () => (Object.keys(form) as (keyof FormState)[]).some((k) => form[k] !== initialForm[k]),
    [form, initialForm],
  );

  const urlErrors = useMemo(
    () =>
      URL_FIELDS.filter((field) => !isValidUrl(form[field])),
    [form],
  );

  const set = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          integrator_name: form.integrator_name || null,
          primary_comms_channel: form.primary_comms_channel || null,
          portal_stripe_url: form.portal_stripe_url || null,
          portal_intake_url: form.portal_intake_url || null,
          portal_slack_url: form.portal_slack_url || null,
          portal_drive_url: form.portal_drive_url || null,
          portal_booking_url: form.portal_booking_url || null,
          next_meeting_at: form.next_meeting_at
            ? new Date(form.next_meeting_at).toISOString()
            : null,
          next_meeting_link: form.next_meeting_link || null,
        })
        .eq('id', clientId);

      if (error) throw error;

      await qc.invalidateQueries({ queryKey: queryKeys.clients.detail(clientId) });
      await qc.invalidateQueries({ queryKey: queryKeys.clients.all });
      toast.success('Portal links saved');
    } catch {
      toast.error('Failed to save portal links');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Portal Links & Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Operator / integrator */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="integrator_name" className="text-xs">Integrator name</Label>
            <Input
              id="integrator_name"
              placeholder="e.g. Sarah OBM"
              value={form.integrator_name}
              onChange={(e) => set('integrator_name', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="primary_comms" className="text-xs">Primary comms channel</Label>
            <Select
              value={form.primary_comms_channel || ''}
              onValueChange={(v) => set('primary_comms_channel', v)}
            >
              <SelectTrigger id="primary_comms">
                <SelectValue placeholder="Select channel" />
              </SelectTrigger>
              <SelectContent>
                {COMMS_CHANNELS.map((ch) => (
                  <SelectItem key={ch} value={ch}>
                    {ch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Payment & Intake */}
        <div className="grid grid-cols-1 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="stripe_url" className="text-xs">Stripe payment URL</Label>
            <Input
              id="stripe_url"
              type="url"
              placeholder="https://buy.stripe.com/…"
              value={form.portal_stripe_url}
              onChange={(e) => set('portal_stripe_url', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="intake_url" className="text-xs">Intake form URL</Label>
            <Input
              id="intake_url"
              type="url"
              placeholder="https://forms.gle/… or Typeform URL"
              value={form.portal_intake_url}
              onChange={(e) => set('portal_intake_url', e.target.value)}
            />
          </div>
        </div>

        {/* Meeting */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Next Meeting
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="next_meeting_at" className="text-xs">Date & time</Label>
              <Input
                id="next_meeting_at"
                type="datetime-local"
                value={form.next_meeting_at}
                onChange={(e) => set('next_meeting_at', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="next_meeting_link" className="text-xs">Meeting link</Label>
              <Input
                id="next_meeting_link"
                type="url"
                placeholder="https://zoom.us/j/…"
                value={form.next_meeting_link}
                onChange={(e) => set('next_meeting_link', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Additional portal links */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Additional links
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="slack_url" className="text-xs">Slack channel URL</Label>
            <Input
              id="slack_url"
              type="url"
              placeholder="https://app.slack.com/client/…"
              value={form.portal_slack_url}
              onChange={(e) => set('portal_slack_url', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="drive_url" className="text-xs">Google Drive URL</Label>
            <Input
              id="drive_url"
              type="url"
              placeholder="https://drive.google.com/…"
              value={form.portal_drive_url}
              onChange={(e) => set('portal_drive_url', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="booking_url" className="text-xs">Booking / calendar URL</Label>
            <Input
              id="booking_url"
              type="url"
              placeholder="https://calendly.com/…"
              value={form.portal_booking_url}
              onChange={(e) => set('portal_booking_url', e.target.value)}
            />
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
            {urlErrors.length > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                URLs must start with http:// or https://
              </span>
            )}
          </div>
          <Button size="sm" onClick={() => void handleSave()} disabled={saving || urlErrors.length > 0}>
            {saving ? (
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
