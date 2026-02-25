import { ReactNode, useEffect } from 'react';

interface PortalLayoutProps {
  operatorName: string;
  businessName: string | null;
  clientName: string;
  children: ReactNode;
}

export function PortalLayout({ operatorName, businessName, clientName, children }: PortalLayoutProps) {
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  useEffect(() => {
    document.title = `${clientName} — Delivery Summary`;
    return () => { document.title = 'Luma'; };
  }, [clientName]);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'hsl(0 0% 99%)' }}
    >
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* Trust Banner */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">
                {(businessName || operatorName).charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {businessName || operatorName}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-3">
            Delivery Summary for {clientName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{currentMonth}</p>
        </header>

        {/* Content sections */}
        <div className="space-y-8">
          {children}
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-border/50 text-center">
          <p className="text-xs text-muted-foreground/60">
            Powered by Luma
          </p>
        </footer>
      </div>
    </div>
  );
}
