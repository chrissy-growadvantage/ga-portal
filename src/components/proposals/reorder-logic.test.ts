import { describe, it, expect } from 'vitest';

/**
 * Pure unit tests for the drag-and-drop reorder logic used in ProposalLineItems.
 *
 * This tests the core algorithm: given a list of items and a drag event
 * (source index → destination index), verify the resulting order is correct
 * and sort_order values are assigned sequentially.
 */

type LineItem = { name: string; sort_order: number };

function createItems(...names: string[]): LineItem[] {
  return names.map((name, i) => ({ name, sort_order: i }));
}

/**
 * Simulates the move operation used by useFieldArray.move()
 * and the sort_order reassignment done on save.
 */
function moveAndReindex(items: LineItem[], from: number, to: number): LineItem[] {
  const result = [...items];
  const [moved] = result.splice(from, 1);
  result.splice(to, 0, moved);
  return result.map((item, i) => ({ ...item, sort_order: i }));
}

describe('reorder logic', () => {
  it('moving item from position 2 to position 0 places it first', () => {
    const items = createItems('A', 'B', 'C');
    const result = moveAndReindex(items, 2, 0);
    expect(result.map((i) => i.name)).toEqual(['C', 'A', 'B']);
    expect(result.map((i) => i.sort_order)).toEqual([0, 1, 2]);
  });

  it('moving item from position 0 to position 2 places it last', () => {
    const items = createItems('A', 'B', 'C');
    const result = moveAndReindex(items, 0, 2);
    expect(result.map((i) => i.name)).toEqual(['B', 'C', 'A']);
    expect(result.map((i) => i.sort_order)).toEqual([0, 1, 2]);
  });

  it('moving item to same position returns unchanged order', () => {
    const items = createItems('A', 'B', 'C');
    const result = moveAndReindex(items, 1, 1);
    expect(result.map((i) => i.name)).toEqual(['A', 'B', 'C']);
    expect(result.map((i) => i.sort_order)).toEqual([0, 1, 2]);
  });

  it('works correctly with a single item', () => {
    const items = createItems('A');
    const result = moveAndReindex(items, 0, 0);
    expect(result.map((i) => i.name)).toEqual(['A']);
    expect(result.map((i) => i.sort_order)).toEqual([0]);
  });

  it('maintains sequential sort_order after multiple moves', () => {
    let items = createItems('A', 'B', 'C', 'D');
    items = moveAndReindex(items, 3, 0); // D, A, B, C
    items = moveAndReindex(items, 2, 1); // D, B, A, C
    expect(result(items)).toEqual(['D', 'B', 'A', 'C']);
    expect(items.map((i) => i.sort_order)).toEqual([0, 1, 2, 3]);
  });

  it('handles adjacent swap (move down one)', () => {
    const items = createItems('A', 'B', 'C');
    const swapped = moveAndReindex(items, 0, 1);
    expect(result(swapped)).toEqual(['B', 'A', 'C']);
    expect(swapped.map((i) => i.sort_order)).toEqual([0, 1, 2]);
  });

  it('handles adjacent swap (move up one)', () => {
    const items = createItems('A', 'B', 'C');
    const swapped = moveAndReindex(items, 2, 1);
    expect(result(swapped)).toEqual(['A', 'C', 'B']);
    expect(swapped.map((i) => i.sort_order)).toEqual([0, 1, 2]);
  });
});

function result(items: LineItem[]) {
  return items.map((i) => i.name);
}
