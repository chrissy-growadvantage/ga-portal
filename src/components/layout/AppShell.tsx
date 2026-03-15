import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { DesktopHeader } from './DesktopHeader';
import { TimerWidget, StartTimerDialog, StopTimerDialog } from '@/components/time-tracking';

export function AppShell() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Mobile header — only shown on small screens */}
      <div className="md:hidden no-print">
        <Header />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — hidden on mobile */}
        <div className="hidden md:flex no-print">
          <Sidebar />
        </div>

        {/* Main content column */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Desktop header */}
          <div className="hidden md:block no-print">
            <DesktopHeader />
          </div>

          <main className="flex-1 overflow-y-auto">
            <div className="px-6 py-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <TimerWidget />
      <StartTimerDialog />
      <StopTimerDialog />
    </div>
  );
}
