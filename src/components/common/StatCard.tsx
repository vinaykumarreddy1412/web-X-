import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { GlassCard } from './GlassCard';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  badge?: string;
  icon: LucideIcon;
  color?: 'blue' | 'red' | 'indigo' | 'emerald' | 'amber';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  badge,
  icon: Icon,
  color = 'blue'
}) => {
  const iconBgMap = {
    blue: 'bg-blue-500/10 text-blue-600',
    red: 'bg-red-500/10 text-red-600',
    indigo: 'bg-indigo-500/10 text-indigo-600',
    emerald: 'bg-emerald-500/10 text-emerald-600',
    amber: 'bg-amber-500/10 text-amber-600'
  };

  const isLongValue = typeof value === 'string' && value.length > 7;

  return (
    <GlassCard glowAccent={color === 'red' ? 'red' : color === 'emerald' ? 'cyan' : 'blue'}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{title}</p>
            {badge && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                {badge}
              </span>
            )}
          </div>
          <h3 
            className={`font-black text-slate-900 tracking-tight leading-tight line-clamp-2 ${
              isLongValue ? 'text-sm sm:text-base' : 'text-2xl sm:text-3xl'
            }`}
            title={typeof value === 'string' ? value : undefined}
          >
            {value}
          </h3>
          {subtitle && (
            <p className="text-[11px] font-semibold text-slate-500 mt-1 truncate" title={subtitle}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-xl shrink-0 ${iconBgMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </GlassCard>
  );
};
