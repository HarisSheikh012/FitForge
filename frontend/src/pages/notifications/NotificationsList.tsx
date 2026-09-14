import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { PageHeader } from '../../components/shared/PageHeader';
import { Bell, Check, Clock } from 'lucide-react';

export const NotificationsList: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/notifications');
      return response.data.data;
    },
  });

  const readMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return (
    <div className="space-y-6 pb-12 max-w-3xl">
      <PageHeader title="Notifications" subtitle="Stay updated with alerts, schedules shifts, and billing warnings" />

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading notifications...</div>
      ) : notifications?.length === 0 ? (
        <div className="bg-white border rounded-2xl p-8 text-center text-slate-400 font-semibold shadow-premium">
          No notifications found.
        </div>
      ) : (
        <div className="space-y-4">
          {notifications?.map((notif: any) => (
            <div
              key={notif.id}
              className={`bg-white dark:bg-zinc-900 border rounded-2xl p-5 shadow-premium flex gap-4 items-start transition-all relative ${
                notif.status === 'PENDING'
                  ? 'border-blue-100 dark:border-blue-900 bg-blue-50/10 dark:bg-blue-950/5'
                  : 'border-slate-100 dark:border-zinc-800'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-blue-50/50 dark:bg-zinc-800 text-blue-500 flex-shrink-0">
                <Bell size={18} />
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start gap-4">
                  <h4 className={`text-sm font-bold ${notif.status === 'PENDING' ? 'text-slate-800 dark:text-zinc-100' : 'text-slate-600 dark:text-zinc-300'}`}>
                    {notif.title}
                  </h4>
                  {notif.status === 'PENDING' && (
                    <button
                      onClick={() => readMutation.mutate(notif.id)}
                      className="p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600"
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 leading-relaxed">{notif.body}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-zinc-500 pt-1 font-bold">
                  <Clock size={10} />
                  <span>{new Date(notif.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default NotificationsList;
