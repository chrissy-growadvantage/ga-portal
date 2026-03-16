import { z } from 'zod';

export const createClientSchema = z.object({
  company_name: z.string().min(1, 'Company / client name is required').max(200),
  contact_name: z.string().max(200).optional().or(z.literal('')),
  contact_email: z.string().email('Invalid email').optional().or(z.literal('')),
  contact_phone: z.string().max(30).optional().or(z.literal('')),
  notes: z.string().max(5000).optional().or(z.literal('')),
});

export const createDeliveryItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().max(5000).optional(),
  category: z.string().min(1, 'Category is required').max(100),
  phase: z.string().max(200).optional(),
  uplift: z.string().max(300).optional(),
  status: z.enum(['completed', 'in_progress', 'pending_approval', 'approved', 'revision_requested']).default('completed'),
  hours_spent: z.number().min(0).max(10000).optional(),
  scope_cost: z.number().min(0).max(10000).default(1),
  is_out_of_scope: z.boolean().default(false),
});

export const createScopeAllocationSchema = z.object({
  period_start: z.string().min(1, 'Start date is required'),
  period_end: z.string().min(1, 'End date is required'),
  scope_type: z.enum(['hours', 'deliverables', 'custom']),
  total_allocated: z.number().min(0).max(100000),
  unit_label: z.string().min(1).max(50),
});

export const startTimerSchema = z.object({
  client_id: z.string().min(1, 'Client is required'),
  description: z.string().min(1, 'Description is required').max(500),
  delivery_item_id: z.string().optional(),
});

export const manualTimeEntrySchema = z.object({
  client_id: z.string().min(1, 'Client is required'),
  description: z.string().min(1, 'Description is required').max(500),
  delivery_item_id: z.string().optional(),
  started_at: z.string().min(1, 'Start time is required'),
  ended_at: z.string().min(1, 'End time is required'),
});

export const createScopeRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().max(2000).optional(),
});

// Supabase response schemas (trust boundary validation)
export const brandingFormResponseSchema = z.object({
  portal_logo_url: z.string().nullable().transform(v => v ?? ''),
  portal_primary_color: z.string().nullable().transform(v => v ?? '#5B4DC7'),
  portal_accent_color: z.string().nullable().transform(v => v ?? '#E8853A'),
  business_name: z.string().nullable().transform(v => v ?? ''),
});

const grantEvidencePilotClientSchema = z.object({
  name: z.string().default(''),
  startDate: z.string().default(''),
  currentStage: z.string().default(''),
  notes: z.string().default(''),
  endorsementStatus: z.enum(['not_requested', 'requested', 'received']).default('not_requested'),
  endorsementLink: z.string().default(''),
});

export const grantEvidenceRowSchema = z.object({
  id: z.string(),
  operator_id: z.string(),
  client_a: grantEvidencePilotClientSchema,
  client_b: grantEvidencePilotClientSchema,
  checklist: z.object({
    screenshotsSaved: z.boolean().default(false),
    loomRecorded: z.boolean().default(false),
    usageNotesWritten: z.boolean().default(false),
  }),
  kpis: z.object({
    requestsSubmitted: z.string().default(''),
    requestsResolved: z.string().default(''),
    overdueActionsCount: z.string().default(''),
    estimatedTimeSavedHours: z.string().default(''),
  }),
  created_at: z.string(),
  updated_at: z.string(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type CreateDeliveryItemInput = z.infer<typeof createDeliveryItemSchema>;
export type CreateScopeAllocationInput = z.infer<typeof createScopeAllocationSchema>;
export type StartTimerInput = z.infer<typeof startTimerSchema>;
export type ManualTimeEntryInput = z.infer<typeof manualTimeEntrySchema>;
export type CreateScopeRequestInput = z.infer<typeof createScopeRequestSchema>;
