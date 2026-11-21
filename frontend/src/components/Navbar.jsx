import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { ChevronDown, Database, Shield } from 'lucide-react';

const Navbar = () => {
  const { user, isMySQLConnected, quickLogin, logout } = useAuth();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const personas = [
    { username: 'admin', role: 'ADMIN', name: 'Dr. Vikram Sharma', desc: 'AIIMS &bull; Chief Medical Officer' },
    { username: 'staff_priya', role: 'STAFF', name: 'Dr. Priya Sundaram', desc: 'Apollo &bull; Transfusion Services' },
    { username: 'donor_rahul', role: 'DONOR', name: 'Rahul Deshmukh', desc: 'Universal Donor (O-)' },
    { username: 'patient_krishna', role: 'PATIENT', name: 'Krishna Kapoor', desc: 'Inpatient #20001 (AB-)' },
  ];

  const handlePersonaSwitch = async (username) => {
    await quickLogin(username);
    setRoleMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-surface border-b border-rule">
      <div className="px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Left: Typographic Title */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-baseline gap-1.5 group select-none">
            <span className="font-serif text-lg font-bold tracking-tight text-ink">
              LIFE<span className="text-blood">–LINK</span>
            </span>
            <span className="text-[11px] font-mono text-muted uppercase tracking-wider hidden sm:inline">
              / Clinical Ledger
            </span>
          </Link>
          <span className="hidden md:inline-block text-[11px] font-mono text-muted border-l border-rule pl-3">
            MySQL 8.0 Normalized Schema
          </span>
        </div>

        {/* Right: Engine Status, Role Switcher, Account */}
        <div className="flex items-center gap-3 text-xs">
          {/* Database Engine Status */}
          <div
            className="flex items-center gap-1.5 font-mono text-[11px] text-muted border border-rule px-2 py-0.5 rounded-[2px] bg-paper"
            title={isMySQLConnected ? 'Connected to MySQL 8.0 lifelink_db' : 'Checking database connection'}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isMySQLConnected ? 'bg-moss' : 'bg-ochre animate-pulse'}`} />
            <span>MySQL 8.0</span>
          </div>

          {/* Quick RBAC Persona Switcher */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 border border-rule bg-paper hover:bg-black/5 text-ink text-xs rounded-[2px] transition-colors font-mono"
            >
              <Shield className="w-3 h-3 text-blood" />
              <span>{user?.role || 'Guest'}</span>
              <ChevronDown className="w-3 h-3 text-muted" />
            </button>

            {roleMenuOpen && (
              <div className="absolute right-0 mt-1 w-64 bg-surface border border-rule rounded-[2px] shadow-lg p-1.5 z-50">
                <div className="px-2 py-1.5 border-b border-rule mb-1 font-mono text-[11px] text-muted">
                  Switch Active Persona (RBAC)
                </div>
                {personas.map((p) => (
                  <button
                    key={p.username}
                    onClick={() => handlePersonaSwitch(p.username)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-[2px] text-xs transition-colors ${
                      user?.username === p.username
                        ? 'bg-paper border-l-2 border-blood text-ink font-semibold'
                        : 'text-muted hover:text-ink hover:bg-paper'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-ink">{p.name}</span>
                      <span className="font-mono text-[10px] text-muted uppercase">{p.role}</span>
                    </div>
                    <p
                      className="text-[11px] text-muted leading-tight mt-0.5"
                      dangerouslySetInnerHTML={{ __html: p.desc }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User & Sign Out */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-rule">
              <span className="font-mono text-xs text-ink hidden lg:inline">
                {user.username}
              </span>
              <button
                onClick={logout}
                className="text-xs text-muted hover:text-blood underline underline-offset-2 transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-3 py-1 bg-blood text-paper text-xs font-medium rounded-[2px] hover:bg-blood-hover transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
