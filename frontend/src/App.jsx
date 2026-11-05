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

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Standalone Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Core Modules wrapped in MainLayout */}
          <Route
            path="/"
            element={
              <MainLayout>
                <Dashboard />
              </MainLayout>
            }
          />
          <Route
            path="/hospitals"
            element={
              <MainLayout>
                <HospitalManagement />
              </MainLayout>
            }
          />
          <Route
            path="/donors"
            element={
              <MainLayout>
                <DonorManagement />
              </MainLayout>
            }
          />
          <Route
            path="/patients"
            element={
              <MainLayout>
                <PatientManagement />
              </MainLayout>
            }
          />
          <Route
            path="/blood-bank"
            element={
              <MainLayout>
                <BloodBank />
              </MainLayout>
            }
          />
          <Route
            path="/blood-requests"
            element={
              <MainLayout>
                <BloodRequests />
              </MainLayout>
            }
          />
          <Route
            path="/organ-donation"
            element={
              <MainLayout>
                <OrganDonation />
              </MainLayout>
            }
          />
          <Route
            path="/donation-camps"
            element={
              <MainLayout>
                <DonationCamps />
              </MainLayout>
            }
          />
          <Route
            path="/sql-lab"
            element={
              <MainLayout>
                <SQLLaboratory />
              </MainLayout>
            }
          />
          <Route
            path="/eer-diagram"
            element={
              <MainLayout>
                <EERDiagramPage />
              </MainLayout>
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

