import React from 'react';

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl p-6 shadow-premium animate-pulse space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2 w-full">
          <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-1/4" />
          <div className="h-8 bg-slate-200 dark:bg-zinc-800 rounded w-1/2" />
        </div>
        <div className="w-10 h-10 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
      </div>
      <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-3/4" />
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl shadow-premium overflow-hidden animate-pulse">
      <div className="p-4 border-b border-slate-50 dark:border-zinc-800">
        <div className="h-9 bg-slate-200 dark:bg-zinc-800 rounded-lg w-64" />
      </div>
      <div className="p-6 space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center">
            <div className="w-10 h-10 bg-slate-200 dark:bg-zinc-800 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-1/3" />
              <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-1/4" />
            </div>
            <div className="w-20 h-6 bg-slate-200 dark:bg-zinc-800 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
};
