import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Lock, User, AlertCircle, ArrowRight, Phone } from 'lucide-react';
import { api } from '../../lib/axios';

export const Register: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      role: 'MEMBER', // Public registration is strictly for normal gym members
    },
  });

  const onSubmit = async (data: any) => {
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/register', data);
      setSuccess(true);
    } catch (err: any) {
      const apiErrors = err.response?.data?.errors;
      if (Array.isArray(apiErrors) && apiErrors.length > 0) {
        setError(apiErrors.map((e: any) => e.message).join('. '));
      } else {
        setError(err.response?.data?.message ?? 'Registration failed. Please check details.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500 font-bold text-xl">
          ✓
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-100">Account Created Successfully!</h3>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          Your account is active and ready to use. Click below to sign in to your dashboard.
        </p>
        <div className="pt-4">
          <a
            href="/login"
            className="inline-block py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors"
          >
            Sign In Now
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-100">Member Registration</h3>
        <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 mt-1">
          Create your gym member account
        </p>
      </div>

      {error && (
        <div className="flex gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl text-red-600 text-xs font-semibold">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              First name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <User size={16} />
              </span>
              <input
                type="text"
                {...register('firstName', { required: 'Required' })}
                className="w-full text-sm pl-9 pr-4 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-400 text-slate-700"
                placeholder="Ahmed"
              />
            </div>
            {errors.firstName && (
              <p className="text-red-500 text-[10px] font-semibold">{errors.firstName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Last name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <User size={16} />
              </span>
              <input
                type="text"
                {...register('lastName', { required: 'Required' })}
                className="w-full text-sm pl-9 pr-4 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-400 text-slate-700"
                placeholder="Khan"
              />
            </div>
            {errors.lastName && (
              <p className="text-red-500 text-[10px] font-semibold">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            Email Address
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Mail size={16} />
            </span>
            <input
              type="email"
              {...register('email', { required: 'Email address is required' })}
              className="w-full text-sm pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-400 text-slate-700"
              placeholder="owner@yourgym.com"
            />
          </div>
          {errors.email && (
            <p className="text-red-500 text-xs font-semibold mt-1">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            Phone Number
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Phone size={16} />
            </span>
            <input
              type="text"
              {...register('phone')}
              className="w-full text-sm pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-400 text-slate-700"
              placeholder="+92-300-1234567"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Lock size={16} />
            </span>
            <input
              type="password"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'Minimum 8 characters' },
                validate: {
                  hasUpper: (v: string) => /[A-Z]/.test(v) || 'Must contain at least 1 uppercase letter',
                  hasNumber: (v: string) => /[0-9]/.test(v) || 'Must contain at least 1 number',
                  hasSpecial: (v: string) => /[^A-Za-z0-9]/.test(v) || 'Must contain at least 1 special character (!@#$%^&*)',
                },
              })}
              className="w-full text-sm pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-400 text-slate-700"
              placeholder="e.g. FitForge@123"
            />
          </div>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
            At least 8 chars with 1 uppercase, 1 number & 1 special character (e.g. <span className="font-mono text-blue-500">FitForge@123</span>)
          </p>
          {errors.password && (
            <p className="text-red-500 text-xs font-semibold mt-1">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 active:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {loading ? 'Creating account...' : 'Create Account'}
          <ArrowRight size={16} />
        </button>
      </form>

      <div className="text-center pt-2">
        <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500">
          Already have an account?{' '}
          <a
            href="/login"
            className="text-blue-500 hover:text-blue-600 font-bold transition-colors"
          >
            Log in
          </a>
        </p>
      </div>
    </div>
  );
};
export default Register;
