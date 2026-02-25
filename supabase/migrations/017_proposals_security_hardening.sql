-- Luma -- Proposals: security hardening patch
-- Migration 017: Address critical findings from devil's advocate review
-- Ref: /tasks/devils-advocate-review.md

-- pgcrypto required for snapshot hash (SHA-256)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- 1. Prevent CASCADE DELETE from destroying agreements
--    Review refs: 1.3 (client cascade), 1.2 (proposal FK), 1.4 (payment orphans)
-- ============================================

-- 1a. agreements.client_id: CASCADE -> RESTRICT
--     Deleting a client must not silently destroy signed agreements.
ALTER TABLE agreements DROP CONSTRAINT agreements_client_id_fkey;
ALTER TABLE agreements ADD CONSTRAINT agreements_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;

-- 1b. agreements.proposal_id: add explicit RESTRICT
--     Original schema had no ON DELETE clause (default is NO ACTION, which is
--     effectively RESTRICT but implicit). Making it explicit for clarity.
ALTER TABLE agreements DROP CONSTRAINT agreements_proposal_id_fkey;
ALTER TABLE agreements ADD CONSTRAINT agreements_proposal_id_fkey
  FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE RESTRICT;

-- 1c. payment_records.agreement_id: make NOT NULL with RESTRICT
--     Orphaned payment records with null agreement_id are semantically invalid.
ALTER TABLE payment_records ALTER COLUMN agreement_id SET NOT NULL;
ALTER TABLE payment_records DROP CONSTRAINT IF EXISTS payment_records_agreement_id_fkey;
ALTER TABLE payment_records ADD CONSTRAINT payment_records_agreement_id_fkey
  FOREIGN KEY (agreement_id) REFERENCES agreements(id) ON DELETE RESTRICT;

-- ============================================
-- 2. Lock proposal content after sending
--    Review ref: 3.1 — operator can edit sent proposals, client signs stale data
-- ============================================

CREATE OR REPLACE FUNCTION prevent_sent_proposal_edit()
RETURNS trigger AS $$
BEGIN
  -- Only enforce lock when proposal has left draft status
  IF OLD.status != 'draft' THEN
    -- Allow metadata/status field updates (edge functions need these):
    --   status, viewed_at, accepted_at, declined_at, decline_reason,
    --   token_hash, token_expires_at, sent_at, expires_at, updated_at
    -- Block content columns: title, summary, notes, valid_days
    IF NEW.title IS DISTINCT FROM OLD.title
       OR NEW.summary IS DISTINCT FROM OLD.summary
       OR NEW.notes IS DISTINCT FROM OLD.notes
       OR NEW.valid_days IS DISTINCT FROM OLD.valid_days THEN
      RAISE EXCEPTION 'Cannot modify proposal content after it has been sent. Create a new version instead.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lock_sent_proposal_content
  BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION prevent_sent_proposal_edit();

-- ============================================
-- 3. Lock proposal_addons after acceptance
--    Review ref: 2.2 — addon toggle after acceptance changes live data
-- ============================================

CREATE OR REPLACE FUNCTION prevent_addon_edit_after_signing()
RETURNS trigger AS $$
DECLARE
  v_status proposal_status;
BEGIN
  SELECT status INTO v_status FROM proposals WHERE id = NEW.proposal_id;
  IF v_status IN ('accepted', 'declined', 'expired') THEN
    RAISE EXCEPTION 'Cannot modify addons on a % proposal.', v_status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lock_signed_proposal_addons
  BEFORE UPDATE ON proposal_addons
  FOR EACH ROW EXECUTE FUNCTION prevent_addon_edit_after_signing();

-- Lock proposal_line_items after sending (covers INSERT, UPDATE, DELETE)
CREATE OR REPLACE FUNCTION prevent_line_item_edit_after_sending()
RETURNS trigger AS $$
DECLARE
  v_status proposal_status;
BEGIN
  SELECT status INTO v_status
  FROM proposals
  WHERE id = COALESCE(NEW.proposal_id, OLD.proposal_id);

  IF v_status != 'draft' THEN
    RAISE EXCEPTION 'Cannot modify line items on a % proposal.', v_status;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lock_sent_proposal_line_items
  BEFORE INSERT OR UPDATE OR DELETE ON proposal_line_items
  FOR EACH ROW EXECUTE FUNCTION prevent_line_item_edit_after_sending();

-- ============================================
-- 4. Harden create_agreement() — token validation + snapshot hash
--    Review refs: 1.1 (no auth check), 2.3 (no tamper evidence), 3.3 (expiry grace), 3.4 (billing_status)
-- ============================================

-- 4a. Add snapshot_hash column for tamper evidence
ALTER TABLE agreements ADD COLUMN snapshot_hash TEXT;

-- 4b. Add billing_status to decouple agreement from payment lifecycle
ALTER TABLE agreements ADD COLUMN billing_status TEXT NOT NULL DEFAULT 'pending_billing'
  CHECK (billing_status IN ('pending_billing', 'billing_active', 'billing_failed', 'not_applicable'));

