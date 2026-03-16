export const DELIVERY_CATEGORIES = [
  'Marketing',
  'Operations',
  'Finance',
  'Tech',
  'Admin',
  'Strategy',
  'Content',
  'Design',
  'General',
] as const;

export const CLIENT_STATUS_CONFIG = {
  active: { label: 'Active', color: 'bg-status-success/10 text-status-success', dot: 'bg-status-success', icon: 'check-circle' },
  paused: { label: 'Paused', color: 'bg-status-warning/10 text-status-warning', dot: 'bg-status-warning', icon: 'pause-circle' },
  archived: { label: 'Archived', color: 'bg-status-neutral/10 text-status-neutral', dot: 'bg-status-neutral', icon: 'archive' },
} as const;

export const DELIVERY_STATUS_CONFIG = {
  completed: { label: 'Completed', color: 'bg-status-success/10 text-status-success', icon: 'check-circle' },
  in_progress: { label: 'In Progress', color: 'bg-status-info/10 text-status-info', icon: 'clock' },
  pending_approval: { label: 'Pending Approval', color: 'bg-status-warning/10 text-status-warning', icon: 'clock' },
  approved: { label: 'Approved', color: 'bg-status-success/10 text-status-success', icon: 'check-circle' },
  revision_requested: { label: 'Revision Requested', color: 'bg-status-danger/10 text-status-danger', icon: 'alert-circle' },
} as const;

export const SCOPE_TYPE_LABELS = {
  hours: 'Hours',
  deliverables: 'Deliverables',
  custom: 'Custom',
} as const;

export type ScopeStatusTier = 'on-track' | 'active' | 'nearing' | 'at-limit' | 'exceeded';

export const SCOPE_STATUS_CONFIG: Record<
  ScopeStatusTier,
  { label: string; color: string; bgColor: string; dotColor: string; barColor: string }
> = {
  'on-track': {
    label: 'On Track',
    color: 'text-status-success',
    bgColor: 'bg-status-success/10',
    dotColor: 'bg-status-success',
    barColor: 'bg-status-success',
  },
  active: {
    label: 'Active',
    color: 'text-status-info',
    bgColor: 'bg-status-info/10',
    dotColor: 'bg-status-info',
    barColor: 'bg-status-info',
  },
  nearing: {
    label: 'Nearing Limit',
    color: 'text-status-warning',
    bgColor: 'bg-status-warning/10',
    dotColor: 'bg-status-warning',
    barColor: 'bg-status-warning',
  },
  'at-limit': {
    label: 'Fully Used',
    color: 'text-status-warning',
    bgColor: 'bg-status-warning/10',
    dotColor: 'bg-status-warning',
    barColor: 'bg-status-warning',
  },
  exceeded: {
    label: 'Exceeded',
    color: 'text-status-danger',
    bgColor: 'bg-status-danger/10',
    dotColor: 'bg-status-danger',
    barColor: 'bg-status-danger',
  },
} as const;

export const PROPOSAL_STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-status-neutral/10 text-status-neutral', dot: 'bg-status-neutral', icon: 'file-edit' },
  sent: { label: 'Sent', color: 'bg-status-info/10 text-status-info', dot: 'bg-status-info', icon: 'send' },
  viewed: { label: 'Viewed', color: 'bg-status-info/10 text-status-info', dot: 'bg-status-info', icon: 'eye' },
  accepted: { label: 'Accepted', color: 'bg-status-success/10 text-status-success', dot: 'bg-status-success', icon: 'check-circle' },
  declined: { label: 'Declined', color: 'bg-status-danger/10 text-status-danger', dot: 'bg-status-danger', icon: 'x-circle' },
  expired: { label: 'Expired', color: 'bg-status-neutral/10 text-status-neutral', dot: 'bg-status-neutral', icon: 'clock' },
} as const;

export const BILLING_TYPE_LABELS = {
  one_time: 'One-time',
  recurring: 'Recurring',
} as const;

export const PAYMENT_STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-status-warning/10 text-status-warning', icon: 'clock' },
  paid: { label: 'Paid', color: 'bg-status-success/10 text-status-success', icon: 'check-circle' },
  overdue: { label: 'Overdue', color: 'bg-status-danger/10 text-status-danger', icon: 'alert-circle' },
  cancelled: { label: 'Cancelled', color: 'bg-status-neutral/10 text-status-neutral', icon: 'x-circle' },
  refunded: { label: 'Refunded', color: 'bg-status-info/10 text-status-info', icon: 'rotate-ccw' },
} as const;

