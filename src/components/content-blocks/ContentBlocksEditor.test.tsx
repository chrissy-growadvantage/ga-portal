import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ContentBlocksEditor } from './ContentBlocksEditor';
import type { ProposalContentBlock } from '@/types/database';

// Mock hooks
const mockBlocks: ProposalContentBlock[] = [];
const mockCreateBlock = vi.fn();
const mockUpdateBlock = vi.fn();
const mockDeleteBlock = vi.fn();

vi.mock('@/hooks/useContentBlocks', () => ({
  useContentBlocks: () => ({ data: mockBlocks, isLoading: false }),
  useCreateContentBlock: () => ({ mutate: mockCreateBlock, isPending: false }),
  useUpdateContentBlock: () => ({ mutate: mockUpdateBlock, isPending: false }),
  useDeleteContentBlock: () => ({ mutate: mockDeleteBlock, isPending: false }),
}));

// Mock TiptapEditor
vi.mock('@/components/editor/TiptapEditor', () => ({
  TiptapEditor: ({ placeholder }: { placeholder?: string }) => (
    <div data-testid="tiptap-editor" data-placeholder={placeholder}>
      <textarea data-testid="tiptap-textarea" />
    </div>
  ),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('ContentBlocksEditor', () => {
  it('renders add section button', () => {
    render(
      <ContentBlocksEditor proposalId="proposal-1" />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('Add Section')).toBeInTheDocument();
  });

  it('shows block type dropdown when add section is clicked', async () => {
    const user = userEvent.setup();

    render(
      <ContentBlocksEditor proposalId="proposal-1" />,
      { wrapper: createWrapper() },
    );

    await user.click(screen.getByText('Add Section'));

    expect(screen.getByText('Rich Text')).toBeInTheDocument();
    expect(screen.getByText('Image Gallery')).toBeInTheDocument();
    expect(screen.getByText('Video Embed')).toBeInTheDocument();
  });

  it('calls createBlock when a block type is selected', async () => {
    const user = userEvent.setup();

    render(
      <ContentBlocksEditor proposalId="proposal-1" />,
      { wrapper: createWrapper() },
    );

    await user.click(screen.getByText('Add Section'));
    await user.click(screen.getByText('Rich Text'));

    expect(mockCreateBlock).toHaveBeenCalledWith(
      expect.objectContaining({
        proposal_id: 'proposal-1',
        type: 'rich_text',
      }),
    );
  });

  it('renders nothing when no blocks exist and not editing', () => {
    render(
      <ContentBlocksEditor proposalId="proposal-1" readOnly />,
      { wrapper: createWrapper() },
    );

    expect(screen.queryByText('Add Section')).not.toBeInTheDocument();
  });
});
