import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { StatusBadge, BloodGroupPill } from '../components/Badge';
import {
  Tent,
  Plus,
  Calendar,
  MapPin,
  Users,
  Droplet,
  Database,
  BarChart2,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DonationCamps = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('camps');
  const [camps, setCamps] = useState([]);
  const [campStats, setCampStats] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateCampOpen, setIsCreateCampOpen] = useState(false);
  const [isRegisterDonorOpen, setIsRegisterDonorOpen] = useState(false);
  const [selectedCampForReg, setSelectedCampForReg] = useState(null);
  const [selectedDonorId, setSelectedDonorId] = useState('');
  const [campDonorsList, setCampDonorsList] = useState(null);

  // New Camp Form
  const [campForm, setCampForm] = useState({
    camp_name: '',
    organizer: '',
    hospital_id: 1,
    location: '',
    city: 'New Delhi',
    start_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    capacity: 250,
    contact_phone: '+91-11-26588500',
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'camps') fetchCamps();
    if (activeTab === 'stats') fetchCampStats();
  }, [activeTab]);

  const fetchInitialData = async () => {
    try {
      const [hRes, dRes] = await Promise.all([
        api.get('/hospitals'),
        api.get('/donors'),
      ]);
      if (hRes.data?.success) setHospitals(hRes.data.hospitals);
      if (dRes.data?.success) {
        setDonors(dRes.data.donors);
        if (dRes.data.donors.length > 0) setSelectedDonorId(dRes.data.donors[0].donor_id);
      }
    } catch (err) {
      console.error('Initial data fetch error:', err);
    }
  };

  const fetchCamps = async () => {
    try {
      setLoading(true);
      const res = await api.get('/camps');
      if (res.data?.success) setCamps(res.data.camps);
    } catch (err) {
      console.error('Camps fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/camps/stats');
      if (res.data?.success) setCampStats(res.data.stats);
    } catch (err) {
      console.error('Camp stats fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCamp = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/camps', campForm);
      if (res.data?.success) {
        setIsCreateCampOpen(false);
        alert(res.data.message);
        fetchCamps();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create camp');
    }
  };

  const handleOpenRegister = (camp) => {
    setSelectedCampForReg(camp);
    setIsRegisterDonorOpen(true);
  };

  const handleRegisterDonor = async (e) => {
    e.preventDefault();
    if (!selectedCampForReg || !selectedDonorId) return;

    try {
      const res = await api.post(`/camps/${selectedCampForReg.camp_id}/register`, {
        donor_id: selectedDonorId,
      });
      if (res.data?.success) {
        setIsRegisterDonorOpen(false);
        alert(res.data.message);
        fetchCamps();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to register donor for camp');
    }
  };

  const handleViewDonors = async (camp) => {
    try {
      const res = await api.get(`/camps/${camp.camp_id}/donors`);
      if (res.data?.success) {
        setCampDonorsList({
          camp_name: camp.camp_name,
          donors: res.data.donors,
        });
      }
    } catch (err) {
      console.error('Failed to load camp donors:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Donation Camps & Community Drives</h1>
          <p className="text-xs text-slate-500 mt-1">
            Modeled as an <strong>EER Aggregation Object</strong> linking camps, participating donors, and batch blood collection activities.
          </p>
        </div>

        {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
          <button
            onClick={() => setIsCreateCampOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-brand-600 text-white hover:bg-brand-700 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Organize Donation Camp</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs">
        <button
          onClick={() => setActiveTab('camps')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold border-b-2 transition-all ${
            activeTab === 'camps'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Tent className="w-4 h-4" />
          <span>All Donation Camps ({camps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold border-b-2 transition-all ${
            activeTab === 'stats'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4 text-indigo-600" />
          <span>Query 7: Camp Performance Aggregates (HAVING &ge; 2)</span>
        </button>
      </div>

      {/* TAB 1: CAMPS CARDS GRID */}
      {activeTab === 'camps' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {camps.map((camp) => (
            <div key={camp.camp_id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-teal-50 text-teal-700">
                    <Tent className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">{camp.camp_name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Organized by {camp.organizer}</p>
                  </div>
                </div>
                <StatusBadge status={camp.camp_status} />
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <p className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{camp.location}, {camp.city}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Dates: <strong>{camp.start_date.slice(0, 10)}</strong> to <strong>{camp.end_date.slice(0, 10)}</strong></span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Droplet className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Affiliated Hospital: <strong className="text-slate-800">{camp.hospital_name}</strong></span>
                </p>
              </div>

              {/* Statistics & Participation */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                <div className="p-2 rounded-lg bg-slate-50">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Capacity</span>
                  <span className="font-bold text-xs text-slate-900">{camp.capacity} Donors</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 cursor-pointer hover:bg-slate-100" onClick={() => handleViewDonors(camp)}>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Registered</span>
                  <span className="font-bold text-xs text-indigo-700 underline">{camp.registered_donors_count}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Units Donated</span>
                  <span className="font-bold text-xs text-brand-600">{camp.total_donations_collected} units</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={() => handleViewDonors(camp)}
                  className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>View Participant List</span>
                </button>
                <button
                  onClick={() => handleOpenRegister(camp)}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-900 text-white hover:bg-black transition-colors"
                >
                  Register Donor
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: QUERY 7 AGGREGATE FUNCTIONS & HAVING */}
      {activeTab === 'stats' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Query 7: Aggregate Functions with GROUP BY & HAVING (COUNT, SUM, AVG, MIN, MAX)</p>
              <p className="text-indigo-800 mt-0.5 leading-relaxed">
                Demonstrates multi-attribute aggregation calculating total units collected, total ml collected, average hemoglobin level,
                minimum single donation ml, and maximum ml.
                Filtered by <strong>HAVING COUNT(bd.donation_id) &ge; 2</strong> to highlight high-impact camps.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-indigo-50/50 border-b border-indigo-200 text-indigo-900 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Camp ID</th>
                    <th className="py-3 px-4">Camp Name</th>
                    <th className="py-3 px-4">Supervising Hospital</th>
                    <th className="py-3 px-4 font-bold">COUNT(donations)</th>
                    <th className="py-3 px-4 font-bold">SUM(quantity_ml)</th>
                    <th className="py-3 px-4 font-bold">AVG(hemoglobin)</th>
                    <th className="py-3 px-4">MIN(ml)</th>
                    <th className="py-3 px-4">MAX(ml)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {campStats.map((st) => (
                    <tr key={st.camp_id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">#{st.camp_id}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{st.camp_name}</td>
                      <td className="py-3 px-4 text-slate-600">{st.hospital_name}</td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700 text-sm">
                        {st.total_donations_collected} units
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-brand-600">
                        {st.total_blood_collected_ml} ml
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                        {st.average_donor_hemoglobin} g/dL
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{st.min_donation_ml} ml</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{st.max_donation_ml} ml</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Register Donor for Camp Modal */}
      <Modal
        isOpen={isRegisterDonorOpen}
        onClose={() => setIsRegisterDonorOpen(false)}
        title={`Register Donor: ${selectedCampForReg?.camp_name}`}
      >
        <form onSubmit={handleRegisterDonor} className="space-y-4 text-xs">
          <p className="text-slate-500 text-[11px] pb-2 border-b">
            Inserts a row into the <strong>CampDonorRegistration</strong> junction table, realizing the EER aggregation relationship.
          </p>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Registered Donor *</label>
            <select
              required
              value={selectedDonorId}
              onChange={(e) => setSelectedDonorId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              {donors.map((d) => (
                <option key={d.donor_id} value={d.donor_id}>
                  #{d.donor_id} - {d.name} ({d.blood_group})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 border-t flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsRegisterDonorOpen(false)}
              className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 shadow-sm"
            >
              Confirm Registration
            </button>
          </div>
        </form>
      </Modal>

      {/* View Camp Registered Donors Modal */}
      <Modal
        isOpen={Boolean(campDonorsList)}
        onClose={() => setCampDonorsList(null)}
        title={`Registered Donors: ${campDonorsList?.camp_name}`}
      >
        <div className="space-y-3 text-xs">
          {campDonorsList?.donors?.length === 0 ? (
            <p className="text-slate-500 italic py-4 text-center">No donors registered yet for this camp.</p>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {campDonorsList?.donors?.map((d) => (
                <div key={d.registration_id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <span className="font-semibold text-slate-800">{d.donor_name}</span>
                    <span className="text-slate-400 block text-[11px] font-mono">{d.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BloodGroupPill bloodGroup={d.blood_group} />
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      d.attended ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {d.attended ? 'Attended' : 'Registered'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Organize Camp Modal */}
      <Modal isOpen={isCreateCampOpen} onClose={() => setIsCreateCampOpen(false)} title="Organize New Donation Camp">
        <form onSubmit={handleCreateCamp} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Camp Name *</label>
            <input
              type="text"
              required
              value={campForm.camp_name}
              onChange={(e) => setCampForm({ ...campForm, camp_name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              placeholder="e.g. Red Cross University Youth Drive"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Organizer Organization *</label>
              <input
                type="text"
                required
                value={campForm.organizer}
                onChange={(e) => setCampForm({ ...campForm, organizer: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                placeholder="Rotary Club / Red Cross"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Partnering Hospital *</label>
              <select
                value={campForm.hospital_id}
                onChange={(e) => setCampForm({ ...campForm, hospital_id: parseInt(e.target.value, 10) })}
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
              <label className="block font-semibold text-slate-700 mb-1">Location Details *</label>
              <input
                type="text"
                required
                value={campForm.location}
                onChange={(e) => setCampForm({ ...campForm, location: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                placeholder="Community Hall / Campus"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">City *</label>
              <input
                type="text"
                required
                value={campForm.city}
                onChange={(e) => setCampForm({ ...campForm, city: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Date & Time *</label>
              <input
                type="datetime-local"
                required
                value={campForm.start_date}
                onChange={(e) => setCampForm({ ...campForm, start_date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">End Date & Time (CHECK &ge; Start) *</label>
              <input
                type="datetime-local"
                required
                value={campForm.end_date}
                onChange={(e) => setCampForm({ ...campForm, end_date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Capacity (CHECK &gt; 0) *</label>
              <input
                type="number"
                min="1"
                required
                value={campForm.capacity}
                onChange={(e) => setCampForm({ ...campForm, capacity: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Helpline Phone *</label>
              <input
                type="text"
                required
                value={campForm.contact_phone}
                onChange={(e) => setCampForm({ ...campForm, contact_phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateCampOpen(false)}
              className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 shadow-sm"
            >
              Schedule Camp
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DonationCamps;

