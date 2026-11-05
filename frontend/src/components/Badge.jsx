import React from 'react';

export const UrgencyBadge = ({ urgency }) => {
  const styles = {
    CRITICAL: 'bg-rose-100 text-rose-800 border-rose-200 animate-pulse font-semibold',
    HIGH: 'bg-amber-100 text-amber-800 border-amber-200 font-medium',
    MEDIUM: 'bg-blue-100 text-blue-800 border-blue-200 font-medium',
    ROUTINE: 'bg-slate-100 text-slate-700 border-slate-200 font-medium',
  };

  const style = styles[urgency] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${style}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {urgency}
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  const styles = {
    AVAILABLE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ALLOCATED: 'bg-purple-50 text-purple-700 border-purple-200',
    EXPIRED: 'bg-rose-50 text-rose-700 border-rose-200',
    RESERVED: 'bg-amber-50 text-amber-700 border-amber-200',
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    PARTIALLY_FULFILLED: 'bg-blue-50 text-blue-700 border-blue-200',
    FULFILLED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    WAITING: 'bg-sky-50 text-sky-700 border-sky-200',
    MATCH_PROPOSED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    VERIFIED_BY_COMMITTEE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    PENDING_VERIFICATION: 'bg-amber-50 text-amber-700 border-amber-200',
    PLEDGED: 'bg-teal-50 text-teal-700 border-teal-200',
    CRITICAL: 'bg-rose-100 text-rose-800 border-rose-200',
    STABLE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    RECOVERING: 'bg-blue-100 text-blue-800 border-blue-200',
    DISCHARGED: 'bg-slate-100 text-slate-700 border-slate-200',
    PASSED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    SCHEDULED: 'bg-sky-50 text-sky-700 border-sky-200',
    COMPLETED: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const formatted = status ? status.replace(/_/g, ' ') : 'UNKNOWN';
  const style = styles[status] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
      {formatted}
    </span>
  );
};

export const BloodGroupPill = ({ bloodGroup, className = '' }) => {
  return (
    <span className={`inline-flex items-center justify-center font-mono font-bold text-xs px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 ${className}`}>
      {bloodGroup}
    </span>
  );
};

