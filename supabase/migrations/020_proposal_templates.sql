-- Proposal templates: reusable content blocks for proposal sections
CREATE TABLE proposal_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID REFERENCES operators(user_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  content_json JSONB NOT NULL,
  category TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE proposal_templates ENABLE ROW LEVEL SECURITY;

-- RLS: operators can view their own templates + system templates
CREATE POLICY "Operators can view their templates"
ON proposal_templates FOR SELECT
TO authenticated
USING (operator_id = auth.uid() OR is_system = true);

-- RLS: operators can insert their own templates
CREATE POLICY "Operators can insert templates"
ON proposal_templates FOR INSERT
TO authenticated
WITH CHECK (operator_id = auth.uid());

-- RLS: operators can update their own templates
CREATE POLICY "Operators can update templates"
ON proposal_templates FOR UPDATE
TO authenticated
USING (operator_id = auth.uid());

-- RLS: operators can delete their own templates
CREATE POLICY "Operators can delete templates"
ON proposal_templates FOR DELETE
TO authenticated
USING (operator_id = auth.uid());

-- Seed system templates
INSERT INTO proposal_templates (operator_id, name, description, content_json, category, is_system)
VALUES
  (NULL, 'Project Introduction', 'Standard project intro template', '{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Project Overview"}]},{"type":"paragraph","content":[{"type":"text","text":"[Describe the project scope and objectives here]"}]}]}', 'intro', true),
  (NULL, 'Scope of Work', 'Standard scope template', '{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Scope of Work"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Deliverable 1"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Deliverable 2"}]}]}]}]}', 'deliverables', true),
  (NULL, 'Terms & Conditions', 'Standard T&C template', '{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Terms & Conditions"}]},{"type":"orderedList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Payment terms: 50% upfront, 50% on completion"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Revisions: Up to 2 rounds included"}]}]}]}]}', 'terms', true);
