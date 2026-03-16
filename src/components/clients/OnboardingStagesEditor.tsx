import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, ListChecks } from 'lucide-react';
import { toast } from 'sonner';
import { useOnboardingStages, useUpdateOnboardingStage, useInitOnboarding } from '@/hooks/useOnboardingStages';
import { ONBOARDING_STAGE_STATUS_CONFIG } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { OnboardingStage, OnboardingStageStatus, OnboardingStageOwner } from '@/types/database';

// ── Constants ──────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: OnboardingStageStatus; label: string }[] = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting_on_client', label: 'Waiting on Client' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'done', label: 'Done' },
];

const OWNER_OPTIONS: { value: OnboardingStageOwner; label: string }[] = [
  { value: 'operator', label: 'Operator' },
  { value: 'client', label: 'Client' },
];

const ALERT_STATUSES: OnboardingStageStatus[] = ['blocked', 'waiting_on_client'];

// ── Props ──────────────────────────────────────────────────────────────────────

interface OnboardingStagesEditorProps {
  clientId: string;
}

// ── Stage row ─────────────────────────────────────────────────────────────────

interface StageRowProps {
  stage: OnboardingStage;
  onUpdate: (field: keyof OnboardingStage, value: string) => void;
  isPending: boolean;
}

function StageRow({ stage, onUpdate, isPending }: StageRowProps) {
  const [notesValue, setNotesValue] = useState(stage.notes ?? '');
  const cfg = ONBOARDING_STAGE_STATUS_CONFIG[stage.status];
  const isAlert = ALERT_STATUSES.includes(stage.status);

  return (
    <Card
      className={cn(
        'transition-colors',
        isAlert && 'border-l-4 border-l-red-400',
      )}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-center gap-3">
          <span className="flex-1 font-medium text-sm">{stage.stage_label}</span>
          <Badge
            variant="secondary"
            className={cn('text-xs shrink-0', cfg.bgColor, cfg.color)}
          >
            {cfg.label}
          </Badge>
          {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
        </div>

        {/* Controls row */}
        <div className="grid grid-cols-3 gap-2">
          {/* Status */}
          <Select
            value={stage.status}
            onValueChange={(v) => onUpdate('status', v)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Owner */}
          <Select
            value={stage.owner_label}
            onValueChange={(v) => onUpdate('owner_label', v)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OWNER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Due date */}
          <Input
            type="date"
            className="h-8 text-xs"
            value={stage.due_date ?? ''}
            onChange={(e) => onUpdate('due_date', e.target.value)}
          />
        </div>

        {/* Notes */}
        <Textarea
          placeholder="Notes…"
          className="resize-none text-xs"
          rows={2}
          value={notesValue}
          onChange={(e) => setNotesValue(e.target.value)}
          onBlur={() => {
            const trimmed = notesValue.trim();
            if (trimmed !== (stage.notes ?? '').trim()) {
              onUpdate('notes', trimmed);
            }
          }}
        />
      </CardContent>
    </Card>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

export function OnboardingStagesEditor({ clientId }: OnboardingStagesEditorProps) {
  const { data: stages, isLoading } = useOnboardingStages(clientId);
  const updateStage = useUpdateOnboardingStage();
  const initOnboarding = useInitOnboarding();

  const handleInit = async () => {
    try {
      await initOnboarding.mutateAsync(clientId);
      toast.success('Onboarding stages created');
    } catch {
      toast.error('Failed to create onboarding stages');
    }
  };

  const handleUpdate = (stage: OnboardingStage, field: keyof OnboardingStage, value: string) => {
    updateStage.mutate(
      { id: stage.id, clientId, [field]: value || null },
      {
        onError: () => toast.error('Failed to save'),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!stages?.length) {
    return (
      <Card>
        <CardContent className="p-0 flex flex-col items-center text-center py-10 px-4">
          <ListChecks className="w-10 h-10 text-muted-foreground" />
          <h3 className="text-base font-semibold mt-3">No onboarding stages</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Set up the 8-step onboarding checklist for this client.
          </p>
          <Button
            size="sm"
            className="mt-4"
            onClick={() => void handleInit()}
            disabled={initOnboarding.isPending}
          >
            {initOnboarding.isPending && (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            )}
            Set up onboarding
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {stages.map((stage) => (
        <StageRow
          key={stage.id}
          stage={stage}
          onUpdate={(field, value) => handleUpdate(stage, field, value)}
          isPending={
            updateStage.isPending &&
            (updateStage.variables as { id: string }).id === stage.id
          }
        />
      ))}
    </div>
  );
}
