import React from 'react';

/**
 * Small square "stamp" (mono, bold, 1px border)
 */
export const BloodGroupStamp = ({ bloodGroup = '', size = 'md', className = '' }) => {
  const isRhNegative = bloodGroup.includes('-');

  const sizeClasses = {
    sm: 'text-[10px] px-1 py-0.5 min-w-[24px]',
    md: 'text-xs px-1.5 py-0.5 min-w-[28px]',
    lg: 'text-sm px-2 py-1 min-w-[34px]',
  };

  return (
    <span
      className={`inline-block text-center font-mono font-semibold border rounded-[2px] tabular-nums select-none ${
        isRhNegative
          ? 'border-blood/40 text-blood bg-blood-soft/20'
          : 'border-rule text-ink bg-surface'
      } ${sizeClasses[size] || sizeClasses.md} ${className}`}
      title={`Phenotype: ${bloodGroup}`}
    >
      {bloodGroup || '—'}
    </span>
  );
};

export default BloodGroupStamp;
