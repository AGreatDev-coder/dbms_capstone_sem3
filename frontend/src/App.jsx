import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import Dashboard from './pages/Dashboard';
import HospitalManagement from './pages/HospitalManagement';
import DonorManagement from './pages/DonorManagement';
import PatientManagement from './pages/PatientManagement';
import BloodBank from './pages/BloodBank';
import BloodRequests from './pages/BloodRequests';
import OrganDonation from './pages/OrganDonation';
import DonationCamps from './pages/DonationCamps';
import SQLLaboratory from './pages/SQLLaboratory';
import EERDiagramPage from './pages/EERDiagramPage';
import Login from './pages/Login';

import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

const AccessDenied = ({ allowedRoles = [], userRole }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4 shadow-sm border border-rose-200">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <span className="text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 mb-2">
        HTTP 403 FORBIDDEN &bull; RBAC ENFORCED
      </span>
      <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
        Access Restricted for Role: {userRole || 'Guest'}
      </h2>
      <p className="text-sm text-slate-600 max-w-md mt-2 leading-relaxed">
        Your assigned role lacks authorization to access this DBMS module.
        Required permissions: <strong className="text-slate-800">{allowedRoles.join(' or ')}</strong>.
      </p>
      <div className="flex items-center gap-3 mt-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
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
    <AuthProvider>
      <Router>
        <Routes>
          {/* Standalone Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Core Modules wrapped in MainLayout & ProtectedRoute */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'STAFF', 'DONOR', 'PATIENT']}>
                <MainLayout>
                  <Dashboard />
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
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <MainLayout>
                  <SQLLaboratory />
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
  );
}

export default App;

