import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Save, Loader2, AlertTriangle, Upload, X, FileText } from 'lucide-react';
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
  portal_proposal_url: string;
  portal_contract_url: string;
  portal_contract_pdf_url: string;
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
    portal_proposal_url: client.portal_proposal_url ?? '',
    portal_contract_url: client.portal_contract_url ?? '',
    portal_contract_pdf_url: client.portal_contract_pdf_url ?? '',
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
  'portal_proposal_url',
  'portal_contract_url',
  'portal_contract_pdf_url',
  'next_meeting_link',
];

function isValidUrl(value: string) {
  if (!value) return true; // empty is fine
  return value.startsWith('http://') || value.startsWith('https://');
}

// ── Component ──────────────────────────────────────────────────────────────────

async function uploadClientDoc(clientId: string, field: 'proposal' | 'contract', file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'pdf';
  const path = `${clientId}/${field}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from('client-documents')
    .upload(path, file, { upsert: true });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from('client-documents').getPublicUrl(path);
  return data.publicUrl;
}

export function PortalLinksEditor({ clientId, client }: PortalLinksEditorProps) {
  const [form, setForm] = useState<FormState>(fromClient(client));
  const [saving, setSaving] = useState(false);
  const [initialForm, setInitialForm] = useState<FormState>(fromClient(client));
  const [uploadingProposal, setUploadingProposal] = useState(false);
  const [uploadingContractPdf, setUploadingContractPdf] = useState(false);
  const proposalInputRef = useRef<HTMLInputElement>(null);
  const contractPdfInputRef = useRef<HTMLInputElement>(null);
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
          portal_proposal_url: form.portal_proposal_url || null,
          portal_contract_url: form.portal_contract_url || null,
          portal_contract_pdf_url: form.portal_contract_pdf_url || null,
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

  const handleDocUpload = useCallback(async (field: 'proposal' | 'contract-pdf', file: File) => {
    const setUploading = field === 'proposal' ? setUploadingProposal : setUploadingContractPdf;
    const formField: keyof FormState = field === 'proposal' ? 'portal_proposal_url' : 'portal_contract_pdf_url';
    const label = field === 'proposal' ? 'Proposal' : 'Contract PDF';
    setUploading(true);
    try {
      const url = await uploadClientDoc(clientId, field === 'contract-pdf' ? 'contract' : field, file);
      set(formField, url);
      toast.success(`${label} uploaded`);
    } catch {
      toast.error('Upload failed — check file size and try again');
    } finally {
      setUploading(false);
    }
  }, [clientId]);

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

        {/* Proposal & Contract documents */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Documents
          </p>

          {/* Proposal */}
          <div className="space-y-1.5">
            <Label htmlFor="proposal_url" className="text-xs">Proposal (link or PDF)</Label>
            <div className="flex gap-2">
              <Input
                id="proposal_url"
                type="url"
                placeholder="https://… or upload a PDF"
                value={form.portal_proposal_url}
                onChange={(e) => set('portal_proposal_url', e.target.value)}
                className="flex-1"
              />
              <input
                ref={proposalInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleDocUpload('proposal', f);
                  e.target.value = '';
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5"
                onClick={() => proposalInputRef.current?.click()}
                disabled={uploadingProposal}
              >
                {uploadingProposal ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                Upload
              </Button>
              {form.portal_proposal_url && (
                <a href={form.portal_proposal_url} target="_blank" rel="noopener noreferrer">
                  <Button type="button" variant="ghost" size="sm" className="shrink-0 gap-1">
                    <FileText className="w-3.5 h-3.5" />
                  </Button>
                </a>
              )}
            </div>
          </div>

          {/* Contract SignWell link */}
          <div className="space-y-1.5">
            <Label htmlFor="contract_url" className="text-xs">Signed contract — SignWell link</Label>
            <div className="flex gap-2">
              <Input
                id="contract_url"
                type="url"
                placeholder="https://app.signwell.com/…"
                value={form.portal_contract_url}
                onChange={(e) => set('portal_contract_url', e.target.value)}
                className="flex-1"
              />
              {form.portal_contract_url && (
                <a href={form.portal_contract_url} target="_blank" rel="noopener noreferrer">
                  <Button type="button" variant="ghost" size="sm" className="shrink-0 gap-1">
                    <FileText className="w-3.5 h-3.5" />
                  </Button>
                </a>
              )}
            </div>
          </div>

          {/* Contract PDF copy upload */}
          <div className="space-y-1.5">
            <Label htmlFor="contract_pdf" className="text-xs">Signed contract — uploaded PDF copy</Label>
            <div className="flex gap-2">
              <Input
                id="contract_pdf"
                type="url"
                placeholder="Upload a PDF or paste a hosted URL"
                value={form.portal_contract_pdf_url}
                onChange={(e) => set('portal_contract_pdf_url', e.target.value)}
                className="flex-1"
              />
              <input
                ref={contractPdfInputRef}
                type="file"
                className="hidden"
                accept=".pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleDocUpload('contract-pdf', f);
                  e.target.value = '';
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5"
                onClick={() => contractPdfInputRef.current?.click()}
                disabled={uploadingContractPdf}
              >
                {uploadingContractPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                Upload
              </Button>
              {form.portal_contract_pdf_url && (
                <a href={form.portal_contract_pdf_url} target="_blank" rel="noopener noreferrer">
                  <Button type="button" variant="ghost" size="sm" className="shrink-0 gap-1">
                    <FileText className="w-3.5 h-3.5" />
                  </Button>
                </a>
              )}
            </div>
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
