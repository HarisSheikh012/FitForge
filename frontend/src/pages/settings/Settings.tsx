import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { PageHeader } from '../../components/shared/PageHeader';
import { Shield, Sparkles, Building, Settings as ConfigIcon } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'gym' | 'billing'>('gym');

  // Fetch current SaaS subscription
  const { data: sub } = useQuery({
    queryKey: ['saasSubscription'],
    queryFn: async () => {
      const response = await api.get('/subscriptions');
      return response.data.data;
    },
    enabled: user?.role === 'GYM_OWNER',
  });

  const upgradeMutation = useMutation({
    mutationFn: async (planId: string) => {
      await api.post('/subscriptions/upgrade', { planId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saasSubscription'] });
      alert('SaaS subscription plan updated successfully (sandbox session)!');
    },
  });

  return (
    <div className="space-y-6 pb-12">
      <PageHeader title="Workspace Settings" subtitle="Configure system parameters, currencies, branding, and billing plans" />

      <div className="flex gap-4 border-b pb-1">
        <button
          onClick={() => setActiveTab('gym')}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === 'gym'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          General Settings
        </button>
        {user?.role === 'GYM_OWNER' && (
          <button
            onClick={() => setActiveTab('billing')}
            className={`pb-3 text-sm font-bold transition-all relative ${
              activeTab === 'billing'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Billing & Subscriptions
          </button>
        )}
      </div>

      {activeTab === 'gym' ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl p-6 shadow-premium space-y-6 max-w-2xl">
          <div className="flex items-center gap-2.5">
            <Building className="text-blue-500" />
            <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-lg">Gym Settings</h3>
          </div>

          <div className="space-y-4 text-sm font-semibold text-slate-600 dark:text-zinc-400">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400">User Role</p>
                <p className="text-slate-700 dark:text-zinc-300 mt-1 capitalize">{user?.role.toLowerCase()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Security Email</p>
                <p className="text-slate-700 dark:text-zinc-300 mt-1">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 max-w-4xl">
          {/* Active plan billing banner */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl p-6 shadow-premium space-y-4">
            <div className="flex items-center gap-2.5">
              <Sparkles className="text-blue-500" />
              <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-lg">Billing Plan Status</h3>
            </div>
            {sub ? (
              <div className="text-sm font-semibold text-slate-600 dark:text-zinc-400 space-y-2">
                <p>
                  Active Plan:{' '}
                  <span className="text-blue-600 font-bold uppercase">{sub.plan?.name ?? 'Free Trial'}</span>
                </p>
                <p>Status: <span className="text-emerald-500 font-bold">{sub.status}</span></p>
                <p>Billing Cycle Ends: {new Date(sub.currentPeriodEnd).toLocaleDateString()}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No active SaaS subscription found.</p>
            )}
          </div>

          {/* SaaS upgrade options list */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border rounded-2xl p-6 shadow-premium flex flex-col justify-between h-64">
              <div>
                <h4 className="font-bold text-slate-700">Basic Tier</h4>
                <p className="text-xs text-slate-400 mt-1">For single branch small clubs</p>
                <p className="text-2xl font-black text-slate-800 mt-3">Rs. 4,999<span className="text-xs font-semibold text-slate-400">/mo</span></p>
              </div>
              <button
                onClick={() => upgradeMutation.mutate('saas-plan-basic')}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                Select Basic
              </button>
            </div>

            <div className="bg-white border-2 border-blue-500 rounded-2xl p-6 shadow-premium flex flex-col justify-between h-64 relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                Recommended
              </span>
              <div>
                <h4 className="font-bold text-slate-700">Pro Gym</h4>
                <p className="text-xs text-slate-400 mt-1">Multi-branch mid-tier setups</p>
                <p className="text-2xl font-black text-slate-800 mt-3">Rs. 9,999<span className="text-xs font-semibold text-slate-400">/mo</span></p>
              </div>
              <button
                onClick={() => upgradeMutation.mutate('saas-plan-pro')}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                Select Pro
              </button>
            </div>

            <div className="bg-white border rounded-2xl p-6 shadow-premium flex flex-col justify-between h-64">
              <div>
                <h4 className="font-bold text-slate-700">Enterprise</h4>
                <p className="text-xs text-slate-400 mt-1">Unlimited branches & members</p>
                <p className="text-2xl font-black text-slate-800 mt-3">Custom pricing</p>
              </div>
              <button
                onClick={() => alert('Please contact sales for custom enterprise allocations.')}
                className="w-full py-2 border border-slate-100 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Settings;
