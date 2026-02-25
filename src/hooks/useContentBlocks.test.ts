import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import type { ProposalContentBlock } from '@/types/database';

// Mock supabase
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockSingle = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => {
      mockFrom(...args);
      return {
        select: (...sArgs: unknown[]) => {
          mockSelect(...sArgs);
          return {
            eq: (...eArgs: unknown[]) => {
              mockEq(...eArgs);
              return {
                order: (...oArgs: unknown[]) => {
                  mockOrder(...oArgs);
                  return Promise.resolve({ data: [], error: null });
                },
              };
            },
          };
        },
        insert: (...iArgs: unknown[]) => {
          mockInsert(...iArgs);
          return {
            select: (...sArgs: unknown[]) => {
              mockSelect(...sArgs);
              return {
                single: () => {
                  mockSingle();
                  return Promise.resolve({ data: { id: 'block-1' }, error: null });
                },
              };
            },
          };
        },
        update: (...uArgs: unknown[]) => {
          mockUpdate(...uArgs);
          return {
            eq: (...eArgs: unknown[]) => {
              mockEq(...eArgs);
              return {
                select: (...sArgs: unknown[]) => {
                  mockSelect(...sArgs);
                  return {
                    single: () => {
                      mockSingle();
                      return Promise.resolve({ data: { id: 'block-1' }, error: null });
                    },
                  };
                },
              };
            },
          };
        },
        delete: () => {
          mockDelete();
          return {
            eq: (...eArgs: unknown[]) => {
              mockEq(...eArgs);
              return Promise.resolve({ error: null });
            },
          };
        },
      };
    },
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useContentBlocks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports hook functions', async () => {
    const mod = await import('./useContentBlocks');
    expect(mod.useContentBlocks).toBeDefined();
    expect(mod.useCreateContentBlock).toBeDefined();
    expect(mod.useUpdateContentBlock).toBeDefined();
    expect(mod.useDeleteContentBlock).toBeDefined();
  });

  it('useContentBlocks fetches blocks for a proposal', async () => {
    const { useContentBlocks } = await import('./useContentBlocks');
    const { result } = renderHook(() => useContentBlocks('proposal-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalledWith('proposal_content_blocks');
  });

  it('useCreateContentBlock calls insert on supabase', async () => {
    const { useCreateContentBlock } = await import('./useContentBlocks');
    const { result } = renderHook(() => useCreateContentBlock(), {
      wrapper: createWrapper(),
    });

    const blockInput = {
      proposal_id: 'proposal-1',
      type: 'rich_text' as const,
      position: 0,
      content_json: { doc: { type: 'doc', content: [] } },
    };

    result.current.mutate(blockInput);

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled();
    });
  });

  it('useUpdateContentBlock calls update on supabase', async () => {
    const { useUpdateContentBlock } = await import('./useContentBlocks');
    const { result } = renderHook(() => useUpdateContentBlock(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: 'block-1',
      proposal_id: 'proposal-1',
      content_json: { doc: { type: 'doc', content: [] } },
    });

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  it('useDeleteContentBlock calls delete on supabase', async () => {
    const { useDeleteContentBlock } = await import('./useContentBlocks');
    const { result } = renderHook(() => useDeleteContentBlock(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: 'block-1', proposalId: 'proposal-1' });

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalled();
    });
  });
});