export const REQUEST_STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-status-warning/10 text-status-warning', icon: 'clock' },
  approved: { label: 'Approved', color: 'bg-status-success/10 text-status-success', icon: 'check-circle' },
  declined: { label: 'Declined', color: 'bg-status-danger/10 text-status-danger', icon: 'x-circle' },
  completed: { label: 'Completed', color: 'bg-status-success/10 text-status-success', icon: 'check-circle' },
} as const;

// ============================================================
// GA Portal MVP — Onboarding, Tasks, Pick-lists
// ============================================================

export const GA_REQUEST_STATUS_CONFIG = {
  submitted: { label: 'Submitted', color: 'bg-status-neutral/10 text-status-neutral', icon: 'inbox' },
  received: { label: 'Received', color: 'bg-status-info/10 text-status-info', icon: 'check' },
  in_progress: { label: 'In Progress', color: 'bg-status-info/10 text-status-info', icon: 'clock' },
  waiting_on_client: { label: 'Waiting on You', color: 'bg-status-danger/10 text-status-danger', icon: 'alert-circle' },
  done: { label: 'Done', color: 'bg-status-success/10 text-status-success', icon: 'check-circle' },
} as const;

export const ONBOARDING_STAGE_STATUS_CONFIG = {
  not_started: { label: 'Not Started', color: 'text-status-neutral', bgColor: 'bg-status-neutral/10', icon: 'circle' },
  in_progress: { label: 'In Progress', color: 'text-status-info', bgColor: 'bg-status-info/10', icon: 'loader' },
  waiting_on_client: { label: 'Waiting on You', color: 'text-status-danger', bgColor: 'bg-status-danger/10', icon: 'alert-triangle' },
  blocked: { label: 'Blocked', color: 'text-status-danger', bgColor: 'bg-status-danger/10', icon: 'shield-alert' },
  done: { label: 'Complete', color: 'text-status-success', bgColor: 'bg-status-success/10', icon: 'check-circle' },
} as const;

export const DEFAULT_ONBOARDING_STAGES = [
  { stage_key: 'sanity_call', stage_label: 'Sanity Call', owner_label: 'operator' as const },
  { stage_key: 'proposal', stage_label: 'Proposal Sent', owner_label: 'operator' as const },
  { stage_key: 'contract', stage_label: 'Contract Signed', owner_label: 'client' as const },
  { stage_key: 'payment', stage_label: 'Payment Setup', owner_label: 'client' as const },
  { stage_key: 'intake', stage_label: 'Intake Form', owner_label: 'client' as const },
  { stage_key: 'tech_setup', stage_label: 'Tech Setup', owner_label: 'operator' as const },
  { stage_key: 'kickoff', stage_label: 'Kickoff Meeting', owner_label: 'operator' as const },
  { stage_key: 'week_1', stage_label: 'Week 1 Started', owner_label: 'operator' as const },
] as const;

export const DEFAULT_PICK_LIST_PHASES = [
  'Month 1 – Strategise (Audit & Align)',
  'Month 2 – Optimise (Simplify & Systemise)',
  'Month 3 – Maximise (Measure & Strengthen)',
  'Month 4–6 – Scale (Growth Engine Phase)',
  'Month 7–12 – Sustain (Partnership Phase)',
] as const;

export const DEFAULT_PICK_LIST_CATEGORIES = [
  'Audit & findings',
  'Process improvement',
  'Automation',
  'Systems / tech stack',
  'Team & roles',
  'Cadence & comms',
  'Reporting & dashboards',
  'Delivery quality',
  'Capacity / scaling',
  'Strategy reset',
] as const;

export const DEFAULT_PICK_LIST_UPLIFTS = [
  'As-is audit completed (team/systems/delivery)',
  'Operational gaps / energy leaks identified',
  'Reduce admin / inbox / decision fatigue',
  'Automate repetitive workflows',
  'Dashboards + performance reporting established',
  'SOPs + handovers refined',
  'Leadership rhythms embedded (weekly/monthly/quarterly)',
  'Growth KPIs + forecasting model introduced',
  'Quarterly strategy reset executed',
] as const;

export const DEFAULT_PICK_LIST_WORK_STATUSES = [
  { label: 'Not started', colour: null },
  { label: 'In progress', colour: null },
  { label: 'Waiting on client', colour: '#EF4444' },
  { label: 'Blocked', colour: '#EF4444' },
  { label: 'Done', colour: null },
] as const;

export const WEBHOOK_EVENTS = [
  'proposal.created', 'proposal.sent', 'proposal.viewed',
  'proposal.accepted', 'proposal.declined', 'proposal.expired',
  'agreement.created',
  'payment.created', 'payment.succeeded', 'payment.failed', 'payment.refunded',
  'subscription.created', 'subscription.cancelled',
] as const;
