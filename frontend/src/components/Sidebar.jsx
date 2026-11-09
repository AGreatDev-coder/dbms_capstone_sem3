import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  Users,
  Bed,
  Droplet,
  Clock,
  HeartPulse,
  Tent,
  Terminal,
  Network,
  Info,
  Menu,
  X,
  Shield,
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, badge: null, roles: ['ADMIN', 'STAFF', 'DONOR', 'PATIENT'] },
    { to: '/hospitals', label: 'Hospital Management', icon: Building2, badge: 'Mod 2', roles: ['ADMIN', 'STAFF'] },
    { to: '/donors', label: 'Donor Management', icon: Users, badge: 'Mod 3', roles: ['ADMIN', 'STAFF', 'DONOR'] },
    { to: '/patients', label: 'Patient Management', icon: Bed, badge: 'Mod 4', roles: ['ADMIN', 'STAFF', 'PATIENT'] },
    { to: '/blood-bank', label: 'Blood Bank & Inventory', icon: Droplet, badge: 'Mod 5', roles: ['ADMIN', 'STAFF'] },
    { to: '/blood-requests', label: 'Blood Requests & Priority', icon: Clock, badge: 'Mod 6', roles: ['ADMIN', 'STAFF', 'PATIENT'] },
    { to: '/organ-donation', label: 'Organ Donation Network', icon: HeartPulse, badge: 'Mod 7', roles: ['ADMIN', 'STAFF', 'DONOR', 'PATIENT'] },
    { to: '/donation-camps', label: 'Donation Camps', icon: Tent, badge: 'Mod 8', roles: ['ADMIN', 'STAFF', 'DONOR'] },
    { to: '/sql-lab', label: 'SQL Laboratory', icon: Terminal, badge: 'Adv SQL', highlight: true, roles: ['ADMIN'] },
    { to: '/eer-diagram', label: 'EER Diagram & Schema', icon: Network, badge: 'EER', roles: ['ADMIN', 'STAFF', 'DONOR', 'PATIENT'] },
  ];

  const currentRole = user?.role || 'PATIENT';
  const visibleItems = navItems.filter((item) => item.roles.includes(currentRole));

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="md:hidden flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-slate-300">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-brand-400" />
          <span className="text-xs font-semibold text-slate-200">
            Navigation Menu ({visibleItems.length} modules)
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Container */}
      <aside
        className={`${
          mobileOpen ? 'block' : 'hidden'
        } md:flex md:w-64 bg-slate-900 text-slate-300 flex-col shrink-0 min-h-[calc(100vh-4rem)] border-r border-slate-800 transition-all`}
      >
        {/* Platform Title Section */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
              Academic DBMS Modules
            </p>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-brand-950 text-brand-400 border border-brand-800/50">
              {currentRole}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            MySQL 8.0 Normalized Schema
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30 font-bold'
                      : item.highlight
                      ? 'bg-indigo-950/60 text-indigo-300 hover:bg-indigo-900/50 hover:text-white border border-indigo-800/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ml-1.5 ${
                      item.highlight
                        ? 'bg-indigo-500/20 text-indigo-300 font-bold'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Educational Banner */}
        <div className="p-4 m-3 rounded-xl bg-slate-800/70 border border-slate-700/60 text-xs">
          <div className="flex items-center gap-2 text-brand-400 font-semibold mb-1">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>DBMS Architecture</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Demonstrating Overlapping Specialization, Aggregation, ACID Row-Lock Transactions & Window Queries.
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

