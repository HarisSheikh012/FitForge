import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/axios';

export const ForgotPassword: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetTokenMock, setResetTokenMock] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: any) => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', data);
      setSuccess(true);
      // For local development convenience, we capture the mock token returned in the seed response
      if (res.data?.resetToken) {
        setResetTokenMock(res.data.resetToken);
      }
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to send reset link.');
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
        <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-100">Forgot Password?</h3>
        <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 mt-1">
          Enter your email to receive a password reset link
        </p>
      </div>

      {error && (
        <div className="flex gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success ? (
        <div className="space-y-4">
          <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-semibold rounded-xl">
            Success! If that email exists, we've sent instructions to reset your password.
          </div>
          {resetTokenMock && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-2">
              <p className="font-bold text-amber-800">Sandbox Email Simulation Link:</p>
              <Link
                to={`/reset-password?token=${resetTokenMock}`}
                className="text-blue-500 underline font-bold break-all"
              >
                /reset-password?token={resetTokenMock}
              </Link>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                placeholder="e.g. owner@fitlife.com"
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-xs font-semibold mt-1">{errors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 active:opacity-90 disabled:opacity-50 transition-all"
          >
            {loading ? 'Sending link...' : 'Send Reset Link'}
          </button>
        </form>
      )}
    </div>
  );
};
export default ForgotPassword;
