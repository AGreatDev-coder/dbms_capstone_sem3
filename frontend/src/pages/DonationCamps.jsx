import React, { useState, useEffect } from 'react';
import api from '../services/api';
import PageHeader from '../components/common/PageHeader';
import PageState from '../components/common/PageState';
import Tabs from '../components/common/Tabs';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { Input, Select } from '../components/common/FormControls';
import StatusDot from '../components/common/StatusDot';
import BloodGroupStamp from '../components/common/BloodGroupStamp';
import { Plus, Users, Calendar, MapPin, Building2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DonationCamps = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('camps');
  const [camps, setCamps] = useState([]);
  const [campStats, setCampStats] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      if (hRes.data?.success) setHospitals(hRes.data.hospitals || []);
      if (dRes.data?.success) {
        setDonors(dRes.data.donors || []);
        if (dRes.data.donors?.length > 0) setSelectedDonorId(dRes.data.donors[0].donor_id);
      }
    } catch (err) {
      console.error('Initial data fetch error:', err);
    }
  };

  const fetchCamps = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/camps');
      if (res.data?.success) setCamps(res.data.camps || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load donation camps.');
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

  const handleCreateCamp = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/camps', campForm);
      if (res.data?.success) {
        setIsCreateCampOpen(false);
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
          donors: res.data.donors || [],
        });
      }
    } catch (err) {
      console.error('Failed to load camp donors:', err);
    }
  };

  const tabs = [
    { id: 'camps', label: 'All Donation Camps', count: camps.length },
    { id: 'stats', label: 'Query 7: Camp Performance Aggregates (HAVING >= 2)', count: campStats.length },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['07 OUTREACH', 'CAMPS']}
        title="Donation Camps"
        description="Community blood drives modeled as an EER aggregation object linking donors, camps, and phlebotomy collections."
        action={
          (user?.role === 'ADMIN' || user?.role === 'STAFF') && (
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setIsCreateCampOpen(true)}
            >
              Organize Camp
            </Button>
          )
        }
      />

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab 1: All Camps */}
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
                className="border border-rule bg-surface p-4 space-y-3 font-sans"
              >
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-rule">
                  <div>
                    <div className="font-mono text-[10px] text-muted uppercase">Camp #{camp.camp_id}</div>
                    <h3 className="font-serif text-base font-semibold text-ink leading-snug">
                      {camp.camp_name}
                    </h3>
                    <div className="text-xs text-muted mt-0.5">
                      Organized by {camp.organizer}
                    </div>
                  </div>
                  <StatusDot status={camp.camp_status} />
                </div>

                <div className="space-y-1 text-xs text-muted">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-muted shrink-0" />
                    <span>{camp.location}, {camp.city}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-muted shrink-0" />
                    <span>{camp.start_date.slice(0, 10)} to {camp.end_date.slice(0, 10)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-muted shrink-0" />
                    <span>Hospital: <strong className="text-ink font-medium">{camp.hospital_name}</strong></span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 border-y border-rule text-center font-mono">
                  <div>
                    <span className="text-[10px] uppercase text-muted block">Target</span>
                    <span className="text-xs font-semibold text-ink">{camp.capacity}</span>
                  </div>
                  <div
                    className="cursor-pointer hover:bg-paper/50"
                    onClick={() => handleViewDonors(camp)}
                  >
                    <span className="text-[10px] uppercase text-muted block">Registered</span>
                    <span className="text-xs font-semibold text-ink underline">{camp.registered_donors_count}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-muted block">Units Collected</span>
                    <span className="text-xs font-semibold text-blood">{camp.total_donations_collected}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => handleViewDonors(camp)}
                    className="text-xs text-muted hover:text-ink underline flex items-center gap-1 font-mono"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Participants ({camp.registered_donors_count})</span>
                  </button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleOpenRegister(camp)}
                  >
                    Register Donor
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </PageState>
      )}

      {/* Tab 2: Query 7 Aggregate Functions & HAVING */}
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
              <code className="font-mono text-ink">MAX(bd.quantity_ml)</code>. 
              Restricted to high-impact drives via <code className="font-mono text-ink">HAVING COUNT(bd.donation_id) &gt;= 2</code>.
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

      {/* Register Donor for Camp Modal */}
      <Modal
        isOpen={isRegisterDonorOpen}
        onClose={() => setIsRegisterDonorOpen(false)}
        title={`Register Donor: ${selectedCampForReg?.camp_name || ''}`}
        subtitle="Appends record to CampDonorRegistration junction table (EER Aggregation)."
      >
        <form onSubmit={handleRegisterDonor} className="space-y-4">
          <Select
            label="Select Registered Donor"
            required
            value={selectedDonorId}
            onChange={(e) => setSelectedDonorId(e.target.value)}
            options={donors.map((d) => ({
              value: d.donor_id,
              label: `#${d.donor_id} - ${d.name} (${d.blood_group})`,
            }))}
          />

          <div className="pt-3 border-t border-rule flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsRegisterDonorOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Confirm Registration
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Camp Registered Donors Modal */}
      <Modal
        isOpen={Boolean(campDonorsList)}
        onClose={() => setCampDonorsList(null)}
        title={`Registered Participants: ${campDonorsList?.camp_name || ''}`}
        subtitle="Junction records linking donors to scheduled camp drive."
      >
        <div className="space-y-3 text-xs font-sans">
          {campDonorsList?.donors?.length === 0 ? (
            <p className="text-muted italic py-4 text-center border border-rule bg-paper">
              No donors registered yet for this camp.
            </p>
          ) : (
            <div className="border border-rule divide-y divide-rule">
              {campDonorsList?.donors?.map((d) => (
                <div key={d.registration_id} className="p-2.5 flex items-center justify-between bg-surface">
                  <div>
                    <span className="font-medium text-ink">{d.donor_name}</span>
                    <span className="text-muted block text-[10px] font-mono">{d.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BloodGroupStamp bloodGroup={d.blood_group} size="sm" />
                    <span className="font-mono text-[10px] uppercase text-muted">
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
      <Modal
        isOpen={isCreateCampOpen}
        onClose={() => setIsCreateCampOpen(false)}
        title="Organize New Donation Camp"
        subtitle="Creates camp record with integrity checks (capacity > 0, end_date >= start_date)."
      >
        <form onSubmit={handleCreateCamp} className="space-y-4">
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
            <Select
              label="Partnering Hospital"
              required
              value={campForm.hospital_id}
              onChange={(e) => setCampForm({ ...campForm, hospital_id: parseInt(e.target.value, 10) })}
              options={hospitals.map((h) => ({
                value: h.hospital_id,
                label: h.hospital_name,
              }))}
            />
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
              label="End Date & Time (CHECK >= Start)"
              type="datetime-local"
              required
              value={campForm.end_date}
              onChange={(e) => setCampForm({ ...campForm, end_date: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Target Capacity (CHECK > 0)"
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
            <Button type="submit" variant="primary">
              Schedule Camp
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DonationCamps;
