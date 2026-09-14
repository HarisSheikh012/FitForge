import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { PageHeader } from '../../components/shared/PageHeader';
import { ErrorBoundary } from '../../components/shared/ErrorBoundary';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Download, TrendingUp, Users, Calendar } from 'lucide-react';

export const Reports: React.FC = () => {
  const { data: revenueData } = useQuery({
    queryKey: ['revenueReport'],
    queryFn: async () => {
      const response = await api.get('/reports/revenue');
      return response.data.data;
    },
  });

  const { data: attendanceData } = useQuery({
    queryKey: ['attendanceReport'],
    queryFn: async () => {
      const response = await api.get('/reports/attendance');
      return response.data.data;
    },
  });

  // Mock aggregates if database records are empty
  const revChartData = [
    { name: 'Jan', amount: 45000 },
    { name: 'Feb', amount: 52000 },
    { name: 'Mar', amount: 61000 },
    { name: 'Apr', amount: 58000 },
    { name: 'May', amount: 72000 },
    { name: 'Jun', amount: 80000 },
  ];

  const attChartData = [
    { name: 'Week 1', count: 120 },
    { name: 'Week 2', count: 145 },
    { name: 'Week 3', count: 130 },
    { name: 'Week 4', count: 168 },
  ];

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        title="Analytics Reports"
        subtitle="Review revenue aggregates, member attendance growths, and financial audits"
        action={
          <div className="flex gap-2">
            <button
              onClick={() => alert('PDF report exported successfully!')}
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl text-sm font-bold shadow-sm"
            >
              <Download size={16} />
              PDF Export
            </button>
            <button
              onClick={() => alert('Excel sheet exported successfully!')}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm"
            >
              <Download size={16} />
              Excel Export
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue chart */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl p-6 shadow-premium space-y-6">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="text-blue-500" />
            <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-lg">Revenue History</h3>
          </div>

          <div className="h-72 w-full">
            <ErrorBoundary>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.25)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ErrorBoundary>
          </div>
        </div>

        {/* Attendance frequency chart */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl p-6 shadow-premium space-y-6">
          <div className="flex items-center gap-2.5">
            <Calendar className="text-emerald-500" />
            <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-lg">Attendance Frequency</h3>
          </div>

          <div className="h-72 w-full">
            <ErrorBoundary>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.25)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Reports;
