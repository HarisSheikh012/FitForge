import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Layers,
  Settings,
  LogOut,
  Bell,
  MessageSquare,
  Shield,
  Activity,
  CreditCard,
  Menu,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  ClipboardList,
  Wrench,
  BarChart3
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  // Fetch unread notifications
  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/notifications');
      return response.data.data;
    },
    refetchInterval: 30000,
    enabled: !!user,
  });

  const unreadCount = notifications?.filter((n: any) => n.status === 'PENDING').length ?? 0;

  const getMenuItems = () => {
    const items = [
      {
        path: '/',
        label: 'Dashboard',
        icon: LayoutDashboard,
        roles: ['SUPER_ADMIN', 'GYM_OWNER', 'STAFF', 'TRAINER', 'MEMBER'],
      },
      {
        path: '/members',
        label: 'Members',
        icon: Users,
        roles: ['SUPER_ADMIN', 'GYM_OWNER', 'STAFF', 'TRAINER'],
      },
      {
        path: '/trainers',
        label: 'Trainers',
        icon: Activity,
        roles: ['SUPER_ADMIN', 'GYM_OWNER', 'STAFF'],
      },
      {
        path: '/staff',
        label: 'Staff',
        icon: Shield,
        roles: ['SUPER_ADMIN', 'GYM_OWNER'],
      },
      {
        path: '/attendance',
        label: 'Attendance',
        icon: ClipboardList,
        roles: ['SUPER_ADMIN', 'GYM_OWNER', 'STAFF', 'TRAINER', 'MEMBER'],
      },
      {
        path: '/classes',
        label: 'Classes & Schedules',
        icon: Calendar,
        roles: ['SUPER_ADMIN', 'GYM_OWNER', 'STAFF', 'TRAINER', 'MEMBER'],
      },
      {
        path: '/plans',
        label: 'Membership Plans',
        icon: Layers,
        roles: ['SUPER_ADMIN', 'GYM_OWNER', 'STAFF'],
      },
      {
        path: '/payments',
        label: 'Payments & Billing',
        icon: CreditCard,
        roles: ['SUPER_ADMIN', 'GYM_OWNER', 'STAFF', 'MEMBER'],
      },
      {
        path: '/equipment',
        label: 'Equipment',
        icon: Wrench,
        roles: ['SUPER_ADMIN', 'GYM_OWNER', 'STAFF'],
      },
      {
        path: '/reports',
        label: 'Analytics Reports',
        icon: BarChart3,
        roles: ['SUPER_ADMIN', 'GYM_OWNER', 'STAFF'],
      },
    ];

    return items.filter((item) => item.roles.includes(user?.role ?? ''));
  };

  const menuItems = getMenuItems();

  return (
    <aside
      className={`h-screen border-r border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col justify-between transition-all duration-300 relative z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Header */}
      <div>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-50 dark:border-zinc-900">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
              F
            </div>
            {!collapsed && (
              <span className="font-bold text-lg text-slate-800 dark:text-zinc-100 tracking-tight">
                FitForge
              </span>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-md text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-900 hover:text-slate-600"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Menu Items */}
        <div className="px-3 py-4 space-y-6">
          <div>
            {!collapsed && (
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-3 block mb-2">
                Menu
              </span>
            )}
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                          : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900/50 hover:text-slate-700 dark:hover:text-zinc-200'
                      }`
                    }
                  >
                    <item.icon size={18} />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            {!collapsed && (
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-3 block mb-2">
                Personal
              </span>
            )}
            <ul className="space-y-1">
              <li>
                <NavLink
                  to="/notifications"
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                        : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900/50 hover:text-slate-700 dark:hover:text-zinc-200'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Bell size={18} />
                    {!collapsed && <span>Notifications</span>}
                  </div>
                  {!collapsed && unreadCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/settings"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                        : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900/50 hover:text-slate-700 dark:hover:text-zinc-200'
                    }`
                  }
                >
                  <Settings size={18} />
                  {!collapsed && <span>Settings</span>}
                </NavLink>
              </li>

              <li>
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900/50 hover:text-slate-700 dark:hover:text-zinc-200 transition-all"
                >
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                  {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
                </button>
              </li>

              <li>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/10 transition-all"
                >
                  <LogOut size={18} />
                  {!collapsed && <span>Logout</span>}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* User Footer Profile */}
      {user && (
        <div className="p-4 border-t border-slate-50 dark:border-zinc-900 flex items-center gap-3 overflow-hidden">
          <img
            src={user.avatar ?? `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.firstName}`}
            alt="Avatar"
            className="w-10 h-10 rounded-full border border-slate-100 dark:border-zinc-800 object-cover flex-shrink-0"
          />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200 truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[10px] font-medium text-slate-400 capitalize dark:text-zinc-500 truncate">
                {user.role.replace('_', ' ').toLowerCase()}
              </p>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
