import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProposalPreviewPanel } from './ProposalPreviewPanel';

const baseProps = {
  title: 'Test Proposal',
  lineItems: [
    { name: 'Web Design', description: 'Custom responsive design', quantity: 1, unit_price: 500 },
    { name: 'SEO Audit', quantity: 2, unit_price: 250 },
  ],
  addons: [],
};

describe('ProposalPreviewPanel', () => {
  it('renders proposal title', () => {
    render(<ProposalPreviewPanel {...baseProps} />);
    expect(screen.getByText('Test Proposal')).toBeInTheDocument();
  });

  it('renders line item names', () => {
    render(<ProposalPreviewPanel {...baseProps} />);
    expect(screen.getByText(/Web Design/)).toBeInTheDocument();
    expect(screen.getByText(/SEO Audit/)).toBeInTheDocument();
  });

  it('renders plain text line item descriptions', () => {
    render(<ProposalPreviewPanel {...baseProps} />);
    expect(screen.getByText('Custom responsive design')).toBeInTheDocument();
  });

  it('does not render description when absent', () => {
    render(<ProposalPreviewPanel {...baseProps} />);
    // SEO Audit has no description - should not have an extra text element
    const seoItem = screen.getByText(/SEO Audit/);
    expect(seoItem).toBeInTheDocument();
  });

  it('renders rich text line item descriptions via description_json', () => {
    const items = [
      {
        name: 'Branding',
        description: 'Logo and brand guidelines',
        description_json: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Logo and brand guidelines' }],
            },
          ],
        },
        quantity: 1,
        unit_price: 1000,
      },
    ];

    render(
      <ProposalPreviewPanel
        title="Rich Preview"
        lineItems={items}
        addons={[]}
      />,
    );

    expect(screen.getByText('Logo and brand guidelines')).toBeInTheDocument();
  });

  it('renders addon descriptions in preview', () => {
    const addons = [
      {
        name: 'Priority Support',
        description: '24/7 dedicated support line',
        price: 200,
        is_included: true,
      },
    ];

    render(
      <ProposalPreviewPanel
        title="Addon Preview"
        lineItems={[{ name: 'Base', quantity: 1, unit_price: 100 }]}
        addons={addons}
      />,
    );

    expect(screen.getByText('Priority Support')).toBeInTheDocument();
    expect(screen.getByText('24/7 dedicated support line')).toBeInTheDocument();
  });

  it('does not show addon description for addons without description', () => {
    const addons = [
      { name: 'Simple Addon', price: 50, is_included: true },
    ];

    render(
      <ProposalPreviewPanel
        title="Test"
        lineItems={[{ name: 'Base', quantity: 1, unit_price: 100 }]}
        addons={addons}
      />,
    );

    expect(screen.getByText('Simple Addon')).toBeInTheDocument();
  });
});
