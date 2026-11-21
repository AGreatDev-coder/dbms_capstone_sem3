import React from 'react';

/**
 * Clinical Ledger Stat: A hairline divider above, small uppercase label, big serif numeral
 */
const StatCard = ({ title, value, subtitle, alert = false, onClick, className = '' }) => {
  return (
    <div
      onClick={onClick}
      className={`border-t border-rule pt-2.5 pb-2 transition-colors ${
        onClick ? 'cursor-pointer hover:bg-black/[0.02]' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-mono uppercase tracking-wider text-muted">
          {title}
        </p>
        {alert && (
          <span className="w-1.5 h-1.5 rounded-full bg-blood shrink-0" title="Attention" />
        )}
      </div>
      <p
        className={`font-serif text-2xl sm:text-3xl font-normal tracking-tight mt-0.5 tabular-nums ${
          alert ? 'text-blood' : 'text-ink'
        }`}
      >
        {value !== undefined && value !== null ? value : '—'}
      </p>
      {subtitle && (
        <p className="text-[11px] text-muted mt-1 leading-snug truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default StatCard;
