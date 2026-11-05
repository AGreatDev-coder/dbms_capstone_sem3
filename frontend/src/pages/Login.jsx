import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Activity, Shield, UserCheck, Key, ArrowRight, Database, CheckCircle2 } from 'lucide-react';

const Login = () => {
  const { login, quickLogin, isMySQLConnected } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Password@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const personas = [
    {
      username: 'admin',
      role: 'ADMIN',
      title: 'Chief Medical Officer',
      name: 'Dr. Vikram Sharma',
      facility: 'AIIMS New Delhi',
      desc: 'Full administrator access to all hospitals, staff, wards, analytics, and SQL laboratory.',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    },
    {
      username: 'staff_priya',
      role: 'STAFF',
      title: 'Head of Transfusion Services',
      name: 'Dr. Priya Sundaram',
      facility: 'Apollo Multispeciality',
      desc: 'Authorized to process blood requests, verify candidate organ matches, and allocate units.',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    },
    {
      username: 'donor_rahul',
      role: 'DONOR',
      title: 'Voluntary Universal Donor',
      name: 'Rahul Deshmukh (O-)',
      facility: 'Community Registry',
      desc: 'Can view donation history, register for upcoming donation camps, and manage availability.',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    {
      username: 'patient_aditya',
      role: 'PATIENT',
      title: 'Admitted Inpatient',
      name: 'Aditya Mehta (O+)',
      facility: 'Cardiovascular Care',
      desc: 'Can monitor pending blood requests, allocation status, and organ waiting list standing.',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    },
  ];

  const handleManualLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await login(username, password);
    setLoading(false);

    if (res.success) {
      navigate('/');
    } else {
      setError(res.message);
    }
  };

  const handleSelectPersona = async (uname) => {
    setLoading(true);
    setError('');
    const res = await quickLogin(uname);
    setLoading(false);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        {/* Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-rose-500 text-white shadow-xl shadow-brand-500/25 mb-1">
            <Activity className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            LIFE<span className="text-brand-600">-LINK</span> Network Access
          </h1>
          <p className="text-xs text-slate-500 max-w-lg mx-auto">
            Blood Bank & Organ Donor Network Management System | MySQL 8.0 DBMS Academic Capstone Project
          </p>
        </div>

        {/* 1-Click Persona Selector Grid (For Examiners & Reviewers) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand-600" />
                <span>One-Click Academic Evaluation Personas</span>
              </h2>
              <p className="text-xs text-slate-500">
                Select any test role below to immediately experience Role-Based Access Control (RBAC):
              </p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              Demo Credentials Preloaded
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {personas.map((p) => (
              <button
                key={p.username}
                onClick={() => handleSelectPersona(p.username)}
                disabled={loading}
                className="text-left p-4 rounded-xl border border-slate-200 hover:border-brand-500 hover:shadow-md transition-all group bg-slate-50/50 hover:bg-white"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${p.badgeColor}`}>
                    {p.role} ROLE
                  </span>
                  <span className="text-xs font-bold text-slate-400 group-hover:text-brand-600 flex items-center gap-1 transition-colors">
                    <span>Login</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                  {p.name}
                </h3>
                <p className="text-xs font-medium text-slate-600 mt-0.5">
                  {p.title} &bull; {p.facility}
                </p>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  {p.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Manual Credentials Box */}
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 text-center">
            Or Sign In with Credentials
          </h3>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleManualLogin} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Username or Email</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-black text-white font-bold transition-colors shadow-sm mt-2 disabled:opacity-60"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

