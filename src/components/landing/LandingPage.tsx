'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Sparkles,
  Zap,
  FileText,
  Clapperboard,
  Video,
  Image as ImageIcon,
  Search,
  Smartphone,
  Download,
  ArrowRight,
  CheckCircle2,
  Play,
  Layers,
  ChevronRight,
  ShieldCheck,
  Star,
  Users,
  Film,
  LogIn,
  User as UserIcon,
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onCreatePackage: (idea: string) => void;
  onOpenDashboard: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onCreatePackage,
  onOpenDashboard,
}) => {
  const { user, openAuthModal } = useAuth();
  const [videoIdea, setVideoIdea] = useState('');

  const exampleIdeas = [
    'Kids ABC Adventure',
    'Krishna Story: The Divine Flute',
    'Dinosaur Adventure: The Secret Valley of T-Rex',
    'How Quantum Computers Will Break Encryption',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = videoIdea.trim() || 'Kids ABC Adventure';
    onCreatePackage(query);
  };

  const handleStartClick = () => {
    onGetStarted();
  };

  return (
    <div className="min-h-screen bg-[#090c10] text-[#f0f6fc] flex flex-col selection:bg-red-500 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#090c10]/85 border-b border-[#21262d]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/25">
              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white">
              AI YouTube Studio
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How it Works
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Pricing
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <button
                onClick={onOpenDashboard}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-[#161b22] transition-colors flex items-center gap-1.5"
              >
                <UserIcon className="w-3.5 h-3.5 text-red-400" />
                <span>Dashboard</span>
              </button>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-[#161b22] transition-colors flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5 text-gray-400" />
                <span>Sign In</span>
              </button>
            )}

            <button
              onClick={handleStartClick}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-red-600/30 flex items-center gap-1.5"
            >
              <span>{user ? 'Open Studio' : 'Get Started'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>


      {/* Hero Section */}
      <section className="relative pt-20 pb-28 px-6 overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-red-600/15 blur-[130px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[250px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#161b22] border border-[#30363d] text-xs font-medium text-red-400 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Complete YouTube Production Engine</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
            Turn One Idea Into a{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-amber-400">
              Complete YouTube Video
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Generate your concept, hook, script, scenes, AI video prompts, thumbnail prompt, SEO and Shorts from one idea.
          </p>

          {/* Large Interactive Input Box */}
          <div className="pt-4 max-w-2xl mx-auto">
            <form
              onSubmit={handleSubmit}
              className="p-2.5 rounded-2xl bg-[#161b22]/90 border border-[#30363d] shadow-2xl backdrop-blur-md flex flex-col sm:flex-row gap-2.5"
            >
              <div className="flex-1 flex items-center px-4 py-2">
                <input
                  type="text"
                  value={videoIdea}
                  onChange={(e) => setVideoIdea(e.target.value)}
                  placeholder="What video do you want to create? (e.g. Kids ABC Adventure)"
                  className="w-full bg-transparent text-white placeholder-gray-500 text-sm sm:text-base outline-none focus:ring-0 font-medium"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm transition-all shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <span>Create Video Package</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Clickable Suggestions */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-gray-400">
              <span className="text-gray-500 font-medium">Try example:</span>
              {exampleIdeas.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setVideoIdea(ex)}
                  className="px-3 py-1 rounded-lg bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-gray-300 hover:text-white transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-[#0d1117]/60 border-t border-[#21262d]">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-red-400 uppercase tracking-widest">
              Full Spectrum Creator Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Everything Your Video Needs, in One Place
            </h2>
            <p className="text-sm text-gray-400">
              From the first 15 seconds of retention to full rendering prompts and YouTube Studio uploads.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d] space-y-3 hover:border-red-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Retention Hook Engine</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                0-15s pattern interrupts, visual curiosity gaps, and psychological pacing models to keep viewers watching past the drop-off cliff.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d] space-y-3 hover:border-red-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Timestamped Full Script</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Word-by-word dialogue, narration pacing, on-screen text graphics, and sound effect cues matched to your target duration.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d] space-y-3 hover:border-red-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Video className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">AI Video & Render Prompts</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Formatted prompt strings with camera motions and lighting moods for Runway Gen-3, Luma Dream Machine, Google Veo, and Midjourney.
              </p>
            </div>

            {/* Card 4 */}
            <div className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d] space-y-3 hover:border-red-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <ImageIcon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">High-CTR Thumbnail Studio</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                High-contrast thumbnail concepts, focal point positioning, bold typography overlays, and clickability scores.
              </p>
            </div>

            {/* Card 5 */}
            <div className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d] space-y-3 hover:border-red-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">YouTube SEO & Studio Tags</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                A/B testable titles, formatted video descriptions with chapters, targeted studio tags, and trending hashtag suites.
              </p>
            </div>

            {/* Card 6 */}
            <div className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d] space-y-3 hover:border-red-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">9:16 Shorts & TikTok Suite</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Instant vertical spin-off scripts with second-by-second visual beats and synchronized on-screen caption hooks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 px-6 border-t border-[#21262d]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-red-400 uppercase tracking-widest">
              Simple 3-Step Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              How AI YouTube Studio Works
            </h2>
            <p className="text-sm text-gray-400">
              Transform rough video ideas into structured production blueprints in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d] space-y-4 relative">
              <div className="text-3xl font-black text-red-500/30">01</div>
              <h3 className="text-base font-bold text-white">Enter Your Video Idea</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Type any concept, whether it is a kids animation, deep-dive documentary, tech breakdown, or faceless story.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d] space-y-4 relative">
              <div className="text-3xl font-black text-red-500/30">02</div>
              <h3 className="text-base font-bold text-white">Configure Format & Style</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Choose runtime targets, visual aesthetics (3D Pixar, Cinematic 8K, Anime), and emotional delivery tones.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d] space-y-4 relative">
              <div className="text-3xl font-black text-red-500/30">03</div>
              <h3 className="text-base font-bold text-white">Export Complete Production Kit</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Download markdown master files, video prompt CSVs for AI generators, and ready-to-paste YouTube Studio metadata.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 bg-[#0d1117]/60 border-t border-[#21262d]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-red-400 uppercase tracking-widest">
              Simple Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Built for Creators and Studios
            </h2>
            <p className="text-sm text-gray-400">
              Start free, create unlimited packages, and scale your channel workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free */}
            <div className="p-8 rounded-2xl bg-[#161b22] border border-[#30363d] flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">Starter Creator</h3>
                <div className="text-3xl font-extrabold text-white">$0 <span className="text-xs font-normal text-gray-400">/ forever</span></div>
                <p className="text-xs text-gray-400">Perfect for exploring and creating your first complete video packages.</p>
                <ul className="space-y-2 text-xs text-gray-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 3 Full Video Packages / mo
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Retention Hook Engine
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Basic Scene Prompts
                  </li>
                </ul>
              </div>
              <button
                onClick={onGetStarted}
                className="w-full py-2.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-white text-xs font-semibold transition-colors"
              >
                Get Started Free
              </button>
            </div>

            {/* Pro */}
            <div className="p-8 rounded-2xl bg-[#161b22] border-2 border-red-500 flex flex-col justify-between space-y-6 relative shadow-xl shadow-red-500/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-red-600 text-[10px] font-bold uppercase tracking-wider text-white">
                Most Popular
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">Creator Pro</h3>
                <div className="text-3xl font-extrabold text-white">$29 <span className="text-xs font-normal text-gray-400">/ month</span></div>
                <p className="text-xs text-gray-400">For active YouTubers publishing weekly high-retention content.</p>
                <ul className="space-y-2 text-xs text-gray-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Unlimited Video Packages
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Runway, Luma & Veo Prompts
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> High-CTR Thumbnail Studio
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Full 9:16 Shorts Suite
                  </li>
                </ul>
              </div>
              <button
                onClick={onGetStarted}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-red-600/30"
              >
                Start Creator Pro
              </button>
            </div>

            {/* Studio */}
            <div className="p-8 rounded-2xl bg-[#161b22] border border-[#30363d] flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">Production Studio</h3>
                <div className="text-3xl font-extrabold text-white">$99 <span className="text-xs font-normal text-gray-400">/ month</span></div>
                <p className="text-xs text-gray-400">For multi-channel media networks and full video production teams.</p>
                <ul className="space-y-2 text-xs text-gray-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Multi-seat Team Collaboration
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Character Consistency Library
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> CSV & Batch Export Pipelines
                  </li>
                </ul>
              </div>
              <button
                onClick={onGetStarted}
                className="w-full py-2.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-white text-xs font-semibold transition-colors"
              >
                Contact Studio Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-10 px-6 border-t border-[#21262d] bg-[#090c10]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-red-600 flex items-center justify-center">
              <Play className="w-3 h-3 text-white fill-white ml-0.5" />
            </div>
            <span className="font-semibold text-gray-300">AI YouTube Studio</span>
            <span>© 2026</span>
          </div>
          <p>Turn one idea into a complete production-ready YouTube video package.</p>
        </div>
      </footer>
    </div>
  );
};
