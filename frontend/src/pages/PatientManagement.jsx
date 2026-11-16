import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { BloodGroupPill, StatusBadge } from '../components/Badge';
import { Bed, UserPlus, Filter, Droplet, HeartPulse, Edit3, Trash2, Search, ArrowUpDown, ChevronLeft, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const PatientManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [hospitalFilter, setHospitalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('');
  const [sortBy, setSortBy] = useState('admission_date');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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
    medical_notes: 'Admitted for medical monitoring.',
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
  }, [hospitalFilter, statusFilter, bloodGroupFilter, sortBy, sortOrder, currentPage, pageSize]);

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      if (user?.role === 'PATIENT') {
        const patientId = user?.patient_id || 1;
        const res = await api.get(`/patients/${patientId}`);
        if (res.data && res.data.success) {
          setPatients([res.data.patient]);
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
      if (res.data && res.data.success) {
        setPatients(res.data.patients || []);
        setTotalCount(res.data.count || 0);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load patients:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to load patients from database.');
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
      if (res.data && res.data.success) {
        setHospitals(res.data.hospitals);
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
      if (res.data && res.data.success) {
        setWards(res.data.wards);
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
      if (res.data && res.data.success) {
        setIsRegisterModalOpen(false);
        setSuccessMessage(res.data.message);
        fetchPatients();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to register patient');
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
      if (res.data && res.data.success) {
        setIsUpdateModalOpen(false);
        setSuccessMessage(res.data.message);
        fetchPatients();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to update patient status');
    }
  };

  const handleDeletePatient = async (patientId, patientName) => {
    if (!window.confirm(`Are you sure you want to delete patient #${patientId} (${patientName})?`)) {
      return;
    }

    try {
      const res = await api.delete(`/patients/${patientId}`);
      if (res.data && res.data.success) {
        setSuccessMessage(res.data.message);
        fetchPatients();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || `Failed to delete patient #${patientId}.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Patient Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Clinical inpatient registry connected directly to MySQL 8.0, managing person specialization, ward bed triggers, and transfusion requests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchPatients()}
            className="p-2 border rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh from MySQL"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-brand-600 text-white hover:bg-brand-700 shadow-sm transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Admit New Patient</span>
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="font-bold text-emerald-900 ml-2">&times;</button>
        </div>
      )}
      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="font-bold text-rose-900 ml-2">&times;</button>
        </div>
      )}

      {/* Search & Filters Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 text-xs">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by patient name, phone, city, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-lg bg-slate-50 text-slate-800 font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 rounded-lg bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={hospitalFilter}
            onChange={(e) => {
              setHospitalFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border rounded-lg bg-slate-50 text-slate-700 font-medium focus:outline-none"
          >
            <option value="">All Hospitals</option>
            {hospitals.map((h) => (
              <option key={h.hospital_id} value={h.hospital_id}>{h.hospital_name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border rounded-lg bg-slate-50 text-slate-700 font-medium focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="CRITICAL">Critical</option>
            <option value="STABLE">Stable</option>
            <option value="RECOVERING">Recovering</option>
            <option value="DISCHARGED">Discharged</option>
          </select>

          <select
            value={bloodGroupFilter}
            onChange={(e) => {
              setBloodGroupFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border rounded-lg bg-slate-50 text-slate-700 font-medium focus:outline-none font-bold"
          >
            <option value="">All Blood Groups</option>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-slate-50 text-slate-700 font-medium focus:outline-none"
          >
            <option value="admission_date">Sort: Admission Date</option>
            <option value="name">Sort: Patient Name</option>
            <option value="medical_status">Sort: Medical Status</option>
            <option value="hospital_name">Sort: Hospital</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')}
            title="Toggle sort direction"
            className="p-2 border rounded-lg hover:bg-slate-50 text-slate-700 font-bold"
          >
            {sortOrder}
          </button>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>
            Showing <strong className="text-slate-900">{patients.length}</strong> of{' '}
            <strong className="text-slate-900">{totalCount}</strong> database records
          </span>
          <div className="flex items-center gap-2">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value, 10));
                setCurrentPage(1);
              }}
              className="border rounded px-2 py-1 bg-white font-medium"
            >
              <option value="15">15</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Patient ID</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Blood Group</th>
                <th className="py-3 px-4">Admitted Hospital</th>
                <th className="py-3 px-4">Ward Location</th>
                <th className="py-3 px-4">Admission Date</th>
                <th className="py-3 px-4">Medical Status</th>
                <th className="py-3 px-4">Transfusion Requests</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-500">
                    <div className="inline-block w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p>Executing MySQL query...</p>
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    No patient records matched the database query filter.
                  </td>
                </tr>
              ) : (
                patients.map((pt) => (
                  <tr key={pt.patient_id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">#{pt.patient_id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {pt.name}
                      <span className="block text-[11px] text-slate-400 font-normal">
                        DOB: {pt.date_of_birth} ({pt.gender}) &bull; {pt.city || 'Delhi'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <BloodGroupPill bloodGroup={pt.blood_group} />
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">{pt.hospital_name}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {pt.ward_name} {pt.ward_type ? `(${pt.ward_type})` : ''}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{pt.admission_date}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={pt.medical_status} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {pt.active_blood_requests > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <Droplet className="w-3 h-3" />
                            <span>{pt.active_blood_requests} Active</span>
                          </span>
                        )}
                        {pt.active_organ_requests > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            <HeartPulse className="w-3 h-3" />
                            <span>{pt.active_organ_requests} Organ</span>
                          </span>
                        )}
                        {pt.active_blood_requests === 0 && pt.active_organ_requests === 0 && (
                          <span className="text-slate-400 text-[11px]">None</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
                          <button
                            onClick={() => handleOpenUpdate(pt)}
                            title="Update Status / Ward"
                            className="p-1.5 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {user?.role === 'ADMIN' && (
                          <button
                            onClick={() => handleDeletePatient(pt.patient_id, pt.name)}
                            title="Delete Patient (Integrity Protected)"
                            className="p-1.5 rounded text-rose-500 hover:text-rose-800 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500">
            Page <strong className="text-slate-900">{currentPage}</strong> of{' '}
            <strong className="text-slate-900">{totalPages}</strong> ({totalCount} total patients in MySQL)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border bg-white font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <span className="px-2 font-mono text-slate-600 font-bold">{currentPage}</span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border bg-white font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Admit Patient Modal */}
      <Modal isOpen={isRegisterModalOpen} onClose={() => setIsRegisterModalOpen(false)} title="Admit Patient (Person & Patient Specialization)">
        <form onSubmit={handleRegisterPatient} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={newPatient.first_name}
                onChange={(e) => setNewPatient({ ...newPatient, first_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={newPatient.last_name}
                onChange={(e) => setNewPatient({ ...newPatient, last_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Blood Group *</label>
              <select
                value={newPatient.blood_group}
                onChange={(e) => setNewPatient({ ...newPatient, blood_group: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none font-bold"
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Gender *</label>
              <select
                value={newPatient.gender}
                onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={newPatient.date_of_birth}
                onChange={(e) => setNewPatient({ ...newPatient, date_of_birth: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone *</label>
              <input
                type="text"
                required
                value={newPatient.phone}
                onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                placeholder="+91-9811002233"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={newPatient.city}
                onChange={(e) => setNewPatient({ ...newPatient, city: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hospital *</label>
              <select
                value={newPatient.hospital_id}
                onChange={(e) => {
                  const hospId = parseInt(e.target.value, 10);
                  setNewPatient({ ...newPatient, hospital_id: hospId });
                  fetchWardsForHosp(hospId);
                }}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {hospitals.map((h) => (
                  <option key={h.hospital_id} value={h.hospital_id}>{h.hospital_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ward Location</label>
              <select
                value={newPatient.ward_id}
                onChange={(e) => setNewPatient({ ...newPatient, ward_id: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {wards.map((w) => (
                  <option key={w.ward_id} value={w.ward_id}>{w.ward_name} ({w.ward_type})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Medical Status *</label>
            <select
              value={newPatient.medical_status}
              onChange={(e) => setNewPatient({ ...newPatient, medical_status: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="CRITICAL">Critical</option>
              <option value="STABLE">Stable</option>
              <option value="RECOVERING">Recovering</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Clinical Notes</label>
            <textarea
              rows="2"
              value={newPatient.medical_notes}
              onChange={(e) => setNewPatient({ ...newPatient, medical_notes: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(false)}
              className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-brand-600 text-white font-bold hover:bg-brand-700"
            >
              Execute Admission
            </button>
          </div>
        </form>
      </Modal>

      {/* Update Patient Modal */}
      <Modal isOpen={isUpdateModalOpen} onClose={() => setIsUpdateModalOpen(false)} title={`Update Patient #${selectedPatient?.patient_id}`}>
        <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Medical Status *</label>
            <select
              value={statusUpdate.medical_status}
              onChange={(e) => setStatusUpdate({ ...statusUpdate, medical_status: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="CRITICAL">Critical</option>
              <option value="STABLE">Stable</option>
              <option value="RECOVERING">Recovering</option>
              <option value="DISCHARGED">Discharged (Trigger bed release)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Ward Location</label>
            <select
              value={statusUpdate.ward_id}
              onChange={(e) => setStatusUpdate({ ...statusUpdate, ward_id: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="">Unassigned</option>
              {wards.map((w) => (
                <option key={w.ward_id} value={w.ward_id}>{w.ward_name} ({w.ward_type})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Phone</label>
            <input
              type="text"
              value={statusUpdate.phone}
              onChange={(e) => setStatusUpdate({ ...statusUpdate, phone: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Clinical Notes</label>
            <textarea
              rows="3"
              value={statusUpdate.medical_notes}
              onChange={(e) => setStatusUpdate({ ...statusUpdate, medical_notes: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsUpdateModalOpen(false)}
              className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-brand-600 text-white font-bold hover:bg-brand-700"
            >
              Update Record
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PatientManagement;
