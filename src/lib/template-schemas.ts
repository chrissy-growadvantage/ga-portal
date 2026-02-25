import { z } from 'zod';
import { tiptapJSONSchema } from './proposal-schemas';

export const templateCategorySchema = z.enum(['intro', 'deliverables', 'terms', 'custom']);

export type TemplateCategoryInput = z.infer<typeof templateCategorySchema>;

export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(100),
  description: z.string().max(500).optional(),
  content_json: tiptapJSONSchema,
  category: templateCategorySchema.optional(),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;

export const updateTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(100).optional(),
  description: z.string().max(500).optional(),
  content_json: tiptapJSONSchema.optional(),
  category: templateCategorySchema.optional(),
});

export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
