import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { TimerWidget, StartTimerDialog, StopTimerDialog } from '@/components/time-tracking';

export function AppShell() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header />

      <main className="md:pl-64">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Outlet />
        </div>
      </main>

      {/* Global timer UI — visible on all protected pages */}
      <TimerWidget />
      <StartTimerDialog />
      <StopTimerDialog />
    </div>
  );
}
