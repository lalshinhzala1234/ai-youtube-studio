'use client';

import React from 'react';
import {
  Plus,
  Play,
  Film,
  Sparkles,
  Clock,
  Palette,
  ArrowRight,
  Trash2,
  FolderKanban,
  FileText,
  Zap,
  TrendingUp,
  LayoutTemplate,
  Calendar,
} from 'lucide-react';
import { YouTubeProject } from '@/types/project';

interface DashboardViewProps {
  projects: YouTubeProject[];
  onOpenProject: (project: YouTubeProject) => void;
  onCreateNewClick: () => void;
  onDeleteProject: (projectId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  onOpenProject,
  onCreateNewClick,
  onDeleteProject,
}) => {
  return (
    <div className="flex-1 overflow-y-auto bg-[#090c10] text-[#f0f6fc] p-6 lg:p-10 space-y-8">
      {/* Top Banner / Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 rounded-2xl bg-gradient-to-r from-[#161b22] via-[#1a1f29] to-[#161b22] border border-[#30363d] relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 blur-3xl pointer-events-none -mr-20 -mt-20 rounded-full" />

        <div className="space-y-2 max-w-xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Studio Production Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome to AI YouTube Studio
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
            Turn your video ideas into structured production blueprints with retention hooks, scene scripts, AI video prompts, and YouTube metadata.
          </p>
        </div>

        <div className="z-10 shrink-0">
          <button
            onClick={onCreateNewClick}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm transition-all shadow-lg shadow-red-600/30 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ New Project</span>
          </button>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Total Projects</span>
            <FolderKanban className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-white">{projects.length}</p>
        </div>

        <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Active Blueprints</span>
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">10 Modules</p>
        </div>

        <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Render Pipelines</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white">Runway / Veo</p>
        </div>

        <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Average CTR Target</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">12% - 16%</p>
        </div>
      </div>

      {/* Recent Projects Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Film className="w-4 h-4 text-red-500" />
              Recent Projects
            </h2>
            <p className="text-xs text-gray-400">
              Continue working on your active YouTube packages
            </p>
          </div>

          <button
            onClick={onCreateNewClick}
            className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1"
          >
            <span>Create New</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#161b22] border border-[#30363d] space-y-3">
            <Film className="w-10 h-10 text-gray-600 mx-auto" />
            <h3 className="font-bold text-sm text-white">No projects yet</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Start by creating your first YouTube video blueprint to generate hooks, scripts, scenes, and prompts.
            </p>
            <button
              onClick={onCreateNewClick}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New Project</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project) => (
              <div
                key={project.id}
                className="group p-5 rounded-2xl bg-[#161b22] border border-[#30363d] hover:border-red-500/50 transition-all flex flex-col justify-between space-y-4 shadow-lg hover:shadow-red-500/5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                      {project.settings.videoType}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete project "${project.idea}"?`)) {
                          onDeleteProject(project.id);
                        }
                      }}
                      className="p-1 text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-[#21262d]"
                      title="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3
                    onClick={() => onOpenProject(project)}
                    className="font-bold text-base text-white group-hover:text-red-400 transition-colors line-clamp-2 cursor-pointer"
                  >
                    {project.idea}
                  </h3>

                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                    {project.concept.premise || 'Complete production kit with full scene breakdowns and AI prompt strings.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#21262d] space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-500" />
                      {project.settings.targetDuration}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[10px]">
                      <Palette className="w-3 h-3 text-purple-400" />
                      {project.settings.visualStyle}
                    </span>
                  </div>

                  <button
                    onClick={() => onOpenProject(project)}
                    className="w-full py-2 px-3 rounded-xl bg-[#21262d] hover:bg-red-600 hover:text-white text-gray-200 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Open Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Starter Templates Section */}
      <div className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-sm text-white">Popular Creator Templates</h3>
          </div>
          <span className="text-xs text-gray-400 font-mono">1-Click Presets</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div
            onClick={onCreateNewClick}
            className="p-3.5 rounded-xl bg-[#0d1117] border border-[#21262d] hover:border-purple-500/40 transition-colors cursor-pointer space-y-1"
          >
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">
              Kids & Phonics
            </span>
            <p className="font-semibold text-xs text-white">3D Pixar Animal Adventures</p>
            <p className="text-[11px] text-gray-400">3-5 Min • High Energy</p>
          </div>

          <div
            onClick={onCreateNewClick}
            className="p-3.5 rounded-xl bg-[#0d1117] border border-[#21262d] hover:border-cyan-500/40 transition-colors cursor-pointer space-y-1"
          >
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
              Documentary
            </span>
            <p className="font-semibold text-xs text-white">Cinematic Myth & History</p>
            <p className="text-[11px] text-gray-400">8-10 Min • Epic & Inspiring</p>
          </div>

          <div
            onClick={onCreateNewClick}
            className="p-3.5 rounded-xl bg-[#0d1117] border border-[#21262d] hover:border-amber-500/40 transition-colors cursor-pointer space-y-1"
          >
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
              Science & Tech
            </span>
            <p className="font-semibold text-xs text-white">Investigative Debunking</p>
            <p className="text-[11px] text-gray-400">5-8 Min • Pattern Interrupts</p>
          </div>

          <div
            onClick={onCreateNewClick}
            className="p-3.5 rounded-xl bg-[#0d1117] border border-[#21262d] hover:border-pink-500/40 transition-colors cursor-pointer space-y-1"
          >
            <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider block">
              Viral Vertical
            </span>
            <p className="font-semibold text-xs text-white">9:16 Shorts Hook Suite</p>
            <p className="text-[11px] text-gray-400">30-60s • Ultra Fast</p>
          </div>
        </div>
      </div>
    </div>
  );
};
