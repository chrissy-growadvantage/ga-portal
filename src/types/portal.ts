import type { Client, DeliveryItem, ScopeAllocation, Operator, Agreement, MonthlySnapshotIndex, OnboardingStage, ClientTask, GaRequestStatus } from './database';

export type PortalClient = Pick<
  Client,
  | 'id'
  | 'company_name'
  | 'contact_name'
  | 'status'
  // Portal metadata
  | 'integrator_name'
  | 'primary_comms_channel'
  | 'next_strategy_meeting'
  | 'this_month_outcomes'
  | 'this_month_deliverables'
  | 'this_month_improvements'
  | 'this_month_risks'
  | 'this_month_focus'
  | 'portal_slack_url'
  | 'portal_drive_url'
  | 'portal_booking_url'
  | 'hours_used_this_month'
  | 'next_meeting_at'
  | 'next_meeting_link'
  | 'completed_this_month'
  | 'monthly_plan_notes'
> & {
  portal_stripe_url: string | null;
  portal_intake_url: string | null;
  onboarding_stage: number | null;
};

export type PortalScopeRequest = {
  id: string;
  title: string;
  description: string | null;
  requested_by: 'client' | 'operator';
  status: 'pending' | 'approved' | 'declined' | 'completed';
  scope_cost: number | null;
  category: string | null;
  admin_note: string | null;
  attachment_url: string | null;
  ga_status: GaRequestStatus | null;
  created_at: string;
};

export type PortalOnboardingStage = Pick<
  OnboardingStage,
  'id' | 'stage_key' | 'stage_label' | 'sort_order' | 'status' | 'owner_label' | 'due_date' | 'notes' | 'action_url' | 'completed_at'
>;

export type PortalClientTask = Pick<
  ClientTask,
  'id' | 'title' | 'due_date' | 'link_url' | 'completed_at' | 'created_at'
>;

export type PortalData = {
  client: PortalClient;
  operator: Pick<Operator, 'full_name' | 'business_name' | 'portal_logo_url' | 'portal_primary_color' | 'portal_accent_color'>;
  deliveries: DeliveryItem[];
  scope_allocations: ScopeAllocation[];
  agreements: Agreement[];
  monthly_snapshots: MonthlySnapshotIndex[];
  scope_requests: PortalScopeRequest[];
  onboarding_stages: PortalOnboardingStage[];
  client_tasks: PortalClientTask[];
};

export type PortalError = {
  code: 'INVALID_TOKEN' | 'EXPIRED_TOKEN' | 'NOT_FOUND' | 'SERVER_ERROR';
  message: string;
};
