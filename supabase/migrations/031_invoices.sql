-- Migration 031: Invoices & Invoice Line Items
-- Closes the billing loop: proposal → delivery tracking → invoicing → payment

-- Invoice status enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
    CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'void');
  END IF;
END $$;

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  -- Optional link to accepted proposal
  proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  status invoice_status NOT NULL DEFAULT 'draft',
  issue_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  -- Currency support (ISO 4217)
  currency TEXT NOT NULL DEFAULT 'USD',
  notes TEXT,
  -- Payment tracking
  stripe_payment_intent_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Invoice line items
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  -- Optional link to a delivery item for audit trail
  delivery_item_id UUID REFERENCES delivery_items(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL, -- cents
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_invoice_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS invoices_updated_at ON invoices;
CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_invoice_updated_at();

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS invoices_operator_id_idx ON invoices(operator_id);
CREATE INDEX IF NOT EXISTS invoices_client_id_idx ON invoices(client_id);
CREATE INDEX IF NOT EXISTS invoices_status_idx ON invoices(status);
CREATE INDEX IF NOT EXISTS invoice_line_items_invoice_id_idx ON invoice_line_items(invoice_id);

-- RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;

-- Operators can manage their own invoices
DROP POLICY IF EXISTS "operators_own_invoices" ON invoices;
CREATE POLICY "operators_own_invoices" ON invoices
  USING (operator_id = auth.uid())
  WITH CHECK (operator_id = auth.uid());

-- Line items inherit access via invoice
DROP POLICY IF EXISTS "operators_own_invoice_line_items" ON invoice_line_items;
CREATE POLICY "operators_own_invoice_line_items" ON invoice_line_items
  USING (invoice_id IN (SELECT id FROM invoices WHERE operator_id = auth.uid()))
  WITH CHECK (invoice_id IN (SELECT id FROM invoices WHERE operator_id = auth.uid()));

-- Auto-generate invoice numbers per operator (INV-0001, INV-0002, ...)
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

CREATE OR REPLACE FUNCTION next_invoice_number(p_operator_id UUID)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  seq_val INT;
BEGIN
  SELECT COALESCE(MAX(
    CASE WHEN invoice_number ~ '^INV-[0-9]+$'
    THEN CAST(SUBSTRING(invoice_number FROM 5) AS INT)
    ELSE 0 END
  ), 0) + 1
  INTO seq_val
  FROM invoices
  WHERE operator_id = p_operator_id;
  RETURN 'INV-' || LPAD(seq_val::TEXT, 4, '0');
END;
$$;
