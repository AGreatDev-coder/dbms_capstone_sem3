import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StatCard from '../components/StatCard';
import { StatusBadge, UrgencyBadge, BloodGroupPill } from '../components/Badge';
import {
  Users,
  Bed,
  Building2,
  Droplet,
  Clock,
  AlertOctagon,
  HeartPulse,
  AlertTriangle,
  ArrowRight,
  Database,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [mRes, cRes] = await Promise.all([
        api.get('/dashboard/metrics'),
        api.get('/dashboard/charts'),
      ]);
      if (mRes.data && mRes.data.success) setMetrics(mRes.data.metrics);
      if (cRes.data && cRes.data.success) setCharts(cRes.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const URGENCY_COLORS = {
    CRITICAL: '#e11d48',
    HIGH: '#f59e0b',
    MEDIUM: '#3b82f6',
    ROUTINE: '#94a3b8',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-semibold text-slate-600">Loading Clinical Network Metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Centralized Network Operations Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time monitoring of blood inventories, priority transfusion queues, and organ candidate networks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/sql-lab"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Launch SQL Lab</span>
          </Link>
          <Link
            to="/blood-requests"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-brand-600 text-white hover:bg-brand-700 shadow-sm transition-colors"
          >
            <span>Process Blood Requests</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Primary KPI Metric Cards (Module 1 Requirement) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/donors">
          <StatCard
            title="Registered Donors"
            value={metrics?.totalDonors || 0}
            subtitle="Blood & Organ Donors (Subtype)"
            icon={Users}
            color="blue"
          />
        </Link>
        <Link to="/patients">
          <StatCard
            title="Registered Patients"
            value={metrics?.totalPatients || 0}
            subtitle="Admitted Inpatients (Subtype)"
            icon={Bed}
            color="purple"
          />
        </Link>
        <Link to="/hospitals">
          <StatCard
            title="Affiliated Hospitals"
            value={metrics?.totalHospitals || 0}
            subtitle="Regional Tertiary Care Centers"
            icon={Building2}
            color="emerald"
          />
        </Link>
        <Link to="/blood-bank">
          <StatCard
            title="Available Blood Units"
            value={metrics?.availableBloodUnits || 0}
            subtitle="Screened & Safe Units in Stock"
            icon={Droplet}
            color="rose"
          />
        </Link>
      </div>

      {/* Secondary Operational Alerts (Urgency & Shelf-Life) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/blood-requests">
          <StatCard
            title="Pending Blood Requests"
            value={metrics?.pendingBloodRequests || 0}
            subtitle="Awaiting Unit Allocation"
            icon={Clock}
            color="amber"
          />
        </Link>
        <Link to="/blood-requests">
          <StatCard
            title="Urgent Requests"
            value={metrics?.urgentRequests || 0}
            subtitle="Critical & High Priority Queue"
            icon={AlertOctagon}
            color="rose"
            alert={metrics?.urgentRequests > 0}
          />
        </Link>
        <Link to="/organ-donation">
          <StatCard
            title="Organ Waiting List"
            value={metrics?.organRequests || 0}
            subtitle="Active Recipient Requests"
            icon={HeartPulse}
            color="purple"
          />
        </Link>
        <Link to="/blood-bank?tab=expiring">
          <StatCard
            title="Units Expiring <= 7 Days"
            value={metrics?.expiringBloodUnits || 0}
            subtitle="Query 2 CTE Shelf-Life Alert"
            icon={AlertTriangle}
            color="amber"
            alert={metrics?.expiringBloodUnits > 0}
          />
        </Link>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Blood Group Distribution Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Blood Group Inventory vs Registered Donors</h2>
              <p className="text-xs text-slate-500">Distribution across 8 standard ABO and Rh phenotypes</p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              InnoDB Indexed
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.bloodGroupDistribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="blood_group" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="units" name="Available Units (Bags)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="donors" name="Voluntary Donors" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Request Urgency Distribution Pie Chart */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900">Request Urgency Triage</h2>
            <p className="text-xs text-slate-500">Window function rank inputs</p>
          </div>

          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.requestUrgencyData || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="urgency"
                >
                  {(charts?.requestUrgencyData || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={URGENCY_COLORS[entry.urgency] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100">
            {(charts?.requestUrgencyData || []).map((item) => (
              <div key={item.urgency} className="flex items-center gap-2 text-xs">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: URGENCY_COLORS[item.urgency] || '#94a3b8' }}
                />
                <span className="text-slate-600 truncate">{item.urgency}:</span>
                <strong className="text-slate-900">{item.count}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hospital Inventory Comparison Bar Chart */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Hospital-Wise Blood Unit Stock Comparison</h2>
            <p className="text-xs text-slate-500">Available vs Allocated vs Expired Units (Query 3 CTE Data)</p>
          </div>
          <Link to="/blood-bank" className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
            <span>Manage Inventory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts?.hospitalInventoryData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="hospital_name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="available" name="Available Units" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="allocated" name="Allocated Units" fill="#a855f7" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expired" name="Expired Units" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Blood Allocation Audit Trail (Query 9 Junction Result) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Blood Allocations (Audit Trail)</h2>
            <p className="text-xs text-slate-500">M:N Junction Table (BloodAllocation) with Row-Lock Transactions</p>
          </div>
          <Link
            to="/blood-requests"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>View All Allocations</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Allocation ID</th>
                <th className="py-3 px-4">Request #</th>
                <th className="py-3 px-4">Unit #</th>
                <th className="py-3 px-4">Blood Group</th>
                <th className="py-3 px-4">Component</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Authorized By</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(charts?.recentAllocations || []).map((alloc) => (
                <tr key={alloc.allocation_id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">#{alloc.allocation_id}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">Req #{alloc.request_id}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">Unit #{alloc.unit_id}</td>
                  <td className="py-3 px-4">
                    <BloodGroupPill bloodGroup={alloc.blood_group} />
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700">{alloc.component_type}</td>
                  <td className="py-3 px-4 text-slate-500">{alloc.allocated_date}</td>
                  <td className="py-3 px-4 text-slate-800 font-medium">{alloc.authorized_by}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={alloc.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

