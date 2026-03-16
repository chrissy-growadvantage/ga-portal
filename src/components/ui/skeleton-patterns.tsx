import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type SkeletonCardProps = { className?: string };

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-full" />
      </CardContent>
    </Card>
  );
}

type SkeletonListProps = { count?: number; className?: string };

export function SkeletonList({ count = 3, className }: SkeletonListProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <Skeleton className="h-4 w-4 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

type SkeletonStatProps = { className?: string };

export function SkeletonStat({ className }: SkeletonStatProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-7 w-24" />
    </div>
  );
}

export function SkeletonPortalSection({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardContent className="p-5 space-y-4">
        <Skeleton className="h-5 w-40" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CardContent>
    </Card>
  );
}
