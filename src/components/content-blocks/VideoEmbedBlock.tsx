import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Video } from 'lucide-react';
import type { VideoEmbedContent } from '@/lib/content-block-schemas';

type VideoEmbedBlockProps = {
  content: VideoEmbedContent;
  onChange: (content: VideoEmbedContent) => void;
  onDelete: () => void;
  readOnly?: boolean;
};

function getEmbedUrl(url: string): string | null {
  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/,
  );
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  return null;
}

export function VideoEmbedBlock({ content, onChange, onDelete, readOnly }: VideoEmbedBlockProps) {
  const embedUrl = getEmbedUrl(content.url);

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

      {embedUrl ? (
        <div className="aspect-video rounded-md overflow-hidden bg-muted">
          <iframe
            src={embedUrl}
            title="Video embed"
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="aspect-video rounded-md bg-muted/50 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Video className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Unsupported video URL</p>
          </div>
        </div>
      )}

      {content.caption && (
        <p className="text-xs text-muted-foreground mt-2">{content.caption}</p>
      )}

      {!readOnly && (
        <div className="mt-3">
          <Input
            type="url"
            placeholder="Paste YouTube or Vimeo URL"
            defaultValue={content.url}
            onBlur={(e) => {
              if (e.target.value !== content.url) {
                onChange({ ...content, url: e.target.value });
              }
            }}
            className="text-sm"
          />
        </div>
      )}
    </div>
  );
}
