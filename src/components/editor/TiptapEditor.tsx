import { useEditor, EditorContent } from '@tiptap/react';
import type { JSONContent, Editor } from '@tiptap/react';
import { useEffect, useCallback, useState } from 'react';
import { TiptapToolbar } from './TiptapToolbar';
import { createEditorExtensions, plainTextToJSON } from '@/lib/tiptap-extensions';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

type TiptapEditorProps = {
  value?: string | JSONContent;
  onChange: (json: JSONContent, text: string) => void;
  onBlur?: () => void;
  maxLength?: number;
  placeholder?: string;
  className?: string;
  onImageUpload?: (file: File) => Promise<string>;
  onInsertTemplate?: () => void;
  onSaveAsTemplate?: () => void;
  editorRef?: (editor: Editor | null) => void;
};

function resolveInitialContent(value?: string | JSONContent): JSONContent | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return plainTextToJSON(value);
  return value;
}

function getImageFiles(dataTransfer: DataTransfer): File[] {
  return Array.from(dataTransfer.files).filter((f) =>
    f.type.startsWith('image/'),
  );
}

export function TiptapEditor({
  value,
  onChange,
  onBlur,
  maxLength,
  placeholder,
  className,
  onImageUpload,
  onInsertTemplate,
  onSaveAsTemplate,
  editorRef,
}: TiptapEditorProps) {
  const extensions = createEditorExtensions({ placeholder, maxLength });
  const [isUploading, setIsUploading] = useState(false);

  const handleUpdate = useCallback(
    ({ editor }: { editor: { getJSON: () => JSONContent; getText: () => string } }) => {
      onChange(editor.getJSON(), editor.getText());
    },
    [onChange],
  );

  const editor = useEditor({
    extensions,
    content: resolveInitialContent(value),
    onUpdate: handleUpdate,
    onBlur: onBlur ? () => onBlur() : undefined,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none min-h-[120px] px-3 py-2',
        role: 'textbox',
        'aria-multiline': 'true',
      },
      handleDrop: (view, event, _slice, moved) => {
        if (!onImageUpload || moved || !event.dataTransfer) return false;

        const images = getImageFiles(event.dataTransfer);
        if (images.length === 0) return false;

        event.preventDefault();

        const coordinates = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        });

        images.forEach((file) => {
          setIsUploading(true);
          onImageUpload(file)
            .then((url) => {
              const node = view.state.schema.nodes.image.create({ src: url });
              const pos = coordinates?.pos ?? view.state.doc.content.size;
              const tr = view.state.tr.insert(pos, node);
              view.dispatch(tr);
            })
            .catch(() => {
              // Error handled by the onImageUpload callback chain
            })
            .finally(() => {
              setIsUploading(false);
            });
        });

        return true;
      },
      handlePaste: (view, event) => {
        if (!onImageUpload || !event.clipboardData) return false;

        const images = getImageFiles(event.clipboardData);
        if (images.length === 0) return false;

        event.preventDefault();

        images.forEach((file) => {
          setIsUploading(true);
          onImageUpload(file)
            .then((url) => {
              const node = view.state.schema.nodes.image.create({ src: url });
              const pos = view.state.selection.anchor;
              const tr = view.state.tr.insert(pos, node);
              view.dispatch(tr);
            })
            .catch(() => {
              // Error handled by the onImageUpload callback chain
            })
            .finally(() => {
              setIsUploading(false);
            });
        });

        return true;
      },
    },
  });

  useEffect(() => {
    editorRef?.(editor);
  }, [editor, editorRef]);

  useEffect(() => {
    if (!editor || !value) return;
    const currentJSON = JSON.stringify(editor.getJSON());
    const incomingJSON =
      typeof value === 'string'
        ? JSON.stringify(plainTextToJSON(value))
        : JSON.stringify(value);
    if (currentJSON !== incomingJSON) {
      editor.commands.setContent(
        typeof value === 'string' ? plainTextToJSON(value) : value,
      );
    }
  }, [editor, value]);

  const characterCount = editor?.storage.characterCount?.characters() ?? 0;

  const handleToolbarImageUpload = useCallback(async (file: File) => {
    if (!onImageUpload || !editor) return;

    setIsUploading(true);
    try {
      const url = await onImageUpload(file);
      editor.chain().focus().setImage({ src: url }).run();
    } finally {
      setIsUploading(false);
    }
  }, [onImageUpload, editor]);

  return (
    <div
      className={cn(
        'relative rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        className,
      )}
    >
      <TiptapToolbar
        editor={editor}
        onImageUpload={onImageUpload ? handleToolbarImageUpload : undefined}
        onInsertTemplate={onInsertTemplate}
        onSaveAsTemplate={onSaveAsTemplate}
      />
      <EditorContent editor={editor} />
      {isUploading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-md z-10"
          data-testid="upload-overlay"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Uploading image...</span>
          </div>
        </div>
      )}
      {maxLength !== undefined && (
        <div className="flex justify-end px-3 py-1.5 text-xs text-muted-foreground border-t border-border">
          <span>
            {characterCount} / {maxLength}
          </span>
        </div>
      )}
    </div>
  );
}
