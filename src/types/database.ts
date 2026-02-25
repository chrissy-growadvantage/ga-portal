// Luma Database Types — mirrors supabase/migrations/001_luma_schema.sql

// Enum types
export type ClientStatus = 'active' | 'paused' | 'archived';
export type ScopeType = 'hours' | 'deliverables' | 'custom';
export type DeliveryStatus = 'completed' | 'in_progress' | 'pending_approval' | 'approved' | 'revision_requested';
export type RequestSource = 'client' | 'operator';
export type RequestStatus = 'pending' | 'approved' | 'declined' | 'completed';
export type ApprovalAction = 'approved' | 'revision_requested';

// Table interfaces
export interface Operator {
  id: string;
  email: string;
  full_name: string;
  business_name: string | null;
  avatar_url: string | null;
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

// Derived types
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
