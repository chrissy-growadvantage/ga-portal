import { z } from 'zod';

// Tiptap JSON content node schema (validates Tiptap document structure)
const tiptapMarkSchema = z.object({
  type: z.string(),
  attrs: z.record(z.unknown()).optional(),
});

const tiptapContentNodeSchema: z.ZodType<{
  type: string;
  attrs?: Record<string, unknown>;
  content?: unknown[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  text?: string;
}> = z.lazy(() =>
  z.object({
    type: z.string(),
    attrs: z.record(z.unknown()).optional(),
    content: z.array(tiptapContentNodeSchema).optional(),
    marks: z.array(tiptapMarkSchema).optional(),
    text: z.string().optional(),
  }),
);

export const tiptapJSONSchema = z.object({
  type: z.literal('doc'),
  content: z.array(tiptapContentNodeSchema).optional(),
});

export type TiptapJSON = z.infer<typeof tiptapJSONSchema>;

// Addon Template
export const createAddonTemplateSchema = z.object({
  name: z.string().min(1, 'Addon name is required').max(100),
  description: z.string().max(500).optional(),
  default_price: z.number().min(0, 'Price must be 0 or more'),
  billing_type: z.enum(['one_time', 'recurring']),
});
export type CreateAddonTemplateInput = z.infer<typeof createAddonTemplateSchema>;

// Proposal Line Item (used within proposal form)
export const proposalLineItemSchema = z.object({
  name: z.string().min(1, 'Service name is required').max(200),
  description: z.string().max(1000).optional(),
  description_json: tiptapJSONSchema.optional().nullable(),
  quantity: z.number().min(0).default(1),
  unit_price: z.number().min(0, 'Price must be 0 or more'),
  billing_type: z.enum(['one_time', 'recurring']),
  sort_order: z.number().int().min(0).default(0),
});

// Proposal Addon (used within proposal form)
export const proposalAddonSchema = z.object({
  addon_template_id: z.string().uuid().optional().nullable(),
  name: z.string().min(1, 'Addon name is required').max(200),
  description: z.string().max(1000).optional(),
  description_json: tiptapJSONSchema.optional().nullable(),
  price: z.number().min(0, 'Price must be 0 or more'),
  billing_type: z.enum(['one_time', 'recurring']),
  is_included: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
});

// Full Proposal (create/edit)
export const createProposalSchema = z.object({
  client_id: z.string().uuid('Please select a client'),
  title: z.string().min(1, 'Proposal title is required').max(200),
  summary: z.string().max(5000).optional(),
  summary_json: tiptapJSONSchema.optional().nullable(),
  notes: z.string().max(2000).optional(),
  valid_days: z.number().int().min(1).max(365).optional().nullable(),
  line_items: z.array(proposalLineItemSchema).min(1, 'At least one service item is required'),
  addons: z.array(proposalAddonSchema).default([]),
});
export type CreateProposalInput = z.infer<typeof createProposalSchema>;

// Client acceptance (portal side)
export const acceptProposalSchema = z.object({
  signer_name: z.string().min(1, 'Please type your full name').max(200),
  signer_email: z.string().email('Please enter a valid email').optional(),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the terms to proceed' }),
  }),
});
export type AcceptProposalInput = z.infer<typeof acceptProposalSchema>;

// Client decline (portal side)
export const declineProposalSchema = z.object({
  reason: z.string().max(2000).optional(),
});
export type DeclineProposalInput = z.infer<typeof declineProposalSchema>;

// Webhook endpoint
export const createWebhookEndpointSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  events: z.array(z.string()).min(1, 'Select at least one event'),
  is_active: z.boolean().default(true),
});
export type CreateWebhookEndpointInput = z.infer<typeof createWebhookEndpointSchema>;
