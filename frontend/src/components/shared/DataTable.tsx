import React from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onSearch?: (term: string) => void;
  searchPlaceholder?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange?: (page: number) => void;
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  onSearch,
  searchPlaceholder = 'Search...',
  meta,
  onPageChange,
}: DataTableProps<T>) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl shadow-premium overflow-hidden transition-all duration-300">
      {/* Top Search bar */}
      {onSearch && (
        <div className="p-4 border-b border-slate-50 dark:border-zinc-800 flex items-center relative">
          <span className="absolute left-7 text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder={searchPlaceholder}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full max-w-sm pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-400 text-slate-700 dark:text-zinc-200"
          />
        </div>
      )}

      {/* Table grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-zinc-800/20 border-b border-slate-50 dark:border-zinc-800">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-6 py-4.5 text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider ${
                    col.className ?? ''
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-zinc-800/60">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-blue-500 animate-spin" />
                    <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500">
                      Loading data...
                    </span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-400 dark:text-zinc-500 text-sm">
                  No records found.
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="hover:bg-slate-50/40 dark:hover:bg-zinc-800/10 transition-colors"
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className={`px-6 py-4.5 text-sm text-slate-700 dark:text-zinc-300 font-medium ${
                        col.className ?? ''
                      }`}
                    >
                      {typeof col.accessor === 'function'
                        ? col.accessor(row)
                        : (row[col.accessor] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {meta && onPageChange && meta.totalPages > 1 && (
        <div className="p-4 border-t border-slate-50 dark:border-zinc-800/60 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500">
            Showing {data.length} of {meta.total} entries
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(meta.page - 1)}
              disabled={meta.page === 1}
              className="p-1.5 rounded-lg border border-slate-100 dark:border-zinc-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-800/80 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-slate-600 dark:text-zinc-300 px-3">
              {meta.page} / {meta.totalPages}
            </span>
            <button
              onClick={() => onPageChange(meta.page + 1)}
              disabled={meta.page === meta.totalPages}
              className="p-1.5 rounded-lg border border-slate-100 dark:border-zinc-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-800/80 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
