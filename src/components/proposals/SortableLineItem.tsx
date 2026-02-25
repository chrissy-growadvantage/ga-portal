import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

type SortableLineItemProps = {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
};

export function SortableLineItem({ id, children, disabled }: SortableLineItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'py-3 border-b border-border/60 last:border-b-0',
        isDragging && 'opacity-50 bg-muted/30 rounded-lg z-10',
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className={cn(
            'shrink-0 mt-2 flex items-center justify-center min-h-[44px] min-w-[44px] cursor-grab text-muted-foreground/50 hover:text-muted-foreground touch-none transition-colors',
            isDragging && 'cursor-grabbing text-muted-foreground',
            disabled && 'cursor-default opacity-30',
          )}
          aria-label="Drag to reorder"
          aria-roledescription="sortable"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
