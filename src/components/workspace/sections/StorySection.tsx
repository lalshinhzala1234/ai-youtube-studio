'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  Edit3,
  Copy,
  Check,
  RotateCcw,
  CheckCircle2,
  FileText,
  Users,
  Layers,
  Clock,
  Palette,
  ArrowRight,
  ShieldCheck,
  Sliders,
  Flame,
  Volume2,
} from 'lucide-react';
import { YouTubeProject, StoryData, StoryMode, StoryProgressionBeat } from '@/types/project';
import { generateStoryForProject } from '@/lib/storage/projectStore';

interface StorySectionProps {
  project: YouTubeProject;
  onUpdateProject?: (updated: YouTubeProject) => void;
}

export const StorySection: React.FC<StorySectionProps> = ({
  project,
  onUpdateProject,
}) => {
  const story = project.story || generateStoryForProject(project.idea, project.settings, project.fullStory);
  
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedStoryText, setEditedStoryText] = useState(story.fullStory || '');
  const [activeStoryTab, setActiveStoryTab] = useState<'active' | 'original' | 'progression'>('active');

  const storyMode = story.storyMode || project.settings.storyMode || 'ai_create';

  const handleCopyStory = () => {
    navigator.clipboard.writeText(story.fullStory || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    const updatedStory: StoryData = {
      ...story,
      fullStory: editedStoryText,
      refinedStory: storyMode === 'user_refined' ? editedStoryText : story.refinedStory,
      exactStory: storyMode === 'user_exact' ? editedStoryText : story.exactStory,
    };

    const updatedProject: YouTubeProject = {
      ...project,
      story: updatedStory,
      fullStory: editedStoryText,
      settings: {
        ...project.settings,
        fullStory: editedStoryText,
        storyText: story.sourceText || editedStoryText,
      },
      updatedAt: new Date().toISOString(),
    };

    if (onUpdateProject) {
      onUpdateProject(updatedProject);
    }
    setIsEditing(false);
  };

  const handleRegenerateStory = (mode: StoryMode) => {
    const updatedSettings = {
      ...project.settings,
      storyMode: mode,
      storySource: mode === 'ai_create' ? ('ai_create' as const) : ('user_story' as const),
    };
    const newStory = generateStoryForProject(project.idea, updatedSettings, story.sourceText || project.fullStory);

    const updatedProject: YouTubeProject = {
      ...project,
      settings: updatedSettings,
      story: newStory,
      fullStory: newStory.fullStory,
      updatedAt: new Date().toISOString(),
    };

    if (onUpdateProject) {
      onUpdateProject(updatedProject);
    }
    setEditedStoryText(newStory.fullStory);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-red-600/10 border border-red-500/30 text-red-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-extrabold text-white">
                Story Architecture & Narrative Engine
              </h2>
              {/* Mode Badge */}
              <span
                className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
                  storyMode === 'user_exact'
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                    : storyMode === 'user_refined'
                    ? 'bg-blue-950/40 border-blue-500/40 text-blue-300'
                    : 'bg-red-950/40 border-red-500/40 text-red-300'
                }`}
              >
                {storyMode === 'user_exact'
                  ? 'User Story — Exact (Verbatim)'
                  : storyMode === 'user_refined'
                  ? 'User Story — AI Refined'
                  : 'AI Created Story'}
              </span>
            </div>
            <p className="text-xs text-gray-400 max-w-2xl">
              The core narrative foundation powering all downstream scenes, dialogues, camera directions, and AI video prompts.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopyStory}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0d1117] border border-[#30363d] hover:border-gray-500 text-xs font-semibold text-gray-300 hover:text-white transition-all shadow-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied Story!' : 'Copy Story'}
            </button>

            {!isEditing ? (
              <button
                onClick={() => {
                  setEditedStoryText(story.fullStory);
                  setIsEditing(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600/10 border border-red-500/30 hover:bg-red-600/20 text-xs font-semibold text-red-300 hover:text-red-200 transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Story
              </button>
            ) : (
              <button
                onClick={handleSaveEdit}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all shadow-md"
              >
                <Check className="w-3.5 h-3.5" />
                Save & Sync
              </button>
            )}
          </div>
        </div>

        {/* Quick Summary Pill Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-[#21262d]">
          <div className="p-2.5 rounded-lg bg-[#0d1117]/60 border border-[#21262d] flex items-center gap-2 text-xs">
            <Layers className="w-4 h-4 text-red-400 shrink-0" />
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-mono">Narrative Beats</p>
              <p className="font-semibold text-gray-200">{story.progression?.length || 5} Dynamic Acts</p>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-[#0d1117]/60 border border-[#21262d] flex items-center gap-2 text-xs">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-mono">Pacing Target</p>
              <p className="font-semibold text-gray-200">{project.settings?.duration || project.settings?.targetDuration || '3 minutes'}</p>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-[#0d1117]/60 border border-[#21262d] flex items-center gap-2 text-xs">
            <Palette className="w-4 h-4 text-purple-400 shrink-0" />
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-mono">Visual Style</p>
              <p className="font-semibold text-gray-200">{project.settings?.visualStyle || '3D Cartoon'}</p>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-[#0d1117]/60 border border-[#21262d] flex items-center gap-2 text-xs">
            <Volume2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-mono">Voice Mode</p>
              <p className="font-semibold text-gray-200 truncate">{project.settings?.voiceMode || 'Narrator + Dialogue'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Full Story Text & Editor */}
        <div className="lg:col-span-2 space-y-4">
          {/* Sub-tabs if original story exists */}
          {story.sourceText && storyMode === 'user_refined' && (
            <div className="flex items-center gap-2 p-1 rounded-xl bg-[#161b22] border border-[#30363d] w-fit">
              <button
                onClick={() => setActiveStoryTab('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeStoryTab === 'active'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Refined Story (Active)
              </button>
              <button
                onClick={() => setActiveStoryTab('original')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeStoryTab === 'original'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Original User Input
              </button>
            </div>
          )}

          {/* Story Body Card */}
          <div className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-red-400" />
                {activeStoryTab === 'original' ? 'Original User Story' : 'Active Production Story'}
              </h3>
              <span className="text-[11px] font-mono text-gray-500">
                {activeStoryTab === 'original'
                  ? `${story.sourceText?.length || 0} chars`
                  : `${story.fullStory?.length || 0} chars`}
              </span>
            </div>

            {isEditing && activeStoryTab === 'active' ? (
              <div className="space-y-3">
                <textarea
                  rows={14}
                  value={editedStoryText}
                  onChange={(e) => setEditedStoryText(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] focus:border-red-500 rounded-xl p-4 text-xs lg:text-sm text-gray-200 focus:outline-none leading-relaxed font-sans"
                  placeholder="Type or edit the full story..."
                />
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Edits will synchronize with scene breakdowns and video prompts.</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 rounded-lg bg-[#0d1117] border border-[#30363d] hover:text-white text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="prose prose-invert max-w-none text-xs lg:text-sm text-gray-300 leading-relaxed space-y-3 font-sans">
                {activeStoryTab === 'original' ? (
                  <div className="whitespace-pre-wrap bg-[#0d1117] p-4 rounded-xl border border-[#21262d] text-amber-200/90 font-mono text-xs">
                    {story.sourceText || 'No original text stored.'}
                  </div>
                ) : (
                  story.fullStory?.split(/\n\s*\n/).map((para, i) => (
                    <p key={i} className="text-gray-300 bg-[#0d1117]/40 p-3.5 rounded-xl border border-[#21262d]/60">
                      {para}
                    </p>
                  )) || <p className="text-gray-500 italic">No story text available.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: 5-Act Progression Beats & Characters */}
        <div className="space-y-5">
          {/* Narrative Progression Beats */}
          <div className="p-5 rounded-2xl bg-[#161b22] border border-[#30363d] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Story Progression Acts
            </h3>

            <div className="space-y-2.5">
              {story.progression?.map((beat, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#0d1117] border border-[#21262d] hover:border-red-500/40 transition-all space-y-1.5 text-xs group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-red-400 uppercase">
                      {beat.act}
                    </span>
                    <span className="text-[10px] text-gray-500">Beat {idx + 1}</span>
                  </div>
                  <p className="text-gray-300 font-medium leading-snug">
                    {beat.summary}
                  </p>
                  {beat.dialogueSnippet && (
                    <p className="text-[11px] text-amber-300/80 italic border-l-2 border-amber-500/50 pl-2">
                      {beat.dialogueSnippet}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Mode Switcher / AI Assist Card */}
          <div className="p-5 rounded-2xl bg-[#161b22] border border-[#30363d] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              Switch Story Processing Mode
            </h3>
            <p className="text-[11px] text-gray-400">
              Change how the AI interprets and formats your story across the workspace:
            </p>

            <div className="space-y-2">
              <button
                onClick={() => handleRegenerateStory('ai_create')}
                className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${
                  storyMode === 'ai_create'
                    ? 'bg-red-950/40 border-red-500/60 text-red-200'
                    : 'bg-[#0d1117] border-[#21262d] text-gray-400 hover:border-gray-600 hover:text-white'
                }`}
              >
                <div>
                  <p className="font-bold">AI Create Story</p>
                  <p className="text-[10px] text-gray-500">Autonomous high-retention narrative</p>
                </div>
                {storyMode === 'ai_create' && <Check className="w-4 h-4 text-red-400" />}
              </button>

              <button
                onClick={() => handleRegenerateStory('user_refined')}
                className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${
                  storyMode === 'user_refined'
                    ? 'bg-blue-950/40 border-blue-500/60 text-blue-200'
                    : 'bg-[#0d1117] border-[#21262d] text-gray-400 hover:border-gray-600 hover:text-white'
                }`}
              >
                <div>
                  <p className="font-bold">Refine My Story</p>
                  <p className="text-[10px] text-gray-500">Polished cinematic flow, preserving plot</p>
                </div>
                {storyMode === 'user_refined' && <Check className="w-4 h-4 text-blue-400" />}
              </button>

              <button
                onClick={() => handleRegenerateStory('user_exact')}
                className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${
                  storyMode === 'user_exact'
                    ? 'bg-amber-950/40 border-amber-500/60 text-amber-200'
                    : 'bg-[#0d1117] border-[#21262d] text-gray-400 hover:border-gray-600 hover:text-white'
                }`}
              >
                <div>
                  <p className="font-bold">Use My Story Exactly</p>
                  <p className="text-[10px] text-gray-500">Zero modifications, strict verbatim</p>
                </div>
                {storyMode === 'user_exact' && <Check className="w-4 h-4 text-amber-400" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
