import React from 'react';
import { Navigate, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AuthLayout: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-zinc-950/20">
      {/* Visual Brand Side */}
      <div className="hidden md:flex md:w-1/2 bg-blue-600 dark:bg-blue-950/40 p-12 flex-col justify-between text-white relative overflow-hidden">
        {/* Subtle glowing elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center font-bold text-lg backdrop-blur-md">
            F
          </div>
          <span className="font-bold text-xl tracking-tight">FitForge</span>
        </div>

        <div className="space-y-6 relative z-10 max-w-lg">
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight">
            Streamline your gym operations with style.
          </h2>
          <p className="text-blue-100 font-medium">
            Manage members, schedules, trainer shifts, class capacities, invoices, and attendance logs through a beautiful workspace.
          </p>
        </div>

        <div className="text-xs text-blue-200/80 relative z-10 font-semibold">
          © {new Date().getFullYear()} FitForge. All rights reserved.
        </div>
      </div>

      {/* Form Page Side */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-8 rounded-3xl shadow-premium">
          {/* Logo showing only on mobile */}
          <div className="flex items-center gap-3 mb-6 md:hidden">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
              F
            </div>
            <span className="font-bold text-lg text-slate-800 dark:text-zinc-100">FitForge</span>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  );
};
export default AuthLayout;
