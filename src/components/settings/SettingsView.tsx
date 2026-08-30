'use client';

import React from 'react';
import {
  Settings,
  Shield,
  Sliders,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Database,
  Moon,
  Laptop,
  Check,
  Cloud,
  User,
  LogOut,
  LogIn,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface SettingsViewProps {
  onClearStorage: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onClearStorage }) => {
  const { user, isConfigured, signOut, openAuthModal } = useAuth();

  return (
    <div className="flex-1 overflow-y-auto bg-[#090c10] text-[#f0f6fc] p-6 lg:p-10 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-gray-400" />
          Studio Settings
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Configure production defaults, cloud sync persistence, and AI generator formatting standards.
        </p>
      </div>

      <div className="space-y-4">
        {/* Card 0: Account & Cloud Database */}
        <div className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-emerald-400" />
              <h2 className="font-bold text-sm text-white">Supabase Cloud Database & Authentication</h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
              Row Level Security Active
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#0d1117] border border-[#21262d] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                {user?.email ? user.email.substring(0, 2).toUpperCase() : 'G'}
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  {user ? user.email : 'Guest / Offline Mode'}
                </p>
                <p className="text-[11px] text-gray-400">
                  {user
                    ? `Account ID: ${user.id}`
                    : 'Sign in to sync your video blueprints and AI scripts to the cloud.'}
                </p>
              </div>
            </div>

            {user ? (
              <button
                onClick={() => signOut()}
                className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 border border-red-800/40 text-red-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Card 1: Default Video Preferences */}
        <div className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d] space-y-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-red-400" />
            <h2 className="font-bold text-sm text-white">Default Video Production Defaults</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-gray-400 font-medium">Default Aspect Ratio</label>
              <div className="p-2.5 rounded-xl bg-[#0d1117] border border-[#21262d] text-white flex items-center justify-between">
                <span>16:9 Landscape (YouTube Main)</span>
                <Check className="w-4 h-4 text-red-500" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-gray-400 font-medium">AI Video Generator Target</label>
              <div className="p-2.5 rounded-xl bg-[#0d1117] border border-[#21262d] text-white flex items-center justify-between">
                <span>Runway Gen-3 / Google Veo 2 / Luma</span>
                <Check className="w-4 h-4 text-red-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Local Storage & Data Persistence */}
        <div className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d] space-y-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-400" />
            <h2 className="font-bold text-sm text-white">Data Storage & Local Cache</h2>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            All your video blueprints, character consistency profiles, and script drafts are securely cached in client storage and synchronized to your account in Supabase.
          </p>

          <div className="pt-2">
            <button
              onClick={() => {
                if (confirm('Reset all demo projects and restore default sample library?')) {
                  onClearStorage();
                }
              }}
              className="px-4 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-800/40 text-red-300 text-xs font-semibold transition-colors"
            >
              Reset Sample Projects
            </button>
          </div>
        </div>

        {/* Card 3: Platform Architecture */}
        <div className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d] space-y-3">
          <div className="flex items-center gap-2">
            <Laptop className="w-4 h-4 text-emerald-400" />
            <h2 className="font-bold text-sm text-white">Architecture Verification</h2>
          </div>
          <div className="space-y-2 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Next.js App Router & React 18+ Web Architecture</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Tailwind CSS Desktop-First SaaS Layout Engine</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Supabase PostgreSQL Database with Strict Row Level Security (RLS)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

