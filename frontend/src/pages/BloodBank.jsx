import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import Modal from '../components/Modal';
import { BloodGroupPill, StatusBadge } from '../components/Badge';
import {
  Droplet,
  Plus,
  Filter,
  AlertTriangle,
  Layers,
  History,
  Clock,
  Sparkles,
  Database,
  Building2,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BloodBank = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'expiring' ? 'expiring' : 'inventory';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [inventory, setInventory] = useState([]);
  const [expiringUnits, setExpiringUnits] = useState([]);
  const [summary, setSummary] = useState([]);
  const [donations, setDonations] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [donors, setDonors] = useState([]);
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [bgFilter, setBgFilter] = useState('');
  const [compFilter, setCompFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [hospFilter, setHospFilter] = useState('');

  // Add Donation Modal
  const [isAddDonationOpen, setIsAddDonationOpen] = useState(false);
  const [donationForm, setDonationForm] = useState({
    donor_id: '',
    hospital_id: 1,
    donation_camp_id: '',
    quantity_ml: 450,
    hemoglobin_level: 14.0,
    component_types: ['WHOLE_BLOOD'],
    remarks: 'Routine safe phlebotomy collection.',
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'inventory') fetchInventory();
    if (activeTab === 'expiring') fetchExpiring();
    if (activeTab === 'summary') fetchSummary();
    if (activeTab === 'donations') fetchDonations();
  }, [activeTab, bgFilter, compFilter, statusFilter, hospFilter]);

  const fetchInitialData = async () => {
    try {
      const [hRes, dRes, cRes] = await Promise.all([
        api.get('/hospitals'),
        api.get('/donors'),
        api.get('/camps'),
      ]);
      if (hRes.data?.success) setHospitals(hRes.data.hospitals);
      if (dRes.data?.success) {
        setDonors(dRes.data.donors);
        if (dRes.data.donors.length > 0) {
          setDonationForm((prev) => ({ ...prev, donor_id: dRes.data.donors[0].donor_id }));
        }
      }
      if (cRes.data?.success) setCamps(cRes.data.camps);
    } catch (err) {
      console.error('Initial data fetch error:', err);
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = {};
      if (bgFilter) params.blood_group = bgFilter;
      if (compFilter) params.component_type = compFilter;
      if (statusFilter) params.storage_status = statusFilter;
      if (hospFilter) params.hospital_id = hospFilter;

      const res = await api.get('/blood-bank/inventory', { params });
      if (res.data?.success) setInventory(res.data.units);
    } catch (err) {
      console.error('Inventory fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExpiring = async () => {
    try {
      setLoading(true);
      const res = await api.get('/blood-bank/expiring-soon');
      if (res.data?.success) setExpiringUnits(res.data.expiringUnits);
    } catch (err) {
      console.error('Expiring fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await api.get('/blood-bank/summary');
      if (res.data?.success) setSummary(res.data.summary);
    } catch (err) {
      console.error('Summary fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/blood-bank/donations');
      if (res.data?.success) setDonations(res.data.donations);
    } catch (err) {
      console.error('Donations fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDonation = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/blood-bank/donations', donationForm);
      if (res.data?.success) {
        setIsAddDonationOpen(false);
        alert(res.data.message);
        fetchInventory();
        fetchDonations();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record donation');
    }
  };

  const toggleComponentType = (comp) => {
    setDonationForm((prev) => {
      const exists = prev.component_types.includes(comp);
      let updated;
      if (exists) {
        updated = prev.component_types.filter((c) => c !== comp);
        if (updated.length === 0) updated = ['WHOLE_BLOOD'];
      } else {
        updated = [...prev.component_types, comp];
      }
      return { ...prev, component_types: updated };
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Blood Bank & Inventory Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Component inventory, storage status, donation processing, and automated shelf-life tracking.
          </p>
        </div>

        {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
          <button
            onClick={() => setIsAddDonationOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-brand-600 text-white hover:bg-brand-700 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Blood Donation</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold border-b-2 transition-all ${
            activeTab === 'inventory'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Blood Inventory ({inventory.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('expiring')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold border-b-2 transition-all ${
            activeTab === 'expiring'
              ? 'border-amber-600 text-amber-700 bg-amber-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Query 2: Expiry Tracking CTE</span>
          {expiringUnits.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 text-amber-900 font-bold">
              {expiringUnits.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('summary')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold border-b-2 transition-all ${
            activeTab === 'summary'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4 text-indigo-600" />
          <span>Query 3: Hospital Inventory CTE</span>
        </button>

        <button
          onClick={() => setActiveTab('donations')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold border-b-2 transition-all ${
            activeTab === 'donations'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Donations Log ({donations.length})</span>
        </button>
      </div>

      {/* TAB 1: INVENTORY TABLE */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </div>

            <select
              value={bgFilter}
              onChange={(e) => setBgFilter(e.target.value)}
              className="px-3 py-1.5 border rounded-lg bg-slate-50 text-slate-700 font-medium focus:outline-none"
            >
              <option value="">All Blood Groups</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>

            <select
              value={compFilter}
              onChange={(e) => setCompFilter(e.target.value)}
              className="px-3 py-1.5 border rounded-lg bg-slate-50 text-slate-700 font-medium focus:outline-none"
            >
              <option value="">All Components</option>
              <option value="WHOLE_BLOOD">Whole Blood</option>
              <option value="RBC">Packed Red Blood Cells (RBC)</option>
              <option value="PLATELETS">Platelets</option>
              <option value="PLASMA">Fresh Frozen Plasma</option>
              <option value="CRYO">Cryoprecipitate</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border rounded-lg bg-slate-50 text-slate-700 font-medium focus:outline-none"
            >
              <option value="">All Storage Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="ALLOCATED">Allocated</option>
              <option value="EXPIRED">Expired</option>
              <option value="RESERVED">Reserved</option>
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

          {/* Units Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Unit ID</th>
                    <th className="py-3 px-4">Blood Group</th>
                    <th className="py-3 px-4">Component</th>
                    <th className="py-3 px-4">Storage Hospital</th>
                    <th className="py-3 px-4">Vault Location</th>
                    <th className="py-3 px-4">Donation Date</th>
                    <th className="py-3 px-4">Expiry Date</th>
                    <th className="py-3 px-4">Shelf Life</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventory.map((unit) => (
                    <tr key={unit.unit_id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">#{unit.unit_id}</td>
                      <td className="py-3 px-4">
                        <BloodGroupPill bloodGroup={unit.blood_group} />
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">{unit.component_type}</td>
                      <td className="py-3 px-4 text-slate-600">{unit.hospital_name}</td>
                      <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{unit.storage_location}</td>
                      <td className="py-3 px-4 text-slate-500">{unit.donation_date}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{unit.expiry_date}</td>
                      <td className="py-3 px-4">
                        {unit.is_expired ? (
                          <span className="text-rose-600 font-bold">Expired</span>
                        ) : (
                          <span className={`font-semibold ${unit.days_to_expiry <= 7 ? 'text-amber-600 font-bold' : 'text-slate-600'}`}>
                            {unit.days_to_expiry} days left
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={unit.storage_status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: QUERY 2 EXPIRY TRACKING CTE */}
      {activeTab === 'expiring' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Query 2: CTE Blood Expiry Tracking (WITH ExpiringUnitsCTE AS ...)</p>
              <p className="text-amber-800 mt-0.5 leading-relaxed">
                Identifies viable units with <strong>remaining shelf life &le; 7 days</strong>.
                Expired, allocated, and discarded units are strictly excluded. Prioritizes units requiring immediate transfusion or inter-hospital transfer.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-amber-50/50 border-b border-amber-200 text-amber-900 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Unit ID</th>
                    <th className="py-3 px-4">Blood Group</th>
                    <th className="py-3 px-4">Component</th>
                    <th className="py-3 px-4">Hospital</th>
                    <th className="py-3 px-4">Expiry Date</th>
                    <th className="py-3 px-4">Shelf Life Remaining</th>
                    <th className="py-3 px-4">Storage Location</th>
                    <th className="py-3 px-4">Action Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expiringUnits.map((u) => (
                    <tr key={u.unit_id} className="hover:bg-amber-50/20">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">#{u.unit_id}</td>
                      <td className="py-3 px-4">
                        <BloodGroupPill bloodGroup={u.blood_group} />
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">{u.component_type}</td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{u.hospital_name}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{u.expiry_date}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded font-mono font-bold text-xs ${
                          u.remaining_shelf_life_days <= 2 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {u.remaining_shelf_life_days} Days Left
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{u.storage_location}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          u.remaining_shelf_life_days <= 2 ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {u.action_recommendation}
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

      {/* TAB 3: QUERY 3 HOSPITAL INVENTORY SUMMARY CTE */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 flex items-start gap-3">
            <Database className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Query 3: CTE Hospital-Wise Blood Inventory Summary</p>
              <p className="text-indigo-800 mt-0.5 leading-relaxed">
                Aggregates total cataloged units, available bags, units expiring within 7 days, expired bags, and allocated units grouped by hospital and blood group.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-indigo-50/50 border-b border-indigo-200 text-indigo-900 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Hospital Name</th>
                    <th className="py-3 px-4">City</th>
                    <th className="py-3 px-4">Blood Group</th>
                    <th className="py-3 px-4">Available Units</th>
                    <th className="py-3 px-4">Expiring Soon (&le; 7d)</th>
                    <th className="py-3 px-4">Expired Units</th>
                    <th className="py-3 px-4">Allocated Units</th>
                    <th className="py-3 px-4">Total Cataloged</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-semibold text-slate-800">{row.hospital_name}</td>
                      <td className="py-3 px-4 text-slate-600">{row.city}</td>
                      <td className="py-3 px-4">
                        <BloodGroupPill bloodGroup={row.blood_group} />
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-600">{row.available_units}</td>
                      <td className="py-3 px-4 font-bold text-amber-600">{row.expiring_soon_7d}</td>
                      <td className="py-3 px-4 font-bold text-rose-600">{row.expired_units}</td>
                      <td className="py-3 px-4 font-bold text-purple-600">{row.allocated_units}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{row.total_units_cataloged}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BLOOD DONATIONS LOG */}
      {activeTab === 'donations' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Donation ID</th>
                  <th className="py-3 px-4">Donor Name</th>
                  <th className="py-3 px-4">Blood Group</th>
                  <th className="py-3 px-4">Collection Date</th>
                  <th className="py-3 px-4">Quantity (ml)</th>
                  <th className="py-3 px-4">Hemoglobin (g/dL)</th>
                  <th className="py-3 px-4">Collection Facility</th>
                  <th className="py-3 px-4">Camp / Source</th>
                  <th className="py-3 px-4">Screening</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {donations.map((d) => (
                  <tr key={d.donation_id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">#{d.donation_id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{d.donor_name}</td>
                    <td className="py-3 px-4">
                      <BloodGroupPill bloodGroup={d.blood_group} />
                    </td>
                    <td className="py-3 px-4 text-slate-500">{d.donation_date}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{d.quantity_ml} ml</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{d.hemoglobin_level}</td>
                    <td className="py-3 px-4 text-slate-600">{d.hospital_name}</td>
                    <td className="py-3 px-4 text-slate-500">{d.camp_name}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={d.screening_status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Blood Donation Modal */}
      <Modal isOpen={isAddDonationOpen} onClose={() => setIsAddDonationOpen(false)} title="Record Blood Donation & Generate Units">
        <form onSubmit={handleCreateDonation} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Registered Donor *</label>
            <select
              required
              value={donationForm.donor_id}
              onChange={(e) => setDonationForm({ ...donationForm, donor_id: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              {donors.map((d) => (
                <option key={d.donor_id} value={d.donor_id}>
                  #{d.donor_id} - {d.name} ({d.blood_group})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Collection Hospital *</label>
              <select
                value={donationForm.hospital_id}
                onChange={(e) => setDonationForm({ ...donationForm, hospital_id: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {hospitals.map((h) => (
                  <option key={h.hospital_id} value={h.hospital_id}>{h.hospital_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Associated Camp (Optional)</label>
              <select
                value={donationForm.donation_camp_id}
                onChange={(e) => setDonationForm({ ...donationForm, donation_camp_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="">Direct In-Hospital Donation</option>
                {camps.map((c) => (
                  <option key={c.camp_id} value={c.camp_id}>{c.camp_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Quantity (ml: CHECK 300 to 550) *</label>
              <input
                type="number"
                min="300"
                max="550"
                required
                value={donationForm.quantity_ml}
                onChange={(e) => setDonationForm({ ...donationForm, quantity_ml: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hemoglobin (CHECK &ge; 10.0 g/dL) *</label>
              <input
                type="number"
                step="0.1"
                min="10.0"
                required
                value={donationForm.hemoglobin_level}
                onChange={(e) => setDonationForm({ ...donationForm, hemoglobin_level: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Component Separation Units to Generate</label>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { id: 'WHOLE_BLOOD', name: 'Whole Blood (35d)' },
                { id: 'RBC', name: 'Packed RBC (35d)' },
                { id: 'PLATELETS', name: 'Platelets (5d)' },
                { id: 'PLASMA', name: 'Plasma (365d)' },
                { id: 'CRYO', name: 'Cryoprecipitate (365d)' },
              ].map((comp) => {
                const checked = donationForm.component_types.includes(comp.id);
                return (
                  <button
                    key={comp.id}
                    type="button"
                    onClick={() => toggleComponentType(comp.id)}
                    className={`p-2 rounded-lg border text-left text-xs font-semibold transition-all ${
                      checked ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${checked ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300'}`}>
                        {checked && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                      <span>{comp.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Phlebotomy Remarks</label>
            <input
              type="text"
              value={donationForm.remarks}
              onChange={(e) => setDonationForm({ ...donationForm, remarks: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddDonationOpen(false)}
              className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 shadow-sm"
            >
              Record Collection & Generate Units
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BloodBank;

