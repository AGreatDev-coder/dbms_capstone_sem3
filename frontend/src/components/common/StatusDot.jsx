import React from 'react';

/**
 * Clinical Ledger Status Dot: a 6px dot + text label, no filled rainbow pills
 */
export const StatusDot = ({ status, className = '' }) => {
  const norm = (status || '').toString().toUpperCase();

  let dotColor = 'bg-slate';
  let textColor = 'text-ink';
  let label = status;

  if (['CRITICAL', 'EXPIRED', 'FAILED', 'REJECTED', 'CANCELLED'].includes(norm)) {
    dotColor = 'bg-blood';
    textColor = 'text-blood font-medium';
  } else if (
    ['HIGH', 'EXPIRING', 'EXPIRING_SOON', 'DEFERRED', 'PENDING', 'WAITING', 'PARTIALLY_FULFILLED', 'IN_PROGRESS', 'MATCH_PENDING'].includes(
      norm
    )
  ) {
    dotColor = 'bg-ochre';
    textColor = 'text-ochre font-medium';
  } else if (
    ['AVAILABLE', 'STABLE', 'RECOVERING', 'PASSED', 'VERIFIED_BY_COMMITTEE', 'HIGH_COMPATIBILITY', 'FULFILLED', 'COMPLETED', 'ACTIVE'].includes(
      norm
    )
  ) {
    dotColor = 'bg-moss';
    textColor = 'text-moss font-medium';
  } else if (['ROUTINE', 'MEDIUM', 'POTENTIAL_MATCH', 'PLEDGED', 'UPCOMING', 'DISCHARGED'].includes(norm)) {
    dotColor = 'bg-slate';
    textColor = 'text-slate font-medium';
  }

  // Format label: sentence case or clean spaced string
  const cleanLabel = norm
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-mono tabular-nums ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      <span className={textColor}>{cleanLabel}</span>
    </span>
  );
};

export default StatusDot;
