import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock environment variables
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key');

function createPortalData(overrides: Record<string, unknown> = {}) {
  return {
    proposal: {
      id: 'prop-1',
      title: 'Test Proposal',
      summary: null,
      summary_json: null,
      notes: null,
      status: 'sent',
      expires_at: null,
      accepted_at: null,
      declined_at: null,
    },
    line_items: [
      {
        id: 'li-1',
        proposal_id: 'prop-1',
        name: 'Web Design',
        description: 'Basic design services',
        description_json: null,
        quantity: 1,
        unit_price: 1000,
        billing_type: 'one_time',
        sort_order: 0,
        created_at: '2025-01-01T00:00:00Z',
      },
    ],
    addons: [],
    client: { company_name: 'Acme Corp', contact_name: 'John' },
    operator: { full_name: 'Jane Operator', business_name: 'Studio' },
    ...overrides,
  };
}

function renderPortal() {
  return render(
    <MemoryRouter initialEntries={['/portal/token123/proposals/prop-1']}>
      <Routes>
        <Route path="/portal/:token/proposals/:proposalId" element={<PortalLazy />} />
      </Routes>
    </MemoryRouter>,
  );
}

let PortalLazy: React.ComponentType;

beforeAll(async () => {
  const mod = await import('./PortalProposal');
  PortalLazy = mod.default;
});

describe('PortalProposal - descriptions', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('renders plain text line item description', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(createPortalData()),
    });

    renderPortal();

    expect(await screen.findByText('Web Design')).toBeInTheDocument();
    expect(screen.getByText('Basic design services')).toBeInTheDocument();
  });

  it('renders rich text line item description_json', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve(
          createPortalData({
            line_items: [
              {
                id: 'li-2',
                proposal_id: 'prop-1',
                name: 'SEO Package',
                description: 'Monthly SEO',
                description_json: {
                  type: 'doc',
                  content: [
                    {
                      type: 'paragraph',
                      content: [{ type: 'text', text: 'Monthly SEO optimization included' }],
                    },
                  ],
                },
                quantity: 1,
                unit_price: 500,
                billing_type: 'recurring',
                sort_order: 0,
                created_at: '2025-01-01T00:00:00Z',
              },
            ],
          }),
        ),
    });

    renderPortal();

    expect(await screen.findByText('SEO Package')).toBeInTheDocument();
    expect(screen.getByText('Monthly SEO optimization included')).toBeInTheDocument();
  });

  it('renders addon with rich text description_json', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve(
          createPortalData({
            addons: [
              {
                id: 'addon-1',
                proposal_id: 'prop-1',
                addon_template_id: null,
                name: 'Express Delivery',
                description: 'Fast turnaround',
                description_json: {
                  type: 'doc',
                  content: [
                    {
                      type: 'paragraph',
                      content: [{ type: 'text', text: 'Get your project in 48 hours' }],
                    },
                  ],
                },
                price: 300,
                billing_type: 'one_time',
                is_included: true,
                is_selected: false,
                sort_order: 0,
                created_at: '2025-01-01T00:00:00Z',
              },
            ],
          }),
        ),
    });

    renderPortal();

    expect(await screen.findByText('Express Delivery')).toBeInTheDocument();
    expect(screen.getByText('Get your project in 48 hours')).toBeInTheDocument();
  });

  it('renders addon with plain text description fallback', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve(
          createPortalData({
            addons: [
              {
                id: 'addon-2',
                proposal_id: 'prop-1',
                addon_template_id: null,
                name: 'Training Session',
                description: 'One hour of hands-on training',
                description_json: null,
                price: 150,
                billing_type: 'one_time',
                is_included: true,
                is_selected: true,
                sort_order: 0,
                created_at: '2025-01-01T00:00:00Z',
              },
            ],
          }),
        ),
    });

    renderPortal();

    expect(await screen.findByText('Training Session')).toBeInTheDocument();
    expect(screen.getByText('One hour of hands-on training')).toBeInTheDocument();
  });
});
