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
    <div className="min-h-screen bg-portal-background flex flex-col" style={cssVars}>
      {/* Full-width sticky header */}
      <header className="w-full bg-card border-b border-border shrink-0 sticky top-0 z-20">
        <div className="flex items-center justify-between h-14 px-5">
          {/* Left: logo + operator name + divider + client name */}
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
                className="gap-1.5 text-xs h-11 sm:h-8 min-w-[44px]"
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

      {/* Body: sidebar + scrollable content */}
      <div className="flex flex-1 min-h-0">
        {sidebar}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[960px] mx-auto px-6 py-8 space-y-8">
            {children}
          </div>
          <footer className="max-w-[960px] mx-auto px-6 pb-12 mt-6 pt-6 border-t border-border/50 text-center space-y-1">
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
        </main>
      </div>
    </div>
  );
}
