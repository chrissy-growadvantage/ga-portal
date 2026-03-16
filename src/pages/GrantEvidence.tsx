import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Save, ClipboardList, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useGrantEvidence, useSaveGrantEvidence, defaultGrantEvidence } from '@/hooks/useGrantEvidence';
import type { GrantEvidencePilotClient, GrantEvidenceEndorsementStatus } from '@/types/database';

type GrantEvidenceData = typeof defaultGrantEvidence;

const endorsementBadge: Record<GrantEvidenceEndorsementStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  not_requested: { label: 'Not Requested', variant: 'secondary' },
  requested: { label: 'Requested', variant: 'default' },
  received: { label: 'Received ✓', variant: 'default' },
};

function PilotClientCard({
  label,
  data,
  onChange,
}: {
  label: string;
  data: GrantEvidencePilotClient;
  onChange: (updated: GrantEvidencePilotClient) => void;
}) {
  const { label: badgeLabel, variant } = endorsementBadge[data.endorsementStatus];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{label}</CardTitle>
          <Badge variant={variant}>{badgeLabel}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Client Name</Label>
            <Input
              value={data.name}
              onChange={(e) => onChange({ ...data, name: e.target.value })}
              placeholder="e.g. Acme Corp"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={data.startDate}
              onChange={(e) => onChange({ ...data, startDate: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Current Onboarding Stage</Label>
          <Input
            value={data.currentStage}
            onChange={(e) => onChange({ ...data, currentStage: e.target.value })}
            placeholder="e.g. Week 1 Started"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Notes</Label>
          <Textarea
            value={data.notes}
            onChange={(e) => onChange({ ...data, notes: e.target.value })}
            placeholder="Progress notes, observations..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Endorsement Status</Label>
            <Select
              value={data.endorsementStatus}
              onValueChange={(v) => onChange({ ...data, endorsementStatus: v as GrantEvidenceEndorsementStatus })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_requested">Not Requested</SelectItem>
                <SelectItem value="requested">Requested</SelectItem>
                <SelectItem value="received">Received</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Endorsement Storage Link</Label>
            <Input
              value={data.endorsementLink}
              onChange={(e) => onChange({ ...data, endorsementLink: e.target.value })}
              placeholder="https://drive.google.com/..."
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function GrantEvidence() {
  const { data: remote, isLoading } = useGrantEvidence();
  const { mutateAsync: saveToSupabase, isPending: isSaving } = useSaveGrantEvidence();
  const [data, setData] = useState<GrantEvidenceData>(defaultGrantEvidence);
  const [synced, setSynced] = useState(false);

  // Populate local state once remote data arrives
  useEffect(() => {
    if (remote && !synced) {
      setData(remote);
      setSynced(true);
    }
  }, [remote, synced]);

  const save = async () => {
    try {
      await saveToSupabase(data);
      toast.success('Grant evidence saved');
    } catch {
      toast.error('Failed to save — please try again');
    }
  };

  const completedChecklist = Object.values(data.checklist).filter(Boolean).length;
  const totalChecklist = Object.values(data.checklist).length;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList className="w-5 h-5 text-primary" />
            <h1 className="text-3xl font-extrabold tracking-tight">Grant Evidence</h1>
          </div>
          <p className="text-sm text-muted-foreground">Internal pilot tracking — not visible to clients.</p>
        </div>
        <Button onClick={save} className="gap-2" disabled={isLoading || isSaving}>
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save
        </Button>
      </div>

      {/* Pilot Clients */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Pilot Clients</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PilotClientCard
            label="Pilot Client A"
            data={data.clientA}
            onChange={(updated) => setData((d) => ({ ...d, clientA: updated }))}
          />
          <PilotClientCard
            label="Pilot Client B"
            data={data.clientB}
            onChange={(updated) => setData((d) => ({ ...d, clientB: updated }))}
          />
        </div>
      </div>

      {/* Evidence Checklist */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Evidence Checklist</CardTitle>
            <Badge variant={completedChecklist === totalChecklist ? 'default' : 'secondary'}>
              {completedChecklist}/{totalChecklist} complete
            </Badge>
          </div>
          <CardDescription>Required evidence for the grant application.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(
            [
              { key: 'screenshotsSaved', label: 'Screenshots saved (portal + operator views)' },
              { key: 'loomRecorded', label: 'Loom walkthrough recorded' },
              { key: 'usageNotesWritten', label: 'Usage notes written' },
            ] as const
          ).map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <Checkbox
                id={key}
                checked={data.checklist[key]}
                onCheckedChange={(checked) =>
                  setData((d) => ({ ...d, checklist: { ...d.checklist, [key]: !!checked } }))
                }
              />
              <Label htmlFor={key} className="cursor-pointer font-normal">
                {label}
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* KPI Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Manual KPI Fields</CardTitle>
          <CardDescription>Update these at the end of the pilot period.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Requests Submitted</Label>
            <Input
              type="number"
              min={0}
              value={data.kpis.requestsSubmitted}
              onChange={(e) => setData((d) => ({ ...d, kpis: { ...d.kpis, requestsSubmitted: e.target.value } }))}
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Requests Resolved</Label>
            <Input
              type="number"
              min={0}
              value={data.kpis.requestsResolved}
              onChange={(e) => setData((d) => ({ ...d, kpis: { ...d.kpis, requestsResolved: e.target.value } }))}
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Overdue Actions Count</Label>
            <Input
              type="number"
              min={0}
              value={data.kpis.overdueActionsCount}
              onChange={(e) => setData((d) => ({ ...d, kpis: { ...d.kpis, overdueActionsCount: e.target.value } }))}
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Estimated Time Saved (hrs)</Label>
            <Input
              type="number"
              min={0}
              step={0.5}
              value={data.kpis.estimatedTimeSavedHours}
              onChange={(e) =>
                setData((d) => ({ ...d, kpis: { ...d.kpis, estimatedTimeSavedHours: e.target.value } }))
              }
              placeholder="0"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
