import React from 'react';

/**
 * Top of each page: serif page title, one-line plain description, primary action aligned right.
 * Breadcrumb in small mono.
 */
export const PageHeader = ({
  title,
  description,
  breadcrumb,
  action,
  secondaryAction,
  badge,
  className = '',
}) => {
  return (
    <div className={`pb-4 border-b border-rule ${className}`}>
      {breadcrumb && (
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted mb-1">
          {breadcrumb}
        </p>
      )}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
              {title}
            </h1>
            {badge && (
              <span className="font-mono text-[11px] px-1.5 py-0.5 border border-rule text-muted bg-surface rounded-[2px]">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted mt-1 max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {(action || secondaryAction) && (
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            {secondaryAction}
            {action}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
