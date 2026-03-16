import { useState } from 'react';
import { Plus, Trash2, Loader2, ChevronUp, ChevronDown, List } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
  usePickLists,
  useCreatePickListItem,
  useUpdatePickListItem,
  useDeletePickListItem,
  useSeedPickLists,
} from '@/hooks/usePickLists';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { PickListItem, PickListType } from '@/types/database';

// ── Panel config ───────────────────────────────────────────────────────────────

const PANELS: { key: PickListType; label: string; description: string }[] = [
  {
    key: 'phase',
    label: 'Phase',
    description: 'Engagement phases shown in monthly snapshot priorities.',
  },
  {
    key: 'category',
    label: 'Category',
    description: 'Work categories for priorities and ad-hoc requests.',
  },
  {
    key: 'uplift',
    label: 'Uplift / Value',
    description: 'Business impact descriptions for the snapshot report.',
  },
  {
    key: 'work_status',
    label: 'Work Status',
    description: 'Status options for priority items (supports custom colours).',
  },
];

// ── Add-item form ──────────────────────────────────────────────────────────────

interface AddItemFormProps {
  listType: PickListType;
  currentCount: number;
  showColour: boolean;
  onCancel: () => void;
}

function AddItemForm({ listType, currentCount, showColour, onCancel }: AddItemFormProps) {
  const [label, setLabel] = useState('');
  const [colour, setColour] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const createItem = useCreatePickListItem();

  const handleSubmit = async () => {
    const trimmed = label.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      const session = await supabase.auth.getSession();
      const operatorId = session.data.session?.user.id;
      if (!operatorId) throw new Error('Not authenticated');

      await createItem.mutateAsync({
        operator_id: operatorId,
        list_type: listType,
        label: trimmed,
        colour: colour || null,
        sort_order: currentCount,
      });

      toast.success('Item added');
      onCancel();
    } catch {
      toast.error('Failed to add item');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/40 rounded-lg">
      <Input
        placeholder="Label"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void handleSubmit();
          if (e.key === 'Escape') onCancel();
        }}
        className="h-8 text-sm flex-1"
        autoFocus
      />
      {showColour && (
        <div className="flex items-center gap-1.5">
          <input
            type="color"
            value={colour || '#6366f1'}
            onChange={(e) => setColour(e.target.value)}
            className="w-7 h-7 rounded border cursor-pointer"
            title="Colour (optional)"
          />
        </div>
      )}
      <Button
        size="sm"
        className="h-8 shrink-0"
        disabled={!label.trim() || submitting}
        onClick={() => void handleSubmit()}
      >
        {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Add'}
      </Button>
      <Button variant="ghost" size="sm" className="h-8 shrink-0" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}

// ── Item row ───────────────────────────────────────────────────────────────────

interface ItemRowProps {
  item: PickListItem;
  showColour: boolean;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function ItemRow({ item, showColour, isFirst, isLast, onMoveUp, onMoveDown }: ItemRowProps) {
  const updateItem = useUpdatePickListItem();
  const deleteItem = useDeletePickListItem();

  const toggleActive = () => {
    updateItem.mutate(
      { id: item.id, is_active: !item.is_active },
      { onError: () => toast.error('Failed to update') },
    );
  };

  const handleDelete = async () => {
    try {
      await deleteItem.mutateAsync({ id: item.id, listType: item.list_type });
      toast.success('Item deleted');
    } catch {
      toast.error('Failed to delete item');
    }
  };

  return (
    <div className="flex items-center gap-2 py-2 px-2 hover:bg-muted/30 rounded-lg group">
      {/* Up/down reorder buttons */}
      <div className="flex flex-col shrink-0">
        <button
          className="h-3.5 w-4 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed"
          onClick={onMoveUp}
          disabled={isFirst}
          aria-label="Move up"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button
          className="h-3.5 w-4 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed"
          onClick={onMoveDown}
          disabled={isLast}
          aria-label="Move down"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {showColour && (
        <div
          className="w-3 h-3 rounded-full shrink-0 border"
          style={{ backgroundColor: item.colour ?? '#d1d5db' }}
          title={item.colour ?? 'No colour'}
        />
      )}

      <span className={`flex-1 text-sm ${item.is_active ? '' : 'line-through text-muted-foreground'}`}>
        {item.label}
      </span>

      <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <Switch
          checked={item.is_active}
          onCheckedChange={toggleActive}
          aria-label={item.is_active ? 'Deactivate' : 'Activate'}
          className="scale-75"
        />

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete item?</AlertDialogTitle>
              <AlertDialogDescription>
                "{item.label}" will be permanently removed from the list.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => void handleDelete()}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// ── Panel ──────────────────────────────────────────────────────────────────────

interface PanelProps {
  panelKey: PickListType;
  label: string;
  description: string;
}

function Panel({ panelKey, label, description }: PanelProps) {
  const [adding, setAdding] = useState(false);
  const { data: items, isLoading } = usePickLists(panelKey);
  const seedPickLists = useSeedPickLists();
  const updateItem = useUpdatePickListItem();
  const showColour = panelKey === 'work_status';

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (!items) return;
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const current = items[index];
    const swapWith = items[swapIndex];
    if (!swapWith) return;

    // Swap sort_order values between the two items
    updateItem.mutate(
      { id: current.id, sort_order: swapWith.sort_order },
      { onError: () => toast.error('Failed to reorder') },
    );
    updateItem.mutate(
      { id: swapWith.id, sort_order: current.sort_order },
      { onError: () => toast.error('Failed to reorder') },
    );
  };

  const handleSeed = async () => {
    try {
      await seedPickLists.mutateAsync();
      toast.success('Default items seeded');
    } catch {
      toast.error('Failed to seed defaults');
    }
  };

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{description}</p>

      {isLoading ? (
        <div className="space-y-1.5 pt-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg" />
          ))}
        </div>
      ) : !items?.length && !adding ? (
        <div className="text-center py-6 space-y-3">
          <p className="text-sm text-muted-foreground">No items yet.</p>
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleSeed()}
              disabled={seedPickLists.isPending}
            >
              {seedPickLists.isPending && (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
              )}
              Seed defaults
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setAdding(true)}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add item
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-0.5 pt-1">
          {items?.map((item, index) => (
            <ItemRow
              key={item.id}
              item={item}
              showColour={showColour}
              isFirst={index === 0}
              isLast={index === items.length - 1}
              onMoveUp={() => handleMove(index, 'up')}
              onMoveDown={() => handleMove(index, 'down')}
            />
          ))}

          {adding && (
            <AddItemForm
              listType={panelKey}
              currentCount={items?.length ?? 0}
              showColour={showColour}
              onCancel={() => setAdding(false)}
            />
          )}

          {!adding && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-1 text-muted-foreground"
              onClick={() => setAdding(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add item
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

export function PickListsSettings() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <List className="w-4.5 h-4.5" />
          Pick Lists
        </h2>
        <p className="text-sm text-muted-foreground">
          Customise the dropdown options used across monthly snapshots and reports.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Accordion type="multiple" className="divide-y">
            {PANELS.map((panel) => (
              <AccordionItem key={panel.key} value={panel.key} className="border-0">
                <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline">
                  {panel.label}
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <Panel
                    panelKey={panel.key}
                    label={panel.label}
                    description={panel.description}
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
