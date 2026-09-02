'use client';

import React, { useState } from 'react';
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
  BookOpen,
  Edit3,
  FileText,
  HelpCircle,
  RefreshCw,
  Wand2,
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
  StoryData,
  StoryMode,
  StorySource,
  PlanningMode,
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
      story?: StoryData;
      concept?: VideoConcept;
      hook?: VideoHook;
      script?: VideoScript;
    }
  ) => void;
}

const GENERATION_STAGES = [
  'Understanding idea & narrative structure',
  'Architecting story & progression acts',
  'Building video concept',
  'Creating retention hook',
  'Writing production script',
  'Planning persistent characters',
  'Creating scene breakdowns',
  'Preparing AI video prompts (Minimax / Luma / Kling)',
  'Preparing thumbnail concepts',
  'Preparing YouTube SEO & metadata',
  'Preparing Shorts adaptations',
];

export const NewProjectView: React.FC<NewProjectViewProps> = ({
  onCancel,
  onCreateProject,
}) => {
  // Form State
  const [idea, setIdea] = useState('');
  
  // Story Workflow State
  const [storySource, setStorySource] = useState<StorySource>('ai_create');
  const [storyMode, setStoryMode] = useState<StoryMode>('ai_create');
  const [storyText, setStoryText] = useState('');
  
  // Planning Mode State
  const [planningMode, setPlanningMode] = useState<PlanningMode>('ai_auto');

  // Video Settings State
  const [videoType, setVideoType] = useState<VideoType>('Kids');
  const [audience, setAudience] = useState<TargetAudience>('Kids');
  const [language, setLanguage] = useState<Language>('English');
  const [duration, setDuration] = useState<VideoDuration>('3 minutes');
  const [customDuration, setCustomDuration] = useState('');
  const [sceneDuration, setSceneDuration] = useState<string>('10 seconds');
  const [voiceMode, setVoiceMode] = useState<string>('Narrator + Character Dialogue');
  const [format, setFormat] = useState<VideoFormat>('YouTube Long Form');
  const [visualStyle, setVisualStyle] = useState<VisualStyle>('3D Cartoon');
  const [customStyle, setCustomStyle] = useState('');
  const [tone, setTone] = useState<Tone>('Fun');
  const [narration, setNarration] = useState<Narration>('Both');
  const [sceneCount, setSceneCount] = useState<SceneCountOption>('Auto');
  const [customScenes, setCustomScenes] = useState('6');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [includeCharacters, setIncludeCharacters] = useState(true);
  const [characterInstructions, setCharacterInstructions] = useState('');

  // Validation State
  const [errorMessage, setErrorMessage] = useState('');
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Helper to parse total duration and scene duration to calculate real scene count
  const parseTotalSec = (d: string) => {
    const lower = d.toLowerCase();
    if (lower.includes('min')) {
      const num = parseFloat(lower.replace(/[^0-9.]/g, '')) || 3;
      return Math.round(num * 60);
    }
    if (lower.includes('sec') || lower.includes('s')) {
      const num = parseFloat(lower.replace(/[^0-9.]/g, '')) || 30;
      return Math.round(num);
    }
    return 180;
  };

  const parseSceneSec = (s: string) => {
    const num = parseFloat(s.replace(/[^0-9.]/g, '')) || 10;
    return Math.max(3, Math.min(120, Math.round(num)));
  };

  const activeTotalSec = parseTotalSec(duration === 'Custom' && customDuration ? customDuration : duration);
  const activeSceneSec = parseSceneSec(sceneDuration);
  const autoCalculatedScenes = Math.max(1, Math.round(activeTotalSec / activeSceneSec));

  // Calculated scene count for conflict detection
  let currentNumericScenes = autoCalculatedScenes;
  if (planningMode === 'manual') {
    if (sceneCount === 'Custom') currentNumericScenes = parseInt(customScenes, 10) || autoCalculatedScenes;
    else if (sceneCount !== 'Auto') currentNumericScenes = parseInt(String(sceneCount), 10) || autoCalculatedScenes;
  }

  const calculatedProductSec = currentNumericScenes * activeSceneSec;
  const hasPlanningConflict = planningMode === 'manual' && sceneCount !== 'Auto' && Math.abs(calculatedProductSec - activeTotalSec) > 5;

  // Generation Progress Screen State
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Preset Inspirations
  const samplePresets = [
    {
      title: 'A little Indian boy finds a magical talking elephant in a jungle',
      storySource: 'ai_create' as StorySource,
      storyMode: 'ai_create' as StoryMode,
      type: 'Story' as VideoType,
      audience: 'Kids' as TargetAudience,
      language: 'Hindi' as Language,
      duration: '3 minutes' as VideoDuration,
      sceneDuration: '10 seconds',
      voiceMode: 'Narrator + Character Dialogue',
      format: 'YouTube Long Form' as VideoFormat,
      style: '3D Cartoon' as VisualStyle,
      tone: 'Emotional' as Tone,
      narration: 'Both' as Narration,
      scenes: 'Auto' as SceneCountOption,
      aspect: '16:9' as AspectRatio,
    },
    {
      title: 'Kids ABC Adventure: Magical Jungle Journey',
      storySource: 'ai_create' as StorySource,
      storyMode: 'ai_create' as StoryMode,
      type: 'Kids' as VideoType,
      audience: 'Kids' as TargetAudience,
      language: 'English' as Language,
      duration: '3 minutes' as VideoDuration,
      sceneDuration: '10 seconds',
      voiceMode: 'Narrator + Character Dialogue',
      format: 'YouTube Long Form' as VideoFormat,
      style: '3D Cartoon' as VisualStyle,
      tone: 'Fun' as Tone,
      narration: 'Both' as Narration,
      scenes: 'Auto' as SceneCountOption,
      aspect: '16:9' as AspectRatio,
    },
    {
      title: 'The Legend of the Ancient Forest Sanctuary',
      storySource: 'ai_create' as StorySource,
      storyMode: 'ai_create' as StoryMode,
      type: 'Story' as VideoType,
      audience: 'General' as TargetAudience,
      language: 'English' as Language,
      duration: '5 minutes' as VideoDuration,
      sceneDuration: '15 seconds',
      voiceMode: 'Narrator',
      format: 'YouTube Long Form' as VideoFormat,
      style: 'Cinematic' as VisualStyle,
      tone: 'Inspirational' as Tone,
      narration: 'Narrator' as Narration,
      scenes: 'Auto' as SceneCountOption,
      aspect: '16:9' as AspectRatio,
    },
    {
      title: 'AI Revolution: 5 Human Skills No Machine Can Replace',
      storySource: 'ai_create' as StorySource,
      storyMode: 'ai_create' as StoryMode,
      type: 'Explainer' as VideoType,
      audience: 'Adults' as TargetAudience,
      language: 'English' as Language,
      duration: '5 minutes' as VideoDuration,
      sceneDuration: '10 seconds',
      voiceMode: 'Narrator',
      format: 'YouTube Long Form' as VideoFormat,
      style: 'Educational' as VisualStyle,
      tone: 'Inspirational' as Tone,
      narration: 'Narrator' as Narration,
      scenes: 'Auto' as SceneCountOption,
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

    if (storySource === 'user_story' && !storyText.trim()) {
      setErrorMessage('Please provide your story text, or switch to "AI Create Story".');
      return;
    }

    setErrorMessage('');
    setGenerationError(null);
    setIsGenerating(true);
    setCurrentStageIndex(0);

    let numericScenes = autoCalculatedScenes;
    if (planningMode === 'manual') {
      if (sceneCount === 'Custom') numericScenes = parseInt(customScenes, 10) || autoCalculatedScenes;
      else if (sceneCount !== 'Auto') numericScenes = parseInt(String(sceneCount), 10) || autoCalculatedScenes;
    }

    const finalDuration = duration === 'Custom' && customDuration.trim() ? customDuration : duration;
    const finalStyle = visualStyle === 'Custom' && customStyle.trim() ? customStyle : visualStyle;
    const effectiveStoryMode: StoryMode = storySource === 'ai_create' ? 'ai_create' : storyMode === 'ai_create' ? 'user_refined' : storyMode;

    const formattedSettings: VideoSettings = {
      videoType,
      audience,
      language,
      duration: finalDuration,
      targetDuration: finalDuration,
      totalDuration: finalDuration,
      sceneDuration,
      voiceMode,
      format,
      visualStyle: finalStyle,
      tone,
      narration,
      sceneCount,
      targetScenesCount: numericScenes,
      targetPace: planningMode === 'ai_auto' ? 'AI Optimized Adaptive Pacing' : 'User Specified Pacing',
      aspectRatio,
      includeCharacters,
      storySource,
      storyMode: effectiveStoryMode,
      storyText: storyText.trim() || undefined,
      fullStory: storyText.trim() || undefined,
      planningMode,
      characterInstructions: characterInstructions.trim() || undefined,
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
      // Real AI Generation Server Call
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
          story: data?.story,
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
  // STEP: Generation Progress Screen
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
                  ? 'Finalizing Workspace Package...'
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
                  key={idx}
                  className={`flex items-center justify-between text-xs transition-opacity duration-200 ${
                    isDone
                      ? 'text-gray-400'
                      : isCurrent
                      ? 'text-white font-semibold'
                      : 'text-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-red-400 animate-spin shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-gray-700 shrink-0" />
                    )}
                    <span>{stage}</span>
                  </div>
                  {isDone && (
                    <span className="text-[10px] font-mono text-emerald-400">
                      Done
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
              Structuring story progression, retention hook, character anchors, and AI camera prompts...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STEP: New Project Form View
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
            Provide your topic or full story and configure creative specifications. AI YouTube Studio generates your complete story architecture, retention hooks, script, scenes, video prompts, thumbnail, and SEO.
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
                  setStorySource(preset.storySource);
                  setStoryMode(preset.storyMode);
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
          className="p-6 lg:p-8 rounded-2xl bg-[#161b22] border border-[#30363d] space-y-7 shadow-xl"
        >
          {/* Validation Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/50 flex items-center gap-2.5 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Video Topic / Title * */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-200">
                Video Topic or Concept Title <span className="text-red-400">*</span>
              </label>
              <span className="text-[11px] text-gray-500">Required</span>
            </div>
            <input
              type="text"
              value={idea}
              onChange={(e) => {
                setIdea(e.target.value);
                if (e.target.value.trim() && errorMessage) setErrorMessage('');
              }}
              placeholder="e.g. Kids ABC Adventure: Magical Jungle Journey"
              className={`w-full bg-[#0d1117] border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-colors ${
                hasAttemptedSubmit && !idea.trim()
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-[#30363d] focus:border-red-500 focus:ring-red-500'
              }`}
            />
            {hasAttemptedSubmit && !idea.trim() && (
              <p className="text-[11px] text-red-400">Please enter a video topic to proceed.</p>
            )}
          </div>

          {/* STEP 2: Story Source & Workflow Mode */}
          <div className="space-y-3 p-5 rounded-2xl bg-[#0d1117] border border-[#21262d]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-200 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                Story Input & Narrative Mode
              </label>
              <span className="text-[11px] text-amber-400/80 font-mono">Story Engine</span>
            </div>

            {/* Radio / Tab Selection for Story Source */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setStorySource('ai_create');
                  setStoryMode('ai_create');
                }}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  storySource === 'ai_create'
                    ? 'bg-red-950/40 border-red-500/60 text-white shadow-md'
                    : 'bg-[#161b22] border-[#30363d] text-gray-400 hover:border-gray-600 hover:text-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                    <Wand2 className="w-3.5 h-3.5 text-red-400" />
                    A) AI Create Story
                  </span>
                  {storySource === 'ai_create' && <Check className="w-4 h-4 text-red-400" />}
                </div>
                <p className="text-[11px] text-gray-400">
                  AI autonomously crafts a full high-retention story from your topic.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStorySource('user_story');
                  if (storyMode === 'ai_create') setStoryMode('user_refined');
                }}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  storySource === 'user_story'
                    ? 'bg-blue-950/40 border-blue-500/60 text-white shadow-md'
                    : 'bg-[#161b22] border-[#30363d] text-gray-400 hover:border-gray-600 hover:text-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    B) I Have My Own Story
                  </span>
                  {storySource === 'user_story' && <Check className="w-4 h-4 text-blue-400" />}
                </div>
                <p className="text-[11px] text-gray-400">
                  Paste your raw story, script, or book chapter to produce videos.
                </p>
              </button>
            </div>

            {/* When user_story is selected, show sub-mode toggle and textarea */}
            {storySource === 'user_story' && (
              <div className="space-y-4 pt-3 border-t border-[#21262d] animate-in fade-in duration-200">
                {/* Sub-mode selector: Refine vs Exact */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">
                    How should the AI process your story?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      storyMode === 'user_refined'
                        ? 'bg-blue-950/30 border-blue-500/50 text-blue-200'
                        : 'bg-[#161b22] border-[#30363d] text-gray-400 hover:border-gray-600'
                    }`}>
                      <input
                        type="radio"
                        name="storyMode"
                        checked={storyMode === 'user_refined'}
                        onChange={() => setStoryMode('user_refined')}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="text-xs font-bold text-gray-200">Refine My Story (Recommended)</p>
                        <p className="text-[11px] text-gray-400">
                          AI polishes phrasing, enhances cinematic pacing, and structures 5 narrative acts while preserving 100% of your plot.
                        </p>
                      </div>
                    </label>

                    <label className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      storyMode === 'user_exact'
                        ? 'bg-amber-950/30 border-amber-500/50 text-amber-200'
                        : 'bg-[#161b22] border-[#30363d] text-gray-400 hover:border-gray-600'
                    }`}>
                      <input
                        type="radio"
                        name="storyMode"
                        checked={storyMode === 'user_exact'}
                        onChange={() => setStoryMode('user_exact')}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="text-xs font-bold text-gray-200">Use My Story Exactly (Verbatim)</p>
                        <p className="text-[11px] text-gray-400">
                          Strictly preserves every word and line with zero plot changes or additions.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Textarea for Story */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-300">
                      Paste Your Story Text
                    </label>
                    <span className="text-[11px] font-mono text-gray-400">
                      {storyText.length} characters • {storyText.split(/\s+/).filter(Boolean).length} words
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    value={storyText}
                    onChange={(e) => setStoryText(e.target.value)}
                    placeholder="Once upon a time in a sunlit forest..."
                    className="w-full bg-[#161b22] border border-[#30363d] focus:border-blue-500 rounded-xl p-3.5 text-xs text-gray-200 focus:outline-none leading-relaxed font-sans"
                  />
                </div>
              </div>
            )}
          </div>

          {/* STEP 3: Duration & Scene Planning Mode */}
          <div className="space-y-3 p-5 rounded-2xl bg-[#0d1117] border border-[#21262d]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-400" />
                Duration & Scene Planning Strategy
              </label>
              <span className="text-[11px] text-orange-400/80 font-mono">Pacing Logic</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setPlanningMode('ai_auto');
                  setSceneCount('Auto');
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  planningMode === 'ai_auto'
                    ? 'bg-orange-950/40 border-orange-500/60 text-white shadow-md'
                    : 'bg-[#161b22] border-[#30363d] text-gray-400 hover:border-gray-600 hover:text-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                    AI Auto Planning (Recommended)
                  </span>
                  {planningMode === 'ai_auto' && <Check className="w-4 h-4 text-orange-400" />}
                </div>
                <p className="text-[11px] text-gray-400">
                  AI automatically computes optimal scene counts & dynamic scene durations based on narrative intensity.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPlanningMode('manual')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  planningMode === 'manual'
                    ? 'bg-purple-950/40 border-purple-500/60 text-white shadow-md'
                    : 'bg-[#161b22] border-[#30363d] text-gray-400 hover:border-gray-600 hover:text-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-purple-400" />
                    User Controlled Planning
                  </span>
                  {planningMode === 'manual' && <Check className="w-4 h-4 text-purple-400" />}
                </div>
                <p className="text-[11px] text-gray-400">
                  Manually set total duration, exact scene counts, and per-cut seconds.
                </p>
              </button>
            </div>

            {/* Conflict Detection Banner if manual planning discrepancy occurs */}
            {hasPlanningConflict && (
              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 space-y-2 text-xs text-amber-200 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Planning Discrepancy Detected</span>
                </div>
                <p className="text-[11px] text-amber-300/90 leading-relaxed">
                  Your configured {currentNumericScenes} scenes × {activeSceneSec}s = <strong>{calculatedProductSec} seconds</strong>, but Total Video Duration is set to <strong>{activeTotalSec} seconds</strong>.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSceneCount('Auto');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/50 text-[11px] font-semibold text-amber-200"
                  >
                    Auto-align scenes ({autoCalculatedScenes} scenes)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDuration(`${Math.round(calculatedProductSec / 60)} minutes` as VideoDuration);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-[11px] font-semibold text-gray-200"
                  >
                    Align total duration to {calculatedProductSec}s
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* STEP 4: Standard Creative Matrix */}
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
                <option value="Hindi">Hindi</option>
                <option value="English">English</option>
                <option value="Hinglish">Hinglish</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Japanese">Japanese</option>
                <option value="Gujarati">Gujarati</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* 4. Total Video Duration */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Total Video Duration
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

            {/* 5. Scene Duration (Per Scene) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-orange-400" />
                Scene Duration (Per Cut)
              </label>
              <select
                value={sceneDuration}
                onChange={(e) => setSceneDuration(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-red-500"
              >
                <option value="5 seconds">5 seconds / scene (Fast Paced)</option>
                <option value="10 seconds">10 seconds / scene (Standard AI Video)</option>
                <option value="15 seconds">15 seconds / scene (Cinematic Narrative)</option>
                <option value="20 seconds">20 seconds / scene (Extended Dialogue)</option>
                <option value="30 seconds">30 seconds / scene (Full Sequence)</option>
              </select>
            </div>

            {/* 6. Voice & Dialogue Mode */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                Dialogue & Voice Mode
              </label>
              <select
                value={voiceMode}
                onChange={(e) => {
                  const val = e.target.value;
                  setVoiceMode(val);
                  if (val === 'Narrator') setNarration('Narrator');
                  else if (val === 'Character Dialogue') setNarration('Character Dialogue');
                  else if (val === 'No Spoken Dialogue') setNarration('Narrator');
                  else setNarration('Both');
                }}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-red-500"
              >
                <option value="Narrator + Character Dialogue">Narrator + Character Dialogue</option>
                <option value="Character Dialogue">Character Dialogue Only</option>
                <option value="Narrator">Narrator Only</option>
                <option value="No Spoken Dialogue">No Spoken Dialogue (Music & Foley Only)</option>
              </select>
            </div>

            {/* 7. Video Format */}
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
                    setSceneDuration('5 seconds');
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

            {/* 8. Visual Style */}
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

            {/* 9. Tone */}
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

            {/* 10. Number of Scenes */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                  <Clapperboard className="w-3.5 h-3.5 text-emerald-400" />
                  Scene Count
                </label>
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                  {sceneCount === 'Auto' ? `${autoCalculatedScenes} Scenes (${activeSceneSec}s/ea)` : `${sceneCount} Scenes`}
                </span>
              </div>
              <select
                value={sceneCount}
                onChange={(e) => setSceneCount(e.target.value as SceneCountOption)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-red-500"
              >
                <option value="Auto">Auto ({autoCalculatedScenes} scenes based on {activeTotalSec}s total ÷ {activeSceneSec}s)</option>
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
                  max={60}
                  placeholder="e.g. 18"
                  value={customScenes}
                  onChange={(e) => setCustomScenes(e.target.value)}
                  className="w-full mt-1 bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                />
              )}
            </div>

            {/* 11. Aspect Ratio */}
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

            {/* Reusable Character Continuity Toggle */}
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
                    Locks persistent visual anchors & prompt triggers for all characters across every scene.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Optional Character Instructions */}
          {includeCharacters && (
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                Specific Character Instructions (Optional)
              </label>
              <input
                type="text"
                value={characterInstructions}
                onChange={(e) => setCharacterInstructions(e.target.value)}
                placeholder="e.g. Include a curious 8-year-old girl named Maya with braided hair and an orange jacket"
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
              />
            </div>
          )}

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
