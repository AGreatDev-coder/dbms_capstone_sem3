import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { BloodGroupPill, StatusBadge } from '../components/Badge';
import { Users, UserPlus, Eye, ShieldCheck, Filter, HeartHandshake, History, Calendar, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DonorManagement = () => {
  const { user } = useAuth();
  const [donors, setDonors] = useState([]);
  const [publicDirectory, setPublicDirectory] = useState([]);
  const [isPublicView, setIsPublicView] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filters
  const [bloodGroupFilter, setBloodGroupFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedDonorHistory, setSelectedDonorHistory] = useState(null);

  // Register Form
  const [newDonor, setNewDonor] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '1998-05-15',
    gender: 'MALE',
    phone: '',
    email: '',
    address: '',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
    blood_group: 'O+',
    donor_type: 'BLOOD',
    medical_history_notes: 'Standard healthy voluntary donor.',
  });

  useEffect(() => {
    if (user?.role === 'DONOR') {
      setIsPublicView(true);
    }
  }, [user]);

  useEffect(() => {
    if (isPublicView) {
      fetchPublicDirectory();
    } else {
      fetchDonors();
    }
  }, [isPublicView, bloodGroupFilter, typeFilter, statusFilter]);

  const fetchDonors = async () => {
    try {
      setLoading(true);
      const params = {};
      if (bloodGroupFilter) params.blood_group = bloodGroupFilter;
      if (typeFilter) params.donor_type = typeFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/donors', { params });
      if (res.data && res.data.success) {
        setDonors(res.data.donors);
      }
    } catch (err) {
      console.error('Failed to load donors:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicDirectory = async () => {
    try {
      setLoading(true);
      const params = {};
      if (bloodGroupFilter) params.blood_group = bloodGroupFilter;

      const res = await api.get('/donors/public-directory', { params });
      if (res.data && res.data.success) {
        setPublicDirectory(res.data.donors);
      }
    } catch (err) {
      console.error('Failed to load public directory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = async (donorId) => {
    try {
      const res = await api.get(`/donors/${donorId}`);
      if (res.data && res.data.success) {
        setSelectedDonorHistory(res.data.donor);
      }
    } catch (err) {
      console.error('Failed to load donor history:', err);
    }
  };

  const handleRegisterDonor = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/donors', newDonor);
      if (res.data && res.data.success) {
        setIsRegisterModalOpen(false);
        fetchDonors();
        alert(res.data.message);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to register donor');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Donor Registry & Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Voluntary blood & pledged organ donors mapped from Person supertype with role specialization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Query 4 View Toggle (Restricted for ADMIN/STAFF) */}
          {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setIsPublicView(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  !isPublicView ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Full Clinical View
              </button>
              <button
                onClick={() => setIsPublicView(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isPublicView ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>vw_public_donor_directory (Query 4)</span>
              </button>
            </div>
          )}

          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-brand-600 text-white hover:bg-brand-700 shadow-sm transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register Donor</span>
          </button>
        </div>
      </div>

      {/* Query 4 Notice Banner when in Public View */}
      {isPublicView && (
        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="text-xs text-indigo-950">
            <p className="font-bold">Query 4: Sensitive Data Protection View (`vw_public_donor_directory`)</p>
            <p className="text-indigo-800 mt-0.5 leading-relaxed">
              This relational view exposes only safe attributes (Donor ID, approved name initial, city, blood group, general availability).
              Personal identifiers including phone number, email, street address, and medical history are strictly masked to ensure privacy compliance.
            </p>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        <select
          value={bloodGroupFilter}
          onChange={(e) => setBloodGroupFilter(e.target.value)}
          className="px-3 py-1.5 border rounded-lg bg-slate-50 text-slate-700 font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
        >
          <option value="">All Blood Groups (8)</option>
          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
            <option key={bg} value={bg}>{bg}</option>
          ))}
        </select>

        {!isPublicView && (
          <>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 border rounded-lg bg-slate-50 text-slate-700 font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="">All Donor Types</option>
              <option value="BLOOD">Blood Donor</option>
              <option value="ORGAN">Organ Donor</option>
              <option value="BOTH">Dual Donor (Both)</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border rounded-lg bg-slate-50 text-slate-700 font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="DEFERRED">Deferred</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </>
        )}

        {(bloodGroupFilter || typeFilter || statusFilter) && (
          <button
            onClick={() => {
              setBloodGroupFilter('');
              setTypeFilter('');
              setStatusFilter('');
            }}
            className="text-xs text-brand-600 hover:text-brand-700 font-bold ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Donor Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Donor ID</th>
                <th className="py-3 px-4">{isPublicView ? 'Approved Display Name' : 'Full Name'}</th>
                <th className="py-3 px-4">Blood Group</th>
                <th className="py-3 px-4">Donor Type</th>
                <th className="py-3 px-4">Location</th>
                {!isPublicView && (
                  <>
                    <th className="py-3 px-4">Contact (Confidential)</th>
                    <th className="py-3 px-4">Donation Count</th>
                  </>
                )}
                <th className="py-3 px-4">Availability</th>
                {!isPublicView && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isPublicView
                ? publicDirectory.map((d) => (
                    <tr key={d.donor_id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">#{d.donor_id}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{d.approved_display_name}</td>
                      <td className="py-3 px-4">
                        <BloodGroupPill bloodGroup={d.blood_group} />
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">{d.donor_type}</td>
                      <td className="py-3 px-4 text-slate-600">{d.city}, {d.state}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={d.availability_status} />
                      </td>
                    </tr>
                  ))
                : donors.map((d) => (
                    <tr key={d.donor_id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">#{d.donor_id}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {d.name}
                        <span className="block text-[11px] text-slate-400 font-normal">Person ID #{d.person_id}</span>
                      </td>
                      <td className="py-3 px-4">
                        <BloodGroupPill bloodGroup={d.blood_group} />
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded font-medium text-[11px] ${
                          d.donor_type === 'BOTH' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {d.donor_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{d.city}, {d.state}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        <div>{d.phone}</div>
                        <div className="text-[11px] text-slate-400">{d.email}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">{d.donation_count} donations</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={d.availability_status} />
                        {d.deferral_reason && (
                          <span className="block text-[10px] text-rose-600 mt-0.5 max-w-xs truncate" title={d.deferral_reason}>
                            {d.deferral_reason}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleViewHistory(d.donor_id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>History</span>
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Donor Modal */}
      <Modal isOpen={isRegisterModalOpen} onClose={() => setIsRegisterModalOpen(false)} title="Register New Donor (Specialization)">
        <form onSubmit={handleRegisterDonor} className="space-y-4 text-xs">
          <p className="text-slate-500 text-[11px] pb-2 border-b">
            Creates a record in the <strong>Person</strong> supertype and registers a specialized 1:0..1 subtype in <strong>Donor</strong>.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={newDonor.first_name}
                onChange={(e) => setNewDonor({ ...newDonor, first_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={newDonor.last_name}
                onChange={(e) => setNewDonor({ ...newDonor, last_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Blood Group *</label>
              <select
                value={newDonor.blood_group}
                onChange={(e) => setNewDonor({ ...newDonor, blood_group: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none font-bold"
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Donor Type *</label>
              <select
                value={newDonor.donor_type}
                onChange={(e) => setNewDonor({ ...newDonor, donor_type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="BLOOD">Blood Donor</option>
                <option value="ORGAN">Organ Donor</option>
                <option value="BOTH">Dual Donor (Both)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Gender *</label>
              <select
                value={newDonor.gender}
                onChange={(e) => setNewDonor({ ...newDonor, gender: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number (Unique) *</label>
              <input
                type="tel"
                required
                value={newDonor.phone}
                onChange={(e) => setNewDonor({ ...newDonor, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                placeholder="+91-..."
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address (Unique)</label>
              <input
                type="email"
                value={newDonor.email}
                onChange={(e) => setNewDonor({ ...newDonor, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={newDonor.city}
                onChange={(e) => setNewDonor({ ...newDonor, city: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">State</label>
              <input
                type="text"
                value={newDonor.state}
                onChange={(e) => setNewDonor({ ...newDonor, state: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Medical History Notes</label>
            <textarea
              rows="2"
              value={newDonor.medical_history_notes}
              onChange={(e) => setNewDonor({ ...newDonor, medical_history_notes: e.target.value })}
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
              Register Donor
            </button>
          </div>
        </form>
      </Modal>

      {/* Donor History Modal */}
      <Modal
        isOpen={Boolean(selectedDonorHistory)}
        onClose={() => setSelectedDonorHistory(null)}
        title={`Donation History: ${selectedDonorHistory?.first_name} ${selectedDonorHistory?.last_name}`}
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div>
              <span className="text-slate-500">Blood Group:</span>{' '}
              <BloodGroupPill bloodGroup={selectedDonorHistory?.blood_group} />
            </div>
            <div>
              <span className="text-slate-500">Status:</span>{' '}
              <StatusBadge status={selectedDonorHistory?.availability_status} />
            </div>
            <div>
              <span className="text-slate-500">Total Donations:</span>{' '}
              <strong className="text-slate-900">{selectedDonorHistory?.donations?.length || 0}</strong>
            </div>
          </div>

          <h4 className="font-bold text-slate-900 pt-2">Past Blood Collection Records</h4>
          {selectedDonorHistory?.donations?.length === 0 ? (
            <p className="text-slate-500 italic py-4 text-center">No blood donations recorded yet for this donor.</p>
          ) : (
            <div className="space-y-2">
              {selectedDonorHistory?.donations?.map((dn) => (
                <div key={dn.donation_id} className="p-3 rounded-lg border border-slate-200 space-y-1">
                  <div className="flex justify-between font-semibold text-slate-800">
                    <span>Donation #{dn.donation_id} - {dn.donation_date}</span>
                    <span className="text-brand-600">{dn.quantity_ml} ml</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Facility: {dn.hospital_name}</span>
                    <span>Hemoglobin: <strong>{dn.hemoglobin_level} g/dL</strong></span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <span>Camp / Source: {dn.camp_name}</span>
                    <StatusBadge status={dn.screening_status} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedDonorHistory?.organPledges?.length > 0 && (
            <div className="pt-3 border-t">
              <h4 className="font-bold text-slate-900 mb-2">Pledged Organs</h4>
              <div className="flex flex-wrap gap-2">
                {selectedDonorHistory.organPledges.map((op) => (
                  <span key={op.organ_donation_id} className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-semibold text-xs">
                    {op.organ_type} ({op.donation_status})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default DonorManagement;

