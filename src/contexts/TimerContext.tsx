import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRunningTimer, useCreateTimeEntry, useUpdateTimeEntry } from '@/hooks/useTimeEntries';
import { toast } from 'sonner';

const STORAGE_KEY = 'luma_timer_state';

interface TimerState {
  isRunning: boolean;
  timeEntryId: string | null;
  startedAt: Date | null;
  elapsedSeconds: number;
  description: string;
  clientId: string;
  clientName: string;
  deliveryItemId: string | null;
}

interface TimerContextType {
  timer: TimerState;
  startTimer: (params: {
    clientId: string;
    clientName: string;
    description: string;
    deliveryItemId?: string;
  }) => Promise<void>;
  stopTimer: () => Promise<{ timeEntryId: string; elapsedSeconds: number; clientId: string; description: string } | null>;
  discardTimer: () => Promise<void>;
  isStartDialogOpen: boolean;
  setStartDialogOpen: (open: boolean) => void;
  isStopDialogOpen: boolean;
  setStopDialogOpen: (open: boolean) => void;
}

const defaultTimer: TimerState = {
  isRunning: false,
  timeEntryId: null,
  startedAt: null,
  elapsedSeconds: 0,
  description: '',
  clientId: '',
  clientName: '',
  deliveryItemId: null,
};

const TimerContext = createContext<TimerContextType | undefined>(undefined);

function getStoredState(): TimerState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      ...parsed,
      startedAt: parsed.startedAt ? new Date(parsed.startedAt) : null,
    };
  } catch {
    return null;
  }
}

function storeState(state: TimerState) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...state,
        startedAt: state.startedAt?.toISOString() ?? null,
      })
    );
  } catch {
    // localStorage full or unavailable
  }
}

function clearStoredState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { data: runningEntry } = useRunningTimer();
  const createTimeEntry = useCreateTimeEntry();
  const updateTimeEntry = useUpdateTimeEntry();

  const [timer, setTimer] = useState<TimerState>(defaultTimer);
  const [isStartDialogOpen, setStartDialogOpen] = useState(false);
  const [isStopDialogOpen, setStopDialogOpen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initializedRef = useRef(false);

  // Restore timer from localStorage or DB running entry on mount
  useEffect(() => {
    if (initializedRef.current) return;
    if (!user) return;

    const stored = getStoredState();
    if (stored?.isRunning && stored.startedAt) {
      const elapsed = Math.floor((Date.now() - new Date(stored.startedAt).getTime()) / 1000);
      setTimer({ ...stored, elapsedSeconds: elapsed });
      initializedRef.current = true;
      return;
    }

    // Fall back to DB running entry
    if (runningEntry && !runningEntry.ended_at) {
      const elapsed = Math.floor((Date.now() - new Date(runningEntry.started_at).getTime()) / 1000);
      const restored: TimerState = {
        isRunning: true,
        timeEntryId: runningEntry.id,
        startedAt: new Date(runningEntry.started_at),
        elapsedSeconds: elapsed,
        description: runningEntry.description,
        clientId: runningEntry.client_id,
        clientName: '', // Will be resolved by components
        deliveryItemId: runningEntry.delivery_item_id,
      };
      setTimer(restored);
      storeState(restored);
      initializedRef.current = true;
    }
  }, [user, runningEntry]);

  // Tick interval for elapsed seconds
  useEffect(() => {
    if (timer.isRunning && timer.startedAt) {
      intervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (!prev.startedAt) return prev;
          const elapsed = Math.floor((Date.now() - prev.startedAt.getTime()) / 1000);
          return { ...prev, elapsedSeconds: elapsed };
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timer.isRunning, timer.startedAt]);

  // Warn if timer > 12 hours
  useEffect(() => {
    if (timer.isRunning && timer.elapsedSeconds > 12 * 3600) {
      toast.warning('Timer has been running for over 12 hours. Consider stopping and adjusting the time.');
    }
  }, [timer.isRunning, timer.elapsedSeconds > 12 * 3600]);

  const startTimer = useCallback(
    async (params: {
      clientId: string;
      clientName: string;
      description: string;
      deliveryItemId?: string;
    }) => {
      if (!user) return;

      const startedAt = new Date();

      try {
        const entry = await createTimeEntry.mutateAsync({
          operator_id: user.id,
          client_id: params.clientId,
          description: params.description,
          started_at: startedAt.toISOString(),
          delivery_item_id: params.deliveryItemId ?? null,
        });

        const newState: TimerState = {
          isRunning: true,
          timeEntryId: entry.id,
          startedAt,
          elapsedSeconds: 0,
          description: params.description,
          clientId: params.clientId,
          clientName: params.clientName,
          deliveryItemId: params.deliveryItemId ?? null,
        };
        setTimer(newState);
        storeState(newState);
        toast.success('Timer started');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to start timer';
        toast.error(message);
      }
    },
    [user, createTimeEntry]
  );

  const stopTimer = useCallback(async () => {
    if (!timer.isRunning || !timer.timeEntryId) return null;

    const endedAt = new Date();
    const durationSeconds = timer.startedAt
      ? Math.floor((endedAt.getTime() - timer.startedAt.getTime()) / 1000)
      : timer.elapsedSeconds;

    try {
      await updateTimeEntry.mutateAsync({
        id: timer.timeEntryId,
        ended_at: endedAt.toISOString(),
        duration_seconds: durationSeconds,
      });

      const result = {
        timeEntryId: timer.timeEntryId,
        elapsedSeconds: durationSeconds,
        clientId: timer.clientId,
        description: timer.description,
      };

      setTimer(defaultTimer);
      clearStoredState();
      toast.success('Timer stopped');
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to stop timer';
      toast.error(message);
      return null;
    }
  }, [timer, updateTimeEntry]);

  const discardTimer = useCallback(async () => {
    if (timer.timeEntryId) {
      try {
        // Delete the DB entry
        const { error } = await (await import('@/lib/supabase')).supabase
          .from('time_entries')
          .delete()
          .eq('id', timer.timeEntryId);
        if (error) throw error;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to discard timer';
        toast.error(message);
        return;
      }
    }
    setTimer(defaultTimer);
    clearStoredState();
    toast.info('Timer discarded');
  }, [timer.timeEntryId]);

  // Keyboard shortcut: Ctrl+T to open start/stop dialog
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        // Don't intercept if user is typing in an input
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

        e.preventDefault();
        if (timer.isRunning) {
          setStopDialogOpen(true);
        } else {
          setStartDialogOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [timer.isRunning]);

  return (
    <TimerContext.Provider
      value={{
        timer,
        startTimer,
        stopTimer,
        discardTimer,
        isStartDialogOpen,
        setStartDialogOpen,
        isStopDialogOpen,
        setStopDialogOpen,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (!context) throw new Error('useTimer must be used within a TimerProvider');
  return context;
}
