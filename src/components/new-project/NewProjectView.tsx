'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowLeft,
  Clapperboard,
  Clock,
  Palette,
  Volume2,
  Users,
  Film,
  Languages,
  Tv,
  CheckCircle2,
  Loader2,
  Check,
  AlertCircle,
  Ratio,
  Sliders,
} from 'lucide-react';
import {
  VideoType,
  TargetAudience,
  Language,
  VideoDuration,
  VideoFormat,
  VisualStyle,
  Tone,
  Narration,
  SceneCountOption,
  AspectRatio,
  VideoSettings,
  YouTubeProject,
  VideoConcept,
  VideoHook,
  VideoScript,
} from '@/types/project';

interface NewProjectViewProps {
  onCancel: () => void;
  onCreateProject: (
    idea: string,
    settings: VideoSettings,
    overrides?: {
      concept?: VideoConcept;
      hook?: VideoHook;
      script?: VideoScript;
    }
  ) => void;
}

const GENERATION_STAGES = [
  'Understanding idea',
  'Building video concept',
  'Creating hook',
  'Writing script',
  'Planning characters',
  'Creating scenes',
  'Preparing AI video prompts',
  'Preparing thumbnail',
  'Preparing YouTube SEO',
  'Preparing Shorts',
];

export const NewProjectView: React.FC<NewProjectViewProps> = ({
  onCancel,
  onCreateProject,
}) => {
  // Form State
  const [idea, setIdea] = useState('');
  const [videoType, setVideoType] = useState<VideoType>('Kids');
  const [audience, setAudience] = useState<TargetAudience>('Kids');
  const [language, setLanguage] = useState<Language>('English');
  const [duration, setDuration] = useState<VideoDuration>('3 minutes');
  const [customDuration, setCustomDuration] = useState('');
  const [format, setFormat] = useState<VideoFormat>('YouTube Long Form');
  const [visualStyle, setVisualStyle] = useState<VisualStyle>('3D Cartoon');
  const [customStyle, setCustomStyle] = useState('');
  const [tone, setTone] = useState<Tone>('Fun');
  const [narration, setNarration] = useState<Narration>('Both');
  const [sceneCount, setSceneCount] = useState<SceneCountOption>('5');
  const [customScenes, setCustomScenes] = useState('6');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [includeCharacters, setIncludeCharacters] = useState(true);

  // Validation State
  const [errorMessage, setErrorMessage] = useState('');
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Generation Progress Screen State
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Preset Inspirations
  const samplePresets = [
    {
      title: 'Kids ABC Adventure: Magical Jungle Journey',
      type: 'Kids' as VideoType,
      audience: 'Kids' as TargetAudience,
      language: 'English' as Language,
      duration: '3 minutes' as VideoDuration,
      format: 'YouTube Long Form' as VideoFormat,
      style: '3D Cartoon' as VisualStyle,
      tone: 'Fun' as Tone,
      narration: 'Both' as Narration,
      scenes: '5' as SceneCountOption,
      aspect: '16:9' as AspectRatio,
    },
    {
      title: 'The Untold Legend of Krishna’s Flute in Vrindavan',
      type: 'Story' as VideoType,
      audience: 'General' as TargetAudience,
      language: 'Hindi' as Language,
      duration: '10 minutes' as VideoDuration,
      format: 'YouTube Long Form' as VideoFormat,
      style: 'Cinematic' as VisualStyle,
      tone: 'Inspirational' as Tone,
      narration: 'Narrator' as Narration,
      scenes: '10' as SceneCountOption,
      aspect: '16:9' as AspectRatio,
    },
    {
      title: 'What Science Just Discovered About T-Rex Changes Everything',
      type: 'Documentary' as VideoType,
      audience: 'General' as TargetAudience,
      language: 'English' as Language,
      duration: '5 minutes' as VideoDuration,
      format: 'YouTube Long Form' as VideoFormat,
      style: 'Realistic' as VisualStyle,
      tone: 'Exciting' as Tone,
      narration: 'Narrator' as Narration,
      scenes: '5' as SceneCountOption,
      aspect: '16:9' as AspectRatio,
    },
    {
      title: 'AI Revolution: 5 Human Skills No Machine Can Replace',
      type: 'Explainer' as VideoType,
      audience: 'Adults' as TargetAudience,
      language: 'English' as Language,
      duration: '5 minutes' as VideoDuration,
      format: 'YouTube Long Form' as VideoFormat,
      style: 'Educational' as VisualStyle,
      tone: 'Inspirational' as Tone,
      narration: 'Narrator' as Narration,
      scenes: '5' as SceneCountOption,
      aspect: '16:9' as AspectRatio,
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);

    if (!idea.trim()) {
      setErrorMessage('Video Idea is required. Please enter a topic or concept.');
      return;
    }

    setErrorMessage('');
    setGenerationError(null);
    setIsGenerating(true);
    setCurrentStageIndex(0);

    let numericScenes = 5;
    if (sceneCount === 'Auto') numericScenes = 5;
    else if (sceneCount === 'Custom') numericScenes = parseInt(customScenes, 10) || 5;
    else numericScenes = parseInt(String(sceneCount), 10) || 5;

    const finalDuration = duration === 'Custom' && customDuration.trim() ? customDuration : duration;
    const finalStyle = visualStyle === 'Custom' && customStyle.trim() ? customStyle : visualStyle;

    const formattedSettings: VideoSettings = {
      videoType,
      audience,
      language,
      duration: finalDuration,
      targetDuration: finalDuration,
      format,
      visualStyle: finalStyle,
      tone,
      narration,
      sceneCount,
      targetScenesCount: numericScenes,
      targetPace: 'Dynamic & Engaging (3-5s cuts)',
      aspectRatio,
      includeCharacters,
      customDuration: customDuration.trim() || undefined,
      customStyle: customStyle.trim() || undefined,
      customScenes: parseInt(customScenes, 10) || undefined,
    };

    // Smooth ticker interval for UI stages
    const ticker = setInterval(() => {
      setCurrentStageIndex((prev) => {
        if (prev < GENERATION_STAGES.length - 2) {
          return prev + 1;
        }
        return prev;
      });
    }, 450);

    try {
      // Real AI Generation Server Call (Phase 3A: Idea -> Concept -> Hook -> Script)
      const res = await fetch('/api/generate/pipeline-3a', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: idea.trim(),
          settings: formattedSettings,
        }),
      });

      const data = await res.json();
      clearInterval(ticker);
      setCurrentStageIndex(GENERATION_STAGES.length - 1);

      setTimeout(() => {
        onCreateProject(idea.trim(), formattedSettings, {
          concept: data?.concept,
          hook: data?.hook,
          script: data?.script,
        });
      }, 500);
    } catch (err: any) {
      console.warn('Real AI pipeline encountered an issue, continuing with fallback:', err);
      clearInterval(ticker);
      setCurrentStageIndex(GENERATION_STAGES.length - 1);
      setTimeout(() => {
        onCreateProject(idea.trim(), formattedSettings);
      }, 500);
    }
  };

  // -------------------------------------------------------------
  // STEP 4 — Generation Progress Screen
  // -------------------------------------------------------------
  if (isGenerating) {
    const progressPercent = Math.round(
      ((currentStageIndex + 1) / GENERATION_STAGES.length) * 100
    );

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#090c10] text-[#f0f6fc] min-h-screen">
        <div className="w-full max-w-xl p-8 rounded-2xl bg-[#161b22] border border-[#30363d] shadow-2xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-red-600/10 border border-red-500/30 text-red-500 mb-2">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <h2 className="text-2xl font-extrabold text-white">
              Generating Video Package
            </h2>
            <p className="text-xs text-gray-400 max-w-md mx-auto line-clamp-1">
              &ldquo;{idea}&rdquo;
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-gray-300">
                {currentStageIndex === GENERATION_STAGES.length - 1
                  ? 'Finalizing Workspace...'
                  : `${GENERATION_STAGES[currentStageIndex]}...`}
              </span>
              <span className="text-red-400 font-mono">{progressPercent}%</span>
            </div>
            <div className="w-full h-2.5 bg-[#0d1117] rounded-full overflow-hidden border border-[#30363d]">
              <div
                className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Generation Stages Checklist */}
          <div className="p-4 rounded-xl bg-[#0d1117] border border-[#21262d] space-y-2.5 max-h-72 overflow-y-auto">
            {GENERATION_STAGES.map((stage, idx) => {
              const isDone = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              const isUpcoming = idx > currentStageIndex;

              return (
                <div
                  key={stage}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${
                    isCurrent
                      ? 'bg-red-950/30 border border-red-500/40 text-red-200 font-bold'
                      : isDone
                      ? 'bg-[#161b22]/50 text-emerald-300'
                      : 'text-gray-500 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isDone && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                    {isCurrent && (
                      <Loader2 className="w-4 h-4 text-red-400 animate-spin shrink-0" />
                    )}
                    {isUpcoming && (
                      <div className="w-4 h-4 rounded-full border border-gray-600 shrink-0" />
                    )}
                    <span>{stage}</span>
                  </div>

                  {isDone && (
                    <span className="text-[10px] font-mono font-semibold text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Ready
                    </span>
                  )}
                  {isCurrent && (
                    <span className="text-[10px] font-mono text-red-400 animate-pulse">
                      Processing...
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <p className="text-[11px] text-gray-500">
              Structuring hook matrix, timecodes, prompts, character profiles, and SEO metadata...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STEP 1 — New Project Form View
  // -------------------------------------------------------------
  return (
    <div className="flex-1 overflow-y-auto bg-[#090c10] text-[#f0f6fc] p-6 lg:p-10">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back navigation */}
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/10 border border-red-500/30 text-red-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            New Project Setup
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white">
            Create YouTube Video Package
          </h1>
          <p className="text-sm text-gray-400">
            Enter your core video idea and configure creative specifications. AI YouTube Studio will generate your complete concept, retention hooks, script, scenes, video prompts, thumbnail, and SEO.
          </p>
        </div>

        {/* Quick Idea Presets */}
        <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-red-400" />
              Quick Idea Inspirations (Click to populate):
            </label>
            <span className="text-[11px] text-gray-500">1-Click Presets</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {samplePresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setIdea(preset.title);
                  setVideoType(preset.type);
                  setAudience(preset.audience);
                  setLanguage(preset.language);
                  setDuration(preset.duration);
                  setFormat(preset.format);
                  setVisualStyle(preset.style);
                  setTone(preset.tone);
                  setNarration(preset.narration);
                  setSceneCount(preset.scenes);
                  setAspectRatio(preset.aspect);
                  setErrorMessage('');
                }}
                className="text-left p-3 rounded-lg bg-[#0d1117] border border-[#21262d] hover:border-red-500/50 hover:bg-[#1a1f26] transition-all text-xs group"
              >
                <p className="font-semibold text-gray-200 group-hover:text-white line-clamp-1">
                  {preset.title}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400 font-mono">
                  <span className="text-red-400">{preset.type}</span>
                  <span>•</span>
                  <span>{preset.language}</span>
                  <span>•</span>
                  <span>{preset.duration}</span>
                  <span>•</span>
                  <span>{preset.style}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Configuration Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 lg:p-8 rounded-2xl bg-[#161b22] border border-[#30363d] space-y-6 shadow-xl"
        >
          {/* Validation Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/50 flex items-center gap-2.5 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Video Idea * (Required) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-200">
                Video Idea <span className="text-red-400">*</span>
              </label>
              <span className="text-[11px] text-gray-500">Required</span>
            </div>
            <textarea
              rows={3}
              value={idea}
              onChange={(e) => {
                setIdea(e.target.value);
                if (e.target.value.trim() && errorMessage) setErrorMessage('');
              }}
              placeholder="e.g. Kids ABC Adventure: Magical Jungle Journey"
              className={`w-full bg-[#0d1117] border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-colors resize-none ${
                hasAttemptedSubmit && !idea.trim()
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-[#30363d] focus:border-red-500 focus:ring-red-500'
              }`}
            />
            {hasAttemptedSubmit && !idea.trim() && (
              <p className="text-[11px] text-red-400">Please enter a video idea to proceed.</p>
            )}
          </div>

          {/* Grid Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
            {/* 1. Video Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-red-400" />
                Video Type
              </label>
              <select
                value={videoType}
                onChange={(e) => setVideoType(e.target.value as VideoType)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-red-500"
              >
                <option value="Kids">Kids</option>
                <option value="Story">Story</option>
                <option value="Educational">Educational</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Documentary">Documentary</option>
                <option value="Explainer">Explainer</option>
                <option value="Faceless">Faceless</option>
                <option value="Music">Music</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* 2. Target Audience */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                Target Audience
              </label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as TargetAudience)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-red-500"
              >
                <option value="Kids">Kids</option>
                <option value="Teens">Teens</option>
                <option value="General">General</option>
                <option value="Adults">Adults</option>
              </select>
            </div>

            {/* 3. Language */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-emerald-400" />
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-red-500"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Hinglish">Hinglish</option>
                <option value="Gujarati">Gujarati</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* 4. Video Duration */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Video Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value as VideoDuration)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-red-500"
              >
                <option value="30 seconds">30 seconds</option>
                <option value="1 minute">1 minute</option>
                <option value="2 minutes">2 minutes</option>
                <option value="3 minutes">3 minutes</option>
                <option value="5 minutes">5 minutes</option>
                <option value="10 minutes">10 minutes</option>
                <option value="Custom">Custom</option>
              </select>
              {duration === 'Custom' && (
                <input
                  type="text"
                  placeholder="e.g. 15 minutes / 45 seconds"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  className="w-full mt-1 bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                />
              )}
            </div>

            {/* 5. Video Format */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Tv className="w-3.5 h-3.5 text-indigo-400" />
                Video Format
              </label>
              <select
                value={format}
                onChange={(e) => {
                  const val = e.target.value as VideoFormat;
                  setFormat(val);
                  if (val === 'YouTube Shorts') {
                    setAspectRatio('9:16');
                    setDuration('30 seconds');
                  } else {
                    setAspectRatio('16:9');
                  }
                }}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-red-500"
              >
                <option value="YouTube Long Form">YouTube Long Form</option>
                <option value="YouTube Shorts">YouTube Shorts</option>
              </select>
            </div>

            {/* 6. Visual Style */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-purple-400" />
                Visual Style
              </label>
              <select
                value={visualStyle}
                onChange={(e) => setVisualStyle(e.target.value as VisualStyle)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-red-500"
              >
                <option value="3D Cartoon">3D Cartoon</option>
                <option value="2D Cartoon">2D Cartoon</option>
                <option value="Cinematic">Cinematic</option>
                <option value="Realistic">Realistic</option>
                <option value="Anime">Anime</option>
                <option value="Educational">Educational</option>
                <option value="Custom">Custom</option>
              </select>
              {visualStyle === 'Custom' && (
                <input
                  type="text"
                  placeholder="e.g. Claymation / Cyberpunk 8K"
                  value={customStyle}
                  onChange={(e) => setCustomStyle(e.target.value)}
                  className="w-full mt-1 bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                />
              )}
            </div>

            {/* 7. Tone */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-rose-400" />
                Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as Tone)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-red-500"
              >
                <option value="Fun">Fun</option>
                <option value="Emotional">Emotional</option>
                <option value="Educational">Educational</option>
                <option value="Exciting">Exciting</option>
                <option value="Funny">Funny</option>
                <option value="Inspirational">Inspirational</option>
                <option value="Dramatic">Dramatic</option>
              </select>
            </div>

            {/* 8. Narration */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                Narration
              </label>
              <select
                value={narration}
                onChange={(e) => setNarration(e.target.value as Narration)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-red-500"
              >
                <option value="Narrator">Narrator</option>
                <option value="Character Dialogue">Character Dialogue</option>
                <option value="Both">Both</option>
              </select>
            </div>

            {/* 9. Number of Scenes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Clapperboard className="w-3.5 h-3.5 text-emerald-400" />
                Number of Scenes
              </label>
              <select
                value={sceneCount}
                onChange={(e) => setSceneCount(e.target.value as SceneCountOption)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-red-500"
              >
                <option value="Auto">Auto</option>
                <option value="5">5 Scenes</option>
                <option value="10">10 Scenes</option>
                <option value="15">15 Scenes</option>
                <option value="20">20 Scenes</option>
                <option value="Custom">Custom</option>
              </select>
              {sceneCount === 'Custom' && (
                <input
                  type="number"
                  min={2}
                  max={30}
                  placeholder="e.g. 7"
                  value={customScenes}
                  onChange={(e) => setCustomScenes(e.target.value)}
                  className="w-full mt-1 bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                />
              )}
            </div>

            {/* 10. Aspect Ratio */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Ratio className="w-3.5 h-3.5 text-amber-400" />
                Aspect Ratio
              </label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-red-500"
              >
                <option value="16:9">16:9 (Standard YouTube Horizontal)</option>
                <option value="9:16">9:16 (YouTube Shorts / Vertical)</option>
                <option value="1:1">1:1 (Square Format)</option>
              </select>
            </div>

            {/* Reusable Character Profiles Toggle */}
            <div className="space-y-1.5 md:col-span-2 flex flex-col justify-end">
              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#0d1117] border border-[#30363d] cursor-pointer hover:border-red-500/40 transition-colors">
                <input
                  type="checkbox"
                  checked={includeCharacters}
                  onChange={(e) => setIncludeCharacters(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#161b22] border-[#30363d] text-red-600 focus:ring-red-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-gray-200">
                    Include Character Continuity Profiles
                  </span>
                  <span className="text-gray-500 block text-[11px]">
                    Locks visual prompts for consistent characters across all scene renders.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-[#21262d]">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl bg-[#21262d] text-gray-300 hover:text-white text-xs font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-7 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Video Package</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
