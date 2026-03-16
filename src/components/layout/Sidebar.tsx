import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, DollarSign, Clock,
  Settings, LogOut, Zap, Receipt, ClipboardCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const mainNav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/proposals', icon: FileText, label: 'Proposals' },
  { to: '/revenue', icon: DollarSign, label: 'Revenue' },
];

const opsNav = [
  { to: '/approvals', icon: ClipboardCheck, label: 'Approvals' },
  { to: '/timesheet', icon: Clock, label: 'Timesheet' },
  { to: '/invoices', icon: Receipt, label: 'Invoices' },
];

const workspaceNav = [
  { to: '/settings', icon: Settings, label: 'Settings' },
];

type NavItemProps = {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
};

function NavItem({ to, icon: Icon, label, badge }: NavItemProps) {
  const location = useLocation();
  const isActive = to === '/'
    ? location.pathname === '/'
    : location.pathname.startsWith(to);

  return (
    <NavLink
      to={to}
      className={cn(
        'flex items-center gap-2.5 px-4 py-[7px] text-[13.5px] font-medium transition-colors border-l-2',
        isActive
          ? 'bg-sidebar-accent text-sidebar-primary border-l-sidebar-primary font-semibold'
          : 'text-muted-foreground border-l-transparent hover:bg-muted hover:text-foreground'
      )}
    >
      <Icon className={cn('w-[15px] h-[15px] shrink-0', isActive ? 'opacity-100' : 'opacity-70')} />
      <span className="flex-1">{label}</span>
      {badge != null && (
        <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
          {badge}
        </span>
      )}
    </NavLink>
  );
}

function NavSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <p className="px-4 pt-3 pb-1 text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/60">
        {label}
      </p>
      {children}
    </div>
  );
}

export function Sidebar() {
  const { signOut, user } = useAuth();

  return (
    <aside className="w-[220px] flex flex-col bg-sidebar border-r border-sidebar-border h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-14 border-b border-sidebar-border shrink-0">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-primary-foreground shrink-0">
          <Zap className="w-3.5 h-3.5" />
        </div>
        <span className="font-bold text-base tracking-tight">Luma</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        <NavSection label="Main">
          {mainNav.map((item) => <NavItem key={item.to} {...item} />)}
        </NavSection>

        <div className="mx-4 my-1.5 h-px bg-border/60" />

        <NavSection label="Operations">
          {opsNav.map((item) => <NavItem key={item.to} {...item} />)}
        </NavSection>

        <div className="mx-4 my-1.5 h-px bg-border/60" />

        <NavSection label="Workspace">
          {workspaceNav.map((item) => <NavItem key={item.to} {...item} />)}
        </NavSection>
      </nav>

      {/* Footer */}
      <div className="shrink-0 px-3 py-3 border-t border-sidebar-border">
        {user && (
          <div className="flex items-center gap-2.5 px-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
              {user.email?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-semibold text-foreground truncate leading-tight">
                {user.email?.split('@')[0]}
              </p>
              <p className="text-[11px] text-muted-foreground truncate leading-tight">Admin</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2.5 text-muted-foreground hover:text-foreground text-[13px]"
          onClick={() => signOut()}
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}

// Keep backward-compat export so Header.tsx import doesn't break
export const navItems = [...mainNav, ...opsNav, ...workspaceNav];
