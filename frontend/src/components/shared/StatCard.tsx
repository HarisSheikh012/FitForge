import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  changeText?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeType = 'increase',
  changeText,
  icon: Icon,
}) => {
  const isPositive = changeType === 'increase';

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl p-6 shadow-premium transition-all duration-300 hover:shadow-premium-hover">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
            {title}
          </p>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-zinc-100 mt-2 tracking-tight">
            {value}
          </h3>
        </div>
        {Icon && (
          <div className="p-2.5 bg-slate-50 dark:bg-zinc-800/50 rounded-xl text-slate-400 dark:text-zinc-500">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {change !== undefined && (
        <div className="flex items-center gap-1.5 mt-4">
          <span
            className={`flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
              isPositive
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
            }`}
          >
            {isPositive ? (
              <ArrowUpRight size={12} className="mr-0.5" />
            ) : (
              <ArrowDownRight size={12} className="mr-0.5" />
            )}
            {change}%
          </span>
          <span className="text-xs text-slate-400 dark:text-zinc-500">
            {changeText ?? 'from last month'}
          </span>
        </div>
      )}
    </div>
  );
};
