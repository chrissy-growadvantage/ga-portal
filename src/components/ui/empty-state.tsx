import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  tip?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  tip,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center text-center py-10 px-4', className)}>
      <Icon className="w-10 h-10 text-muted-foreground" />
      <h3 className="text-base font-semibold mt-3">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>
      {tip && (
        <p className="text-xs text-muted-foreground italic mt-3 max-w-sm">{tip}</p>
      )}
      {action && (
        <Button className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
