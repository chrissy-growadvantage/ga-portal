import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import type { ProposalTemplate } from '@/types/database';

// Mock supabase
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockFrom = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockSingle = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'operator-1' } }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

function createTemplate(overrides: Partial<ProposalTemplate> = {}): ProposalTemplate {
  return {
    id: 'tpl-1',
    operator_id: 'operator-1',
    name: 'Test Template',
    description: 'A test template',
    content_json: { type: 'doc', content: [{ type: 'paragraph' }] },
    category: 'intro',
    is_system: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

const systemTemplate = createTemplate({
  id: 'sys-1',
  operator_id: null,
  name: 'System Template',
  is_system: true,
  category: 'terms',
});

const userTemplate = createTemplate({
  id: 'user-1',
  name: 'My Template',
  is_system: false,
  category: 'intro',
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useTemplates', () => {
  it('fetches templates from supabase', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [systemTemplate, userTemplate],
          error: null,
        }),
      }),
    });

    const { useTemplates } = await import('./useTemplates');
    const { result } = renderHook(() => useTemplates(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(mockFrom).toHaveBeenCalledWith('proposal_templates');
  });

  it('returns error on supabase failure', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'DB error' },
        }),
      }),
    });

    const { useTemplates } = await import('./useTemplates');
    const { result } = renderHook(() => useTemplates(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCreateTemplate', () => {
  it('inserts a template with operator_id', async () => {
    const newTemplate = createTemplate({ id: 'new-1' });
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: newTemplate,
            error: null,
          }),
        }),
      }),
    });

    const { useCreateTemplate } = await import('./useTemplates');
    const { result } = renderHook(() => useCreateTemplate(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      name: 'New Template',
      content_json: { type: 'doc', content: [] },
    });

    expect(mockFrom).toHaveBeenCalledWith('proposal_templates');
  });
});

describe('useUpdateTemplate', () => {
  it('updates a template by id', async () => {
    const updated = createTemplate({ id: 'tpl-1', name: 'Updated' });
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: updated,
              error: null,
            }),
          }),
        }),
      }),
    });

    const { useUpdateTemplate } = await import('./useTemplates');
    const { result } = renderHook(() => useUpdateTemplate(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      id: 'tpl-1',
      name: 'Updated',
    });

    expect(mockFrom).toHaveBeenCalledWith('proposal_templates');
  });
});

describe('useDeleteTemplate', () => {
  it('deletes a template by id', async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      }),
    });

    const { useDeleteTemplate } = await import('./useTemplates');
    const { result } = renderHook(() => useDeleteTemplate(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync('tpl-1');

    expect(mockFrom).toHaveBeenCalledWith('proposal_templates');
  });
});
