import React from 'react';
import { useAuth } from '../context/AuthContext';
import DeveloperDashboard from './dashboards/DeveloperDashboard';
import HospitalAdminDashboard from './dashboards/HospitalAdminDashboard';
import StaffDashboard from './dashboards/StaffDashboard';
import DonorDashboard from './dashboards/DonorDashboard';
import PatientDashboard from './dashboards/PatientDashboard';

/**
 * Dynamic Role-Based Dashboard Router
 * Renders the dedicated dashboard based on the authenticated user's exact role:
 * 1. DEVELOPER -> Developer Dashboard (Universal Super Admin)
 * 2. ADMIN / HOSPITAL_ADMIN -> Hospital Admin Dashboard (Facility-Scoped)
 * 3. STAFF -> Staff Dashboard (Daily Operations & Transfusion)
 * 4. DONOR -> Donor Dashboard (Personal History, Cooldown, Camps)
 * 5. PATIENT -> Patient Dashboard (Personal Requisitions, Status Tracking)
 */
const Dashboard = () => {
  const { user } = useAuth();
  const rawRole = user?.role || '';
  const role = String(rawRole).toUpperCase().trim();

  switch (role) {
    case 'DEVELOPER':
      return <DeveloperDashboard />;
    case 'ADMIN':
    case 'HOSPITAL_ADMIN':
      return <HospitalAdminDashboard />;
    case 'STAFF':
      return <StaffDashboard />;
    case 'DONOR':
      return <DonorDashboard />;
    case 'PATIENT':
      return <PatientDashboard />;
    default:
      return <PatientDashboard />;
  }
};

export default Dashboard;
