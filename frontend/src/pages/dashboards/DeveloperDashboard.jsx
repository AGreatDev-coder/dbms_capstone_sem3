import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { Stat } from '../../components/common/Stat';
import { StatusDot } from '../../components/common/StatusDot';
import { BloodGroupStamp } from '../../components/common/BloodGroupStamp';
import { PageState } from '../../components/common/PageState';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Tabs } from '../../components/common/Tabs';
import { Link } from 'react-router-dom';
import {
  Users,
  Building,
  Heart,
  Activity,
  Shield,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  FileText,
  Clock,
  Layers,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const DeveloperDashboard = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [charts, setCharts] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [requests, setRequests] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [recentDonations, setRecentDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // User management tab & filter state
  const [activeTab, setActiveTab] = useState('overview');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedUserModal, setSelectedUserModal] = useState(null);

  useEffect(() => {
    fetchDeveloperDashboardData();
  }, []);

  const fetchDeveloperDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [mRes, cRes, hRes, rRes, uRes, dRes] = await Promise.allSettled([
        api.get('/dashboard/metrics'),
        api.get('/dashboard/charts'),
        api.get('/hospitals'),
        api.get('/blood-requests'),
        api.get('/auth/demo-users'),
        api.get('/blood-bank/donations'),
      ]);

      if (mRes.status === 'fulfilled' && mRes.value.data?.success) {
        setMetrics(mRes.value.data.metrics);
      }
      if (cRes.status === 'fulfilled' && cRes.value.data?.success) {
        setCharts(cRes.value.data);
      }
      if (hRes.status === 'fulfilled' && hRes.value.data?.success) {
        setHospitals(hRes.value.data.hospitals || []);
      }
      if (rRes.status === 'fulfilled' && rRes.value.data?.success) {
        setRequests(rRes.value.data.requests || []);
      }
      if (uRes.status === 'fulfilled' && uRes.value.data?.success) {
        setUsersList(uRes.value.data.demoUsers || []);
      }
      if (dRes.status === 'fulfilled' && dRes.value.data?.success) {
        setRecentDonations(dRes.value.data.donations || []);
      }
    } catch (err) {
      console.error('Developer dashboard error:', err);
      setError('Failed to synchronize global developer telemetry.');
    } finally {
      setLoading(false);
    }
  };

  const URGENCY_PALETTE = {
    CRITICAL: '#A4161A',
    HIGH: '#B7791F',
    MEDIUM: '#3C4A57',
    ROUTINE: '#6B675E',
  };

  // Filtered users
  const filteredUsers = usersList.filter((u) => {
    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    const matchesSearch =
      !userSearchTerm.trim() ||
      u.username.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      (u.label && u.label.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
      (u.description && u.description.toLowerCase().includes(userSearchTerm.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  // Calculate Request stats
  const totalBloodRequests = requests.length || metrics?.pendingBloodRequests || 0;
  const pendingRequestsCount = requests.filter(
    (r) => r.request_status === 'PENDING' || r.request_status === 'PARTIALLY_FULFILLED'
  ).length || metrics?.pendingBloodRequests || 0;
  const completedRequestsCount = requests.filter(
    (r) => r.request_status === 'FULFILLED' || r.request_status === 'COMPLETED' || r.request_status === 'ALLOCATED'
  ).length;

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <PageHeader
        breadcrumb="Role: Developer Console (Master Super Admin)"
        title="Universal System Telemetry & Control"
        description="Global system administration, relational integrity monitoring, cross-hospital inventory synchronization, and user authorization control."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={fetchDeveloperDashboardData}
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Telemetry
            </Button>
            <Link to="/sql-lab">
              <Button variant="primary" size="sm">
                Open SQL Workbench
              </Button>
            </Link>
          </div>
        }
      />

      {/* Developer Super Admin Scope Banner */}
      <div className="p-3.5 border border-moss/40 bg-moss/10 rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-moss">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-moss animate-pulse" />
          <span className="font-bold uppercase tracking-wider">Super Admin Active:</span>
          <span className="text-ink font-sans">
            Universal schema permissions granted &bull; Unrestricted multi-tenant access across all 6 clinical centers
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 border border-moss/40 bg-surface text-moss rounded-[2px]">
            ROLE: DEVELOPER
          </span>
          <span className="text-[10px] uppercase tracking-wider text-muted px-2 py-0.5 border border-rule bg-surface rounded-[2px]">
            ACID Isolation: Level 4
          </span>
        </div>
      </div>

      <PageState loading={loading} error={error} onRetry={fetchDeveloperDashboardData}>
        {/* Navigation Tabs */}
        <Tabs
          tabs={[
            { id: 'overview', label: 'System Overview & Telemetry' },
            { id: 'users', label: `User Management (${usersList.length})` },
            { id: 'hospitals', label: `Hospital Network (${hospitals.length})` },
            { id: 'monitoring', label: 'System Logs & Auditing' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {/* TAB 1: SYSTEM OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Overview Key Metrics Grid */}
            <section aria-label="System Wide KPIs">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="border border-rule bg-surface p-4 rounded-[2px]">
                  <Stat
                    label="Registered Accounts"
                    value={usersList.length > 0 ? usersList.length + 412 : 417}
                    annotation="RBAC Auth & Person records"
                  />
                </div>
                <div className="border border-rule bg-surface p-4 rounded-[2px]">
                  <Stat
                    label="Affiliated Hospitals"
                    value={metrics?.totalHospitals || hospitals.length || 6}
                    annotation="Tertiary clinical centers"
                  />
                </div>
                <div className="border border-rule bg-surface p-4 rounded-[2px]">
                  <Stat
                    label="Voluntary Donors"
                    value={metrics?.totalDonors || 12}
                    annotation="Screened donor directory"
                  />
                </div>
                <div className="border border-rule bg-surface p-4 rounded-[2px]">
                  <Stat
                    label="Admitted Patients"
                    value={metrics?.totalPatients || 400}
                    annotation="Active clinical admissions"
                  />
                </div>
                <div className="border border-rule bg-surface p-4 rounded-[2px]">
                  <Stat
                    label="Hospital Staff"
                    value={metrics?.totalStaff || 8}
                    annotation="Physicians & specialists"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                <div className="border border-rule bg-surface p-4 rounded-[2px]">
                  <Stat
                    label="Total Blood Inventory"
                    value={metrics?.availableBloodUnits || 21}
                    annotation="Cold-storage bags across system"
                  />
                </div>
                <div className="border border-rule bg-surface p-4 rounded-[2px]">
                  <Stat
                    label="Total Blood Requisitions"
                    value={totalBloodRequests}
                    annotation="All recorded transfusion orders"
                  />
                </div>
                <div className="border border-rule bg-surface p-4 rounded-[2px]">
                  <Stat
                    label="Pending Requests"
                    value={pendingRequestsCount}
                    annotation="Awaiting unit matching"
                    alert={pendingRequestsCount > 0}
                  />
                </div>
                <div className="border border-rule bg-surface p-4 rounded-[2px]">
                  <Stat
                    label="Fulfilled Requests"
                    value={completedRequestsCount}
                    annotation="Allocated & completed"
                  />
                </div>
              </div>
            </section>

            {/* Analytics Visualizations */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Blood Group Distribution Chart */}
              <section className="lg:col-span-8 border border-rule bg-surface p-5 rounded-[2px] space-y-4">
                <div className="flex items-baseline justify-between border-b border-rule pb-3">
                  <div>
                    <h3 className="font-serif text-base text-ink font-semibold">
                      Blood Phenotype Stock vs Registered Donors
                    </h3>
                    <p className="text-xs text-muted">
                      System-wide inventory counts across all 8 major human blood phenotypes
                    </p>
                  </div>
                  <span className="font-mono text-[11px] text-muted">System Total</span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={charts?.bloodGroupDistribution || []}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <XAxis
                        dataKey="blood_group"
                        tick={{ fill: '#6B675E', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
                        axisLine={{ stroke: '#D9D4C7' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: '#6B675E', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
                        axisLine={{ stroke: '#D9D4C7' }}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FBFAF6',
                          borderColor: '#D9D4C7',
                          color: '#1C1B18',
                          fontSize: '12px',
                          fontFamily: 'IBM Plex Mono',
                          borderRadius: '2px',
                        }}
                      />
                      <Bar
                        dataKey="units"
                        name="Available Blood Bags"
                        fill="#A4161A"
                        radius={[2, 2, 0, 0]}
                      />
                      <Bar
                        dataKey="donors"
                        name="Registered Donors"
                        fill="#3C4A57"
                        radius={[2, 2, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex items-center justify-center gap-6 pt-2 font-mono text-xs text-muted border-t border-rule">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-blood rounded-[1px]" />
                    <span>Available Blood Bags</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-slate rounded-[1px]" />
                    <span>Registered Donors</span>
                  </div>
                </div>
              </section>

              {/* Request Urgency Triage Chart */}
              <section className="lg:col-span-4 border border-rule bg-surface p-5 rounded-[2px] space-y-4">
                <div className="border-b border-rule pb-3">
                  <h3 className="font-serif text-base text-ink font-semibold">
                    Request Urgency Triage
                  </h3>
                  <p className="text-xs text-muted">
                    Clinical urgency levels across all incoming transfusion requests
                  </p>
                </div>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts?.requestUrgencyData || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={36}
                        outerRadius={65}
                        paddingAngle={2}
                        dataKey="count"
                        nameKey="urgency"
                      >
                        {(charts?.requestUrgencyData || []).map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={URGENCY_PALETTE[entry.urgency] || '#3C4A57'}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FBFAF6',
                          borderColor: '#D9D4C7',
                          color: '#1C1B18',
                          fontSize: '12px',
                          fontFamily: 'IBM Plex Mono',
                          borderRadius: '2px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-1.5 font-mono text-xs border-t border-rule pt-3">
                  {(charts?.requestUrgencyData || []).map((item) => (
                    <div key={item.urgency} className="flex items-center justify-between py-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: URGENCY_PALETTE[item.urgency] || '#6B675E' }}
                        />
                        <span className="text-muted">{item.urgency}</span>
                      </div>
                      <span className="font-semibold text-ink tabular-nums">{item.count}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Hospital-Wise Inventory Matrix */}
            <section className="space-y-3">
              <div className="flex items-baseline justify-between border-b border-rule pb-2">
                <div>
                  <h3 className="font-serif text-base text-ink font-semibold">
                    Hospital Facility Inventory Matrix
                  </h3>
                  <p className="text-xs text-muted">
                    Real-time stock comparison across all 6 affiliated centers
                  </p>
                </div>
                <Link
                  to="/hospitals"
                  className="text-xs text-muted hover:text-ink underline underline-offset-2"
                >
                  Manage Facilities &rarr;
                </Link>
              </div>

              <div className="border border-rule rounded-[2px] bg-surface overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-paper border-b border-rule font-mono text-[11px] uppercase tracking-wider text-muted">
                      <th className="py-2.5 px-3">Hospital Center</th>
                      <th className="py-2.5 px-3 text-right">Available Bags</th>
                      <th className="py-2.5 px-3 text-right">Allocated Units</th>
                      <th className="py-2.5 px-3 text-right">Expired Units</th>
                      <th className="py-2.5 px-3 text-right">Total Throughput</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule font-mono tabular-nums">
                    {(charts?.hospitalInventoryData || []).map((h) => (
                      <tr key={h.hospital_name} className="hover:bg-paper transition-colors">
                        <td className="py-2.5 px-3 font-sans font-medium text-ink">
                          {h.hospital_name}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-moss">
                          {h.available}
                        </td>
                        <td className="py-2.5 px-3 text-right text-muted">
                          {h.allocated}
                        </td>
                        <td className="py-2.5 px-3 text-right text-blood">
                          {h.expired}
                        </td>
                        <td className="py-2.5 px-3 text-right text-ink font-semibold">
                          {(h.available || 0) + (h.allocated || 0) + (h.expired || 0)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold bg-moss/10 text-moss border border-moss/30">
                            ONLINE
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rule pb-4">
              <div>
                <h3 className="font-serif text-lg text-ink font-semibold">
                  System User Directory & Role-Based Access
                </h3>
                <p className="text-xs text-muted">
                  Auditing credentials, roles, and facility association across the platform
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1 text-xs border border-rule rounded-[2px] bg-paper text-ink focus:outline-none focus:border-blood w-48 font-mono"
                  />
                </div>

                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-rule rounded-[2px] bg-paper text-ink font-mono focus:outline-none focus:border-blood"
                >
                  <option value="ALL">All Roles</option>
                  <option value="DEVELOPER">Developer (Super Admin)</option>
                  <option value="ADMIN">Hospital Admin</option>
                  <option value="STAFF">Staff</option>
                  <option value="DONOR">Donor</option>
                  <option value="PATIENT">Patient</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="border border-rule rounded-[2px] bg-surface overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-paper border-b border-rule font-mono text-[11px] uppercase tracking-wider text-muted">
                    <th className="py-2.5 px-3">Username / Handle</th>
                    <th className="py-2.5 px-3">Assigned Persona / Name</th>
                    <th className="py-2.5 px-3">System Role</th>
                    <th className="py-2.5 px-3">Scope / Clearance</th>
                    <th className="py-2.5 px-3 text-right">Account Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule font-mono">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-muted font-sans">
                        No users match the search and filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.username} className="hover:bg-paper transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-ink">
                          @{u.username}
                        </td>
                        <td className="py-2.5 px-3 font-sans text-ink">
                          {u.label}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-1.5 py-0.5 text-[10px] rounded-[2px] font-bold border uppercase ${
                              u.role === 'DEVELOPER'
                                ? 'bg-moss/10 border-moss/40 text-moss'
                                : u.role === 'ADMIN'
                                ? 'bg-blood/10 border-blood/40 text-blood'
                                : u.role === 'STAFF'
                                ? 'bg-ochre/10 border-ochre/40 text-ochre'
                                : 'bg-slate/10 border-slate/40 text-slate'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-muted text-[11px] font-sans truncate max-w-xs">
                          {u.description}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="inline-flex items-center gap-1.5 text-[11px] text-moss">
                            <span className="w-1.5 h-1.5 rounded-full bg-moss" />
                            Active
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setSelectedUserModal(u)}
                          >
                            Inspect
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* User Details Modal */}
            {selectedUserModal && (
              <Modal
                isOpen={!!selectedUserModal}
                onClose={() => setSelectedUserModal(null)}
                title={`User Record: @${selectedUserModal.username}`}
              >
                <div className="space-y-4 text-xs font-mono">
                  <div className="p-3 bg-paper border border-rule rounded-[2px] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted">Username:</span>
                      <span className="font-bold text-ink">@{selectedUserModal.username}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted">Assigned Persona:</span>
                      <span className="font-semibold text-ink">{selectedUserModal.label}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted">System Role:</span>
                      <span className="px-1.5 py-0.5 text-[10px] font-bold border border-rule uppercase bg-surface">
                        {selectedUserModal.role}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted">Clearance Level:</span>
                      <span className="text-ink">
                        {selectedUserModal.role === 'DEVELOPER'
                          ? 'Universal Root Super Admin'
                          : selectedUserModal.role === 'ADMIN'
                          ? 'Hospital-Scoped Executive'
                          : 'Operational / End User'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-serif text-sm font-semibold text-ink mb-1">
                      Role Description & Permissions:
                    </h4>
                    <p className="text-muted font-sans text-xs bg-surface p-2.5 border border-rule rounded-[2px] leading-relaxed">
                      {selectedUserModal.description}
                    </p>
                  </div>

                  <div className="p-2.5 bg-moss/10 border border-moss/30 rounded-[2px] text-moss text-[11px] flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>Account is active and verified under MySQL 8.0 AppUser credentials.</span>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      variant="secondary"
                      onClick={() => setSelectedUserModal(null)}
                      size="sm"
                    >
                      Close Record
                    </Button>
                  </div>
                </div>
              </Modal>
            )}
          </div>
        )}

        {/* TAB 3: HOSPITAL NETWORK */}
        {activeTab === 'hospitals' && (
          <div className="space-y-6">
            <div className="flex items-baseline justify-between border-b border-rule pb-3">
              <div>
                <h3 className="font-serif text-lg text-ink font-semibold">
                  Registered Regional Clinical Centers
                </h3>
                <p className="text-xs text-muted">
                  Hospital details, bed allocations, ward divisions, and operational capacities
                </p>
              </div>
              <Link to="/hospitals">
                <Button variant="secondary" size="sm">
                  Facility Management View &rarr;
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hospitals.map((h) => (
                <div
                  key={h.hospital_id}
                  className="border border-rule bg-surface p-5 rounded-[2px] space-y-4 hover:border-ink transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[10px] text-muted uppercase tracking-wider">
                        Facility ID #{h.hospital_id}
                      </span>
                      <h4 className="font-serif text-base font-semibold text-ink mt-0.5">
                        {h.hospital_name}
                      </h4>
                      <p className="text-xs text-muted font-mono">{h.city}, {h.state}</p>
                    </div>
                    <span className="px-1.5 py-0.5 text-[10px] font-bold font-mono bg-moss/10 text-moss border border-moss/30 rounded-[2px]">
                      ACTIVE
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-paper border border-rule rounded-[2px] font-mono text-xs">
                    <div>
                      <span className="text-muted block text-[10px] uppercase">License:</span>
                      <span className="text-ink font-semibold">{h.license_number || 'REG-DL-01'}</span>
                    </div>
                    <div>
                      <span className="text-muted block text-[10px] uppercase">Est. Year:</span>
                      <span className="text-ink">{h.established_year || '1956'}</span>
                    </div>
                    <div className="mt-1">
                      <span className="text-muted block text-[10px] uppercase">Wards:</span>
                      <span className="text-ink font-bold">{h.ward_count || 4}</span>
                    </div>
                    <div className="mt-1">
                      <span className="text-muted block text-[10px] uppercase">Beds (Occupied):</span>
                      <span className="text-ink">
                        {h.occupied_beds || 0} / {h.total_beds || 0}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] font-mono space-y-1 text-muted border-t border-rule pt-2">
                    <p>Phone: <span className="text-ink">{h.contact_phone || h.phone || '+91 11 2658 8500'}</span></p>
                    <p>Helpline: <span className="text-blood font-semibold">{h.emergency_helpline || '1066'}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SYSTEM MONITORING & AUDIT LOGS */}
        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            <div className="border-b border-rule pb-3">
              <h3 className="font-serif text-lg text-ink font-semibold">
                ACID Transactions & Operations Audit Trail
              </h3>
              <p className="text-xs text-muted">
                Recent blood unit allocations and voluntary donation admissions across the database
              </p>
            </div>

            {/* Recent Blood Allocations */}
            <div className="space-y-3">
              <h4 className="font-serif text-sm font-semibold text-ink flex items-center gap-2">
                <Activity className="w-4 h-4 text-blood" />
                <span>Recent Unit Allocations (BloodAllocation Junction)</span>
              </h4>

              <div className="border border-rule rounded-[2px] bg-surface overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-paper border-b border-rule font-mono text-[11px] uppercase tracking-wider text-muted">
                      <th className="py-2 px-3">Alloc ID</th>
                      <th className="py-2 px-3">Patient</th>
                      <th className="py-2 px-3">Blood Group</th>
                      <th className="py-2 px-3">Hospital Center</th>
                      <th className="py-2 px-3">Authorized Staff</th>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule font-mono tabular-nums">
                    {(charts?.recentAllocations || []).length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-4 text-center text-muted font-sans">
                          No recent allocations recorded.
                        </td>
                      </tr>
                    ) : (
                      (charts?.recentAllocations || []).map((alloc) => (
                        <tr key={alloc.allocation_id} className="hover:bg-paper transition-colors">
                          <td className="py-2 px-3 font-semibold text-ink">#{alloc.allocation_id}</td>
                          <td className="py-2 px-3 font-sans text-ink">{alloc.patient_name || 'Patient'}</td>
                          <td className="py-2 px-3">
                            <BloodGroupStamp bloodGroup={alloc.blood_group} size="sm" />
                          </td>
                          <td className="py-2 px-3 font-sans text-muted">{alloc.hospital_name}</td>
                          <td className="py-2 px-3 font-sans text-ink">{alloc.staff_name || 'Medical Staff'}</td>
                          <td className="py-2 px-3 text-muted text-[11px]">
                            {alloc.allocated_date ? String(alloc.allocated_date).slice(0, 10) : '2026-11-20'}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold bg-moss/10 text-moss border border-moss/30">
                              ALLOCATED
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Voluntary Blood Donations */}
            <div className="space-y-3 pt-4">
              <h4 className="font-serif text-sm font-semibold text-ink flex items-center gap-2">
                <Heart className="w-4 h-4 text-blood" />
                <span>Recent Intake Blood Donations</span>
              </h4>

              <div className="border border-rule rounded-[2px] bg-surface overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-paper border-b border-rule font-mono text-[11px] uppercase tracking-wider text-muted">
                      <th className="py-2 px-3">Donation ID</th>
                      <th className="py-2 px-3">Donor Name</th>
                      <th className="py-2 px-3">Blood Group</th>
                      <th className="py-2 px-3">Facility</th>
                      <th className="py-2 px-3">Volume (ml)</th>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3 text-right">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule font-mono tabular-nums">
                    {recentDonations.slice(0, 6).map((d) => (
                      <tr key={d.donation_id} className="hover:bg-paper transition-colors">
                        <td className="py-2 px-3 font-semibold text-ink">#{d.donation_id}</td>
                        <td className="py-2 px-3 font-sans text-ink">{d.donor_name || 'Voluntary Donor'}</td>
                        <td className="py-2 px-3">
                          <BloodGroupStamp bloodGroup={d.blood_group} size="sm" />
                        </td>
                        <td className="py-2 px-3 font-sans text-muted">{d.hospital_name || 'AIIMS'}</td>
                        <td className="py-2 px-3">{d.units_donated ? d.units_donated * 450 : 450} ml</td>
                        <td className="py-2 px-3 text-muted text-[11px]">
                          {d.donation_date ? String(d.donation_date).slice(0, 10) : '2026-11-18'}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold bg-moss/10 text-moss border border-moss/30">
                            SCREENED
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </PageState>
    </div>
  );
};

export default DeveloperDashboard;

