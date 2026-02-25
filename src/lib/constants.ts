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
  active: { label: 'Active', color: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500', icon: 'check-circle' },
  paused: { label: 'Paused', color: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500', icon: 'pause-circle' },
  archived: { label: 'Archived', color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400', icon: 'archive' },
} as const;

export const DELIVERY_STATUS_CONFIG = {
  completed: { label: 'Completed', color: 'bg-emerald-50 text-emerald-700', icon: 'check-circle' },
  in_progress: { label: 'In Progress', color: 'bg-indigo-50 text-indigo-700', icon: 'clock' },
  pending_approval: { label: 'Pending Approval', color: 'bg-amber-50 text-amber-700', icon: 'clock' },
  approved: { label: 'Approved', color: 'bg-emerald-50 text-emerald-700', icon: 'check-circle' },
  revision_requested: { label: 'Revision Requested', color: 'bg-red-50 text-red-700', icon: 'alert-circle' },
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
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    dotColor: 'bg-emerald-500',
    barColor: 'bg-emerald-500',
  },
  active: {
    label: 'Active',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    dotColor: 'bg-indigo-500',
    barColor: 'bg-indigo-500',
  },
  nearing: {
    label: 'Nearing Limit',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    dotColor: 'bg-amber-500',
    barColor: 'bg-amber-500',
  },
  'at-limit': {
    label: 'Fully Used',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    dotColor: 'bg-amber-500',
    barColor: 'bg-amber-500',
  },
  exceeded: {
    label: 'Exceeded',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    dotColor: 'bg-red-500',
    barColor: 'bg-red-500',
  },
} as const;

export const PROPOSAL_STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400', icon: 'file-edit' },
  sent: { label: 'Sent', color: 'bg-primary/10 text-primary', dot: 'bg-primary', icon: 'send' },
  viewed: { label: 'Viewed', color: 'bg-blue-50 text-blue-700', dot: 'bg-blue-500', icon: 'eye' },
  accepted: { label: 'Accepted', color: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500', icon: 'check-circle' },
  declined: { label: 'Declined', color: 'bg-red-50 text-red-700', dot: 'bg-red-500', icon: 'x-circle' },
  expired: { label: 'Expired', color: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500', icon: 'clock' },
} as const;

export const BILLING_TYPE_LABELS = {
  one_time: 'One-time',
  recurring: 'Recurring',
} as const;

export const PAYMENT_STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-amber-50 text-amber-700', icon: 'clock' },
  paid: { label: 'Paid', color: 'bg-emerald-50 text-emerald-700', icon: 'check-circle' },
  overdue: { label: 'Overdue', color: 'bg-red-50 text-red-700', icon: 'alert-circle' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500', icon: 'x-circle' },
  refunded: { label: 'Refunded', color: 'bg-blue-50 text-blue-700', icon: 'rotate-ccw' },
} as const;

export const WEBHOOK_EVENTS = [
  'proposal.created', 'proposal.sent', 'proposal.viewed',
  'proposal.accepted', 'proposal.declined', 'proposal.expired',
  'agreement.created',
  'payment.created', 'payment.succeeded', 'payment.failed', 'payment.refunded',
  'subscription.created', 'subscription.cancelled',
] as const;
