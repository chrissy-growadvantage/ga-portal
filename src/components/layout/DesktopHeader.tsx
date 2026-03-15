import { Search, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export function DesktopHeader() {
  const { user } = useAuth();
  const initials = user?.email?.[0]?.toUpperCase() ?? 'U';

  return (
    <header className="h-14 flex items-center gap-3 px-5 bg-card border-b border-border shrink-0">
      {/* Search */}
      <div className="flex items-center gap-2 flex-1 max-w-sm h-[34px] bg-background border border-border rounded-md px-3 text-muted-foreground cursor-text">
        <Search className="w-3.5 h-3.5 shrink-0" />
        <span className="text-[13px] flex-1 select-none">Search clients, deliveries…</span>
        <kbd className="text-[10px] bg-card border border-border rounded px-1.5 py-0.5 font-mono leading-none">
          ⌘K
        </kbd>
      </div>

      {/* Actions */}
      <div className="ml-auto flex items-center gap-2">
        {/* Notification bell */}
        <button
          className={cn(
            'relative w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground',
            'hover:bg-muted hover:text-foreground transition-colors'
          )}
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary border-[1.5px] border-card" />
        </button>

        {/* Avatar */}
        <button
          className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary hover:bg-primary/20 transition-colors"
          aria-label="User menu"
        >
          {initials}
        </button>
      </div>
    </header>
  );
}
