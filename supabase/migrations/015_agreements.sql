-- Luma -- Proposals: agreements (signed proposals)
-- Migration 015: Create agreements table and create_agreement function

-- ============================================
-- 1. Add acceptance/decline columns to proposals
-- ============================================

ALTER TABLE proposals
  ADD COLUMN accepted_at TIMESTAMPTZ,
  ADD COLUMN declined_at TIMESTAMPTZ,
  ADD COLUMN decline_reason TEXT;

-- ============================================
-- 2. Table
-- ============================================

-- Agreements (immutable signed proposal snapshots)
CREATE TABLE agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL UNIQUE REFERENCES proposals(id),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  operator_id UUID NOT NULL REFERENCES operators(user_id) ON DELETE CASCADE,
  snapshot JSONB NOT NULL,
  signer_name TEXT NOT NULL,
  signer_email TEXT,
  signature_data JSONB NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agreements_client ON agreements(client_id);
CREATE INDEX idx_agreements_operator ON agreements(operator_id);

-- ============================================
-- 3. Row Level Security
-- ============================================

ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agreements_select" ON agreements FOR SELECT
  USING (operator_id = auth.uid());

CREATE POLICY "agreements_insert" ON agreements FOR INSERT
  WITH CHECK (operator_id = auth.uid());

-- No UPDATE or DELETE policies -- agreements are immutable

-- ============================================
-- 4. Audit Trigger
-- ============================================

CREATE OR REPLACE FUNCTION audit_agreement_changes()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM write_audit_log(
      'client', NEW.signer_name, 'create',
      'agreement', NEW.id,
      jsonb_build_object(
        'proposal_id', NEW.proposal_id,
        'signer_name', NEW.signer_name,
        'signed_at', NEW.signed_at::TEXT
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_agreements
  AFTER INSERT ON agreements
  FOR EACH ROW EXECUTE FUNCTION audit_agreement_changes();

-- ============================================
-- 5. create_agreement SECURITY DEFINER Function
-- ============================================

CREATE OR REPLACE FUNCTION create_agreement(
  p_proposal_id UUID,
  p_signer_name TEXT,
  p_signer_email TEXT,
  p_signature_data JSONB
)
RETURNS agreements AS $$
DECLARE
  v_proposal proposals;
  v_agreement agreements;
  v_snapshot JSONB;
  v_line_items JSONB;
  v_addons JSONB;
BEGIN
  -- 1. Validate proposal exists and is in a signable state
  SELECT * INTO v_proposal
  FROM proposals
  WHERE id = p_proposal_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proposal not found: %', p_proposal_id;
  END IF;

  IF v_proposal.status NOT IN ('sent', 'viewed') THEN
    RAISE EXCEPTION 'Proposal % is not in a signable state (current status: %)',
      p_proposal_id, v_proposal.status;
  END IF;

  -- 2. Build snapshot: line items array
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', li.id,
      'name', li.name,
      'description', li.description,
      'quantity', li.quantity,
      'unit_price', li.unit_price,
      'billing_type', li.billing_type::TEXT,
      'sort_order', li.sort_order
    ) ORDER BY li.sort_order
  ), '[]'::JSONB)
  INTO v_line_items
  FROM proposal_line_items li
  WHERE li.proposal_id = p_proposal_id;

  -- 3. Build snapshot: addons array (includes selection state)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', pa.id,
      'addon_template_id', pa.addon_template_id,
      'name', pa.name,
      'description', pa.description,
      'price', pa.price,
      'billing_type', pa.billing_type::TEXT,
      'is_included', pa.is_included,
      'is_selected', pa.is_selected,
      'sort_order', pa.sort_order
    ) ORDER BY pa.sort_order
  ), '[]'::JSONB)
  INTO v_addons
  FROM proposal_addons pa
  WHERE pa.proposal_id = p_proposal_id;

  -- 4. Assemble full snapshot
  v_snapshot := jsonb_build_object(
    'proposal_id', v_proposal.id,
    'title', v_proposal.title,
    'summary', v_proposal.summary,
    'notes', v_proposal.notes,
    'version', v_proposal.version,
    'valid_days', v_proposal.valid_days,
    'line_items', v_line_items,
    'addons', v_addons,
    'snapshot_at', now()::TEXT
  );

  -- 5. Insert agreement
  INSERT INTO agreements (
    proposal_id, client_id, operator_id,
    snapshot, signer_name, signer_email, signature_data
  ) VALUES (
    p_proposal_id, v_proposal.client_id, v_proposal.operator_id,
    v_snapshot, p_signer_name, p_signer_email, p_signature_data
  )
  RETURNING * INTO v_agreement;

  -- 6. Update proposal status to accepted
  UPDATE proposals
  SET status = 'accepted', accepted_at = now()
  WHERE id = p_proposal_id;

  RETURN v_agreement;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
