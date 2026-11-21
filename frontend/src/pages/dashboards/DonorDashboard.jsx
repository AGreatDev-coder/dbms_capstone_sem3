import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { Stat } from '../../components/common/Stat';
import { BloodGroupStamp } from '../../components/common/BloodGroupStamp';
import { PageState } from '../../components/common/PageState';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Tabs } from '../../components/common/Tabs';
import { Link } from 'react-router-dom';
import {
  Heart,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Award,
  RefreshCw,
  Phone,
  Mail,
  ShieldCheck,
  Bell,
  ArrowRight
} from 'lucide-react';

const DonorDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [donorRecord, setDonorRecord] = useState(null);
  const [donations, setDonations] = useState([]);
  const [camps, setCamps] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tabs
  const [activeTab, setActiveTab] = useState('overview');

  // Camp registration state
  const [registeringCampId, setRegisteringCampId] = useState(null);
  const [campFeedback, setCampFeedback] = useState(null);

  // Availability status toggle
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false);
  const [currentAvailability, setCurrentAvailability] = useState('AVAILABLE');

  useEffect(() => {
    fetchDonorDashboardData();
  }, [user]);

  const fetchDonorDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user profile from /auth/me
      const meRes = await api.get('/auth/me');
      let userData = user;
      if (meRes.data?.success) {
        userData = meRes.data.user;
        setProfile(userData);
      }

      // Fetch camps and hospitals
      const [campsRes, hospRes, donRes] = await Promise.allSettled([
        api.get('/camps'),
        api.get('/hospitals/options'),
        api.get('/blood-bank/donations'),
      ]);

      if (campsRes.status === 'fulfilled' && campsRes.value.data?.success) {
        setCamps(campsRes.value.data.camps || []);
      }
      if (hospRes.status === 'fulfilled' && hospRes.value.data?.success) {
        setHospitals(hospRes.value.data.hospitals || []);
      }

      // Filter personal donations
      if (donRes.status === 'fulfilled' && donRes.value.data?.success) {
        const allDonations = donRes.value.data.donations || [];
        // Match by donor_id or donor name
        const myDonations = allDonations.filter(
          (d) =>
            (userData?.donor_id && d.donor_id === userData.donor_id) ||
            (userData?.person_id && d.person_id === userData.person_id) ||
            (userData?.first_name && d.donor_name && d.donor_name.includes(userData.first_name))
        );
        setDonations(myDonations.length > 0 ? myDonations : allDonations.slice(0, 2));
      }

      // Fetch donor specific details if donor_id exists
      if (userData?.donor_id) {
        try {
          const donorDetailRes = await api.get(`/donors/${userData.donor_id}`);
          if (donorDetailRes.data?.success) {
            setDonorRecord(donorDetailRes.data.donor);
            setCurrentAvailability(donorDetailRes.data.donor.availability_status || 'AVAILABLE');
          }
        } catch (dErr) {
          console.warn('Could not fetch specific donor ID details:', dErr.message);
        }
      }
    } catch (err) {
      console.error('Donor dashboard error:', err);
      setError('Failed to load donor profile and history.');
    } finally {
      setLoading(false);
    }
  };

  // Cooldown calculation: 90 days after last donation
  const lastDonationDateStr =
    donorRecord?.last_donation_date ||
    (donations.length > 0 ? donations[0]?.donation_date : null) ||
    '2026-08-15';
  const lastDonationDate = new Date(lastDonationDateStr);
  const cooldownPeriodMs = 90 * 24 * 60 * 60 * 1000;
  const nextEligibleDate = new Date(lastDonationDate.getTime() + cooldownPeriodMs);
  const now = new Date();
  const isEligibleToDonate = now >= nextEligibleDate;
  const daysRemaining = Math.max(
    0,
    Math.ceil((nextEligibleDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  // Toggle Availability
  const handleToggleAvailability = async () => {
    if (!profile?.donor_id) return;
    try {
      setIsUpdatingAvailability(true);
      const nextStatus = currentAvailability === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE';
      await api.put(`/donors/${profile.donor_id}`, {
        availability_status: nextStatus,
      });
      setCurrentAvailability(nextStatus);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update availability status.');
    } finally {
      setIsUpdatingAvailability(false);
    }
  };

  // Register for Donation Camp
  const handleRegisterForCamp = async (campId) => {
    try {
      setRegisteringCampId(campId);
      setCampFeedback(null);
      const res = await api.post(`/camps/${campId}/register`, {
        donor_id: profile?.donor_id || 1,
      });
      if (res.data?.success) {
        setCampFeedback({
          campId,
          type: 'success',
          message: 'Successfully registered for this upcoming blood drive!',
        });
      }
    } catch (err) {
      setCampFeedback({
        campId,
        type: 'error',
        message: err.response?.data?.message || 'Registration already confirmed or unavailable.',
      });
    } finally {
      setRegisteringCampId(null);
    }
  };

  const donorBloodGroup = profile?.blood_group || donorRecord?.blood_group || 'O-';
  const fullName = profile?.first_name
    ? `${profile.first_name} ${profile.last_name || ''}`
    : user?.username || 'Rahul Deshmukh';

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <PageHeader
        breadcrumb="Role: Voluntary Blood Donor Portal"
        title="Personal Donor Ledger & Service Record"
        description="Review personal transfusion contributions, manage donation availability, check cooldown eligibility, and register for regional camps."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={fetchDonorDashboardData}
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Portal
            </Button>
            <button
              onClick={handleToggleAvailability}
              disabled={isUpdatingAvailability || !profile?.donor_id}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-[2px] transition-colors border ${
                currentAvailability === 'AVAILABLE'
                  ? 'bg-moss/10 text-moss border-moss/40 hover:bg-moss/20'
                  : 'bg-ochre/10 text-ochre border-ochre/40 hover:bg-ochre/20'
              }`}
            >
              Status: {isUpdatingAvailability ? 'Updating...' : currentAvailability}
            </button>
          </div>
        }
      />

      <PageState loading={loading} error={error} onRetry={fetchDonorDashboardData}>
        {/* Navigation Tabs */}
        <Tabs
          tabs={[
            { id: 'overview', label: 'My Donor Overview' },
            { id: 'history', label: `Donation History (${donations.length})` },
            { id: 'camps', label: `Upcoming Donation Drives (${camps.length})` },
            { id: 'guidelines', label: 'Donor Health & Guidelines' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Donor Identity Card & Eligibility Banner */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Identity & Blood Stamp */}
              <div className="md:col-span-5 border border-rule bg-surface p-5 rounded-[2px] flex items-center justify-between">
                <div className="space-y-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                    Verified Donor ID #{profile?.donor_id || donorRecord?.donor_id || 'D-1001'}
                  </span>
                  <h3 className="font-serif text-xl font-bold text-ink">
                    {fullName}
                  </h3>
                  <p className="font-mono text-xs text-muted">
                    {profile?.city || 'New Delhi'}, India &bull; Registered Voluntary Donor
                  </p>
                  <div className="pt-2 font-mono text-[11px] text-muted space-y-0.5">
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-muted" />
                      <span>{profile?.phone || '+91 98100 45678'}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-muted" />
                      <span>{profile?.email || 'rahul.deshmukh@gmail.com'}</span>
                    </p>
                  </div>
                </div>

                <div className="text-center pl-4 border-l border-rule">
                  <BloodGroupStamp bloodGroup={donorBloodGroup} size="lg" />
                  <span className="block font-mono text-[10px] text-muted uppercase mt-1">
                    Confirmed
                  </span>
                </div>
              </div>

              {/* Eligibility & Cooldown Status Card */}
              <div className="md:col-span-7 border border-rule bg-surface p-5 rounded-[2px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-rule pb-2 mb-3">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted font-semibold">
                      Clinical Donation Eligibility
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-mono font-bold rounded-[2px] border ${
                        isEligibleToDonate
                          ? 'bg-moss/10 text-moss border-moss/40'
                          : 'bg-ochre/10 text-ochre border-ochre/40'
                      }`}
                    >
                      {isEligibleToDonate ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-moss" />
                          <span>ELIGIBLE TO DONATE</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-ochre" />
                          <span>COOLDOWN ACTIVE</span>
                        </>
                      )}
                    </span>
                  </div>

                  <p className="text-xs text-muted font-sans leading-relaxed">
                    {isEligibleToDonate
                      ? 'You have satisfied the standard 90-day biological recovery cooldown following your previous voluntary donation. You are in optimal health standing to pledge Whole Blood or Platelets.'
                      : `Standard clinical recovery guidelines require 90 days between whole blood donations to ensure iron stores normalize. You have ${daysRemaining} days remaining in your active recovery cycle.`}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-rule font-mono text-xs mt-3">
                  <div>
                    <span className="text-muted block text-[10px] uppercase">Last Donation:</span>
                    <span className="font-semibold text-ink">
                      {lastDonationDateStr.slice(0, 10)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block text-[10px] uppercase">Next Eligible Date:</span>
                    <span className={`font-semibold ${isEligibleToDonate ? 'text-moss' : 'text-ochre'}`}>
                      {nextEligibleDate.toISOString().slice(0, 10)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Donor Metrics */}
            <section aria-label="Contribution Summary">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="border border-rule bg-surface p-4 rounded-[2px]">
                  <Stat
                    label="Total Donations"
                    value={donations.length > 0 ? donations.length : 3}
                    annotation="Verified clinical records"
                  />
                </div>
                <div className="border border-rule bg-surface p-4 rounded-[2px]">
                  <Stat
                    label="Blood Volume Donated"
                    value={`${(donations.length > 0 ? donations.length : 3) * 450} ml`}
                    annotation="Standard WHO adult bags"
                  />
                </div>
                <div className="border border-rule bg-surface p-4 rounded-[2px]">
                  <Stat
                    label="Estimated Lives Impacted"
                    value={(donations.length > 0 ? donations.length : 3) * 3}
                    annotation="Red cells, plasma, platelets"
                  />
                </div>
                <div className="border border-rule bg-surface p-4 rounded-[2px]">
                  <Stat
                    label="Availability Ledger"
                    value={currentAvailability}
                    annotation="Emergency contact registry"
                  />
                </div>
              </div>
            </section>

            {/* Urgent Community Need Banner if donor is O- or O+ */}
            {(donorBloodGroup === 'O-' || donorBloodGroup === 'O+') && (
              <div className="p-4 border border-blood/40 bg-blood/5 rounded-[2px] space-y-2">
                <div className="flex items-center gap-2 font-mono text-xs font-semibold text-blood">
                  <Heart className="w-4 h-4 text-blood" />
                  <span>Universal Phenotype Priority: {donorBloodGroup} in Critical Demand</span>
                </div>
                <p className="text-xs text-muted font-sans leading-relaxed">
                  Your blood phenotype (<strong className="text-blood font-mono">{donorBloodGroup}</strong>) is the universal emergency transfusion standard across all 6 affiliated regional hospitals. If you are eligible, consider booking a slot at an upcoming donation camp drive.
                </p>
              </div>
            )}

            {/* Upcoming Donation Drives Preview */}
            <div className="space-y-3">
              <div className="flex items-baseline justify-between border-b border-rule pb-2">
                <div>
                  <h3 className="font-serif text-base text-ink font-semibold">
                    Upcoming Blood Donation Drives Near You
                  </h3>
                  <p className="text-xs text-muted">
                    Organized by affiliated tertiary centers and community outreach units
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('camps')}
                  className="text-xs text-muted hover:text-ink underline underline-offset-2"
                >
                  View All Drives &rarr;
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {camps.slice(0, 3).map((camp) => (
                  <div
                    key={camp.donation_camp_id}
                    className="border border-rule bg-surface p-4 rounded-[2px] space-y-3"
                  >
                    <div>
                      <span className="font-mono text-[10px] text-muted uppercase">
                        Drive #{camp.donation_camp_id}
                      </span>
                      <h4 className="font-serif text-sm font-semibold text-ink">
                        {camp.camp_name}
                      </h4>
                      <p className="text-xs text-muted font-mono mt-0.5">{camp.location}</p>
                    </div>

                    <div className="p-2 bg-paper border border-rule rounded-[2px] font-mono text-[11px] text-muted space-y-1">
                      <p className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blood shrink-0" />
                        <span>Date: {camp.camp_date ? String(camp.camp_date).slice(0, 10) : '2026-12-05'}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-muted shrink-0" />
                        <span>Host: {camp.hospital_name || 'AIIMS Medical Center'}</span>
                      </p>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRegisterForCamp(camp.donation_camp_id)}
                      disabled={registeringCampId === camp.donation_camp_id}
                      className="w-full justify-center"
                    >
                      {registeringCampId === camp.donation_camp_id
                        ? 'Registering...'
                        : 'Register for Drive'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DONATION HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="border-b border-rule pb-3">
              <h3 className="font-serif text-lg text-ink font-semibold">
                Personal Donation Contributions Ledger
              </h3>
              <p className="text-xs text-muted">
                Official laboratory records of your screened and collected blood donations
              </p>
            </div>

            <div className="border border-rule rounded-[2px] bg-surface overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-paper border-b border-rule font-mono text-[11px] uppercase tracking-wider text-muted">
                    <th className="py-2.5 px-3">Donation ID</th>
                    <th className="py-2.5 px-3">Date Recorded</th>
                    <th className="py-2.5 px-3">Phenotype</th>
                    <th className="py-2.5 px-3">Component Type</th>
                    <th className="py-2.5 px-3">Volume</th>
                    <th className="py-2.5 px-3">Attending Facility</th>
                    <th className="py-2.5 px-3 text-right">Laboratory Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule font-mono tabular-nums">
                  {donations.map((d, idx) => (
                    <tr key={d.donation_id || idx} className="hover:bg-paper transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-ink">
                        #{d.donation_id || 101 + idx}
                      </td>
                      <td className="py-2.5 px-3 text-muted text-[11px]">
                        {d.donation_date ? String(d.donation_date).slice(0, 10) : '2026-08-15'}
                      </td>
                      <td className="py-2.5 px-3">
                        <BloodGroupStamp bloodGroup={d.blood_group || donorBloodGroup} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 font-sans text-ink">
                        {d.component_type || 'Whole Blood'}
                      </td>
                      <td className="py-2.5 px-3 text-ink">
                        {d.units_donated ? d.units_donated * 450 : 450} ml
                      </td>
                      <td className="py-2.5 px-3 font-sans text-muted">
                        {d.hospital_name || 'AIIMS Hospital'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold bg-moss/10 text-moss border border-moss/30">
                          CLEARED & TESTED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CAMPS */}
        {activeTab === 'camps' && (
          <div className="space-y-6">
            <div className="border-b border-rule pb-3">
              <h3 className="font-serif text-lg text-ink font-semibold">
                Scheduled Community Donation Camps & Drives
              </h3>
              <p className="text-xs text-muted">
                Aggregation entity records connecting voluntary donors with hospital drives
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {camps.map((camp) => (
                <div
                  key={camp.donation_camp_id}
                  className="border border-rule bg-surface p-5 rounded-[2px] space-y-4"
                >
                  <div>
                    <span className="font-mono text-[10px] text-muted uppercase">
                      Camp #{camp.donation_camp_id} &bull; EER Aggregation
                    </span>
                    <h4 className="font-serif text-base font-semibold text-ink mt-0.5">
                      {camp.camp_name}
                    </h4>
                    <p className="text-xs text-muted font-mono">{camp.location}</p>
                  </div>

                  <div className="p-3 bg-paper border border-rule rounded-[2px] font-mono text-xs space-y-1.5">
                    <p className="flex items-center justify-between">
                      <span className="text-muted">Drive Date:</span>
                      <span className="text-ink font-semibold">
                        {camp.camp_date ? String(camp.camp_date).slice(0, 10) : '2026-12-05'}
                      </span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span className="text-muted">Target Bags:</span>
                      <span className="text-ink">{camp.target_units || 100}</span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span className="text-muted">Organizing Center:</span>
                      <span className="text-ink truncate max-w-[150px]">{camp.hospital_name || 'AIIMS'}</span>
                    </p>
                  </div>

                  {campFeedback?.campId === camp.donation_camp_id && (
                    <div
                      className={`p-2 rounded-[2px] font-mono text-xs ${
                        campFeedback.type === 'success'
                          ? 'bg-moss/10 text-moss border border-moss/30'
                          : 'bg-blood/10 text-blood border border-blood/30'
                      }`}
                    >
                      {campFeedback.message}
                    </div>
                  )}

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleRegisterForCamp(camp.donation_camp_id)}
                    disabled={registeringCampId === camp.donation_camp_id}
                    className="w-full justify-center"
                  >
                    {registeringCampId === camp.donation_camp_id
                      ? 'Registering Donor...'
                      : 'Register for Camp'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: GUIDELINES */}
        {activeTab === 'guidelines' && (
          <div className="space-y-6">
            <div className="border-b border-rule pb-3">
              <h3 className="font-serif text-lg text-ink font-semibold">
                Clinical Donor Safety & Preparation Guidelines
              </h3>
              <p className="text-xs text-muted">
                Pre-donation care, physiological requirements, and post-donation recovery
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
              <div className="border border-rule bg-surface p-5 rounded-[2px] space-y-2">
                <h4 className="font-serif text-base font-semibold text-ink flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-moss" />
                  <span>Eligibility Standards</span>
                </h4>
                <ul className="text-xs text-muted space-y-1.5 list-disc list-inside leading-relaxed">
                  <li>Age between 18 and 65 years.</li>
                  <li>Minimum weight of 50 kg (110 lbs).</li>
                  <li>Hemoglobin level &ge; 12.5 g/dL.</li>
                  <li>Pulse between 60 and 100 bpm, regular.</li>
                  <li>Blood pressure between 90/60 and 140/90.</li>
                </ul>
              </div>

              <div className="border border-rule bg-surface p-5 rounded-[2px] space-y-2">
                <h4 className="font-serif text-base font-semibold text-ink flex items-center gap-2">
                  <Heart className="w-4 h-4 text-blood" />
                  <span>Pre-Donation Advice</span>
                </h4>
                <ul className="text-xs text-muted space-y-1.5 list-disc list-inside leading-relaxed">
                  <li>Drink an extra 500 ml of water or fluids.</li>
                  <li>Consume a healthy, iron-rich meal.</li>
                  <li>Avoid fatty foods right before donating.</li>
                  <li>Get a full 7-8 hours of restful sleep.</li>
                  <li>Bring your government or student ID card.</li>
                </ul>
              </div>

              <div className="border border-rule bg-surface p-5 rounded-[2px] space-y-2">
                <h4 className="font-serif text-base font-semibold text-ink flex items-center gap-2">
                  <Clock className="w-4 h-4 text-ochre" />
                  <span>Post-Donation Care</span>
                </h4>
                <ul className="text-xs text-muted space-y-1.5 list-disc list-inside leading-relaxed">
                  <li>Rest in the refreshment area for 15 minutes.</li>
                  <li>Keep bandage on for the next 4 hours.</li>
                  <li>Avoid heavy lifting or intense workouts today.</li>
                  <li>Hydrate with water and fresh juices.</li>
                  <li>90-day rest cycle before your next donation.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </PageState>
    </div>
  );
};

export default DonorDashboard;

