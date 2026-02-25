import { useState, useCallback } from 'react';
import {
  useContentBlocks,
  useCreateContentBlock,
  useUpdateContentBlock,
  useDeleteContentBlock,
} from '@/hooks/useContentBlocks';
import { RichTextBlock } from './RichTextBlock';
import { ImageGalleryBlock } from './ImageGalleryBlock';
import { VideoEmbedBlock } from './VideoEmbedBlock';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Type, ImageIcon, Video } from 'lucide-react';
import type { ContentBlockType, ProposalContentBlock } from '@/types/database';
import type { RichTextContent, ImageGalleryContent, VideoEmbedContent } from '@/lib/content-block-schemas';

type ContentBlocksEditorProps = {
  proposalId: string;
  readOnly?: boolean;
};

const BLOCK_TYPE_DEFAULTS: Record<ContentBlockType, Record<string, unknown>> = {
  rich_text: { doc: { type: 'doc', content: [{ type: 'paragraph' }] } },
  image_gallery: { images: [] },
  video_embed: { url: '', caption: '' },
};

const BLOCK_TYPE_LABELS: Record<ContentBlockType, { label: string; icon: typeof Type }> = {
  rich_text: { label: 'Rich Text', icon: Type },
  image_gallery: { label: 'Image Gallery', icon: ImageIcon },
  video_embed: { label: 'Video Embed', icon: Video },
};

export function ContentBlocksEditor({ proposalId, readOnly }: ContentBlocksEditorProps) {
  const { data: blocks = [] } = useContentBlocks(proposalId);
  const createBlock = useCreateContentBlock();
  const updateBlock = useUpdateContentBlock();
  const deleteBlock = useDeleteContentBlock();
  const [debounceTimers] = useState(() => new Map<string, ReturnType<typeof setTimeout>>());

  const handleAddBlock = useCallback(
    (type: ContentBlockType) => {
      const position = blocks.length;
      createBlock.mutate({
        proposal_id: proposalId,
        type,
        position,
        content_json: BLOCK_TYPE_DEFAULTS[type],
      });
    },
    [blocks.length, createBlock, proposalId],
  );

  const handleUpdateBlock = useCallback(
    (block: ProposalContentBlock, contentJson: Record<string, unknown>) => {
      // Debounce updates
      const existing = debounceTimers.get(block.id);
      if (existing) clearTimeout(existing);

      const timer = setTimeout(() => {
        updateBlock.mutate({
          id: block.id,
          proposal_id: block.proposal_id,
          content_json: contentJson,
        });
        debounceTimers.delete(block.id);
      }, 800);

      debounceTimers.set(block.id, timer);
    },
    [updateBlock, debounceTimers],
  );

  const handleDeleteBlock = useCallback(
    (blockId: string) => {
      deleteBlock.mutate({ id: blockId, proposalId });
    },
    [deleteBlock, proposalId],
  );

  if (readOnly && blocks.length === 0) return null;

  return (
    <div className="space-y-3">
      {blocks.map((block) => (
        <div key={block.id}>
          {block.type === 'rich_text' && (
            <RichTextBlock
              content={block.content_json as unknown as RichTextContent}
              onChange={(content) => handleUpdateBlock(block, content as unknown as Record<string, unknown>)}
              onDelete={() => handleDeleteBlock(block.id)}
              readOnly={readOnly}
            />
          )}
          {block.type === 'image_gallery' && (
            <ImageGalleryBlock
              content={block.content_json as unknown as ImageGalleryContent}
              onChange={(content) => handleUpdateBlock(block, content as unknown as Record<string, unknown>)}
              onDelete={() => handleDeleteBlock(block.id)}
              readOnly={readOnly}
            />
          )}
          {block.type === 'video_embed' && (
            <VideoEmbedBlock
              content={block.content_json as unknown as VideoEmbedContent}
              onChange={(content) => handleUpdateBlock(block, content as unknown as Record<string, unknown>)}
              onDelete={() => handleDeleteBlock(block.id)}
              readOnly={readOnly}
            />
          )}
        </div>
      ))}

      {!readOnly && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Section
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {(Object.entries(BLOCK_TYPE_LABELS) as [ContentBlockType, typeof BLOCK_TYPE_LABELS[ContentBlockType]][]).map(
              ([type, { label, icon: Icon }]) => (
                <DropdownMenuItem key={type} onClick={() => handleAddBlock(type)}>
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                </DropdownMenuItem>
              ),
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
