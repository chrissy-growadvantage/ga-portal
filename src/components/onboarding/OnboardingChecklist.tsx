import { CheckCircle2, Circle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ChecklistStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  action?: () => void;
  actionLabel?: string;
}

interface OnboardingChecklistProps {
  steps: ChecklistStep[];
}

export function OnboardingChecklist({ steps }: OnboardingChecklistProps) {
  const allComplete = steps.every(s => s.completed);

  if (allComplete) return null; // Hide when done

  return (
    <Card>
      <CardContent className="p-5">
        <h2 className="text-lg font-semibold mb-1">Welcome to Luma</h2>
        <p className="text-sm text-muted-foreground mb-4">
          You're 3 steps away from showing clients the value you deliver.
        </p>

        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-start gap-3 p-3 rounded-lg border animate-fade-in opacity-0 ${
                step.completed ? 'bg-muted/30 border-border/60' : 'bg-background border-border'
              }`}
              style={{ animationDelay: `${(index + 1) * 150}ms` }}
            >
              {step.completed ? (
                <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              )}

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${
                  step.completed ? 'text-muted-foreground' : 'text-foreground'
                }`}>
                  {step.title}
                </p>
                {!step.completed && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {step.description}
                  </p>
                )}
              </div>

              {!step.completed && step.action && (
                <Button size="sm" onClick={step.action}>
                  {step.actionLabel || 'Start'}
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
