import { describe, it, expect } from 'vitest';
import { tiptapJSONSchema } from './proposal-schemas';

describe('tiptapJSONSchema', () => {
  it('validates a minimal doc', () => {
    const result = tiptapJSONSchema.safeParse({
      type: 'doc',
      content: [{ type: 'paragraph' }],
    });
    expect(result.success).toBe(true);
  });

  it('validates a doc with text content', () => {
    const result = tiptapJSONSchema.safeParse({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Hello world' }],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('validates a doc with marks', () => {
    const result = tiptapJSONSchema.safeParse({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Bold text',
              marks: [{ type: 'bold' }],
            },
          ],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('validates a doc with nested content (heading + list)', () => {
    const result = tiptapJSONSchema.safeParse({
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Title' }],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Item 1' }],
                },
              ],
            },
          ],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-doc type at root', () => {
    const result = tiptapJSONSchema.safeParse({
      type: 'paragraph',
      content: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing type field', () => {
    const result = tiptapJSONSchema.safeParse({
      content: [],
    });
    expect(result.success).toBe(false);
  });

  it('accepts empty doc', () => {
    const result = tiptapJSONSchema.safeParse({
      type: 'doc',
    });
    expect(result.success).toBe(true);
  });
});
