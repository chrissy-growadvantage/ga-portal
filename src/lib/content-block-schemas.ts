import { z } from 'zod';
import { tiptapJSONSchema } from './proposal-schemas';

export const contentBlockTypeSchema = z.enum(['rich_text', 'image_gallery', 'video_embed']);
export type ContentBlockTypeInput = z.infer<typeof contentBlockTypeSchema>;

export const richTextContentSchema = z.object({
  doc: tiptapJSONSchema,
});
export type RichTextContent = z.infer<typeof richTextContentSchema>;

const imageItemSchema = z.object({
  url: z.string().url(),
  alt: z.string(),
  caption: z.string().optional(),
});

export const imageGalleryContentSchema = z.object({
  images: z.array(imageItemSchema).min(1, 'At least one image is required'),
});
export type ImageGalleryContent = z.infer<typeof imageGalleryContentSchema>;

export const videoEmbedContentSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  caption: z.string().optional(),
});
export type VideoEmbedContent = z.infer<typeof videoEmbedContentSchema>;

export const contentBlockSchema = z.object({
  type: contentBlockTypeSchema,
  position: z.number().int().min(0),
  content_json: z.record(z.unknown()),
});
export type ContentBlockInput = z.infer<typeof contentBlockSchema>;
