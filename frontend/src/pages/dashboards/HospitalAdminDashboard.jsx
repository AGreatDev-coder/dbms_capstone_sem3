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
  Building,
  Users,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  FileText,
  UserCheck
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

const HospitalAdminDashboard = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [charts, setCharts] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [expiringUnits, setExpiringUnits] = useState([]);
  const [requests, setRequests] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [donors, setDonors] = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active section tabs
  const [activeTab, setActiveTab] = useState('overview');

  // Modals & form state
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [newStaffForm, setNewStaffForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    job_title: 'Clinical Specialist',
    department: 'Transfusion Medicine',
    system_role: 'STAFF',
    date_of_birth: '1985-06-15',
    gender: 'MALE',
  });
  const [staffFormFeedback, setStaffFormFeedback] = useState(null);
  const [staffSubmitting, setStaffSubmitting] = useState(false);

  // Request status update / confirmation state
  const [confirmStatusAction, setConfirmStatusAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchHospitalAdminData();
  }, [user]);

  const fetchHospitalAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [mRes, cRes, invRes, expRes, reqRes, staffRes, donorRes, donRes] = await Promise.allSettled([
        api.get('/dashboard/metrics'),
        api.get('/dashboard/charts'),
        api.get('/blood-bank/inventory'),
        api.get('/blood-bank/expiring-soon'),
        api.get('/blood-requests'),
        api.get('/hospitals/staff-hierarchy'),
        api.get('/donors'),
        api.get('/blood-bank/donations'),
      ]);

      if (mRes.status === 'fulfilled' && mRes.value.data?.success) {
        setMetrics(mRes.value.data.metrics);
      }
      if (cRes.status === 'fulfilled' && cRes.value.data?.success) {
        setCharts(cRes.value.data);
      }
      if (invRes.status === 'fulfilled' && invRes.value.data?.success) {
        setInventory(invRes.value.data.inventory || invRes.value.data.units || []);
      }
      if (expRes.status === 'fulfilled' && expRes.value.data?.success) {
        setExpiringUnits(expRes.value.data.expiringUnits || expRes.value.data.units || []);
      }
      if (reqRes.status === 'fulfilled' && reqRes.value.data?.success) {
        setRequests(reqRes.value.data.requests || []);
      }
      if (staffRes.status === 'fulfilled' && staffRes.value.data?.success) {
        setStaffList(staffRes.value.data.staff || staffRes.value.data.rows || []);
      }
      if (donorRes.status === 'fulfilled' && donorRes.value.data?.success) {
        setDonors(donorRes.value.data.donors || []);
      }
      if (donRes.status === 'fulfilled' && donRes.value.data?.success) {
        setDonations(donRes.value.data.donations || []);
      }
    } catch (err) {
      console.error('Hospital admin data load error:', err);
      setError('Failed to load facility administration data.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId, status) => {
    try {
      setActionLoading(true);
      await api.put(`/blood-requests/${requestId}/status`, { status });
      // Refresh local requests
      setRequests((prev) =>
        prev.map((r) => (r.request_id === requestId ? { ...r, request_status: status } : r))
      );
      setConfirmStatusAction(null);
    } catch (err) {
      console.error('Status update failed:', err);
      alert(err.response?.data?.message || 'Failed to update request status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddStaffSubmit = async (e) => {
    e.preventDefault();
    try {
      setStaffSubmitting(true);
      setStaffFormFeedback(null);
      const res = await api.post('/hospitals/staff', newStaffForm);
      if (res.data?.success) {
        setStaffFormFeedback({ type: 'success', message: 'Staff member added successfully!' });
        setIsAddStaffModalOpen(false);
        // Refresh staff
        const staffRes = await api.get('/hospitals/staff-hierarchy');
        if (staffRes.data?.success) {
          setStaffList(staffRes.data.staff || staffRes.data.rows || []);
        }
      }
    } catch (err) {
      setStaffFormFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to register hospital staff member.',
      });
    } finally {
      setStaffSubmitting(false);
    }
  };

  // Compute Request Status Counts
  const pendingRequests = requests.filter(
    (r) => r.request_status === 'PENDING' || r.request_status === 'PARTIALLY_FULFILLED'
  );
  const approvedRequests = requests.filter((r) => r.request_status === 'APPROVED');
  const rejectedRequests = requests.filter((r) => r.request_status === 'REJECTED');
  const completedRequests = requests.filter(
    (r) => r.request_status === 'FULFILLED' || r.request_status === 'COMPLETED'
  );

  // Group inventory by blood group
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const inventoryByGroup = bloodGroups.map((bg) => {
    const units = inventory.filter(
      (u) => u.blood_group === bg && u.storage_status === 'AVAILABLE'
    );
    return {
      blood_group: bg,
      count: units.length,
      isLow: units.length < 3,
    };
  });

  const URGENCY_PALETTE = {
    CRITICAL: '#A4161A',
    HIGH: '#B7791F',
    MEDIUM: '#3C4A57',
    ROUTINE: '#6B675E',
  };

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <PageHeader
        breadcrumb={`Role: Hospital Administrator • ${user?.hospital_name || 'AIIMS Center'}`}
        title="Facility Operations & Resource Allocation"
        description="Supervising local blood reserve triage, incoming clinical requisitions, medical staff hierarchy, and voluntary donor rosters."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={fetchHospitalAdminData}
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Center
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddStaffModalOpen(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Register Staff
            </Button>
          </div>
        }
      />

      {/* Scope Indicator Banner */}
      <div className="p-3.5 border border-rule bg-surface rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blood" />
          <span className="text-muted">Hospital Admin Authority:</span>
          <span className="font-bold text-ink">{user?.hospital_name || 'Designated Facility'}</span>
          <span className="text-muted">/ Facility ID #{user?.hospital_id || 1}</span>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted px-2 py-0.5 border border-rule bg-paper rounded-[2px]">
          Scope Enforced: Hospital-Isolated
        </span>
      </div>

      <PageState loading={loading} error={error} onRetry={fetchHospitalAdminData}>
        {/* Navigation Tabs */}
        <Tabs
          tabs={[
            { id: 'overview', label: 'Facility Overview' },
            { id: 'inventory', label: `Blood Inventory (${inventory.length})` },
            { id: 'requests', label: `Blood Requisitions (${requests.length})` },
            { id: 'staff', label: `Medical Staff (${staffList.length})` },
            { id: 'donors', label: `Donor Network (${donors.length})` },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Overview Key Metrics Grid */}
            <section aria-label="Facility Key Performance Indicators">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="border border-rule bg-surface p-4 rounded-[2px]">
                  <Stat
                    label="Available Blood Bags"
                    value={metrics?.availableBloodUnits || inventory.filter((u) => u.storage_status === 'AVAILABLE').length}
                    annotation="Cold-storage bags in local bank"
                  />
                </div>
                <div className="border border-rule bg-surface p-4 rounded-[2px]">
                  <Stat
                    label="Hospital Staff"
                    value={metrics?.totalStaff || staffList.length || 6}
                    annotation="Active attending medical personnel"
                  />
                </div>
                <div className="border border-rule bg-surface p-4 rounded-[2px]">
                  <Stat
                    label="Admitted Inpatients"
                    value={metrics?.totalPatients || 400}
                    annotation="Patients in facility wards"
                  />
                </div>
                <div className="border border-rule bg-surface p-4 rounded-[2px]">
                  <Stat
                    label="Expiring <= 7 Days"
                    value={metrics?.expiringBloodUnits || expiringUnits.length || 0}
                    annotation="Immediate clinical alert"
                    alert={(metrics?.expiringBloodUnits || expiringUnits.length) > 0}
                  />
                </div>
              </div>

              {/* Blood Requests Status Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                <div className="border border-rule bg-surface p-4 rounded-[2px]">
                  <Stat
                    label="Pending Requests"
                    value={pendingRequests.length}
                    annotation="Awaiting review / triage"
                    alert={pendingRequests.length > 0}
                  />
                </div>
                <div className="border border-rule bg-surface p-4 rounded-[2px]">
                  <Stat
                    label="Approved Requests"
                    value={approvedRequests.length}
                    annotation="Awaiting bag allocation"
                  />
                </div>
                <div className="border border-rule bg-surface p-4 rounded-[2px]">
                  <Stat
                    label="Rejected Requests"
                    value={rejectedRequests.length}
                    annotation="Ineligible or canceled"
                  />
                </div>
                <div className="border border-rule bg-surface p-4 rounded-[2px]">
                  <Stat
                    label="Fulfilled Requests"
                    value={completedRequests.length}
                    annotation="Transfusion dispatched"
                  />
                </div>
              </div>
            </section>

            {/* Low-Stock Phenotype Alerts */}
            {inventoryByGroup.some((g) => g.isLow) && (
              <div className="p-4 border border-ochre/40 bg-ochre/10 rounded-[2px] space-y-2">
                <div className="flex items-center gap-2 font-mono text-xs font-semibold text-ochre">
                  <AlertTriangle className="w-4 h-4 text-ochre" />
                  <span>Clinical Alert: Low-Stock Reserves Detected in Facility Blood Bank</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
                  {inventoryByGroup
                    .filter((g) => g.isLow)
                    .map((g) => (
                      <span
                        key={g.blood_group}
                        className="px-2 py-0.5 bg-surface border border-ochre/40 text-ink rounded-[2px]"
                      >
                        <strong className="text-blood">{g.blood_group}:</strong> {g.count} bags remaining
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* Visual Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Blood Group Breakdown */}
              <section className="lg:col-span-8 border border-rule bg-surface p-5 rounded-[2px] space-y-4">
                <div className="flex items-baseline justify-between border-b border-rule pb-3">
                  <div>
                    <h3 className="font-serif text-base text-ink font-semibold">
                      Hospital Blood Reserve Distribution
                    </h3>
                    <p className="text-xs text-muted">
                      Available bags stored in facility refrigeration units
                    </p>
                  </div>
                  <span className="font-mono text-[11px] text-muted">Unit Counts</span>
                </div>

                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={inventoryByGroup}
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
                        dataKey="count"
                        name="Available Bags"
                        fill="#A4161A"
                        radius={[2, 2, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* Requisition Urgency */}
              <section className="lg:col-span-4 border border-rule bg-surface p-5 rounded-[2px] space-y-4">
                <div className="border-b border-rule pb-3">
                  <h3 className="font-serif text-base text-ink font-semibold">
                    Requisition Priority
                  </h3>
                  <p className="text-xs text-muted">
                    Clinical triage urgency classification
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

                <div className="space-y-1.5 font-mono text-xs border-t border-rule pt-2">
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
          </div>
        )}

        {/* TAB 2: BLOOD INVENTORY MANAGEMENT */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rule pb-3">
              <div>
                <h3 className="font-serif text-lg text-ink font-semibold">
                  Blood Unit Cold Storage Inventory
                </h3>
                <p className="text-xs text-muted">
                  Physical bags stored in this hospital's blood banking facility
                </p>
              </div>
              <Link to="/blood-bank">
                <Button variant="secondary" size="sm">
                  Full Blood Bank Ledger &rarr;
                </Button>
              </Link>
            </div>

            {/* Phenotype Stock Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {inventoryByGroup.map((item) => (
                <div
                  key={item.blood_group}
                  className={`p-3 border rounded-[2px] text-center ${
                    item.isLow
                      ? 'border-ochre/50 bg-ochre/10'
                      : 'border-rule bg-surface'
                  }`}
                >
                  <BloodGroupStamp bloodGroup={item.blood_group} size="md" />
                  <div className="mt-2 font-mono">
                    <span className="text-base font-bold text-ink">{item.count}</span>
                    <span className="text-[10px] text-muted block uppercase">Bags</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Inventory Units Table */}
            <div className="border border-rule rounded-[2px] bg-surface overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-paper border-b border-rule font-mono text-[11px] uppercase tracking-wider text-muted">
                    <th className="py-2.5 px-3">Unit ID</th>
                    <th className="py-2.5 px-3">Blood Phenotype</th>
                    <th className="py-2.5 px-3">Component Type</th>
                    <th className="py-2.5 px-3">Donation Date</th>
                    <th className="py-2.5 px-3">Expiry Date</th>
                    <th className="py-2.5 px-3">Storage Location</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule font-mono tabular-nums">
                  {inventory.slice(0, 15).map((unit) => (
                    <tr key={unit.unit_id} className="hover:bg-paper transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-ink">#{unit.unit_id}</td>
                      <td className="py-2.5 px-3">
                        <BloodGroupStamp bloodGroup={unit.blood_group} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 font-sans text-ink">{unit.component_type}</td>
                      <td className="py-2.5 px-3 text-muted text-[11px]">
                        {unit.donation_date ? String(unit.donation_date).slice(0, 10) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-[11px]">
                        <span className={unit.days_until_expiry <= 7 ? 'text-blood font-bold' : 'text-muted'}>
                          {unit.expiry_date ? String(unit.expiry_date).slice(0, 10) : '—'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-sans text-muted">{unit.storage_location || 'Freezer-A'}</td>
                      <td className="py-2.5 px-3 text-right">
                        <StatusDot status={unit.storage_status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: BLOOD REQUISITIONS */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rule pb-3">
              <div>
                <h3 className="font-serif text-lg text-ink font-semibold">
                  Hospital Blood Requisition Triage
                </h3>
                <p className="text-xs text-muted">
                  Inpatient transfusion orders requiring clinical approval and bag allocation
                </p>
              </div>
              <Link to="/blood-requests">
                <Button variant="secondary" size="sm">
                  Open Requisition Queue &rarr;
                </Button>
              </Link>
            </div>

            <div className="border border-rule rounded-[2px] bg-surface overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-paper border-b border-rule font-mono text-[11px] uppercase tracking-wider text-muted">
                    <th className="py-2.5 px-3">Req ID</th>
                    <th className="py-2.5 px-3">Patient Name</th>
                    <th className="py-2.5 px-3">Blood Group</th>
                    <th className="py-2.5 px-3">Units Req.</th>
                    <th className="py-2.5 px-3">Urgency</th>
                    <th className="py-2.5 px-3">Required By</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule font-mono tabular-nums">
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-6 text-center text-muted font-sans">
                        No blood requests found for this hospital.
                      </td>
                    </tr>
                  ) : (
                    requests.map((r) => (
                      <tr key={r.request_id} className="hover:bg-paper transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-ink">#{r.request_id}</td>
                        <td className="py-2.5 px-3 font-sans text-ink font-medium">{r.patient_name || 'Inpatient'}</td>
                        <td className="py-2.5 px-3">
                          <BloodGroupStamp bloodGroup={r.blood_group} size="sm" />
                        </td>
                        <td className="py-2.5 px-3 text-ink font-semibold">{r.units_required}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-1.5 py-0.5 text-[10px] rounded-[2px] font-bold uppercase ${
                              r.urgency_level === 'CRITICAL'
                                ? 'bg-blood/10 text-blood border border-blood/30'
                                : r.urgency_level === 'HIGH'
                                ? 'bg-ochre/10 text-ochre border border-ochre/30'
                                : 'bg-slate/10 text-slate border border-slate/30'
                            }`}
                          >
                            {r.urgency_level}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-muted text-[11px]">
                          {r.required_by_date ? String(r.required_by_date).slice(0, 16) : '—'}
                        </td>
                        <td className="py-2.5 px-3">
                          <StatusDot status={r.request_status} />
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {r.request_status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() =>
                                  setConfirmStatusAction({
                                    requestId: r.request_id,
                                    action: 'APPROVE',
                                    targetStatus: 'APPROVED',
                                    patientName: r.patient_name,
                                  })
                                }
                                className="px-2 py-0.5 bg-moss text-paper hover:bg-moss/90 rounded-[2px] text-[10px] font-medium"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  setConfirmStatusAction({
                                    requestId: r.request_id,
                                    action: 'REJECT',
                                    targetStatus: 'REJECTED',
                                    patientName: r.patient_name,
                                  })
                                }
                                className="px-2 py-0.5 bg-paper text-blood border border-blood/40 hover:bg-blood/5 rounded-[2px] text-[10px] font-medium"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted font-sans">Processed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Action Confirmation Modal */}
            {confirmStatusAction && (
              <Modal
                isOpen={!!confirmStatusAction}
                onClose={() => setConfirmStatusAction(null)}
                title={`Confirm Action: ${confirmStatusAction.action} Request`}
              >
                <div className="space-y-4 text-xs font-mono">
                  <p className="text-muted font-sans">
                    Are you sure you want to mark Blood Request #{confirmStatusAction.requestId} for{' '}
                    <strong className="text-ink">{confirmStatusAction.patientName || 'Patient'}</strong> as{' '}
                    <span className="font-bold text-ink">{confirmStatusAction.targetStatus}</span>?
                  </p>

                  <div className="flex justify-end gap-2 pt-2 border-t border-rule font-sans">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setConfirmStatusAction(null)}
                      disabled={actionLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        handleUpdateStatus(
                          confirmStatusAction.requestId,
                          confirmStatusAction.targetStatus
                        )
                      }
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Updating...' : `Confirm ${confirmStatusAction.action}`}
                    </Button>
                  </div>
                </div>
              </Modal>
            )}
          </div>
        )}

        {/* TAB 4: MEDICAL STAFF MANAGEMENT */}
        {activeTab === 'staff' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rule pb-3">
              <div>
                <h3 className="font-serif text-lg text-ink font-semibold">
                  Hospital Medical Staff Directory
                </h3>
                <p className="text-xs text-muted">
                  Supervising physicians, transfusion specialists, and clinical ward personnel
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddStaffModalOpen(true)}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Staff Member
              </Button>
            </div>

            <div className="border border-rule rounded-[2px] bg-surface overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-paper border-b border-rule font-mono text-[11px] uppercase tracking-wider text-muted">
                    <th className="py-2.5 px-3">Staff ID</th>
                    <th className="py-2.5 px-3">Physician / Specialist</th>
                    <th className="py-2.5 px-3">Job Title</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Supervisor</th>
                    <th className="py-2.5 px-3">Contact</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule font-mono tabular-nums">
                  {staffList.map((s) => (
                    <tr key={s.staff_id} className="hover:bg-paper transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-ink">#{s.staff_id}</td>
                      <td className="py-2.5 px-3 font-sans text-ink font-medium">
                        {s.name || s.staff_name || `${s.first_name || ''} ${s.last_name || ''}`}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-muted">{s.job_title}</td>
                      <td className="py-2.5 px-3 font-sans text-ink">{s.department}</td>
                      <td className="py-2.5 px-3 font-sans text-muted">{s.supervisor_name || 'Chief Medical Officer'}</td>
                      <td className="py-2.5 px-3 text-muted text-[11px]">{s.email || s.phone || '—'}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold bg-moss/10 text-moss border border-moss/30">
                          ACTIVE
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add Staff Modal */}
            {isAddStaffModalOpen && (
              <Modal
                isOpen={isAddStaffModalOpen}
                onClose={() => setIsAddStaffModalOpen(false)}
                title="Register New Hospital Staff"
              >
                <form onSubmit={handleAddStaffSubmit} className="space-y-4 text-xs font-sans">
                  {staffFormFeedback && (
                    <div
                      className={`p-2.5 rounded-[2px] font-mono text-xs ${
                        staffFormFeedback.type === 'success'
                          ? 'bg-moss/10 text-moss border border-moss/30'
                          : 'bg-blood/10 text-blood border border-blood/30'
                      }`}
                    >
                      {staffFormFeedback.message}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-muted font-mono text-[10px] uppercase mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newStaffForm.first_name}
                        onChange={(e) =>
                          setNewStaffForm({ ...newStaffForm, first_name: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 border border-rule rounded-[2px] bg-paper text-ink font-mono text-xs focus:outline-none focus:border-blood"
                        placeholder="e.g. Ananya"
                      />
                    </div>
                    <div>
                      <label className="block text-muted font-mono text-[10px] uppercase mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newStaffForm.last_name}
                        onChange={(e) =>
                          setNewStaffForm({ ...newStaffForm, last_name: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 border border-rule rounded-[2px] bg-paper text-ink font-mono text-xs focus:outline-none focus:border-blood"
                        placeholder="e.g. Verma"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-muted font-mono text-[10px] uppercase mb-1">
                        Work Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={newStaffForm.email}
                        onChange={(e) =>
                          setNewStaffForm({ ...newStaffForm, email: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 border border-rule rounded-[2px] bg-paper text-ink font-mono text-xs focus:outline-none focus:border-blood"
                        placeholder="verma@hospital.org"
                      />
                    </div>
                    <div>
                      <label className="block text-muted font-mono text-[10px] uppercase mb-1">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        value={newStaffForm.phone}
                        onChange={(e) =>
                          setNewStaffForm({ ...newStaffForm, phone: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 border border-rule rounded-[2px] bg-paper text-ink font-mono text-xs focus:outline-none focus:border-blood"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-muted font-mono text-[10px] uppercase mb-1">
                        Job Title
                      </label>
                      <input
                        type="text"
                        value={newStaffForm.job_title}
                        onChange={(e) =>
                          setNewStaffForm({ ...newStaffForm, job_title: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 border border-rule rounded-[2px] bg-paper text-ink font-mono text-xs focus:outline-none focus:border-blood"
                      />
                    </div>
                    <div>
                      <label className="block text-muted font-mono text-[10px] uppercase mb-1">
                        Department
                      </label>
                      <input
                        type="text"
                        value={newStaffForm.department}
                        onChange={(e) =>
                          setNewStaffForm({ ...newStaffForm, department: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 border border-rule rounded-[2px] bg-paper text-ink font-mono text-xs focus:outline-none focus:border-blood"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-rule font-sans">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsAddStaffModalOpen(false)}
                      disabled={staffSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      type="submit"
                      disabled={staffSubmitting}
                    >
                      {staffSubmitting ? 'Registering...' : 'Register Staff'}
                    </Button>
                  </div>
                </form>
              </Modal>
            )}
          </div>
        )}

        {/* TAB 5: DONOR NETWORK */}
        {activeTab === 'donors' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rule pb-3">
              <div>
                <h3 className="font-serif text-lg text-ink font-semibold">
                  Hospital-Associated Donor Roster
                </h3>
                <p className="text-xs text-muted">
                  Registered voluntary donors available for emergency mobilization
                </p>
              </div>
              <Link to="/donors">
                <Button variant="secondary" size="sm">
                  Full Donor Registry &rarr;
                </Button>
              </Link>
            </div>

            <div className="border border-rule rounded-[2px] bg-surface overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-paper border-b border-rule font-mono text-[11px] uppercase tracking-wider text-muted">
                    <th className="py-2.5 px-3">Donor ID</th>
                    <th className="py-2.5 px-3">Donor Name</th>
                    <th className="py-2.5 px-3">Blood Group</th>
                    <th className="py-2.5 px-3">City</th>
                    <th className="py-2.5 px-3">Total Donations</th>
                    <th className="py-2.5 px-3">Last Donated</th>
                    <th className="py-2.5 px-3 text-right">Availability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule font-mono tabular-nums">
                  {donors.map((d) => (
                    <tr key={d.donor_id} className="hover:bg-paper transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-ink">#{d.donor_id}</td>
                      <td className="py-2.5 px-3 font-sans text-ink font-medium">
                        {d.name || `${d.first_name || ''} ${d.last_name || ''}`}
                      </td>
                      <td className="py-2.5 px-3">
                        <BloodGroupStamp bloodGroup={d.blood_group} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 font-sans text-muted">{d.city || 'Delhi'}</td>
                      <td className="py-2.5 px-3 text-ink font-semibold">{d.donation_count || 1}</td>
                      <td className="py-2.5 px-3 text-muted text-[11px]">
                        {d.last_donation_date ? String(d.last_donation_date).slice(0, 10) : '2026-09-12'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold border uppercase ${
                            d.availability_status === 'AVAILABLE'
                              ? 'bg-moss/10 text-moss border-moss/30'
                              : 'bg-ochre/10 text-ochre border-ochre/30'
                          }`}
                        >
                          {d.availability_status || 'AVAILABLE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </PageState>
    </div>
  );
};

export default HospitalAdminDashboard;

