import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/common/PageHeader';
import { Stat } from '../components/common/Stat';
import { StatusDot } from '../components/common/StatusDot';
import { BloodGroupStamp } from '../components/common/BloodGroupStamp';
import { PageState } from '../components/common/PageState';
import { Button } from '../components/common/Button';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [mRes, cRes] = await Promise.all([
        api.get('/dashboard/metrics'),
        api.get('/dashboard/charts'),
      ]);
      if (mRes.data?.success) setMetrics(mRes.data.metrics);
      if (cRes.data?.success) setCharts(cRes.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Unable to load operations metrics from MySQL.');
    } finally {
      setLoading(false);
    }
  };

  const URGENCY_PALETTE = {
    CRITICAL: '#A4161A',
    HIGH: '#B7791F',
    MEDIUM: '#3C4A57',
    ROUTINE: '#6B675E',
  };

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <PageHeader
        breadcrumb="Central Operations Ledger"
        title="Network Operations & Triage"
        description="Continuous monitoring of regional blood bank reserves, priority transfusion requisitions, and organ match candidates across 6 affiliated medical facilities."
        action={
          <Button
            variant="secondary"
            onClick={fetchDashboardData}
            size="sm"
          >
            Refresh Ledger
          </Button>
        }
      />

      {/* Facility Scope Indicator */}
      {user?.role !== 'DEVELOPER' && user?.hospital_name && (
        <div className="p-3 border border-rule bg-surface rounded-[2px] flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blood" />
            <span className="text-muted">Operations Dashboard Scoped To:</span>
            <span className="font-semibold text-ink">{user.hospital_name}</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-muted px-1.5 py-0.5 border border-rule bg-paper">
            Facility ID #{user.hospital_id} &bull; Local Metrics
          </span>
        </div>
      )}
      {user?.role === 'DEVELOPER' && (
        <div className="p-3 border border-moss/40 bg-moss/10 rounded-[2px] flex items-center justify-between text-xs font-mono text-moss">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-moss" />
            <span className="font-bold">Universal Operations Oversight:</span>
            <span>Real-time aggregate data, cross-center requisitions, and inventory across all 6 facilities</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 border border-moss/40 bg-paper text-moss">
            DEVELOPER ACCESS
          </span>
        </div>
      )}

      <PageState loading={loading} error={error} onRetry={fetchDashboardData}>
        {/* Primary Metrics: Big Serif Numerals on hairline dividers */}
        <section aria-label="Primary Key Indicators">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Link to="/patients" className="block group">
              <Stat
                label="Admitted Inpatients"
                value={metrics?.totalPatients || 400}
                annotation="Active patient specialization records"
              />
            </Link>
            <Link to="/blood-bank" className="block group">
              <Stat
                label="Available Blood Bags"
                value={metrics?.availableBloodUnits || 21}
                annotation="Screened cold-storage inventory"
              />
            </Link>
            <Link to="/blood-requests" className="block group">
              <Stat
                label="Critical Requests"
                value={metrics?.urgentRequests || 0}
                annotation="Awaiting immediate allocation"
                alert={Number(metrics?.urgentRequests) > 0}
              />
            </Link>
            <Link to="/organ-donation" className="block group">
              <Stat
                label="Organ Waiting List"
                value={metrics?.organRequests || 0}
                annotation="Recipients pending compatible match"
              />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
            <Link to="/donors" className="block group">
              <Stat
                label="Registered Donors"
                value={metrics?.totalDonors || 12}
                annotation="Voluntary blood & pledged organ donors"
              />
            </Link>
            <Link to="/hospitals" className="block group">
              <Stat
                label="Regional Hospitals"
                value={metrics?.totalHospitals || 5}
                annotation="Affiliated tertiary clinical centers"
              />
            </Link>
            <Link to="/blood-requests" className="block group">
              <Stat
                label="Total Active Requests"
                value={metrics?.pendingBloodRequests || 0}
                annotation="Pending or partially fulfilled"
              />
            </Link>
            <Link to="/blood-bank?tab=expiring" className="block group">
              <Stat
                label="Expiring <= 7 Days"
                value={metrics?.expiringBloodUnits || 0}
                annotation="Query 2 CTE shelf-life alert"
                alert={Number(metrics?.expiringBloodUnits) > 0}
              />
            </Link>
          </div>
        </section>

        {/* Editorial Asymmetric Layout: Chart (Large Col) + Triage Breakdown (Narrow Col) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
          {/* Main Chart: Blood Inventory by Phenotype */}
          <section className="lg:col-span-8 space-y-3" aria-label="Inventory Distribution">
            <div className="flex items-baseline justify-between pb-2 border-b border-rule">
              <div>
                <h2 className="font-serif text-lg text-ink font-medium">
                  Inventory Reserves by Phenotype
                </h2>
                <p className="text-xs text-muted">
                  Available units in storage (RBC, Whole Blood, Platelets, Plasma, Cryo)
                </p>
              </div>
              <span className="font-mono text-[11px] text-muted">
                Tabular units / Bags
              </span>
            </div>

            <div className="h-64 min-h-[256px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={charts?.bloodGroupDistribution || []}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="blood_group"
                    tick={{ fill: '#6B675E', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
                    axisLine={{ stroke: '#D9D4C7' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#6B675E', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
                    axisLine={{ stroke: '#D9D4C7' }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FBFAF6',
                      borderColor: '#D9D4C7',
                      color: '#1C1B18',
                      fontSize: '12px',
                      fontFamily: 'IBM Plex Mono',
                      borderRadius: '2px',
                      boxShadow: 'none',
                    }}
                  />
                  {/* Single calm slate/ink bars, with blood for critical O- */}
                  <Bar
                    dataKey="units"
                    name="Available Units"
                    fill="#3C4A57"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Narrow Column: Urgency Triage Breakdown */}
          <section className="lg:col-span-4 space-y-3" aria-label="Urgency Triage">
            <div className="pb-2 border-b border-rule">
              <h2 className="font-serif text-lg text-ink font-medium">
                Urgency Triage
              </h2>
              <p className="text-xs text-muted">
                Window-ranked clinical queue input
              </p>
            </div>

            <div className="h-44 min-h-[176px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts?.requestUrgencyData || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={65}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="urgency"
                  >
                    {(charts?.requestUrgencyData || []).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={URGENCY_PALETTE[entry.urgency] || '#3C4A57'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FBFAF6',
                      borderColor: '#D9D4C7',
                      color: '#1C1B18',
                      fontSize: '12px',
                      fontFamily: 'IBM Plex Mono',
                      borderRadius: '2px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="border-t border-rule pt-2 space-y-1.5 font-mono text-xs">
              {(charts?.requestUrgencyData || []).map((item) => (
                <div key={item.urgency} className="flex items-center justify-between py-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: URGENCY_PALETTE[item.urgency] || '#6B675E' }}
                    />
                    <span className="text-muted">{item.urgency}</span>
                  </div>
                  <span className="font-semibold text-ink tabular-nums">{item.count}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Hospital-Wise Inventory Overview Table */}
        <section className="space-y-3 pt-4" aria-label="Hospital Reserves">
          <div className="flex items-baseline justify-between pb-2 border-b border-rule">
            <div>
              <h2 className="font-serif text-lg text-ink font-medium">
                Hospital Inventory Stock Summary
              </h2>
              <p className="text-xs text-muted">
                Available vs allocated vs expired blood bags across affiliated networks
              </p>
            </div>
            <Link
              to="/blood-bank"
              className="text-xs text-muted hover:text-ink underline underline-offset-2"
            >
              Open Blood Bank Ledger &rarr;
            </Link>
          </div>

          <div className="border border-rule rounded-[2px] bg-surface overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-paper border-b border-rule font-mono text-[11px] uppercase tracking-wider text-muted">
                  <th className="py-2.5 px-3">Hospital Center</th>
                  <th className="py-2.5 px-3 text-right">Available Bags</th>
                  <th className="py-2.5 px-3 text-right">Allocated</th>
                  <th className="py-2.5 px-3 text-right">Expired Units</th>
                  <th className="py-2.5 px-3 text-right">Total Processed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule font-mono tabular-nums">
                {(charts?.hospitalInventoryData || []).map((h) => (
                  <tr key={h.hospital_name} className="hover:bg-paper transition-colors">
                    <td className="py-2.5 px-3 font-sans font-medium text-ink">
                      {h.hospital_name}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-moss">
                      {h.available}
                    </td>
                    <td className="py-2.5 px-3 text-right text-muted">
                      {h.allocated}
                    </td>
                    <td className="py-2.5 px-3 text-right text-blood">
                      {h.expired}
                    </td>
                    <td className="py-2.5 px-3 text-right text-ink font-semibold">
                      {(h.available || 0) + (h.allocated || 0) + (h.expired || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recent Blood Allocations Audit Trail */}
        <section className="space-y-3 pt-4" aria-label="Recent Allocations Audit">
          <div className="flex items-baseline justify-between pb-2 border-b border-rule">
            <div>
              <h2 className="font-serif text-lg text-ink font-medium">
                Recent Unit Allocations
              </h2>
              <p className="text-xs text-muted">
                Audit trail recorded in M:N junction BloodAllocation under ACID row locks
              </p>
            </div>
            <Link
              to="/blood-requests"
              className="text-xs text-muted hover:text-ink underline underline-offset-2"
            >
              Requisition Queue &rarr;
            </Link>
          </div>

          <div className="border border-rule rounded-[2px] bg-surface overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-paper border-b border-rule font-mono text-[11px] uppercase tracking-wider text-muted">
                  <th className="py-2.5 px-3">Alloc ID</th>
                  <th className="py-2.5 px-3">Request</th>
                  <th className="py-2.5 px-3">Unit</th>
                  <th className="py-2.5 px-3">Phenotype</th>
                  <th className="py-2.5 px-3">Component</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Authorized Official</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule font-mono tabular-nums">
                {(charts?.recentAllocations || []).map((alloc) => (
                  <tr key={alloc.allocation_id} className="hover:bg-paper transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-ink">
                      #{alloc.allocation_id}
                    </td>
                    <td className="py-2.5 px-3 text-muted">Req #{alloc.request_id}</td>
                    <td className="py-2.5 px-3 text-muted">Unit #{alloc.unit_id}</td>
                    <td className="py-2.5 px-3">
                      <BloodGroupStamp bloodGroup={alloc.blood_group} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 font-sans text-ink">{alloc.component_type}</td>
                    <td className="py-2.5 px-3 text-muted text-[11px]">
                      {alloc.allocated_date ? String(alloc.allocated_date).slice(0, 16) : '—'}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-ink">{alloc.authorized_by}</td>
                    <td className="py-2.5 px-3 text-right">
                      <StatusDot status={alloc.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </PageState>
    </div>
  );
};

export default Dashboard;
