'use client';

import React from 'react';
import {
  LayoutTemplate,
  Sparkles,
  ArrowRight,
  PlusCircle,
  Clock,
  Film,
  Zap,
  BookOpen,
  Cpu,
  Smile,
} from 'lucide-react';
import { VideoType, VisualStyle, Tone, TargetPace } from '@/types/project';

interface TemplatePreset {
  id: string;
  title: string;
  category: string;
  description: string;
  duration: string;
  videoType: VideoType;
  visualStyle: VisualStyle;
  tone: Tone;
  targetPace: TargetPace;
  sampleIdea: string;
  icon: React.ReactNode;
}

interface TemplatesViewProps {
  onUseTemplate: (sampleIdea: string, settings: {
    videoType: VideoType;
    visualStyle: VisualStyle;
    tone: Tone;
    targetPace: TargetPace;
    targetDuration: string;
    language: string;
    targetScenesCount: number;
    includeCharacters: boolean;
  }) => void;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({ onUseTemplate }) => {
  const templates: TemplatePreset[] = [
    {
      id: 'kids-abc',
      title: 'Kids Phonics & 3D Animal Adventure',
      category: 'Kids & Animation',
      description: 'Bright Pixar-style animal characters exploring phonics, numbers, and bedtime stories.',
      duration: '3-5 minutes',
      videoType: 'Kids & Animation',
      visualStyle: '3D Pixar Animation',
      tone: 'High-Energy & Fun',
      targetPace: 'Gentle Kids Pace',
      sampleIdea: 'Kids ABC Adventure: The Safari Alphabet Expedition',
      icon: <Smile className="w-5 h-5 text-amber-400" />,
    },
    {
      id: 'cinematic-myth',
      title: 'Mythology & Ancient Lore Documentary',
      category: 'Documentary & True Crime',
      description: 'Photorealistic 8K cinematic storytelling exploring legendary gods, ancient battles, and lost civilizations.',
      duration: '8-12 minutes',
      videoType: 'Documentary & True Crime',
      visualStyle: 'Photorealistic Cinematic 8K',
      tone: 'Inspiring & Epic',
      targetPace: 'Steady Documentary',
      sampleIdea: 'Krishna Story: The Divine Flute and the Battle of Kurukshetra',
      icon: <Film className="w-5 h-5 text-blue-400" />,
    },
    {
      id: 'tech-breakdown',
      title: 'AI & Quantum Computing Explainer',
      category: 'Tech & AI Breakdown',
      description: 'High-contrast neon cyberpunk motion graphics breaking down emerging AI, cryptography, and engineering.',
      duration: '5-8 minutes',
      videoType: 'Tech & AI Breakdown',
      visualStyle: 'Dark Cyberpunk Neo-Noir',
      tone: 'Mysterious & Suspenseful',
      targetPace: 'Dynamic & Engaging (3-5s cuts)',
      sampleIdea: 'How Quantum Computers Will Break Modern Encryption in 2026',
      icon: <Cpu className="w-5 h-5 text-cyan-400" />,
    },
    {
      id: 'dino-safari',
      title: 'Prehistoric Dinosaur Adventure',
      category: 'Storytelling & Lore',
      description: 'Immersive Jurassic exploration with photorealistic creatures, sound design cues, and survival tension.',
      duration: '5-8 minutes',
      videoType: 'Storytelling & Lore',
      visualStyle: 'Photorealistic Cinematic 8K',
      tone: 'Dramatic & Intense',
      targetPace: 'Dynamic & Engaging (3-5s cuts)',
      sampleIdea: 'Dinosaur Adventure: The Secret Valley of T-Rex',
      icon: <Zap className="w-5 h-5 text-emerald-400" />,
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#090c10] text-[#f0f6fc] p-6 lg:p-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <LayoutTemplate className="w-6 h-6 text-purple-400" />
          Production Templates & Presets
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Launch complete YouTube video packages instantly with pre-configured pacing, visual styles, and retention structures.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d] flex flex-col justify-between space-y-4 hover:border-purple-500/50 transition-all shadow-lg"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-[#0d1117] border border-[#21262d]">
                  {tpl.icon}
                </div>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300">
                  {tpl.category}
                </span>
              </div>

              <h3 className="font-bold text-base text-white">{tpl.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{tpl.description}</p>

              <div className="pt-2 flex flex-wrap gap-2 text-[10px] font-mono text-gray-400">
                <span className="px-2 py-0.5 rounded bg-[#0d1117] border border-[#21262d]">
                  {tpl.duration}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#0d1117] border border-[#21262d]">
                  {tpl.visualStyle}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#0d1117] border border-[#21262d]">
                  {tpl.tone}
                </span>
              </div>
            </div>

            <button
              onClick={() =>
                onUseTemplate(tpl.sampleIdea, {
                  videoType: tpl.videoType,
                  visualStyle: tpl.visualStyle,
                  tone: tpl.tone,
                  targetPace: tpl.targetPace,
                  targetDuration: tpl.duration,
                  language: 'English (US)',
                  targetScenesCount: 6,
                  includeCharacters: true,
                })
              }
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-red-600/20"
            >
              <span>Use This Template</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
