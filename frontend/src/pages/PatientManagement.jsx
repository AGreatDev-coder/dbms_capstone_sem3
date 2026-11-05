import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { BloodGroupPill, StatusBadge } from '../components/Badge';
import { Bed, UserPlus, Filter, Droplet, HeartPulse, Edit3, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const PatientManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [hospitalFilter, setHospitalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // New Patient Form
  const [newPatient, setNewPatient] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '1985-06-20',
    gender: 'MALE',
    phone: '',
    email: '',
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
  });

  useEffect(() => {
    fetchPatients();
    fetchHospitals();
  }, [hospitalFilter, statusFilter]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const params = {};
      if (hospitalFilter) params.hospital_id = hospitalFilter;
      if (statusFilter) params.medical_status = statusFilter;

      const res = await api.get('/patients', { params });
      if (res.data && res.data.success) {
        setPatients(res.data.patients);
      }
    } catch (err) {
      console.error('Failed to load patients:', err);
    } finally {
      setLoading(false);
    }
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
        fetchPatients();
        alert(res.data.message);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to register patient');
    }
  };

  const handleOpenUpdate = (pt) => {
    setSelectedPatient(pt);
    setStatusUpdate({
      medical_status: pt.medical_status,
      ward_id: pt.ward_id || '',
      medical_notes: pt.medical_notes || '',
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
        fetchPatients();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update patient status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Patient Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Clinical inpatient registry linked via Person supertype, managing bed allocations, transfusion requests & waitlists.
          </p>
        </div>

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

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        <select
          value={hospitalFilter}
          onChange={(e) => setHospitalFilter(e.target.value)}
          className="px-3 py-1.5 border rounded-lg bg-slate-50 text-slate-700 font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
        >
          <option value="">All Hospital Centers</option>
          {hospitals.map((h) => (
            <option key={h.hospital_id} value={h.hospital_id}>{h.hospital_name}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 border rounded-lg bg-slate-50 text-slate-700 font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
        >
          <option value="">All Medical Statuses</option>
          <option value="CRITICAL">Critical</option>
          <option value="STABLE">Stable</option>
          <option value="RECOVERING">Recovering</option>
          <option value="DISCHARGED">Discharged</option>
        </select>

        {(hospitalFilter || statusFilter) && (
          <button
            onClick={() => {
              setHospitalFilter('');
              setStatusFilter('');
            }}
            className="text-xs text-brand-600 hover:text-brand-700 font-bold ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Patient ID</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Blood Group</th>
                <th className="py-3 px-4">Admitted Hospital</th>
                <th className="py-3 px-4">Ward Location</th>
                <th className="py-3 px-4">Attending Doctor</th>
                <th className="py-3 px-4">Medical Status</th>
                <th className="py-3 px-4">Active Requests</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patients.map((pt) => (
                <tr key={pt.patient_id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">#{pt.patient_id}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {pt.name}
                    <span className="block text-[11px] text-slate-400 font-normal">DOB: {pt.date_of_birth} ({pt.gender})</span>
                  </td>
                  <td className="py-3 px-4">
                    <BloodGroupPill bloodGroup={pt.blood_group} />
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700">{pt.hospital_name}</td>
                  <td className="py-3 px-4 text-slate-600">{pt.ward_name}</td>
                  <td className="py-3 px-4 text-slate-600 font-medium">{pt.attending_doctor_name}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={pt.medical_status} />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      {pt.active_blood_requests > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <Droplet className="w-3 h-3" />
                          <span>{pt.active_blood_requests} Blood</span>
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
                      <button
                        onClick={() => handleOpenUpdate(pt)}
                        title="Update Status / Ward"
                        className="p-1.5 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => navigate('/blood-requests')}
                        title="Create Blood Request"
                        className="p-1.5 rounded text-rose-600 hover:text-rose-800 hover:bg-rose-50"
                      >
                        <Droplet className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
              <label className="block font-semibold text-slate-700 mb-1">Phone Number (Unique) *</label>
              <input
                type="tel"
                required
                value={newPatient.phone}
                onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Medical Status *</label>
              <select
                value={newPatient.medical_status}
                onChange={(e) => setNewPatient({ ...newPatient, medical_status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none font-bold"
              >
                <option value="CRITICAL">Critical</option>
                <option value="STABLE">Stable</option>
                <option value="RECOVERING">Recovering</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assign Hospital *</label>
              <select
                value={newPatient.hospital_id}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setNewPatient({ ...newPatient, hospital_id: val });
                  fetchWardsForHosp(val);
                }}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {hospitals.map((h) => (
                  <option key={h.hospital_id} value={h.hospital_id}>{h.hospital_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assign Ward</label>
              <select
                value={newPatient.ward_id}
                onChange={(e) => setNewPatient({ ...newPatient, ward_id: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {wards.map((w) => (
                  <option key={w.ward_id} value={w.ward_id}>{w.ward_name} ({w.occupied_beds}/{w.total_beds})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Clinical Notes & Indication</label>
            <textarea
              rows="2"
              value={newPatient.medical_notes}
              onChange={(e) => setNewPatient({ ...newPatient, medical_notes: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(false)}
              className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 shadow-sm"
            >
              Admit Patient
            </button>
          </div>
        </form>
      </Modal>

      {/* Update Patient Status Modal */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        title={`Update Patient: ${selectedPatient?.name}`}
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Medical Status *</label>
            <select
              value={statusUpdate.medical_status}
              onChange={(e) => setStatusUpdate({ ...statusUpdate, medical_status: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none font-bold"
            >
              <option value="CRITICAL">Critical</option>
              <option value="STABLE">Stable</option>
              <option value="RECOVERING">Recovering</option>
              <option value="DISCHARGED">Discharged (Triggers Bed De-allocation)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Ward Assignment</label>
            <select
              value={statusUpdate.ward_id}
              onChange={(e) => setStatusUpdate({ ...statusUpdate, ward_id: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              {wards.map((w) => (
                <option key={w.ward_id} value={w.ward_id}>{w.ward_name} ({w.occupied_beds}/{w.total_beds})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Medical Notes</label>
            <textarea
              rows="3"
              value={statusUpdate.medical_notes}
              onChange={(e) => setStatusUpdate({ ...statusUpdate, medical_notes: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsUpdateModalOpen(false)}
              className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 shadow-sm"
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

