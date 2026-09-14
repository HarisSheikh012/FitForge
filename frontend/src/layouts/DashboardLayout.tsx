import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/shared/Sidebar';
import { TopNav } from '../components/shared/TopNav';

export const DashboardLayout: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-400">Loading system...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-zinc-950/40">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Panel */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top bar header */}
        <TopNav />

        {/* Content body wrapper */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default DashboardLayout;
