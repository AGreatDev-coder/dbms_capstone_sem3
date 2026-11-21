import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ErrorBoundary from './components/common/ErrorBoundary';

// Pages
import Dashboard from './pages/Dashboard';
import DeveloperDashboard from './pages/dashboards/DeveloperDashboard';
import HospitalAdminDashboard from './pages/dashboards/HospitalAdminDashboard';
import StaffDashboard from './pages/dashboards/StaffDashboard';
import DonorDashboard from './pages/dashboards/DonorDashboard';
import PatientDashboard from './pages/dashboards/PatientDashboard';
import HospitalManagement from './pages/HospitalManagement';
import DonorManagement from './pages/DonorManagement';
import PatientManagement from './pages/PatientManagement';
import BloodBank from './pages/BloodBank';
import BloodRequests from './pages/BloodRequests';
import OrganDonation from './pages/OrganDonation';
import DonationCamps from './pages/DonationCamps';
import SQLLaboratory from './pages/SQLLaboratory';
import DBMSLearningLab from './pages/DBMSLearningLab';
import EERDiagramPage from './pages/EERDiagramPage';
import Login from './pages/Login';

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <Navbar />
      <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

const AccessDenied = ({ allowedRoles = [], userRole }) => {
  return (
    <div className="border border-rule bg-surface p-8 max-w-xl mx-auto my-12 rounded-[2px] text-center space-y-3">
      <p className="font-mono text-xs uppercase tracking-wider text-blood">
        HTTP 403 &bull; Authorization Gate Enforced
      </p>
      <h2 className="font-serif text-2xl font-semibold text-ink">
        Restricted Ledger Module
      </h2>
      <p className="text-xs text-muted max-w-md mx-auto leading-relaxed">
        Your active role (<strong className="text-ink font-mono">{userRole || 'Guest'}</strong>) is not granted access to this operational view.
        Authorized roles for this ledger: <span className="font-mono text-ink">{allowedRoles.join(', ')}</span>.
      </p>
      <div className="pt-4 border-t border-rule">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blood text-paper text-xs font-medium rounded-[2px] hover:bg-blood-hover transition-colors"
        >
          Return to Primary Dashboard
        </Link>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-xs font-mono text-muted">
        <span className="w-2 h-2 rounded-full bg-blood animate-pulse mr-2" />
        <span>Verifying clinical authorization...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // DEVELOPER has universal clearance to all frontend ledger modules
  if (allowedRoles && user.role !== 'DEVELOPER' && !allowedRoles.includes(user.role)) {
    return (
      <MainLayout>
        <AccessDenied allowedRoles={allowedRoles} userRole={user.role} />
      </MainLayout>
    );
  }

  return children;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Standalone Login Route */}
            <Route path="/login" element={<Login />} />

            {/* Core Modules wrapped in MainLayout & ProtectedRoute */}
            <Route
              path="/"
              element={
                <ProtectedRoute allowedRoles={['DEVELOPER', 'ADMIN', 'STAFF', 'DONOR', 'PATIENT']}>
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            {/* Dedicated Role Dashboard Direct Routes */}
            <Route
              path="/dashboard/developer"
              element={
                <ProtectedRoute allowedRoles={['DEVELOPER']}>
                  <MainLayout>
                    <DeveloperDashboard />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/hospital-admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <MainLayout>
                    <HospitalAdminDashboard />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/staff"
              element={
                <ProtectedRoute allowedRoles={['STAFF']}>
                  <MainLayout>
                    <StaffDashboard />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/donor"
              element={
                <ProtectedRoute allowedRoles={['DONOR']}>
                  <MainLayout>
                    <DonorDashboard />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/patient"
              element={
                <ProtectedRoute allowedRoles={['PATIENT']}>
                  <MainLayout>
                    <PatientDashboard />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/hospitals"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
                  <MainLayout>
                    <HospitalManagement />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/donors"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'STAFF', 'DONOR']}>
                  <MainLayout>
                    <DonorManagement />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patients"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'STAFF', 'PATIENT']}>
                  <MainLayout>
                    <PatientManagement />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/blood-bank"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
                  <MainLayout>
                    <BloodBank />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/blood-requests"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'STAFF', 'PATIENT']}>
                  <MainLayout>
                    <BloodRequests />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/organ-donation"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'STAFF', 'DONOR', 'PATIENT']}>
                  <MainLayout>
                    <OrganDonation />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/donation-camps"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'STAFF', 'DONOR']}>
                  <MainLayout>
                    <DonationCamps />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sql-lab"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
                  <MainLayout>
                    <SQLLaboratory />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dbms-lab"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'STAFF', 'DONOR', 'PATIENT']}>
                  <MainLayout>
                    <DBMSLearningLab />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/eer-diagram"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'STAFF', 'DONOR', 'PATIENT']}>
                  <MainLayout>
                    <EERDiagramPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
