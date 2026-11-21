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
import { 
  Plus, 
  Users, 
  Calendar, 
  MapPin, 
  Building2, 
  CheckCircle2, 
  Search, 
  UserPlus, 
  Heart, 
  Activity, 
  AlertCircle,
  Phone,
  Check,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DonationCamps = () => {
  const { user } = useAuth();
  const isDonorRole = user?.role === 'DONOR';
  const canManage = ['ADMIN', 'STAFF', 'DEVELOPER'].includes(user?.role);
  const isDeveloper = user?.role === 'DEVELOPER';

  // Active Tab: 'camps' | 'my-camps' | 'stats'
  const [activeTab, setActiveTab] = useState('camps');
  const [camps, setCamps] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [campStats, setCampStats] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [isCreateCampOpen, setIsCreateCampOpen] = useState(false);
  const [campFeedback, setCampFeedback] = useState(null);
  const [selectedCamp, setSelectedCamp] = useState(null);
  
  // Registration Modals
  const [isDonorSelfRegOpen, setIsDonorSelfRegOpen] = useState(false);
  const [donorRegFeedback, setDonorRegFeedback] = useState(null);

  const [isStaffRegOpen, setIsStaffRegOpen] = useState(false);
  const [staffRegMode, setStaffRegMode] = useState('existing'); // 'existing' | 'new'
  const [staffRegFeedback, setStaffRegFeedback] = useState(null);

  // Participants & Attendance Modal
  const [campParticipantsModal, setCampParticipantsModal] = useState(null);
  const [updatingRegId, setUpdatingRegId] = useState(null);

  // Common submission in-flight state
  const [submitting, setSubmitting] = useState(false);

  // Format local datetime for input (default tomorrow 09:00 to 18:00)
  const getTomorrowDateTime = (hours) => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(hours, 0, 0, 0);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Form: Organize New Camp
  const [campForm, setCampForm] = useState({
    camp_name: '',
    organizer: '',
    hospital_id: user?.hospital_id || 1,
    location: '',
    city: 'New Delhi',
    start_date: getTomorrowDateTime(9),
    end_date: getTomorrowDateTime(18),
    capacity: 200,
    contact_phone: '+91-11-26588500',
  });

  // Form: DONOR Self-Registration ("donor apni details bharega")
  const [donorSelfForm, setDonorSelfForm] = useState({
    blood_group: user?.blood_group || 'O+',
    weight_kg: '65',
    phone: '',
    medical_history_notes: 'Confirmed eligible voluntary donor signing up for community drive.',
  });

  // Form: Staff Register Existing Person
  const [searchQuery, setSearchQuery] = useState('');
  const [eligiblePersons, setEligiblePersons] = useState([]);
  const [searchingPersons, setSearchingPersons] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [existingPersonForm, setExistingPersonForm] = useState({
    blood_group: 'O+',
    weight_kg: '65',
    medical_history_notes: 'Enrolled from hospital database for community drive.',
  });

  // Form: Staff Register New Walk-in Participant ("Naya Banda")
  const [walkinForm, setWalkinForm] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '1998-05-15',
    gender: 'MALE',
    phone: '',
    email: '',
    address: 'City Center',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
    blood_group: 'O+',
    weight_kg: '65',
    medical_history_notes: 'Walk-in voluntary donor registered on-site at camp drive.',
  });

  useEffect(() => {
    fetchHospitals();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'camps') fetchCamps();
    if (activeTab === 'my-camps' && isDonorRole) fetchMyRegistrations();
    if (activeTab === 'stats') fetchCampStats();
  }, [activeTab]);

  const fetchHospitals = async () => {
    try {
      const res = await api.get('/hospitals');
      if (res.data?.success) {
        const list = res.data.hospitals || [];
        setHospitals(list);
        if (list.length > 0 && !user?.hospital_id) {
          setCampForm((prev) => ({ ...prev, hospital_id: list[0].hospital_id }));
        }
      }
    } catch (err) {
      console.error('Failed to load hospitals:', err);
    }
  };

  const fetchCamps = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/camps');
      if (res.data?.success) {
        setCamps(res.data.camps || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load donation camps.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRegistrations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/camps/my-registrations');
      if (res.data?.success) {
        setMyRegistrations(res.data.registrations || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your camp registrations.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCampStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/camps/stats');
      if (res.data?.success) setCampStats(res.data.stats || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load camp aggregates.');
    } finally {
      setLoading(false);
    }
  };

  // Search existing persons/donors for staff enrollment
  const searchEligiblePersons = async (q = '') => {
    try {
      setSearchingPersons(true);
      const res = await api.get('/camps/eligible-persons', { params: { q, limit: 15 } });
      if (res.data?.success) {
        setEligiblePersons(res.data.persons || []);
      }
    } catch (err) {
      console.error('Failed to search persons:', err);
    } finally {
      setSearchingPersons(false);
    }
  };

  // Open Organize Camp Modal
  const handleOpenCreateCamp = () => {
    setCampFeedback(null);
    setCampForm({
      camp_name: '',
      organizer: '',
      hospital_id: user?.hospital_id || (hospitals[0]?.hospital_id || 1),
      location: '',
      city: 'New Delhi',
      start_date: getTomorrowDateTime(9),
      end_date: getTomorrowDateTime(18),
      capacity: 200,
      contact_phone: '+91-11-26588500',
    });
    setIsCreateCampOpen(true);
  };

  // Submit Organize Camp Form
  const handleCreateCamp = async (e) => {
    e.preventDefault();
    if (!campForm.camp_name.trim() || !campForm.organizer.trim() || !campForm.location.trim()) {
      setCampFeedback({ type: 'error', message: 'Please fill in all required camp details.' });
      return;
    }
    if (new Date(campForm.end_date) <= new Date(campForm.start_date)) {
      setCampFeedback({ type: 'error', message: 'End date and time must be strictly after the start date and time.' });
      return;
    }
    try {
      setSubmitting(true);
      setCampFeedback(null);
      const res = await api.post('/camps', campForm);
      if (res.data?.success) {
        setIsCreateCampOpen(false);
        fetchCamps();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to schedule donation camp.';
      setCampFeedback({ type: 'error', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  // Open Donor Self-Registration Modal ("donor apni details bharega")
  const handleOpenDonorReg = (camp) => {
    setSelectedCamp(camp);
    setDonorRegFeedback(null);
    setDonorSelfForm({
      blood_group: user?.blood_group || 'O+',
      weight_kg: '65',
      phone: '',
      medical_history_notes: 'Confirmed eligible voluntary donor signing up for community drive.',
    });
    setIsDonorSelfRegOpen(true);
  };

  // Submit Donor Self-Registration
  const handleSubmitDonorSelfReg = async (e) => {
    e.preventDefault();
    if (!selectedCamp) return;
    if (Number(donorSelfForm.weight_kg) < 45) {
      setDonorRegFeedback({ type: 'error', message: 'Minimum clinical weight of 45 kg is required for donation.' });
      return;
    }
    try {
      setSubmitting(true);
      setDonorRegFeedback(null);
      const res = await api.post(`/camps/${selectedCamp.camp_id}/register`, donorSelfForm);
      if (res.data?.success) {
        setIsDonorSelfRegOpen(false);
        fetchCamps();
        if (activeTab === 'my-camps') fetchMyRegistrations();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to register for camp.';
      setDonorRegFeedback({ type: 'error', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  // Open Staff Participant Registration Modal
  const handleOpenStaffReg = (camp) => {
    setSelectedCamp(camp);
    setStaffRegFeedback(null);
    setSelectedPerson(null);
    setSearchQuery('');
    setStaffRegMode('existing');
    setIsStaffRegOpen(true);
    searchEligiblePersons('');
  };

  // Submit Staff Registration: Mode 1 (Existing Person)
  const handleStaffRegisterExisting = async (e) => {
    e.preventDefault();
    if (!selectedCamp || !selectedPerson) return;
    if (Number(existingPersonForm.weight_kg) < 45) {
      setStaffRegFeedback({ type: 'error', message: 'Minimum clinical weight of 45 kg is required for donation.' });
      return;
    }
    try {
      setSubmitting(true);
      setStaffRegFeedback(null);
      const payload = {
        person_id: selectedPerson.person_id,
        donor_id: selectedPerson.donor_id || undefined,
        blood_group: existingPersonForm.blood_group,
        weight_kg: existingPersonForm.weight_kg,
        medical_history_notes: existingPersonForm.medical_history_notes,
      };
      const res = await api.post(`/camps/${selectedCamp.camp_id}/register`, payload);
      if (res.data?.success) {
        setIsStaffRegOpen(false);
        fetchCamps();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to enroll participant.';
      setStaffRegFeedback({ type: 'error', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Staff Registration: Mode 2 (New Walk-in Participant - "Naya Banda")
  const handleStaffRegisterWalkin = async (e) => {
    e.preventDefault();
    if (!selectedCamp) return;
    if (!walkinForm.first_name.trim() || !walkinForm.last_name.trim() || !walkinForm.phone.trim()) {
      setStaffRegFeedback({ type: 'error', message: 'First name, last name, and phone number are required.' });
      return;
    }
    if (Number(walkinForm.weight_kg) < 45) {
      setStaffRegFeedback({ type: 'error', message: 'Minimum clinical weight of 45 kg is required.' });
      return;
    }
    try {
      setSubmitting(true);
      setStaffRegFeedback(null);
      const res = await api.post(`/camps/${selectedCamp.camp_id}/register`, walkinForm);
      if (res.data?.success) {
        setIsStaffRegOpen(false);
        fetchCamps();
        setWalkinForm({
          first_name: '',
          last_name: '',
          date_of_birth: '1998-05-15',
          gender: 'MALE',
          phone: '',
          email: '',
          address: 'City Center',
          city: 'New Delhi',
          state: 'Delhi',
          pincode: '110001',
          blood_group: 'O+',
          weight_kg: '65',
          medical_history_notes: 'Walk-in voluntary donor registered on-site at camp drive.',
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to register walk-in donor.';
      setStaffRegFeedback({ type: 'error', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  // Open View Participants & Attendance Modal
  const handleViewParticipants = async (camp) => {
    try {
      const res = await api.get(`/camps/${camp.camp_id}/donors`);
      if (res.data?.success) {
        setCampParticipantsModal({
          camp_id: camp.camp_id,
          camp_name: camp.camp_name,
          participants: res.data.donors || [],
        });
      }
    } catch (err) {
      console.error('Failed to load camp participants:', err);
    }
  };

  // Toggle Attendance and Record Units Donated (Staff / Admin)
  const handleUpdateAttendance = async (regId, attended, units) => {
    if (!campParticipantsModal) return;
    try {
      setUpdatingRegId(regId);
      const res = await api.put(`/camps/${campParticipantsModal.camp_id}/registrations/${regId}`, {
        attended,
        units_donated: units,
      });
      if (res.data?.success) {
        setCampParticipantsModal((prev) => ({
          ...prev,
          participants: prev.participants.map((p) =>
            p.registration_id === regId
              ? { ...p, attended, units_donated: units }
              : p
          ),
        }));
        fetchCamps();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update attendance.');
    } finally {
      setUpdatingRegId(null);
    }
  };

  // Tab definitions
  const tabs = isDonorRole
    ? [
        { id: 'camps', label: 'All Donation Camps', count: camps.length },
        { id: 'my-camps', label: 'My Registered Drives', count: myRegistrations.length },
        { id: 'stats', label: 'Camp Performance Aggregates (Query 7)', count: campStats.length },
      ]
    : [
        { id: 'camps', label: 'All Donation Camps', count: camps.length },
        { id: 'stats', label: 'Query 7: Camp Aggregates (HAVING >= 2)', count: campStats.length },
      ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['07 OUTREACH', 'CAMPS']}
        title="Donation Camps & Community Drives"
        description="Community blood drives modeled as an EER aggregation object linking donors, camps, and phlebotomy collections."
        action={
          canManage && (
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={handleOpenCreateCamp}
            >
              Organize Camp
            </Button>
          )
        }
      />

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* ============================================================== */}
      {/* TAB 1: ALL DONATION CAMPS */}
      {/* ============================================================== */}
      {activeTab === 'camps' && (
        <PageState
          loading={loading}
          error={error}
          onRetry={fetchCamps}
          empty={camps.length === 0}
          emptyMessage="No donation camps currently scheduled."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {camps.map((camp) => (
              <div
                key={camp.camp_id}
                className="border border-rule bg-surface p-4 space-y-3 font-sans transition-all hover:border-ink/30"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-rule">
                  <div>
                    <div className="font-mono text-[10px] text-muted uppercase">
                      Camp #{camp.camp_id} &bull; {camp.city}
                    </div>
                    <h3 className="font-serif text-base font-semibold text-ink leading-snug">
                      {camp.camp_name}
                    </h3>
                    <div className="text-xs text-muted mt-0.5">
                      Organized by <strong className="text-ink font-medium">{camp.organizer}</strong>
                    </div>
                  </div>
                  <StatusDot status={camp.camp_status} />
                </div>

                {/* Venue & Hospital Details */}
                <div className="space-y-1.5 text-xs text-muted">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-muted shrink-0" />
                    <span>{camp.location}, {camp.city}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-muted shrink-0" />
                    <span>{String(camp.start_date).slice(0, 10)} to {String(camp.end_date).slice(0, 10)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-muted shrink-0" />
                    <span>Partnering Facility: <strong className="text-ink font-medium">{camp.hospital_name}</strong></span>
                  </div>
                </div>

                {/* Metrics Matrix */}
                <div className="grid grid-cols-3 gap-2 py-2 border-y border-rule text-center font-mono">
                  <div>
                    <span className="text-[10px] uppercase text-muted block">Capacity Target</span>
                    <span className="text-xs font-semibold text-ink">{camp.capacity}</span>
                  </div>
                  <div
                    className="cursor-pointer hover:bg-paper/50 transition-colors"
                    onClick={() => handleViewParticipants(camp)}
                    title="Click to view registered participants"
                  >
                    <span className="text-[10px] uppercase text-muted block">Registered</span>
                    <span className="text-xs font-semibold text-ink underline">
                      {camp.registered_donors_count || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-muted block">Units Collected</span>
                    <span className="text-xs font-semibold text-blood">
                      {camp.total_donations_collected || 0}
                    </span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => handleViewParticipants(camp)}
                    className="text-xs text-muted hover:text-ink underline flex items-center gap-1 font-mono"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Participants ({camp.registered_donors_count || 0})</span>
                  </button>

                  {/* Actions by Role */}
                  {isDonorRole ? (
                    Number(camp.is_user_registered) === 1 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono bg-moss/10 text-moss border border-moss/30 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Registered for Drive ✓
                      </span>
                    ) : camp.camp_status === 'COMPLETED' ? (
                      <span className="text-xs font-mono text-muted">Drive Completed</span>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Heart}
                        onClick={() => handleOpenDonorReg(camp)}
                      >
                        Register for Camp
                      </Button>
                    )
                  ) : canManage ? (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={UserPlus}
                      onClick={() => handleOpenStaffReg(camp)}
                    >
                      Register Participant
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </PageState>
      )}

      {/* ============================================================== */}
      {/* TAB 2 (DONOR ROLE): MY REGISTERED CAMPS */}
      {/* ============================================================== */}
      {isDonorRole && activeTab === 'my-camps' && (
        <PageState
          loading={loading}
          error={error}
          onRetry={fetchMyRegistrations}
          empty={myRegistrations.length === 0}
          emptyMessage="You have not registered for any upcoming donation camps yet."
        >
          <div className="border border-rule bg-surface overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-rule bg-paper/60 text-[10px] font-mono uppercase tracking-wider text-muted">
                  <th className="py-2.5 px-3">Registration ID</th>
                  <th className="py-2.5 px-3">Camp Title</th>
                  <th className="py-2.5 px-3">Venue & City</th>
                  <th className="py-2.5 px-3">Hospital Organizer</th>
                  <th className="py-2.5 px-3">Camp Dates</th>
                  <th className="py-2.5 px-3">Registration Time</th>
                  <th className="py-2.5 px-3 text-center">Attendance</th>
                  <th className="py-2.5 px-3 text-right">Units Donated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule font-sans">
                {myRegistrations.map((r) => (
                  <tr key={r.registration_id} className="hover:bg-paper/40 h-10">
                    <td className="py-2 px-3 font-mono font-semibold text-ink">#{r.registration_id}</td>
                    <td className="py-2 px-3 font-medium text-ink">{r.camp_name}</td>
                    <td className="py-2 px-3 text-muted">{r.location}, {r.city}</td>
                    <td className="py-2 px-3 text-muted">{r.hospital_name}</td>
                    <td className="py-2 px-3 font-mono text-[11px] text-muted">
                      {String(r.start_date).slice(0, 10)} to {String(r.end_date).slice(0, 10)}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-muted">{String(r.registration_time).slice(0, 16)}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`px-2 py-0.5 text-[10px] font-mono border ${
                        r.attended ? 'bg-moss/10 text-moss border-moss/30' : 'bg-paper text-muted border-rule'
                      }`}>
                        {r.attended ? 'Attended ✓' : 'Registered'}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-blood text-right">
                      {r.units_donated > 0 ? `${r.units_donated} Unit(s)` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PageState>
      )}

      {/* ============================================================== */}
      {/* TAB 3: QUERY 7 PERFORMANCE AGGREGATES */}
      {/* ============================================================== */}
      {activeTab === 'stats' && (
        <div className="space-y-4">
          <div className="p-3 border border-rule bg-surface text-xs space-y-1">
            <div className="font-mono text-[11px] uppercase tracking-wider text-ink font-semibold">
              Query 7: Multi-Attribute Aggregates with GROUP BY & HAVING
            </div>
            <p className="text-muted leading-relaxed">
              Calculates <code className="font-mono text-ink">COUNT(bd.donation_id)</code>, 
              <code className="font-mono text-ink">SUM(bd.quantity_ml)</code>, 
              <code className="font-mono text-ink">AVG(bd.hemoglobin_level)</code>, 
              <code className="font-mono text-ink">MIN(bd.quantity_ml)</code>, and 
              <code className="font-mono text-ink">MAX(bd.quantity_ml)</code> across community blood drives.
            </p>
          </div>

          <PageState
            loading={loading}
            error={error}
            onRetry={fetchCampStats}
            empty={campStats.length === 0}
            emptyMessage="No camps currently satisfy HAVING COUNT(bd.donation_id) >= 2."
          >
            <div className="border border-rule bg-surface overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-rule bg-paper/60 text-[10px] font-mono uppercase tracking-wider text-muted">
                    <th className="py-2.5 px-3 font-semibold">Camp ID</th>
                    <th className="py-2.5 px-3 font-semibold">Camp Title</th>
                    <th className="py-2.5 px-3 font-semibold">Supervising Facility</th>
                    <th className="py-2.5 px-3 font-semibold text-right">COUNT (Units)</th>
                    <th className="py-2.5 px-3 font-semibold text-right">SUM (ml)</th>
                    <th className="py-2.5 px-3 font-semibold text-right">AVG (Hb g/dL)</th>
                    <th className="py-2.5 px-3 font-semibold text-right">MIN (ml)</th>
                    <th className="py-2.5 px-3 font-semibold text-right">MAX (ml)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule font-sans">
                  {campStats.map((st) => (
                    <tr key={st.camp_id} className="hover:bg-paper/40 transition-colors h-10 font-mono">
                      <td className="py-2 px-3 font-semibold text-ink">#{st.camp_id}</td>
                      <td className="py-2 px-3 font-sans font-medium text-ink">{st.camp_name}</td>
                      <td className="py-2 px-3 font-sans text-muted">{st.hospital_name}</td>
                      <td className="py-2 px-3 font-bold text-blood text-right">
                        {st.total_donations_collected}
                      </td>
                      <td className="py-2 px-3 text-right text-ink font-semibold">
                        {st.total_blood_collected_ml} ml
                      </td>
                      <td className="py-2 px-3 text-right text-moss font-semibold">
                        {st.average_donor_hemoglobin}
                      </td>
                      <td className="py-2 px-3 text-right text-muted">{st.min_donation_ml}</td>
                      <td className="py-2 px-3 text-right text-muted">{st.max_donation_ml}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PageState>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: DONOR SELF-REGISTRATION ("donor apni details bharega") */}
      {/* ============================================================== */}
      <Modal
        isOpen={isDonorSelfRegOpen}
        onClose={() => setIsDonorSelfRegOpen(false)}
        title={`Register for ${selectedCamp?.camp_name || 'Camp'}`}
        subtitle="Sign up as a voluntary blood donor for this scheduled community drive."
      >
        <form onSubmit={handleSubmitDonorSelfReg} className="space-y-4 text-xs font-sans">
          {donorRegFeedback && (
            <div className={`p-2.5 border text-xs ${
              donorRegFeedback.type === 'error' ? 'border-blood/40 bg-blood/5 text-blood' : 'border-moss/40 bg-moss/5 text-moss'
            }`}>
              {donorRegFeedback.message}
            </div>
          )}

          <div className="p-3 border border-rule bg-paper space-y-1">
            <span className="font-mono text-[10px] uppercase text-muted block">Selected Camp Drive</span>
            <div className="font-semibold text-ink text-sm">{selectedCamp?.camp_name}</div>
            <div className="text-muted text-[11px]">
              {selectedCamp?.location}, {selectedCamp?.city} &bull; Facility: {selectedCamp?.hospital_name}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Your Blood Group"
              required
              value={donorSelfForm.blood_group}
              onChange={(e) => setDonorSelfForm({ ...donorSelfForm, blood_group: e.target.value })}
              options={[
                { value: 'A+', label: 'A+' },
                { value: 'A-', label: 'A-' },
                { value: 'B+', label: 'B+' },
                { value: 'B-', label: 'B-' },
                { value: 'AB+', label: 'AB+' },
                { value: 'AB-', label: 'AB-' },
                { value: 'O+', label: 'O+' },
                { value: 'O-', label: 'O-' },
              ]}
            />

            <Input
              label="Current Weight (kg)"
              type="number"
              min="45"
              max="200"
              required
              value={donorSelfForm.weight_kg}
              onChange={(e) => setDonorSelfForm({ ...donorSelfForm, weight_kg: e.target.value })}
              helper="Min. 45 kg required"
            />
          </div>

          <Input
            label="Contact Helpline Phone"
            type="tel"
            placeholder="+91-..."
            value={donorSelfForm.phone}
            onChange={(e) => setDonorSelfForm({ ...donorSelfForm, phone: e.target.value })}
            helper="Optional: provide contact number for on-site camp notifications"
          />

          <Textarea
            label="Health & Eligibility Confirmation"
            rows={2}
            value={donorSelfForm.medical_history_notes}
            onChange={(e) => setDonorSelfForm({ ...donorSelfForm, medical_history_notes: e.target.value })}
            helper="Confirm voluntary status, general fitness, and absence of active antibiotic therapy."
          />

          <div className="pt-3 border-t border-rule flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsDonorSelfRegOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              {submitting ? 'Registering...' : 'Confirm My Camp Registration'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 2: STAFF/ADMIN REGISTER PARTICIPANT (EXISTING vs NEW BANDA) */}
      {/* ============================================================== */}
      <Modal
        isOpen={isStaffRegOpen}
        onClose={() => setIsStaffRegOpen(false)}
        title={`Register Participant: ${selectedCamp?.camp_name || ''}`}
        subtitle="Enrolls participant into CampDonorRegistration junction table (EER Aggregation)."
      >
        <div className="space-y-4 text-xs font-sans">
          {/* Segmented Mode Selector */}
          <div className="grid grid-cols-2 gap-2 p-1 border border-rule bg-paper font-mono">
            <button
              type="button"
              onClick={() => {
                setStaffRegMode('existing');
                setStaffRegFeedback(null);
                searchEligiblePersons('');
              }}
              className={`py-1.5 px-3 text-xs font-medium transition-colors ${
                staffRegMode === 'existing'
                  ? 'bg-surface text-ink border border-rule shadow-sm font-semibold'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Mode 1: Existing User / Person
            </button>
            <button
              type="button"
              onClick={() => {
                setStaffRegMode('new');
                setStaffRegFeedback(null);
              }}
              className={`py-1.5 px-3 text-xs font-medium transition-colors ${
                staffRegMode === 'new'
                  ? 'bg-surface text-ink border border-rule shadow-sm font-semibold'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Mode 2: New Walk-in Participant (Naya Banda)
            </button>
          </div>

          {staffRegFeedback && (
            <div className={`p-2.5 border text-xs ${
              staffRegFeedback.type === 'error' ? 'border-blood/40 bg-blood/5 text-blood' : 'border-moss/40 bg-moss/5 text-moss'
            }`}>
              {staffRegFeedback.message}
            </div>
          )}

          {/* MODE 1: ENROLL EXISTING PERSON */}
          {staffRegMode === 'existing' && (
            <div className="space-y-4">
              {!selectedPerson ? (
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search registered persons or donors by name, phone, email..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        searchEligiblePersons(e.target.value);
                      }}
                      className="w-full h-9 pl-9 pr-3 border border-rule bg-paper text-ink text-xs focus:outline-none focus:border-ink font-mono"
                    />
                    <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
                  </div>

                  <div className="text-[11px] font-mono text-muted uppercase">
                    Select a registered Person or Donor to enroll:
                  </div>

                  {searchingPersons ? (
                    <div className="p-4 text-center text-xs text-muted font-mono">
                      Searching records in MySQL...
                    </div>
                  ) : eligiblePersons.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted border border-rule bg-paper">
                      No persons found matching your query.
                    </div>
                  ) : (
                    <div className="max-h-56 overflow-y-auto border border-rule divide-y divide-rule bg-surface">
                      {eligiblePersons.map((p) => (
                        <div
                          key={p.person_id}
                          onClick={() => {
                            setSelectedPerson(p);
                            setExistingPersonForm((prev) => ({
                              ...prev,
                              blood_group: p.blood_group || 'O+',
                            }));
                          }}
                          className="p-2.5 hover:bg-paper cursor-pointer flex items-center justify-between text-xs transition-colors"
                        >
                          <div>
                            <span className="font-semibold text-ink">{p.full_name}</span>
                            <span className="ml-2 font-mono text-[10px] text-muted">Person #{p.person_id}</span>
                            <div className="text-[11px] text-muted font-mono">
                              {p.phone} &bull; {p.email}
                            </div>
                          </div>
                          <div className="text-right">
                            <BloodGroupStamp bloodGroup={p.blood_group} size="sm" />
                            <span className={`block font-mono text-[10px] mt-0.5 ${
                              p.is_already_donor ? 'text-moss' : 'text-muted'
                            }`}>
                              {p.is_already_donor ? `Donor #${p.donor_id}` : 'Person Record'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Selected Person Form */
                <form onSubmit={handleStaffRegisterExisting} className="space-y-3.5">
                  <div className="p-3 border border-rule bg-paper text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[10px] uppercase text-muted">Selected Candidate</span>
                      <button
                        type="button"
                        onClick={() => setSelectedPerson(null)}
                        className="text-[11px] font-mono text-blood underline"
                      >
                        Change Person
                      </button>
                    </div>
                    <div className="font-semibold text-ink text-sm">
                      {selectedPerson.full_name} (Person #{selectedPerson.person_id})
                    </div>
                    <div className="text-muted text-[11px] font-mono">
                      Phone: {selectedPerson.phone} &bull; Email: {selectedPerson.email} &bull; Age: {selectedPerson.age} yrs
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      label="Blood Group"
                      required
                      value={existingPersonForm.blood_group}
                      onChange={(e) => setExistingPersonForm({ ...existingPersonForm, blood_group: e.target.value })}
                      options={[
                        { value: 'A+', label: 'A+' },
                        { value: 'A-', label: 'A-' },
                        { value: 'B+', label: 'B+' },
                        { value: 'B-', label: 'B-' },
                        { value: 'AB+', label: 'AB+' },
                        { value: 'AB-', label: 'AB-' },
                        { value: 'O+', label: 'O+' },
                        { value: 'O-', label: 'O-' },
                      ]}
                    />

                    <Input
                      label="Current Weight (kg)"
                      type="number"
                      min="45"
                      required
                      value={existingPersonForm.weight_kg}
                      onChange={(e) => setExistingPersonForm({ ...existingPersonForm, weight_kg: e.target.value })}
                      helper="Min. 45 kg required"
                    />
                  </div>

                  <Textarea
                    label="Camp Screening & Eligibility Notes"
                    rows={2}
                    value={existingPersonForm.medical_history_notes}
                    onChange={(e) => setExistingPersonForm({ ...existingPersonForm, medical_history_notes: e.target.value })}
                  />

                  <div className="pt-3 border-t border-rule flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setSelectedPerson(null)}
                    >
                      Back
                    </Button>
                    <Button type="submit" variant="primary" loading={submitting}>
                      {submitting ? 'Enrolling...' : 'Enroll in Camp Drive'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* MODE 2: REGISTER NEW WALK-IN PARTICIPANT ("Naya Banda") */}
          {staffRegMode === 'new' && (
            <form onSubmit={handleStaffRegisterWalkin} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First Name"
                  required
                  value={walkinForm.first_name}
                  onChange={(e) => setWalkinForm({ ...walkinForm, first_name: e.target.value })}
                />
                <Input
                  label="Last Name"
                  required
                  value={walkinForm.last_name}
                  onChange={(e) => setWalkinForm({ ...walkinForm, last_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Select
                  label="Blood Group"
                  required
                  value={walkinForm.blood_group}
                  onChange={(e) => setWalkinForm({ ...walkinForm, blood_group: e.target.value })}
                  options={[
                    { value: 'A+', label: 'A+' },
                    { value: 'A-', label: 'A-' },
                    { value: 'B+', label: 'B+' },
                    { value: 'B-', label: 'B-' },
                    { value: 'AB+', label: 'AB+' },
                    { value: 'AB-', label: 'AB-' },
                    { value: 'O+', label: 'O+' },
                    { value: 'O-', label: 'O-' },
                  ]}
                />
                <Select
                  label="Gender"
                  required
                  value={walkinForm.gender}
                  onChange={(e) => setWalkinForm({ ...walkinForm, gender: e.target.value })}
                  options={[
                    { value: 'MALE', label: 'Male' },
                    { value: 'FEMALE', label: 'Female' },
                    { value: 'OTHER', label: 'Other' },
                  ]}
                />
                <Input
                  label="Weight (kg)"
                  type="number"
                  min="45"
                  required
                  value={walkinForm.weight_kg}
                  onChange={(e) => setWalkinForm({ ...walkinForm, weight_kg: e.target.value })}
                  helper="Min. 45 kg required"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Date of Birth"
                  type="date"
                  required
                  value={walkinForm.date_of_birth}
                  onChange={(e) => setWalkinForm({ ...walkinForm, date_of_birth: e.target.value })}
                  helper="Must be ≥ 18 years"
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  required
                  placeholder="+91-..."
                  value={walkinForm.phone}
                  onChange={(e) => setWalkinForm({ ...walkinForm, phone: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="City"
                  value={walkinForm.city}
                  onChange={(e) => setWalkinForm({ ...walkinForm, city: e.target.value })}
                />
                <Input
                  label="State"
                  value={walkinForm.state}
                  onChange={(e) => setWalkinForm({ ...walkinForm, state: e.target.value })}
                />
                <Input
                  label="Pincode"
                  value={walkinForm.pincode}
                  onChange={(e) => setWalkinForm({ ...walkinForm, pincode: e.target.value })}
                />
              </div>

              <Textarea
                label="On-Site Clinical Screening Notes"
                rows={2}
                value={walkinForm.medical_history_notes}
                onChange={(e) => setWalkinForm({ ...walkinForm, medical_history_notes: e.target.value })}
              />

              <div className="pt-3 border-t border-rule flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsStaffRegOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={submitting}>
                  {submitting ? 'Registering...' : 'Register Walk-in Donor & Enroll in Camp'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 3: PARTICIPANTS & ATTENDANCE LEDGER MODAL */}
      {/* ============================================================== */}
      <Modal
        isOpen={Boolean(campParticipantsModal)}
        onClose={() => setCampParticipantsModal(null)}
        title={`Registered Participants: ${campParticipantsModal?.camp_name || ''}`}
        subtitle="Junction records linking donors to camp drive. Staff can mark attendance and log collected units."
      >
        <div className="space-y-4 text-xs font-sans">
          {!campParticipantsModal?.participants || campParticipantsModal.participants.length === 0 ? (
            <p className="text-muted italic py-6 text-center border border-rule bg-paper">
              No donors registered yet for this camp drive.
            </p>
          ) : (
            <div className="border border-rule divide-y divide-rule max-h-80 overflow-y-auto bg-surface">
              {campParticipantsModal.participants.map((p) => (
                <div key={p.registration_id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface hover:bg-paper/40 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink text-sm">{p.donor_name}</span>
                      <BloodGroupStamp bloodGroup={p.blood_group} size="sm" />
                    </div>
                    <div className="text-[11px] text-muted font-mono">
                      Phone: {p.phone} &bull; Reg: {String(p.registration_time).slice(0, 16)}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className={`px-2 py-0.5 text-[10px] font-mono border block ${
                        p.attended ? 'bg-moss/10 text-moss border-moss/30 font-semibold' : 'bg-paper text-muted border-rule'
                      }`}>
                        {p.attended ? 'Attended ✓' : 'Registered'}
                      </span>
                      <span className="text-[10px] font-mono text-blood font-semibold block mt-0.5">
                        {p.units_donated > 0 ? `${p.units_donated} Unit(s)` : '0 Units'}
                      </span>
                    </div>

                    {/* Staff Attendance Action Buttons */}
                    {canManage && (
                      <div className="flex items-center gap-1.5 border-l border-rule pl-3">
                        {!p.attended ? (
                          <Button
                            variant="primary"
                            size="sm"
                            loading={updatingRegId === p.registration_id}
                            onClick={() => handleUpdateAttendance(p.registration_id, true, 1)}
                          >
                            Mark Attended (1 Unit)
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            loading={updatingRegId === p.registration_id}
                            onClick={() => handleUpdateAttendance(p.registration_id, false, 0)}
                          >
                            Undo
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 4: ORGANIZE NEW CAMP MODAL (STAFF / ADMIN / DEVELOPER) */}
      {/* ============================================================== */}
      <Modal
        isOpen={isCreateCampOpen}
        onClose={() => setIsCreateCampOpen(false)}
        title="Organize New Donation Camp"
        subtitle="Creates camp record with integrity checks (capacity > 0, end_date >= start_date)."
      >
        <form onSubmit={handleCreateCamp} className="space-y-4 text-xs font-sans">
          {campFeedback && (
            <div className={`p-2.5 border text-xs ${
              campFeedback.type === 'error' ? 'border-blood/40 bg-blood/5 text-blood' : 'border-moss/40 bg-moss/5 text-moss'
            }`}>
              {campFeedback.message}
            </div>
          )}

          <Input
            label="Camp Title"
            required
            placeholder="e.g. Red Cross University Youth Drive"
            value={campForm.camp_name}
            onChange={(e) => setCampForm({ ...campForm, camp_name: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Organizer Organization"
              required
              placeholder="e.g. Rotary Club / Red Cross"
              value={campForm.organizer}
              onChange={(e) => setCampForm({ ...campForm, organizer: e.target.value })}
            />

            {/* If Staff or Admin, show locked hospital affiliation; for Developer, allow dropdown */}
            {isDeveloper ? (
              <Select
                label="Partnering Hospital (Universal View)"
                required
                value={campForm.hospital_id}
                onChange={(e) => setCampForm({ ...campForm, hospital_id: parseInt(e.target.value, 10) })}
                options={hospitals.map((h) => ({
                  value: h.hospital_id,
                  label: h.hospital_name,
                }))}
              />
            ) : (
              <div>
                <label className="block text-[11px] font-mono uppercase text-muted mb-1">
                  Partnering Hospital (Your Facility)
                </label>
                <div className="h-9 px-3 py-2 border border-rule bg-paper text-ink text-xs font-medium truncate flex items-center">
                  {user?.hospital_name || hospitals.find(h => h.hospital_id === campForm.hospital_id)?.hospital_name || 'Designated Facility'}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Location Venue"
              required
              placeholder="Community Hall / Campus"
              value={campForm.location}
              onChange={(e) => setCampForm({ ...campForm, location: e.target.value })}
            />
            <Input
              label="City"
              required
              value={campForm.city}
              onChange={(e) => setCampForm({ ...campForm, city: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date & Time"
              type="datetime-local"
              required
              value={campForm.start_date}
              onChange={(e) => setCampForm({ ...campForm, start_date: e.target.value })}
            />
            <Input
              label="End Date & Time (Must be after Start)"
              type="datetime-local"
              required
              value={campForm.end_date}
              onChange={(e) => setCampForm({ ...campForm, end_date: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Target Capacity (Donors)"
              type="number"
              min="1"
              required
              value={campForm.capacity}
              onChange={(e) => setCampForm({ ...campForm, capacity: parseInt(e.target.value, 10) })}
            />
            <Input
              label="Helpline Phone"
              required
              value={campForm.contact_phone}
              onChange={(e) => setCampForm({ ...campForm, contact_phone: e.target.value })}
            />
          </div>

          <div className="pt-3 border-t border-rule flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateCampOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              {submitting ? 'Scheduling...' : 'Schedule Camp'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DonationCamps;
