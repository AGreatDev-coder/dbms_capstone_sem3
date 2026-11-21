import React from 'react';

/**
 * Text tabs with simple 2px bottom border indicator, no filled pill buttons
 */
export const Tabs = ({ tabs = [], activeTab, onChange, className = '' }) => {
  return (
    <div className={`flex items-center gap-4 sm:gap-6 border-b border-rule overflow-x-auto text-xs ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`pb-2.5 pt-1 font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 select-none ${
              isActive
                ? 'border-blood text-ink font-semibold'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count !== null && (
              <span
                className={`font-mono text-[10px] px-1 py-0.2 border rounded-[2px] tabular-nums ${
                  isActive
                    ? 'border-blood/40 text-blood bg-blood-soft/20'
                    : 'border-rule text-muted bg-paper'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
