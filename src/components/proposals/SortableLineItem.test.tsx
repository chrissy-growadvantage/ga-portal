import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableLineItem } from './SortableLineItem';

function renderSortable(props?: { disabled?: boolean }) {
  return render(
    <DndContext>
      <SortableContext items={['item-1']} strategy={verticalListSortingStrategy}>
        <SortableLineItem id="item-1" disabled={props?.disabled}>
          <p>Line item content</p>
        </SortableLineItem>
      </SortableContext>
    </DndContext>,
  );
}

function renderMultipleSortable() {
  return render(
    <DndContext>
      <SortableContext
        items={['item-1', 'item-2', 'item-3']}
        strategy={verticalListSortingStrategy}
      >
        <SortableLineItem id="item-1">
          <p>Item 1</p>
        </SortableLineItem>
        <SortableLineItem id="item-2">
          <p>Item 2</p>
        </SortableLineItem>
        <SortableLineItem id="item-3">
          <p>Item 3</p>
        </SortableLineItem>
      </SortableContext>
    </DndContext>,
  );
}

describe('SortableLineItem', () => {
  it('renders children content', () => {
    renderSortable();
    expect(screen.getByText('Line item content')).toBeInTheDocument();
  });

  it('renders drag handle with accessible label', () => {
    renderSortable();
    const handle = screen.getByLabelText('Drag to reorder');
    expect(handle).toBeInTheDocument();
    expect(handle.tagName.toLowerCase()).toBe('button');
  });

  it('drag handle has role button for accessibility', () => {
    renderSortable();
    const handle = screen.getByRole('button', { name: 'Drag to reorder' });
    expect(handle).toBeInTheDocument();
  });

  it('renders drag handle as disabled when disabled prop is true', () => {
    renderSortable({ disabled: true });
    const handle = screen.getByLabelText('Drag to reorder');
    expect(handle).toBeInTheDocument();
    expect(handle.className).toContain('opacity-30');
  });

  it('drag handle has touch-none class for proper touch handling', () => {
    renderSortable();
    const handle = screen.getByLabelText('Drag to reorder');
    expect(handle.className).toContain('touch-none');
  });

  it('renders multiple sortable items with individual drag handles', () => {
    renderMultipleSortable();
    const handles = screen.getAllByLabelText('Drag to reorder');
    expect(handles).toHaveLength(3);
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('drag handle has min-h-[44px] for mobile touch target', () => {
    renderSortable();
    const handle = screen.getByLabelText('Drag to reorder');
    expect(handle.className).toContain('min-h-[44px]');
  });

  it('drag handle has min-w-[44px] for mobile touch target', () => {
    renderSortable();
    const handle = screen.getByLabelText('Drag to reorder');
    expect(handle.className).toContain('min-w-[44px]');
  });
});
