import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { Building2, Plus, Phone, Mail, Bed, Users, ShieldAlert, GitBranch, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const HospitalManagement = () => {
  const { user } = useAuth();
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [wards, setWards] = useState([]);
  const [hierarchy, setHierarchy] = useState([]);

  // Modals
  const [isAddHospModalOpen, setIsAddHospModalOpen] = useState(false);
  const [isAddWardModalOpen, setIsAddWardModalOpen] = useState(false);

  // New Hospital Form
  const [newHosp, setNewHosp] = useState({
    hospital_name: '',
    license_number: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    contact_phone: '',
    contact_email: '',
    emergency_helpline: '',
    established_year: 1995,
  });

  // New Ward Form
  const [newWard, setNewWard] = useState({
    ward_name: '',
    ward_type: 'ICU',
    floor_number: 1,
    total_beds: 20,
  });

  useEffect(() => {
    fetchHospitals();
    fetchStaffHierarchy();
  }, []);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/hospitals');
      if (res.data && res.data.success) {
        setHospitals(res.data.hospitals);
        if (res.data.hospitals.length > 0 && !selectedHospital) {
          handleSelectHospital(res.data.hospitals[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load hospitals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHospital = async (hosp) => {
    setSelectedHospital(hosp);
    try {
      const res = await api.get(`/hospitals/${hosp.hospital_id}/wards`);
      if (res.data && res.data.success) {
        setWards(res.data.wards);
      }
    } catch (err) {
      console.error('Failed to load wards:', err);
    }
  };

  const fetchStaffHierarchy = async () => {
    try {
      const res = await api.get('/hospitals/staff-hierarchy');
      if (res.data && res.data.success) {
        setHierarchy(res.data.rows);
      }
    } catch (err) {
      console.warn('Hierarchy fetch error:', err);
    }
  };

  const handleCreateHospital = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/hospitals', newHosp);
      if (res.data && res.data.success) {
        setIsAddHospModalOpen(false);
        fetchHospitals();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create hospital');
    }
  };

  const handleCreateWard = async (e) => {
    e.preventDefault();
    if (!selectedHospital) return;
    try {
      const res = await api.post(`/hospitals/${selectedHospital.hospital_id}/wards`, newWard);
      if (res.data && res.data.success) {
        setIsAddWardModalOpen(false);
        handleSelectHospital(selectedHospital);
        fetchHospitals();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add ward');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Hospital & Ward Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage regional hospital facilities, clinical wards, bed occupancy limits, and medical staff hierarchies.
          </p>
        </div>
        {user?.role === 'ADMIN' && (
          <button
            onClick={() => setIsAddHospModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-brand-600 text-white hover:bg-brand-700 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Hospital Facility</span>
          </button>
        )}
      </div>

      {/* Hospital Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {hospitals.map((hosp) => {
          const isSelected = selectedHospital?.hospital_id === hosp.hospital_id;
          return (
            <div
              key={hosp.hospital_id}
              onClick={() => handleSelectHospital(hosp)}
              className={`bg-white rounded-xl p-5 border cursor-pointer transition-all ${
                isSelected
                  ? 'border-brand-500 ring-2 ring-brand-500/20 shadow-md'
                  : 'border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${isSelected ? 'bg-brand-50 text-brand-600' : 'bg-slate-100 text-slate-600'}`}>
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">{hosp.hospital_name}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{hosp.license_number}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                <p className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{hosp.address}, {hosp.city}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Helpline: <strong className="text-slate-800">{hosp.emergency_helpline}</strong></span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{hosp.contact_email}</span>
                </p>
              </div>

              {/* Bed Occupancy Bar */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-500">Bed Occupancy:</span>
                  <span className="font-bold text-slate-800">
                    {hosp.occupied_beds} / {hosp.total_beds} beds ({hosp.occupancy_rate}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      hosp.occupancy_rate > 85 ? 'bg-rose-500' : hosp.occupancy_rate > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, hosp.occupancy_rate)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Hospital Wards Section */}
      {selectedHospital && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Wards & Capacity: {selectedHospital.hospital_name}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-mono">
                  {wards.length} Wards
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Ward bed limits are guarded by SQL CHECK constraints: total_beds &gt; 0 and occupied_beds &le; total_beds.
              </p>
            </div>
            {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
              <button
                onClick={() => setIsAddWardModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-white hover:bg-slate-900 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Ward to Hospital</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {wards.map((ward) => {
              const occRate = ward.total_beds > 0 ? Math.round((ward.occupied_beds / ward.total_beds) * 100) : 0;
              return (
                <div key={ward.ward_id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                      Floor {ward.floor_number}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-800">{occRate}% Full</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">{ward.ward_name}</h4>
                  <p className="text-xs text-slate-500">{ward.ward_type}</p>

                  <div className="pt-2">
                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                      <span>Beds Occupied:</span>
                      <strong>{ward.occupied_beds} / {ward.total_beds}</strong>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div
                        className={`h-full rounded-full ${
                          occRate > 85 ? 'bg-rose-500' : occRate > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, occRate)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Staff Supervision Hierarchy (Query 6D Self Join Table) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-indigo-600" />
              <span>Hospital Staff Hierarchy & Supervision (Query 6D Self-Join Demonstration)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Traverses the self-referencing foreign key `Staff.supervisor_staff_id &rarr; Staff.staff_id` across facilities.
            </p>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
            SELF JOIN: Staff s1 LEFT JOIN Staff s2
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Staff ID</th>
                <th className="py-3 px-4">Employee Name</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Hospital Facility</th>
                <th className="py-3 px-4">Supervising Official</th>
                <th className="py-3 px-4">Supervisor Title</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hierarchy.map((row) => (
                <tr key={row.employee_staff_id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">#{row.employee_staff_id}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{row.employee_name}</td>
                  <td className="py-3 px-4 text-slate-600">{row.employee_title}</td>
                  <td className="py-3 px-4 font-medium text-slate-700">{row.department}</td>
                  <td className="py-3 px-4 text-slate-600">{row.hospital_name}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      row.supervisor_name.includes('Executive')
                        ? 'bg-purple-50 text-purple-700 border border-purple-200 font-semibold'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {row.supervisor_name}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{row.supervisor_title}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Hospital Modal */}
      <Modal isOpen={isAddHospModalOpen} onClose={() => setIsAddHospModalOpen(false)} title="Register New Hospital Facility">
        <form onSubmit={handleCreateHospital} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Hospital Name *</label>
            <input
              type="text"
              required
              value={newHosp.hospital_name}
              onChange={(e) => setNewHosp({ ...newHosp, hospital_name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              placeholder="e.g. Max Super Speciality Hospital"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">License Number (Unique) *</label>
              <input
                type="text"
                required
                value={newHosp.license_number}
                onChange={(e) => setNewHosp({ ...newHosp, license_number: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                placeholder="LIC-MAX-8891"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Established Year *</label>
              <input
                type="number"
                required
                value={newHosp.established_year}
                onChange={(e) => setNewHosp({ ...newHosp, established_year: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">City *</label>
              <input
                type="text"
                required
                value={newHosp.city}
                onChange={(e) => setNewHosp({ ...newHosp, city: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                placeholder="New Delhi"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">State *</label>
              <input
                type="text"
                required
                value={newHosp.state}
                onChange={(e) => setNewHosp({ ...newHosp, state: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                placeholder="Delhi"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Street Address</label>
            <input
              type="text"
              value={newHosp.address}
              onChange={(e) => setNewHosp({ ...newHosp, address: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Email *</label>
              <input
                type="email"
                required
                value={newHosp.contact_email}
                onChange={(e) => setNewHosp({ ...newHosp, contact_email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Emergency Helpline *</label>
              <input
                type="text"
                required
                value={newHosp.emergency_helpline}
                onChange={(e) => setNewHosp({ ...newHosp, emergency_helpline: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                placeholder="+91-11-..."
              />
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddHospModalOpen(false)}
              className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 shadow-sm"
            >
              Register Facility
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Ward Modal */}
      <Modal isOpen={isAddWardModalOpen} onClose={() => setIsAddWardModalOpen(false)} title={`Add Clinical Ward to ${selectedHospital?.hospital_name}`}>
        <form onSubmit={handleCreateWard} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Ward Name *</label>
            <input
              type="text"
              required
              value={newWard.ward_name}
              onChange={(e) => setNewWard({ ...newWard, ward_name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              placeholder="e.g. Critical Neurological ICU"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ward Type *</label>
              <select
                value={newWard.ward_type}
                onChange={(e) => setNewWard({ ...newWard, ward_type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="ICU">ICU (Intensive Care)</option>
                <option value="EMERGENCY">Emergency & Trauma</option>
                <option value="SURGICAL">Surgical Care</option>
                <option value="TRANSPLANT_CARE">Transplant Care Recovery</option>
                <option value="PEDIATRIC">Pediatric Ward</option>
                <option value="GENERAL_MALE">General Male</option>
                <option value="GENERAL_FEMALE">General Female</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Floor Number *</label>
              <input
                type="number"
                required
                value={newWard.floor_number}
                onChange={(e) => setNewWard({ ...newWard, floor_number: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Total Bed Capacity (CHECK &gt; 0) *</label>
            <input
              type="number"
              min="1"
              required
              value={newWard.total_beds}
              onChange={(e) => setNewWard({ ...newWard, total_beds: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddWardModalOpen(false)}
              className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 shadow-sm"
            >
              Save Ward
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default HospitalManagement;

