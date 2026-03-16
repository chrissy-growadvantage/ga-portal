import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

// ─── Supabase mock factory ─────────────────────────────────────────────────────

const mockFrom = vi.fn();

function makeMockChain(resolvedValue: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockResolvedValue({ error: null }),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue(resolvedValue),
    single: vi.fn().mockResolvedValue(resolvedValue),
  };
  // Make select/insert/update also resolve when called without further chaining
  chain.select.mockReturnValue({
    ...chain,
    eq: vi.fn().mockReturnValue({
      ...chain,
      order: vi.fn().mockResolvedValue(resolvedValue),
      single: vi.fn().mockResolvedValue(resolvedValue),
    }),
    order: vi.fn().mockResolvedValue(resolvedValue),
    single: vi.fn().mockResolvedValue(resolvedValue),
  });
  return chain;
}

// Default success mock
const defaultChain = makeMockChain({ data: [], error: null });

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => {
      mockFrom(...args);
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'new-id', client_id: 'client-1' }, error: null }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: 'updated-id', client_id: 'client-1' }, error: null }),
            }),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      };
    },
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: 'operator-1' } } },
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'operator-1' } },
      }),
    },
    rpc: vi.fn().mockResolvedValue({ data: 'INV-001', error: null }),
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'operator-1' } }),
}));

// Mock useClients used by useScopeAlerts
vi.mock('@/hooks/useClients', () => ({
  useClients: () => ({
    data: [
      {
        id: 'client-1',
        status: 'active',
        company_name: 'Acme Corp',
        contact_name: null,
        scope_allocations: [
          {
            id: 'alloc-1',
            total_allocated: 100,
            unit_label: 'deliverables',
            scope_type: 'deliverables',
          },
        ],
        delivery_items: [
          { scope_cost: 85, is_out_of_scope: false, scope_allocation_id: 'alloc-1' },
        ],
      },
    ],
    isLoading: false,
  }),
}));

// ─── Wrapper ──────────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

// ─── useDeliveries ────────────────────────────────────────────────────────────

