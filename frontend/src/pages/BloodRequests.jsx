import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { BloodGroupPill, StatusBadge, UrgencyBadge } from '../components/Badge';
import {
  Clock,
  Plus,
  Filter,
  CheckCircle2,
  AlertCircle,
  Database,
  ArrowRight,
  ShieldCheck,
  Droplet,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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

  // Create Request Form
  const [requestForm, setRequestForm] = useState({
    patient_id: '',
    hospital_id: 1,
    blood_group: 'O+',
    component_type: 'WHOLE_BLOOD',
    units_required: 1,
    urgency_level: 'CRITICAL',
    required_by_date: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString().slice(0, 16),
    clinical_indication: 'Urgent perioperative clinical need.',
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
        setPatients(pRes.data.patients);
        if (pRes.data.patients.length > 0) {
          setRequestForm((prev) => ({
            ...prev,
            patient_id: pRes.data.patients[0].patient_id,
            blood_group: pRes.data.patients[0].blood_group,
          }));
        }
      }
      if (hRes.data?.success) setHospitals(hRes.data.hospitals);
      if (cRes.data?.success) setCompatibility(cRes.data.compatibility);
    } catch (err) {
      console.error('Initial data fetch error:', err);
    }
  };

  const fetchRankedRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/blood-requests/priority-ranked');
      if (res.data?.success) setRankedRequests(res.data.requests);
    } catch (err) {
      console.error('Ranked requests fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRequests = async () => {
    try {
      setLoading(true);
      const params = {};
      if (urgencyFilter) params.urgency = urgencyFilter;
      if (statusFilter) params.status = statusFilter;
      if (hospFilter) params.hospital_id = hospFilter;

      const res = await api.get('/blood-requests', { params });
      if (res.data?.success) setAllRequests(res.data.requests);
    } catch (err) {
      console.error('All requests fetch error:', err);
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
      // Fetch available units
      const res = await api.get('/blood-bank/inventory', {
        params: { storage_status: 'AVAILABLE' },
      });
      if (res.data?.success) {
        setAvailableUnits(res.data.units);
        if (res.data.units.length > 0) {
          setSelectedUnitId(res.data.units[0].unit_id);
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

      // Refresh list
      fetchRankedRequests();
      fetchAllRequests();
    } catch (err) {
      setAllocationResult({
        success: false,
        message: err.response?.data?.message || err.message || 'Transaction aborted.',
      });
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/blood-requests', requestForm);
      if (res.data?.success) {
        setIsCreateModalOpen(false);
        alert(res.data.message);
        fetchRankedRequests();
        fetchAllRequests();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create request');
    }
  };

  // Check compatibility helper for selected unit in modal
  const selectedUnit = availableUnits.find((u) => u.unit_id === parseInt(selectedUnitId, 10));
  const isCompatibleSelection =
    selectedUnit && selectedRequestForAlloc
      ? compatibility.some(
          (c) =>
            c.donor_blood_group === selectedUnit.blood_group &&
            c.recipient_blood_group === selectedRequestForAlloc.blood_group &&
            c.is_compatible
        )
      : false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Blood Requests & Priority Allocation</h1>
          <p className="text-xs text-slate-500 mt-1">
            Window function priority ranking with ACID row-locking transactions for inventory allocation.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-brand-600 text-white hover:bg-brand-700 shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Blood Request</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs">
        <button
          onClick={() => setActiveTab('ranked')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold border-b-2 transition-all ${
            activeTab === 'ranked'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4 text-indigo-600" />
          <span>Query 1: Urgency Priority Ranking (Window Function)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-200 text-indigo-900 font-bold">
            {rankedRequests.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold border-b-2 transition-all ${
            activeTab === 'all'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>All Clinical Requests ({allRequests.length})</span>
        </button>
      </div>

      {/* TAB 1: QUERY 1 PRIORITY RANKING WINDOW FUNCTION */}
      {activeTab === 'ranked' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Query 1: Window Function – Urgency Ranking (DENSE_RANK() OVER PARTITION BY hospital_id)</p>
              <p className="text-indigo-800 mt-0.5 leading-relaxed">
                Computes a facility-specific priority queue for all active requests. Medical urgency is weighted as the primary ordering factor,
                with elapsed waiting time as the secondary deterministic tie-breaker.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-indigo-50/50 border-b border-indigo-200 text-indigo-900 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Hospital Priority Rank</th>
                    <th className="py-3 px-4">Hospital Facility</th>
                    <th className="py-3 px-4">Request #</th>
                    <th className="py-3 px-4">Patient Name</th>
                    <th className="py-3 px-4">Blood Group</th>
                    <th className="py-3 px-4">Component</th>
                    <th className="py-3 px-4">Units Required</th>
                    <th className="py-3 px-4">Urgency Triage</th>
                    <th className="py-3 px-4">Waiting Time</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rankedRequests.map((reqItem) => (
                    <tr key={reqItem.request_id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-bold font-mono text-xs ${
                          reqItem.hospital_priority_rank === 1
                            ? 'bg-rose-600 text-white shadow-sm'
                            : reqItem.hospital_priority_rank === 2
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          #{reqItem.hospital_priority_rank}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{reqItem.hospital_name}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">Req #{reqItem.request_id}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{reqItem.patient_name}</td>
                      <td className="py-3 px-4">
                        <BloodGroupPill bloodGroup={reqItem.blood_group} />
                      </td>
                      <td className="py-3 px-4 text-slate-600">{reqItem.component_type}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{reqItem.units_required} unit(s)</td>
                      <td className="py-3 px-4">
                        <UrgencyBadge urgency={reqItem.urgency_level} />
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {reqItem.waiting_time_hours} hours elapsed
                      </td>
                      <td className="py-3 px-4 text-right">
                        {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
                          <button
                            onClick={() => handleOpenAllocate(reqItem)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors"
                          >
                            <Droplet className="w-3.5 h-3.5" />
                            <span>Allocate Unit (Q9)</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALL CLINICAL REQUESTS */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </div>

            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="px-3 py-1.5 border rounded-lg bg-slate-50 text-slate-700 font-medium focus:outline-none"
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
              className="px-3 py-1.5 border rounded-lg bg-slate-50 text-slate-700 font-medium focus:outline-none"
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
              className="px-3 py-1.5 border rounded-lg bg-slate-50 text-slate-700 font-medium focus:outline-none"
            >
              <option value="">All Hospitals</option>
              {hospitals.map((h) => (
                <option key={h.hospital_id} value={h.hospital_id}>{h.hospital_name}</option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Request #</th>
                    <th className="py-3 px-4">Patient Name</th>
                    <th className="py-3 px-4">Hospital</th>
                    <th className="py-3 px-4">Blood Group</th>
                    <th className="py-3 px-4">Component</th>
                    <th className="py-3 px-4">Units Needed</th>
                    <th className="py-3 px-4">Allocated</th>
                    <th className="py-3 px-4">Urgency</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allRequests.map((reqItem) => (
                    <tr key={reqItem.request_id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">#{reqItem.request_id}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{reqItem.patient_name}</td>
                      <td className="py-3 px-4 text-slate-600">{reqItem.hospital_name}</td>
                      <td className="py-3 px-4">
                        <BloodGroupPill bloodGroup={reqItem.blood_group} />
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{reqItem.component_type}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{reqItem.units_required}</td>
                      <td className="py-3 px-4 font-bold text-purple-600">{reqItem.allocated_units_count} units</td>
                      <td className="py-3 px-4">
                        <UrgencyBadge urgency={reqItem.urgency_level} />
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={reqItem.request_status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        {(user?.role === 'ADMIN' || user?.role === 'STAFF') && reqItem.request_status !== 'FULFILLED' && (
                          <button
                            onClick={() => handleOpenAllocate(reqItem)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded bg-emerald-600 text-white hover:bg-emerald-700"
                          >
                            <span>Allocate</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Query 9: Allocate Blood Unit Modal (ACID Transaction) */}
      <Modal
        isOpen={isAllocateModalOpen}
        onClose={() => setIsAllocateModalOpen(false)}
        title="Execute Transactional Blood Allocation (Query 9 ACID Procedure)"
      >
        <form onSubmit={handleExecuteAllocation} className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-800">Target Request #{selectedRequestForAlloc?.request_id}</span>
              <UrgencyBadge urgency={selectedRequestForAlloc?.urgency_level} />
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Patient: <strong>{selectedRequestForAlloc?.patient_name}</strong></span>
              <span>Recipient Blood Group: <BloodGroupPill bloodGroup={selectedRequestForAlloc?.blood_group} /></span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Required: {selectedRequestForAlloc?.units_required} unit(s) of {selectedRequestForAlloc?.component_type}</span>
              <span>Facility: {selectedRequestForAlloc?.hospital_name}</span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Available Blood Unit for Allocation *</label>
            <select
              required
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              {availableUnits.map((u) => (
                <option key={u.unit_id} value={u.unit_id}>
                  Unit #{u.unit_id} | Group: {u.blood_group} | {u.component_type} | Expires: {u.expiry_date} ({u.hospital_name})
                </option>
              ))}
            </select>
          </div>

          {/* Real-time Compatibility Matrix Verification Check */}
          {selectedUnit && (
            <div className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
              isCompatibleSelection ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              <div className="flex items-center gap-2">
                {isCompatibleSelection ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                )}
                <div>
                  <p className="font-bold">
                    {isCompatibleSelection ? 'Blood Compatibility Verified' : 'Incompatible Blood Groups Warning!'}
                  </p>
                  <p className="text-[11px] opacity-90">
                    Donor Unit ({selectedUnit.blood_group}) &rarr; Recipient ({selectedRequestForAlloc.blood_group})
                  </p>
                </div>
              </div>
              <span className="font-mono font-bold text-xs uppercase px-2 py-0.5 rounded bg-white">
                {isCompatibleSelection ? 'COMPATIBLE' : 'INCOMPATIBLE'}
              </span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Staff Allocation Notes & Traceability</label>
            <input
              type="text"
              value={allocationNotes}
              onChange={(e) => setAllocationNotes(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          {/* Transaction Outcome Alert */}
          {allocationResult && (
            <div className={`p-3 rounded-lg border text-xs ${
              allocationResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <p className="font-bold">{allocationResult.success ? 'COMMIT SUCCESSFUL' : 'TRANSACTION ROLLBACK'}</p>
              <p className="mt-0.5">{allocationResult.message}</p>
            </div>
          )}

          <div className="pt-4 border-t flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAllocateModalOpen(false)}
              className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={!isCompatibleSelection}
              className={`px-4 py-2 font-bold rounded-lg text-white shadow-sm transition-all ${
                isCompatibleSelection ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-400 cursor-not-allowed'
              }`}
            >
              Execute ACID Allocation
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Blood Request Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Inpatient Blood Transfusion Request">
        <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Patient *</label>
            <select
              required
              value={requestForm.patient_id}
              onChange={(e) => {
                const ptId = parseInt(e.target.value, 10);
                const pt = patients.find((p) => p.patient_id === ptId);
                setRequestForm({
                  ...requestForm,
                  patient_id: ptId,
                  blood_group: pt ? pt.blood_group : requestForm.blood_group,
                });
              }}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              {patients.map((p) => (
                <option key={p.patient_id} value={p.patient_id}>
                  #{p.patient_id} - {p.name} ({p.blood_group}) - {p.hospital_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Requested Blood Group *</label>
              <select
                value={requestForm.blood_group}
                onChange={(e) => setRequestForm({ ...requestForm, blood_group: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none font-bold"
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Component Type *</label>
              <select
                value={requestForm.component_type}
                onChange={(e) => setRequestForm({ ...requestForm, component_type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="WHOLE_BLOOD">Whole Blood</option>
                <option value="RBC">Packed RBC</option>
                <option value="PLATELETS">Platelets</option>
                <option value="PLASMA">Fresh Frozen Plasma</option>
                <option value="CRYO">Cryoprecipitate</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Units Required (CHECK &gt; 0) *</label>
              <input
                type="number"
                min="1"
                required
                value={requestForm.units_required}
                onChange={(e) => setRequestForm({ ...requestForm, units_required: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Urgency Level Triage *</label>
              <select
                value={requestForm.urgency_level}
                onChange={(e) => setRequestForm({ ...requestForm, urgency_level: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none font-bold text-rose-700"
              >
                <option value="CRITICAL">CRITICAL (Immediate)</option>
                <option value="HIGH">HIGH (&lt; 6 Hours)</option>
                <option value="MEDIUM">MEDIUM (&lt; 24 Hours)</option>
                <option value="ROUTINE">ROUTINE (Elective Standby)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hospital Facility *</label>
              <select
                value={requestForm.hospital_id}
                onChange={(e) => setRequestForm({ ...requestForm, hospital_id: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {hospitals.map((h) => (
                  <option key={h.hospital_id} value={h.hospital_id}>{h.hospital_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Required By Timestamp *</label>
              <input
                type="datetime-local"
                required
                value={requestForm.required_by_date}
                onChange={(e) => setRequestForm({ ...requestForm, required_by_date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Clinical Indication</label>
            <textarea
              rows="2"
              value={requestForm.clinical_indication}
              onChange={(e) => setRequestForm({ ...requestForm, clinical_indication: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 shadow-sm"
            >
              Submit Blood Request
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BloodRequests;

