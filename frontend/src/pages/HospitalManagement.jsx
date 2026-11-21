import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/common/PageHeader';
import { PageState } from '../components/common/PageState';
import { Button } from '../components/common/Button';
import { Input, Select } from '../components/common/FormControls';
import { Modal } from '../components/common/Modal';
import { Plus } from 'lucide-react';

const HospitalManagement = () => {
  const { user } = useAuth();
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [wards, setWards] = useState([]);
  const [hierarchy, setHierarchy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [isAddHospModalOpen, setIsAddHospModalOpen] = useState(false);
  const [isAddWardModalOpen, setIsAddWardModalOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);

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
      setError(null);
      const res = await api.get('/hospitals');
      if (res.data?.success) {
        const hospList = res.data.hospitals || [];
        setHospitals(hospList);
        if (hospList.length > 0 && !selectedHospital) {
          handleSelectHospital(hospList[0]);
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
    try {
      const res = await api.get(`/hospitals/${hosp.hospital_id}/wards`);
      if (res.data?.success) {
        setWards(res.data.wards || []);
      }
    } catch (err) {
      console.error('Failed to load wards:', err);
    }
  };

  const fetchStaffHierarchy = async () => {
    try {
      const res = await api.get('/hospitals/staff-hierarchy');
      if (res.data?.success) {
        setHierarchy(res.data.rows || res.data.staff || []);
      }
    } catch (err) {
      console.warn('Hierarchy fetch error:', err);
    }
  };

  const handleCreateHospital = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/hospitals', newHosp);
      if (res.data?.success) {
        setIsAddHospModalOpen(false);
        setFeedback({ type: 'success', message: res.data.message || 'Hospital registered.' });
        fetchHospitals();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to create hospital' });
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        breadcrumb="Institutional Registry"
        title="Hospital Facilities & Ward Bed Allocations"
        description="Regional medical centers, specialized inpatient wards, and clinical staff supervision hierarchies enforcing recursive foreign key integrity."
        badge={`${hospitals.length} Affiliated Facilities`}
        action={
          user?.role === 'ADMIN' && (
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsAddHospModalOpen(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Register Hospital</span>
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

      <PageState loading={loading} error={error} onRetry={fetchHospitals}>
        {/* Hospital Facilities Grid */}
        <section aria-label="Affiliated Hospitals">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {hospitals.map((hosp) => {
              const isSelected = selectedHospital?.hospital_id === hosp.hospital_id;
              const occRate = hosp.occupancy_rate || 0;

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
                        Lic: {hosp.license_number} &bull; Est. {hosp.established_year || '1995'}
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
                  <div className="pt-2 border-t border-rule space-y-1">
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-muted">Ward Bed Occupancy</span>
                      <span className="font-semibold text-ink tabular-nums">
                        {hosp.occupied_beds} / {hosp.total_beds} ({occRate}%)
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

              {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
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
                return (
                  <div key={w.ward_id} className="p-3 bg-paper border border-rule rounded-[2px] space-y-2">
                    <div className="flex items-baseline justify-between font-mono text-[10px] uppercase text-muted">
                      <span>Floor {w.floor_number}</span>
                      <span className="text-ink font-semibold">{w.ward_type}</span>
                    </div>
                    <h4 className="font-serif text-sm font-semibold text-ink">
                      {w.ward_name}
                    </h4>
                    <div className="space-y-1 font-mono text-[11px] pt-1">
                      <div className="flex justify-between text-muted">
                        <span>Occupied:</span>
                        <span className="font-semibold text-ink tabular-nums">
                          {w.occupied_beds} / {w.total_beds}
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

        {/* Staff Supervision Indented Tree (Self-Join Traversal) */}
        <section className="space-y-3" aria-label="Staff Hierarchy">
          <div className="flex items-baseline justify-between pb-2 border-b border-rule">
            <div>
              <h2 className="font-serif text-lg text-ink font-medium">
                Clinical Staff Supervision Hierarchy
              </h2>
              <p className="text-xs text-muted">
                Evaluated using SQL recursive self-join (Staff subordinate LEFT JOIN Staff supervisor ON subordinate.supervisor_staff_id = supervisor.staff_id)
              </p>
            </div>
            <span className="font-mono text-[11px] text-muted">
              Query 6D Hierarchy
            </span>
          </div>

          <div className="border border-rule rounded-[2px] bg-surface overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-paper border-b border-rule font-mono text-[11px] uppercase tracking-wider text-muted">
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">Designation</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Hospital Center</th>
                  <th className="py-2.5 px-3">Reports To (Supervisor)</th>
                  <th className="py-2.5 px-3 text-right">Hierarchical Tree</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule font-mono text-xs">
                {hierarchy.map((row) => {
                  const isTop = !row.supervisor_staff_id || row.supervisor_name?.includes('Executive');
                  return (
                    <tr key={row.employee_staff_id || row.staff_id} className="hover:bg-paper transition-colors">
                      <td className="py-2.5 px-3 font-sans font-medium text-ink">
                        <span>{row.employee_name || row.staff_name}</span>
                        <span className="font-mono text-[10px] text-muted ml-1.5">
                          #{row.employee_staff_id || row.staff_id}
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
                      <td className="py-2.5 px-3 text-right">
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </PageState>

      {/* Add Hospital Modal */}
      <Modal
        isOpen={isAddHospModalOpen}
        onClose={() => setIsAddHospModalOpen(false)}
        title="Register Hospital Facility"
        subtitle="Generates institutional entity record in MySQL lifelink_db"
      >
        <form onSubmit={handleCreateHospital} className="space-y-3.5">
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
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Emergency Helpline"
              required
              value={newHosp.emergency_helpline}
              onChange={(e) => setNewHosp({ ...newHosp, emergency_helpline: e.target.value })}
            />
            <Input
              label="Contact Email"
              type="email"
              required
              value={newHosp.contact_email}
              onChange={(e) => setNewHosp({ ...newHosp, contact_email: e.target.value })}
            />
          </div>
          <div className="pt-3 border-t border-rule flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsAddHospModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Register Facility
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
    </div>
  );
};

export default HospitalManagement;
