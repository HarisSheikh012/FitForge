import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable } from '../../components/shared/DataTable';
import { CheckCircle, LogOut, Search, Clock, QrCode } from 'lucide-react';

export const Attendance: React.FC = () => {
  const queryClient = useQueryClient();
  const [memberIdInput, setMemberIdInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Fetch today's checkins & stats
  const { data: todayData, isLoading: todayLoading } = useQuery({
    queryKey: ['attendanceToday'],
    queryFn: async () => {
      const response = await api.get('/attendance/today');
      return response.data.data;
    },
  });

  const checkInMutation = useMutation({
    mutationFn: async () => {
      await api.post('/attendance/check-in', { memberId: memberIdInput, method: 'MANUAL' });
    },
    onSuccess: () => {
      setMemberIdInput('');
      queryClient.invalidateQueries({ queryKey: ['attendanceToday'] });
      alert('Member checked in successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message ?? 'Check-in failed');
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await api.post('/attendance/check-out', { memberId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendanceToday'] });
      alert('Member checked out successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message ?? 'Check-out failed');
    },
  });

  const handleManualCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberIdInput) return;
    checkInMutation.mutate();
  };

  const columns = [
    {
      header: 'Member',
      accessor: (row: any) => (
        <div className="flex items-center gap-2.5">
          <img
            src={row.member?.user.avatar ?? `https://api.dicebear.com/7.x/adventurer/svg?seed=${row.member?.user.firstName}`}
            alt="avatar"
            className="w-8 h-8 rounded-full object-cover"
          />
          <span className="font-semibold text-slate-800 dark:text-zinc-200">
            {row.member?.user.firstName} {row.member?.user.lastName}
          </span>
        </div>
      ),
    },
    {
      header: 'Check In Time',
      accessor: (row: any) => (
        <span className="flex items-center gap-1.5 text-slate-500 font-semibold">
          <Clock size={14} />
          {new Date(row.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      header: 'Check Out Time',
      accessor: (row: any) =>
        row.checkOut ? (
          <span className="flex items-center gap-1.5 text-slate-500 font-semibold">
            <Clock size={14} />
            {new Date(row.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        ) : (
          <span className="text-amber-500 font-bold">Checked In</span>
        ),
    },
    {
      header: 'Method',
      accessor: 'method',
    },
    {
      header: 'Action',
      accessor: (row: any) =>
        row.status === 'CHECKED_IN' ? (
          <button
            onClick={() => checkOutMutation.mutate(row.memberId)}
            className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold transition-all"
          >
            <LogOut size={12} />
            Check Out
          </button>
        ) : (
          <span className="text-emerald-500 font-bold text-xs flex items-center gap-1">
            <CheckCircle size={14} /> Checked Out
          </span>
        ),
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      <PageHeader title="Attendance Logs" subtitle="Track member check-ins, check-outs, and scan records" />

      {/* Manual Check-in Form widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Active stats display */}
          {todayData?.stats && (
            <div className="grid grid-cols-3 gap-6 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl p-6 shadow-premium text-center">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Check-Ins</p>
                <h4 className="text-2xl font-black text-slate-800 dark:text-zinc-100 mt-1">{todayData.stats.totalCheckIns}</h4>
              </div>
              <div className="border-x">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Currently In</p>
                <h4 className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{todayData.stats.currentlyIn}</h4>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Checked Out</p>
                <h4 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{todayData.stats.checkedOut}</h4>
              </div>
            </div>
          )}

          {/* Today's checkins grid */}
          <DataTable
            columns={columns}
            data={todayData?.records ?? []}
            loading={todayLoading}
            searchPlaceholder="Search logged check-ins..."
          />
        </div>

        {/* Manual desk scanner check-in panel */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl p-6 shadow-premium space-y-6">
            <div className="flex items-center gap-2.5">
              <QrCode className="text-blue-500" />
              <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-lg">Desk Check-In</h3>
            </div>

            <form onSubmit={handleManualCheckIn} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Member Database ID
                </label>
                <input
                  type="text"
                  value={memberIdInput}
                  onChange={(e) => setMemberIdInput(e.target.value)}
                  placeholder="e.g. member UUID or member number"
                  className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={checkInMutation.isPending}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all"
              >
                {checkInMutation.isPending ? 'Checking in...' : 'Perform Check-In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Attendance;
