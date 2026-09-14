import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { PageHeader } from '../../components/shared/PageHeader';
import { QRCodeSVG } from 'qrcode.react';
import {
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  HeartPulse,
  Award,
  ArrowLeft,
  FileText,
  History,
  TrendingUp,
  Snowflake
} from 'lucide-react';

export const MemberDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [freezeDays, setFreezeDays] = useState(30);
  const [showFreezeModal, setShowFreezeModal] = useState(false);

  const { data: member, isLoading } = useQuery({
    queryKey: ['memberDetails', id],
    queryFn: async () => {
      const response = await api.get(`/members/${id}`);
      return response.data.data;
    },
  });

  const freezeMutation = useMutation({
    mutationFn: async () => {
      const freezeUntil = new Date(Date.now() + freezeDays * 24 * 60 * 60 * 1000);
      await api.post(`/members/${id}/freeze`, { freezeUntil });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberDetails', id] });
      setShowFreezeModal(false);
      alert('Membership frozen successfully!');
    },
  });

  if (isLoading) {
    return <div className="text-center py-12">Loading details...</div>;
  }

  if (!member) {
    return <div className="text-center py-12 text-slate-500">Member not found.</div>;
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-2">
        <Link to="/members" className="p-1.5 rounded-lg border border-slate-100 text-slate-500 hover:bg-slate-50">
          <ArrowLeft size={16} />
        </Link>
        <PageHeader title={`${member.user.firstName} ${member.user.lastName}`} subtitle={`ID: ${member.memberId}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Card and QR Code */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl p-6 shadow-premium text-center space-y-4">
            <img
              src={member.user.avatar ?? `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.user.firstName}`}
              alt="Avatar"
              className="w-24 h-24 rounded-full mx-auto object-cover border border-slate-100"
            />
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-zinc-100">
                {member.user.firstName} {member.user.lastName}
              </h3>
              <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase mt-0.5 tracking-wider">
                Member Profile
              </p>
            </div>

            <div className="pt-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  member.membershipStatus === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                    : member.membershipStatus === 'FROZEN'
                    ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {member.membershipStatus}
              </span>
            </div>

            {/* Check-In QR Code */}
            <div className="bg-slate-50 dark:bg-zinc-800/40 p-6 rounded-xl border border-slate-50 dark:border-zinc-800 flex flex-col items-center justify-center space-y-3">
              <div className="bg-white p-2 rounded-lg">
                <QRCodeSVG
                  value={JSON.stringify({ memberId: member.memberId, gymId: member.gymId, type: 'checkin' })}
                  size={140}
                />
              </div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                Scan QR at front desk to check-in
              </span>
            </div>

            {member.membershipStatus === 'ACTIVE' && (
              <button
                onClick={() => setShowFreezeModal(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold transition-colors"
              >
                <Snowflake size={16} />
                Freeze Membership
              </button>
            )}
          </div>
        </div>

        {/* Right Columns (2/3 width on desktop) */}
        <div className="lg:col-span-2 space-y-8">
          {/* General Information Card */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl p-6 shadow-premium space-y-6">
            <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-lg flex items-center gap-2">
              <User size={18} className="text-blue-500" />
              General Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-slate-400" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</p>
                  <p className="font-semibold text-slate-700 dark:text-zinc-300">{member.user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone size={16} className="text-slate-400" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone</p>
                  <p className="font-semibold text-slate-700 dark:text-zinc-300">{member.user.phone ?? '-'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-slate-400" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date of Birth</p>
                  <p className="font-semibold text-slate-700 dark:text-zinc-300">
                    {member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString() : '-'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-slate-400" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Address</p>
                  <p className="font-semibold text-slate-700 dark:text-zinc-300">
                    {member.address ? `${member.address}, ${member.city ?? ''}` : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency / Medical Details Card */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl p-6 shadow-premium space-y-6">
            <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-lg flex items-center gap-2">
              <HeartPulse size={18} className="text-red-500" />
              Emergency & Medical Info
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Emergency Contact</p>
                <p className="font-semibold text-slate-700 dark:text-zinc-300 mt-0.5">
                  {member.emergencyName ? `${member.emergencyName} (${member.emergencyRelation ?? 'Other'})` : '-'}
                </p>
                {member.emergencyPhone && (
                  <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">{member.emergencyPhone}</p>
                )}
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Blood Group</p>
                <p className="font-semibold text-slate-700 dark:text-zinc-300 mt-0.5">{member.bloodGroup ?? '-'}</p>
              </div>

              <div className="col-span-1 md:col-span-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Medical Notes</p>
                <p className="text-slate-600 dark:text-zinc-400 mt-1.5 p-3.5 bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-slate-50 dark:border-zinc-800/40">
                  {member.medicalNotes ?? 'No medical notes logged.'}
                </p>
              </div>
            </div>
          </div>

          {/* Assigned Trainer */}
          {member.trainer && (
            <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl p-6 shadow-premium space-y-6">
              <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-lg flex items-center gap-2">
                <Award size={18} className="text-purple-500" />
                Assigned Trainer
              </h3>
              <div className="flex items-center gap-3">
                <img
                  src={member.trainer.user.avatar ?? `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.trainer.user.firstName}`}
                  alt="trainer avatar"
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h4 className="text-sm font-bold text-slate-700 dark:text-zinc-200">
                    {member.trainer.user.firstName} {member.trainer.user.lastName}
                  </h4>
                  <p className="text-xs text-slate-400 dark:text-zinc-500">
                    {member.trainer.specializations.join(', ')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Freeze Modal Dialog Box */}
      {showFreezeModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 max-w-md w-full rounded-2xl p-6 shadow-premium space-y-5">
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-zinc-100">Freeze Membership</h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
                Enter the number of days you wish to freeze this membership plan.
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                Freeze Duration (Days)
              </label>
              <input
                type="number"
                value={freezeDays}
                onChange={(e) => setFreezeDays(parseInt(e.target.value, 10))}
                className="w-full text-sm px-4 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setShowFreezeModal(false)}
                className="px-4 py-2 border border-slate-100 rounded-xl text-sm font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => freezeMutation.mutate()}
                disabled={freezeMutation.isPending}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold shadow-sm"
              >
                {freezeMutation.isPending ? 'Freezing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default MemberDetails;
