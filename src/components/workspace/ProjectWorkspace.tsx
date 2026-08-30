'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Zap,
  FileText,
  Users,
  Clapperboard,
  Video,
  Image as ImageIcon,
  Search,
  Smartphone,
  Download,
  LayoutDashboard,
  Clock,
  Palette,
  Volume2,
  ChevronRight,
  Play,
  Save,
  Check,
  Menu,
  X,
  BookOpen,
} from 'lucide-react';
import { YouTubeProject, WorkspaceTab } from '@/types/project';
import { OverviewSection } from './sections/OverviewSection';
import { StorySection } from './sections/StorySection';
import { ConceptSection } from './sections/ConceptSection';
import { HookSection } from './sections/HookSection';
import { ScriptSection } from './sections/ScriptSection';
import { CharactersSection } from './sections/CharactersSection';
import { ScenesSection } from './sections/ScenesSection';
import { VideoPromptsSection } from './sections/VideoPromptsSection';
import { ThumbnailSection } from './sections/ThumbnailSection';
import { SeoSection } from './sections/SeoSection';
import { ShortsSection } from './sections/ShortsSection';
import { ExportSection } from './sections/ExportSection';

interface ProjectWorkspaceProps {
  project: YouTubeProject;
  activeTab: WorkspaceTab;
  setActiveTab: (tab: WorkspaceTab) => void;
  onBackToDashboard: () => void;
  onUpdateProject: (updated: YouTubeProject) => void;
}

export const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({
  project,
  activeTab,
  setActiveTab,
  onBackToDashboard,
  onUpdateProject,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sidebarItems: { id: WorkspaceTab; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" />, color: 'text-gray-300' },
    { id: 'story', label: 'Story', icon: <BookOpen className="w-4 h-4" />, color: 'text-amber-400' },
    { id: 'concept', label: 'Concept', icon: <Sparkles className="w-4 h-4" />, color: 'text-red-400' },
    { id: 'hook', label: 'Hook', icon: <Zap className="w-4 h-4" />, color: 'text-amber-400' },
    { id: 'script', label: 'Script', icon: <FileText className="w-4 h-4" />, color: 'text-blue-400' },
    { id: 'characters', label: 'Characters', icon: <Users className="w-4 h-4" />, color: 'text-purple-400' },
    { id: 'scenes', label: 'Scenes', icon: <Clapperboard className="w-4 h-4" />, color: 'text-emerald-400' },
    { id: 'prompts', label: 'Video Prompts', icon: <Video className="w-4 h-4" />, color: 'text-cyan-400' },
    { id: 'thumbnail', label: 'Thumbnail', icon: <ImageIcon className="w-4 h-4" />, color: 'text-rose-400' },
    { id: 'seo', label: 'YouTube SEO', icon: <Search className="w-4 h-4" />, color: 'text-yellow-400' },
    { id: 'shorts', label: 'Shorts', icon: <Smartphone className="w-4 h-4" />, color: 'text-pink-400' },
    { id: 'export', label: 'Export', icon: <Download className="w-4 h-4" />, color: 'text-green-400' },
  ];

  const handleTabSelect = (tabId: WorkspaceTab) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  const currentModuleLabel = sidebarItems.find((s) => s.id === activeTab)?.label || 'Overview';

  return (
    <div className="flex-1 flex h-screen overflow-hidden bg-[#090c10] relative">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Workspace Left Sidebar (Responsive Drawer on Mobile, Static on Desktop) */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#0d1117] border-r border-[#21262d] flex flex-col justify-between shrink-0 select-none transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="overflow-y-auto">
          {/* Back button & Project Header */}
          <div className="p-4 border-b border-[#21262d] space-y-3">
            <div className="flex items-center justify-between">
              <button
                onClick={onBackToDashboard}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors min-h-[36px] py-1 px-2 rounded-lg hover:bg-[#161b22]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </button>

              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg md:hidden"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/60 border border-red-800/40 text-red-300">
                {project.settings.videoType}
              </span>
              <h2 className="font-bold text-xs text-white line-clamp-2 leading-snug">
                {project.idea}
              </h2>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-2 space-y-0.5">
            <div className="px-3 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Project Modules
            </div>

            {sidebarItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all min-h-[44px] ${
                    isActive
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-[#161b22]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isActive ? 'text-white' : item.color}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3 h-3 text-white" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Project Meta Footer */}
        <div className="p-3 border-t border-[#21262d] space-y-1.5 text-[11px] text-gray-400 shrink-0">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-gray-500" />
              Duration:
            </span>
            <span className="font-mono text-gray-300">{project.settings.targetDuration}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Palette className="w-3 h-3 text-purple-400" />
              Style:
            </span>
            <span className="truncate max-w-[100px] text-gray-300">{project.settings.visualStyle}</span>
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Top Header Bar */}
        <header className="px-4 md:px-8 py-3.5 bg-[#0d1117] border-b border-[#21262d] flex items-center justify-between shrink-0 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg bg-[#161b22] border border-[#30363d] text-gray-300 hover:text-white md:hidden shrink-0"
              aria-label="Open Modules Menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center shrink-0">
              <Play className="w-3 h-3 text-white fill-white ml-0.5" />
            </div>

            <div className="min-w-0">
              <h1 className="text-xs md:text-sm font-bold text-white flex items-center gap-1.5 md:gap-2 truncate">
                <span className="truncate">{project.idea}</span>
                <span className="text-gray-500 font-normal shrink-0">•</span>
                <span className="text-[11px] md:text-xs text-red-400 font-medium capitalize shrink-0">
                  {currentModuleLabel}
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('export')}
              className="px-3 py-1.5 rounded-lg bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-xs font-semibold text-gray-300 hover:text-white transition-colors flex items-center gap-1.5 min-h-[36px]"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Export Package</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>
        </header>

        {/* Horizontal module quick bar on mobile */}
        <div className="md:hidden bg-[#0d1117] border-b border-[#21262d] px-3 py-2 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors shrink-0 ${
                activeTab === item.id
                  ? 'bg-red-600 text-white'
                  : 'bg-[#161b22] text-gray-400 hover:text-gray-200'
              }`}
            >
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Workspace Active Tab View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto w-full">
          {activeTab === 'overview' && (
            <OverviewSection project={project} onNavigateTab={setActiveTab} />
          )}
          {activeTab === 'story' && (
            <StorySection project={project} onUpdateProject={onUpdateProject} />
          )}
          {activeTab === 'concept' && (
            <ConceptSection project={project} onUpdateProject={onUpdateProject} />
          )}
          {activeTab === 'hook' && (
            <HookSection project={project} onUpdateProject={onUpdateProject} />
          )}
          {activeTab === 'script' && (
            <ScriptSection project={project} onUpdateProject={onUpdateProject} />
          )}
          {activeTab === 'characters' && (
            <CharactersSection project={project} onUpdateProject={onUpdateProject} />
          )}
          {activeTab === 'scenes' && (
            <ScenesSection project={project} onUpdateProject={onUpdateProject} />
          )}
          {activeTab === 'prompts' && (
            <VideoPromptsSection project={project} onUpdateProject={onUpdateProject} />
          )}
          {activeTab === 'thumbnail' && (
            <ThumbnailSection project={project} onUpdateProject={onUpdateProject} />
          )}
          {activeTab === 'seo' && (
            <SeoSection project={project} onUpdateProject={onUpdateProject} />
          )}
          {activeTab === 'shorts' && (
            <ShortsSection project={project} onUpdateProject={onUpdateProject} />
          )}
          {activeTab === 'export' && <ExportSection project={project} />}
        </main>
      </div>
    </div>
  );
};
