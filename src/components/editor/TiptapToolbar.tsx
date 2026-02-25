import { useRef } from 'react';
import type { Editor } from '@tiptap/react';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  ImagePlus,
  LayoutTemplate,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TiptapToolbarProps = {
  editor: Editor | null;
  className?: string;
  onImageUpload?: (file: File) => Promise<void>;
  onInsertTemplate?: () => void;
  onSaveAsTemplate?: () => void;
};

export function TiptapToolbar({ editor, className, onImageUpload, onInsertTemplate, onSaveAsTemplate }: TiptapToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const handleLink = () => {
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt('Enter URL');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImageUpload) {
      onImageUpload(file);
    }
    // Reset the input so the same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      className={cn(
        'flex flex-wrap gap-1 border-b border-border p-1',
        className,
      )}
    >
      <Toggle
        size="sm"
        pressed={editor.isActive('bold')}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        aria-label="Bold"
      >
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('italic')}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        aria-label="Italic"
      >
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 1 })}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
        aria-label="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 2 })}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
        aria-label="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 3 })}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
        aria-label="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('bulletList')}
        onPressedChange={() =>
          editor.chain().focus().toggleBulletList().run()
        }
        aria-label="Bullet List"
      >
        <List className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('orderedList')}
        onPressedChange={() =>
          editor.chain().focus().toggleOrderedList().run()
        }
        aria-label="Ordered List"
      >
        <ListOrdered className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('link')}
        onPressedChange={handleLink}
        aria-label="Link"
      >
        <LinkIcon className="h-4 w-4" />
      </Toggle>
      {onImageUpload && (
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleImageClick}
            aria-label="Insert Image"
          >
            <ImagePlus className="h-4 w-4" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            data-testid="image-file-input"
          />
        </>
      )}
      {onInsertTemplate && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onInsertTemplate}
          aria-label="Insert Template"
        >
          <LayoutTemplate className="h-4 w-4" />
        </Button>
      )}
      {onSaveAsTemplate && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onSaveAsTemplate}
          aria-label="Save as Template"
        >
          <Save className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
