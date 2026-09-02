'use client';

import React from 'react';
import {
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
  ArrowRight,
  CheckCircle2,
  Layers,
  Clock,
  Palette,
  Hash,
  BookOpen,
} from 'lucide-react';
import { YouTubeProject, WorkspaceTab } from '@/types/project';

interface OverviewSectionProps {
  project: YouTubeProject;
  onNavigateTab: (tab: WorkspaceTab) => void;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  project,
  onNavigateTab,
}) => {
  const cards: {
    tab: WorkspaceTab;
    title: string;
    description: string;
    stat: string;
    icon: React.ReactNode;
    color: string;
    badge: string;
  }[] = [
    {
      tab: 'story',
      title: 'Story & Narrative Architecture',
      description: project.story?.summary || project.fullStory?.slice(0, 120) || 'Full multi-act story arc, progression beats, and core narrative foundation.',
      stat: project.story?.storyMode === 'user_exact' ? 'User Story (Exact)' : project.story?.storyMode === 'user_refined' ? 'User Story (Refined)' : 'AI Created Story',
      icon: <BookOpen className="w-4 h-4 text-amber-400" />,
      color: 'border-amber-500/30 hover:border-amber-500/60',
      badge: 'Story',
    },
    {
      tab: 'concept',
      title: 'Video Concept & Audience',
      description: project.concept.premise || 'Target demographic, viewing motivation, and core educational/entertainment value.',
      stat: project.concept.targetAudience.demographic || 'All Demographics',
      icon: <Sparkles className="w-4 h-4 text-red-400" />,
      color: 'border-red-500/30 hover:border-red-500/60',
      badge: 'Concept',
    },
    {
      tab: 'hook',
      title: '0-15s Retention Hook',
      description: project.hook.hookOptions[0]?.text || 'Pattern interrupt & visual curiosity gap designed to prevent audience drop-off.',
      stat: '94% Retention Score',
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      color: 'border-amber-500/30 hover:border-amber-500/60',
      badge: 'Hook',
    },
    {
      tab: 'script',
      title: 'Full Script & Narration',
      description: `${project.script.sections.length} scene-by-scene script blocks with timecodes, dialogue, and audio cues.`,
      stat: `${project.script.totalWordCount} words (~${project.script.estimatedReadTime})`,
      icon: <FileText className="w-4 h-4 text-blue-400" />,
      color: 'border-blue-500/30 hover:border-blue-500/60',
      badge: 'Script',
    },
    {
      tab: 'characters',
      title: 'Character Consistency Profiles',
      description: `${project.characters.length} persistent character prompts with visual anchors, outfit styles, and voice tones.`,
      stat: `${project.characters.length} Profiles`,
      icon: <Users className="w-4 h-4 text-purple-400" />,
      color: 'border-purple-500/30 hover:border-purple-500/60',
      badge: 'Characters',
    },
    {
      tab: 'scenes',
      title: 'Scene-by-Scene Breakdown',
      description: `${project.scenes.length} structured cinematic scenes with camera motion, lighting moods, and sound design.`,
      stat: `${project.scenes.length} Scenes`,
      icon: <Clapperboard className="w-4 h-4 text-emerald-400" />,
      color: 'border-emerald-500/30 hover:border-emerald-500/60',
      badge: 'Scenes',
    },
    {
      tab: 'prompts',
      title: 'AI Video Generation Prompts',
      description: 'Midjourney, Runway Gen-3, Luma Dream Machine & Google Veo camera-ready prompt strings.',
      stat: 'Runway / Veo Formatted',
      icon: <Video className="w-4 h-4 text-cyan-400" />,
      color: 'border-cyan-500/30 hover:border-cyan-500/60',
      badge: 'Prompts',
    },
    {
      tab: 'thumbnail',
      title: 'High-CTR Thumbnail Studio',
      description: `${project.thumbnail.concepts.length} click-worthy visual compositions with focal point positioning and bold typography.`,
      stat: 'CTR 14.8% Est.',
      icon: <ImageIcon className="w-4 h-4 text-rose-400" />,
      color: 'border-rose-500/30 hover:border-rose-500/60',
      badge: 'Thumbnail',
    },
    {
      tab: 'seo',
      title: 'YouTube SEO, Titles & Tags',
      description: `${project.youtubeSeo.titleOptions.length} A/B title variations, chaptered description, and targeted tag strings.`,
      stat: `${project.youtubeSeo.tags.length} Tags & Keywords`,
      icon: <Search className="w-4 h-4 text-yellow-400" />,
      color: 'border-yellow-500/30 hover:border-yellow-500/60',
      badge: 'SEO',
    },
    {
      tab: 'shorts',
      title: '9:16 Shorts & TikTok Suite',
      description: `${project.shorts.scripts.length} vertical spin-off scripts with synchronized captions and call-to-actions.`,
      stat: `${project.shorts.scripts.length} Vertical Scripts`,
      icon: <Smartphone className="w-4 h-4 text-pink-400" />,
      color: 'border-pink-500/30 hover:border-pink-500/60',
      badge: 'Shorts',
    },
    {
      tab: 'export',
      title: 'Production Export Kit',
      description: 'Download complete Markdown blueprint, Prompt CSV, and YouTube Studio paste metadata.',
      stat: 'Markdown / CSV / JSON',
      icon: <Download className="w-4 h-4 text-green-400" />,
      color: 'border-green-500/30 hover:border-green-500/60',
      badge: 'Export',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Top Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#161b22] to-[#1c2128] border border-[#30363d] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-400">
              {project.settings.videoType}
            </span>
            <span className="text-xs text-gray-300 font-mono flex items-center gap-1 bg-[#0d1117] px-2 py-0.5 rounded border border-[#21262d]">
              <Clock className="w-3 h-3 text-amber-400" />
              Duration: {project.settings.totalDuration || project.settings.targetDuration || project.settings.duration}
            </span>
            <span className="text-xs text-gray-300 font-mono flex items-center gap-1 bg-[#0d1117] px-2 py-0.5 rounded border border-[#21262d]">
              <Layers className="w-3 h-3 text-emerald-400" />
              {project.scenes?.length || project.settings.targetScenesCount || 0} Scenes ({project.settings.sceneDuration || '5s/scene'})
            </span>
            <span className="text-xs text-gray-300 font-mono flex items-center gap-1 bg-[#0d1117] px-2 py-0.5 rounded border border-[#21262d]">
              <span className="text-purple-400 font-bold">Lang:</span>
              {project.settings.language}
            </span>
            <span className="text-xs text-gray-300 font-mono flex items-center gap-1 bg-[#0d1117] px-2 py-0.5 rounded border border-[#21262d]">
              <span className="text-blue-400 font-bold">Voice:</span>
              {project.settings.voiceMode || 'Narrator + Dialogue'}
            </span>
          </div>

          <span className="text-xs text-gray-400 font-mono bg-[#0d1117] px-2 py-0.5 rounded border border-[#21262d]">
            {project.settings.visualStyle} • {project.settings.aspectRatio || '16:9'}
          </span>
        </div>

        <h2 className="text-2xl font-black text-white">{project.idea}</h2>
        <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-3xl">
          {project.concept.premise}
        </p>
      </div>

      {/* Grid of Section Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => (
          <div
            key={card.tab}
            onClick={() => onNavigateTab(card.tab)}
            className={`p-5 rounded-2xl bg-[#161b22] border transition-all cursor-pointer flex flex-col justify-between space-y-4 hover:shadow-lg ${card.color}`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#0d1117] border border-[#21262d]">
                    {card.icon}
                  </div>
                  <h3 className="font-bold text-sm text-white">{card.title}</h3>
                </div>
                <span className="text-[10px] font-mono font-semibold text-gray-400 px-2 py-0.5 rounded bg-[#0d1117] border border-[#21262d]">
                  {card.badge}
                </span>
              </div>

              <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                {card.description}
              </p>
            </div>

            <div className="pt-2 border-t border-[#21262d] flex items-center justify-between text-xs">
              <span className="text-[11px] font-mono text-gray-300 font-medium">
                {card.stat}
              </span>
              <span className="text-red-400 font-semibold flex items-center gap-1 text-[11px] group-hover:translate-x-0.5 transition-transform">
                <span>View Details</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
