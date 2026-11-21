import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/common/PageHeader';
import { PageState } from '../components/common/PageState';
import { Button } from '../components/common/Button';
import { Input, Select } from '../components/common/FormControls';
import { Modal } from '../components/common/Modal';
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const HospitalManagement = () => {
  const { user } = useAuth();
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [wards, setWards] = useState([]);
  const [hierarchy, setHierarchy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [staffLoading, setStaffLoading] = useState(false);
  const [error, setError] = useState(null);

  // Staff search, filter, and pagination
  const [staffSearch, setStaffSearch] = useState('');
  const [staffDeptFilter, setStaffDeptFilter] = useState('');
  const [staffPage, setStaffPage] = useState(1);
  const pageSize = 15;

  // Modals
  const [isAddHospModalOpen, setIsAddHospModalOpen] = useState(false);
  const [isAddWardModalOpen, setIsAddWardModalOpen] = useState(false);
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [staffModalError, setStaffModalError] = useState(null);
  const [isSubmittingHosp, setIsSubmittingHosp] = useState(false);
  const [isSubmittingStaff, setIsSubmittingStaff] = useState(false);
  const [deletingStaffId, setDeletingStaffId] = useState(null);

  // New Hospital Form
  const initialHospState = {
    hospital_name: '',
    license_number: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    contact_phone: '',
    contact_email: '',
    emergency_helpline: '',
    established_year: 2010,
  };
  const [newHosp, setNewHosp] = useState(initialHospState);

  // New Ward Form
  const [newWard, setNewWard] = useState({
    ward_name: '',
    ward_type: 'ICU',
    floor_number: 1,
    total_beds: 20,
  });

  // New Staff Form (ADMIN only)
  const initialStaffState = {
    hospital_id: '',
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    date_of_birth: '1990-01-01',
    gender: 'MALE',
    blood_group: 'O+',
    job_title: '',
    department: 'Cardiovascular Surgery',
    system_role: 'DOCTOR',
    ward_id: '',
    supervisor_staff_id: '',
  };
  const [newStaff, setNewStaff] = useState(initialStaffState);

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/hospitals');
      if (res.data?.success) {
        const hospList = res.data.hospitals || [];
        setHospitals(hospList);
        if (hospList.length > 0) {
          // Keep current selection or default to first hospital
          const toSelect = selectedHospital
            ? hospList.find((h) => h.hospital_id === selectedHospital.hospital_id) || hospList[0]
            : hospList[0];
          handleSelectHospital(toSelect);
        } else if (user?.role === 'ADMIN') {
          fetchStaffHierarchy(null);
        }
      }
    } catch (err) {
      console.error('Failed to load hospitals:', err);
      setError('Unable to load hospital records from MySQL.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHospital = async (hosp) => {
    setSelectedHospital(hosp);
    setStaffSearch('');
    setStaffDeptFilter('');
    setStaffPage(1);
    // Fetch wards for the selected hospital
    try {
      const res = await api.get(`/hospitals/${hosp.hospital_id}/wards`);
      if (res.data?.success) {
        setWards(res.data.wards || []);
      }
    } catch (err) {
      console.error('Failed to load wards:', err);
    }
    // Fetch staff hierarchy strictly for ADMIN
    if (user?.role === 'ADMIN') {
      fetchStaffHierarchy(hosp.hospital_id);
    }
  };

  const fetchStaffHierarchy = async (hospitalId = null) => {
    try {
      setStaffLoading(true);
      const url = hospitalId
        ? `/hospitals/${hospitalId}/staff-hierarchy`
        : '/hospitals/staff-hierarchy';
      const res = await api.get(url);
      if (res.data?.success) {
        setHierarchy(res.data.rows || res.data.staff || []);
      }
    } catch (err) {
      console.warn('Hierarchy fetch error:', err);
    } finally {
      setStaffLoading(false);
    }
  };

  const handleCreateHospital = async (e) => {
    e.preventDefault();
    setModalError(null);
    setIsSubmittingHosp(true);
    try {
      const payload = {
        ...newHosp,
        contact_phone: (newHosp.contact_phone || newHosp.emergency_helpline || '').trim(),
        emergency_helpline: (newHosp.emergency_helpline || newHosp.contact_phone || '102').trim(),
        contact_email: (newHosp.contact_email || `${newHosp.hospital_name.toLowerCase().replace(/[^a-z0-9]/g, '')}@hospital.org`).trim(),
      };
      const res = await api.post('/hospitals', payload);
      if (res.data?.success) {
        setIsAddHospModalOpen(false);
        setFeedback({ type: 'success', message: res.data.message || 'Hospital registered successfully.' });
        setNewHosp(initialHospState);
        fetchHospitals();
      }
    } catch (err) {
      console.error('Failed to create hospital:', err);
      const errMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to create hospital record.';
      const fieldErrors = err.response?.data?.fields ? Object.values(err.response.data.fields).join(', ') : '';
      setModalError(fieldErrors ? `${errMsg} (${fieldErrors})` : errMsg);
    } finally {
      setIsSubmittingHosp(false);
    }
  };

  const handleCreateWard = async (e) => {
    e.preventDefault();
    if (!selectedHospital) return;
    try {
      const res = await api.post(`/hospitals/${selectedHospital.hospital_id}/wards`, newWard);
      if (res.data?.success) {
        setIsAddWardModalOpen(false);
        setFeedback({ type: 'success', message: res.data.message || 'Ward registered.' });
        handleSelectHospital(selectedHospital);
        fetchHospitals();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to add ward' });
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setStaffModalError(null);
    setIsSubmittingStaff(true);
    try {
      const hospId = newStaff.hospital_id || selectedHospital?.hospital_id;
      if (!hospId) {
        setStaffModalError('Please select a valid hospital.');
        setIsSubmittingStaff(false);
        return;
      }
      const res = await api.post(`/hospitals/${hospId}/staff`, newStaff);
      if (res.data?.success) {
        setIsAddStaffModalOpen(false);
        setFeedback({ type: 'success', message: res.data.message || 'Staff member registered successfully.' });
        setNewStaff(initialStaffState);
        fetchStaffHierarchy(selectedHospital?.hospital_id || null);
        fetchHospitals();
      }
    } catch (err) {
      console.error('Failed to add staff:', err);
      const errMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to register staff member.';
      const fieldErrors = err.response?.data?.fields ? Object.values(err.response.data.fields).join(', ') : '';
      setStaffModalError(fieldErrors ? `${errMsg} (${fieldErrors})` : errMsg);
    } finally {
      setIsSubmittingStaff(false);
    }
  };

  const handleRemoveStaff = async (staffId, staffName) => {
    if (!window.confirm(`Are you sure you want to remove staff member "${staffName}"? This action is restricted to administrators.`)) {
      return;
    }
    try {
      setDeletingStaffId(staffId);
      const res = await api.delete(`/hospitals/staff/${staffId}`);
      if (res.data?.success) {
        setFeedback({ type: 'success', message: res.data.message || 'Staff member removed successfully.' });
        fetchStaffHierarchy(selectedHospital?.hospital_id || null);
        fetchHospitals();
      }
    } catch (err) {
      console.error('Failed to remove staff:', err);
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to remove staff member.' });
    } finally {
      setDeletingStaffId(null);
    }
  };

  const departmentsList = Array.from(
    new Set(hierarchy.map((s) => s.department).filter(Boolean))
  ).sort();

  const filteredHierarchy = hierarchy.filter((row) => {
    const staffName = (row.employee_name || row.staff_name || '').toLowerCase();
    const title = (row.employee_title || row.job_title || '').toLowerCase();
    const dept = (row.department || '').toLowerCase();
    const idStr = String(row.employee_staff_id || row.staff_id || '');
    const searchLower = staffSearch.trim().toLowerCase();
    const matchesSearch =
      !searchLower ||
      staffName.includes(searchLower) ||
      title.includes(searchLower) ||
      dept.includes(searchLower) ||
      idStr.includes(searchLower);
    const matchesDept = !staffDeptFilter || row.department === staffDeptFilter;
    return matchesSearch && matchesDept;
  });

  const totalPages = Math.max(1, Math.ceil(filteredHierarchy.length / pageSize));
  const currentPage = Math.min(staffPage, totalPages);
  const paginatedHierarchy = filteredHierarchy.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        breadcrumb="Institutional Registry"
        title="Hospital Facilities & Ward Bed Allocations"
        description="Regional medical centers, specialized inpatient wards, and clinical staff supervision hierarchies enforcing recursive foreign key integrity."
        badge={`${hospitals.length} Affiliated Facilities`}
        action={
          user?.role === 'DEVELOPER' && (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setModalError(null);
                setIsAddHospModalOpen(true);
              }}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Register Hospital</span>
            </Button>
          )
        }
      />

      {/* Facility Scope / Role Indicator */}
      {user?.role !== 'DEVELOPER' && user?.hospital_name && (
        <div className="p-3 border border-rule bg-surface rounded-[2px] flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blood" />
            <span className="text-muted">Assigned Facility Ledger:</span>
            <span className="font-semibold text-ink">{user.hospital_name}</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-muted px-1.5 py-0.5 border border-rule bg-paper">
            Restricted View &bull; Institution #{user.hospital_id}
          </span>
        </div>
      )}
      {user?.role === 'DEVELOPER' && (
        <div className="p-3 border border-moss/40 bg-moss/10 rounded-[2px] flex items-center justify-between text-xs font-mono text-moss">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-moss" />
            <span className="font-bold">Developer Master View:</span>
            <span>Universal Cross-Hospital Ledger Access Active</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 border border-moss/40 bg-paper text-moss">
            DEVELOPER ACCESS
          </span>
        </div>
      )}

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

      <PageState loading={loading} error={error} onRetry={fetchHospitals}>
        {/* Hospital Facilities Grid */}
        <section aria-label="Affiliated Hospitals">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {hospitals.map((hosp) => {
              const isSelected = selectedHospital?.hospital_id === hosp.hospital_id;
              const totalBeds = hosp.total_beds ?? hosp.total_capacity ?? 0;
              const occupiedBeds = hosp.occupied_beds ?? hosp.total_occupied ?? 0;
              const occRate = hosp.occupancy_rate ?? (totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0);

              return (
                <div
                  key={hosp.hospital_id}
                  onClick={() => handleSelectHospital(hosp)}
                  className={`bg-surface p-4 border rounded-[2px] transition-colors cursor-pointer space-y-3 ${
                    isSelected ? 'border-blood bg-[#F9F7F1]' : 'border-rule hover:border-ink/40'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-serif text-base font-semibold text-ink leading-tight">
                        {hosp.hospital_name}
                      </h3>
                      <p className="font-mono text-[11px] text-muted mt-0.5">
                        {user?.role === 'ADMIN' && (
                          <>Lic: {hosp.license_number} &bull; </>
                        )}
                        Est. {hosp.established_year || '1995'}
                      </p>
                    </div>
                    {isSelected && (
                      <span className="font-mono text-[10px] text-blood border border-blood/30 px-1 py-0.2 rounded-[2px] uppercase">
                        Selected
                      </span>
                    )}
                  </div>

                  <div className="font-mono text-[11px] text-muted space-y-1">
                    <p className="text-ink">{hosp.address}, {hosp.city}</p>
                    <p>Helpline: <strong className="text-ink font-semibold">{hosp.emergency_helpline || hosp.contact_phone}</strong></p>
                    <p className="truncate">{hosp.contact_email}</p>
                  </div>

                  {/* Bed Occupancy: Thin 6px Flat Bar */}
                  <div className="pt-2 border-t border-rule space-y-1.5">
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-muted">Ward Bed Occupancy</span>
                      <span className="font-semibold text-ink tabular-nums">
                        {occupiedBeds} / {totalBeds} ({occRate}%)
                      </span>
                    </div>
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="text-muted">Remaining Beds:</span>
                      <span className={`font-semibold tabular-nums ${totalBeds - occupiedBeds > 0 ? 'text-moss' : 'text-blood'}`}>
                        {Math.max(0, totalBeds - occupiedBeds)} beds available
                      </span>
                    </div>
                    <div className="w-full bg-paper border border-rule h-1.5 rounded-[2px] overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          occRate > 95 ? 'bg-blood' : occRate > 80 ? 'bg-ochre' : 'bg-ink'
                        }`}
                        style={{ width: `${Math.min(100, occRate)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Selected Hospital Wards Section */}
        {selectedHospital && (
          <section className="p-5 bg-surface border border-rule rounded-[2px] space-y-4" aria-label="Wards Details">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3 pb-3 border-b border-rule">
              <div>
                <h2 className="font-serif text-lg font-semibold text-ink">
                  Inpatient Wards &bull; {selectedHospital.hospital_name}
                </h2>
                <p className="text-xs text-muted font-mono mt-0.5">
                  CHECK (occupied_beds &le; total_beds) constraint enforced by trigger trg_after_patient_insert_occupancy
                </p>
              </div>

              {(user?.role === 'ADMIN' || user?.role === 'DEVELOPER') && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsAddWardModalOpen(true)}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Add Ward</span>
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {wards.map((w) => {
                const rate = w.total_beds > 0 ? Math.round((w.occupied_beds / w.total_beds) * 100) : 0;
                const remaining = Math.max(0, w.total_beds - w.occupied_beds);
                return (
                  <div key={w.ward_id} className="p-3 bg-paper border border-rule rounded-[2px] space-y-2">
                    <div className="flex items-baseline justify-between font-mono text-[10px] uppercase text-muted">
                      <span>Floor {w.floor_number}</span>
                      <span className="text-ink font-semibold">{w.ward_type}</span>
                    </div>
                    <h4 className="font-serif text-sm font-semibold text-ink">
                      {w.ward_name}
                    </h4>
                    <div className="space-y-1.5 font-mono text-[11px] pt-1">
                      <div className="flex justify-between items-center">
                        <span className="text-muted">Remaining Beds:</span>
                        <span className={`font-semibold tabular-nums px-1.5 py-0.5 rounded-[2px] text-[10px] uppercase ${
                          remaining > 0 ? 'bg-moss/10 text-moss border border-moss/30' : 'bg-blood-soft/20 text-blood border border-blood/30'
                        }`}>
                          {remaining} Available
                        </span>
                      </div>
                      <div className="flex justify-between text-muted text-[10px]">
                        <span>Occupied / Total:</span>
                        <span className="font-semibold text-ink tabular-nums">
                          {w.occupied_beds} / {w.total_beds} ({rate}%)
                        </span>
                      </div>
                      <div className="w-full bg-surface border border-rule h-1.5 rounded-[2px] overflow-hidden">
                        <div
                          className={`h-full ${
                            rate > 95 ? 'bg-blood' : rate > 80 ? 'bg-ochre' : 'bg-ink'
                          }`}
                          style={{ width: `${Math.min(100, rate)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Staff Supervision Indented Tree (Self-Join Traversal) - Restricted to ADMIN and DEVELOPER */}
        {(user?.role === 'ADMIN' || user?.role === 'DEVELOPER') && (
          <section className="space-y-3" aria-label="Staff Hierarchy">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 pb-2 border-b border-rule">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-serif text-lg text-ink font-medium">
                  Clinical Staff Supervision Hierarchy
                </h2>
                {selectedHospital && (
                  <span className="font-mono text-[11px] px-2 py-0.5 bg-paper text-ink border border-rule rounded-[2px]">
                    {selectedHospital.hospital_name}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted mt-0.5">
                {selectedHospital
                  ? `Displaying clinical staff and supervision tree strictly assigned to ${selectedHospital.hospital_name}.`
                  : 'Evaluated using SQL recursive self-join (Staff subordinate LEFT JOIN Staff supervisor ON subordinate.supervisor_staff_id = supervisor.staff_id)'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-muted tabular-nums">
                {hierarchy.length} Staff Member{hierarchy.length === 1 ? '' : 's'}
              </span>
              {user?.role === 'DEVELOPER' && selectedHospital && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedHospital(null);
                    setWards([]);
                    setStaffSearch('');
                    setStaffDeptFilter('');
                    setStaffPage(1);
                    fetchStaffHierarchy(null);
                  }}
                  className="font-mono text-[11px] text-muted hover:text-ink underline decoration-dotted transition-colors"
                >
                  Show All Centers
                </button>
              )}
              {(user?.role === 'ADMIN' || user?.role === 'DEVELOPER') && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setStaffModalError(null);
                    setNewStaff({
                      ...initialStaffState,
                      hospital_id: selectedHospital ? selectedHospital.hospital_id : (hospitals[0]?.hospital_id || ''),
                    });
                    setIsAddStaffModalOpen(true);
                  }}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Add Staff</span>
                </Button>
              )}
            </div>
          </div>

          {/* Search & Department Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface p-2.5 border border-rule rounded-[2px]">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Filter staff by name, title, department, ID..."
                  value={staffSearch}
                  onChange={(e) => {
                    setStaffSearch(e.target.value);
                    setStaffPage(1);
                  }}
                  className="w-full pl-8 pr-3 py-1 bg-paper border border-rule text-ink text-xs rounded-[2px] focus:outline-none focus:border-ink font-mono"
                />
              </div>
              {staffSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setStaffSearch('');
                    setStaffPage(1);
                  }}
                  className="text-[10px] font-mono text-muted hover:text-ink px-1.5 py-1 border border-rule bg-paper rounded-[2px]"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={staffDeptFilter}
                onChange={(e) => {
                  setStaffDeptFilter(e.target.value);
                  setStaffPage(1);
                }}
                className="px-2.5 py-1 bg-paper border border-rule text-xs text-ink rounded-[2px] focus:outline-none font-mono"
              >
                <option value="">All Departments ({departmentsList.length})</option>
                {departmentsList.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {staffLoading ? (
            <div className="p-8 text-center text-xs font-mono text-muted border border-rule rounded-[2px] bg-surface">
              Loading facility staff hierarchy...
            </div>
          ) : hierarchy.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-muted border border-dashed border-rule rounded-[2px] bg-paper">
              No clinical staff currently registered under {selectedHospital?.hospital_name || 'this facility'}.
            </div>
          ) : filteredHierarchy.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-muted border border-dashed border-rule rounded-[2px] bg-paper">
              No staff members match the specified search query or department filter.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="border border-rule rounded-[2px] bg-surface overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-paper border-b border-rule font-mono text-[11px] uppercase tracking-wider text-muted">
                      <th className="py-2.5 px-3">Employee</th>
                      <th className="py-2.5 px-3">Designation</th>
                      <th className="py-2.5 px-3">Department</th>
                      <th className="py-2.5 px-3">Hospital Center</th>
                      <th className="py-2.5 px-3">Reports To (Supervisor)</th>
                      <th className="py-2.5 px-3">Hierarchical Tree</th>
                      {(user?.role === 'ADMIN' || user?.role === 'DEVELOPER') && (
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule font-mono text-xs">
                    {paginatedHierarchy.map((row) => {
                      const isTop = !row.supervisor_staff_id || row.supervisor_name?.includes('Executive');
                      const staffId = row.employee_staff_id || row.staff_id;
                      const staffName = row.employee_name || row.staff_name;
                      return (
                        <tr key={staffId} className="hover:bg-paper transition-colors">
                          <td className="py-2.5 px-3 font-sans font-medium text-ink">
                            <span>{staffName}</span>
                            <span className="font-mono text-[10px] text-muted ml-1.5">
                              #{staffId}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-ink font-sans">
                            {row.employee_title || row.job_title}
                          </td>
                          <td className="py-2.5 px-3 text-muted font-sans">
                            {row.department}
                          </td>
                          <td className="py-2.5 px-3 text-muted font-sans">
                            {row.hospital_name}
                          </td>
                          <td className="py-2.5 px-3 font-sans">
                            {isTop ? (
                              <span className="text-muted italic">Direct Report (Hospital Executive)</span>
                            ) : (
                              <span className="text-ink font-medium">
                                {row.supervisor_name} ({row.supervisor_title})
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {isTop ? (
                              <span className="text-blood font-mono text-[10px] font-semibold uppercase">
                                [Level 0: Director]
                              </span>
                            ) : (
                              <span className="text-muted font-mono text-[10px]">
                                &boxur;&mdash;&mdash; [Level 1: Subordinate]
                              </span>
                            )}
                          </td>
                          {(user?.role === 'ADMIN' || user?.role === 'DEVELOPER') && (
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                disabled={deletingStaffId === staffId}
                                onClick={() => handleRemoveStaff(staffId, staffName)}
                                className="font-mono text-[10px] uppercase text-blood hover:opacity-80 underline decoration-dotted transition-colors disabled:opacity-50"
                                title="Remove staff member from hospital roster"
                              >
                                {deletingStaffId === staffId ? 'Removing...' : 'Remove'}
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Staff Pagination Bar */}
              <div className="flex items-center justify-between text-xs font-mono text-muted pt-2 border-t border-rule">
                <span>
                  Page {currentPage} of {totalPages} &bull; Showing {(currentPage - 1) * pageSize + 1}–
                  {Math.min(currentPage * pageSize, filteredHierarchy.length)} of {filteredHierarchy.length} records
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setStaffPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="p-1 border border-rule bg-surface text-ink hover:bg-paper disabled:opacity-30 rounded-[2px]"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 py-1 text-ink font-semibold">{currentPage}</span>
                  <button
                    type="button"
                    onClick={() => setStaffPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="p-1 border border-rule bg-surface text-ink hover:bg-paper disabled:opacity-30 rounded-[2px]"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
          </section>
        )}
      </PageState>

      {/* Add Hospital Modal */}
      <Modal
        isOpen={isAddHospModalOpen}
        onClose={() => setIsAddHospModalOpen(false)}
        title="Register Hospital Facility"
        subtitle="Generates institutional entity record in MySQL lifelink_db"
      >
        <form onSubmit={handleCreateHospital} className="space-y-3.5">
          {modalError && (
            <div className="p-2.5 border border-blood/40 bg-blood-soft/20 text-blood text-xs font-mono rounded-[2px]">
              {modalError}
            </div>
          )}
          <Input
            label="Hospital Legal Name"
            required
            value={newHosp.hospital_name}
            onChange={(e) => setNewHosp({ ...newHosp, hospital_name: e.target.value })}
            placeholder="e.g. Max Super Speciality Hospital"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="License Number"
              required
              value={newHosp.license_number}
              onChange={(e) => setNewHosp({ ...newHosp, license_number: e.target.value })}
              placeholder="e.g. DL-HOSP-2026-99"
            />
            <Input
              label="Established Year"
              type="number"
              value={newHosp.established_year}
              onChange={(e) => setNewHosp({ ...newHosp, established_year: parseInt(e.target.value, 10) })}
            />
          </div>
          <Input
            label="Address"
            required
            value={newHosp.address}
            onChange={(e) => setNewHosp({ ...newHosp, address: e.target.value })}
          />
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="City"
              required
              value={newHosp.city}
              onChange={(e) => setNewHosp({ ...newHosp, city: e.target.value })}
            />
            <Input
              label="State"
              required
              value={newHosp.state}
              onChange={(e) => setNewHosp({ ...newHosp, state: e.target.value })}
            />
            <Input
              label="Pincode"
              required
              value={newHosp.pincode}
              onChange={(e) => setNewHosp({ ...newHosp, pincode: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Contact Phone"
              required
              value={newHosp.contact_phone}
              onChange={(e) => setNewHosp({ ...newHosp, contact_phone: e.target.value })}
              placeholder="+91-11-26588500"
            />
            <Input
              label="Emergency Helpline"
              required
              value={newHosp.emergency_helpline}
              onChange={(e) => setNewHosp({ ...newHosp, emergency_helpline: e.target.value })}
              placeholder="102 or +91-..."
            />
            <Input
              label="Contact Email"
              type="email"
              required
              value={newHosp.contact_email}
              onChange={(e) => setNewHosp({ ...newHosp, contact_email: e.target.value })}
              placeholder="admin@hospital.org"
            />
          </div>
          <div className="pt-3 border-t border-rule flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsAddHospModalOpen(false)} disabled={isSubmittingHosp}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmittingHosp}>
              {isSubmittingHosp ? 'Registering...' : 'Register Facility'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Ward Modal */}
      <Modal
        isOpen={isAddWardModalOpen}
        onClose={() => setIsAddWardModalOpen(false)}
        title="Add Inpatient Ward"
        subtitle={selectedHospital ? `Assigning to ${selectedHospital.hospital_name}` : ''}
      >
        <form onSubmit={handleCreateWard} className="space-y-3.5">
          <Input
            label="Ward Name"
            required
            value={newWard.ward_name}
            onChange={(e) => setNewWard({ ...newWard, ward_name: e.target.value })}
            placeholder="e.g. Critical Oncology Unit"
          />
          <div className="grid grid-cols-3 gap-3">
            <Select
              label="Ward Classification"
              value={newWard.ward_type}
              onChange={(e) => setNewWard({ ...newWard, ward_type: e.target.value })}
            >
              <option value="ICU">ICU</option>
              <option value="EMERGENCY">Emergency</option>
              <option value="SURGICAL">Surgical</option>
              <option value="TRANSPLANT_CARE">Transplant Care</option>
              <option value="PEDIATRIC">Pediatric</option>
            </Select>
            <Input
              label="Floor Number"
              type="number"
              required
              value={newWard.floor_number}
              onChange={(e) => setNewWard({ ...newWard, floor_number: parseInt(e.target.value, 10) })}
            />
            <Input
              label="Total Bed Capacity"
              type="number"
              required
              min="1"
              value={newWard.total_beds}
              onChange={(e) => setNewWard({ ...newWard, total_beds: parseInt(e.target.value, 10) })}
            />
          </div>
          <div className="pt-3 border-t border-rule flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsAddWardModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Ward
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Staff Modal (ADMIN ONLY) */}
      <Modal
        isOpen={isAddStaffModalOpen}
        onClose={() => setIsAddStaffModalOpen(false)}
        title="Register Clinical Staff Member"
        subtitle="Administrator Action: Inserts Person supertype and Staff subtype enforcing recursive foreign key integrity"
      >
        <form onSubmit={handleCreateStaff} className="space-y-3.5">
          {staffModalError && (
            <div className="p-2.5 border border-blood/40 bg-blood-soft/20 text-blood text-xs font-mono rounded-[2px]">
              {staffModalError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Assigned Hospital"
              required
              value={newStaff.hospital_id}
              onChange={(e) => {
                const hospId = parseInt(e.target.value, 10);
                setNewStaff({ ...newStaff, hospital_id: hospId, ward_id: '', supervisor_staff_id: '' });
              }}
            >
              <option value="">-- Select Hospital Center --</option>
              {hospitals.map((h) => (
                <option key={h.hospital_id} value={h.hospital_id}>
                  {h.hospital_name}
                </option>
              ))}
            </Select>

            <Select
              label="System Role"
              value={newStaff.system_role}
              onChange={(e) => setNewStaff({ ...newStaff, system_role: e.target.value })}
            >
              <option value="DOCTOR">Doctor</option>
              <option value="NURSE">Nurse</option>
              <option value="LAB_TECHNICIAN">Lab Technician</option>
              <option value="INVENTORY_COORDINATOR">Inventory Coordinator</option>
              <option value="ADMIN">Administrator</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              required
              value={newStaff.first_name}
              onChange={(e) => setNewStaff({ ...newStaff, first_name: e.target.value })}
              placeholder="e.g. Meera"
            />
            <Input
              label="Last Name"
              required
              value={newStaff.last_name}
              onChange={(e) => setNewStaff({ ...newStaff, last_name: e.target.value })}
              placeholder="e.g. Sen"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Contact Phone"
              required
              value={newStaff.phone}
              onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
              placeholder="+91-9811223344"
            />
            <Input
              label="Email Address"
              type="email"
              value={newStaff.email}
              onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
              placeholder="m.sen@hospital.org"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Job Title / Designation"
              required
              value={newStaff.job_title}
              onChange={(e) => setNewStaff({ ...newStaff, job_title: e.target.value })}
              placeholder="e.g. Lead Transplant Specialist"
            />
            <Input
              label="Department"
              required
              value={newStaff.department}
              onChange={(e) => setNewStaff({ ...newStaff, department: e.target.value })}
              placeholder="e.g. Organ Transplantation"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Assigned Ward (Optional)"
              value={newStaff.ward_id}
              onChange={(e) => setNewStaff({ ...newStaff, ward_id: e.target.value })}
            >
              <option value="">Hospital-Wide (No specific ward)</option>
              {wards.map((w) => (
                <option key={w.ward_id} value={w.ward_id}>
                  {w.ward_name} ({w.ward_type})
                </option>
              ))}
            </Select>

            <Select
              label="Reports To (Supervisor)"
              value={newStaff.supervisor_staff_id}
              onChange={(e) => setNewStaff({ ...newStaff, supervisor_staff_id: e.target.value })}
            >
              <option value="">None (Level 0: Director / Executive)</option>
              {hierarchy.map((s) => (
                <option key={s.employee_staff_id || s.staff_id} value={s.employee_staff_id || s.staff_id}>
                  {s.employee_name || s.staff_name} ({s.employee_title || s.job_title})
                </option>
              ))}
            </Select>
          </div>

          <div className="pt-3 border-t border-rule flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsAddStaffModalOpen(false)} disabled={isSubmittingStaff}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmittingStaff}>
              {isSubmittingStaff ? 'Registering...' : 'Add Staff Member'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default HospitalManagement;
