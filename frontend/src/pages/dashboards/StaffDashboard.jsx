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
  Heart,
  Droplet,
  Layers,
  FileCheck
} from 'lucide-react';

const StaffDashboard = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [expiringUnits, setExpiringUnits] = useState([]);
  const [requests, setRequests] = useState([]);
  const [donors, setDonors] = useState([]);
  const [recentAllocations, setRecentAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tabs
  const [activeTab, setActiveTab] = useState('overview');

  // Inventory search & filter
  const [invSearchGroup, setInvSearchGroup] = useState('');
  const [invFilterStatus, setInvFilterStatus] = useState('ALL');

  // Donor search & filter
  const [donorSearchTerm, setDonorSearchTerm] = useState('');
  const [donorBloodGroupFilter, setDonorBloodGroupFilter] = useState('');

  // Quick Allocate Modal State
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [allocating, setAllocating] = useState(false);
  const [allocFeedback, setAllocFeedback] = useState(null);

  // Log Donation Modal State
  const [isLogDonationModalOpen, setIsLogDonationModalOpen] = useState(false);
  const [newDonationForm, setNewDonationForm] = useState({
    donor_id: '',
    blood_group: 'O+',
    component_type: 'WHOLE_BLOOD',
    units_donated: 1,
    hemoglobin_level: 13.5,
    pulse_rate: 76,
    blood_pressure: '120/80',
    notes: 'Standard healthy voluntary donation intake.',
  });
  const [donationSubmitting, setDonationSubmitting] = useState(false);
  const [donationFeedback, setDonationFeedback] = useState(null);

  // Unit Status Update State
  const [isUpdateUnitModalOpen, setIsUpdateUnitModalOpen] = useState(false);
  const [selectedUnitForUpdate, setSelectedUnitForUpdate] = useState(null);
  const [newUnitStatus, setNewUnitStatus] = useState('AVAILABLE');
  const [updatingUnit, setUpdatingUnit] = useState(false);

  useEffect(() => {
    fetchStaffDashboardData();
  }, [user]);

  const fetchStaffDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [mRes, cRes, invRes, expRes, reqRes, donRes] = await Promise.allSettled([
        api.get('/dashboard/metrics'),
        api.get('/dashboard/charts'),
        api.get('/blood-bank/inventory'),
        api.get('/blood-bank/expiring-soon'),
        api.get('/blood-requests'),
        api.get('/donors'),
      ]);

      if (mRes.status === 'fulfilled' && mRes.value.data?.success) {
        setMetrics(mRes.value.data.metrics);
      }
      if (cRes.status === 'fulfilled' && cRes.value.data?.success) {
        setRecentAllocations(cRes.value.data.recentAllocations || []);
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
      if (donRes.status === 'fulfilled' && donRes.value.data?.success) {
        setDonors(donRes.value.data.donors || []);
      }
    } catch (err) {
      console.error('Staff dashboard loading error:', err);
      setError('Failed to load operational staff telemetry.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Quick Blood Unit Allocation
  const handleAllocateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequest || !selectedUnitId) return;

    try {
      setAllocating(true);
      setAllocFeedback(null);
      const res = await api.post(`/blood-requests/${selectedRequest.request_id}/allocate`, {
        unit_id: parseInt(selectedUnitId, 10),
        notes: `Unit allocated by staff ${user?.username || 'member'}.`,
      });

      if (res.data?.success) {
        setAllocFeedback({ type: 'success', message: 'Blood unit allocated successfully!' });
        setTimeout(() => {
          setIsAllocateModalOpen(false);
          fetchStaffDashboardData();
        }, 1200);
      }
    } catch (err) {
      setAllocFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to allocate blood unit.',
      });
    } finally {
      setAllocating(false);
    }
  };

  // Handle Log Donation
  const handleLogDonationSubmit = async (e) => {
    e.preventDefault();
    try {
      setDonationSubmitting(true);
      setDonationFeedback(null);
      const res = await api.post('/blood-bank/donations', newDonationForm);
      if (res.data?.success) {
        setDonationFeedback({ type: 'success', message: 'Donation intake recorded successfully!' });
        setTimeout(() => {
          setIsLogDonationModalOpen(false);
          fetchStaffDashboardData();
        }, 1200);
      }
    } catch (err) {
      setDonationFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to record donation intake.',
      });
    } finally {
      setDonationSubmitting(false);
    }
  };

  // Handle Update Unit Status
  const handleUpdateUnitStatus = async () => {
    if (!selectedUnitForUpdate) return;
    try {
      setUpdatingUnit(true);
      const res = await api.put(`/blood-bank/inventory/${selectedUnitForUpdate.unit_id}/status`, {
        storage_status: newUnitStatus,
      });
      if (res.data?.success) {
        setIsUpdateUnitModalOpen(false);
        fetchStaffDashboardData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update unit storage status.');
    } finally {
      setUpdatingUnit(false);
    }
  };

  // Filtered Inventory
  const filteredInventory = inventory.filter((u) => {
    const matchesGroup = !invSearchGroup || u.blood_group === invSearchGroup;
    const matchesStatus = invFilterStatus === 'ALL' || u.storage_status === invFilterStatus;
    return matchesGroup && matchesStatus;
  });

  // Filtered Donors
  const filteredDonors = donors.filter((d) => {
    const matchesSearch =
      !donorSearchTerm.trim() ||
      (d.name && d.name.toLowerCase().includes(donorSearchTerm.toLowerCase())) ||
      (d.phone && d.phone.includes(donorSearchTerm)) ||
      (d.city && d.city.toLowerCase().includes(donorSearchTerm.toLowerCase()));
    const matchesGroup = !donorBloodGroupFilter || d.blood_group === donorBloodGroupFilter;
    return matchesSearch && matchesGroup;
  });

  // Status Counts
  const pendingRequests = requests.filter(
    (r) => r.request_status === 'PENDING' || r.request_status === 'PARTIALLY_FULFILLED'
  );
  const approvedRequests = requests.filter((r) => r.request_status === 'APPROVED');
  const completedRequests = requests.filter(
    (r) => r.request_status === 'FULFILLED' || r.request_status === 'COMPLETED'
  );

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const availableInventory = inventory.filter((u) => u.storage_status === 'AVAILABLE');

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <PageHeader
        breadcrumb={`Role: Hospital Medical Staff • ${user?.hospital_name || 'Assigned Center'}`}
        title="Daily Hospital Operations & Transfusion Triage"
        description="Shift operational workbench for inspecting refrigerated blood units, processing urgent transfusion requests, and intake screening."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={fetchStaffDashboardData}
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Shift
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsLogDonationModalOpen(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Log Blood Donation
            </Button>
          </div>
        }
      />

      {/* Scope Indicator Banner */}
      <div className="p-3.5 border border-rule bg-surface rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blood" />
          <span className="text-muted">Staff Duty Station:</span>
          <span className="font-bold text-ink">{user?.hospital_name || 'Hospital Center'}</span>
          <span className="text-muted">({user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username})</span>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted px-2 py-0.5 border border-rule bg-paper rounded-[2px]">
          Operational Clearance: Transfusion & Lab Access
        </span>
      </div>

      <PageState loading={loading} error={error} onRetry={fetchStaffDashboardData}>
        {/* Navigation Tabs */}
        <Tabs
          tabs={[
            { id: 'overview', label: 'Shift Overview' },
            { id: 'requests', label: `Requisitions Queue (${requests.length})` },
            { id: 'inventory', label: `Blood Stock (${inventory.length})` },
            { id: 'donors', label: `Donor Directory (${donors.length})` },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {/* TAB 1: SHIFT OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Shift Metrics Grid */}
            <section aria-label="Shift Key Performance Indicators">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="border border-rule bg-surface p-4 rounded-[2px]">
                  <Stat
                    label="Today's Requests"
                    value={requests.length}
                    annotation="All shift orders"
                  />
                </div>
                <div className="border border-rule bg-surface p-4 rounded-[2px]">
                  <Stat
                    label="Pending Triage"
                    value={pendingRequests.length}
                    annotation="Awaiting action"
                    alert={pendingRequests.length > 0}
                  />
                </div>
                <div className="border border-rule bg-surface p-4 rounded-[2px]">
                  <Stat
                    label="Approved Orders"
                    value={approvedRequests.length}
                    annotation="Ready for unit match"
                  />
                </div>
                <div className="border border-rule bg-surface p-4 rounded-[2px]">
                  <Stat
                    label="Completed Orders"
                    value={completedRequests.length}
                    annotation="Transfusion dispatched"
                  />
                </div>
                <div className="border border-rule bg-surface p-4 rounded-[2px]">
                  <Stat
                    label="Available Bags"
                    value={availableInventory.length}
                    annotation="In refrigeration"
                  />
                </div>
                <div className="border border-rule bg-surface p-4 rounded-[2px]">
                  <Stat
                    label="Shelf Life Alert"
                    value={expiringUnits.length}
                    annotation="Expires <= 7 days"
                    alert={expiringUnits.length > 0}
                  />
                </div>
              </div>
            </section>

            {/* Low-Stock Warning if any group < 3 */}
            {bloodGroups.some(
              (bg) => availableInventory.filter((u) => u.blood_group === bg).length < 3
            ) && (
              <div className="p-4 border border-ochre/40 bg-ochre/10 rounded-[2px] space-y-2">
                <div className="flex items-center gap-2 font-mono text-xs font-semibold text-ochre">
                  <AlertTriangle className="w-4 h-4 text-ochre" />
                  <span>Immediate Clinical Notice: Critical Low Reserves in Blood Bank</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
                  {bloodGroups
                    .filter(
                      (bg) =>
                        availableInventory.filter((u) => u.blood_group === bg).length < 3
                    )
                    .map((bg) => (
                      <span
                        key={bg}
                        className="px-2 py-0.5 bg-surface border border-ochre/40 text-ink rounded-[2px]"
                      >
                        <strong className="text-blood">{bg}:</strong>{' '}
                        {availableInventory.filter((u) => u.blood_group === bg).length} bags
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* Urgent Priority Transfusion Queue */}
            <div className="space-y-3">
              <div className="flex items-baseline justify-between border-b border-rule pb-2">
                <div>
                  <h3 className="font-serif text-base text-ink font-semibold">
                    Urgent Clinical Requisitions Awaiting Allocation
                  </h3>
                  <p className="text-xs text-muted">
                    Prioritized by medical urgency and patient status
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('requests')}
                  className="text-xs text-muted hover:text-ink underline underline-offset-2"
                >
                  View All Orders &rarr;
                </button>
              </div>

              <div className="border border-rule rounded-[2px] bg-surface overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-paper border-b border-rule font-mono text-[11px] uppercase tracking-wider text-muted">
                      <th className="py-2.5 px-3">Req ID</th>
                      <th className="py-2.5 px-3">Patient</th>
                      <th className="py-2.5 px-3">Blood Group</th>
                      <th className="py-2.5 px-3">Units Needed</th>
                      <th className="py-2.5 px-3">Urgency</th>
                      <th className="py-2.5 px-3">Clinical Indication</th>
                      <th className="py-2.5 px-3 text-right">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule font-mono tabular-nums">
                    {pendingRequests.slice(0, 5).map((r) => (
                      <tr key={r.request_id} className="hover:bg-paper transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-ink">#{r.request_id}</td>
                        <td className="py-2.5 px-3 font-sans text-ink font-medium">{r.patient_name || 'Patient'}</td>
                        <td className="py-2.5 px-3">
                          <BloodGroupStamp bloodGroup={r.blood_group} size="sm" />
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-ink">{r.units_required}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-1.5 py-0.5 text-[10px] rounded-[2px] font-bold uppercase ${
                              r.urgency_level === 'CRITICAL'
                                ? 'bg-blood/10 text-blood border border-blood/30'
                                : 'bg-ochre/10 text-ochre border border-ochre/30'
                            }`}
                          >
                            {r.urgency_level}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-sans text-muted truncate max-w-xs">
                          {r.clinical_indication || 'Urgent transfusion'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              setSelectedRequest(r);
                              setIsAllocateModalOpen(true);
                            }}
                          >
                            Match Unit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Unit Allocations Audit Trail */}
            <div className="space-y-3 pt-4">
              <div className="border-b border-rule pb-2">
                <h3 className="font-serif text-base text-ink font-semibold">
                  Recent Allocations Processed This Shift
                </h3>
                <p className="text-xs text-muted">
                  Audit trail recorded in BloodAllocation under ACID row locks
                </p>
              </div>

              <div className="border border-rule rounded-[2px] bg-surface overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-paper border-b border-rule font-mono text-[11px] uppercase tracking-wider text-muted">
                      <th className="py-2 px-3">Alloc ID</th>
                      <th className="py-2 px-3">Request ID</th>
                      <th className="py-2 px-3">Patient</th>
                      <th className="py-2 px-3">Blood Group</th>
                      <th className="py-2 px-3">Allocated Date</th>
                      <th className="py-2 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule font-mono tabular-nums">
                    {recentAllocations.slice(0, 5).map((a) => (
                      <tr key={a.allocation_id} className="hover:bg-paper transition-colors">
                        <td className="py-2 px-3 font-semibold text-ink">#{a.allocation_id}</td>
                        <td className="py-2 px-3 text-muted">Req #{a.request_id}</td>
                        <td className="py-2 px-3 font-sans text-ink">{a.patient_name || 'Patient'}</td>
                        <td className="py-2 px-3">
                          <BloodGroupStamp bloodGroup={a.blood_group} size="sm" />
                        </td>
                        <td className="py-2 px-3 text-muted text-[11px]">
                          {a.allocated_date ? String(a.allocated_date).slice(0, 16) : '—'}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold bg-moss/10 text-moss border border-moss/30">
                            ALLOCATED
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

        {/* TAB 2: REQUISITIONS QUEUE */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rule pb-3">
              <div>
                <h3 className="font-serif text-lg text-ink font-semibold">
                  Clinical Blood Requisitions
                </h3>
                <p className="text-xs text-muted">
                  Orders submitted for inpatients requiring blood and component transfusions
                </p>
              </div>
              <Link to="/blood-requests">
                <Button variant="secondary" size="sm">
                  Full Priority Queue &rarr;
                </Button>
              </Link>
            </div>

            <div className="border border-rule rounded-[2px] bg-surface overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-paper border-b border-rule font-mono text-[11px] uppercase tracking-wider text-muted">
                    <th className="py-2.5 px-3">Req ID</th>
                    <th className="py-2.5 px-3">Patient Name</th>
                    <th className="py-2.5 px-3">Phenotype</th>
                    <th className="py-2.5 px-3">Component</th>
                    <th className="py-2.5 px-3">Units</th>
                    <th className="py-2.5 px-3">Urgency</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule font-mono tabular-nums">
                  {requests.map((r) => (
                    <tr key={r.request_id} className="hover:bg-paper transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-ink">#{r.request_id}</td>
                      <td className="py-2.5 px-3 font-sans text-ink font-medium">{r.patient_name || 'Patient'}</td>
                      <td className="py-2.5 px-3">
                        <BloodGroupStamp bloodGroup={r.blood_group} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 font-sans text-muted">{r.component_type || 'Whole Blood'}</td>
                      <td className="py-2.5 px-3 font-semibold text-ink">{r.units_required}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-1.5 py-0.5 text-[10px] rounded-[2px] font-bold uppercase ${
                            r.urgency_level === 'CRITICAL'
                              ? 'bg-blood/10 text-blood border border-blood/30'
                              : 'bg-slate/10 text-slate border border-slate/30'
                          }`}
                        >
                          {r.urgency_level}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <StatusDot status={r.request_status} />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {r.request_status === 'PENDING' || r.request_status === 'APPROVED' ? (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              setSelectedRequest(r);
                              setIsAllocateModalOpen(true);
                            }}
                          >
                            Allocate Unit
                          </Button>
                        ) : (
                          <span className="text-[11px] text-muted font-sans">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: BLOOD STOCK INVENTORY */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rule pb-3">
              <div>
                <h3 className="font-serif text-lg text-ink font-semibold">
                  Hospital Blood Stock & Cold Storage
                </h3>
                <p className="text-xs text-muted">
                  Screened units ready for cross-matching and clinical allocation
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={invSearchGroup}
                  onChange={(e) => setInvSearchGroup(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-rule rounded-[2px] bg-paper text-ink font-mono focus:outline-none focus:border-blood"
                >
                  <option value="">All Blood Groups</option>
                  {bloodGroups.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>

                <select
                  value={invFilterStatus}
                  onChange={(e) => setInvFilterStatus(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-rule rounded-[2px] bg-paper text-ink font-mono focus:outline-none focus:border-blood"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="ALLOCATED">ALLOCATED</option>
                  <option value="EXPIRED">EXPIRED</option>
                  <option value="QUARANTINED">QUARANTINED</option>
                </select>
              </div>
            </div>

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
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule font-mono tabular-nums">
                  {filteredInventory.slice(0, 20).map((u) => (
                    <tr key={u.unit_id} className="hover:bg-paper transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-ink">#{u.unit_id}</td>
                      <td className="py-2.5 px-3">
                        <BloodGroupStamp bloodGroup={u.blood_group} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 font-sans text-ink">{u.component_type}</td>
                      <td className="py-2.5 px-3 text-muted text-[11px]">
                        {u.donation_date ? String(u.donation_date).slice(0, 10) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-[11px]">
                        <span className={u.days_until_expiry <= 7 ? 'text-blood font-bold' : 'text-muted'}>
                          {u.expiry_date ? String(u.expiry_date).slice(0, 10) : '—'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-sans text-muted">{u.storage_location || 'Freezer-A'}</td>
                      <td className="py-2.5 px-3">
                        <StatusDot status={u.storage_status} />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedUnitForUpdate(u);
                            setNewUnitStatus(u.storage_status);
                            setIsUpdateUnitModalOpen(true);
                          }}
                          className="px-2 py-0.5 border border-rule bg-paper hover:bg-black/5 text-ink text-[11px] rounded-[2px]"
                        >
                          Modify
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: DONOR DIRECTORY */}
        {activeTab === 'donors' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rule pb-3">
              <div>
                <h3 className="font-serif text-lg text-ink font-semibold">
                  Donor Directory & Verification
                </h3>
                <p className="text-xs text-muted">
                  Screening history and eligibility for voluntary donor intake
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search donors..."
                    value={donorSearchTerm}
                    onChange={(e) => setDonorSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1 text-xs border border-rule rounded-[2px] bg-paper text-ink focus:outline-none focus:border-blood w-40 font-mono"
                  />
                </div>

                <select
                  value={donorBloodGroupFilter}
                  onChange={(e) => setDonorBloodGroupFilter(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-rule rounded-[2px] bg-paper text-ink font-mono focus:outline-none focus:border-blood"
                >
                  <option value="">All Groups</option>
                  {bloodGroups.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border border-rule rounded-[2px] bg-surface overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-paper border-b border-rule font-mono text-[11px] uppercase tracking-wider text-muted">
                    <th className="py-2.5 px-3">Donor ID</th>
                    <th className="py-2.5 px-3">Donor Name</th>
                    <th className="py-2.5 px-3">Blood Group</th>
                    <th className="py-2.5 px-3">City</th>
                    <th className="py-2.5 px-3">Phone</th>
                    <th className="py-2.5 px-3">Last Donated</th>
                    <th className="py-2.5 px-3 text-right">Availability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule font-mono tabular-nums">
                  {filteredDonors.map((d) => (
                    <tr key={d.donor_id} className="hover:bg-paper transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-ink">#{d.donor_id}</td>
                      <td className="py-2.5 px-3 font-sans text-ink font-medium">
                        {d.name || `${d.first_name || ''} ${d.last_name || ''}`}
                      </td>
                      <td className="py-2.5 px-3">
                        <BloodGroupStamp bloodGroup={d.blood_group} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 font-sans text-muted">{d.city || 'Delhi'}</td>
                      <td className="py-2.5 px-3 text-muted text-[11px]">{d.phone || '—'}</td>
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

        {/* MODAL: Allocate Blood Unit */}
        {isAllocateModalOpen && selectedRequest && (
          <Modal
            isOpen={isAllocateModalOpen}
            onClose={() => setIsAllocateModalOpen(false)}
            title={`Allocate Blood Unit for Requisition #${selectedRequest.request_id}`}
          >
            <form onSubmit={handleAllocateSubmit} className="space-y-4 text-xs font-sans">
              {allocFeedback && (
                <div
                  className={`p-2.5 rounded-[2px] font-mono text-xs ${
                    allocFeedback.type === 'success'
                      ? 'bg-moss/10 text-moss border border-moss/30'
                      : 'bg-blood/10 text-blood border border-blood/30'
                  }`}
                >
                  {allocFeedback.message}
                </div>
              )}

              <div className="p-3 bg-paper border border-rule rounded-[2px] font-mono space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted">Patient:</span>
                  <span className="font-bold text-ink">{selectedRequest.patient_name || 'Patient'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Required Phenotype:</span>
                  <span className="font-bold text-blood">{selectedRequest.blood_group}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Urgency Level:</span>
                  <span className="font-semibold text-ink">{selectedRequest.urgency_level}</span>
                </div>
              </div>

              <div>
                <label className="block text-muted font-mono text-[10px] uppercase mb-1">
                  Select Compatible Available Unit *
                </label>
                <select
                  required
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-rule rounded-[2px] bg-paper text-ink font-mono text-xs focus:outline-none focus:border-blood"
                >
                  <option value="">-- Choose Unit from Cold Storage --</option>
                  {availableInventory.map((u) => (
                    <option key={u.unit_id} value={u.unit_id}>
                      Unit #{u.unit_id} ({u.blood_group} - {u.component_type} | Exp: {String(u.expiry_date).slice(0, 10)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-rule">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsAllocateModalOpen(false)}
                  disabled={allocating}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={allocating || !selectedUnitId}
                >
                  {allocating ? 'Executing ACID Allocation...' : 'Confirm Allocation'}
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* MODAL: Log Blood Donation Intake */}
        {isLogDonationModalOpen && (
          <Modal
            isOpen={isLogDonationModalOpen}
            onClose={() => setIsLogDonationModalOpen(false)}
            title="Record Voluntary Blood Donation"
          >
            <form onSubmit={handleLogDonationSubmit} className="space-y-4 text-xs font-sans">
              {donationFeedback && (
                <div
                  className={`p-2.5 rounded-[2px] font-mono text-xs ${
                    donationFeedback.type === 'success'
                      ? 'bg-moss/10 text-moss border border-moss/30'
                      : 'bg-blood/10 text-blood border border-blood/30'
                  }`}
                >
                  {donationFeedback.message}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted font-mono text-[10px] uppercase mb-1">
                    Donor Selection *
                  </label>
                  <select
                    required
                    value={newDonationForm.donor_id}
                    onChange={(e) =>
                      setNewDonationForm({ ...newDonationForm, donor_id: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 border border-rule rounded-[2px] bg-paper text-ink font-mono text-xs focus:outline-none focus:border-blood"
                  >
                    <option value="">-- Choose Donor --</option>
                    {donors.map((d) => (
                      <option key={d.donor_id} value={d.donor_id}>
                        #{d.donor_id} - {d.name || `${d.first_name} ${d.last_name}`} ({d.blood_group})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-muted font-mono text-[10px] uppercase mb-1">
                    Blood Group *
                  </label>
                  <select
                    value={newDonationForm.blood_group}
                    onChange={(e) =>
                      setNewDonationForm({ ...newDonationForm, blood_group: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 border border-rule rounded-[2px] bg-paper text-ink font-mono text-xs focus:outline-none focus:border-blood"
                  >
                    {bloodGroups.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-muted font-mono text-[10px] uppercase mb-1">
                    Hemoglobin (g/dL)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newDonationForm.hemoglobin_level}
                    onChange={(e) =>
                      setNewDonationForm({ ...newDonationForm, hemoglobin_level: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 border border-rule rounded-[2px] bg-paper text-ink font-mono text-xs focus:outline-none focus:border-blood"
                  />
                </div>
                <div>
                  <label className="block text-muted font-mono text-[10px] uppercase mb-1">
                    Blood Pressure
                  </label>
                  <input
                    type="text"
                    value={newDonationForm.blood_pressure}
                    onChange={(e) =>
                      setNewDonationForm({ ...newDonationForm, blood_pressure: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 border border-rule rounded-[2px] bg-paper text-ink font-mono text-xs focus:outline-none focus:border-blood"
                  />
                </div>
                <div>
                  <label className="block text-muted font-mono text-[10px] uppercase mb-1">
                    Volume (Bags)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="2"
                    value={newDonationForm.units_donated}
                    onChange={(e) =>
                      setNewDonationForm({ ...newDonationForm, units_donated: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 border border-rule rounded-[2px] bg-paper text-ink font-mono text-xs focus:outline-none focus:border-blood"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-rule font-sans">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsLogDonationModalOpen(false)}
                  disabled={donationSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={donationSubmitting || !newDonationForm.donor_id}
                >
                  {donationSubmitting ? 'Recording Intake...' : 'Submit Donation Record'}
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* MODAL: Update Blood Unit Storage Status */}
        {isUpdateUnitModalOpen && selectedUnitForUpdate && (
          <Modal
            isOpen={isUpdateUnitModalOpen}
            onClose={() => setIsUpdateUnitModalOpen(false)}
            title={`Modify Storage Status: Unit #${selectedUnitForUpdate.unit_id}`}
          >
            <div className="space-y-4 text-xs font-mono">
              <div className="p-3 bg-paper border border-rule rounded-[2px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted">Phenotype:</span>
                  <span className="font-bold text-ink">{selectedUnitForUpdate.blood_group}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Component:</span>
                  <span className="text-ink">{selectedUnitForUpdate.component_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Current Status:</span>
                  <span className="font-bold text-blood">{selectedUnitForUpdate.storage_status}</span>
                </div>
              </div>

              <div>
                <label className="block text-muted text-[10px] uppercase mb-1">
                  New Storage Status *
                </label>
                <select
                  value={newUnitStatus}
                  onChange={(e) => setNewUnitStatus(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-rule rounded-[2px] bg-paper text-ink font-mono text-xs focus:outline-none focus:border-blood"
                >
                  <option value="AVAILABLE">AVAILABLE (Cold Storage Ready)</option>
                  <option value="ALLOCATED">ALLOCATED (Assigned to Requisition)</option>
                  <option value="QUARANTINED">QUARANTINED (Pending Re-Screening)</option>
                  <option value="EXPIRED">EXPIRED (Disposal Ordered)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-rule font-sans">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsUpdateUnitModalOpen(false)}
                  disabled={updatingUnit}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleUpdateUnitStatus}
                  disabled={updatingUnit}
                >
                  {updatingUnit ? 'Saving...' : 'Update Status'}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </PageState>
    </div>
  );
};

export default StaffDashboard;

