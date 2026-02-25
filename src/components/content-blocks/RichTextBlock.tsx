import { useCallback } from 'react';
import type { JSONContent } from '@tiptap/react';
import { TiptapEditor } from '@/components/editor/TiptapEditor';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { generateHTML } from '@/lib/tiptap-extensions';
import type { RichTextContent } from '@/lib/content-block-schemas';

type RichTextBlockProps = {
  content: RichTextContent;
  onChange: (content: RichTextContent) => void;
  onDelete: () => void;
  readOnly?: boolean;
};

export function RichTextBlock({ content, onChange, onDelete, readOnly }: RichTextBlockProps) {
  const handleEditorChange = useCallback(
    (json: JSONContent) => {
      onChange({ doc: json as RichTextContent['doc'] });
    },
    [onChange],
  );

  if (readOnly) {
    const html = (() => {
      try {
        return generateHTML(content.doc as JSONContent);
      } catch {
        return '';
      }
    })();

    return (
      <div className="rounded-lg border border-border/40 bg-muted/20 p-4">
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/60 bg-background relative group">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          aria-label="Delete block"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <TiptapEditor
        value={content.doc as JSONContent}
        onChange={handleEditorChange}
        placeholder="Write content here..."
      />
    </div>
  );
}
