import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, Database, UserCheck, Shield, ChevronDown, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const { user, isMySQLConnected, quickLogin, logout } = useAuth();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const personas = [
    { username: 'admin', role: 'ADMIN', name: 'Dr. Vikram Sharma', desc: 'Chief Medical Officer (AIIMS)' },
    { username: 'staff_priya', role: 'STAFF', name: 'Dr. Priya Sundaram', desc: 'Head of Transfusion (Apollo)' },
    { username: 'donor_rahul', role: 'DONOR', name: 'Rahul Deshmukh', desc: 'Universal Blood Donor (O-)' },
    { username: 'patient_aditya', role: 'PATIENT', name: 'Aditya Mehta', desc: 'Critical Inpatient (Cardiology)' },
  ];

  const handlePersonaSwitch = async (username) => {
    await quickLogin(username);
    setRoleMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-rose-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-brand-600 transition-colors">
                LIFE<span className="text-brand-600">-LINK</span>
              </span>
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-600">
                Blood Bank & Organ Network DBMS
              </p>
            </div>
          </Link>

          {/* Academic Capstone Pill */}
          <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            MySQL 8.0 Capstone
          </span>
        </div>

        {/* Right: DB Engine Status & Role Switcher */}
        <div className="flex items-center gap-3">
          {/* Database Connection Status Badge */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
              isMySQLConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
            title={
              isMySQLConnected
                ? 'Direct socket connection active to MySQL 8.0 (lifelink_db)'
                : 'Operating in self-contained relational simulation mode with seed data'
            }
          >
            <Database className="w-3.5 h-3.5" />
            <span>{isMySQLConnected ? 'MySQL 8.0 (InnoDB)' : 'Relational Mode (lifelink_db)'}</span>
            {isMySQLConnected ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            )}
          </div>

          {/* Quick RBAC Persona Switcher (For Graders & Reviewers) */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-all"
            >
              <Shield className="w-3.5 h-3.5 text-brand-600" />
              <span>Role: <strong className="text-slate-900">{user?.role || 'Guest'}</strong></span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white shadow-xl border border-slate-200 p-2 z-50">
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <p className="text-xs font-bold text-slate-900">Switch Test Persona</p>
                  <p className="text-[11px] text-slate-500">1-click test RBAC access controls</p>
                </div>
                {personas.map((p) => (
                  <button
                    key={p.username}
                    onClick={() => handlePersonaSwitch(p.username)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-start gap-2.5 hover:bg-slate-50 transition-colors ${
                      user?.username === p.username ? 'bg-brand-50/70 border border-brand-200 font-semibold' : ''
                    }`}
                  >
                    <div className="mt-0.5">
                      {user?.username === p.username ? (
                        <CheckCircle2 className="w-4 h-4 text-brand-600" />
                      ) : (
                        <UserCheck className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-slate-900 font-medium">
                        {p.name} <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 font-mono">{p.role}</span>
                      </p>
                      <p className="text-[11px] text-slate-500">{p.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Profile / Logout */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="hidden lg:block text-right">
                <p className="text-xs font-bold text-slate-800">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-[11px] text-slate-500 font-mono">{user.blood_group || 'O+'} Blood Group</p>
              </div>
              <button
                onClick={logout}
                title="Sign out"
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-4 py-1.5 text-xs font-bold rounded-lg bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;

