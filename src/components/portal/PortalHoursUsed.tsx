import { Clock } from 'lucide-react';

type PortalHoursUsedProps = {
  hoursUsed: number | null;
};

export function PortalHoursUsed({ hoursUsed }: PortalHoursUsedProps) {
  const display = hoursUsed && hoursUsed > 0 ? `${hoursUsed}` : null;

  return (
    <div className="rounded-xl border border-border/60 bg-background px-5 py-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Clock className="w-4 h-4 text-primary" aria-hidden="true" />
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Hours used this month
        </p>
        <p className="text-lg font-bold tracking-tight mt-0.5">
          {display !== null ? `${display} hrs` : '—'}
        </p>
      </div>
    </div>
  );
}
