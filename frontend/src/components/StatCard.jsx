import React from 'react';

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue', alert = false, onClick }) => {
  const colorMap = {
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-100 hover:border-rose-300',
      iconBg: 'bg-rose-100 text-rose-600',
    },
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-100 hover:border-blue-300',
      iconBg: 'bg-blue-100 text-blue-600',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100 hover:border-emerald-300',
      iconBg: 'bg-emerald-100 text-emerald-600',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-100 hover:border-purple-300',
      iconBg: 'bg-purple-100 text-purple-600',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100 hover:border-amber-300',
      iconBg: 'bg-amber-100 text-amber-600',
    },
  };

  const c = colorMap[color] || colorMap.blue;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-5 border shadow-sm transition-all duration-200 ${c.border} ${
        onClick ? 'cursor-pointer hover:shadow-md' : ''
      } ${alert ? 'ring-2 ring-rose-500 ring-offset-1' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg ${c.iconBg}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
      {subtitle && (
        <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 flex items-center gap-1">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default StatCard;

