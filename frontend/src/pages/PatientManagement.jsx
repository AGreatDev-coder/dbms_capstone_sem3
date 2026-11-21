import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/common/PageHeader';
import { PageState } from '../components/common/PageState';
import { Button } from '../components/common/Button';
import { Input, Select, Textarea } from '../components/common/FormControls';
import { StatusDot } from '../components/common/StatusDot';
import { BloodGroupStamp } from '../components/common/BloodGroupStamp';
import { Modal } from '../components/common/Modal';
import { Drawer } from '../components/common/Drawer';
import { ChevronLeft, ChevronRight, Search, Plus } from 'lucide-react';

const PatientManagement = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [hospitalFilter, setHospitalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('');
  const [sortBy, setSortBy] = useState('admission_date');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modals & Drawers
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [drawerPatient, setDrawerPatient] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // New Patient Form
  const [newPatient, setNewPatient] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '1985-06-20',
    gender: 'MALE',
    phone: '',
    email: '',
    address: 'City Care Ward',
    city: 'New Delhi',
    blood_group: 'O+',
    hospital_id: 1,
    ward_id: 1,
    medical_status: 'STABLE',
    medical_notes: 'Inpatient admission record.',
  });

  // Update Status Form
  const [statusUpdate, setStatusUpdate] = useState({
    medical_status: 'STABLE',
    ward_id: '',
    medical_notes: '',
    phone: '',
    city: '',
  });

  useEffect(() => {
    fetchPatients();
  }, [hospitalFilter, statusFilter, bloodGroupFilter, sortBy, sortOrder, currentPage]);

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);

      if (user?.role === 'PATIENT') {
        const patientId = user?.patient_id || 20001;
        const res = await api.get(`/patients/${patientId}`);
        if (res.data?.success) {
          setPatients(res.data.patient ? [res.data.patient] : []);
          setTotalCount(1);
          setTotalPages(1);
        }
        return;
      }

      const params = {
        page: currentPage,
        limit: pageSize,
        sortBy,
        sortOrder,
      };
      if (hospitalFilter) params.hospital_id = hospitalFilter;
      if (statusFilter) params.medical_status = statusFilter;
      if (bloodGroupFilter) params.blood_group = bloodGroupFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await api.get('/patients', { params });
      if (res.data?.success) {
        setPatients(res.data.patients || []);
        setTotalCount(res.data.count || 0);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load patients:', err);
      setError(err.response?.data?.message || 'Failed to retrieve patient registry from MySQL.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPatients();
  };

  const fetchHospitals = async () => {
    try {
      const res = await api.get('/hospitals');
      if (res.data?.success) {
        setHospitals(res.data.hospitals || []);
        if (res.data.hospitals.length > 0) {
          fetchWardsForHosp(res.data.hospitals[0].hospital_id);
        }
      }
    } catch (err) {
      console.error('Failed to load hospitals:', err);
    }
  };

  const fetchWardsForHosp = async (hospId) => {
    try {
      const res = await api.get(`/hospitals/${hospId}/wards`);
      if (res.data?.success) {
        setWards(res.data.wards || []);
        if (res.data.wards.length > 0) {
          setNewPatient((prev) => ({ ...prev, ward_id: res.data.wards[0].ward_id }));
        }
      }
    } catch (err) {
      console.error('Failed to load wards:', err);
    }
  };

  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/patients', newPatient);
      if (res.data?.success) {
        setIsRegisterModalOpen(false);
        setFeedback({ type: 'success', message: res.data.message });
        fetchPatients();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Registration failed.' });
    }
  };

  const handleOpenUpdate = (pt) => {
    setSelectedPatient(pt);
    setStatusUpdate({
      medical_status: pt.medical_status,
      ward_id: pt.ward_id || '',
      medical_notes: pt.medical_notes || '',
      phone: pt.phone || '',
      city: pt.city || '',
    });
    fetchWardsForHosp(pt.hospital_id);
    setIsUpdateModalOpen(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    try {
      const res = await api.put(`/patients/${selectedPatient.patient_id}`, statusUpdate);
      if (res.data?.success) {
        setIsUpdateModalOpen(false);
        setFeedback({ type: 'success', message: res.data.message });
        fetchPatients();
        if (drawerPatient?.patient_id === selectedPatient.patient_id) {
          setDrawerPatient({ ...drawerPatient, ...statusUpdate });
        }
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Update failed.' });
    }
  };

  const handleDeletePatient = async (patientId, patientName) => {
    if (!window.confirm(`Discharge and archive patient record #${patientId} (${patientName})?`)) {
      return;
    }

    try {
      const res = await api.delete(`/patients/${patientId}`);
      if (res.data?.success) {
        setFeedback({ type: 'success', message: res.data.message });
        if (drawerPatient?.patient_id === patientId) setDrawerPatient(null);
        fetchPatients();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || `Failed to archive #${patientId}` });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        breadcrumb="Clinical Subtype Registry"
        title="Inpatient Registry (400 Dataset)"
        description="Patient specialization records mapped from Person supertype, managing ward occupancy triggers, assigned clinicians, and emergency contacts."
        badge={`${totalCount} Total Inpatients`}
        action={
          (user?.role === 'ADMIN' || user?.role === 'STAFF' || user?.role === 'DEVELOPER') && (
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsRegisterModalOpen(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Admit Patient</span>
            </Button>
          )
        }
      />

      {/* Facility Scope Indicator */}
      {user?.role !== 'DEVELOPER' && user?.hospital_name && (
        <div className="p-3 border border-rule bg-surface rounded-[2px] flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blood" />
            <span className="text-muted">Inpatient Records Scoped To:</span>
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
            <span className="font-bold">Universal Patient Directory:</span>
            <span>Unrestricted ledger view across all 6 affiliated healthcare networks</span>
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

      {/* Search & Filter Toolbar */}
      <div className="p-3 bg-surface border border-rule rounded-[2px] flex flex-col md:flex-row gap-3 text-xs items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search by name, phone, city, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-paper border border-rule text-ink text-xs rounded-[2px] focus:outline-none focus:border-ink font-mono"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">
            Search
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {user?.role === 'DEVELOPER' ? (
            <select
              value={hospitalFilter}
              onChange={(e) => {
                setHospitalFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2 py-1.5 bg-paper border border-rule text-xs text-ink rounded-[2px] focus:outline-none"
            >
              <option value="">All Hospitals (Universal View)</option>
              {hospitals.map((h) => (
                <option key={h.hospital_id} value={h.hospital_id}>
                  {h.hospital_name}
                </option>
              ))}
            </select>
          ) : (
            <div className="px-2.5 py-1.5 bg-surface border border-rule text-xs text-muted rounded-[2px] font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blood" />
              <span>{user?.hospital_name || 'Assigned Center'}</span>
            </div>
          )}

          <select
            value={bloodGroupFilter}
            onChange={(e) => {
              setBloodGroupFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2 py-1.5 bg-paper border border-rule text-xs text-ink rounded-[2px] focus:outline-none"
          >
            <option value="">All Phenotypes</option>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
              <option key={bg} value={bg}>
                {bg}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2 py-1.5 bg-paper border border-rule text-xs text-ink rounded-[2px] focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="CRITICAL">Critical</option>
            <option value="STABLE">Stable</option>
            <option value="RECOVERING">Recovering</option>
            <option value="DISCHARGED">Discharged</option>
          </select>
        </div>
      </div>

      <PageState
        loading={loading}
        error={error}
        empty={patients.length === 0}
        emptyTitle="No patient records found"
        emptyDescription="No inpatients matched the active search and filter criteria."
        onRetry={fetchPatients}
      >
        {/* Dense Clinical Records Table (40px rows, sticky header) */}
        <div className="border border-rule rounded-[2px] bg-surface overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-paper border-b border-rule font-mono text-[11px] uppercase tracking-wider text-muted sticky top-0">
                <th className="py-2.5 px-3">Patient ID</th>
                <th className="py-2.5 px-3">Patient Legal Name</th>
                <th className="py-2.5 px-3">Phenotype</th>
                <th className="py-2.5 px-3">Facility</th>
                <th className="py-2.5 px-3">Ward Assigned</th>
                <th className="py-2.5 px-3">Admission Date</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule font-mono tabular-nums">
              {patients.map((pt) => (
                <tr
                  key={pt.patient_id}
                  onClick={() => setDrawerPatient(pt)}
                  className="hover:bg-paper transition-colors cursor-pointer group"
                >
                  <td className="py-2 px-3 font-semibold text-ink">
                    #{pt.patient_id}
                  </td>
                  <td className="py-2 px-3 font-sans font-medium text-ink">
                    <span className="group-hover:text-blood transition-colors">
                      {pt.first_name} {pt.last_name}
                    </span>
                    <span className="block font-mono text-[10px] text-muted">
                      DOB: {pt.date_of_birth} &bull; {pt.gender}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <BloodGroupStamp bloodGroup={pt.blood_group} size="sm" />
                  </td>
                  <td className="py-2 px-3 font-sans text-muted text-[11px]">
                    {pt.hospital_name}
                  </td>
                  <td className="py-2 px-3 font-sans text-muted text-[11px]">
                    {pt.ward_name ? (
                      <span>{pt.ward_name} ({pt.ward_type})</span>
                    ) : (
                      <span className="text-muted/60">—</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-muted text-[11px]">
                    {pt.admission_date ? String(pt.admission_date).slice(0, 10) : '—'}
                  </td>
                  <td className="py-2 px-3">
                    <StatusDot status={pt.medical_status} />
                  </td>
                  <td className="py-2 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                    {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenUpdate(pt)}
                          className="text-xs text-muted hover:text-ink underline underline-offset-2"
                        >
                          Update
                        </button>
                        <button
                          onClick={() => handleDeletePatient(pt.patient_id, `${pt.first_name} ${pt.last_name}`)}
                          className="text-xs text-blood hover:text-blood-hover underline underline-offset-2"
                        >
                          Archive
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between text-xs font-mono text-muted pt-2 border-t border-rule">
          <span>
            Page {currentPage} of {totalPages} &bull; Showing {(currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, totalCount)} of {totalCount} records
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1 border border-rule bg-surface text-ink hover:bg-paper disabled:opacity-30 rounded-[2px]"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 py-1 text-ink font-semibold">{currentPage}</span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1 border border-rule bg-surface text-ink hover:bg-paper disabled:opacity-30 rounded-[2px]"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </PageState>

      {/* Patient Detail Drawer */}
      <Drawer
        isOpen={Boolean(drawerPatient)}
        onClose={() => setDrawerPatient(null)}
        title={drawerPatient ? `${drawerPatient.first_name} ${drawerPatient.last_name}` : ''}
        subtitle={drawerPatient ? `Inpatient Record #${drawerPatient.patient_id} / Person #${drawerPatient.person_id}` : ''}
      >
        {drawerPatient && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-rule">
              <div>
                <p className="text-muted font-mono text-[11px] uppercase">ABO/Rh Phenotype</p>
                <div className="mt-1">
                  <BloodGroupStamp bloodGroup={drawerPatient.blood_group} size="lg" />
                </div>
              </div>
              <div className="text-right">
                <p className="text-muted font-mono text-[11px] uppercase">Current Triage</p>
                <div className="mt-1">
                  <StatusDot status={drawerPatient.medical_status} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
                Hospital Assignment
              </p>
              <div className="p-3 bg-paper border border-rule rounded-[2px] space-y-1">
                <p className="font-medium text-ink">{drawerPatient.hospital_name}</p>
                <p className="text-muted">
                  Ward: {drawerPatient.ward_name || 'Unassigned'} ({drawerPatient.ward_type || 'N/A'})
                </p>
                <p className="text-muted">
                  Attending Doctor: {drawerPatient.attending_doctor_name || 'Assigned Resident'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
                Contact & Emergency
              </p>
              <div className="p-3 bg-paper border border-rule rounded-[2px] space-y-1.5 font-mono">
                <div>
                  <span className="text-muted">Phone: </span>
                  <span className="text-ink">{drawerPatient.phone || '—'}</span>
                </div>
                <div>
                  <span className="text-muted">Email: </span>
                  <span className="text-ink">{drawerPatient.email || '—'}</span>
                </div>
                <div>
                  <span className="text-muted">Location: </span>
                  <span className="text-ink">{drawerPatient.address}, {drawerPatient.city} ({drawerPatient.pincode})</span>
                </div>
                <div>
                  <span className="text-muted">Emergency Contact: </span>
                  <span className="text-ink">{drawerPatient.emergency_contact_name || '—'} ({drawerPatient.emergency_contact_phone || '—'})</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
                Clinical Diagnosis Notes
              </p>
              <div className="p-3 bg-paper border border-rule rounded-[2px] font-mono text-[11px] text-ink leading-relaxed">
                {drawerPatient.medical_notes || 'No specific diagnostic notes recorded.'}
              </div>
            </div>

            {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
              <div className="pt-4 border-t border-rule flex items-center justify-end gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    handleOpenUpdate(drawerPatient);
                  }}
                >
                  Edit Patient Status
                </Button>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Patient Admission Modal */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="Admit New Inpatient"
        subtitle="Generates Person supertype entry and Patient subtype record in MySQL lifelink_db"
      >
        <form onSubmit={handleRegisterPatient} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              required
              value={newPatient.first_name}
              onChange={(e) => setNewPatient({ ...newPatient, first_name: e.target.value })}
            />
            <Input
              label="Last Name"
              required
              value={newPatient.last_name}
              onChange={(e) => setNewPatient({ ...newPatient, last_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Date of Birth"
              type="date"
              required
              value={newPatient.date_of_birth}
              onChange={(e) => setNewPatient({ ...newPatient, date_of_birth: e.target.value })}
            />
            <Select
              label="Gender"
              value={newPatient.gender}
              onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </Select>
            <Select
              label="Phenotype"
              value={newPatient.blood_group}
              onChange={(e) => setNewPatient({ ...newPatient, blood_group: e.target.value })}
            >
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Phone Number"
              required
              value={newPatient.phone}
              onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
            />
            <Input
              label="Email Address"
              type="email"
              required
              value={newPatient.email}
              onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Admitting Hospital"
              value={newPatient.hospital_id}
              onChange={(e) => {
                const hid = parseInt(e.target.value, 10);
                setNewPatient({ ...newPatient, hospital_id: hid });
                fetchWardsForHosp(hid);
              }}
            >
              {hospitals.map((h) => (
                <option key={h.hospital_id} value={h.hospital_id}>{h.hospital_name}</option>
              ))}
            </Select>

            <Select
              label="Ward Assignment"
              value={newPatient.ward_id}
              onChange={(e) => setNewPatient({ ...newPatient, ward_id: parseInt(e.target.value, 10) })}
            >
              {wards.map((w) => (
                <option key={w.ward_id} value={w.ward_id}>
                  {w.ward_name} ({w.occupied_beds}/{w.total_beds})
                </option>
              ))}
            </Select>
          </div>

          <Textarea
            label="Clinical Admitting Notes"
            rows={2}
            value={newPatient.medical_notes}
            onChange={(e) => setNewPatient({ ...newPatient, medical_notes: e.target.value })}
          />

          <div className="pt-2 border-t border-rule flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsRegisterModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Record Admission
            </Button>
          </div>
        </form>
      </Modal>

      {/* Patient Update Modal */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        title="Update Inpatient Record"
        subtitle={selectedPatient ? `Patient #${selectedPatient.patient_id} &bull; ${selectedPatient.first_name} ${selectedPatient.last_name}` : ''}
      >
        <form onSubmit={handleUpdateStatus} className="space-y-3.5">
          <Select
            label="Medical Triage Status"
            value={statusUpdate.medical_status}
            onChange={(e) => setStatusUpdate({ ...statusUpdate, medical_status: e.target.value })}
          >
            <option value="CRITICAL">Critical (Intensive Monitoring)</option>
            <option value="STABLE">Stable</option>
            <option value="RECOVERING">Recovering</option>
            <option value="DISCHARGED">Discharged (Releases Ward Bed)</option>
          </Select>

          <Select
            label="Ward Transfer"
            value={statusUpdate.ward_id}
            onChange={(e) => setStatusUpdate({ ...statusUpdate, ward_id: e.target.value })}
          >
            <option value="">No Ward Transfer</option>
            {wards.map((w) => (
              <option key={w.ward_id} value={w.ward_id}>
                {w.ward_name} (Floor {w.floor_number}) &bull; {w.occupied_beds}/{w.total_beds} beds
              </option>
            ))}
          </Select>

          <Textarea
            label="Clinical Status Update Notes"
            rows={3}
            value={statusUpdate.medical_notes}
            onChange={(e) => setStatusUpdate({ ...statusUpdate, medical_notes: e.target.value })}
          />

          <div className="pt-2 border-t border-rule flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsUpdateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Clinical Update
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PatientManagement;
