import React from 'react';

export const Input = ({
  label,
  helperText,
  error,
  className = '',
  id,
  type = 'text',
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-ink">
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        className={`w-full px-2.5 py-1.5 bg-surface border text-ink text-xs rounded-[2px] transition-colors focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink placeholder:text-muted/60 ${
          error ? 'border-blood' : 'border-rule'
        } ${className}`}
        {...props}
      />
      {error ? (
        <p className="text-[11px] text-blood font-mono">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-muted">{helperText}</p>
      ) : null}
    </div>
  );
};

export const Select = ({
  label,
  helperText,
  error,
  children,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-medium text-ink">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full px-2.5 py-1.5 bg-surface border text-ink text-xs rounded-[2px] transition-colors focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink ${
          error ? 'border-blood' : 'border-rule'
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <p className="text-[11px] text-blood font-mono">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-muted">{helperText}</p>
      ) : null}
    </div>
  );
};

export const Textarea = ({
  label,
  helperText,
  error,
  className = '',
  id,
  rows = 3,
  ...props
}) => {
  const areaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={areaId} className="block text-xs font-medium text-ink">
          {label}
        </label>
      )}
      <textarea
        id={areaId}
        rows={rows}
        className={`w-full px-2.5 py-1.5 bg-surface border text-ink text-xs rounded-[2px] transition-colors focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink placeholder:text-muted/60 resize-y ${
          error ? 'border-blood' : 'border-rule'
        } ${className}`}
        {...props}
      />
      {error ? (
        <p className="text-[11px] text-blood font-mono">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-muted">{helperText}</p>
      ) : null}
    </div>
  );
};
