import { useState, useRef, useCallback, useEffect } from 'react';
import { useTimer } from '@/contexts/TimerContext';
import { formatDuration } from '@/lib/time-utils';
import { Button } from '@/components/ui/button';
import { Play, Square, Minimize2, Maximize2, GripHorizontal, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TimerWidget() {
  const { timer, setStartDialogOpen, setStopDialogOpen } = useTimer();
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only allow drag from the grip area
      if (!(e.target as HTMLElement).closest('[data-drag-handle]')) return;
      e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        posX: position.x,
        posY: position.y,
      };
    },
    [position]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPosition({
        x: dragStartRef.current.posX + dx,
        y: dragStartRef.current.posY + dy,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Idle state — show a small play button (mobile only; desktop uses keyboard shortcut Ctrl+T)
  if (!timer.isRunning) {
    return (
      <div
        className="md:hidden fixed bottom-6 right-6 z-50"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
        }}
      >
        <Button
          size="lg"
          className="rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-shadow"
          onClick={() => setStartDialogOpen(true)}
          aria-label="Start timer (Ctrl+T)"
        >
          <Play className="w-5 h-5" />
        </Button>
      </div>
    );
  }

  // Minimized state — small pill
  if (isMinimized) {
    return (
      <div
        ref={dragRef}
        className="fixed bottom-6 right-6 z-50"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
        }}
        onMouseDown={handleMouseDown}
      >
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 shadow-lg hover:shadow-xl transition-shadow text-sm font-mono font-medium"
          aria-label={`Timer running: ${formatDuration(timer.elapsedSeconds)}. Click to expand.`}
        >
          <Timer className="w-3.5 h-3.5 animate-pulse" />
          {formatDuration(timer.elapsedSeconds)}
        </button>
      </div>
    );
  }

  // Full widget
  return (
    <div
      ref={dragRef}
      className={cn(
        'fixed bottom-6 right-6 z-50 w-72',
        'rounded-xl border border-border bg-card shadow-xl',
        'animate-in slide-in-from-bottom-4 fade-in duration-300',
        isDragging && 'cursor-grabbing'
      )}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header with drag handle */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div
          data-drag-handle
          className="flex items-center gap-1.5 cursor-grab text-muted-foreground"
          aria-label="Drag to reposition"
        >
          <GripHorizontal className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">Timer</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setIsMinimized(true)}
          aria-label="Minimize timer"
        >
          <Minimize2 className="w-3 h-3" />
        </Button>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-3">
        {/* Timer display */}
        <div className="text-center">
          <div
            className="text-3xl font-mono font-semibold tracking-tight tabular-nums"
            role="timer"
            aria-live="off"
            aria-label={`Elapsed time: ${formatDuration(timer.elapsedSeconds)}`}
          >
            {formatDuration(timer.elapsedSeconds)}
          </div>
        </div>

        {/* Context info */}
        <div className="space-y-0.5 text-center">
          <p className="text-sm font-medium truncate">{timer.clientName || 'Client'}</p>
          <p className="text-xs text-muted-foreground truncate">{timer.description}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="destructive"
            size="sm"
            className="flex-1"
            onClick={() => setStopDialogOpen(true)}
          >
            <Square className="w-3.5 h-3.5 mr-1.5" />
            Stop
          </Button>
        </div>
      </div>
    </div>
  );
}
