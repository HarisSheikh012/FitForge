import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import { api } from '../../lib/axios';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      password: '',
    },
  });

  const onSubmit = async (data: any) => {
    if (!token) {
      setError('Invalid reset token.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        password: data.password,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link to="/login" className="text-slate-400 hover:text-slate-600">
          <ArrowLeft size={16} />
        </Link>
        <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
          Back to login
        </span>
      </div>

      <div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-100">Reset Password</h3>
        <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 mt-1">
          Set a new password for your account
        </p>
      </div>

      {error && (
        <div className="flex gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success ? (
        <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-semibold rounded-xl text-center">
          Password reset successfully! Redirecting you to login...
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              New Password
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
                })}
                className="w-full text-sm pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-400 text-slate-700"
                placeholder="••••••••"
              />
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs font-semibold mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 active:opacity-90 disabled:opacity-50 transition-all"
          >
            {loading ? 'Resetting password...' : 'Reset Password'}
          </button>
        </form>
      )}
    </div>
  );
};
export default ResetPassword;
