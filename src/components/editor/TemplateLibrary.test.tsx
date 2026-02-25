import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TemplateLibrary } from './TemplateLibrary';
import type { ProposalTemplate } from '@/types/database';

function createTemplate(overrides: Partial<ProposalTemplate> = {}): ProposalTemplate {
  return {
    id: 'tpl-1',
    operator_id: 'operator-1',
    name: 'Test Template',
    description: 'A test template description',
    content_json: {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello world content here' }] }],
    },
    category: 'intro',
    is_system: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

const systemTemplates: ProposalTemplate[] = [
  createTemplate({
    id: 'sys-1',
    operator_id: null,
    name: 'Project Introduction',
    description: 'Standard project intro template',
    category: 'intro',
    is_system: true,
  }),
  createTemplate({
    id: 'sys-2',
    operator_id: null,
    name: 'Scope of Work',
    description: 'Standard scope template',
    category: 'deliverables',
    is_system: true,
  }),
  createTemplate({
    id: 'sys-3',
    operator_id: null,
    name: 'Terms & Conditions',
    description: 'Standard T&C template',
    category: 'terms',
    is_system: true,
  }),
];

const userTemplates: ProposalTemplate[] = [
  createTemplate({
    id: 'user-1',
    name: 'My Custom Intro',
    description: 'My personal intro',
    category: 'intro',
    is_system: false,
  }),
];

const allTemplates = [...systemTemplates, ...userTemplates];

describe('TemplateLibrary', () => {
  const onSelect = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dialog with template list when open', () => {
    render(
      <TemplateLibrary
        open={true}
        onClose={onClose}
        onSelect={onSelect}
        templates={allTemplates}
        isLoading={false}
      />,
    );

    expect(screen.getByText('Template Library')).toBeInTheDocument();
    expect(screen.getByText('Project Introduction')).toBeInTheDocument();
    expect(screen.getByText('Scope of Work')).toBeInTheDocument();
    expect(screen.getByText('Terms & Conditions')).toBeInTheDocument();
    expect(screen.getByText('My Custom Intro')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <TemplateLibrary
        open={false}
        onClose={onClose}
        onSelect={onSelect}
        templates={allTemplates}
        isLoading={false}
      />,
    );

    expect(screen.queryByText('Template Library')).not.toBeInTheDocument();
  });

  it('calls onSelect with content_json when template is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TemplateLibrary
        open={true}
        onClose={onClose}
        onSelect={onSelect}
        templates={allTemplates}
        isLoading={false}
      />,
    );

    await user.click(screen.getByText('Project Introduction'));
    expect(onSelect).toHaveBeenCalledWith(systemTemplates[0].content_json);
  });

  it('filters templates by search query', async () => {
    const user = userEvent.setup();
    render(
      <TemplateLibrary
        open={true}
        onClose={onClose}
        onSelect={onSelect}
        templates={allTemplates}
        isLoading={false}
      />,
    );

    const searchInput = screen.getByPlaceholderText('Search templates...');
    await user.type(searchInput, 'Scope');

    expect(screen.getByText('Scope of Work')).toBeInTheDocument();
    expect(screen.queryByText('Project Introduction')).not.toBeInTheDocument();
    expect(screen.queryByText('Terms & Conditions')).not.toBeInTheDocument();
  });

  it('filters templates by category tab', async () => {
    const user = userEvent.setup();
    render(
      <TemplateLibrary
        open={true}
        onClose={onClose}
        onSelect={onSelect}
        templates={allTemplates}
        isLoading={false}
      />,
    );

    await user.click(screen.getByRole('tab', { name: /terms/i }));

    expect(screen.getByText('Terms & Conditions')).toBeInTheDocument();
    expect(screen.queryByText('Project Introduction')).not.toBeInTheDocument();
    expect(screen.queryByText('Scope of Work')).not.toBeInTheDocument();
  });

  it('shows "My Templates" tab with user templates only', async () => {
    const user = userEvent.setup();
    render(
      <TemplateLibrary
        open={true}
        onClose={onClose}
        onSelect={onSelect}
        templates={allTemplates}
        isLoading={false}
      />,
    );

    await user.click(screen.getByRole('tab', { name: /my templates/i }));

    expect(screen.getByText('My Custom Intro')).toBeInTheDocument();
    expect(screen.queryByText('Project Introduction')).not.toBeInTheDocument();
  });

  it('shows template description', () => {
    render(
      <TemplateLibrary
        open={true}
        onClose={onClose}
        onSelect={onSelect}
        templates={allTemplates}
        isLoading={false}
      />,
    );

    expect(screen.getByText('Standard project intro template')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <TemplateLibrary
        open={true}
        onClose={onClose}
        onSelect={onSelect}
        templates={[]}
        isLoading={true}
      />,
    );

    expect(screen.getByText('Loading templates...')).toBeInTheDocument();
  });

  it('shows empty state when no templates match', async () => {
    const user = userEvent.setup();
    render(
      <TemplateLibrary
        open={true}
        onClose={onClose}
        onSelect={onSelect}
        templates={allTemplates}
        isLoading={false}
      />,
    );

    const searchInput = screen.getByPlaceholderText('Search templates...');
    await user.type(searchInput, 'nonexistent template xyz');

    expect(screen.getByText('No templates found')).toBeInTheDocument();
  });

  it('shows system badge on system templates', () => {
    render(
      <TemplateLibrary
        open={true}
        onClose={onClose}
        onSelect={onSelect}
        templates={[systemTemplates[0]]}
        isLoading={false}
      />,
    );

    expect(screen.getByText('System')).toBeInTheDocument();
  });
});
