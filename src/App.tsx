import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppShell } from '@/components/layout';
import { Loader2 } from 'lucide-react';
import { lazy, Suspense } from 'react';

// Lazy-loaded pages
const Login = lazy(() => import('@/pages/Login'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const ClientList = lazy(() => import('@/pages/ClientList'));
const ClientDetail = lazy(() => import('@/pages/ClientDetail'));
const Settings = lazy(() => import('@/pages/Settings'));
const AuthCallback = lazy(() => import('@/pages/AuthCallback'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const Portal = lazy(() => import('@/pages/Portal'));
const Timesheet = lazy(() => import('@/pages/Timesheet'));
const ProposalList = lazy(() => import('@/pages/ProposalList'));
const ProposalBuilder = lazy(() => import('@/pages/ProposalBuilder'));
const ProposalDetail = lazy(() => import('@/pages/ProposalDetail'));
const Revenue = lazy(() => import('@/pages/Revenue'));
const Invoices = lazy(() => import('@/pages/Invoices'));
const InvoiceDetail = lazy(() => import('@/pages/InvoiceDetail'));
const PortalProposal = lazy(() => import('@/pages/PortalProposal'));
const PortalAgreement = lazy(() => import('@/pages/PortalAgreement'));
const PortalSnapshotDetail = lazy(() => import('@/pages/PortalSnapshotDetail'));
const EditorTest = lazy(() => import('@/pages/EditorTest'));
const SnapshotList = lazy(() => import('@/pages/SnapshotList'));
const SnapshotDetail = lazy(() => import('@/pages/SnapshotDetail'));
const GrantEvidence = lazy(() => import('@/pages/GrantEvidence'));
const Approvals = lazy(() => import('@/pages/Approvals'));
const DeadlineView = lazy(() => import('@/pages/DeadlineView'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/portal/:token" element={<Portal />} />
          <Route path="/portal/:token/proposal/:proposalId" element={<PortalProposal />} />
          <Route path="/portal/:token/agreements" element={<PortalAgreement />} />
          <Route path="/portal/:token/agreements/:agreementId" element={<PortalAgreement />} />
          <Route path="/portal/:token/snapshots/:monthSlug" element={<PortalSnapshotDetail />} />

          {/* Protected — inside AppShell */}
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="/clients" element={<ClientList />} />
            <Route path="/clients/:id" element={<ClientDetail />} />
            <Route path="/clients/:id/snapshots" element={<SnapshotList />} />
            <Route path="/clients/:id/snapshots/:monthSlug" element={<SnapshotDetail />} />
            <Route path="/proposals" element={<ProposalList />} />
            <Route path="/proposals/new" element={<ProposalBuilder />} />
            <Route path="/proposals/:id" element={<ProposalDetail />} />
            <Route path="/proposals/:id/edit" element={<ProposalBuilder />} />
            <Route path="/revenue" element={<Revenue />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/invoices/:id" element={<InvoiceDetail />} />
            <Route path="/timesheet" element={<Timesheet />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/approvals" element={<Approvals />} />
            <Route path="/schedule" element={<DeadlineView />} />
            <Route path="/grant-evidence" element={<GrantEvidence />} />
            <Route path="/test-editor" element={<EditorTest />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
