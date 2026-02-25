import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, X } from 'lucide-react';
import type { ImageGalleryContent } from '@/lib/content-block-schemas';

type ImageGalleryBlockProps = {
  content: ImageGalleryContent;
  onChange: (content: ImageGalleryContent) => void;
  onDelete: () => void;
  readOnly?: boolean;
};

export function ImageGalleryBlock({ content, onChange, onDelete, readOnly }: ImageGalleryBlockProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRemoveImage = (index: number) => {
    const updated = content.images.filter((_, i) => i !== index);
    onChange({ images: updated });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        onChange({
          images: [...content.images, { url, alt: file.name }],
        });
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="rounded-lg border border-border/60 bg-background relative group p-4">
      {!readOnly && (
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
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {content.images.map((image, index) => (
          <div key={`${image.url}-${index}`} className="relative group/img">
            <img
              src={image.url}
              alt={image.alt}
              className="w-full h-32 object-cover rounded-md border border-border/40"
            />
            {!readOnly && (
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-1 right-1 bg-background/80 rounded-full p-1 opacity-0 group-hover/img:opacity-100 transition-opacity"
                aria-label="Remove image"
              >
                <X className="h-3 w-3 text-destructive" />
              </button>
            )}
            {image.caption && (
              <p className="text-xs text-muted-foreground mt-1 truncate">{image.caption}</p>
            )}
          </div>
        ))}
      </div>

      {!readOnly && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 gap-1.5"
            onClick={() => fileInputRef.current?.click()}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Image
          </Button>
        </>
      )}
    </div>
  );
}
