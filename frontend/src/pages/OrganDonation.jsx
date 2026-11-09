import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { BloodGroupPill, StatusBadge } from '../components/Badge';
import {
  HeartPulse,
  Plus,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  FileCheck,
  AlertCircle,
  Activity,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const OrganDonation = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('matches');
  const [matches, setMatches] = useState([]);
  const [donations, setDonations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [donors, setDonors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isPledgeModalOpen, setIsPledgeModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

  // Forms
  const [pledgeForm, setPledgeForm] = useState({
    donor_id: '',
    organ_type: 'KIDNEY',
    hla_type: 'HLA-A2, B7, DR4',
    clinical_notes: 'Voluntary pledged organ donor.',
  });

  const [requestForm, setRequestForm] = useState({
    patient_id: '',
    hospital_id: 1,
    organ_type: 'KIDNEY',
    recipient_blood_group: 'O+',
    urgency_level: 'HIGH',
    hla_type: 'HLA-A2, B7, DR4',
    medical_urgency_score: 85,
  });

  const [verifyForm, setVerifyForm] = useState({
    verification_status: 'VERIFIED_BY_COMMITTEE',
    medical_notes: 'Reviewed by Medical Ethics Committee. Tissue crossmatch confirmed negative.',
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'matches') fetchMatches();
    if (activeTab === 'donations') fetchDonations();
    if (activeTab === 'requests') fetchRequests();
  }, [activeTab]);

  const fetchInitialData = async () => {
    try {
      const [dRes, pRes, hRes] = await Promise.all([
        api.get('/donors'),
        api.get('/patients'),
        api.get('/hospitals'),
      ]);
      if (dRes.data?.success) {
        setDonors(dRes.data.donors);
        if (dRes.data.donors.length > 0) {
          setPledgeForm((prev) => ({ ...prev, donor_id: dRes.data.donors[0].donor_id }));
        }
      }
      if (pRes.data?.success) {
        setPatients(pRes.data.patients);
        if (pRes.data.patients.length > 0) {
          setRequestForm((prev) => ({
            ...prev,
            patient_id: pRes.data.patients[0].patient_id,
            recipient_blood_group: pRes.data.patients[0].blood_group,
          }));
        }
      }
      if (hRes.data?.success) setHospitals(hRes.data.hospitals);
    } catch (err) {
      console.error('Initial data fetch error:', err);
    }
  };

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const res = await api.get('/organ/matches');
      if (res.data?.success) setMatches(res.data.matches);
    } catch (err) {
      console.error('Matches fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/organ/donations');
      if (res.data?.success) setDonations(res.data.donations);
    } catch (err) {
      console.error('Donations fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/organ/requests');
      if (res.data?.success) setRequests(res.data.requests);
    } catch (err) {
      console.error('Requests fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMatches = async () => {
    try {
      const res = await api.post('/organ/matches/generate');
      if (res.data?.success) {
        alert(res.data.message);
        fetchMatches();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate matches');
    }
  };

  const handleOpenVerify = (match) => {
    setSelectedMatch(match);
    setVerifyForm({
      verification_status: match.verification_status || 'VERIFIED_BY_COMMITTEE',
      medical_notes: match.medical_notes || 'Crossmatch verified by attending transplant physician.',
    });
    setIsVerifyModalOpen(true);
  };

  const handleUpdateVerification = async (e) => {
    e.preventDefault();
    if (!selectedMatch) return;
    try {
      const res = await api.put(`/organ/matches/${selectedMatch.match_id}/verify`, verifyForm);
      if (res.data?.success) {
        setIsVerifyModalOpen(false);
        fetchMatches();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update verification status');
    }
  };

  const handleCreatePledge = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/organ/donations', pledgeForm);
      if (res.data?.success) {
        setIsPledgeModalOpen(false);
        alert(res.data.message);
        fetchDonations();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to register pledge');
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/organ/requests', requestForm);
      if (res.data?.success) {
        setIsRequestModalOpen(false);
        alert(res.data.message);
        fetchRequests();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create request');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Organ Donation & Candidate Matching Network</h1>
          <p className="text-xs text-slate-500 mt-1">
            Illustrative matching engine subject to medical board review, tracking pledges, waiting lists, and HLA compatibility.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
            <button
              onClick={handleGenerateMatches}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Evaluate Candidate Pairs</span>
            </button>
          )}

          {(user?.role === 'ADMIN' || user?.role === 'STAFF' || user?.role === 'DONOR') && (
            <button
              onClick={() => setIsPledgeModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-brand-600 text-white hover:bg-brand-700 shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Pledge Organ</span>
            </button>
          )}
        </div>
      </div>

      {/* Mandatory Clinical Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-950 flex items-start gap-3">
        <Activity className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Academic Demonstration System Disclaimer (Section 1 & 7)</p>
          <p className="text-purple-800 mt-0.5 leading-relaxed">
            This module illustrates relational candidate pairing and compatibility scoring for academic evaluation only.
            Matches are strictly designated as <strong>PENDING_VERIFICATION</strong> upon generation and <strong>never automatically approved</strong>.
            All transplant allocations require human review and authorization by certified medical boards.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs">
        <button
          onClick={() => setActiveTab('matches')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold border-b-2 transition-all ${
            activeTab === 'matches'
              ? 'border-purple-600 text-purple-700 bg-purple-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-purple-600" />
          <span>Candidate Matches & Verification ({matches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('donations')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold border-b-2 transition-all ${
            activeTab === 'donations'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HeartPulse className="w-4 h-4" />
          <span>Pledged Organs ({donations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold border-b-2 transition-all ${
            activeTab === 'requests'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Recipient Waiting List ({requests.length})</span>
        </button>
      </div>

      {/* TAB 1: CANDIDATE MATCHES & VERIFICATION */}
      {activeTab === 'matches' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-purple-50/50 border-b border-purple-200 text-purple-900 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Match ID</th>
                  <th className="py-3 px-4">Organ Type</th>
                  <th className="py-3 px-4">Pledging Donor</th>
                  <th className="py-3 px-4">Waiting Recipient</th>
                  <th className="py-3 px-4">Center</th>
                  <th className="py-3 px-4">Compatibility Score</th>
                  <th className="py-3 px-4">Compatibility Status</th>
                  <th className="py-3 px-4">Verification Status</th>
                  <th className="py-3 px-4 text-right">Medical Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {matches.map((m) => (
                  <tr key={m.match_id} className="hover:bg-purple-50/20">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">#{m.match_id}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                        {m.organ_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      <div>{m.donor_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Blood: {m.donor_blood_group} | HLA: {m.donor_hla}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      <div>{m.patient_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Blood: {m.patient_blood_group} | HLA: {m.patient_hla}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{m.hospital_name}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 text-sm">
                      {m.match_score}%
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={m.compatibility_status} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={m.verification_status} />
                      {m.verified_by_name && (
                        <span className="block text-[10px] text-emerald-700 font-medium mt-0.5">
                          Verified by {m.verified_by_name}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
                        <button
                          onClick={() => handleOpenVerify(m)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded bg-slate-800 hover:bg-slate-900 text-white transition-colors"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Review & Verify</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PLEDGED ORGANS TABLE */}
      {activeTab === 'donations' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Pledge ID</th>
                  <th className="py-3 px-4">Organ Type</th>
                  <th className="py-3 px-4">Donor Name</th>
                  <th className="py-3 px-4">Blood Group</th>
                  <th className="py-3 px-4">Registration Date</th>
                  <th className="py-3 px-4">HLA Typing</th>
                  <th className="py-3 px-4">Medical Clearance</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {donations.map((d) => (
                  <tr key={d.organ_donation_id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">#{d.organ_donation_id}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{d.organ_type}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{d.donor_name}</td>
                    <td className="py-3 px-4">
                      <BloodGroupPill bloodGroup={d.blood_group} />
                    </td>
                    <td className="py-3 px-4 text-slate-500">{d.registration_date}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{d.hla_type}</td>
                    <td className="py-3 px-4">
                      {d.medical_clearance ? (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Cleared
                        </span>
                      ) : (
                        <span className="text-slate-400">Pending</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={d.donation_status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: RECIPIENT WAITING LIST */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-brand-600 text-white hover:bg-brand-700 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Recipient to Waiting List</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Request ID</th>
                    <th className="py-3 px-4">Patient Name</th>
                    <th className="py-3 px-4">Requested Organ</th>
                    <th className="py-3 px-4">Blood Group</th>
                    <th className="py-3 px-4">Hospital Center</th>
                    <th className="py-3 px-4">Urgency Score (1-100)</th>
                    <th className="py-3 px-4">Urgency Level</th>
                    <th className="py-3 px-4">Request Date</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map((r) => (
                    <tr key={r.organ_request_id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">#{r.organ_request_id}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{r.patient_name}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{r.organ_type}</td>
                      <td className="py-3 px-4">
                        <BloodGroupPill bloodGroup={r.recipient_blood_group} />
                      </td>
                      <td className="py-3 px-4 text-slate-600">{r.hospital_name}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.medical_urgency_score} / 100</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={r.urgency_level} />
                      </td>
                      <td className="py-3 px-4 text-slate-500">{r.request_date}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={r.request_status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Verify Match Modal */}
      <Modal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        title={`Medical Board Verification: Match #${selectedMatch?.match_id}`}
      >
        <form onSubmit={handleUpdateVerification} className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200 space-y-1">
            <p className="font-bold text-slate-900">
              {selectedMatch?.organ_type} Transplant Candidate Pair
            </p>
            <p className="text-slate-600">
              Donor: <strong>{selectedMatch?.donor_name}</strong> ({selectedMatch?.donor_blood_group}) &rarr; Recipient: <strong>{selectedMatch?.patient_name}</strong> ({selectedMatch?.patient_blood_group})
            </p>
            <p className="text-slate-600">
              Evaluated Compatibility Score: <strong>{selectedMatch?.match_score}%</strong>
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Verification Status *</label>
            <select
              value={verifyForm.verification_status}
              onChange={(e) => setVerifyForm({ ...verifyForm, verification_status: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none font-bold"
            >
              <option value="PENDING_VERIFICATION">Pending Further Clinical Review</option>
              <option value="VERIFIED_BY_COMMITTEE">Verified by Medical Ethics Committee</option>
              <option value="TRANSPLANT_SCHEDULED">Transplant Scheduled</option>
              <option value="REJECTED">Rejected by Committee (Clinical Mismatch)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Board Review Notes & Clinical Decision</label>
            <textarea
              rows="3"
              required
              value={verifyForm.medical_notes}
              onChange={(e) => setVerifyForm({ ...verifyForm, medical_notes: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsVerifyModalOpen(false)}
              className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 shadow-sm"
            >
              Commit Verification Decision
            </button>
          </div>
        </form>
      </Modal>

      {/* Pledge Organ Modal */}
      <Modal isOpen={isPledgeModalOpen} onClose={() => setIsPledgeModalOpen(false)} title="Pledge Organ Donation">
        <form onSubmit={handleCreatePledge} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Donor *</label>
            <select
              required
              value={pledgeForm.donor_id}
              onChange={(e) => setPledgeForm({ ...pledgeForm, donor_id: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              {donors.map((d) => (
                <option key={d.donor_id} value={d.donor_id}>
                  #{d.donor_id} - {d.name} ({d.blood_group}) - {d.donor_type}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pledged Organ Type *</label>
              <select
                value={pledgeForm.organ_type}
                onChange={(e) => setPledgeForm({ ...pledgeForm, organ_type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none font-bold"
              >
                <option value="KIDNEY">Kidney</option>
                <option value="LIVER">Liver</option>
                <option value="HEART">Heart</option>
                <option value="LUNG">Lung</option>
                <option value="PANCREAS">Pancreas</option>
                <option value="CORNEA">Cornea</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">HLA Typing</label>
              <input
                type="text"
                value={pledgeForm.hla_type}
                onChange={(e) => setPledgeForm({ ...pledgeForm, hla_type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                placeholder="e.g. HLA-A2, B7, DR4"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Clinical Clearance Notes</label>
            <textarea
              rows="2"
              value={pledgeForm.clinical_notes}
              onChange={(e) => setPledgeForm({ ...pledgeForm, clinical_notes: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsPledgeModalOpen(false)}
              className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 shadow-sm"
            >
              Register Pledge
            </button>
          </div>
        </form>
      </Modal>

      {/* Recipient Request Modal */}
      <Modal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} title="Register Organ Recipient Request">
        <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Recipient Patient *</label>
            <select
              required
              value={requestForm.patient_id}
              onChange={(e) => {
                const ptId = parseInt(e.target.value, 10);
                const pt = patients.find((p) => p.patient_id === ptId);
                setRequestForm({
                  ...requestForm,
                  patient_id: ptId,
                  recipient_blood_group: pt ? pt.blood_group : requestForm.recipient_blood_group,
                });
              }}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              {patients.map((p) => (
                <option key={p.patient_id} value={p.patient_id}>
                  #{p.patient_id} - {p.name} ({p.blood_group})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Requested Organ *</label>
              <select
                value={requestForm.organ_type}
                onChange={(e) => setRequestForm({ ...requestForm, organ_type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none font-bold"
              >
                <option value="KIDNEY">Kidney</option>
                <option value="LIVER">Liver</option>
                <option value="HEART">Heart</option>
                <option value="LUNG">Lung</option>
                <option value="PANCREAS">Pancreas</option>
                <option value="CORNEA">Cornea</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hospital Center *</label>
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Medical Urgency Score (1-100) *</label>
              <input
                type="number"
                min="1"
                max="100"
                required
                value={requestForm.medical_urgency_score}
                onChange={(e) => setRequestForm({ ...requestForm, medical_urgency_score: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Urgency Level *</label>
              <select
                value={requestForm.urgency_level}
                onChange={(e) => setRequestForm({ ...requestForm, urgency_level: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="ROUTINE">Routine</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsRequestModalOpen(false)}
              className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 shadow-sm"
            >
              Add to Waitlist
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default OrganDonation;

