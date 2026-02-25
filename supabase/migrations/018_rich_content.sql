-- Add rich content support for proposals
-- summary_json stores Tiptap JSON, content_version tracks migration state

ALTER TABLE proposals ADD COLUMN IF NOT EXISTS summary_json JSONB;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS content_version INTEGER DEFAULT 1;

COMMENT ON COLUMN proposals.summary_json IS 'Rich text content stored as Tiptap JSON. Null means plain text in summary column.';
COMMENT ON COLUMN proposals.content_version IS 'Content schema version for future migrations. 1 = plain text, 2 = Tiptap JSON.';
