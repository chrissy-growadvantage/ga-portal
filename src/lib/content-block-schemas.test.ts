import { describe, it, expect } from 'vitest';
import {
  contentBlockSchema,
  richTextContentSchema,
  imageGalleryContentSchema,
  videoEmbedContentSchema,
  contentBlockTypeSchema,
} from './content-block-schemas';

describe('contentBlockTypeSchema', () => {
  it('accepts valid block types', () => {
    expect(contentBlockTypeSchema.safeParse('rich_text').success).toBe(true);
    expect(contentBlockTypeSchema.safeParse('image_gallery').success).toBe(true);
    expect(contentBlockTypeSchema.safeParse('video_embed').success).toBe(true);
  });

  it('rejects invalid block types', () => {
    expect(contentBlockTypeSchema.safeParse('unknown').success).toBe(false);
    expect(contentBlockTypeSchema.safeParse('').success).toBe(false);
  });
});

describe('richTextContentSchema', () => {
  it('validates valid rich text content', () => {
    const result = richTextContentSchema.safeParse({
      doc: { type: 'doc', content: [{ type: 'paragraph' }] },
    });
    expect(result.success).toBe(true);
  });

  it('validates rich text with nested content', () => {
    const result = richTextContentSchema.safeParse({
      doc: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Terms & Conditions' }],
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Some terms here.' }],
          },
        ],
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing doc field', () => {
    const result = richTextContentSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('imageGalleryContentSchema', () => {
  it('validates valid image gallery with one image', () => {
    const result = imageGalleryContentSchema.safeParse({
      images: [
        { url: 'https://example.com/img.jpg', alt: 'Test image', caption: 'A caption' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('validates gallery with multiple images', () => {
    const result = imageGalleryContentSchema.safeParse({
      images: [
        { url: 'https://example.com/1.jpg', alt: 'First' },
        { url: 'https://example.com/2.jpg', alt: 'Second', caption: 'Second image' },
        { url: 'https://example.com/3.jpg', alt: '' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty images array', () => {
    const result = imageGalleryContentSchema.safeParse({ images: [] });
    expect(result.success).toBe(false);
  });

  it('rejects image without url', () => {
    const result = imageGalleryContentSchema.safeParse({
      images: [{ alt: 'No url' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid url', () => {
    const result = imageGalleryContentSchema.safeParse({
      images: [{ url: 'not-a-url', alt: 'Bad url' }],
    });
    expect(result.success).toBe(false);
  });
});

describe('videoEmbedContentSchema', () => {
  it('validates YouTube URL', () => {
    const result = videoEmbedContentSchema.safeParse({
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    });
    expect(result.success).toBe(true);
  });

  it('validates Vimeo URL', () => {
    const result = videoEmbedContentSchema.safeParse({
      url: 'https://vimeo.com/123456789',
    });
    expect(result.success).toBe(true);
  });

  it('validates with optional caption', () => {
    const result = videoEmbedContentSchema.safeParse({
      url: 'https://www.youtube.com/watch?v=abc123',
      caption: 'Watch this video',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing url', () => {
    const result = videoEmbedContentSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects invalid url', () => {
    const result = videoEmbedContentSchema.safeParse({ url: 'not-a-url' });
    expect(result.success).toBe(false);
  });
});

describe('contentBlockSchema', () => {
  it('validates a rich_text block', () => {
    const result = contentBlockSchema.safeParse({
      type: 'rich_text',
      position: 0,
      content_json: {
        doc: { type: 'doc', content: [{ type: 'paragraph' }] },
      },
    });
    expect(result.success).toBe(true);
  });

  it('validates an image_gallery block', () => {
    const result = contentBlockSchema.safeParse({
      type: 'image_gallery',
      position: 1,
      content_json: {
        images: [{ url: 'https://example.com/img.jpg', alt: 'Test' }],
      },
    });
    expect(result.success).toBe(true);
  });

  it('validates a video_embed block', () => {
    const result = contentBlockSchema.safeParse({
      type: 'video_embed',
      position: 2,
      content_json: {
        url: 'https://www.youtube.com/watch?v=abc123',
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative position', () => {
    const result = contentBlockSchema.safeParse({
      type: 'rich_text',
      position: -1,
      content_json: {
        doc: { type: 'doc', content: [{ type: 'paragraph' }] },
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing type', () => {
    const result = contentBlockSchema.safeParse({
      position: 0,
      content_json: {
        doc: { type: 'doc', content: [{ type: 'paragraph' }] },
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing content_json', () => {
    const result = contentBlockSchema.safeParse({
      type: 'rich_text',
      position: 0,
    });
    expect(result.success).toBe(false);
  });
});
