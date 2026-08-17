import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend, trendType = 'up', color = 'blue' }) => {
  const getColorClasses = () => {
    switch (color) {
      case 'red':
        return { bg: 'bg-red-500/10 text-red-400 border-red-500/30', glow: 'glow-red' };
      case 'amber':
        return { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30', glow: 'glow-amber' };
      case 'emerald':
        return { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', glow: 'glow-green' };
      case 'indigo':
        return { bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30', glow: 'glow-blue' };
      default:
        return { bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30', glow: 'glow-blue' };
    }
  };

  const colorConfig = getColorClasses();

  return (
    <div className="glass-panel glass-panel-hover p-5 rounded-2xl border border-gray-800 relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">{title}</p>
          <h3 className="text-3xl font-extrabold text-white font-mono tracking-tight">{value}</h3>
        </div>
        <div className={`p-3.5 rounded-2xl border ${colorConfig.bg}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-1.5 text-xs">
          {trendType === 'up' ? (
            <span className="flex items-center gap-0.5 text-emerald-400 font-semibold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800">
              <TrendingUp className="w-3.5 h-3.5" /> {trend}
            </span>
          ) : (
            <span className="flex items-center gap-0.5 text-red-400 font-semibold bg-red-950/40 px-2 py-0.5 rounded border border-red-800">
              <TrendingDown className="w-3.5 h-3.5" /> {trend}
            </span>
          )}
          <span className="text-gray-400 text-[11px]">vs previous 24h</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
