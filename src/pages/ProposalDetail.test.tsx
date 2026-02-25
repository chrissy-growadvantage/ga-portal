import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// We test the sub-components directly since ProposalDetail requires full hooks
// The ServiceItemsCard and AddonsCard are internal, so we test via the page

// For isolated testing, we'll extract the rendering logic test via a partial approach
// Since ServiceItemsCard and AddonsCard are not exported, let's test the full page
// with mocked hooks

vi.mock('@/hooks/useProposals', () => ({
  useProposal: vi.fn(),
  useDeleteProposal: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDuplicateProposal: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSendProposal: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@/components/content-blocks/ContentBlocksEditor', () => ({
  ContentBlocksEditor: () => null,
}));

import { useProposal } from '@/hooks/useProposals';
import type { ProposalWithDetails } from '@/types/database';

const mockedUseProposal = vi.mocked(useProposal);

function createProposal(overrides: Partial<ProposalWithDetails> = {}): ProposalWithDetails {
  return {
    id: 'prop-1',
    operator_id: 'op-1',
    client_id: 'client-1',
    title: 'Test Proposal',
    summary: null,
    summary_json: null,
    content_version: 1,
    notes: null,
    status: 'sent',
    version: 1,
    parent_proposal_id: null,
    valid_days: 30,
    expires_at: null,
    sent_at: '2025-01-15T00:00:00Z',
    viewed_at: null,
    accepted_at: null,
    declined_at: null,
    decline_reason: null,
    token_hash: null,
    token_expires_at: null,
    created_at: '2025-01-10T00:00:00Z',
    updated_at: '2025-01-15T00:00:00Z',
    line_items: [],
    addons: [],
    client: {
      id: 'client-1',
      operator_id: 'op-1',
      company_name: 'Acme Corp',
      contact_name: 'John Doe',
      contact_email: null,
      contact_phone: null,
      notes: null,
      status: 'active',
      magic_link_token_hash: null,
      magic_link_expires_at: null,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
    ...overrides,
  };
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/proposals/prop-1']}>
        <Routes>
          <Route path="/proposals/:id" element={<ProposalDetailLazy />} />
          <Route path="/proposals" element={<div>Proposals List</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// Lazy import to avoid circular issues with mocking
let ProposalDetailLazy: React.ComponentType;

beforeAll(async () => {
  const mod = await import('./ProposalDetail');
  ProposalDetailLazy = mod.default;
});

describe('ProposalDetail', () => {
  it('renders line item with plain text description', () => {
    mockedUseProposal.mockReturnValue({
      data: createProposal({
        line_items: [
          {
            id: 'li-1',
            proposal_id: 'prop-1',
            name: 'Web Design',
            description: 'Custom responsive layout',
            description_json: null,
            quantity: 1,
            unit_price: 1000,
            billing_type: 'one_time',
            sort_order: 0,
            created_at: '2025-01-10T00:00:00Z',
          },
        ],
      }),
      isLoading: false,
    } as ReturnType<typeof useProposal>);

    renderPage();

    expect(screen.getByText('Web Design')).toBeInTheDocument();
    expect(screen.getByText('Custom responsive layout')).toBeInTheDocument();
  });

  it('renders line item with rich text description_json', () => {
    mockedUseProposal.mockReturnValue({
      data: createProposal({
        line_items: [
          {
            id: 'li-2',
            proposal_id: 'prop-1',
            name: 'SEO Package',
            description: 'Monthly SEO optimization',
            description_json: {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Monthly SEO optimization with reports' }],
                },
              ],
            },
            quantity: 1,
            unit_price: 500,
            billing_type: 'recurring',
            sort_order: 0,
            created_at: '2025-01-10T00:00:00Z',
          },
        ],
      }),
      isLoading: false,
    } as ReturnType<typeof useProposal>);

    renderPage();

    expect(screen.getByText('SEO Package')).toBeInTheDocument();
    expect(screen.getByText('Monthly SEO optimization with reports')).toBeInTheDocument();
  });

  it('renders addon with rich text description_json', () => {
    mockedUseProposal.mockReturnValue({
      data: createProposal({
        addons: [
          {
            id: 'addon-1',
            proposal_id: 'prop-1',
            addon_template_id: null,
            name: 'Priority Support',
            description: 'Dedicated support line',
            description_json: {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Dedicated 24/7 support with SLA guarantee' }],
                },
              ],
            },
            price: 200,
            billing_type: 'recurring',
            is_included: true,
            is_selected: true,
            sort_order: 0,
            created_at: '2025-01-10T00:00:00Z',
          },
        ],
      }),
      isLoading: false,
    } as ReturnType<typeof useProposal>);

    renderPage();

    expect(screen.getByText('Priority Support')).toBeInTheDocument();
    expect(screen.getByText('Dedicated 24/7 support with SLA guarantee')).toBeInTheDocument();
  });

  it('renders addon with plain text description when no description_json', () => {
    mockedUseProposal.mockReturnValue({
      data: createProposal({
        addons: [
          {
            id: 'addon-2',
            proposal_id: 'prop-1',
            addon_template_id: null,
            name: 'Rush Delivery',
            description: 'Get your project done in half the time',
            description_json: null,
            price: 500,
            billing_type: 'one_time',
            is_included: true,
            is_selected: false,
            sort_order: 0,
            created_at: '2025-01-10T00:00:00Z',
          },
        ],
      }),
      isLoading: false,
    } as ReturnType<typeof useProposal>);

    renderPage();

    expect(screen.getByText('Rush Delivery')).toBeInTheDocument();
    expect(screen.getByText('Get your project done in half the time')).toBeInTheDocument();
  });
});
