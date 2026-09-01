'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, AuthModalMode } from '@/context/AuthContext';
import {
  X,
  Play,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, authModalMode, closeAuthModal, signIn, signUp, resetPassword } = useAuth();

  const [mode, setMode] = useState<AuthModalMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthModalOpen) {
      setMode(authModalMode);
      setError(null);
      setSuccessMessage(null);
      setPassword('');
      setConfirmPassword('');
    }
  }, [isAuthModalOpen, authModalMode]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (mode === 'forgot-password') {
      setLoading(true);
      const res = await resetPassword(trimmedEmail);
      setLoading(false);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccessMessage(res.message || 'Password reset link sent to your email.');
      }
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please check again.');
        return;
      }

      setLoading(true);
      const res = await signUp(trimmedEmail, password);
      setLoading(false);
      if (res.error) {
        setError(res.error);
      }
      return;
    }

    if (mode === 'login') {
      setLoading(true);
      const res = await signIn(trimmedEmail, password);
      setLoading(false);
      if (res.error) {
        setError(res.error);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
    >
      <div className="w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="p-6 border-b border-[#21262d] flex items-center justify-between relative bg-gradient-to-r from-[#161b22] to-[#1c2128]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-md shadow-red-500/20">
              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white tracking-tight">
                {mode === 'login' && 'Sign in to YouTube Studio'}
                {mode === 'signup' && 'Create Creator Account'}
                {mode === 'forgot-password' && 'Reset Your Password'}
              </h2>
              <p className="text-[11px] text-gray-400">
                {mode === 'login' && 'Access all your saved video packages & AI tools'}
                {mode === 'signup' && 'Cloud-synced video production workspace'}
                {mode === 'forgot-password' && 'Receive password recovery instructions'}
              </p>
            </div>
          </div>

          <button
            onClick={closeAuthModal}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-[#21262d] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher (Login vs Sign Up) */}
        {mode !== 'forgot-password' && (
          <div className="flex border-b border-[#21262d] bg-[#0d1117]">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-3 text-xs font-bold transition-colors border-b-2 ${
                mode === 'login'
                  ? 'text-white border-red-500 bg-[#161b22]/50'
                  : 'text-gray-400 border-transparent hover:text-gray-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-3 text-xs font-bold transition-colors border-b-2 ${
                mode === 'signup'
                  ? 'text-white border-red-500 bg-[#161b22]/50'
                  : 'text-gray-400 border-transparent hover:text-gray-200'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-800/60 text-red-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-gray-400" />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@creator.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0d1117] border border-[#30363d] text-white text-xs placeholder-gray-500 focus:border-red-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Password Field */}
          {mode !== 'forgot-password' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-gray-400" />
                  <span>Password</span>
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot-password');
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="text-[11px] text-red-400 hover:text-red-300"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0d1117] border border-[#30363d] text-white text-xs placeholder-gray-500 focus:border-red-500 focus:outline-none transition-colors"
              />
            </div>
          )}

          {/* Confirm Password Field for Sign Up */}
          {mode === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
                <span>Confirm Password</span>
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0d1117] border border-[#30363d] text-white text-xs placeholder-gray-500 focus:border-red-500 focus:outline-none transition-colors"
              />
            </div>
          )}

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs transition-all shadow-md shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : mode === 'login' ? (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : mode === 'signup' ? (
              <>
                <span>Create Creator Account</span>
                <Sparkles className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Send Reset Link</span>
                <KeyRound className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          {/* Footer Navigation */}
          {mode === 'forgot-password' && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-xs text-gray-400 hover:text-white"
              >
                ← Back to Sign In
              </button>
            </div>
          )}
        </form>

        {/* Security Note Footer */}
        <div className="px-6 py-3 bg-[#0d1117] border-t border-[#21262d] flex items-center justify-between text-[10px] text-gray-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            Supabase Protected • Row Level Security
          </span>
          <span>Encrypted Auth</span>
        </div>
      </div>
    </div>
  );
};
