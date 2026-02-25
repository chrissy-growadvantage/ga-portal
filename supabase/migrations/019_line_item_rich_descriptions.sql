-- Add rich content support for line item and addon descriptions
ALTER TABLE proposal_line_items ADD COLUMN IF NOT EXISTS description_json JSONB;
ALTER TABLE proposal_addons ADD COLUMN IF NOT EXISTS description_json JSONB;

COMMENT ON COLUMN proposal_line_items.description_json IS 'Rich text description stored as Tiptap JSON. Null means plain text in description column.';
COMMENT ON COLUMN proposal_addons.description_json IS 'Rich text description stored as Tiptap JSON. Null means plain text in description column.';
