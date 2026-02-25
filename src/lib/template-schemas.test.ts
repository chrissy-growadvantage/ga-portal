import { describe, it, expect } from 'vitest';
import { createTemplateSchema, updateTemplateSchema, templateCategorySchema } from './template-schemas';

const validContentJson = {
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }],
};

describe('templateCategorySchema', () => {
  it.each(['intro', 'deliverables', 'terms', 'custom'] as const)(
    'accepts category "%s"',
    (category) => {
      const result = templateCategorySchema.safeParse(category);
      expect(result.success).toBe(true);
    },
  );

  it('rejects invalid category', () => {
    const result = templateCategorySchema.safeParse('invalid');
    expect(result.success).toBe(false);
  });
});

describe('createTemplateSchema', () => {
  it('validates a complete template', () => {
    const result = createTemplateSchema.safeParse({
      name: 'My Template',
      description: 'A great template',
      content_json: validContentJson,
      category: 'intro',
    });
    expect(result.success).toBe(true);
  });

  it('validates with minimal fields', () => {
    const result = createTemplateSchema.safeParse({
      name: 'Minimal',
      content_json: validContentJson,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = createTemplateSchema.safeParse({
      name: '',
      content_json: validContentJson,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Template name is required');
    }
  });

  it('rejects name over 100 characters', () => {
    const result = createTemplateSchema.safeParse({
      name: 'a'.repeat(101),
      content_json: validContentJson,
    });
    expect(result.success).toBe(false);
  });

  it('rejects description over 500 characters', () => {
    const result = createTemplateSchema.safeParse({
      name: 'Valid',
      description: 'a'.repeat(501),
      content_json: validContentJson,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid content_json (not a doc)', () => {
    const result = createTemplateSchema.safeParse({
      name: 'Test',
      content_json: { type: 'paragraph' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing content_json', () => {
    const result = createTemplateSchema.safeParse({
      name: 'Test',
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional description as undefined', () => {
    const result = createTemplateSchema.safeParse({
      name: 'No description',
      content_json: validContentJson,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeUndefined();
    }
  });

  it('accepts optional category as undefined', () => {
    const result = createTemplateSchema.safeParse({
      name: 'No category',
      content_json: validContentJson,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBeUndefined();
    }
  });
});

describe('updateTemplateSchema', () => {
  it('validates partial update with just name', () => {
    const result = updateTemplateSchema.safeParse({
      name: 'Updated Name',
    });
    expect(result.success).toBe(true);
  });

  it('validates partial update with just description', () => {
    const result = updateTemplateSchema.safeParse({
      description: 'Updated description',
    });
    expect(result.success).toBe(true);
  });

  it('validates partial update with just content_json', () => {
    const result = updateTemplateSchema.safeParse({
      content_json: validContentJson,
    });
    expect(result.success).toBe(true);
  });

  it('validates partial update with just category', () => {
    const result = updateTemplateSchema.safeParse({
      category: 'terms',
    });
    expect(result.success).toBe(true);
  });

  it('validates full update', () => {
    const result = updateTemplateSchema.safeParse({
      name: 'Updated',
      description: 'New desc',
      content_json: validContentJson,
      category: 'deliverables',
    });
    expect(result.success).toBe(true);
  });

  it('validates empty update (no fields)', () => {
    const result = updateTemplateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects invalid name in update', () => {
    const result = updateTemplateSchema.safeParse({
      name: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid content_json in update', () => {
    const result = updateTemplateSchema.safeParse({
      content_json: { type: 'not-doc' },
    });
    expect(result.success).toBe(false);
  });
});
