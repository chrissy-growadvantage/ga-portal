import { useMemo, useCallback } from 'react';
import { UseFormReturn, useFieldArray, Controller } from 'react-hook-form';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import type { CreateProposalInput } from '@/lib/proposal-schemas';
import { BILLING_TYPE_LABELS } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InlineDescriptionEditor } from '@/components/editor/InlineDescriptionEditor';
import { SortableLineItem } from './SortableLineItem';
import { Plus, X } from 'lucide-react';

const DEFAULT_LINE_ITEM = {
  name: '',
  description: '',
  description_json: null,
  quantity: 1,
  unit_price: 0,
  billing_type: 'one_time' as const,
  sort_order: 0,
};

interface ProposalLineItemsProps {
  form: UseFormReturn<CreateProposalInput>;
}

export function ProposalLineItems({ form }: ProposalLineItemsProps) {
  const {
    fields: lineItemFields,
    append: appendLineItem,
    remove: removeLineItem,
    move: moveLineItem,
  } = useFieldArray({ control: form.control, name: 'line_items' });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const sortableIds = useMemo(
    () => lineItemFields.map((f) => f.id),
    [lineItemFields],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = sortableIds.indexOf(active.id as string);
      const newIndex = sortableIds.indexOf(over.id as string);
      if (oldIndex !== -1 && newIndex !== -1) {
        moveLineItem(oldIndex, newIndex);
      }
    },
    [sortableIds, moveLineItem],
  );

  const addLineItem = () => {
    appendLineItem({ ...DEFAULT_LINE_ITEM, sort_order: lineItemFields.length });
  };

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Service Items</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {/* Column headers */}
        <div className="hidden lg:flex items-start gap-3 px-0 mb-2">
          <span className="shrink-0 w-6" />
          <div className="flex-1 grid grid-cols-4 gap-3">
            <p className="text-xs font-medium text-muted-foreground">Service</p>
            <p className="text-xs font-medium text-muted-foreground">Qty</p>
            <p className="text-xs font-medium text-muted-foreground">Unit Price</p>
            <p className="text-xs font-medium text-muted-foreground">Billing</p>
          </div>
          <span className="shrink-0 w-9" />
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortableIds}
            strategy={verticalListSortingStrategy}
          >
            {lineItemFields.map((field, index) => (
              <SortableLineItem
                key={field.id}
                id={field.id}
                disabled={lineItemFields.length <= 1}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <FormField
                      control={form.control}
                      name={`line_items.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2 lg:col-span-1">
                          <FormControl>
                            <Input placeholder="Service name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`line_items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              placeholder="Qty"
                              {...field}
                              onChange={(e) =>
                                field.onChange(e.target.value ? Number(e.target.value) : 0)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`line_items.${index}.unit_price`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="$ Price"
                              {...field}
                              onChange={(e) =>
                                field.onChange(e.target.value ? Number(e.target.value) : 0)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`line_items.${index}.billing_type`}
                      render={({ field }) => (
                        <FormItem>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(BILLING_TYPE_LABELS).map(([key, label]) => (
                                <SelectItem key={key} value={key}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive mt-1"
                    onClick={() => removeLineItem(index)}
                    disabled={lineItemFields.length <= 1}
                    aria-label={`Remove line item ${index + 1}`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                {/* Inline description editor */}
                <div className="mt-1">
                  <Controller
                    control={form.control}
                    name={`line_items.${index}.description_json`}
                    render={({ field: descField }) => (
                      <InlineDescriptionEditor
                        value={descField.value ?? form.getValues(`line_items.${index}.description`) ?? null}
                        onChange={(json, text) => {
                          descField.onChange(json);
                          form.setValue(`line_items.${index}.description`, text);
                        }}
                        onBlur={descField.onBlur}
                        placeholder="Add description for this service..."
                      />
                    )}
                  />
                </div>
              </SortableLineItem>
            ))}
          </SortableContext>
        </DndContext>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3 gap-2"
          onClick={addLineItem}
        >
          <Plus className="w-4 h-4" />
          Add Line Item
        </Button>
      </CardContent>
    </Card>
  );
}
