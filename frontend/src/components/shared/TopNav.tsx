import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { Bell, MessageSquare, Search, ChevronDown, Check, Building } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TopNav: React.FC = () => {
  const { user, logout } = useAuth();
  const [gymDropdownOpen, setGymDropdownOpen] = useState(false);

  // Fetch gyms if super admin or has multiple branches
  const { data: gym } = useQuery({
    queryKey: ['activeGym', user?.gymId],
    queryFn: async () => {
      if (!user?.gymId) return null;
      const response = await api.get(`/gyms/${user.gymId}`);
      return response.data.data;
    },
    enabled: !!user?.gymId,
  });

  return (
    <header className="h-16 border-b border-slate-100 dark:border-zinc-900 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Search Input */}
      <div className="relative w-64 max-w-lg hidden md:block">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
          <Search size={16} />
        </span>
        <input
          type="text"
          placeholder="Search member, schedule, invoice..."
          className="w-full text-sm pl-9 pr-4 py-2 bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-slate-400 text-slate-700 dark:text-zinc-200"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4 ml-auto">
        {/* Gym Tenant Info / Selector */}
        {gym && (
          <div className="relative">
            <button
              onClick={() => setGymDropdownOpen(!gymDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-zinc-800 text-sm font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all"
            >
              <Building size={16} className="text-blue-500" />
              <span>{gym.name}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            {gymDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setGymDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-premium p-1.5 z-20">
                  <div className="px-2.5 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Current Tenant
                  </div>
                  <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800/60 text-sm text-left font-medium text-slate-800 dark:text-zinc-200">
                    <span className="truncate">{gym.name}</span>
                    <Check size={14} className="text-green-500 flex-shrink-0" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Messages Shortcut */}
        <Link
          to="/messages"
          className="p-2 rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-900 hover:text-slate-600 dark:hover:text-zinc-200 transition-all relative"
        >
          <MessageSquare size={18} />
        </Link>

        {/* Notifications Alert */}
        <Link
          to="/notifications"
          className="p-2 rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-900 hover:text-slate-600 dark:hover:text-zinc-200 transition-all relative"
        >
          <Bell size={18} />
        </Link>

        {/* User Quick Info */}
        <div className="w-px h-6 bg-slate-100 dark:bg-zinc-800" />

        {user && (
          <Link to="/settings" className="flex items-center gap-2">
            <img
              src={user.avatar ?? `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.firstName}`}
              alt="Profile"
              className="w-8 h-8 rounded-full border border-slate-100 dark:border-zinc-800 object-cover"
            />
          </Link>
        )}
      </div>
    </header>
  );
};
