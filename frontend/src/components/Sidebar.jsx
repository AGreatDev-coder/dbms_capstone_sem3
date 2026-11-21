import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X } from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentRole = user?.role || 'PATIENT';

  const getDashboardLabel = (role) => {
    switch (role) {
      case 'DEVELOPER':
        return 'Developer Console';
      case 'ADMIN':
        return 'Hospital Admin Dashboard';
      case 'STAFF':
        return 'Staff Operations';
      case 'DONOR':
        return 'Donor Dashboard';
      case 'PATIENT':
        return 'Patient Care Dashboard';
      default:
        return 'Dashboard';
    }
  };

  const sections = [
    {
      group: 'Overview',
      items: [
        { to: '/', number: '01', label: getDashboardLabel(currentRole), roles: ['DEVELOPER', 'ADMIN', 'STAFF', 'DONOR', 'PATIENT'] },
      ],
    },
    {
      group: 'Clinical Records',
      items: [
        { to: '/hospitals', number: '02', label: 'Hospitals & Wards', roles: ['ADMIN', 'STAFF'] },
        { to: '/patients', number: '03', label: 'Patients (400 Dataset)', roles: ['ADMIN', 'STAFF'] },
      ],
    },
    {
      group: 'Blood & Organ Network',
      items: [
        { to: '/blood-bank', number: '04', label: 'Blood Bank Inventory', roles: ['ADMIN', 'STAFF'] },
        { to: '/blood-requests', number: '05', label: 'Blood Requests & Priority', roles: ['ADMIN', 'STAFF', 'PATIENT'] },
        { to: '/donors', number: '06', label: 'Donor Registry', roles: ['ADMIN', 'STAFF', 'DONOR'] },
        { to: '/organ-donation', number: '07', label: 'Organ Donation Network', roles: ['ADMIN', 'STAFF', 'DONOR', 'PATIENT'] },
      ],
    },
    {
      group: 'Outreach & Operations',
      items: [
        { to: '/donation-camps', number: '08', label: 'Donation Camps', roles: ['ADMIN', 'STAFF', 'DONOR'] },
      ],
    },
    {
      group: 'DBMS Demonstration',
      items: [
        { to: '/dbms-lab', number: '09', label: 'DBMS Learning Lab', roles: ['ADMIN', 'STAFF', 'DONOR', 'PATIENT'] },
        { to: '/sql-lab', number: '10', label: 'SQL Workbench', roles: ['ADMIN', 'STAFF'] },
        { to: '/eer-diagram', number: '11', label: 'EER Architecture', roles: ['ADMIN', 'STAFF', 'DONOR', 'PATIENT'] },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Top Bar Toggle */}
      <div className="md:hidden flex items-center justify-between px-4 py-2 bg-surface border-b border-rule text-ink">
        <span className="font-mono text-xs uppercase tracking-wider text-muted">
          Ledger Index
        </span>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1 border border-rule rounded-[2px] text-ink hover:bg-black/5"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Sidebar Container */}
      <aside
        className={`${
          mobileOpen ? 'block' : 'hidden'
        } md:block w-64 bg-paper border-r border-rule shrink-0 min-h-[calc(100vh-3.5rem)]`}
      >
        <div className="p-4 space-y-5">
          {sections.map((section) => {
            const visibleItems = section.items.filter((item) => currentRole === 'DEVELOPER' || item.roles.includes(currentRole));
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.group} className="space-y-1">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted px-2 py-0.5">
                  {section.group}
                </p>
                <nav className="space-y-0.5">
                  {visibleItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/'}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `flex items-baseline justify-between px-2.5 py-1.5 rounded-[2px] text-xs transition-colors select-none ${
                          isActive
                            ? 'border-l-2 border-blood text-ink font-semibold bg-surface'
                            : 'border-l-2 border-transparent text-muted hover:text-ink hover:bg-black/[0.02]'
                        }`
                      }
                    >
                      <span className="truncate">{item.label}</span>
                      <span className="font-mono text-[10px] text-muted/70 shrink-0 ml-2">
                        {item.number}
                      </span>
                    </NavLink>
                  ))}
                </nav>
              </div>
            );
          })}
        </div>

        {/* Signed-in status footer */}
        <div className="p-4 m-3 border-t border-rule font-mono text-[11px] text-muted space-y-1.5">
          <div className="flex items-center justify-between text-ink">
            <span className="font-medium truncate">{user?.username || 'Guest'}</span>
            <span className={`px-1.5 py-0.5 border text-[10px] rounded-[2px] uppercase font-bold ${
              currentRole === 'DEVELOPER' ? 'bg-moss/10 border-moss/40 text-moss' : 'border-rule'
            }`}>
              {currentRole}
            </span>
          </div>
          {currentRole === 'DEVELOPER' ? (
            <p className="text-[10px] text-moss font-semibold">
              Universal Access Ledger &bull; All Hospitals
            </p>
          ) : user?.hospital_name ? (
            <p className="text-[10px] text-muted leading-tight truncate" title={user.hospital_name}>
              {user.hospital_name}
            </p>
          ) : null}
          <p className="text-[10px] text-muted/70 leading-normal">
            MySQL 8.0 InnoDB &bull; 3NF Relational Ledger
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
