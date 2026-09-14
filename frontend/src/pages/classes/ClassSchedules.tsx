import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { PageHeader } from '../../components/shared/PageHeader';
import { Calendar, Plus, Clock, Users, ShieldAlert } from 'lucide-react';

export const ClassSchedules: React.FC = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [classId, setClassId] = useState('');
  const [trainerId, setTrainerId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Fetch classes
  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await api.get('/classes');
      return response.data.data;
    },
  });

  // Fetch trainers
  const { data: trainers } = useQuery({
    queryKey: ['trainers'],
    queryFn: async () => {
      const response = await api.get('/trainers');
      return response.data.data;
    },
  });

  // Fetch schedules
  const { data: schedules, isLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: async () => {
      const response = await api.get('/classes/schedules');
      return response.data.data;
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: async () => {
      await api.post('/classes/schedules', { classId, trainerId, startTime, endTime });
    },
    onSuccess: () => {
      setShowModal(false);
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      alert('Class schedule slot added successfully!');
    },
  });

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId || !trainerId || !startTime || !endTime) return;
    scheduleMutation.mutate();
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Class Schedules"
        subtitle="Manage operating classes, slots capacity limits, and schedules bookings"
        action={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm"
          >
            <Plus size={16} />
            Schedule Class
          </button>
        }
      />

      {isLoading ? (
        <div className="text-center py-12">Loading class schedules...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules?.map((slot: any) => (
            <div key={slot.id} className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl p-6 shadow-premium space-y-4">
              <div className="flex justify-between items-start">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400">
                  {slot.class.category}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  Level: {slot.class.level}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-base">{slot.class.name}</h3>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1 line-clamp-2">
                  {slot.class.description}
                </p>
              </div>

              <div className="space-y-2 text-xs font-semibold text-slate-500 dark:text-zinc-400 border-t pt-3">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-slate-400" />
                  <span>
                    {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                    {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400" />
                  <span>{new Date(slot.startTime).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-slate-400" />
                  <span>
                    Booked: {slot.booked} / {slot.class.capacity} (Waitlist: {slot.waitlisted})
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Slot Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 max-w-md w-full rounded-2xl p-6 shadow-premium space-y-5">
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-zinc-100">Schedule Class Slot</h3>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Class</label>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl focus:outline-none"
                >
                  <option value="">Choose...</option>
                  {classes?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Instructor</label>
                <select
                  value={trainerId}
                  onChange={(e) => setTrainerId(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl focus:outline-none"
                >
                  <option value="">Choose...</option>
                  {trainers?.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.user.firstName} {t.user.lastName}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Start Date & Time</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">End Date & Time</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-100 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduleMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm"
                >
                  {scheduleMutation.isPending ? 'Scheduling...' : 'Save Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default ClassSchedules;
