import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { generateHTML as tiptapGenerateHTML } from '@tiptap/react';
import type { JSONContent } from '@tiptap/react';
import type { Extensions } from '@tiptap/react';

const baseExtensions: Extensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
  }),
  Image.configure({
    inline: false,
    allowBase64: true,
  }),
  Link.configure({
    openOnClick: false,
    autolink: true,
    HTMLAttributes: {
      rel: 'noopener noreferrer',
      class: 'text-primary underline',
    },
  }),
];

export function createEditorExtensions(options?: {
  placeholder?: string;
  maxLength?: number;
}): Extensions {
  return [
    ...baseExtensions,
    Placeholder.configure({
      placeholder: options?.placeholder ?? 'Start writing...',
    }),
    ...(options?.maxLength
      ? [CharacterCount.configure({ limit: options.maxLength })]
      : [CharacterCount]),
  ];
}

export function plainTextToJSON(text: string): JSONContent {
  if (!text.trim()) {
    return { type: 'doc', content: [{ type: 'paragraph' }] };
  }

  const paragraphs = text.split('\n').map((line) => ({
    type: 'paragraph' as const,
    content: line ? [{ type: 'text' as const, text: line }] : undefined,
  }));

  return { type: 'doc', content: paragraphs };
}

export function generateHTML(json: JSONContent): string {
  return tiptapGenerateHTML(json, baseExtensions);
}
