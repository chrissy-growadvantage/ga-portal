import { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import type { JSONContent } from '@tiptap/react';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
import { createEditorExtensions, plainTextToJSON } from '@/lib/tiptap-extensions';
import { cn } from '@/lib/utils';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

type InlineDescriptionEditorProps = {
  value?: string | JSONContent | null;
  onChange: (json: JSONContent, text: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
};

function resolveContent(value?: string | JSONContent | null): JSONContent | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return plainTextToJSON(value);
  return value as JSONContent;
}

export function InlineDescriptionEditor({
  value,
  onChange,
  onBlur,
  placeholder = 'Add a description...',
  className,
}: InlineDescriptionEditorProps) {
  const [expanded, setExpanded] = useState(() => {
    if (!value) return false;
    if (typeof value === 'string') return value.length > 0;
    if (typeof value === 'object' && 'type' in value) {
      const content = (value as JSONContent).content;
      return !!content && content.length > 0 && !(content.length === 1 && !content[0].content);
    }
    return false;
  });

  const extensions = createEditorExtensions({ placeholder });

  const editor = useEditor({
    extensions,
    content: resolveContent(value),
    onUpdate: ({ editor: e }) => {
      onChange(e.getJSON(), e.getText());
    },
    onBlur: onBlur ? () => onBlur() : undefined,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[48px] px-2 py-1.5 text-sm',
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': 'Description',
      },
    },
  });

  if (!expanded) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn('text-xs text-muted-foreground h-auto py-1 px-2', className)}
        onClick={() => setExpanded(true)}
      >
        <ChevronDown className="h-3 w-3 mr-1" />
        Add description
      </Button>
    );
  }

  return (
    <div
      className={cn(
        'rounded-md border border-input/50 bg-background mt-1',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border/50 px-1">
        <div className="flex gap-0.5">
          {editor && (
            <>
              <Toggle
                size="sm"
                className="h-7 w-7 p-0"
                pressed={editor.isActive('bold')}
                onPressedChange={() => editor.chain().focus().toggleBold().run()}
                aria-label="Bold"
              >
                <Bold className="h-3 w-3" />
              </Toggle>
              <Toggle
                size="sm"
                className="h-7 w-7 p-0"
                pressed={editor.isActive('italic')}
                onPressedChange={() => editor.chain().focus().toggleItalic().run()}
                aria-label="Italic"
              >
                <Italic className="h-3 w-3" />
              </Toggle>
              <Toggle
                size="sm"
                className="h-7 w-7 p-0"
                pressed={editor.isActive('bulletList')}
                onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
                aria-label="Bullet List"
              >
                <List className="h-3 w-3" />
              </Toggle>
              <Toggle
                size="sm"
                className="h-7 w-7 p-0"
                pressed={editor.isActive('orderedList')}
                onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
                aria-label="Ordered List"
              >
                <ListOrdered className="h-3 w-3" />
              </Toggle>
            </>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground"
          onClick={() => setExpanded(false)}
          aria-label="Collapse description"
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
