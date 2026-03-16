import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type EmptyStateVariant = 'default' | 'inline' | 'portal';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  tip?: string;
  action?: { label: string; onClick: () => void };
  variant?: EmptyStateVariant;
  className?: string;
};

const variantStyles: Record<EmptyStateVariant, { wrapper: string; icon: string }> = {
  default: {
    wrapper: 'py-10 px-4',
    icon: 'w-10 h-10',
  },
  inline: {
    wrapper: 'py-6 px-4',
    icon: 'w-8 h-8',
  },
  portal: {
    wrapper: 'py-8 px-4',
    icon: 'w-9 h-9',
  },
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  tip,
  action,
  variant = 'default',
  className,
}: EmptyStateProps) {
  const styles = variantStyles[variant];

  const content = (
    <div className={cn('flex flex-col items-center text-center', styles.wrapper, className)}>
      <Icon className={cn(styles.icon, 'text-muted-foreground')} />
      <h3 className={cn('font-semibold mt-3', variant === 'inline' ? 'text-sm' : 'text-base')}>
        {title}
      </h3>
      <p className={cn('text-muted-foreground mt-1 max-w-sm', variant === 'inline' ? 'text-xs' : 'text-sm')}>
        {description}
      </p>
      {tip && (
        <p className="text-xs text-muted-foreground italic mt-3 max-w-sm">{tip}</p>
      )}
      {action && (
        <Button
          className="mt-4"
          size={variant === 'inline' ? 'sm' : 'default'}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );

  if (variant === 'portal') {
    return (
      <Card>
        <CardContent className="p-0">{content}</CardContent>
      </Card>
    );
  }

  return content;
}
