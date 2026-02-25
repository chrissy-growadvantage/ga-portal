-- Phase 6: Proposal Content Blocks
-- Allow operators to insert rich content sections between line items

CREATE TABLE proposal_content_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('rich_text', 'image_gallery', 'video_embed')),
  position INTEGER NOT NULL,
  content_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast queries by proposal
CREATE INDEX idx_content_blocks_proposal ON proposal_content_blocks(proposal_id, position);

-- Enable RLS
ALTER TABLE proposal_content_blocks ENABLE ROW LEVEL SECURITY;

-- RLS: operators can only manage blocks for their proposals
CREATE POLICY "Operators can view their proposal blocks"
ON proposal_content_blocks FOR SELECT
TO authenticated
USING (
  proposal_id IN (
    SELECT id FROM proposals WHERE operator_id = auth.uid()
  )
);

CREATE POLICY "Operators can insert blocks"
ON proposal_content_blocks FOR INSERT
TO authenticated
WITH CHECK (
  proposal_id IN (
    SELECT id FROM proposals WHERE operator_id = auth.uid()
  )
);

CREATE POLICY "Operators can update blocks"
ON proposal_content_blocks FOR UPDATE
TO authenticated
USING (
  proposal_id IN (
    SELECT id FROM proposals WHERE operator_id = auth.uid()
  )
);

CREATE POLICY "Operators can delete blocks"
ON proposal_content_blocks FOR DELETE
TO authenticated
USING (
  proposal_id IN (
    SELECT id FROM proposals WHERE operator_id = auth.uid()
  )
);
