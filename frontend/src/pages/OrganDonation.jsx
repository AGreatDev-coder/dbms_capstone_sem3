import React, { useState, useEffect } from 'react';
import api from '../services/api';
import PageHeader from '../components/common/PageHeader';
import PageState from '../components/common/PageState';
import Tabs from '../components/common/Tabs';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { Input, Select, Textarea } from '../components/common/FormControls';
import StatusDot from '../components/common/StatusDot';
import BloodGroupStamp from '../components/common/BloodGroupStamp';
import { Sparkles, Plus, FileCheck, CheckCircle2 } from 'lucide-react';
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
  const [error, setError] = useState(null);

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
        setDonors(dRes.data.donors || []);
        if (dRes.data.donors?.length > 0) {
          setPledgeForm((prev) => ({ ...prev, donor_id: dRes.data.donors[0].donor_id }));
        }
      }
      if (pRes.data?.success) {
        setPatients(pRes.data.patients || []);
        if (pRes.data.patients?.length > 0) {
          setRequestForm((prev) => ({
            ...prev,
            patient_id: pRes.data.patients[0].patient_id,
            recipient_blood_group: pRes.data.patients[0].blood_group,
          }));
        }
      }
      if (hRes.data?.success) setHospitals(hRes.data.hospitals || []);
    } catch (err) {
      console.error('Initial data fetch error:', err);
    }
  };

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/organ/matches');
      if (res.data?.success) setMatches(res.data.matches || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load organ candidate matches.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDonations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/organ/donations');
      if (res.data?.success) setDonations(res.data.donations || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load pledged organ registry.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/organ/requests');
      if (res.data?.success) setRequests(res.data.requests || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load organ recipient waitlist.');
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
        fetchRequests();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create request');
    }
  };

  const tabs = [
    { id: 'matches', label: 'Candidate Matches & Verification', count: matches.length },
    { id: 'donations', label: 'Pledged Organs Ledger', count: donations.length },
    { id: 'requests', label: 'Recipient Waiting List', count: requests.length },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['06 TRANSPLANT', 'ORGAN NETWORK']}
        title="Organ Donor Network"
        description="Candidate matching engine, solid organ pledges, recipient waiting lists, and HLA compatibility scoring."
        action={
          <div className="flex items-center gap-2">
            {(user?.role === 'ADMIN' || user?.role === 'STAFF' || user?.role === 'DEVELOPER') && (
              <Button
                variant="secondary"
                size="sm"
                icon={Sparkles}
                onClick={handleGenerateMatches}
              >
                Evaluate Candidate Pairs
              </Button>
            )}

            {(user?.role === 'ADMIN' || user?.role === 'STAFF' || user?.role === 'DONOR' || user?.role === 'DEVELOPER') && (
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => setIsPledgeModalOpen(true)}
              >
                Pledge Organ
              </Button>
            )}
          </div>
        }
      />

      {/* Facility Scope Indicator */}
      {user?.role !== 'DEVELOPER' && user?.hospital_name && (
        <div className="p-3 border border-rule bg-surface rounded-[2px] flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blood" />
            <span className="text-muted">Waitlist & Matching Scoped To:</span>
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
            <span className="font-bold">Developer Master Transplant Oversight:</span>
            <span>Universal recipient waiting list, donor pledges, and HLA scoring across all centers</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 border border-moss/40 bg-paper text-moss">
            DEVELOPER ACCESS
          </span>
        </div>
      )}

      {/* Academic Demonstration Disclaimer */}
      <div className="p-3 border border-rule bg-surface text-xs space-y-1">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-ink font-semibold">
          <span>Academic Demonstration Disclaimer</span>
        </div>
        <p className="text-muted leading-relaxed">
          This system models relational candidate pairing and compatibility scoring for academic evaluation only. 
          Generated matches are designated as <strong className="font-mono text-ink">PENDING_VERIFICATION</strong> and 
          never automatically allocated. All clinical transplants require external review and authorization by certified boards.
        </p>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab 1: Candidate Matches */}
      {activeTab === 'matches' && (
        <PageState
          loading={loading}
          error={error}
          onRetry={fetchMatches}
          empty={matches.length === 0}
          emptyMessage="No candidate matches recorded. Click 'Evaluate Candidate Pairs' to run cross-matching."
        >
          <div className="border border-rule bg-surface overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-rule bg-paper/60 text-[10px] font-mono uppercase tracking-wider text-muted">
                  <th className="py-2.5 px-3 font-semibold">Match ID</th>
                  <th className="py-2.5 px-3 font-semibold">Organ</th>
                  <th className="py-2.5 px-3 font-semibold">Pledging Donor</th>
                  <th className="py-2.5 px-3 font-semibold">Waiting Recipient</th>
                  <th className="py-2.5 px-3 font-semibold">Center</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Score</th>
                  <th className="py-2.5 px-3 font-semibold">Compatibility</th>
                  <th className="py-2.5 px-3 font-semibold">Verification</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Board Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule font-sans">
                {matches.map((m) => (
                  <tr key={m.match_id} className="hover:bg-paper/40 transition-colors h-11">
                    <td className="py-2 px-3 font-mono font-semibold text-ink">
                      #{m.match_id}
                    </td>
                    <td className="py-2 px-3">
                      <span className="font-mono text-[11px] font-semibold text-ink">
                        {m.organ_type}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="font-medium text-ink">{m.donor_name}</div>
                      <div className="text-[10px] font-mono text-muted">
                        {m.donor_blood_group} &bull; {m.donor_hla}
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <div className="font-medium text-ink">{m.patient_name}</div>
                      <div className="text-[10px] font-mono text-muted">
                        {m.patient_blood_group} &bull; {m.patient_hla}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-muted text-[11px]">
                      {m.hospital_name}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-ink text-right text-xs">
                      {m.match_score}%
                    </td>
                    <td className="py-2 px-3">
                      <StatusDot status={m.compatibility_status} />
                    </td>
                    <td className="py-2 px-3">
                      <StatusDot status={m.verification_status} />
                      {m.verified_by_name && (
                        <span className="block text-[10px] text-moss font-mono mt-0.5">
                          via {m.verified_by_name}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={FileCheck}
                          onClick={() => handleOpenVerify(m)}
                        >
                          Review
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PageState>
      )}

      {/* Tab 2: Pledged Organs */}
      {activeTab === 'donations' && (
        <PageState
          loading={loading}
          error={error}
          onRetry={fetchDonations}
          empty={donations.length === 0}
          emptyMessage="No organ pledges registered."
        >
          <div className="border border-rule bg-surface overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-rule bg-paper/60 text-[10px] font-mono uppercase tracking-wider text-muted">
                  <th className="py-2.5 px-3 font-semibold">Pledge ID</th>
                  <th className="py-2.5 px-3 font-semibold">Organ</th>
                  <th className="py-2.5 px-3 font-semibold">Donor Name</th>
                  <th className="py-2.5 px-3 font-semibold">Blood Group</th>
                  <th className="py-2.5 px-3 font-semibold">Registered</th>
                  <th className="py-2.5 px-3 font-semibold">HLA Typing</th>
                  <th className="py-2.5 px-3 font-semibold">Clearance</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule font-sans">
                {donations.map((d) => (
                  <tr key={d.organ_donation_id} className="hover:bg-paper/40 transition-colors h-10">
                    <td className="py-2 px-3 font-mono font-semibold text-ink">
                      #{d.organ_donation_id}
                    </td>
                    <td className="py-2 px-3 font-mono font-semibold text-ink">
                      {d.organ_type}
                    </td>
                    <td className="py-2 px-3 font-medium text-ink">
                      {d.donor_name}
                    </td>
                    <td className="py-2 px-3">
                      <BloodGroupStamp bloodGroup={d.blood_group} size="sm" />
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-muted">
                      {d.registration_date}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-muted">
                      {d.hla_type}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px]">
                      {d.medical_clearance ? (
                        <span className="text-moss font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Cleared
                        </span>
                      ) : (
                        <span className="text-muted">Pending</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <StatusDot status={d.donation_status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PageState>
      )}

      {/* Tab 3: Recipient Waiting List */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setIsRequestModalOpen(true)}
            >
              Add Recipient to Waitlist
            </Button>
          </div>

          <PageState
            loading={loading}
            error={error}
            onRetry={fetchRequests}
            empty={requests.length === 0}
            emptyMessage="No recipients currently queued on the organ waiting list."
          >
            <div className="border border-rule bg-surface overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-rule bg-paper/60 text-[10px] font-mono uppercase tracking-wider text-muted">
                    <th className="py-2.5 px-3 font-semibold">Request ID</th>
                    <th className="py-2.5 px-3 font-semibold">Patient Name</th>
                    <th className="py-2.5 px-3 font-semibold">Organ</th>
                    <th className="py-2.5 px-3 font-semibold">Blood Group</th>
                    <th className="py-2.5 px-3 font-semibold">Center</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Score (1-100)</th>
                    <th className="py-2.5 px-3 font-semibold">Urgency</th>
                    <th className="py-2.5 px-3 font-semibold">Date</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule font-sans">
                  {requests.map((r) => (
                    <tr key={r.organ_request_id} className="hover:bg-paper/40 transition-colors h-10">
                      <td className="py-2 px-3 font-mono font-semibold text-ink">
                        #{r.organ_request_id}
                      </td>
                      <td className="py-2 px-3 font-medium text-ink">
                        {r.patient_name}
                      </td>
                      <td className="py-2 px-3 font-mono font-semibold text-ink">
                        {r.organ_type}
                      </td>
                      <td className="py-2 px-3">
                        <BloodGroupStamp bloodGroup={r.recipient_blood_group} size="sm" />
                      </td>
                      <td className="py-2 px-3 text-muted text-[11px]">
                        {r.hospital_name}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-ink text-right">
                        {r.medical_urgency_score}
                      </td>
                      <td className="py-2 px-3">
                        <StatusDot status={r.urgency_level} />
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px] text-muted">
                        {r.request_date}
                      </td>
                      <td className="py-2 px-3">
                        <StatusDot status={r.request_status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PageState>
        </div>
      )}

      {/* Verify Match Modal */}
      <Modal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        title={`Medical Board Verification: Match #${selectedMatch?.match_id}`}
        subtitle="Clinical ethics review for solid organ transplant matching"
      >
        <form onSubmit={handleUpdateVerification} className="space-y-4">
          <div className="p-3 border border-rule bg-paper space-y-1 font-mono text-xs">
            <div className="font-semibold text-ink">
              {selectedMatch?.organ_type} Candidate Pair
            </div>
            <div className="text-muted text-[11px]">
              Donor: {selectedMatch?.donor_name} ({selectedMatch?.donor_blood_group}) &rarr; Recipient: {selectedMatch?.patient_name} ({selectedMatch?.patient_blood_group})
            </div>
            <div className="text-muted text-[11px]">
              Algorithmic Compatibility Score: <span className="font-bold text-ink">{selectedMatch?.match_score}%</span>
            </div>
          </div>

          <Select
            label="Verification Decision"
            required
            value={verifyForm.verification_status}
            onChange={(e) => setVerifyForm({ ...verifyForm, verification_status: e.target.value })}
            options={[
              { value: 'PENDING_VERIFICATION', label: 'Pending Further Clinical Review' },
              { value: 'VERIFIED_BY_COMMITTEE', label: 'Verified by Medical Ethics Committee' },
              { value: 'TRANSPLANT_SCHEDULED', label: 'Transplant Scheduled' },
              { value: 'REJECTED', label: 'Rejected by Committee (Clinical Mismatch)' },
            ]}
          />

          <Textarea
            label="Board Review Notes & Clinical Decision"
            required
            rows={3}
            value={verifyForm.medical_notes}
            onChange={(e) => setVerifyForm({ ...verifyForm, medical_notes: e.target.value })}
          />

          <div className="pt-3 border-t border-rule flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsVerifyModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Commit Board Decision
            </Button>
          </div>
        </form>
      </Modal>

      {/* Pledge Organ Modal */}
      <Modal
        isOpen={isPledgeModalOpen}
        onClose={() => setIsPledgeModalOpen(false)}
        title="Pledge Organ Donation"
        subtitle="Registers 1:N organ pledge against verified donor profile."
      >
        <form onSubmit={handleCreatePledge} className="space-y-4">
          <Select
            label="Select Donor"
            required
            value={pledgeForm.donor_id}
            onChange={(e) => setPledgeForm({ ...pledgeForm, donor_id: e.target.value })}
            options={donors.map((d) => ({
              value: d.donor_id,
              label: `#${d.donor_id} - ${d.name} (${d.blood_group}) - ${d.donor_type}`,
            }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Pledged Organ Type"
              required
              value={pledgeForm.organ_type}
              onChange={(e) => setPledgeForm({ ...pledgeForm, organ_type: e.target.value })}
              options={[
                { value: 'KIDNEY', label: 'Kidney' },
                { value: 'LIVER', label: 'Liver' },
                { value: 'HEART', label: 'Heart' },
                { value: 'LUNG', label: 'Lung' },
                { value: 'PANCREAS', label: 'Pancreas' },
                { value: 'CORNEA', label: 'Cornea' },
              ]}
            />
            <Input
              label="HLA Typing"
              value={pledgeForm.hla_type}
              onChange={(e) => setPledgeForm({ ...pledgeForm, hla_type: e.target.value })}
              placeholder="e.g. HLA-A2, B7, DR4"
            />
          </div>

          <Textarea
            label="Clinical Clearance Notes"
            rows={2}
            value={pledgeForm.clinical_notes}
            onChange={(e) => setPledgeForm({ ...pledgeForm, clinical_notes: e.target.value })}
          />

          <div className="pt-3 border-t border-rule flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsPledgeModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Register Pledge
            </Button>
          </div>
        </form>
      </Modal>

      {/* Recipient Request Modal */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="Register Organ Recipient Request"
        subtitle="Appends candidate to waiting list with urgency priority."
      >
        <form onSubmit={handleCreateRequest} className="space-y-4">
          <Select
            label="Recipient Patient"
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
            options={patients.map((p) => ({
              value: p.patient_id,
              label: `#${p.patient_id} - ${p.name} (${p.blood_group})`,
            }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Requested Organ"
              required
              value={requestForm.organ_type}
              onChange={(e) => setRequestForm({ ...requestForm, organ_type: e.target.value })}
              options={[
                { value: 'KIDNEY', label: 'Kidney' },
                { value: 'LIVER', label: 'Liver' },
                { value: 'HEART', label: 'Heart' },
                { value: 'LUNG', label: 'Lung' },
                { value: 'PANCREAS', label: 'Pancreas' },
                { value: 'CORNEA', label: 'Cornea' },
              ]}
            />
            <Select
              label="Hospital Center"
              required
              value={requestForm.hospital_id}
              onChange={(e) => setRequestForm({ ...requestForm, hospital_id: parseInt(e.target.value, 10) })}
              options={hospitals.map((h) => ({
                value: h.hospital_id,
                label: h.hospital_name,
              }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Medical Urgency Score (1-100)"
              type="number"
              min="1"
              max="100"
              required
              value={requestForm.medical_urgency_score}
              onChange={(e) => setRequestForm({ ...requestForm, medical_urgency_score: parseInt(e.target.value, 10) })}
            />
            <Select
              label="Urgency Level"
              required
              value={requestForm.urgency_level}
              onChange={(e) => setRequestForm({ ...requestForm, urgency_level: e.target.value })}
              options={[
                { value: 'CRITICAL', label: 'Critical' },
                { value: 'HIGH', label: 'High' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'ROUTINE', label: 'Routine' },
              ]}
            />
          </div>

          <div className="pt-3 border-t border-rule flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsRequestModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Add to Waitlist
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default OrganDonation;
