import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { PageHeader } from '../../components/shared/PageHeader';
import { ArrowLeft, Check, AlertCircle } from 'lucide-react';

export const MemberForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      gender: 'MALE',
      dateOfBirth: '',
      address: '',
      city: '',
      bloodGroup: '',
      emergencyName: '',
      emergencyPhone: '',
      emergencyRelation: '',
      medicalNotes: '',
      trainerId: '',
      branchId: '',
    },
  });

  // Fetch branches for branch picker
  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const response = await api.get('/branches');
      return response.data.data;
    },
  });

  // Fetch trainers for trainer picker
  const { data: trainers } = useQuery({
    queryKey: ['trainers'],
    queryFn: async () => {
      const response = await api.get('/trainers');
      return response.data.data;
    },
  });

  // Fetch member if is edit
  const { data: editData } = useQuery({
    queryKey: ['editMember', id],
    queryFn: async () => {
      const response = await api.get(`/members/${id}`);
      return response.data.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (editData) {
      reset({
        email: editData.user.email,
        password: '', // Password is not returned or editable via this form
        firstName: editData.user.firstName,
        lastName: editData.user.lastName,
        phone: editData.user.phone ?? '',
        gender: editData.gender ?? 'MALE',
        dateOfBirth: editData.dateOfBirth ? new Date(editData.dateOfBirth).toISOString().split('T')[0] : '',
        address: editData.address ?? '',
        city: editData.city ?? '',
        bloodGroup: editData.bloodGroup ?? '',
        emergencyName: editData.emergencyName ?? '',
        emergencyPhone: editData.emergencyPhone ?? '',
        emergencyRelation: editData.emergencyRelation ?? '',
        medicalNotes: editData.medicalNotes ?? '',
        trainerId: editData.trainerId ?? '',
        branchId: editData.branchId ?? '',
      });
    }
  }, [editData, reset]);

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEdit) {
        await api.put(`/members/${id}`, data);
      } else {
        await api.post('/members', data);
      }
    },
    onSuccess: () => {
      navigate('/members');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message ?? 'Failed to submit form data.');
    },
  });

  const onSubmit = (data: any) => {
    setError(null);
    // If edit mode and password is empty, remove it
    if (isEdit) {
      delete data.password;
    }
    submitMutation.mutate(data);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-2">
        <Link to="/members" className="p-1.5 rounded-lg border border-slate-100 text-slate-500 hover:bg-slate-50">
          <ArrowLeft size={16} />
        </Link>
        <PageHeader title={isEdit ? 'Edit Member' : 'New Member'} subtitle="Log member credentials and emergency information details" />
      </div>

      {error && (
        <div className="flex gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl p-6 shadow-premium">
        {/* Section 1 - Account credentials */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 border-b pb-2">1. Account Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                disabled={isEdit}
                {...register('email', { required: 'Required' })}
                className="w-full text-sm px-4 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl focus:outline-none"
              />
            </div>
            {!isEdit && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  {...register('password', { required: 'Required' })}
                  className="w-full text-sm px-4 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl focus:outline-none"
                  placeholder="Leave blank for default 'Member@123!'"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">First Name</label>
              <input
                type="text"
                {...register('firstName', { required: 'Required' })}
                className="w-full text-sm px-4 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Last Name</label>
              <input
                type="text"
                {...register('lastName', { required: 'Required' })}
                className="w-full text-sm px-4 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone</label>
              <input
                type="text"
                {...register('phone')}
                className="w-full text-sm px-4 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2 - Gym setup */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 border-b pb-2">2. Branch & Trainer Allocation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Branch</label>
              <select
                {...register('branchId', { required: 'Required' })}
                className="w-full text-sm px-4 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl focus:outline-none"
              >
                <option value="">Select branch...</option>
                {branches?.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Trainer</label>
              <select
                {...register('trainerId')}
                className="w-full text-sm px-4 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl focus:outline-none"
              >
                <option value="">Select trainer...</option>
                {trainers?.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.user.firstName} {t.user.lastName}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3 - Emergency & Medical Info */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 border-b pb-2">3. Emergency contact & medical notes</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Emergency Name</label>
              <input
                type="text"
                {...register('emergencyName')}
                className="w-full text-sm px-4 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Emergency Phone</label>
              <input
                type="text"
                {...register('emergencyPhone')}
                className="w-full text-sm px-4 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Relation</label>
              <input
                type="text"
                {...register('emergencyRelation')}
                className="w-full text-sm px-4 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl focus:outline-none"
              />
            </div>
            <div className="col-span-1 md:col-span-3 space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Medical Notes</label>
              <textarea
                {...register('medicalNotes')}
                rows={3}
                className="w-full text-sm px-4 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl focus:outline-none"
                placeholder="Log details here e.g. asthma, knee issues, heart problems..."
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t pt-6">
          <Link
            to="/members"
            className="px-5 py-2.5 border border-slate-100 rounded-xl text-sm font-semibold hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitMutation.isPending}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm"
          >
            <Check size={16} />
            {submitMutation.isPending ? 'Saving...' : 'Save Member'}
          </button>
        </div>
      </form>
    </div>
  );
};
export default MemberForm;
