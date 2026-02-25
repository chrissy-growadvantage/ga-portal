import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, DollarSign, Clock, Settings, LogOut, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/proposals', icon: FileText, label: 'Proposals' },
  { to: '/revenue', icon: DollarSign, label: 'Revenue' },
  { to: '/timesheet', icon: Clock, label: 'Timesheet' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const { signOut, user } = useAuth();
  const location = useLocation();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30">
      <div className="flex flex-col flex-1 bg-card border-r border-border">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-6 h-16 border-b border-border">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
            <Zap className="w-4 h-4" />
          </div>
          <span className="font-bold text-lg tracking-tight">Luma</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(to);

            return (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-border">
          {user && (
            <p className="px-3 mb-3 text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
            onClick={() => signOut()}
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </div>
      </div>
    </aside>
  );
}
