import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProposalSchema, type CreateProposalInput } from '@/lib/proposal-schemas';
import { ProposalLineItems } from './ProposalLineItems';

// Mock InlineDescriptionEditor to avoid Tiptap initialization in tests
vi.mock('@/components/editor/InlineDescriptionEditor', () => ({
  InlineDescriptionEditor: ({ placeholder }: { placeholder?: string }) => (
    <div data-testid="mock-description-editor">{placeholder}</div>
  ),
}));

function createLineItem(overrides: Partial<CreateProposalInput['line_items'][0]> = {}) {
  return {
    name: '',
    description: '',
    description_json: null,
    quantity: 1,
    unit_price: 0,
    billing_type: 'one_time' as const,
    sort_order: 0,
    ...overrides,
  };
}

function TestWrapper({
  lineItems = [createLineItem({ name: 'Service A', sort_order: 0 })],
}: {
  lineItems?: CreateProposalInput['line_items'];
}) {
  const form = useForm<CreateProposalInput>({
    resolver: zodResolver(createProposalSchema),
    defaultValues: {
      client_id: '00000000-0000-0000-0000-000000000001',
      title: 'Test Proposal',
      line_items: lineItems,
      addons: [],
    },
  });

  return (
    <FormProvider {...form}>
      <ProposalLineItems form={form} />
    </FormProvider>
  );
}

describe('ProposalLineItems', () => {
  it('renders "Service Items" heading', () => {
    render(<TestWrapper />);
    expect(screen.getByText('Service Items')).toBeInTheDocument();
  });

  it('renders "Add Line Item" button', () => {
    render(<TestWrapper />);
    expect(screen.getByRole('button', { name: /add line item/i })).toBeInTheDocument();
  });

  it('renders drag handles for each line item', () => {
    render(
      <TestWrapper
        lineItems={[
          createLineItem({ name: 'Service A', sort_order: 0 }),
          createLineItem({ name: 'Service B', sort_order: 1 }),
        ]}
      />,
    );
    const dragHandles = screen.getAllByLabelText('Drag to reorder');
    expect(dragHandles).toHaveLength(2);
  });

  it('disables drag handles when only one line item exists', () => {
    render(
      <TestWrapper
        lineItems={[createLineItem({ name: 'Solo Service' })]}
      />,
    );
    const handle = screen.getByLabelText('Drag to reorder');
    // Disabled class should be applied
    expect(handle.className).toContain('opacity-30');
  });

  it('enables drag handles when multiple line items exist', () => {
    render(
      <TestWrapper
        lineItems={[
          createLineItem({ name: 'Service A' }),
          createLineItem({ name: 'Service B' }),
        ]}
      />,
    );
    const handles = screen.getAllByLabelText('Drag to reorder');
    handles.forEach((handle) => {
      expect(handle.className).not.toContain('opacity-30');
    });
  });

  it('adds a new line item when "Add Line Item" is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper
        lineItems={[createLineItem({ name: 'Service A' })]}
      />,
    );

    const addButton = screen.getByRole('button', { name: /add line item/i });
    await user.click(addButton);

    // After adding, there should be 2 drag handles
    const handles = screen.getAllByLabelText('Drag to reorder');
    expect(handles).toHaveLength(2);
  });

  it('renders remove button for each line item', () => {
    render(
      <TestWrapper
        lineItems={[
          createLineItem({ name: 'Service A' }),
          createLineItem({ name: 'Service B' }),
        ]}
      />,
    );
    expect(screen.getByLabelText('Remove line item 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Remove line item 2')).toBeInTheDocument();
  });

  it('disables remove button when only one line item exists', () => {
    render(
      <TestWrapper
        lineItems={[createLineItem({ name: 'Solo Service' })]}
      />,
    );
    const removeButton = screen.getByLabelText('Remove line item 1');
    expect(removeButton).toBeDisabled();
  });

  it('renders column headers for service, qty, unit price, billing', () => {
    render(<TestWrapper />);
    expect(screen.getByText('Service')).toBeInTheDocument();
    expect(screen.getByText('Qty')).toBeInTheDocument();
    expect(screen.getByText('Unit Price')).toBeInTheDocument();
    expect(screen.getByText('Billing')).toBeInTheDocument();
  });

  it('renders description editor for each line item', () => {
    render(
      <TestWrapper
        lineItems={[
          createLineItem({ name: 'Service A' }),
          createLineItem({ name: 'Service B' }),
        ]}
      />,
    );
    const editors = screen.getAllByTestId('mock-description-editor');
    expect(editors).toHaveLength(2);
  });
});
