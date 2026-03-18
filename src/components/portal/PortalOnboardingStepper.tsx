import { CheckCircle2, AlertTriangle, ShieldAlert, Circle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { ONBOARDING_STAGE_STATUS_CONFIG } from '@/lib/constants';
import { SkeletonPortalSection } from '@/components/ui/skeleton-patterns';
import type { PortalOnboardingStage } from '@/types/portal';
import type { OnboardingStageStatus } from '@/types/database';

type PortalOnboardingStepperProps = {
  stages: PortalOnboardingStage[];
  isLoading?: boolean;
};

const STATUS_ICONS: Record<OnboardingStageStatus, React.ElementType> = {
  done: CheckCircle2,
  in_progress: Loader2,
  waiting_on_client: AlertTriangle,
  blocked: ShieldAlert,
  not_started: Circle,
};

function getActionLabel(stageLabel: string): string {
  const lower = stageLabel.toLowerCase();
  if (lower.includes('contract')) return 'Sign Contract';
  if (lower.includes('intake')) return 'Complete Form';
  if (lower.includes('payment')) return 'Set Up Payment';
  if (lower.includes('kickoff')) return 'Book Kickoff';
  return 'Take Action';
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy');
  } catch {
    return null;
  }
}

function StepIcon({ status }: { status: OnboardingStageStatus }) {
  const cfg = ONBOARDING_STAGE_STATUS_CONFIG[status];
  const Icon = STATUS_ICONS[status];

  return (
    <div
      className={cn(
        'w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10',
        cfg.bgColor,
      )}
      aria-hidden="true"
    >
      <Icon
        className={cn(
          'w-3.5 h-3.5',
          cfg.color,
          status === 'in_progress' && 'animate-spin',
        )}
      />
    </div>
  );
}

export function PortalOnboardingStepper({ stages, isLoading = false }: PortalOnboardingStepperProps) {
  if (isLoading) {
    return <SkeletonPortalSection />;
  }

  if (stages.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Onboarding hasn't been set up yet.
      </div>
    );
  }

  const sorted = [...stages].sort((a, b) => a.sort_order - b.sort_order);
  const doneCount = sorted.filter((s) => s.status === 'done').length;
  const total = sorted.length;

  return (
    <div>
      {/* Progress summary */}
      <p className="text-xs text-muted-foreground mb-4">
        <span className="font-semibold text-foreground">{doneCount} of {total}</span> complete
      </p>

      {/* Stepper */}
      <div className="relative">
        {/* Vertical connecting line */}
        <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-border/60" aria-hidden="true" />

        <div className="space-y-0">
          {sorted.map((stage, index) => {
            const cfg = ONBOARDING_STAGE_STATUS_CONFIG[stage.status];
            const isDone = stage.status === 'done';
            const isExpanded =
              stage.status === 'in_progress' ||
              stage.status === 'waiting_on_client' ||
              stage.status === 'blocked';
            const isLast = index === sorted.length - 1;
            const needsLeftBorder =
              stage.status === 'waiting_on_client' || stage.status === 'blocked';

            return (
              <div
                key={stage.id}
                className={cn(
                  'relative flex gap-4 pb-6',
                  isLast && 'pb-0',
                )}
              >
                {/* Icon */}
                <div className="flex flex-col items-center">
                  <StepIcon status={stage.status} />
                </div>

                {/* Content */}
                <div
                  className={cn(
                    'flex-1 min-w-0',
                    isLast && 'pb-0',
                    needsLeftBorder && 'border-l-4 border-destructive pl-3 -ml-1',
                  )}
                >
                  {isDone ? (
                    /* Condensed: done */
                    <div className="flex items-center gap-2 min-h-[24px]">
                      <p className={cn('text-sm font-medium', cfg.color)}>
                        {stage.stage_label}
                      </p>
                      {stage.completed_at && (
                        <span className="text-xs text-muted-foreground">
                          {formatDate(stage.completed_at)}
                        </span>
                      )}
                    </div>
                  ) : (
                    /* Expanded: active / blocked / not started */
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap min-h-[24px]">
                        <p className="text-sm font-medium">{stage.stage_label}</p>
                        <Badge
                          variant="secondary"
                          className={cn('text-xs', cfg.bgColor, cfg.color)}
                        >
                          {cfg.label}
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {stage.owner_label === 'client' ? 'You' : 'Operator'}
                        </Badge>
                      </div>

                      {isExpanded && (
                        <>
                          {stage.due_date && (
                            <p className="text-xs text-muted-foreground">
                              Due {formatDate(stage.due_date)}
                            </p>
                          )}
                          {stage.notes && (
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {stage.notes}
                            </p>
                          )}
                          {stage.action_url && (
                            <a
                              href={stage.action_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button
                                size="sm"
                                className="gap-1.5 h-9 text-xs mt-1 min-h-[44px]"
                              >
                                {getActionLabel(stage.stage_label)}
                                <ExternalLink className="w-3 h-3" aria-hidden="true" />
                                <span className="sr-only">(opens in new tab)</span>
                              </Button>
                            </a>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
