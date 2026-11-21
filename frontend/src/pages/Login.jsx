import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/common/FormControls';
import { Button } from '../components/common/Button';

const Login = () => {
  const { login, quickLogin } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Password@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const personas = [
    {
      username: 'developer',
      role: 'DEVELOPER',
      name: 'System Developer',
      facility: 'Universal System Grid',
      scope: 'Universal data access across all hospitals, full write permissions, schema & system orchestration',
    },
    {
      username: 'admin',
      role: 'ADMIN',
      name: 'Dr. Vikram Sharma',
      facility: 'AIIMS New Delhi',
      scope: 'AIIMS hospital admin, local ward management, staff hierarchy supervision (Hospital-scoped)',
    },
    {
      username: 'staff_priya',
      role: 'STAFF',
      name: 'Dr. Priya Sundaram',
      facility: 'Apollo Multispeciality',
      scope: 'Apollo hospital staff, patient intake, transfusion allocations, phlebotomy (Hospital-scoped)',
    },
    {
      username: 'donor_rahul',
      role: 'DONOR',
      name: 'Rahul Deshmukh (O-)',
      facility: 'Community Registry',
      scope: 'Donation history ledger, camp registrations, organ pledge',
    },
    {
      username: 'patient_krishna',
      role: 'PATIENT',
      name: 'Krishna Kapoor (AB-)',
      facility: 'Cardiovascular Care',
      scope: 'Inpatient #20001 status, transfusion requisition tracking',
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
    <div className="min-h-screen bg-paper flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Editorial Statement */}
        <div className="md:col-span-5 space-y-4 pt-2">
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
            Healthcare DBMS Capstone
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl text-ink font-semibold leading-tight tracking-tight">
            LIFE<span className="text-blood">–LINK</span>
          </h1>
          <p className="text-xs text-muted leading-relaxed">
            Centralized blood bank and organ donor network management system.
            A 3NF normalized relational schema enforcing multi-attribute specialization,
            ACID row-locking transactions, and perishable inventory rules on MySQL 8.0.
          </p>

          <div className="pt-4 border-t border-rule space-y-2 text-[11px] text-muted font-mono">
            <div className="flex justify-between py-1 border-b border-rule/50">
              <span>Database Engine</span>
              <span className="text-ink">MySQL 8.0.x (InnoDB)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-rule/50">
              <span>Relational Tables</span>
              <span className="text-ink">14 Normalized Entities</span>
            </div>
            <div className="flex justify-between py-1 border-b border-rule/50">
              <span>Active Inpatients</span>
              <span className="text-ink">400 Synthetic Records</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Authorization</span>
              <span className="text-ink">Stateless JWT + RBAC</span>
            </div>
          </div>
        </div>

        {/* Right Form & Demo Table */}
        <div className="md:col-span-7 bg-surface border border-rule p-6 rounded-[2px] shadow-sm space-y-6">
          <div>
            <h2 className="font-serif text-xl text-ink font-medium">Access Records</h2>
            <p className="text-xs text-muted mt-0.5">
              Sign in with institutional credentials or select an evaluation role.
            </p>
          </div>

          {error && (
            <div className="p-3 border border-blood/30 bg-blood-soft/20 text-blood font-mono text-xs rounded-[2px]">
              {error}
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleManualLogin} className="space-y-3.5">
            <Input
              label="Username or System Identifier"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin, staff_priya"
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              helperText="Academic test password: Password@123"
            />

            <div className="pt-1">
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                className="w-full"
              >
                Authenticate Session
              </Button>
            </div>
          </form>

          {/* Demonstration Accounts Plain Table */}
          <div className="pt-5 border-t border-rule space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
                Evaluation Roster (One-Click)
              </p>
              <span className="text-[10px] font-mono text-muted">Password@123</span>
            </div>

            <div className="border border-rule rounded-[2px] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-paper border-b border-rule text-muted uppercase text-[10px] font-mono tracking-wider">
                    <th className="py-2 px-3">Role</th>
                    <th className="py-2 px-3">Official</th>
                    <th className="py-2 px-3">Facility</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule bg-surface font-mono">
                  {personas.map((p) => (
                    <tr key={p.username} className="hover:bg-paper transition-colors">
                      <td className="py-2 px-3 font-semibold text-ink">
                        <span className={`inline-block ${p.role === 'ADMIN' ? 'text-blood' : 'text-ink'}`}>
                          {p.role}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-sans text-ink">
                        <div>{p.name}</div>
                        <div className="text-[10px] font-mono text-muted">{p.username}</div>
                      </td>
                      <td className="py-2 px-3 font-sans text-muted text-[11px]">
                        {p.facility}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleSelectPersona(p.username)}
                          disabled={loading}
                          className="text-blood hover:text-blood-hover font-sans text-xs underline underline-offset-2"
                        >
                          Sign in
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
