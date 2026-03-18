import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { DeliveryItem } from '@/types/database';
import type { PortalScopeRequest, PortalClientTask, PortalOnboardingStage } from '@/types/portal';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock supabase storage for PortalRequestForm
vi.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/file.pdf' } }),
      }),
    },
  },
}));

// ─── Factories ────────────────────────────────────────────────────────────────

function makeDeliveryItem(overrides: Partial<DeliveryItem> = {}): DeliveryItem {
  return {
    id: 'del-1',
    client_id: 'client-1',
    operator_id: 'op-1',
    title: 'Website redesign',
    description: 'Full redesign of homepage',
    category: 'Design',
    phase: null,
    uplift: null,
    status: 'pending_approval',
    scope_cost: 1,
    is_out_of_scope: false,
    scope_allocation_id: null,
    completed_at: '2024-01-15T00:00:00Z',
    attachment_url: null,
    work_status: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeScopeRequest(overrides: Partial<PortalScopeRequest> = {}): PortalScopeRequest {
  return {
    id: 'req-1',
    title: 'Add landing page',
    description: null,
    requested_by: 'client',
    status: 'approved',
    scope_cost: null,
    category: 'Design',
    admin_note: null,
    attachment_url: null,
    ga_status: null,
    created_at: '2024-01-10T00:00:00Z',
    ...overrides,
  };
}

function makeClientTask(overrides: Partial<PortalClientTask> = {}): PortalClientTask {
  return {
    id: 'task-1',
    title: 'Fill out intake form',
    due_date: null,
    link_url: null,
    completed_at: null,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeOnboardingStage(overrides: Partial<PortalOnboardingStage> = {}): PortalOnboardingStage {
  return {
    id: 'stage-1',
    stage_key: 'contract',
    stage_label: 'Sign Contract',
    sort_order: 0,
    status: 'not_started',
    owner_label: 'client',
    due_date: null,
    notes: null,
    action_url: null,
    completed_at: null,
    ...overrides,
  };
}

// ─── PortalNeedsAttention ─────────────────────────────────────────────────────

describe('PortalNeedsAttention', () => {
  const noop = vi.fn();

  it('renders nothing when all lists are empty', async () => {
    const { PortalNeedsAttention } = await import('@/components/portal/PortalNeedsAttention');
    const { container } = render(
      <PortalNeedsAttention
        pendingApprovals={[]}
        recentlyResolvedRequests={[]}
        overdueTasks={[]}
        token="test-token"
        onApprovalAction={noop}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders pending approvals section with correct count badge', async () => {
    const { PortalNeedsAttention } = await import('@/components/portal/PortalNeedsAttention');
    const approvals = [
      makeDeliveryItem({ id: 'd1', title: 'Design mockup' }),
      makeDeliveryItem({ id: 'd2', title: 'Copy draft' }),
    ];
    render(
      <PortalNeedsAttention
        pendingApprovals={approvals}
        recentlyResolvedRequests={[]}
        token="test-token"
        onApprovalAction={noop}
      />,
    );

    expect(screen.getByText('Requires Your Action')).toBeInTheDocument();
    expect(screen.getByText('2 items waiting on you')).toBeInTheDocument();
    // Count badge
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows singular "item" when exactly 1 pending approval', async () => {
    const { PortalNeedsAttention } = await import('@/components/portal/PortalNeedsAttention');
    render(
      <PortalNeedsAttention
        pendingApprovals={[makeDeliveryItem()]}
        recentlyResolvedRequests={[]}
        token="test-token"
        onApprovalAction={noop}
      />,
    );
    expect(screen.getByText('1 item waiting on you')).toBeInTheDocument();
  });

  it('shows overdue tasks with Overdue badge', async () => {
    const { PortalNeedsAttention } = await import('@/components/portal/PortalNeedsAttention');
    const pastDate = '2020-01-01'; // Always in the past
    const overdueTask = makeClientTask({
      title: 'Submit onboarding doc',
      due_date: pastDate,
      completed_at: null,
    });

    render(
      <PortalNeedsAttention
        pendingApprovals={[]}
        recentlyResolvedRequests={[]}
        overdueTasks={[overdueTask]}
        token="test-token"
        onApprovalAction={noop}
      />,
    );

    expect(screen.getByText('Submit onboarding doc')).toBeInTheDocument();
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('does not show completed tasks in overdue list', async () => {
    const { PortalNeedsAttention } = await import('@/components/portal/PortalNeedsAttention');
    const completedOverdueTask = makeClientTask({
      title: 'Done task',
      due_date: '2020-01-01',
      completed_at: '2020-01-02T00:00:00Z', // completed → not overdue
    });

    const { container } = render(
      <PortalNeedsAttention
        pendingApprovals={[]}
        recentlyResolvedRequests={[]}
        overdueTasks={[completedOverdueTask]}
        token="test-token"
        onApprovalAction={noop}
      />,
    );
    // totalCount will be 0, component returns null
    expect(container.firstChild).toBeNull();
  });

  it('renders recently resolved requests', async () => {
    const { PortalNeedsAttention } = await import('@/components/portal/PortalNeedsAttention');
    const resolved = [
      makeScopeRequest({ id: 'r1', title: 'Add blog section', status: 'approved' }),
      makeScopeRequest({ id: 'r2', title: 'Remove footer', status: 'declined' }),
    ];

    render(
      <PortalNeedsAttention
        pendingApprovals={[]}
        recentlyResolvedRequests={resolved}
        token="test-token"
        onApprovalAction={noop}
      />,
    );

    expect(screen.getByText('Add blog section')).toBeInTheDocument();
    expect(screen.getByText('Remove footer')).toBeInTheDocument();
    expect(screen.getByText('Recently resolved items')).toBeInTheDocument();
  });
});

// ─── PortalClientTasks ────────────────────────────────────────────────────────

describe('PortalClientTasks', () => {
  const noop = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    }));
    vi.stubGlobal('import', { meta: { env: { VITE_SUPABASE_URL: 'https://test.supabase.co', VITE_SUPABASE_ANON_KEY: 'anon-key' } } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows empty state when tasks list is empty', async () => {
    const { PortalClientTasks } = await import('@/components/portal/PortalClientTasks');
    render(<PortalClientTasks tasks={[]} token="tok" onTaskComplete={noop} />);
    expect(screen.getByText('No tasks assigned')).toBeInTheDocument();
  });

  it('renders pending tasks', async () => {
    const { PortalClientTasks } = await import('@/components/portal/PortalClientTasks');
    const tasks = [
      makeClientTask({ id: 't1', title: 'Fill intake form' }),
      makeClientTask({ id: 't2', title: 'Review contract' }),
    ];
    render(<PortalClientTasks tasks={tasks} token="tok" onTaskComplete={noop} />);

    expect(screen.getByText('Fill intake form')).toBeInTheDocument();
    expect(screen.getByText('Review contract')).toBeInTheDocument();
  });

  it('shows Overdue badge for tasks past due date', async () => {
    const { PortalClientTasks } = await import('@/components/portal/PortalClientTasks');
    const overdue = makeClientTask({
      title: 'Overdue task',
      due_date: '2020-01-01',
      completed_at: null,
    });
    render(<PortalClientTasks tasks={[overdue]} token="tok" onTaskComplete={noop} />);
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('shows "Due soon" badge for tasks due within 3 days', async () => {
    const { PortalClientTasks } = await import('@/components/portal/PortalClientTasks');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dueSoon = makeClientTask({
      title: 'Almost due task',
      due_date: tomorrow.toISOString().split('T')[0],
      completed_at: null,
    });
    render(<PortalClientTasks tasks={[dueSoon]} token="tok" onTaskComplete={noop} />);
    expect(screen.getByText('Due soon')).toBeInTheDocument();
  });

  it('renders completed tasks in their own section', async () => {
    const { PortalClientTasks } = await import('@/components/portal/PortalClientTasks');
    const tasks = [
      makeClientTask({ id: 't1', title: 'Pending task', completed_at: null }),
      makeClientTask({ id: 't2', title: 'Done task', completed_at: '2024-01-10T00:00:00Z' }),
    ];
    render(<PortalClientTasks tasks={tasks} token="tok" onTaskComplete={noop} />);

    expect(screen.getByText('Pending task')).toBeInTheDocument();
    expect(screen.getByText('Done task')).toBeInTheDocument();
    expect(screen.getByText(/Completed \(1\)/)).toBeInTheDocument();
  });

  it('sorts overdue tasks before due-soon before normal pending', async () => {
    const { PortalClientTasks } = await import('@/components/portal/PortalClientTasks');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks = [
      makeClientTask({ id: 'normal', title: 'Normal task', due_date: null }),
      makeClientTask({ id: 'soon', title: 'Due soon task', due_date: tomorrow.toISOString().split('T')[0] }),
      makeClientTask({ id: 'over', title: 'Overdue task', due_date: '2020-01-01', completed_at: null }),
    ];

    render(<PortalClientTasks tasks={tasks} token="tok" onTaskComplete={noop} />);

    const items = screen.getAllByRole('button');
    // Overdue task's checkbox button should come first
    const taskTitles = screen.getAllByText(/task/i);
    // The overdue task appears before due-soon
    const overdueIndex = taskTitles.findIndex(el => el.textContent === 'Overdue task');
    const dueSoonIndex = taskTitles.findIndex(el => el.textContent === 'Due soon task');
    expect(overdueIndex).toBeLessThan(dueSoonIndex);
  });

  it('shows external link button for tasks with link_url', async () => {
    const { PortalClientTasks } = await import('@/components/portal/PortalClientTasks');
    const task = makeClientTask({
      title: 'Document task',
      link_url: 'https://docs.google.com/form',
    });
    render(<PortalClientTasks tasks={[task]} token="tok" onTaskComplete={noop} />);
    expect(screen.getByRole('link')).toBeInTheDocument();
  });
});

// ─── PortalOnboardingStepper ──────────────────────────────────────────────────

describe('PortalOnboardingStepper', () => {
  it('renders skeleton when loading', async () => {
    const { PortalOnboardingStepper } = await import('@/components/portal/PortalOnboardingStepper');
    const { container } = render(<PortalOnboardingStepper stages={[]} isLoading={true} />);
    // SkeletonPortalSection renders some skeleton elements
    expect(container.firstChild).not.toBeNull();
  });

  it('shows empty message when no stages', async () => {
    const { PortalOnboardingStepper } = await import('@/components/portal/PortalOnboardingStepper');
    render(<PortalOnboardingStepper stages={[]} />);
    expect(screen.getByText("Onboarding hasn't been set up yet.")).toBeInTheDocument();
  });

  it('shows progress summary with done count', async () => {
    const { PortalOnboardingStepper } = await import('@/components/portal/PortalOnboardingStepper');
    const stages = [
      makeOnboardingStage({ id: 's1', sort_order: 0, status: 'done', stage_label: 'Contract' }),
      makeOnboardingStage({ id: 's2', sort_order: 1, status: 'in_progress', stage_label: 'Intake' }),
      makeOnboardingStage({ id: 's3', sort_order: 2, status: 'not_started', stage_label: 'Payment' }),
    ];
    render(<PortalOnboardingStepper stages={stages} />);
    // Progress summary renders as "1 of 3 complete" inside a <p> tag
    expect(screen.getByText(/of 3/)).toBeInTheDocument();
    expect(screen.getByText(/complete/)).toBeInTheDocument();
  });

  it('renders all stage labels', async () => {
    const { PortalOnboardingStepper } = await import('@/components/portal/PortalOnboardingStepper');
    const stages = [
      makeOnboardingStage({ id: 's1', sort_order: 0, status: 'done', stage_label: 'Sign Contract' }),
      makeOnboardingStage({ id: 's2', sort_order: 1, status: 'in_progress', stage_label: 'Complete Intake' }),
    ];
    render(<PortalOnboardingStepper stages={stages} />);
    expect(screen.getByText('Sign Contract')).toBeInTheDocument();
    expect(screen.getByText('Complete Intake')).toBeInTheDocument();
  });

  it('sorts stages by sort_order regardless of input order', async () => {
    const { PortalOnboardingStepper } = await import('@/components/portal/PortalOnboardingStepper');
    const stages = [
      makeOnboardingStage({ id: 's2', sort_order: 1, stage_label: 'Second' }),
      makeOnboardingStage({ id: 's1', sort_order: 0, stage_label: 'First' }),
    ];
    render(<PortalOnboardingStepper stages={stages} />);

    const allText = document.body.textContent ?? '';
    expect(allText.indexOf('First')).toBeLessThan(allText.indexOf('Second'));
  });

  it('shows action button with link for stages that have action_url', async () => {
    const { PortalOnboardingStepper } = await import('@/components/portal/PortalOnboardingStepper');
    const stages = [
      makeOnboardingStage({
        id: 's1',
        stage_label: 'Sign Contract',
        status: 'waiting_on_client',
        action_url: 'https://docusign.com/sign',
        owner_label: 'client',
      }),
    ];
    render(<PortalOnboardingStepper stages={stages} />);
    // Both the stage label text and the button text say "Sign Contract" — use getAllByText
    const contractTexts = screen.getAllByText(/Sign Contract/);
    expect(contractTexts.length).toBeGreaterThanOrEqual(1);
    // There should be a link to the action_url
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://docusign.com/sign');
  });

  it('shows blocked status badge for blocked stages', async () => {
    const { PortalOnboardingStepper } = await import('@/components/portal/PortalOnboardingStepper');
    const stages = [
      makeOnboardingStage({
        id: 's1',
        stage_label: 'Kickoff Call',
        status: 'blocked',
        owner_label: 'operator',
      }),
    ];
    render(<PortalOnboardingStepper stages={stages} />);
    expect(screen.getByText('Kickoff Call')).toBeInTheDocument();
  });
});

// ─── ApprovalCard ─────────────────────────────────────────────────────────────

describe('ApprovalCard', () => {
  const noop = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true }),
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders item title and category', async () => {
    const { ApprovalCard } = await import('@/components/portal/ApprovalCard');
    const item = makeDeliveryItem({ title: 'Logo redesign', category: 'Brand' });
    render(<ApprovalCard item={item} token="tok" onAction={noop} />);
    expect(screen.getByText('Logo redesign')).toBeInTheDocument();
    expect(screen.getByText('Brand')).toBeInTheDocument();
  });

  it('shows Approve and Request Changes buttons initially', async () => {
    const { ApprovalCard } = await import('@/components/portal/ApprovalCard');
    render(<ApprovalCard item={makeDeliveryItem()} token="tok" onAction={noop} />);
    expect(screen.getByRole('button', { name: /Approve/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Request Changes/i })).toBeInTheDocument();
  });

  it('shows feedback textarea when Request Changes is clicked', async () => {
    const { ApprovalCard } = await import('@/components/portal/ApprovalCard');
    render(<ApprovalCard item={makeDeliveryItem()} token="tok" onAction={noop} />);

    fireEvent.click(screen.getByRole('button', { name: /Request Changes/i }));

    expect(screen.getByPlaceholderText('What would you like changed?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit Feedback/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  it('Submit Feedback button is disabled when feedback is empty', async () => {
    const { ApprovalCard } = await import('@/components/portal/ApprovalCard');
    render(<ApprovalCard item={makeDeliveryItem()} token="tok" onAction={noop} />);

    fireEvent.click(screen.getByRole('button', { name: /Request Changes/i }));

    const submitBtn = screen.getByRole('button', { name: /Submit Feedback/i });
    expect(submitBtn).toBeDisabled();
  });

  it('Cancel hides feedback form and clears textarea', async () => {
    const { ApprovalCard } = await import('@/components/portal/ApprovalCard');
    render(<ApprovalCard item={makeDeliveryItem()} token="tok" onAction={noop} />);

    fireEvent.click(screen.getByRole('button', { name: /Request Changes/i }));
    const textarea = screen.getByPlaceholderText('What would you like changed?');
    fireEvent.change(textarea, { target: { value: 'Make it bigger' } });

    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

    expect(screen.queryByPlaceholderText('What would you like changed?')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Approve/i })).toBeInTheDocument();
  });

  it('shows approved state after clicking Approve', async () => {
    const { ApprovalCard } = await import('@/components/portal/ApprovalCard');
    render(<ApprovalCard item={makeDeliveryItem({ title: 'Hero banner' })} token="tok" onAction={noop} />);

    fireEvent.click(screen.getByRole('button', { name: /Approve/i }));

    await waitFor(() => {
      expect(screen.getByText('Approved')).toBeInTheDocument();
    });
    expect(noop).toHaveBeenCalled();
  });

  it('shows error toast and resets when API call fails', async () => {
    const { toast } = await import('sonner');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: { message: 'Server error' } }),
    }));

    const { ApprovalCard } = await import('@/components/portal/ApprovalCard');
    render(<ApprovalCard item={makeDeliveryItem()} token="tok" onAction={noop} />);

    fireEvent.click(screen.getByRole('button', { name: /Approve/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
    // Approve button should still be visible
    expect(screen.getByRole('button', { name: /Approve/i })).toBeInTheDocument();
  });

  it('shows feedback submitted state after submitting revision', async () => {
    const { ApprovalCard } = await import('@/components/portal/ApprovalCard');
    render(<ApprovalCard item={makeDeliveryItem({ title: 'Report draft' })} token="tok" onAction={noop} />);

    fireEvent.click(screen.getByRole('button', { name: /Request Changes/i }));
    const textarea = screen.getByPlaceholderText('What would you like changed?');
    fireEvent.change(textarea, { target: { value: 'Needs more detail' } });

    fireEvent.click(screen.getByRole('button', { name: /Submit Feedback/i }));

    await waitFor(() => {
      expect(screen.getByText('Feedback submitted')).toBeInTheDocument();
    });
  });

  it('renders description when present', async () => {
    const { ApprovalCard } = await import('@/components/portal/ApprovalCard');
    const item = makeDeliveryItem({ description: 'This is a detailed description of the deliverable.' });
    render(<ApprovalCard item={item} token="tok" onAction={noop} />);
    expect(screen.getByText('This is a detailed description of the deliverable.')).toBeInTheDocument();
  });
});
