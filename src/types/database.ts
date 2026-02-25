// Luma Database Types — mirrors supabase/migrations/001_luma_schema.sql

// Enum types
export type ClientStatus = 'active' | 'paused' | 'archived';
export type ScopeType = 'hours' | 'deliverables' | 'custom';
export type DeliveryStatus = 'completed' | 'in_progress' | 'pending_approval' | 'approved' | 'revision_requested';
export type RequestSource = 'client' | 'operator';
export type RequestStatus = 'pending' | 'approved' | 'declined' | 'completed';
export type ApprovalAction = 'approved' | 'revision_requested';
export type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';
export type BillingType = 'one_time' | 'recurring';
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
export type ContentBlockType = 'rich_text' | 'image_gallery' | 'video_embed';

// Table interfaces
export interface Operator {
  id: string;
  email: string;
  full_name: string;
  business_name: string | null;
  avatar_url: string | null;
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean;
  stripe_disconnected_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  operator_id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  status: ClientStatus;
  magic_link_token_hash: string | null;
  magic_link_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScopeAllocation {
  id: string;
  client_id: string;
  period_start: string;
  period_end: string;
  scope_type: ScopeType;
  total_allocated: number;
  unit_label: string;
  created_at: string;
  updated_at: string;
}

export interface DeliveryItem {
  id: string;
  client_id: string;
  scope_allocation_id: string | null;
  title: string;
  description: string | null;
  category: string;
  status: DeliveryStatus;
  scope_cost: number;
  hours_spent: number | null;
  is_out_of_scope: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScopeRequest {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  requested_by: RequestSource;
  status: RequestStatus;
  scope_cost: number | null;
  created_at: string;
  updated_at: string;
}

export interface ClientApproval {
  id: string;
  delivery_item_id: string;
  action: ApprovalAction;
  note: string | null;
  acted_at: string;
  created_at: string;
}

export interface TimeEntry {
  id: string;
  operator_id: string;
  client_id: string;
  delivery_item_id: string | null;
  description: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  is_manual: boolean;
  created_at: string;
  updated_at: string;
}

export interface AddonTemplate {
  id: string;
  operator_id: string;
  name: string;
  description: string | null;
  default_price: number;
  billing_type: BillingType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Proposal {
  id: string;
  operator_id: string;
  client_id: string;
  title: string;
  summary: string | null;
  summary_json: Record<string, unknown> | null;
  content_version: number;
  notes: string | null;
  status: ProposalStatus;
  version: number;
  parent_proposal_id: string | null;
  valid_days: number | null;
  expires_at: string | null;
  sent_at: string | null;
  viewed_at: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  decline_reason: string | null;
  token_hash: string | null;
  token_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProposalLineItem {
  id: string;
  proposal_id: string;
  name: string;
  description: string | null;
  description_json: Record<string, unknown> | null;
  quantity: number;
  unit_price: number;
  billing_type: BillingType;
  sort_order: number;
  created_at: string;
}

export interface ProposalAddon {
  id: string;
  proposal_id: string;
  addon_template_id: string | null;
  name: string;
  description: string | null;
  description_json: Record<string, unknown> | null;
  price: number;
  billing_type: BillingType;
  is_included: boolean;
  is_selected: boolean;
  sort_order: number;
  created_at: string;
}

export type AgreementBillingStatus = 'pending_billing' | 'billing_active' | 'billing_failed' | 'not_applicable';

export interface Agreement {
  id: string;
  proposal_id: string;
  client_id: string;
  operator_id: string;
  snapshot: Record<string, unknown>;
  snapshot_hash: string | null;
  signer_name: string;
  signer_email: string | null;
  signature_data: Record<string, unknown>;
  signed_at: string;
  billing_status: AgreementBillingStatus;
  created_at: string;
}

export interface WebhookEndpoint {
  id: string;
  operator_id: string;
  url: string;
  secret: string;
  events: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_endpoint_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  response_status: number | null;
  response_body: string | null;
  delivered_at: string | null;
  attempts: number;
  next_retry_at: string | null;
  created_at: string;
}

export interface PaymentRecord {
  id: string;
  agreement_id: string;
  client_id: string;
  operator_id: string;
  stripe_payment_intent_id: string | null;
  stripe_invoice_id: string | null;
  stripe_subscription_id: string | null;
  amount: number;
  currency: string;
  payment_status: PaymentStatus;
  billing_type: BillingType;
  period_start: string | null;
  period_end: string | null;
  paid_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProposalContentBlock {
  id: string;
  proposal_id: string;
  type: ContentBlockType;
  position: number;
  content_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type TemplateCategory = 'intro' | 'deliverables' | 'terms' | 'custom';

export interface ProposalTemplate {
  id: string;
  operator_id: string | null;
  name: string;
  description: string | null;
  content_json: Record<string, unknown>;
  category: TemplateCategory | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export type InsertProposalTemplate = Pick<ProposalTemplate, 'name' | 'content_json'> &
  Partial<Pick<ProposalTemplate, 'description' | 'category'>>;

// Derived types
export interface ProposalWithDetails extends Proposal {
  line_items: ProposalLineItem[];
  addons: ProposalAddon[];
  content_blocks?: ProposalContentBlock[];
  client?: Client;
  agreement?: Agreement;
}

export interface ClientWithScope extends Client {
  scope_allocations: ScopeAllocation[];
  delivery_items: DeliveryItem[];
}

export interface ClientListItem extends Client {
  scope_allocations: ScopeAllocation[];
  delivery_items: { scope_cost: number; is_out_of_scope: boolean }[];
}

// Insert types (omit auto-generated fields)
export type InsertClient = Pick<Client, 'company_name' | 'operator_id'> &
  Partial<Pick<Client, 'contact_name' | 'contact_email' | 'contact_phone' | 'notes' | 'status'>>;

export type InsertDeliveryItem = Pick<DeliveryItem, 'client_id' | 'title' | 'category'> &
  Partial<Pick<DeliveryItem, 'description' | 'status' | 'scope_cost' | 'hours_spent' | 'is_out_of_scope' | 'completed_at' | 'scope_allocation_id'>>;

export type InsertScopeAllocation = Pick<ScopeAllocation, 'client_id' | 'period_start' | 'period_end' | 'scope_type' | 'total_allocated' | 'unit_label'>;

export type InsertScopeRequest = Pick<ScopeRequest, 'client_id' | 'title'> &
  Partial<Pick<ScopeRequest, 'description' | 'requested_by' | 'status' | 'scope_cost'>>;

export type InsertTimeEntry = Pick<TimeEntry, 'operator_id' | 'client_id' | 'description' | 'started_at'> &
  Partial<Pick<TimeEntry, 'delivery_item_id' | 'ended_at' | 'duration_seconds' | 'is_manual'>>;

export type InsertAddonTemplate = Pick<AddonTemplate, 'operator_id' | 'name' | 'default_price' | 'billing_type'> &
  Partial<Pick<AddonTemplate, 'description' | 'is_active'>>;

export type InsertProposal = Pick<Proposal, 'operator_id' | 'client_id' | 'title'> &
  Partial<Pick<Proposal, 'summary' | 'summary_json' | 'content_version' | 'notes' | 'status' | 'version' | 'parent_proposal_id' | 'valid_days' | 'expires_at'>>;

export type InsertProposalLineItem = Pick<ProposalLineItem, 'proposal_id' | 'name' | 'quantity' | 'unit_price' | 'billing_type'> &
  Partial<Pick<ProposalLineItem, 'description' | 'description_json' | 'sort_order'>>;

export type InsertProposalAddon = Pick<ProposalAddon, 'proposal_id' | 'name' | 'price' | 'billing_type'> &
  Partial<Pick<ProposalAddon, 'addon_template_id' | 'description' | 'description_json' | 'is_included' | 'is_selected' | 'sort_order'>>;

export type InsertWebhookEndpoint = Pick<WebhookEndpoint, 'operator_id' | 'url' | 'secret' | 'events'> &
  Partial<Pick<WebhookEndpoint, 'is_active'>>;

export type InsertProposalContentBlock = Pick<ProposalContentBlock, 'proposal_id' | 'type' | 'position' | 'content_json'>;
