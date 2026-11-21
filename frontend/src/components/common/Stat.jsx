import React from 'react';

/**
 * Big serif numerals sitting directly on the page with a small label and a hairline above
 */
export const Stat = ({
  label,
  value,
  annotation,
  alert = false,
  className = '',
}) => {
  return (
    <div className={`border-t border-rule pt-2.5 space-y-0.5 ${className}`}>
      <p className="text-[11px] font-mono uppercase tracking-wider text-muted flex items-center justify-between">
        <span>{label}</span>
        {alert && <span className="w-1.5 h-1.5 rounded-full bg-blood" title="Attention required" />}
      </p>
      <div className="flex items-baseline gap-2">
        <span
          className={`font-serif text-2xl sm:text-3xl font-normal tracking-tight tabular-nums ${
            alert ? 'text-blood' : 'text-ink'
          }`}
        >
          {value !== undefined && value !== null ? value : '—'}
        </span>
      </div>
      {annotation && (
        <p className="text-[11px] text-muted font-normal leading-tight">
          {annotation}
        </p>
      )}
    </div>
  );
};

export default Stat;
