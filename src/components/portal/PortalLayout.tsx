import { ReactNode, useEffect, CSSProperties } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface PortalLayoutProps {
  operatorName: string;
  businessName: string | null;
  clientName: string;
  children: ReactNode;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  onRequestSomething?: () => void;
  /** Slot for the mobile hamburger trigger */
  mobileNav?: ReactNode;
  /** Slot for the desktop sidebar */
  sidebar?: ReactNode;
}

export function PortalLayout({
  operatorName,
  businessName,
  clientName,
  children,
  logoUrl,
  primaryColor,
  accentColor,
  onRequestSomething,
  mobileNav,
  sidebar,
}: PortalLayoutProps) {
  const currentMonth = new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const displayName = businessName || operatorName;

  useEffect(() => {
    document.title = `${clientName} — Client Portal`;
    return () => {
      document.title = 'Luma';
    };
  }, [clientName]);

  const cssVars: CSSProperties = {
    ...(primaryColor ? { ['--portal-primary' as string]: primaryColor } : {}),
    ...(accentColor ? { ['--portal-accent' as string]: accentColor } : {}),
  };

  return (
    <div className="min-h-screen bg-portal-background" style={cssVars}>
      <div className="max-w-[900px] mx-auto px-5 pt-0 pb-12">
        {/* Top bar */}
        <header className="bg-card border-b border-border mb-8">
          <div className="flex items-center justify-between h-14 px-0">
            {/* Left: logo mark + client name */}
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt={displayName} className="h-7 w-auto object-contain" />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
                  <span className="text-[11px] font-bold text-primary-foreground">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="font-bold text-[15px] tracking-tight">{displayName}</span>
              <div className="w-px h-4 bg-border" />
              <span className="text-[13.5px] text-muted-foreground">{clientName}</span>
            </div>

            {/* Right: request button + mobile nav */}
            <div className="flex items-center gap-2">
              {onRequestSomething && (
                <Button
                  onClick={onRequestSomething}
                  size="sm"
                  className="gap-1.5 text-xs h-8"
                  aria-label="Request something"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Request Something</span>
                </Button>
              )}
              {mobileNav}
            </div>
          </div>
        </header>

        {/* Sidebar + Content layout */}
        <div className="flex gap-0">
          {sidebar}
          <main className="flex-1 min-w-0 space-y-8">{children}</main>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-border/50 text-center space-y-1">
          <p className="text-xs text-muted-foreground">
            Questions? Reach out to{' '}
            <span className="font-medium">{operatorName}</span>
            {businessName && businessName !== operatorName && (
              <> at {businessName}</>
            )}
            .
          </p>
          {!logoUrl && (
            <p className="text-xs text-muted-foreground/40">Powered by Luma</p>
          )}
        </footer>
      </div>
    </div>
  );
}
