import React, { useState, useEffect } from 'react';
import api from '../services/api';
import PageHeader from '../components/common/PageHeader';
import PageState from '../components/common/PageState';
import Button from '../components/common/Button';
import { Input, Select, Textarea } from '../components/common/FormControls';
import StatusDot from '../components/common/StatusDot';
import BloodGroupStamp from '../components/common/BloodGroupStamp';
import Tabs from '../components/common/Tabs';
import Modal from '../components/common/Modal';
import { UserPlus, ShieldCheck, History } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DonorManagement = () => {
  const { user } = useAuth();
  const [donors, setDonors] = useState([]);
  const [publicDirectory, setPublicDirectory] = useState([]);
  const [activeTab, setActiveTab] = useState('clinical'); // 'clinical' | 'public'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [bloodGroupFilter, setBloodGroupFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedDonorHistory, setSelectedDonorHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

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

  const isPublicOnly = user?.role === 'DONOR';

  useEffect(() => {
    if (isPublicOnly) {
      setActiveTab('public');
    }
  }, [isPublicOnly]);

  useEffect(() => {
    if (activeTab === 'public') {
      fetchPublicDirectory();
    } else {
      fetchDonors();
    }
  }, [activeTab, bloodGroupFilter, typeFilter, statusFilter]);

  const fetchDonors = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (bloodGroupFilter) params.blood_group = bloodGroupFilter;
      if (typeFilter) params.donor_type = typeFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/donors', { params });
      if (res.data && res.data.success) {
        setDonors(res.data.donors || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load clinical donor records.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicDirectory = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (bloodGroupFilter) params.blood_group = bloodGroupFilter;

      const res = await api.get('/donors/public-directory', { params });
      if (res.data && res.data.success) {
        setPublicDirectory(res.data.donors || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load public donor directory.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = async (donorId) => {
    try {
      setHistoryLoading(true);
      const res = await api.get(`/donors/${donorId}`);
      if (res.data && res.data.success) {
        setSelectedDonorHistory(res.data.donor);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to load donor history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleRegisterDonor = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/donors', newDonor);
      if (res.data && res.data.success) {
        setIsRegisterModalOpen(false);
        fetchDonors();
        setNewDonor({
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
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to register donor');
    }
  };

  const tabs = isPublicOnly
    ? [{ id: 'public', label: 'Public Directory (vw_public_donor_directory)', count: publicDirectory.length }]
    : [
        { id: 'clinical', label: 'Clinical Donor Registry', count: donors.length },
        { id: 'public', label: 'Query 4 Masked Directory', count: publicDirectory.length },
      ];

  const currentList = activeTab === 'public' ? publicDirectory : donors;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['03 REGISTRY', 'DONORS']}
        title="Donor Directory"
        description="Person supertype specialization records for voluntary blood donors and pledged organ donors."
        action={
          !isPublicOnly && (
            <Button
              variant="primary"
              size="sm"
              icon={UserPlus}
              onClick={() => setIsRegisterModalOpen(true)}
            >
              Register Donor
            </Button>
          )
        }
      />

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Query 4 Explanatory Note */}
      {activeTab === 'public' && (
        <div className="p-3 border border-rule bg-surface text-xs space-y-1">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-ink font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-moss" />
            <span>Query 4 Security Specification: Relational View Masking</span>
          </div>
          <p className="text-muted leading-relaxed">
            Data sourced directly from <code className="font-mono text-ink">vw_public_donor_directory</code>. 
            All confidential identifiers (phone, email, exact residence, medical notes) are strictly omitted 
            at the MySQL view definition level to safeguard donor privacy compliance.
          </p>
        </div>
      )}

      {/* Filter Ledger Bar */}
      <div className="flex flex-wrap items-center gap-3 py-2.5 px-3 border border-rule bg-surface text-xs">
        <span className="font-mono text-[11px] text-muted uppercase tracking-wider">Filters:</span>

        <select
          value={bloodGroupFilter}
          onChange={(e) => setBloodGroupFilter(e.target.value)}
          className="h-8 px-2 border border-rule bg-paper text-ink text-xs focus:outline-none focus:border-ink font-mono"
        >
          <option value="">All Blood Groups (8)</option>
          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
            <option key={bg} value={bg}>{bg}</option>
          ))}
        </select>

        {activeTab !== 'public' && (
          <>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-8 px-2 border border-rule bg-paper text-ink text-xs focus:outline-none focus:border-ink"
            >
              <option value="">All Donor Types</option>
              <option value="BLOOD">Blood Donor</option>
              <option value="ORGAN">Organ Donor</option>
              <option value="BOTH">Dual Donor (Both)</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 px-2 border border-rule bg-paper text-ink text-xs focus:outline-none focus:border-ink"
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
            className="text-xs text-blood underline ml-auto font-mono"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Main Ledger Content */}
      <PageState
        loading={loading}
        error={error}
        onRetry={activeTab === 'public' ? fetchPublicDirectory : fetchDonors}
        empty={currentList.length === 0}
        emptyMessage="No donor records match the specified query filters."
      >
        <div className="border border-rule bg-surface overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-rule bg-paper/60 text-[10px] font-mono uppercase tracking-wider text-muted">
                <th className="py-2.5 px-3 font-semibold">Donor ID</th>
                <th className="py-2.5 px-3 font-semibold">
                  {activeTab === 'public' ? 'Public Display Name' : 'Full Name & Record'}
                </th>
                <th className="py-2.5 px-3 font-semibold">Blood Group</th>
                <th className="py-2.5 px-3 font-semibold">Donor Specialization</th>
                <th className="py-2.5 px-3 font-semibold">Location</th>
                {activeTab !== 'public' && (
                  <>
                    <th className="py-2.5 px-3 font-semibold">Confidential Contact</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Harvest Count</th>
                  </>
                )}
                <th className="py-2.5 px-3 font-semibold">Status</th>
                {activeTab !== 'public' && (
                  <th className="py-2.5 px-3 font-semibold text-right">Ledger</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-rule font-sans">
              {activeTab === 'public'
                ? publicDirectory.map((d) => (
                    <tr key={d.donor_id} className="hover:bg-paper/40 transition-colors h-10">
                      <td className="py-2 px-3 font-mono text-ink font-semibold">
                        #{d.donor_id}
                      </td>
                      <td className="py-2 px-3 font-medium text-ink">
                        {d.approved_display_name}
                      </td>
                      <td className="py-2 px-3">
                        <BloodGroupStamp bloodGroup={d.blood_group} size="sm" />
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px] text-muted">
                        {d.donor_type}
                      </td>
                      <td className="py-2 px-3 text-muted">
                        {d.city}, {d.state}
                      </td>
                      <td className="py-2 px-3">
                        <StatusDot status={d.availability_status} />
                      </td>
                    </tr>
                  ))
                : donors.map((d) => (
                    <tr key={d.donor_id} className="hover:bg-paper/40 transition-colors h-10">
                      <td className="py-2 px-3 font-mono text-ink font-semibold">
                        #{d.donor_id}
                      </td>
                      <td className="py-2 px-3">
                        <span className="font-medium text-ink">{d.name}</span>
                        <span className="block text-[10px] font-mono text-muted">
                          Person #{d.person_id}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <BloodGroupStamp bloodGroup={d.blood_group} size="sm" />
                      </td>
                      <td className="py-2 px-3">
                        <span className="font-mono text-[11px] text-ink">
                          {d.donor_type}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-muted">
                        {d.city}, {d.state}
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px] text-muted">
                        <div>{d.phone}</div>
                        <div className="text-[10px] text-muted/70">{d.email}</div>
                      </td>
                      <td className="py-2 px-3 font-mono text-right text-ink font-semibold">
                        {d.donation_count || 0}
                      </td>
                      <td className="py-2 px-3">
                        <StatusDot status={d.availability_status} />
                        {d.deferral_reason && (
                          <span
                            className="block text-[10px] text-blood truncate max-w-[180px] font-sans"
                            title={d.deferral_reason}
                          >
                            {d.deferral_reason}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={History}
                          onClick={() => handleViewHistory(d.donor_id)}
                        >
                          History
                        </Button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </PageState>

      {/* Register Donor Modal */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="Register Voluntary Donor"
        subtitle="Executes transactional insert into Person supertype and Donor subtype entity."
      >
        <form onSubmit={handleRegisterDonor} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              required
              value={newDonor.first_name}
              onChange={(e) => setNewDonor({ ...newDonor, first_name: e.target.value })}
            />
            <Input
              label="Last Name"
              required
              value={newDonor.last_name}
              onChange={(e) => setNewDonor({ ...newDonor, last_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Select
              label="Blood Group"
              required
              value={newDonor.blood_group}
              onChange={(e) => setNewDonor({ ...newDonor, blood_group: e.target.value })}
              options={[
                { value: 'A+', label: 'A+' },
                { value: 'A-', label: 'A-' },
                { value: 'B+', label: 'B+' },
                { value: 'B-', label: 'B-' },
                { value: 'AB+', label: 'AB+' },
                { value: 'AB-', label: 'AB-' },
                { value: 'O+', label: 'O+' },
                { value: 'O-', label: 'O-' },
              ]}
            />
            <Select
              label="Donor Specialization"
              required
              value={newDonor.donor_type}
              onChange={(e) => setNewDonor({ ...newDonor, donor_type: e.target.value })}
              options={[
                { value: 'BLOOD', label: 'Blood Donor' },
                { value: 'ORGAN', label: 'Organ Donor' },
                { value: 'BOTH', label: 'Dual Donor (Both)' },
              ]}
            />
            <Select
              label="Gender"
              required
              value={newDonor.gender}
              onChange={(e) => setNewDonor({ ...newDonor, gender: e.target.value })}
              options={[
                { value: 'MALE', label: 'Male' },
                { value: 'FEMALE', label: 'Female' },
                { value: 'OTHER', label: 'Other' },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Phone Number (Unique)"
              type="tel"
              required
              placeholder="+91-..."
              value={newDonor.phone}
              onChange={(e) => setNewDonor({ ...newDonor, phone: e.target.value })}
            />
            <Input
              label="Email Address"
              type="email"
              value={newDonor.email}
              onChange={(e) => setNewDonor({ ...newDonor, email: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              value={newDonor.city}
              onChange={(e) => setNewDonor({ ...newDonor, city: e.target.value })}
            />
            <Input
              label="State"
              value={newDonor.state}
              onChange={(e) => setNewDonor({ ...newDonor, state: e.target.value })}
            />
          </div>

          <Textarea
            label="Medical Eligibility Notes"
            rows={2}
            value={newDonor.medical_history_notes}
            onChange={(e) => setNewDonor({ ...newDonor, medical_history_notes: e.target.value })}
          />

          <div className="pt-3 border-t border-rule flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsRegisterModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Commit Donor Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* Donor History Modal */}
      <Modal
        isOpen={Boolean(selectedDonorHistory)}
        onClose={() => setSelectedDonorHistory(null)}
        title={`Donation Ledger: ${selectedDonorHistory?.first_name || ''} ${selectedDonorHistory?.last_name || ''}`}
        subtitle={`Person #${selectedDonorHistory?.person_id || ''} — Blood Group ${selectedDonorHistory?.blood_group || ''}`}
      >
        <div className="space-y-4 text-xs font-sans">
          <div className="grid grid-cols-3 gap-2 p-2.5 border border-rule bg-paper text-[11px] font-mono">
            <div>
              <span className="text-muted block text-[10px] uppercase">Blood Group</span>
              <BloodGroupStamp bloodGroup={selectedDonorHistory?.blood_group} size="sm" />
            </div>
            <div>
              <span className="text-muted block text-[10px] uppercase">Availability</span>
              <StatusDot status={selectedDonorHistory?.availability_status} />
            </div>
            <div>
              <span className="text-muted block text-[10px] uppercase">Recorded Donations</span>
              <span className="text-ink font-semibold">{selectedDonorHistory?.donations?.length || 0}</span>
            </div>
          </div>

          <div>
            <h4 className="font-mono text-[11px] uppercase tracking-wider text-ink font-semibold mb-2">
              Historical Blood Phlebotomy Logs
            </h4>
            {selectedDonorHistory?.donations?.length === 0 ? (
              <p className="text-muted italic py-3 text-center border border-rule bg-paper">
                No blood collections recorded for this donor.
              </p>
            ) : (
              <div className="border border-rule divide-y divide-rule">
                {selectedDonorHistory?.donations?.map((dn) => (
                  <div key={dn.donation_id} className="p-2.5 bg-surface text-xs space-y-1">
                    <div className="flex justify-between font-mono">
                      <span className="font-semibold text-ink">Donation #{dn.donation_id}</span>
                      <span className="text-muted">{dn.donation_date}</span>
                    </div>
                    <div className="flex justify-between text-muted text-[11px]">
                      <span>Facility: {dn.hospital_name}</span>
                      <span className="font-mono text-ink font-semibold">{dn.quantity_ml} ml</span>
                    </div>
                    <div className="flex justify-between text-[10px] pt-1 border-t border-rule font-mono">
                      <span className="text-muted">Hemoglobin: {dn.hemoglobin_level} g/dL</span>
                      <StatusDot status={dn.screening_status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedDonorHistory?.organPledges?.length > 0 && (
            <div className="pt-2 border-t border-rule">
              <h4 className="font-mono text-[11px] uppercase tracking-wider text-ink font-semibold mb-2">
                Pledged Solid Organs
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedDonorHistory.organPledges.map((op) => (
                  <span
                    key={op.organ_donation_id}
                    className="px-2 py-0.5 border border-rule bg-paper font-mono text-[11px] text-ink"
                  >
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
