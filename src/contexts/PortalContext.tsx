import { createContext, useContext } from 'react';
import type { PortalData } from '@/types/portal';

type PortalContextValue = {
  token: string;
  data: PortalData;
  refetch: () => void;
};

const PortalContext = createContext<PortalContextValue | null>(null);

export function PortalProvider({
  token,
  data,
  refetch,
  children,
}: PortalContextValue & { children: React.ReactNode }) {
  return (
    <PortalContext.Provider value={{ token, data, refetch }}>
      {children}
    </PortalContext.Provider>
  );
}

export function usePortalContext(): PortalContextValue {
  const ctx = useContext(PortalContext);
  if (!ctx) {
    throw new Error('usePortalContext must be used within a PortalProvider');
  }
  return ctx;
}
