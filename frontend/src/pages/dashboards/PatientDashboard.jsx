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
  Heart,
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
  Building,
  Phone,
  Calendar,
  FileText,
  RefreshCw,
  Info,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

const PatientDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [myRequests, setMyRequests] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tabs
  const [activeTab, setActiveTab] = useState('overview');

  // Create Request Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({
    hospital_id: 1,
    blood_group: 'O+',
    component_type: 'WHOLE_BLOOD',
    units_required: 1,
    urgency_level: 'HIGH',
    required_by_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    clinical_indication: 'Scheduled transfusion standby.',
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestFeedback, setRequestFeedback] = useState(null);

  useEffect(() => {
    fetchPatientDashboardData();
  }, [user]);

  const fetchPatientDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user profile from /auth/me
      const meRes = await api.get('/auth/me');
      let userData = user;
      if (meRes.data?.success) {
        userData = meRes.data.user;
        setProfile(userData);
      }

      // Fetch patient's blood requests and hospitals
      const [rRes, hRes] = await Promise.allSettled([
        api.get('/blood-requests'),
        api.get('/hospitals/options'),
      ]);

      if (rRes.status === 'fulfilled' && rRes.value.data?.success) {
        setMyRequests(rRes.value.data.requests || []);
      }
      if (hRes.status === 'fulfilled' && hRes.value.data?.success) {
        const hList = hRes.value.data.hospitals || [];
        setHospitals(hList);
        if (hList.length > 0) {
          setRequestForm((prev) => ({
            ...prev,
            hospital_id: userData?.hospital_id || hList[0].hospital_id,
            blood_group: userData?.blood_group || 'O+',
          }));
        }
      }
    } catch (err) {
      console.error('Patient dashboard data error:', err);
      setError('Failed to load patient health and request ledger.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequestSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingRequest(true);
      setRequestFeedback(null);

      const payload = {
        patient_id: profile?.patient_id || 1,
        hospital_id: parseInt(requestForm.hospital_id, 10),
        blood_group: requestForm.blood_group,
        component_type: requestForm.component_type,
        units_required: parseInt(requestForm.units_required, 10),
        urgency_level: requestForm.urgency_level,
        required_by_date: requestForm.required_by_date,
        clinical_indication: requestForm.clinical_indication,
      };

      const res = await api.post('/blood-requests', payload);
      if (res.data?.success) {
        setRequestFeedback({
          type: 'success',
          message: 'Transfusion request submitted successfully! Triage queue assigned.',
        });
        setTimeout(() => {
          setIsCreateModalOpen(false);
          fetchPatientDashboardData();
        }, 1200);
      }
    } catch (err) {
      setRequestFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to submit blood request.',
      });
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Status breakdown
  const pendingRequests = myRequests.filter(
    (r) => r.request_status === 'PENDING' || r.request_status === 'PARTIALLY_FULFILLED'
  );
  const approvedRequests = myRequests.filter((r) => r.request_status === 'APPROVED');
  const fulfilledRequests = myRequests.filter(
    (r) => r.request_status === 'FULFILLED' || r.request_status === 'COMPLETED'
  );
  const rejectedRequests = myRequests.filter((r) => r.request_status === 'REJECTED');

  const patientBloodGroup = profile?.blood_group || 'AB-';
  const fullName = profile?.first_name
    ? `${profile.first_name} ${profile.last_name || ''}`
    : user?.username || 'Aditya Mehta';

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <PageHeader
        breadcrumb="Role: Inpatient Clinical Ledger"
        title="Personal Transfusion & Care Dashboard"
        description="Monitor submitted blood requisitions, view allocated cold-storage units, check hospital emergency lines, and track clinical status."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={fetchPatientDashboardData}
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Status
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Request Blood Unit
            </Button>
          </div>
        }
      />

      <PageState loading={loading} error={error} onRetry={fetchPatientDashboardData}>
        {/* Navigation Tabs */}
        <Tabs
          tabs={[
            { id: 'overview', label: 'My Care Overview' },
            { id: 'requests', label: `My Blood Requests (${myRequests.length})` },
            { id: 'tracking', label: 'Transfusion Order Tracking' },
            { id: 'hospitals', label: 'Hospital Emergency Lines' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Patient Clinical Profile Card */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Profile Card */}
              <div className="md:col-span-6 border border-rule bg-surface p-5 rounded-[2px] flex items-center justify-between">
                <div className="space-y-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                    Inpatient Record #{profile?.patient_id || '20001'} &bull; Specialization
                  </span>
                  <h3 className="font-serif text-xl font-bold text-ink">
                    {fullName}
                  </h3>
                  <p className="font-mono text-xs text-muted">
                    Admitted Center: <strong className="text-ink">{profile?.hospital_name || 'AIIMS Cardiology'}</strong>
                  </p>
                  <div className="pt-2 font-mono text-[11px] text-muted space-y-0.5">
                    <p>Phone: <span className="text-ink">{profile?.phone || '+91 99887 76655'}</span></p>
                    <p>City: <span className="text-ink">{profile?.city || 'New Delhi'}</span></p>
                  </div>
                </div>

                <div className="text-center pl-4 border-l border-rule">
                  <BloodGroupStamp bloodGroup={patientBloodGroup} size="lg" />
                  <span className="block font-mono text-[10px] text-muted uppercase mt-1">
                    Confirmed
                  </span>
                </div>
              </div>

              {/* Admission & Triage Status Card */}
              <div className="md:col-span-6 border border-rule bg-surface p-5 rounded-[2px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-rule pb-2 mb-3">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted font-semibold">
                      Admission Triage Standing
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-mono font-bold rounded-[2px] bg-moss/10 text-moss border border-moss/40">
                      <CheckCircle className="w-3.5 h-3.5 text-moss" />
                      <span>CLINICALLY MONITORED</span>
                    </span>
                  </div>

                  <p className="text-xs text-muted font-sans leading-relaxed">
                    Your records are linked to the hospital inpatient ward. Blood requisitions submitted through this portal are prioritized based on clinical indication and verified directly by the attending physician and transfusion staff.
                  </p>
                </div>

                <div className="pt-3 border-t border-rule font-mono text-xs text-muted flex items-center justify-between">
                  <span>Emergency Blood Bank Contact:</span>
                  <span className="font-bold text-blood">1066 / 011-26588500</span>
                </div>
              </div>
            </div>

            {/* Requisitions Overview Cards */}
            <section aria-label="Requests Metrics">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="border border-rule bg-surface p-4 rounded-[2px]">
                  <Stat
                    label="Total Requests"
                    value={myRequests.length}
                    annotation="All transfusion orders"
                  />
                </div>
                <div className="border border-rule bg-surface p-4 rounded-[2px]">
                  <Stat
                    label="Pending / Review"
                    value={pendingRequests.length}
                    annotation="In triage pipeline"
                    alert={pendingRequests.length > 0}
                  />
                </div>
                <div className="border border-rule bg-surface p-4 rounded-[2px]">
                  <Stat
                    label="Approved Requests"
                    value={approvedRequests.length}
                    annotation="Ready for allocation"
                  />
                </div>
                <div className="border border-rule bg-surface p-4 rounded-[2px]">
                  <Stat
                    label="Fulfilled Requests"
                    value={fulfilledRequests.length}
                    annotation="Transfusion completed"
                  />
                </div>
              </div>
            </section>

            {/* Active Requisitions Quick List */}
            <div className="space-y-3">
              <div className="flex items-baseline justify-between border-b border-rule pb-2">
                <div>
                  <h3 className="font-serif text-base text-ink font-semibold">
                    My Active Transfusion Orders
                  </h3>
                  <p className="text-xs text-muted">
                    Real-time status updates on submitted blood bag requisitions
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  New Request
                </Button>
              </div>

              <div className="border border-rule rounded-[2px] bg-surface overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-paper border-b border-rule font-mono text-[11px] uppercase tracking-wider text-muted">
                      <th className="py-2.5 px-3">Req ID</th>
                      <th className="py-2.5 px-3">Blood Group</th>
                      <th className="py-2.5 px-3">Component</th>
                      <th className="py-2.5 px-3">Units Needed</th>
                      <th className="py-2.5 px-3">Hospital Center</th>
                      <th className="py-2.5 px-3">Required By</th>
                      <th className="py-2.5 px-3 text-right">Order Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule font-mono tabular-nums">
                    {myRequests.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-6 text-center text-muted font-sans">
                          No blood requests recorded yet. Click &quot;Request Blood Unit&quot; above to submit one.
                        </td>
                      </tr>
                    ) : (
                      myRequests.map((r) => (
                        <tr key={r.request_id} className="hover:bg-paper transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-ink">#{r.request_id}</td>
                          <td className="py-2.5 px-3">
                            <BloodGroupStamp bloodGroup={r.blood_group} size="sm" />
                          </td>
                          <td className="py-2.5 px-3 font-sans text-ink">{r.component_type || 'Whole Blood'}</td>
                          <td className="py-2.5 px-3 font-semibold text-ink">{r.units_required}</td>
                          <td className="py-2.5 px-3 font-sans text-muted">{r.hospital_name || 'AIIMS'}</td>
                          <td className="py-2.5 px-3 text-muted text-[11px]">
                            {r.required_by_date ? String(r.required_by_date).slice(0, 16) : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <StatusDot status={r.request_status} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MY BLOOD REQUESTS */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rule pb-3">
              <div>
                <h3 className="font-serif text-lg text-ink font-semibold">
                  Blood Requisitions History
                </h3>
                <p className="text-xs text-muted">
                  Detailed ledger of all transfusion requests submitted under your inpatient record
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Submit New Request
              </Button>
            </div>

            <div className="border border-rule rounded-[2px] bg-surface overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-paper border-b border-rule font-mono text-[11px] uppercase tracking-wider text-muted">
                    <th className="py-2.5 px-3">Req ID</th>
                    <th className="py-2.5 px-3">Date Submitted</th>
                    <th className="py-2.5 px-3">Phenotype</th>
                    <th className="py-2.5 px-3">Units</th>
                    <th className="py-2.5 px-3">Urgency</th>
                    <th className="py-2.5 px-3">Clinical Indication</th>
                    <th className="py-2.5 px-3">Allocated Bags</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule font-mono tabular-nums">
                  {myRequests.map((r) => (
                    <tr key={r.request_id} className="hover:bg-paper transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-ink">#{r.request_id}</td>
                      <td className="py-2.5 px-3 text-muted text-[11px]">
                        {r.request_date ? String(r.request_date).slice(0, 10) : '2026-11-20'}
                      </td>
                      <td className="py-2.5 px-3">
                        <BloodGroupStamp bloodGroup={r.blood_group} size="sm" />
                      </td>
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
                      <td className="py-2.5 px-3 font-sans text-muted truncate max-w-xs">
                        {r.clinical_indication || 'Standard surgical preparation'}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-moss">
                        {r.allocated_count || 0} / {r.units_required}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <StatusDot status={r.request_status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: VISUAL ORDER TRACKING TIMELINE */}
        {activeTab === 'tracking' && (
          <div className="space-y-6">
            <div className="border-b border-rule pb-3">
              <h3 className="font-serif text-lg text-ink font-semibold">
                Transfusion Pipeline & Status Stages
              </h3>
              <p className="text-xs text-muted">
                Transparent real-time clinical tracking of your transfusion requisitions
              </p>
            </div>

            {myRequests.length === 0 ? (
              <div className="p-8 border border-rule bg-surface rounded-[2px] text-center text-muted font-sans">
                No active transfusion requests to track.
              </div>
            ) : (
              myRequests.map((r) => {
                const isApproved =
                  r.request_status === 'APPROVED' ||
                  r.request_status === 'PARTIALLY_FULFILLED' ||
                  r.request_status === 'FULFILLED' ||
                  r.request_status === 'COMPLETED';
                const isFulfilled =
                  r.request_status === 'FULFILLED' || r.request_status === 'COMPLETED';
                const isRejected = r.request_status === 'REJECTED';

                return (
                  <div
                    key={r.request_id}
                    className="border border-rule bg-surface p-5 rounded-[2px] space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rule pb-3">
                      <div className="flex items-center gap-3">
                        <BloodGroupStamp bloodGroup={r.blood_group} size="md" />
                        <div>
                          <h4 className="font-serif text-base font-semibold text-ink">
                            Requisition #{r.request_id}: {r.units_required} Unit(s) {r.component_type || 'Whole Blood'}
                          </h4>
                          <p className="text-xs text-muted font-mono">
                            Target Facility: {r.hospital_name || 'Hospital Center'} &bull; Urgency: {r.urgency_level}
                          </p>
                        </div>
                      </div>
                      <StatusDot status={r.request_status} />
                    </div>

                    {/* Step Timeline */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 font-mono text-xs">
                      {/* Step 1 */}
                      <div
                        className={`p-3 rounded-[2px] border ${
                          !isRejected
                            ? 'border-moss/40 bg-moss/10 text-moss'
                            : 'border-rule bg-paper text-muted'
                        }`}
                      >
                        <span className="block text-[10px] uppercase font-bold">Step 1</span>
                        <span className="font-semibold block mt-0.5">Order Submitted</span>
                        <span className="text-[10px] opacity-80">Logged in Triage Queue</span>
                      </div>

                      {/* Step 2 */}
                      <div
                        className={`p-3 rounded-[2px] border ${
                          isApproved && !isRejected
                            ? 'border-moss/40 bg-moss/10 text-moss'
                            : 'border-rule bg-paper text-muted'
                        }`}
                      >
                        <span className="block text-[10px] uppercase font-bold">Step 2</span>
                        <span className="font-semibold block mt-0.5">Clinical Review</span>
                        <span className="text-[10px] opacity-80">
                          {isApproved ? 'Approved by Physician' : 'Under Medical Triage'}
                        </span>
                      </div>

                      {/* Step 3 */}
                      <div
                        className={`p-3 rounded-[2px] border ${
                          isApproved && !isRejected
                            ? 'border-moss/40 bg-moss/10 text-moss'
                            : 'border-rule bg-paper text-muted'
                        }`}
                      >
                        <span className="block text-[10px] uppercase font-bold">Step 3</span>
                        <span className="font-semibold block mt-0.5">Unit Matching</span>
                        <span className="text-[10px] opacity-80">
                          {r.allocated_count > 0 ? `${r.allocated_count} Unit(s) Matched` : 'Searching Cold Storage'}
                        </span>
                      </div>

                      {/* Step 4 */}
                      <div
                        className={`p-3 rounded-[2px] border ${
                          isFulfilled
                            ? 'border-moss/40 bg-moss/10 text-moss'
                            : isRejected
                            ? 'border-blood/40 bg-blood/10 text-blood'
                            : 'border-rule bg-paper text-muted'
                        }`}
                      >
                        <span className="block text-[10px] uppercase font-bold">Step 4</span>
                        <span className="font-semibold block mt-0.5">
                          {isRejected ? 'Order Rejected' : 'Transfusion Ready'}
                        </span>
                        <span className="text-[10px] opacity-80">
                          {isFulfilled ? 'Dispatched to Ward' : isRejected ? 'Clinical Exclusion' : 'Awaiting Final Release'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 4: HOSPITALS DIRECTORY */}
        {activeTab === 'hospitals' && (
          <div className="space-y-6">
            <div className="border-b border-rule pb-3">
              <h3 className="font-serif text-lg text-ink font-semibold">
                Affiliated Hospital Network & Emergency Lines
              </h3>
              <p className="text-xs text-muted">
                Contact information and 24/7 blood bank helpline desks across regional centers
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-mono">
              {hospitals.map((h) => (
                <div
                  key={h.hospital_id}
                  className="border border-rule bg-surface p-5 rounded-[2px] space-y-3"
                >
                  <div>
                    <span className="text-[10px] text-muted uppercase">Center #{h.hospital_id}</span>
                    <h4 className="font-serif text-base font-semibold text-ink mt-0.5">
                      {h.hospital_name}
                    </h4>
                    <p className="text-xs text-muted">{h.city}, {h.state}</p>
                  </div>

                  <div className="p-3 bg-paper border border-rule rounded-[2px] text-xs space-y-1.5">
                    <p className="flex items-center justify-between">
                      <span className="text-muted">Emergency Line:</span>
                      <span className="font-bold text-blood">1066 / 26588500</span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span className="text-muted">Blood Bank Desk:</span>
                      <span className="text-ink">Ext. 4402</span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span className="text-muted">Status:</span>
                      <span className="text-moss font-semibold">24/7 Transfusion Open</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODAL: Create Blood Request */}
        {isCreateModalOpen && (
          <Modal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            title="Submit Clinical Transfusion Requisition"
          >
            <form onSubmit={handleCreateRequestSubmit} className="space-y-4 text-xs font-sans">
              {requestFeedback && (
                <div
                  className={`p-2.5 rounded-[2px] font-mono text-xs ${
                    requestFeedback.type === 'success'
                      ? 'bg-moss/10 text-moss border border-moss/30'
                      : 'bg-blood/10 text-blood border border-blood/30'
                  }`}
                >
                  {requestFeedback.message}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted font-mono text-[10px] uppercase mb-1">
                    Select Hospital *
                  </label>
                  <select
                    required
                    value={requestForm.hospital_id}
                    onChange={(e) =>
                      setRequestForm({ ...requestForm, hospital_id: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 border border-rule rounded-[2px] bg-paper text-ink font-mono text-xs focus:outline-none focus:border-blood"
                  >
                    {hospitals.map((h) => (
                      <option key={h.hospital_id} value={h.hospital_id}>
                        {h.hospital_name} ({h.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-muted font-mono text-[10px] uppercase mb-1">
                    Required Blood Phenotype *
                  </label>
                  <select
                    value={requestForm.blood_group}
                    onChange={(e) =>
                      setRequestForm({ ...requestForm, blood_group: e.target.value })
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
                    Component Type
                  </label>
                  <select
                    value={requestForm.component_type}
                    onChange={(e) =>
                      setRequestForm({ ...requestForm, component_type: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 border border-rule rounded-[2px] bg-paper text-ink font-mono text-xs focus:outline-none focus:border-blood"
                  >
                    <option value="WHOLE_BLOOD">Whole Blood</option>
                    <option value="RED_BLOOD_CELLS">Red Blood Cells (PRBC)</option>
                    <option value="PLATELETS">Platelets</option>
                    <option value="PLASMA">Fresh Frozen Plasma</option>
                    <option value="CRYOPRECIPITATE">Cryoprecipitate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-muted font-mono text-[10px] uppercase mb-1">
                    Units Required *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    required
                    value={requestForm.units_required}
                    onChange={(e) =>
                      setRequestForm({ ...requestForm, units_required: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 border border-rule rounded-[2px] bg-paper text-ink font-mono text-xs focus:outline-none focus:border-blood"
                  />
                </div>

                <div>
                  <label className="block text-muted font-mono text-[10px] uppercase mb-1">
                    Urgency Level *
                  </label>
                  <select
                    value={requestForm.urgency_level}
                    onChange={(e) =>
                      setRequestForm({ ...requestForm, urgency_level: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 border border-rule rounded-[2px] bg-paper text-ink font-mono text-xs focus:outline-none focus:border-blood"
                  >
                    <option value="CRITICAL">CRITICAL (Immediate)</option>
                    <option value="HIGH">HIGH (&lt; 12 Hours)</option>
                    <option value="MEDIUM">MEDIUM (&lt; 24 Hours)</option>
                    <option value="ROUTINE">ROUTINE (Scheduled)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-muted font-mono text-[10px] uppercase mb-1">
                  Required By Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={requestForm.required_by_date}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, required_by_date: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 border border-rule rounded-[2px] bg-paper text-ink font-mono text-xs focus:outline-none focus:border-blood"
                />
              </div>

              <div>
                <label className="block text-muted font-mono text-[10px] uppercase mb-1">
                  Clinical Indication / Reason *
                </label>
                <textarea
                  required
                  rows="2"
                  value={requestForm.clinical_indication}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, clinical_indication: e.target.value })
                  }
                  placeholder="e.g. Inpatient acute anemia, post-surgical hemoglobin maintenance..."
                  className="w-full px-2.5 py-1.5 border border-rule rounded-[2px] bg-paper text-ink font-mono text-xs focus:outline-none focus:border-blood"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-rule font-sans">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={submittingRequest}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={submittingRequest}
                >
                  {submittingRequest ? 'Submitting to Triage...' : 'Submit Request'}
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </PageState>
    </div>
  );
};

export default PatientDashboard;

