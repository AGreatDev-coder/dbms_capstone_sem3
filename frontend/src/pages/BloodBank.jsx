import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { Plus } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [bgFilter, setBgFilter] = useState('');
  const [compFilter, setCompFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [hospFilter, setHospFilter] = useState('');

  // Add Donation Modal
  const [isAddDonationOpen, setIsAddDonationOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);
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
      const [hRes, dRes] = await Promise.all([
        api.get('/hospitals'),
        api.get('/donors'),
      ]);
      if (hRes.data?.success) setHospitals(hRes.data.hospitals || []);
      if (dRes.data?.success) {
        const dList = dRes.data.donors || [];
        setDonors(dList);
        if (dList.length > 0) {
          setDonationForm((prev) => ({ ...prev, donor_id: dList[0].donor_id }));
        }
      }
    } catch (err) {
      console.error('Initial data fetch error:', err);
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (bgFilter) params.blood_group = bgFilter;
      if (compFilter) params.component_type = compFilter;
      if (statusFilter) params.storage_status = statusFilter;
      if (hospFilter) params.hospital_id = hospFilter;

      const res = await api.get('/blood-bank/inventory', { params });
      if (res.data?.success) {
        setInventory(res.data.units || res.data.inventory || []);
      }
    } catch (err) {
      console.error('Inventory fetch error:', err);
      setError('Failed to retrieve inventory records from MySQL.');
    } finally {
      setLoading(false);
    }
  };

  const fetchExpiring = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/blood-bank/expiring-soon');
      if (res.data?.success) {
        setExpiringUnits(res.data.expiringUnits || []);
      }
    } catch (err) {
      console.error('Expiring fetch error:', err);
      setError('Failed to run Query 2 CTE expiry tracking.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/blood-bank/summary');
      if (res.data?.success) {
        setSummary(res.data.summary || []);
      }
    } catch (err) {
      console.error('Summary fetch error:', err);
      setError('Failed to load hospital stock matrix.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDonations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/blood-bank/donations');
      if (res.data?.success) {
        setDonations(res.data.donations || []);
      }
    } catch (err) {
      console.error('Donations fetch error:', err);
      setError('Failed to load donation logs.');
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
        setFeedback({ type: 'success', message: res.data.message });
        fetchInventory();
        fetchDonations();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to record donation' });
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

  const tabs = [
    { id: 'inventory', label: 'Inventory Ledger', count: inventory.length },
    { id: 'expiring', label: 'Query 2: Expiry CTE', count: expiringUnits.length },
    { id: 'summary', label: 'Stock Matrix' },
    { id: 'donations', label: 'Harvest Logs', count: donations.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        breadcrumb="Component Inventory & Preservation"
        title="Blood Bank Reserve Ledger"
        description="Catalog of perishable blood bags, component fractionation (RBC, Platelets, Plasma, Cryo), shelf-life monitoring, and donation harvest logging."
        badge={`${inventory.length} Cataloged Units`}
        action={
          (user?.role === 'ADMIN' || user?.role === 'STAFF') && (
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsAddDonationOpen(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Record Phlebotomy</span>
            </Button>
          )
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

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* TAB 1: INVENTORY TABLE */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="p-3 bg-surface border border-rule rounded-[2px] flex flex-wrap items-center gap-3 text-xs">
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted">Filter Reserves:</span>
            <select
              value={bgFilter}
              onChange={(e) => setBgFilter(e.target.value)}
              className="px-2 py-1.5 bg-paper border border-rule text-xs text-ink rounded-[2px] focus:outline-none"
            >
              <option value="">All Phenotypes</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>

            <select
              value={compFilter}
              onChange={(e) => setCompFilter(e.target.value)}
              className="px-2 py-1.5 bg-paper border border-rule text-xs text-ink rounded-[2px] focus:outline-none"
            >
              <option value="">All Components</option>
              <option value="WHOLE_BLOOD">Whole Blood</option>
              <option value="RBC">Packed RBC</option>
              <option value="PLATELETS">Platelets</option>
              <option value="PLASMA">Fresh Frozen Plasma</option>
              <option value="CRYO">Cryoprecipitate</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1.5 bg-paper border border-rule text-xs text-ink rounded-[2px] focus:outline-none"
            >
              <option value="">All Storage States</option>
              <option value="AVAILABLE">Available</option>
              <option value="ALLOCATED">Allocated</option>
              <option value="EXPIRED">Expired</option>
              <option value="RESERVED">Reserved</option>
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

            {(bgFilter || compFilter || statusFilter || hospFilter) && (
              <button
                onClick={() => {
                  setBgFilter('');
                  setCompFilter('');
                  setStatusFilter('');
                  setHospFilter('');
                }}
                className="text-xs text-muted hover:text-ink underline ml-auto font-mono"
              >
                Clear Filters
              </button>
            )}
          </div>

          <PageState
            loading={loading}
            error={error}
            empty={inventory.length === 0}
            emptyTitle="No inventory matches"
            emptyDescription="No blood units matched the specified storage criteria."
            onRetry={fetchInventory}
          >
            <div className="border border-rule rounded-[2px] bg-surface overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-paper border-b border-rule font-mono text-[11px] uppercase tracking-wider text-muted">
                    <th className="py-2.5 px-3">Unit Tag</th>
                    <th className="py-2.5 px-3">Phenotype</th>
                    <th className="py-2.5 px-3">Component Fraction</th>
                    <th className="py-2.5 px-3">Preservation Facility</th>
                    <th className="py-2.5 px-3">Storage Bay / Rack</th>
                    <th className="py-2.5 px-3">Harvest Date</th>
                    <th className="py-2.5 px-3">Expiry Date</th>
                    <th className="py-2.5 px-3">Shelf Life Remaining</th>
                    <th className="py-2.5 px-3 text-right">State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule font-mono tabular-nums">
                  {inventory.map((unit) => {
                    const daysLeft = unit.days_to_expiry !== undefined ? unit.days_to_expiry : 15;
                    const isExp = unit.is_expired || daysLeft < 0;

                    return (
                      <tr key={unit.unit_id} className="hover:bg-paper transition-colors">
                        <td className="py-2 px-3 font-semibold text-ink">
                          #{unit.unit_id}
                        </td>
                        <td className="py-2 px-3">
                          <BloodGroupStamp bloodGroup={unit.blood_group} size="sm" />
                        </td>
                        <td className="py-2 px-3 font-sans text-ink font-medium">
                          {unit.component_type}
                        </td>
                        <td className="py-2 px-3 font-sans text-muted text-[11px]">
                          {unit.hospital_name}
                        </td>
                        <td className="py-2 px-3 text-muted text-[11px]">
                          {unit.storage_location}
                        </td>
                        <td className="py-2 px-3 text-muted text-[11px]">
                          {unit.donation_date}
                        </td>
                        <td className="py-2 px-3 font-medium text-ink">
                          {unit.expiry_date}
                        </td>
                        <td className="py-2 px-3">
                          {isExp ? (
                            <span className="text-blood font-semibold">Expired</span>
                          ) : (
                            <span
                              className={`font-mono text-xs ${
                                daysLeft <= 2
                                  ? 'text-blood font-bold'
                                  : daysLeft <= 7
                                  ? 'text-ochre font-semibold'
                                  : 'text-moss'
                              }`}
                            >
                              {daysLeft} days remaining
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <StatusDot status={unit.storage_status} />
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

      {/* TAB 2: QUERY 2 EXPIRY TRACKING CTE */}
      {activeTab === 'expiring' && (
        <div className="space-y-4">
          <div className="p-4 bg-surface border border-rule rounded-[2px] text-xs space-y-1">
            <p className="font-mono text-[11px] uppercase tracking-wider text-ochre font-semibold">
              Query 2 &bull; Common Table Expression (WITH ExpiringUnitsCTE AS ...)
            </p>
            <p className="text-muted leading-relaxed">
              Isolates available bags with remaining shelf life &le; 7 days, excluding already discarded or allocated units.
              Urgency thresholds apply clinical triage: &lt;48h requires emergency transfer or priority assignment; &lt;7d requires clinical queue monitoring.
            </p>
          </div>

          <PageState
            loading={loading}
            error={error}
            empty={expiringUnits.length === 0}
            emptyTitle="Zero units approaching expiration"
            emptyDescription="All available inventory is within safe preservation windows (> 7 days remaining)."
            onRetry={fetchExpiring}
          >
            <div className="border border-rule rounded-[2px] bg-surface overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-paper border-b border-rule font-mono text-[11px] uppercase tracking-wider text-muted">
                    <th className="py-2.5 px-3">Unit Tag</th>
                    <th className="py-2.5 px-3">Phenotype</th>
                    <th className="py-2.5 px-3">Component</th>
                    <th className="py-2.5 px-3">Facility</th>
                    <th className="py-2.5 px-3">Expiry Date</th>
                    <th className="py-2.5 px-3">Remaining Window</th>
                    <th className="py-2.5 px-3">Cold Storage Location</th>
                    <th className="py-2.5 px-3 text-right">Clinical Protocol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule font-mono tabular-nums">
                  {expiringUnits.map((u) => {
                    const daysLeft = u.remaining_shelf_life_days;
                    const isCritical = daysLeft <= 2;

                    return (
                      <tr key={u.unit_id} className="hover:bg-paper transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-ink">
                          #{u.unit_id}
                        </td>
                        <td className="py-2.5 px-3">
                          <BloodGroupStamp bloodGroup={u.blood_group} size="sm" />
                        </td>
                        <td className="py-2.5 px-3 font-sans text-ink">{u.component_type}</td>
                        <td className="py-2.5 px-3 font-sans text-muted text-[11px]">{u.hospital_name}</td>
                        <td className="py-2.5 px-3 font-semibold text-ink">{u.expiry_date}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`font-semibold ${
                              isCritical ? 'text-blood font-bold' : 'text-ochre'
                            }`}
                          >
                            {daysLeft} days remaining
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-muted text-[11px]">{u.storage_location}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span
                            className={`text-[11px] font-sans font-medium ${
                              isCritical ? 'text-blood font-semibold' : 'text-ochre'
                            }`}
                          >
                            {u.action_recommendation || (isCritical ? 'Immediate Transfusion Standby' : 'Monitor Usage')}
                          </span>
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

      {/* TAB 3: STOCK MATRIX GRID */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          <div className="p-4 bg-surface border border-rule rounded-[2px] text-xs space-y-1">
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted font-semibold">
              Query 3 &bull; Hospital-Wise Conditional Aggregation (Pivot CTE)
            </p>
            <p className="text-muted leading-relaxed">
              Computes multi-dimensional stock matrix evaluating available vs expiring vs expired units by phenotype across regional facilities.
            </p>
          </div>

          <PageState
            loading={loading}
            error={error}
            empty={summary.length === 0}
            emptyTitle="Stock matrix empty"
            emptyDescription="No summary aggregation returned."
            onRetry={fetchSummary}
          >
            <div className="border border-rule rounded-[2px] bg-surface overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-paper border-b border-rule font-mono text-[11px] uppercase tracking-wider text-muted">
                    <th className="py-2.5 px-3">Hospital Center</th>
                    <th className="py-2.5 px-3">Phenotype</th>
                    <th className="py-2.5 px-3 text-right">Available Bags</th>
                    <th className="py-2.5 px-3 text-right">Expiring &le; 7d</th>
                    <th className="py-2.5 px-3 text-right">Expired</th>
                    <th className="py-2.5 px-3 text-right">Allocated</th>
                    <th className="py-2.5 px-3 text-right">Cataloged Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule font-mono tabular-nums">
                  {summary.map((row, idx) => (
                    <tr key={`${row.hospital_name}-${row.blood_group}-${idx}`} className="hover:bg-paper transition-colors">
                      <td className="py-2 px-3 font-sans font-medium text-ink">
                        {row.hospital_name}
                      </td>
                      <td className="py-2 px-3">
                        <BloodGroupStamp bloodGroup={row.blood_group} size="sm" />
                      </td>
                      <td className={`py-2 px-3 text-right font-semibold ${row.available_units > 0 ? 'text-moss' : 'text-muted'}`}>
                        {row.available_units}
                      </td>
                      <td className={`py-2 px-3 text-right ${row.expiring_soon_7d > 0 ? 'text-ochre font-semibold' : 'text-muted'}`}>
                        {row.expiring_soon_7d}
                      </td>
                      <td className={`py-2 px-3 text-right ${row.expired_units > 0 ? 'text-blood' : 'text-muted'}`}>
                        {row.expired_units}
                      </td>
                      <td className="py-2 px-3 text-right text-muted">
                        {row.allocated_units}
                      </td>
                      <td className="py-2 px-3 text-right font-medium text-ink">
                        {row.total_units_cataloged}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PageState>
        </div>
      )}

      {/* TAB 4: DONATIONS HARVEST LOGS */}
      {activeTab === 'donations' && (
        <div className="space-y-4">
          <PageState
            loading={loading}
            error={error}
            empty={donations.length === 0}
            emptyTitle="No donations recorded"
            emptyDescription="No blood collections logged in BloodDonation entity."
            onRetry={fetchDonations}
          >
            <div className="border border-rule rounded-[2px] bg-surface overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-paper border-b border-rule font-mono text-[11px] uppercase tracking-wider text-muted">
                    <th className="py-2.5 px-3">Donation ID</th>
                    <th className="py-2.5 px-3">Donor Name</th>
                    <th className="py-2.5 px-3">Phenotype</th>
                    <th className="py-2.5 px-3">Harvest Facility</th>
                    <th className="py-2.5 px-3">Collection Date</th>
                    <th className="py-2.5 px-3">Volume Collected</th>
                    <th className="py-2.5 px-3">Lab Hemoglobin</th>
                    <th className="py-2.5 px-3 text-right">Screening Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule font-mono tabular-nums">
                  {donations.map((d) => (
                    <tr key={d.donation_id} className="hover:bg-paper transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-ink">
                        #{d.donation_id}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-ink font-medium">
                        {d.donor_name}
                      </td>
                      <td className="py-2.5 px-3">
                        <BloodGroupStamp bloodGroup={d.blood_group} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 font-sans text-muted text-[11px]">{d.hospital_name}</td>
                      <td className="py-2.5 px-3 text-muted text-[11px]">{d.donation_date}</td>
                      <td className="py-2.5 px-3 text-ink font-medium">{d.quantity_ml} mL</td>
                      <td className="py-2.5 px-3 font-semibold text-ink">{d.hemoglobin_level} g/dL</td>
                      <td className="py-2.5 px-3 text-right">
                        <StatusDot status={d.screening_status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PageState>
        </div>
      )}

      {/* Record Blood Donation Modal */}
      <Modal
        isOpen={isAddDonationOpen}
        onClose={() => setIsAddDonationOpen(false)}
        title="Record Voluntary Blood Donation"
        subtitle="Generates BloodDonation entity and fractionated BloodUnit storage bags"
      >
        <form onSubmit={handleCreateDonation} className="space-y-3.5">
          <Select
            label="Registered Volunteer Donor"
            value={donationForm.donor_id}
            onChange={(e) => setDonationForm({ ...donationForm, donor_id: e.target.value })}
          >
            {donors.map((d) => (
              <option key={d.donor_id} value={d.donor_id}>
                #{d.donor_id} &bull; {d.name} ({d.blood_group}) &bull; {d.donor_type}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Receiving Hospital Facility"
              value={donationForm.hospital_id}
              onChange={(e) => setDonationForm({ ...donationForm, hospital_id: parseInt(e.target.value, 10) })}
            >
              {hospitals.map((h) => (
                <option key={h.hospital_id} value={h.hospital_id}>{h.hospital_name}</option>
              ))}
            </Select>

            <Input
              label="Hemoglobin Level (g/dL)"
              type="number"
              step="0.1"
              min="12.5"
              max="20"
              required
              value={donationForm.hemoglobin_level}
              onChange={(e) => setDonationForm({ ...donationForm, hemoglobin_level: parseFloat(e.target.value) })}
              helperText="CHECK (hemoglobin_level >= 12.5) clinical requirement"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink mb-1.5">
              Fractionation Components to Catalog:
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              {[
                { id: 'WHOLE_BLOOD', label: 'Whole Blood (35 days)' },
                { id: 'RBC', label: 'Packed RBC (42 days)' },
                { id: 'PLATELETS', label: 'Platelets (5 days - Shaker)' },
                { id: 'PLASMA', label: 'Fresh Frozen Plasma (365 days)' },
              ].map((c) => {
                const isChecked = donationForm.component_types.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleComponentType(c.id)}
                    className={`p-2 border rounded-[2px] text-left transition-colors ${
                      isChecked
                        ? 'border-blood bg-blood-soft/20 text-blood font-semibold'
                        : 'border-rule bg-paper text-muted hover:border-ink'
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Textarea
            label="Technologist Screening Remarks"
            rows={2}
            value={donationForm.remarks}
            onChange={(e) => setDonationForm({ ...donationForm, remarks: e.target.value })}
          />

          <div className="pt-3 border-t border-rule flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsAddDonationOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Log Harvest & Generate Units
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BloodBank;
