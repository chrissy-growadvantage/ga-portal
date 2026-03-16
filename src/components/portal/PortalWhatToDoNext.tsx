import { Button } from '@/components/ui/button';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PortalOnboardingStage } from '@/types/portal';

type PortalWhatToDoNextProps = {
  onboardingStages: PortalOnboardingStage[];
};

type NextAction = {
  message: string;
  actionLabel: string | null;
  actionUrl: string | null;
};

function resolveNextAction(stage: PortalOnboardingStage): NextAction {
  const label = stage.stage_label.toLowerCase();

  if (label.includes('contract')) {
    return {
      message: 'Please sign your contract to get started.',
      actionLabel: 'Sign Contract',
      actionUrl: stage.action_url,
    };
  }

  if (label.includes('intake')) {
    return {
      message: 'Please complete your intake form so we can hit the ground running.',
      actionLabel: 'Complete Intake Form',
      actionUrl: stage.action_url,
    };
  }

  if (label.includes('payment')) {
    return {
      message: 'Please set up your payment to activate your account.',
      actionLabel: 'Set Up Payment',
      actionUrl: stage.action_url,
    };
  }

  return {
    message: "You're all set for now — we'll be in touch shortly.",
    actionLabel: stage.action_url ? 'View Details' : null,
    actionUrl: stage.action_url,
  };
}

export function PortalWhatToDoNext({ onboardingStages }: PortalWhatToDoNextProps) {
  const clientStages = onboardingStages.filter((s) => s.owner_label === 'client');
  const nextStage = clientStages.find((s) => s.status !== 'done' && s.completed_at === null);

  if (!nextStage) return null;

  const { message, actionLabel, actionUrl } = resolveNextAction(nextStage);

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border px-5 py-4',
        'border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-900/10',
      )}
      role="status"
      aria-label="Action required"
    >
      <AlertCircle
        className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0"
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-1">
          Action needed
        </p>
        <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed">{message}</p>
      </div>
      {actionLabel && actionUrl && (
        <a
          href={actionUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 self-center"
        >
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/30"
          >
            {actionLabel}
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
            <span className="sr-only">(opens in new tab)</span>
          </Button>
        </a>
      )}
    </div>
  );
}
