import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/common/PageHeader';
import { PageState } from '../components/common/PageState';
import { Tabs } from '../components/common/Tabs';
import { Button } from '../components/common/Button';
import { Input, Select, Textarea } from '../components/common/FormControls';
import { StatusDot } from '../components/common/StatusDot';
import { BloodGroupStamp } from '../components/common/BloodGroupStamp';
import { Modal } from '../components/common/Modal';
import { Plus, Check, X } from 'lucide-react';

const BloodRequests = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('ranked');
  const [rankedRequests, setRankedRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [availableUnits, setAvailableUnits] = useState([]);
  const [compatibility, setCompatibility] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [urgencyFilter, setUrgencyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [hospFilter, setHospFilter] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [selectedRequestForAlloc, setSelectedRequestForAlloc] = useState(null);
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [allocationNotes, setAllocationNotes] = useState('');
  const [allocationResult, setAllocationResult] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Create Request Form
  const [requestForm, setRequestForm] = useState({
    patient_id: '',
    hospital_id: 1,
    blood_group: 'O+',
    component_type: 'WHOLE_BLOOD',
    units_required: 1,
    urgency_level: 'CRITICAL',
    required_by_date: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString().slice(0, 16),
    clinical_indication: 'Acute surgical standby.',
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'ranked') fetchRankedRequests();
    if (activeTab === 'all') fetchAllRequests();
  }, [activeTab, urgencyFilter, statusFilter, hospFilter]);

  const fetchInitialData = async () => {
    try {
      const [pRes, hRes, cRes] = await Promise.all([
        api.get('/patients'),
        api.get('/hospitals'),
        api.get('/blood-bank/compatibility'),
      ]);
      if (pRes.data?.success) {
        const pts = pRes.data.patients || [];
        setPatients(pts);
        if (pts.length > 0) {
          setRequestForm((prev) => ({
            ...prev,
            patient_id: pts[0].patient_id,
            blood_group: pts[0].blood_group,
          }));
        }
      }
      if (hRes.data?.success) setHospitals(hRes.data.hospitals || []);
      if (cRes.data?.success) setCompatibility(cRes.data.compatibility || []);
    } catch (err) {
      console.error('Initial data fetch error:', err);
    }
  };

  const fetchRankedRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/blood-requests/priority-ranked');
      if (res.data?.success) {
        setRankedRequests(res.data.requests || res.data.prioritizedRequests || []);
      }
    } catch (err) {
      console.error('Ranked requests fetch error:', err);
      setError('Failed to calculate priority ranking via Query 1 Window Function.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (urgencyFilter) params.urgency = urgencyFilter;
      if (statusFilter) params.status = statusFilter;
      if (hospFilter) params.hospital_id = hospFilter;

      const res = await api.get('/blood-requests', { params });
      if (res.data?.success) {
        setAllRequests(res.data.requests || []);
      }
    } catch (err) {
      console.error('All requests fetch error:', err);
      setError('Failed to retrieve blood requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAllocate = async (reqItem) => {
    setSelectedRequestForAlloc(reqItem);
    setAllocationResult(null);
    setSelectedUnitId('');
    setAllocationNotes(`Allocated by clinical staff for request #${reqItem.request_id}`);

    try {
      const res = await api.get('/blood-bank/inventory', {
        params: { storage_status: 'AVAILABLE' },
      });
      if (res.data?.success) {
        const units = res.data.units || res.data.inventory || [];
        setAvailableUnits(units);
        if (units.length > 0) {
          setSelectedUnitId(units[0].unit_id);
        }
      }
    } catch (err) {
      console.error('Failed to load available units:', err);
    }

    setIsAllocateModalOpen(true);
  };

  const handleExecuteAllocation = async (e) => {
    e.preventDefault();
    if (!selectedRequestForAlloc || !selectedUnitId) return;

    try {
      const res = await api.post('/blood-requests/allocate', {
        request_id: selectedRequestForAlloc.request_id,
        unit_id: selectedUnitId,
        notes: allocationNotes,
      });

      setAllocationResult({
        success: true,
        message: res.data.message,
      });

      fetchRankedRequests();
      fetchAllRequests();
    } catch (err) {
      setAllocationResult({
        success: false,
        message: err.response?.data?.message || err.message || 'Transaction aborted by database.',
      });
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/blood-requests', requestForm);
      if (res.data?.success) {
        setIsCreateModalOpen(false);
        setFeedback({ type: 'success', message: res.data.message });
        fetchRankedRequests();
        fetchAllRequests();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to create request' });
    }
  };

  // Compatibility helper: checks if donorBlood can donate to recipientBlood
  const checkCompatibility = (donorBlood, recipientBlood) => {
    if (!donorBlood || !recipientBlood) return false;
    const match = compatibility.find(
      (c) => c.donor_blood_group === donorBlood && c.recipient_blood_group === recipientBlood
    );
    if (match) return match.is_compatible;

    // Direct fallback ABO law
    const dClean = donorBlood.replace(/[+-]/g, '');
    const rClean = recipientBlood.replace(/[+-]/g, '');
    const dRh = donorBlood.includes('+') ? '+' : '-';
    const rRh = recipientBlood.includes('+') ? '+' : '-';

    const aboValid =
      dClean === 'O' ||
      dClean === rClean ||
      rClean === 'AB' ||
      (dClean === 'A' && rClean === 'AB') ||
      (dClean === 'B' && rClean === 'AB');

    const rhValid = dRh === '-' || rRh === '+';
    return aboValid && rhValid;
  };

  const selectedUnit = availableUnits.find((u) => u.unit_id === parseInt(selectedUnitId, 10));
  const isSelectedCompatible =
    selectedUnit && selectedRequestForAlloc
      ? checkCompatibility(selectedUnit.blood_group, selectedRequestForAlloc.blood_group)
      : false;

  const tabs = [
    { id: 'ranked', label: 'Priority Requisition Queue (Window DENSE_RANK)', count: rankedRequests.length },
    { id: 'all', label: 'All Registered Requisitions', count: allRequests.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        breadcrumb="Clinical Blood Supply Chain"
        title="Blood Requests & Priority Allocation"
        description="Facility-specific priority ranking powered by DENSE_RANK() window partitions, and ACID transactional allocation secured by SELECT ... FOR UPDATE exclusive locks."
        badge={`${rankedRequests.length} Active Queue Items`}
        action={
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>Create Requisition</span>
          </Button>
        }
      />

      {feedback && (
        <div
          className={`p-3 border rounded-[2px] text-xs font-mono flex items-center justify-between ${
            feedback.type === 'success'
              ? 'border-moss/40 bg-moss/10 text-moss'
              : 'border-blood/40 bg-blood-soft/20 text-blood'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs hover:opacity-75 ml-2 font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Facility Scope Indicator */}
      {user?.role !== 'DEVELOPER' && user?.hospital_name && (
        <div className="p-3 border border-rule bg-surface rounded-[2px] flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blood" />
            <span className="text-muted">Requisition Queue Scoped To:</span>
            <span className="font-semibold text-ink">{user.hospital_name}</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-muted px-1.5 py-0.5 border border-rule bg-paper">
            Facility ID #{user.hospital_id}
          </span>
        </div>
      )}
      {user?.role === 'DEVELOPER' && (
        <div className="p-3 border border-moss/40 bg-moss/10 rounded-[2px] flex items-center justify-between text-xs font-mono text-moss">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-moss" />
            <span className="font-bold">Developer Master Requisition View:</span>
            <span>Universal access across all clinical requisition queues & transactional allocations</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 border border-moss/40 bg-paper text-moss">
            DEVELOPER ACCESS
          </span>
        </div>
      )}

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* TAB 1: PRIORITY RANKED QUEUE (THE STAR) */}
      {activeTab === 'ranked' && (
        <div className="space-y-4">
          <div className="p-4 bg-surface border border-rule rounded-[2px] text-xs space-y-1">
            <p className="font-mono text-[11px] uppercase tracking-wider text-ink font-semibold">
              Query 1 &bull; Window Function Priority Ranking (DENSE_RANK() OVER PARTITION BY hospital_id)
            </p>
            <p className="text-muted leading-relaxed">
              Medical urgency serves as the primary ordering criterion (CRITICAL &rarr; HIGH &rarr; MEDIUM &rarr; ROUTINE),
              with elapsed waiting time as the secondary deterministic tiebreaker.
            </p>
          </div>

          <PageState
            loading={loading}
            error={error}
            empty={rankedRequests.length === 0}
            emptyTitle="Priority queue is clear"
            emptyDescription="There are no pending unfulfilled blood requisitions currently active in the database."
            onRetry={fetchRankedRequests}
          >
            <div className="border border-rule rounded-[2px] bg-surface overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-paper border-b border-rule font-mono text-[11px] uppercase tracking-wider text-muted">
                    <th className="py-2.5 px-3">Rank</th>
                    <th className="py-2.5 px-3">Hospital Center</th>
                    <th className="py-2.5 px-3">Req ID</th>
                    <th className="py-2.5 px-3">Patient Legal Name</th>
                    <th className="py-2.5 px-3">Phenotype</th>
                    <th className="py-2.5 px-3">Component Needed</th>
                    <th className="py-2.5 px-3 text-right">Units</th>
                    <th className="py-2.5 px-3">Urgency Triage</th>
                    <th className="py-2.5 px-3">Waiting Elapsed</th>
                    <th className="py-2.5 px-3 text-right">Allocation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule font-mono tabular-nums">
                  {rankedRequests.map((reqItem) => {
                    const isRankOne = reqItem.hospital_priority_rank === 1;

                    return (
                      <tr
                        key={reqItem.request_id}
                        className={`transition-colors ${
                          isRankOne ? 'bg-[#FCF9F3] hover:bg-paper' : 'hover:bg-paper'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-semibold">
                          <span
                            className={`inline-block px-1.5 py-0.2 border rounded-[2px] text-[11px] ${
                              isRankOne
                                ? 'border-blood text-blood font-bold bg-blood-soft/20'
                                : 'border-rule text-muted bg-paper'
                            }`}
                          >
                            #{reqItem.hospital_priority_rank}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-sans font-medium text-ink">
                          {reqItem.hospital_name}
                        </td>
                        <td className="py-2.5 px-3 text-muted">
                          #{reqItem.request_id}
                        </td>
                        <td className="py-2.5 px-3 font-sans text-ink">
                          {reqItem.patient_name}
                        </td>
                        <td className="py-2.5 px-3">
                          <BloodGroupStamp bloodGroup={reqItem.blood_group} size="sm" />
                        </td>
                        <td className="py-2.5 px-3 font-sans text-muted">
                          {reqItem.component_type}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-ink">
                          {reqItem.units_required} unit(s)
                        </td>
                        <td className="py-2.5 px-3">
                          <StatusDot status={reqItem.urgency_level} />
                        </td>
                        <td className="py-2.5 px-3 text-muted text-[11px]">
                          {reqItem.waiting_time_hours !== undefined
                            ? `${reqItem.waiting_time_hours}h elapsed`
                            : 'Active'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleOpenAllocate(reqItem)}
                            >
                              Allocate Bag
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </PageState>
        </div>
      )}

      {/* TAB 2: ALL REQUISITIONS WITH FILTER */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          <div className="p-3 bg-surface border border-rule rounded-[2px] flex flex-wrap items-center gap-3 text-xs">
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted">Filters:</span>

            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="px-2 py-1.5 bg-paper border border-rule text-xs text-ink rounded-[2px] focus:outline-none"
            >
              <option value="">All Urgencies</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="ROUTINE">Routine</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1.5 bg-paper border border-rule text-xs text-ink rounded-[2px] focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PARTIALLY_FULFILLED">Partially Fulfilled</option>
              <option value="FULFILLED">Fulfilled</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select
              value={hospFilter}
              onChange={(e) => setHospFilter(e.target.value)}
              className="px-2 py-1.5 bg-paper border border-rule text-xs text-ink rounded-[2px] focus:outline-none"
            >
              <option value="">All Hospitals</option>
              {hospitals.map((h) => (
                <option key={h.hospital_id} value={h.hospital_id}>{h.hospital_name}</option>
              ))}
            </select>
          </div>

          <PageState
            loading={loading}
            error={error}
            empty={allRequests.length === 0}
            emptyTitle="No requisitions located"
            emptyDescription="No blood requests found under active filter criteria."
            onRetry={fetchAllRequests}
          >
            <div className="border border-rule rounded-[2px] bg-surface overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-paper border-b border-rule font-mono text-[11px] uppercase tracking-wider text-muted">
                    <th className="py-2.5 px-3">Req ID</th>
                    <th className="py-2.5 px-3">Patient Legal Name</th>
                    <th className="py-2.5 px-3">Facility</th>
                    <th className="py-2.5 px-3">Phenotype</th>
                    <th className="py-2.5 px-3">Component</th>
                    <th className="py-2.5 px-3 text-right">Demanded</th>
                    <th className="py-2.5 px-3 text-right">Allocated</th>
                    <th className="py-2.5 px-3">Urgency</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule font-mono tabular-nums">
                  {allRequests.map((reqItem) => (
                    <tr key={reqItem.request_id} className="hover:bg-paper transition-colors">
                      <td className="py-2 px-3 font-semibold text-ink">
                        #{reqItem.request_id}
                      </td>
                      <td className="py-2 px-3 font-sans text-ink">{reqItem.patient_name}</td>
                      <td className="py-2 px-3 font-sans text-muted text-[11px]">{reqItem.hospital_name}</td>
                      <td className="py-2 px-3">
                        <BloodGroupStamp bloodGroup={reqItem.blood_group} size="sm" />
                      </td>
                      <td className="py-2 px-3 font-sans text-muted">{reqItem.component_type}</td>
                      <td className="py-2 px-3 text-right font-medium text-ink">{reqItem.units_required}</td>
                      <td className="py-2 px-3 text-right font-semibold text-moss">
                        {reqItem.allocated_units_count || 0}
                      </td>
                      <td className="py-2 px-3">
                        <StatusDot status={reqItem.urgency_level} />
                      </td>
                      <td className="py-2 px-3">
                        <StatusDot status={reqItem.request_status} />
                      </td>
                      <td className="py-2 px-3 text-right">
                        {(user?.role === 'ADMIN' || user?.role === 'STAFF') && reqItem.request_status !== 'FULFILLED' && (
                          <button
                            onClick={() => handleOpenAllocate(reqItem)}
                            className="text-xs text-blood hover:text-blood-hover underline underline-offset-2 font-sans"
                          >
                            Allocate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PageState>
        </div>
      )}

      {/* ACID Unit Allocation Modal */}
      <Modal
        isOpen={isAllocateModalOpen}
        onClose={() => setIsAllocateModalOpen(false)}
        title="Execute Unit Allocation (Query 9 ACID Procedure)"
        subtitle={
          selectedRequestForAlloc
            ? `Request #${selectedRequestForAlloc.request_id} &bull; ${selectedRequestForAlloc.patient_name} (${selectedRequestForAlloc.blood_group} ${selectedRequestForAlloc.component_type})`
            : ''
        }
      >
        <form onSubmit={handleExecuteAllocation} className="space-y-4">
          <div className="p-3 bg-paper border border-rule rounded-[2px] space-y-1.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-muted">Target Recipient Phenotype:</span>
              <BloodGroupStamp bloodGroup={selectedRequestForAlloc?.blood_group} size="sm" />
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Required Component:</span>
              <span className="text-ink font-sans font-medium">{selectedRequestForAlloc?.component_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Required Units:</span>
              <span className="text-ink font-semibold">{selectedRequestForAlloc?.units_required} bag(s)</span>
            </div>
          </div>

          {/* Unit Selector showing compatible vs incompatible units struck through */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-ink">
              Select Cold Storage Unit to Allocate:
            </label>
            <div className="border border-rule rounded-[2px] bg-paper max-h-48 overflow-y-auto divide-y divide-rule font-mono text-xs">
              {availableUnits.length === 0 ? (
                <p className="p-3 text-muted">No units currently cataloged as AVAILABLE.</p>
              ) : (
                availableUnits.map((u) => {
                  const comp = selectedRequestForAlloc
                    ? checkCompatibility(u.blood_group, selectedRequestForAlloc.blood_group)
                    : false;
                  const isChosen = parseInt(selectedUnitId, 10) === u.unit_id;

                  return (
                    <div
                      key={u.unit_id}
                      onClick={() => setSelectedUnitId(u.unit_id)}
                      className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                        isChosen
                          ? 'bg-surface font-semibold text-ink border-l-2 border-blood'
                          : comp
                          ? 'hover:bg-surface text-ink'
                          : 'opacity-50 line-through text-muted hover:opacity-75'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="unitSelection"
                          checked={isChosen}
                          onChange={() => setSelectedUnitId(u.unit_id)}
                          className="text-blood focus:ring-0"
                        />
                        <span>Unit #{u.unit_id} &bull; {u.component_type} &bull; Exp: {u.expiry_date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BloodGroupStamp bloodGroup={u.blood_group} size="sm" />
                        {comp ? (
                          <span className="text-[10px] text-moss flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Compatible
                          </span>
                        ) : (
                          <span className="text-[10px] text-blood flex items-center gap-0.5">
                            <X className="w-3 h-3" /> Incompatible
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <Textarea
            label="Allocation Authorization Notes"
            rows={2}
            value={allocationNotes}
            onChange={(e) => setAllocationNotes(e.target.value)}
          />

          {/* Result Alert: Shows success or database trigger prevention */}
          {allocationResult && (
            <div
              className={`p-3 border rounded-[2px] font-mono text-xs ${
                allocationResult.success
                  ? 'border-moss/40 bg-moss/10 text-moss'
                  : 'border-blood/40 bg-blood-soft/20 text-blood'
              }`}
            >
              <p className="font-semibold">{allocationResult.success ? 'COMMIT Successful:' : 'Database SIGNAL Exception:'}</p>
              <p className="mt-0.5">{allocationResult.message}</p>
            </div>
          )}

          <div className="pt-3 border-t border-rule flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsAllocateModalOpen(false)}>
              Close
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!selectedUnitId || !isSelectedCompatible}
            >
              Commit Transaction (FOR UPDATE)
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Request Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Submit Clinical Blood Requisition"
        subtitle="Places new requisition into MySQL BloodRequest queue"
      >
        <form onSubmit={handleCreateRequest} className="space-y-3.5">
          <Select
            label="Inpatient Recipient"
            value={requestForm.patient_id}
            onChange={(e) => {
              const pid = e.target.value;
              const pt = patients.find((p) => String(p.patient_id) === String(pid));
              setRequestForm({
                ...requestForm,
                patient_id: pid,
                blood_group: pt ? pt.blood_group : requestForm.blood_group,
              });
            }}
          >
            {patients.map((p) => (
              <option key={p.patient_id} value={p.patient_id}>
                #{p.patient_id} &bull; {p.first_name} {p.last_name} ({p.blood_group}) &bull; {p.hospital_name}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Ordering Hospital Facility"
              value={requestForm.hospital_id}
              onChange={(e) => setRequestForm({ ...requestForm, hospital_id: parseInt(e.target.value, 10) })}
            >
              {hospitals.map((h) => (
                <option key={h.hospital_id} value={h.hospital_id}>{h.hospital_name}</option>
              ))}
            </Select>

            <Select
              label="Phenotype Requested"
              value={requestForm.blood_group}
              onChange={(e) => setRequestForm({ ...requestForm, blood_group: e.target.value })}
            >
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Select
              label="Component Type"
              value={requestForm.component_type}
              onChange={(e) => setRequestForm({ ...requestForm, component_type: e.target.value })}
            >
              <option value="WHOLE_BLOOD">Whole Blood</option>
              <option value="RBC">Packed RBC</option>
              <option value="PLATELETS">Platelets</option>
              <option value="PLASMA">Fresh Frozen Plasma</option>
              <option value="CRYO">Cryoprecipitate</option>
            </Select>

            <Input
              label="Units Required"
              type="number"
              min="1"
              max="10"
              required
              value={requestForm.units_required}
              onChange={(e) => setRequestForm({ ...requestForm, units_required: parseInt(e.target.value, 10) })}
            />

            <Select
              label="Urgency Triage"
              value={requestForm.urgency_level}
              onChange={(e) => setRequestForm({ ...requestForm, urgency_level: e.target.value })}
            >
              <option value="CRITICAL">Critical (Immediate)</option>
              <option value="HIGH">High (&lt; 6 hrs)</option>
              <option value="MEDIUM">Medium (&lt; 24 hrs)</option>
              <option value="ROUTINE">Routine Standby</option>
            </Select>
          </div>

          <Textarea
            label="Clinical Indication & Diagnosis"
            rows={2}
            value={requestForm.clinical_indication}
            onChange={(e) => setRequestForm({ ...requestForm, clinical_indication: e.target.value })}
          />

          <div className="pt-3 border-t border-rule flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Submit Requisition
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BloodRequests;
