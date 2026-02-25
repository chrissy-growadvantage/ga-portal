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