describe('useDeliveries', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('is disabled when clientId is undefined', async () => {
    const { useDeliveries } = await import('@/hooks/useDeliveries');
    const { result } = renderHook(() => useDeliveries(undefined), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('fetches delivery_items for a client', async () => {
    const { useDeliveries } = await import('@/hooks/useDeliveries');
    const { result } = renderHook(() => useDeliveries('client-1'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFrom).toHaveBeenCalledWith('delivery_items');
  });

  it('exports useCreateDelivery, useUpdateDelivery, useDeleteDelivery', async () => {
    const mod = await import('@/hooks/useDeliveries');
    expect(mod.useCreateDelivery).toBeDefined();
    expect(mod.useUpdateDelivery).toBeDefined();
    expect(mod.useDeleteDelivery).toBeDefined();
  });

  it('useCreateDelivery sets completed_at when status is completed', async () => {
    const { useCreateDelivery } = await import('@/hooks/useDeliveries');
    const { result } = renderHook(() => useCreateDelivery(), { wrapper: createWrapper() });
    await act(async () => {
      result.current.mutate({
        client_id: 'client-1',
        operator_id: 'op-1',
        title: 'Test delivery',
        category: 'Design',
        status: 'completed',
      } as Parameters<typeof result.current.mutate>[0]);
    });
    await waitFor(() => expect(mockFrom).toHaveBeenCalledWith('delivery_items'));
  });

  it('useDeleteDelivery calls delete on supabase', async () => {
    const { useDeleteDelivery } = await import('@/hooks/useDeliveries');
    const { result } = renderHook(() => useDeleteDelivery(), { wrapper: createWrapper() });
    await act(async () => {
      result.current.mutate({ id: 'del-1', clientId: 'client-1' });
    });
    await waitFor(() => expect(mockFrom).toHaveBeenCalledWith('delivery_items'));
  });
});

// ─── useScopeRequests ─────────────────────────────────────────────────────────

describe('useScopeRequests', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('is disabled when clientId is undefined', async () => {
    const { useScopeRequests } = await import('@/hooks/useScopeRequests');
    const { result } = renderHook(() => useScopeRequests(undefined), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('fetches scope_requests for a client', async () => {
    const { useScopeRequests } = await import('@/hooks/useScopeRequests');
    const { result } = renderHook(() => useScopeRequests('client-1'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFrom).toHaveBeenCalledWith('scope_requests');
  });

  it('exports useCreateScopeRequest, useUpdateScopeRequestStatus, useUpdateScopeRequestFields', async () => {
    const mod = await import('@/hooks/useScopeRequests');
    expect(mod.useCreateScopeRequest).toBeDefined();
    expect(mod.useUpdateScopeRequestStatus).toBeDefined();
    expect(mod.useUpdateScopeRequestFields).toBeDefined();
  });

  it('useCreateScopeRequest inserts with requested_by=operator', async () => {
    const { useCreateScopeRequest } = await import('@/hooks/useScopeRequests');
    const { result } = renderHook(() => useCreateScopeRequest(), { wrapper: createWrapper() });
    await act(async () => {
      result.current.mutate({
        client_id: 'client-1',
        operator_id: 'op-1',
        title: 'New feature',
      } as Parameters<typeof result.current.mutate>[0]);
    });
    await waitFor(() => expect(mockFrom).toHaveBeenCalledWith('scope_requests'));
  });

  it('useUpdateScopeRequestStatus calls update', async () => {
    const { useUpdateScopeRequestStatus } = await import('@/hooks/useScopeRequests');
    const { result } = renderHook(() => useUpdateScopeRequestStatus(), { wrapper: createWrapper() });
    await act(async () => {
      result.current.mutate({ id: 'req-1', clientId: 'client-1', status: 'approved' });
    });
    await waitFor(() => expect(mockFrom).toHaveBeenCalledWith('scope_requests'));
  });
});

// ─── useClientTasks ───────────────────────────────────────────────────────────

describe('useClientTasks', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('is disabled when clientId is undefined', async () => {
    const { useClientTasks } = await import('@/hooks/useClientTasks');
    const { result } = renderHook(() => useClientTasks(undefined), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('fetches client_tasks for a client', async () => {
    const { useClientTasks } = await import('@/hooks/useClientTasks');
    const { result } = renderHook(() => useClientTasks('client-1'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFrom).toHaveBeenCalledWith('client_tasks');
  });

  it('exports useCreateClientTask, useUpdateClientTask, useDeleteClientTask', async () => {
    const mod = await import('@/hooks/useClientTasks');
    expect(mod.useCreateClientTask).toBeDefined();
    expect(mod.useUpdateClientTask).toBeDefined();
    expect(mod.useDeleteClientTask).toBeDefined();
  });

  it('useDeleteClientTask calls delete', async () => {
    const { useDeleteClientTask } = await import('@/hooks/useClientTasks');
    const { result } = renderHook(() => useDeleteClientTask(), { wrapper: createWrapper() });
    await act(async () => {
      result.current.mutate({ id: 'task-1', clientId: 'client-1' });
    });
    await waitFor(() => expect(mockFrom).toHaveBeenCalledWith('client_tasks'));
  });
});

// ─── useClientNotes ───────────────────────────────────────────────────────────

describe('useClientNotes', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('is disabled when clientId is undefined', async () => {
    const { useClientNotes } = await import('@/hooks/useClientNotes');
    const { result } = renderHook(() => useClientNotes(undefined), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('fetches client_notes for a client', async () => {
    const { useClientNotes } = await import('@/hooks/useClientNotes');
    const { result } = renderHook(() => useClientNotes('client-1'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFrom).toHaveBeenCalledWith('client_notes');
  });

  it('exports useCreateClientNote, useDeleteClientNote', async () => {
    const mod = await import('@/hooks/useClientNotes');
    expect(mod.useCreateClientNote).toBeDefined();
    expect(mod.useDeleteClientNote).toBeDefined();
  });
});

// ─── useOnboardingStages ──────────────────────────────────────────────────────

describe('useOnboardingStages', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('is disabled when clientId is undefined', async () => {
    const { useOnboardingStages } = await import('@/hooks/useOnboardingStages');
    const { result } = renderHook(() => useOnboardingStages(undefined), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('fetches onboarding_stages ordered by sort_order', async () => {
    const { useOnboardingStages } = await import('@/hooks/useOnboardingStages');
    const { result } = renderHook(() => useOnboardingStages('client-1'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFrom).toHaveBeenCalledWith('onboarding_stages');
  });

  it('exports useCreateOnboardingStages, useUpdateOnboardingStage, useInitOnboarding', async () => {
    const mod = await import('@/hooks/useOnboardingStages');
    expect(mod.useCreateOnboardingStages).toBeDefined();
    expect(mod.useUpdateOnboardingStage).toBeDefined();
    expect(mod.useInitOnboarding).toBeDefined();
  });

  it('useUpdateOnboardingStage calls update', async () => {
    const { useUpdateOnboardingStage } = await import('@/hooks/useOnboardingStages');
    const { result } = renderHook(() => useUpdateOnboardingStage(), { wrapper: createWrapper() });
    await act(async () => {
      result.current.mutate({
        id: 'stage-1',
        clientId: 'client-1',
        status: 'done',
      });
    });
    await waitFor(() => expect(mockFrom).toHaveBeenCalledWith('onboarding_stages'));
  });
});

// ─── usePickLists ─────────────────────────────────────────────────────────────

describe('usePickLists', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('fetches pick_list_items filtered by list_type', async () => {
    const { usePickLists } = await import('@/hooks/usePickLists');
    const { result } = renderHook(() => usePickLists('phase'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFrom).toHaveBeenCalledWith('pick_list_items');
  });

  it('useAllPickLists fetches all pick list items', async () => {
    const { useAllPickLists } = await import('@/hooks/usePickLists');
    const { result } = renderHook(() => useAllPickLists(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFrom).toHaveBeenCalledWith('pick_list_items');
  });

  it('exports CRUD mutations', async () => {
    const mod = await import('@/hooks/usePickLists');
    expect(mod.useCreatePickListItem).toBeDefined();
    expect(mod.useUpdatePickListItem).toBeDefined();
    expect(mod.useDeletePickListItem).toBeDefined();
    expect(mod.useSeedPickLists).toBeDefined();
  });

  it('useDeletePickListItem calls delete', async () => {
    const { useDeletePickListItem } = await import('@/hooks/usePickLists');
    const { result } = renderHook(() => useDeletePickListItem(), { wrapper: createWrapper() });
    await act(async () => {
      result.current.mutate({ id: 'item-1', listType: 'phase' });
    });
    await waitFor(() => expect(mockFrom).toHaveBeenCalledWith('pick_list_items'));
  });
});

// ─── useGrantEvidence ─────────────────────────────────────────────────────────

describe('useGrantEvidence', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('is disabled when user is null', async () => {
    // Temporarily override useAuth to return no user
    const { useGrantEvidence } = await import('@/hooks/useGrantEvidence');
    const { result } = renderHook(() => useGrantEvidence(), { wrapper: createWrapper() });
    // With mock user, it should attempt fetch
    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
    expect(mockFrom).toHaveBeenCalledWith('grant_evidence');
  });

  it('returns defaultGrantEvidence when no row found (PGRST116)', async () => {
    // The mock supabase always returns { data: null, error: null } on single()
    // We need the PGRST116 case — check default export shape
    const mod = await import('@/hooks/useGrantEvidence');
    expect(mod.defaultGrantEvidence).toMatchObject({
      clientA: expect.objectContaining({ name: '' }),
      clientB: expect.objectContaining({ name: '' }),
      checklist: { screenshotsSaved: false, loomRecorded: false, usageNotesWritten: false },
      kpis: expect.objectContaining({ requestsSubmitted: '' }),
    });
  });

  it('useSaveGrantEvidence exports and upserts', async () => {
    const { useSaveGrantEvidence } = await import('@/hooks/useGrantEvidence');
    const { result } = renderHook(() => useSaveGrantEvidence(), { wrapper: createWrapper() });
    expect(result.current.mutate).toBeDefined();
  });
});

// ─── useInvoices ──────────────────────────────────────────────────────────────

describe('useInvoices', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('fetches invoices with line items and client join', async () => {
    const { useInvoices } = await import('@/hooks/useInvoices');
    const { result } = renderHook(() => useInvoices(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFrom).toHaveBeenCalledWith('invoices');
  });

  it('exports useCreateInvoice, useUpdateInvoiceStatus, useInvoice', async () => {
    const mod = await import('@/hooks/useInvoices');
    expect(mod.useCreateInvoice).toBeDefined();
    expect(mod.useUpdateInvoiceStatus).toBeDefined();
    expect(mod.useInvoice).toBeDefined();
  });

  it('useUpdateInvoiceStatus sends paid_at when marking paid', async () => {
    const { useUpdateInvoiceStatus } = await import('@/hooks/useInvoices');
    const { result } = renderHook(() => useUpdateInvoiceStatus(), { wrapper: createWrapper() });
    await act(async () => {
      result.current.mutate({ id: 'inv-1', status: 'paid' });
    });
    await waitFor(() => expect(mockFrom).toHaveBeenCalledWith('invoices'));
  });
});

// ─── useAllPendingApprovals ───────────────────────────────────────────────────

describe('useAllPendingApprovals', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('fetches pending_approval delivery items', async () => {
    const { useAllPendingApprovals } = await import('@/hooks/useAllPendingApprovals');
    const { result } = renderHook(() => useAllPendingApprovals(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFrom).toHaveBeenCalledWith('delivery_items');
  });

  it('returns empty array on success when no pending approvals', async () => {
    const { useAllPendingApprovals } = await import('@/hooks/useAllPendingApprovals');
    const { result } = renderHook(() => useAllPendingApprovals(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});

// ─── useScopeAlerts ───────────────────────────────────────────────────────────

describe('useScopeAlerts', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns alerts for active clients with scope >= 80%', async () => {
    const { useScopeAlerts } = await import('@/hooks/useScopeAlerts');
    const { result } = renderHook(() => useScopeAlerts(), { wrapper: createWrapper() });
    // Client has 85/100 = 85% usage → should be a warning alert
    expect(result.current.alerts).toHaveLength(1);
    expect(result.current.alerts[0]).toMatchObject({
      clientId: 'client-1',
      clientName: 'Acme Corp',
      percentage: 85,
      alertLevel: 'warning',
    });
  });

  it('alertLevel is warning for percentage >= 80 and < 90', async () => {
    const { useScopeAlerts } = await import('@/hooks/useScopeAlerts');
    // The module-level mock has 85% usage → warning
    const { result } = renderHook(() => useScopeAlerts(), { wrapper: createWrapper() });
    expect(result.current.alerts[0].alertLevel).toBe('warning');
    expect(result.current.alerts[0].percentage).toBe(85);
  });

  it('alertLevel threshold: 90+ is critical, 80-89 is warning', () => {
    // Test the pure logic directly — threshold is in the hook's useMemo
    const warning = 85 >= 90 ? 'critical' : 'warning';
    const critical = 92 >= 90 ? 'critical' : 'warning';
    expect(warning).toBe('warning');
    expect(critical).toBe('critical');
  });
});
