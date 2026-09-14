import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { PageHeader } from '../../components/shared/PageHeader';
import { Plus, Tag, Check, Award } from 'lucide-react';

export const MembershipPlans: React.FC = () => {
  const queryClient = useQueryClient();
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);

  // Form states for custom plan creation
  const [name, setName] = useState('');
  const [durationDays, setDurationDays] = useState('30');
  const [price, setPrice] = useState('');
  const [features, setFeatures] = useState('');

  // Form states for selling membership plan
  const [memberId, setMemberId] = useState('');
  const [planId, setPlanId] = useState('');
  const [couponCode, setCouponCode] = useState('');

  // Fetch plans
  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const response = await api.get('/memberships/plans');
      return response.data.data;
    },
  });

  // Fetch members for subscription allocation picker
  const { data: members } = useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const response = await api.get('/members', { params: { limit: 100 } });
      return response.data.data;
    },
  });

  const createPlanMutation = useMutation({
    mutationFn: async () => {
      await api.post('/memberships/plans', {
        name,
        durationDays,
        price,
        features: features.split(',').map((f) => f.trim()),
      });
    },
    onSuccess: () => {
      setShowPlanModal(false);
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      setName('');
      setPrice('');
      setFeatures('');
      alert('Membership plan created successfully!');
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      await api.post('/memberships/subscribe', { memberId, planId, couponCode });
    },
    onSuccess: () => {
      setShowSubscribeModal(false);
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setMemberId('');
      setPlanId('');
      setCouponCode('');
      alert('Subscription purchased successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message ?? 'Subscription allocation failed.');
    },
  });

  const handleCreatePlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;
    createPlanMutation.mutate();
  };

  const handleSubscribeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId || !planId) return;
    subscribeMutation.mutate();
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Membership Plans"
        subtitle="Manage custom tier prices, plan durations, features, and active promotions"
        action={
          <div className="flex gap-2">
            <button
              onClick={() => setShowSubscribeModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl text-sm font-bold shadow-sm"
            >
              <Tag size={16} className="text-blue-500" />
              Sell Membership
            </button>
            <button
              onClick={() => setShowPlanModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm"
            >
              <Plus size={16} />
              New Plan
            </button>
          </div>
        }
      />

      {isLoading ? (
        <div className="text-center py-12">Loading plans...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans?.map((plan: any) => (
            <div
              key={plan.id}
              className={`bg-white dark:bg-zinc-900 border rounded-2xl p-6 shadow-premium space-y-6 flex flex-col justify-between relative overflow-hidden ${
                plan.isFeatured ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-100 dark:border-zinc-800'
              }`}
            >
              {plan.isFeatured && (
                <span className="absolute top-3 right-3 bg-blue-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <Award size={10} /> Popular
                </span>
              )}

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">{plan.name}</h4>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-800 dark:text-zinc-100">
                    Rs. {plan.price.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">/ {plan.durationDays} days</span>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs font-semibold text-slate-500 dark:text-zinc-400">
                {plan.features.map((feature: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* New Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 max-w-md w-full rounded-2xl p-6 shadow-premium space-y-5">
            <h3 className="font-bold text-lg text-slate-800 dark:text-zinc-100">Create Membership Plan</h3>

            <form onSubmit={handleCreatePlanSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Plan Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Yearly Premium"
                  className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Duration (Days)</label>
                <select
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none"
                >
                  <option value="30">Monthly (30 Days)</option>
                  <option value="90">Quarterly (90 Days)</option>
                  <option value="180">Half Yearly (180 Days)</option>
                  <option value="365">Yearly (365 Days)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Price (PKR)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Features (Comma separated)</label>
                <textarea
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  placeholder="Full access, Lockers, Towels..."
                  rows={3}
                  className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="px-4 py-2 border border-slate-100 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createPlanMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm"
                >
                  {createPlanMutation.isPending ? 'Creating...' : 'Save Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sell Membership Modal */}
      {showSubscribeModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 max-w-md w-full rounded-2xl p-6 shadow-premium space-y-5">
            <h3 className="font-bold text-lg text-slate-800 dark:text-zinc-100">Sell Membership / Subscribe</h3>

            <form onSubmit={handleSubscribeSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Member</label>
                <select
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none"
                >
                  <option value="">Choose member...</option>
                  {members?.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.user.firstName} {m.user.lastName} ({m.memberId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Plan</label>
                <select
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none"
                >
                  <option value="">Choose plan...</option>
                  {plans?.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name} (Rs. {p.price})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Coupon Code (Optional)</label>
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="e.g. WELCOME20"
                  className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowSubscribeModal(false)}
                  className="px-4 py-2 border border-slate-100 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={subscribeMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm"
                >
                  {subscribeMutation.isPending ? 'Activating...' : 'Confirm Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default MembershipPlans;
