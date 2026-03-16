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
  portal_logo_url: string | null;
  portal_primary_color: string | null;
  portal_accent_color: string | null;
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
  // Portal metadata fields (added in migration 021)
  integrator_name: string | null;
  primary_comms_channel: string | null;
  next_strategy_meeting: string | null;
  this_month_outcomes: string | null;
  this_month_deliverables: string | null;
  this_month_improvements: string | null;
  this_month_risks: string | null;
  this_month_focus: string | null;
  portal_slack_url: string | null;
  portal_drive_url: string | null;
  portal_booking_url: string | null;
  hours_used_this_month: number | null;
  next_meeting_at: string | null;
  next_meeting_link: string | null;
  portal_stripe_url: string | null;
  portal_intake_url: string | null;
  portal_proposal_url: string | null;
  portal_contract_url: string | null;
  portal_contract_pdf_url: string | null;
  onboarding_stage: number | null;
  // Portal content fields (added in migration 033)
  completed_this_month: string | null;
  monthly_plan_notes: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Monthly Snapshot JSONB sub-types (migration 021)
// ============================================================

export type PriorityItem = {
  id: string;
  text: string;
  phase: string;
  category: string;
  uplift: string;
  status: string;
};

export type ProcessItem = {
  id: string;
  text: string;
};

export type AdhocItem = {
  id: string;
  title: string;
  category: string;
  status: string;
  note: string;
};

export type MeetingItem = {
  id: string;
  name: string;
  frequency: string;
  owner: string;
  status: string;
};

export type DecisionItem = {
  id: string;
  text: string;
  owner: string;
  due: string;
};

export type AgreementSnapshotItem = {
  id: string;
  label: string;
  value: string;
};

export interface MonthlySnapshot {
  id: string;
  client_id: string;
  operator_id: string;
  month_label: string;
  month_slug: string;
  meeting_date: string | null;
  attendees: string | null;
  // Delivery
  wins: string | null;
  deliverables_completed: string | null;
  slipped: string | null;
  insights: string | null;
  upcoming_priorities: PriorityItem[];
  key_deadlines: string | null;
  risks_constraints: string | null;
  process_improvements: ProcessItem[];
  adhoc_requests: AdhocItem[];
  // Comms
  primary_comms: string | null;
  recurring_meetings: MeetingItem[];
  response_times: string | null;
  working_well: string | null;
  unclear_messy: string | null;
  more_visibility: string | null;
  // Scores (0-10)
  priorities_score: number | null;
  delivery_score: number | null;
  communication_score: number | null;
  capacity_score: number | null;
  // Actions
  decisions_actions: DecisionItem[];
  blockers: string | null;
  // Impact
  time_saved: string | null;
  friction_removed: string | null;
  systems_implemented: string | null;
  // Agreement snapshot
  agreement_snapshot: AgreementSnapshotItem[];
  // Timestamps
  created_at: string;
  updated_at: string;
}

export type MonthlySnapshotIndex = Pick<
  MonthlySnapshot,
  'id' | 'month_label' | 'month_slug' | 'created_at'
>;

export type InsertMonthlySnapshot = Pick<
  MonthlySnapshot,
  'client_id' | 'operator_id' | 'month_label' | 'month_slug'
> &
  Partial<
    Omit<MonthlySnapshot, 'id' | 'client_id' | 'operator_id' | 'month_label' | 'month_slug' | 'created_at' | 'updated_at'>
  >;

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
  phase: string | null;
  uplift: string | null;
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
  category: string | null;
  attachment_url: string | null;
  admin_note: string | null;
  ga_status: GaRequestStatus | null;
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
  Partial<Pick<DeliveryItem, 'description' | 'status' | 'scope_cost' | 'hours_spent' | 'is_out_of_scope' | 'completed_at' | 'scope_allocation_id' | 'phase' | 'uplift'>>;

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

// ============================================================
// GA4 Connections (migration 022)
// ============================================================

