import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/axios';
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: any) => {
    setError(null);
    setLoading(true);
    try {
      const response = await api.post('/auth/login', data);
      const { accessToken, user } = response.data.data;
      login(accessToken, user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-100">Welcome Back</h3>
        <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 mt-1">
          Enter your credentials to access your dashboard
        </p>
      </div>

      {error && (
        <div className="flex gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl text-red-600 text-xs font-semibold">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

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
              className="w-full text-sm pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-400 text-slate-700 dark:text-zinc-200"
              placeholder="e.g. owner@fitlife.com"
            />
          </div>
          {errors.email && (
            <p className="text-red-500 text-xs font-semibold mt-1">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors"
            >
              Forgot Password?
            </Link>
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Lock size={16} />
            </span>
            <input
              type="password"
              {...register('password', { required: 'Password is required' })}
              className="w-full text-sm pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-400 text-slate-700 dark:text-zinc-200"
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
          className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 active:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {loading ? 'Logging in...' : 'Log In'}
          <ArrowRight size={16} />
        </button>
      </form>

      <div className="text-center pt-2">
        <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500">
          Want to register your gym?{' '}
          <Link
            to="/register"
            className="text-blue-500 hover:text-blue-600 font-bold transition-colors"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};
export default Login;
