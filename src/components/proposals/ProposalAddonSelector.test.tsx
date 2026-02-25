import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProposalSchema, type CreateProposalInput } from '@/lib/proposal-schemas';
import { ProposalAddonSelector } from './ProposalAddonSelector';

function Wrapper({ children }: { children: (form: ReturnType<typeof useForm<CreateProposalInput>>) => React.ReactNode }) {
  const form = useForm<CreateProposalInput>({
    resolver: zodResolver(createProposalSchema),
    defaultValues: {
      client_id: '00000000-0000-0000-0000-000000000001',
      title: 'Test',
      summary: '',
      summary_json: null,
      notes: '',
      valid_days: 30,
      line_items: [{ name: 'Service', quantity: 1, unit_price: 100, billing_type: 'one_time', sort_order: 0, description: '', description_json: null }],
      addons: [],
    },
  });
  return <FormProvider {...form}>{children(form)}</FormProvider>;
}

function renderAddonSelector() {
  let formRef: ReturnType<typeof useForm<CreateProposalInput>>;
  render(
    <Wrapper>
      {(form) => {
        formRef = form;
        return <ProposalAddonSelector form={form} />;
      }}
    </Wrapper>,
  );
  return { getForm: () => formRef! };
}

describe('ProposalAddonSelector', () => {
  it('renders "Custom Addon" button', () => {
    renderAddonSelector();
    expect(screen.getByText('Custom Addon')).toBeInTheDocument();
  });

  it('adds a custom addon with description field', async () => {
    const user = userEvent.setup();
    renderAddonSelector();

    await user.click(screen.getByText('Custom Addon'));

    // Should show addon name input
    expect(screen.getByPlaceholderText('Addon name')).toBeInTheDocument();
    // Should show "Add description" button for inline description editor
    expect(screen.getByText('Add description')).toBeInTheDocument();
  });

  it('expands inline description editor when clicked', async () => {
    const user = userEvent.setup();
    renderAddonSelector();

    await user.click(screen.getByText('Custom Addon'));
    await user.click(screen.getByText('Add description'));

    // Should show the rich text editor
    expect(screen.getByRole('textbox', { name: 'Description' })).toBeInTheDocument();
  });

  it('includes description_json in form state when adding addon', async () => {
    const user = userEvent.setup();
    const { getForm } = renderAddonSelector();

    await user.click(screen.getByText('Custom Addon'));

    const form = getForm();
    const addons = form.getValues('addons');
    expect(addons).toHaveLength(1);
    expect(addons[0]).toHaveProperty('description_json', null);
  });
});