export interface Ga4Connection {
  id: string;
  client_id: string;
  operator_id: string;
  property_id: string;
  property_name: string | null;
  refresh_token: string | null;
  created_at: string;
  updated_at: string;
}

export type InsertGa4Connection = Pick<
  Ga4Connection,
  'client_id' | 'operator_id' | 'property_id'
> &
  Partial<Pick<Ga4Connection, 'property_name' | 'refresh_token'>>;

// ============================================================
// Client Notes / Brain Dump (migration 024)
// ============================================================

export type ClientNoteType = 'note' | 'request' | 'todo' | 'idea';

export interface ClientNote {
  id: string;
  client_id: string;
  operator_id: string;
  body: string;
  type: ClientNoteType;
  created_at: string;
}

export type InsertClientNote = Pick<ClientNote, 'client_id' | 'operator_id' | 'body'> &
  Partial<Pick<ClientNote, 'type'>>;

// ============================================================
// GA Portal MVP — Onboarding, Tasks, Pick-lists (migrations 025–029)
// ============================================================

export type OnboardingStageStatus = 'not_started' | 'in_progress' | 'waiting_on_client' | 'blocked' | 'done';
export type OnboardingStageOwner = 'operator' | 'client';

export type GaRequestStatus = 'submitted' | 'received' | 'in_progress' | 'waiting_on_client' | 'done';

export type PickListType = 'phase' | 'category' | 'uplift' | 'work_status';

export interface OnboardingStage {
  id: string;
  client_id: string;
  operator_id: string;
  stage_key: string;
  stage_label: string;
  sort_order: number;
  status: OnboardingStageStatus;
  owner_label: OnboardingStageOwner;
  due_date: string | null;
  notes: string | null;
  action_url: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type InsertOnboardingStage = Pick<
  OnboardingStage,
  'client_id' | 'operator_id' | 'stage_key' | 'stage_label' | 'sort_order'
> &
  Partial<Pick<OnboardingStage, 'status' | 'owner_label' | 'due_date' | 'notes' | 'action_url'>>;

export interface ClientTask {
  id: string;
  client_id: string;
  operator_id: string;
  title: string;
  due_date: string | null;
  link_url: string | null;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type InsertClientTask = Pick<ClientTask, 'client_id' | 'operator_id' | 'title'> &
  Partial<Pick<ClientTask, 'due_date' | 'link_url' | 'notes'>>;

export interface PickListItem {
  id: string;
  operator_id: string;
  list_type: PickListType;
  label: string;
  colour: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export type InsertPickListItem = Pick<PickListItem, 'operator_id' | 'list_type' | 'label'> &
  Partial<Pick<PickListItem, 'colour' | 'sort_order' | 'is_active'>>;

// ============================================================
// Grant Evidence (migration 034)
// ============================================================

export type GrantEvidenceEndorsementStatus = 'not_requested' | 'requested' | 'received';

export type GrantEvidencePilotClient = {
  name: string;
  startDate: string;
  currentStage: string;
  notes: string;
  endorsementStatus: GrantEvidenceEndorsementStatus;
  endorsementLink: string;
};

export type GrantEvidenceChecklist = {
  screenshotsSaved: boolean;
  loomRecorded: boolean;
  usageNotesWritten: boolean;
};

export type GrantEvidenceKPIs = {
  requestsSubmitted: string;
  requestsResolved: string;
  overdueActionsCount: string;
  estimatedTimeSavedHours: string;
};

export interface GrantEvidence {
  id: string;
  operator_id: string;
  client_a: GrantEvidencePilotClient;
  client_b: GrantEvidencePilotClient;
  checklist: GrantEvidenceChecklist;
  kpis: GrantEvidenceKPIs;
  created_at: string;
  updated_at: string;
}

export type UpsertGrantEvidence = Pick<GrantEvidence, 'operator_id' | 'client_a' | 'client_b' | 'checklist' | 'kpis'>;