-- 4c. Replace create_agreement() with hardened version
CREATE OR REPLACE FUNCTION create_agreement(
  p_proposal_id UUID,
  p_token_hash TEXT,        -- Must match proposals.token_hash
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
  v_snapshot_text TEXT;
  v_snapshot_hash TEXT;
BEGIN
  -- 1. Lock and validate proposal (FOR UPDATE prevents race conditions — ref 3.6)
  SELECT * INTO v_proposal
  FROM proposals
  WHERE id = p_proposal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proposal not found: %', p_proposal_id;
  END IF;

  -- 2. Validate token matches (ref 1.1 — without this, any caller with a proposal_id can sign)
  IF v_proposal.token_hash IS NULL OR v_proposal.token_hash != p_token_hash THEN
    RAISE EXCEPTION 'Invalid token for proposal: %', p_proposal_id;
  END IF;

  -- 3. Validate token hasn't expired
  IF v_proposal.token_expires_at IS NOT NULL AND v_proposal.token_expires_at < now() THEN
    RAISE EXCEPTION 'Proposal token has expired';
  END IF;

  -- 4. Validate proposal hasn't expired (15-min grace period — ref 3.3)
  IF v_proposal.expires_at IS NOT NULL AND v_proposal.expires_at < (now() - interval '15 minutes') THEN
    RAISE EXCEPTION 'Proposal has expired';
  END IF;

  -- 5. Validate proposal is in a signable state
  IF v_proposal.status NOT IN ('sent', 'viewed') THEN
    RAISE EXCEPTION 'Proposal % is not in a signable state (current status: %)',
      p_proposal_id, v_proposal.status;
  END IF;

  -- 6. Build snapshot: line items
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', li.id, 'name', li.name, 'description', li.description,
      'quantity', li.quantity, 'unit_price', li.unit_price,
      'billing_type', li.billing_type::TEXT, 'sort_order', li.sort_order
    ) ORDER BY li.sort_order
  ), '[]'::JSONB)
  INTO v_line_items
  FROM proposal_line_items li WHERE li.proposal_id = p_proposal_id;

  -- 7. Build snapshot: addons
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', pa.id, 'addon_template_id', pa.addon_template_id,
      'name', pa.name, 'description', pa.description,
      'price', pa.price, 'billing_type', pa.billing_type::TEXT,
      'is_included', pa.is_included, 'is_selected', pa.is_selected,
      'sort_order', pa.sort_order
    ) ORDER BY pa.sort_order
  ), '[]'::JSONB)
  INTO v_addons
  FROM proposal_addons pa WHERE pa.proposal_id = p_proposal_id;

  -- 8. Assemble full snapshot
  v_snapshot := jsonb_build_object(
    'proposal_id', v_proposal.id, 'title', v_proposal.title,
    'summary', v_proposal.summary, 'notes', v_proposal.notes,
    'version', v_proposal.version, 'valid_days', v_proposal.valid_days,
    'line_items', v_line_items, 'addons', v_addons,
    'snapshot_at', now()::TEXT
  );

  -- 9. Compute tamper-evidence hash (ref 2.3)
  v_snapshot_text := v_snapshot::TEXT;
  v_snapshot_hash := encode(digest(v_snapshot_text, 'sha256'), 'hex');

  -- 10. Insert agreement
  INSERT INTO agreements (
    proposal_id, client_id, operator_id,
    snapshot, snapshot_hash, signer_name, signer_email, signature_data
  ) VALUES (
    p_proposal_id, v_proposal.client_id, v_proposal.operator_id,
    v_snapshot, v_snapshot_hash, p_signer_name, p_signer_email, p_signature_data
  )
  RETURNING * INTO v_agreement;

  -- 11. Update proposal status to accepted
  UPDATE proposals
  SET status = 'accepted', accepted_at = now()
  WHERE id = p_proposal_id;

  RETURN v_agreement;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. Make agreements immutable at DB level
--    Review ref: architecture suggestion 4 — block UPDATE/DELETE, not just missing RLS
-- ============================================

CREATE OR REPLACE FUNCTION prevent_agreement_modification()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Only allow billing_status updates (needed for Stripe payment lifecycle)
    IF NEW.proposal_id IS DISTINCT FROM OLD.proposal_id
       OR NEW.client_id IS DISTINCT FROM OLD.client_id
       OR NEW.operator_id IS DISTINCT FROM OLD.operator_id
       OR NEW.snapshot IS DISTINCT FROM OLD.snapshot
       OR NEW.snapshot_hash IS DISTINCT FROM OLD.snapshot_hash
       OR NEW.signer_name IS DISTINCT FROM OLD.signer_name
       OR NEW.signer_email IS DISTINCT FROM OLD.signer_email
       OR NEW.signature_data IS DISTINCT FROM OLD.signature_data
       OR NEW.signed_at IS DISTINCT FROM OLD.signed_at THEN
      RAISE EXCEPTION 'Agreements are immutable. Cannot modify signed agreement.';
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Agreements cannot be deleted.';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_agreement_immutability
  BEFORE UPDATE OR DELETE ON agreements
  FOR EACH ROW EXECUTE FUNCTION prevent_agreement_modification();

-- ============================================
-- 6. Revenue dashboard index
--    Review ref: 5.2 — monthly trend query needs (operator_id, paid_at)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_payment_records_operator_paid
  ON payment_records(operator_id, paid_at);

-- ============================================
-- 7. Stripe disconnect tracking
--    Review ref: 3.5 — track when operator disconnects Stripe
-- ============================================

ALTER TABLE operators ADD COLUMN IF NOT EXISTS stripe_disconnected_at TIMESTAMPTZ;
