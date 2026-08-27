'use client';

import React, { useState } from 'react';
import {
  Video,
  Copy,
  Check,
  RotateCw,
  Edit3,
  Save,
  X,
  Sparkles,
  Layers,
  Camera,
  Cpu,
  ShieldCheck,
  Zap,
  AlertCircle,
  Volume2,
  Music,
  Sun,
  ChevronDown,
  ChevronUp,
  Sliders,
  Maximize2,
  Flame,
} from 'lucide-react';
import {
  YouTubeProject,
  SceneVideoPrompt,
  ModelSpecificPrompts,
} from '@/types/project';
import {
  generateVideoPromptsForProject,
  saveProject,
} from '@/lib/storage/projectStore';

interface VideoPromptsSectionProps {
  project: YouTubeProject;
  onUpdateProject: (updated: YouTubeProject) => void;
}

type ModelViewFilter = 'all' | 'veo' | 'runway' | 'kling' | 'luma' | 'sora';

export const VideoPromptsSection: React.FC<VideoPromptsSectionProps> = ({
  project,
  onUpdateProject,
}) => {
  const { scenes = [], characters = [] } = project;

  // Initialize prompts from project or generate if not yet created
  const videoPrompts: SceneVideoPrompt[] =
    project.videoPrompts && project.videoPrompts.length > 0
      ? project.videoPrompts
      : generateVideoPromptsForProject(
          project.idea,
          project.settings,
          scenes,
          characters
        );

  const [activeModelFilter, setActiveModelFilter] = useState<ModelViewFilter>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isRegeneratingAll, setIsRegeneratingAll] = useState(false);
  const [regeneratingSceneNum, setRegeneratingSceneNum] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedScenes, setExpandedScenes] = useState<Record<number, boolean>>({});
  const [activeSceneTab, setActiveSceneTab] = useState<Record<number, string>>({});

  // Editing state
  const [editingSceneNum, setEditingSceneNum] = useState<number | null>(null);
  const [editFinalPrompt, setEditFinalPrompt] = useState('');
  const [editCharConsistency, setEditCharConsistency] = useState('');
  const [editAction, setEditAction] = useState('');
  const [editEnvironment, setEditEnvironment] = useState('');
  const [editCamera, setEditCamera] = useState('');
  const [editLighting, setEditLighting] = useState('');
  const [editVeo, setEditVeo] = useState('');
  const [editRunway, setEditRunway] = useState('');
  const [editKling, setEditKling] = useState('');
  const [editLuma, setEditLuma] = useState('');
  const [editSora, setEditSora] = useState('');

  const toggleExpand = (sceneNum: number) => {
    setExpandedScenes((prev) => ({
      ...prev,
      [sceneNum]: !prev[sceneNum],
    }));
  };

  const getSceneTab = (sceneNum: number) => {
    return activeSceneTab[sceneNum] || 'master';
  };

  const setSceneTab = (sceneNum: number, tab: string) => {
    setActiveSceneTab((prev) => ({
      ...prev,
      [sceneNum]: tab,
    }));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAll = () => {
    let formattedText = '';

    if (activeModelFilter === 'veo') {
      formattedText = videoPrompts
        .map((p) => `// SCENE ${p.sceneNumber} (${p.title}) — GOOGLE VEO:\n${p.modelPrompts?.veo || p.finalPrompt}`)
        .join('\n\n---\n\n');
    } else if (activeModelFilter === 'runway') {
      formattedText = videoPrompts
        .map((p) => `// SCENE ${p.sceneNumber} (${p.title}) — RUNWAY GEN-3:\n${p.modelPrompts?.runway || p.finalPrompt}`)
        .join('\n\n---\n\n');
    } else if (activeModelFilter === 'kling') {
      formattedText = videoPrompts
        .map((p) => `// SCENE ${p.sceneNumber} (${p.title}) — KLING AI:\n${p.modelPrompts?.kling || p.finalPrompt}`)
        .join('\n\n---\n\n');
    } else if (activeModelFilter === 'luma') {
      formattedText = videoPrompts
        .map((p) => `// SCENE ${p.sceneNumber} (${p.title}) — LUMA DREAM MACHINE:\n${p.modelPrompts?.luma || p.finalPrompt}`)
        .join('\n\n---\n\n');
    } else if (activeModelFilter === 'sora') {
      formattedText = videoPrompts
        .map((p) => `// SCENE ${p.sceneNumber} (${p.title}) — OPENAI SORA:\n${p.modelPrompts?.sora || p.finalPrompt}`)
        .join('\n\n---\n\n');
    } else {
      formattedText = videoPrompts
        .map(
          (p) =>
            `========================================\nSCENE ${p.sceneNumber}: ${p.title} (${p.duration}, ${p.aspectRatio})\nVISUAL STYLE: ${p.visualStyle}\n========================================\n\nMASTER PROMPT:\n${p.finalPrompt}\n\nCHARACTER CONSISTENCY (LOCKED):\n${p.characterConsistencyDescription}\n\nTECHNICAL PARAMETERS:\n- Camera: ${p.cameraShot} | ${p.cameraMovement} | ${p.lensFraming}\n- Lighting: ${p.lighting} | ${p.atmosphere}\n- Action: ${p.action}\n- Facial Expressions: ${p.facialExpressions}\n- Environment: ${p.environment}\n- Audio/Dialogue: ${p.dialogue} (${p.voiceAudio})\n- SFX & Music: ${p.soundEffects} | ${p.music}\n- Negative Prompt: ${p.negativePrompt}\n\nMODEL-SPECIFIC PROMPTS:\n• Google Veo: ${p.modelPrompts?.veo}\n• Runway Gen-3: ${p.modelPrompts?.runway}\n• Kling AI: ${p.modelPrompts?.kling}\n• Luma Dream Machine: ${p.modelPrompts?.luma}\n• OpenAI Sora: ${p.modelPrompts?.sora}`
        )
        .join('\n\n\n');
    }

    navigator.clipboard.writeText(
      `AI VIDEO PROMPTS PRODUCTION SPECIFICATION\nProject: ${project.idea}\nVisual Style: ${project.settings.visualStyle}\nAspect Ratio: ${project.settings.aspectRatio || '16:9'}\n\n${formattedText}`
    );
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Regenerate ALL video prompts with Real AI
  const handleRegenerateAll = async () => {
    setIsRegeneratingAll(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/generate/video-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: project.idea,
          settings: project.settings,
          concept: project.concept,
          hook: project.hook,
          script: project.script,
          characters: project.characters || [],
          scenes: project.scenes || [],
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      if (data.prompts && Array.isArray(data.prompts) && data.prompts.length > 0) {
        const updatedScenes = scenes.map((s) => {
          const match = data.prompts.find((p: SceneVideoPrompt) => p.sceneNumber === s.sceneNumber);
          if (match) {
            return {
              ...s,
              aiVideoPrompt: match.finalPrompt,
              characterLockedPrompt: match.characterConsistencyDescription,
            };
          }
          return s;
        });

        const updated: YouTubeProject = {
          ...project,
          scenes: updatedScenes,
          videoPrompts: data.prompts,
          updatedAt: new Date().toISOString(),
        };

        onUpdateProject(updated);
        saveProject(updated);
      } else {
        throw new Error('Received invalid video prompts from AI engine.');
      }
    } catch (err: any) {
      console.warn('API generation failed, applying robust fallback prompt generation:', err?.message);
      // Non-destructive fallback
      const fallbackPrompts = generateVideoPromptsForProject(
        project.idea,
        project.settings,
        scenes,
        characters
      );

      const updated: YouTubeProject = {
        ...project,
        videoPrompts: fallbackPrompts,
        updatedAt: new Date().toISOString(),
      };

      onUpdateProject(updated);
      saveProject(updated);
      setErrorMessage(
        'AI generation server note: Applied deterministic fallback prompts. Your prompts are ready to use.'
      );
    } finally {
      setIsRegeneratingAll(false);
    }
  };

  // Regenerate INDIVIDUAL scene prompt with Real AI
  const handleRegenerateSinglePrompt = async (sceneNum: number) => {
    setRegeneratingSceneNum(sceneNum);
    setErrorMessage(null);

    const existingPrompt = videoPrompts.find((p) => p.sceneNumber === sceneNum);

    try {
      const res = await fetch('/api/generate/video-prompt-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: project.idea,
          settings: project.settings,
          sceneNumber: sceneNum,
          existingPrompt,
          allPrompts: videoPrompts,
          concept: project.concept,
          script: project.script,
          characters: project.characters || [],
          scenes: project.scenes || [],
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to regenerate prompt`);
      }

      const data = await res.json();
      if (data.prompt) {
        const fresh: SceneVideoPrompt = data.prompt;
        const nextPrompts = videoPrompts.map((p) => (p.sceneNumber === sceneNum ? fresh : p));

        const updatedScenes = scenes.map((s) => {
          if (s.sceneNumber === sceneNum) {
            return {
              ...s,
              aiVideoPrompt: fresh.finalPrompt,
              characterLockedPrompt: fresh.characterConsistencyDescription,
            };
          }
          return s;
        });

        const updated: YouTubeProject = {
          ...project,
          scenes: updatedScenes,
          videoPrompts: nextPrompts,
          updatedAt: new Date().toISOString(),
        };

        onUpdateProject(updated);
        saveProject(updated);
      } else {
        throw new Error('Invalid prompt returned from server.');
      }
    } catch (err: any) {
      console.warn('Single scene prompt AI regeneration error:', err?.message);
      // Non-destructive: generate single deterministic fallback
      const fallbackList = generateVideoPromptsForProject(
        project.idea,
        project.settings,
        scenes,
        characters
      );
      const fallbackPrompt = fallbackList.find((p) => p.sceneNumber === sceneNum) || fallbackList[0];

      const nextPrompts = videoPrompts.map((p) =>
        p.sceneNumber === sceneNum ? { ...fallbackPrompt, sceneNumber: sceneNum } : p
      );

      const updated: YouTubeProject = {
        ...project,
        videoPrompts: nextPrompts,
        updatedAt: new Date().toISOString(),
      };

      onUpdateProject(updated);
      saveProject(updated);
      setErrorMessage(`Scene #${sceneNum} prompt updated via deterministic fallback.`);
    } finally {
      setRegeneratingSceneNum(null);
    }
  };

  const startEdit = (prompt: SceneVideoPrompt) => {
    setEditingSceneNum(prompt.sceneNumber);
    setEditFinalPrompt(prompt.finalPrompt);
    setEditCharConsistency(prompt.characterConsistencyDescription);
    setEditAction(prompt.action);
    setEditEnvironment(prompt.environment);
    setEditCamera(prompt.cameraMovement || prompt.cameraShot);
    setEditLighting(prompt.lighting);
    setEditVeo(prompt.modelPrompts?.veo || prompt.finalPrompt);
    setEditRunway(prompt.modelPrompts?.runway || prompt.finalPrompt);
    setEditKling(prompt.modelPrompts?.kling || prompt.finalPrompt);
    setEditLuma(prompt.modelPrompts?.luma || prompt.finalPrompt);
    setEditSora(prompt.modelPrompts?.sora || prompt.finalPrompt);
  };

  const saveEdit = (sceneNumber: number) => {
    const updatedPrompts = videoPrompts.map((p) => {
      if (p.sceneNumber === sceneNumber) {
        const modelPrompts: ModelSpecificPrompts = {
          veo: editVeo,
          runway: editRunway,
          kling: editKling,
          luma: editLuma,
          sora: editSora,
        };

        return {
          ...p,
          finalPrompt: editFinalPrompt,
          characterConsistencyDescription: editCharConsistency,
          action: editAction,
          environment: editEnvironment,
          cameraMovement: editCamera,
          lighting: editLighting,
          modelPrompts,
        };
      }
      return p;
    });

    const updatedScenes = scenes.map((s) => {
      if (s.sceneNumber === sceneNumber) {
        return {
          ...s,
          aiVideoPrompt: editFinalPrompt,
          characterLockedPrompt: editCharConsistency,
        };
      }
      return s;
    });

    const updated: YouTubeProject = {
      ...project,
      scenes: updatedScenes,
      videoPrompts: updatedPrompts,
      updatedAt: new Date().toISOString(),
    };

    onUpdateProject(updated);
    saveProject(updated);
    setEditingSceneNum(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Action & Sub-Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl bg-[#161b22] border border-[#30363d] gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                Section 6: AI Video Prompts Studio
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 border border-purple-500/30 text-purple-300 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Locked Character Consistency
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Production-ready multi-model prompts with camera, lighting, and physics choreography.
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={handleCopyAll}
            className="px-3.5 py-1.5 rounded-lg bg-[#0d1117] border border-[#30363d] hover:border-gray-500 text-xs font-semibold text-gray-200 hover:text-white transition-all flex items-center gap-1.5"
            title="Copy all prompts in the active filter format"
          >
            {copiedAll ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-gray-400" />
            )}
            <span>{copiedAll ? 'Copied All!' : 'Copy All Prompts'}</span>
          </button>

          <button
            onClick={handleRegenerateAll}
            disabled={isRegeneratingAll}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-xs font-bold text-white transition-all flex items-center gap-2 shadow-lg shadow-cyan-900/30 disabled:opacity-50"
          >
            <RotateCw
              className={`w-3.5 h-3.5 ${
                isRegeneratingAll ? 'animate-spin text-white' : 'text-cyan-200'
              }`}
            />
            <span>{isRegeneratingAll ? 'Regenerating AI Prompts...' : 'Regenerate All Prompts'}</span>
          </button>
        </div>
      </div>

      {/* Model Filter Pills */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-[#0d1117] border border-[#21262d] overflow-x-auto gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-gray-400 px-2 uppercase tracking-wider flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            Model View:
          </span>
          {[
            { id: 'all', label: 'All Specs & Formats' },
            { id: 'veo', label: 'Google Veo' },
            { id: 'runway', label: 'Runway Gen-3' },
            { id: 'kling', label: 'Kling AI' },
            { id: 'luma', label: 'Luma Dream Machine' },
            { id: 'sora', label: 'OpenAI Sora' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveModelFilter(m.id as ModelViewFilter)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeModelFilter === m.id
                  ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 shadow-sm shadow-cyan-950'
                  : 'bg-[#161b22] border border-[#30363d] text-gray-400 hover:text-gray-200 hover:border-gray-600'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-2 text-[11px] text-gray-400 font-mono">
          <span className="px-2 py-0.5 rounded bg-[#161b22] border border-[#30363d] text-cyan-300">
            {videoPrompts.length} Scenes
          </span>
          <span className="px-2 py-0.5 rounded bg-[#161b22] border border-[#30363d] text-purple-300">
            {project.settings.visualStyle}
          </span>
          <span className="px-2 py-0.5 rounded bg-[#161b22] border border-[#30363d] text-amber-300">
            {project.settings.aspectRatio || '16:9'}
          </span>
        </div>
      </div>

      {/* Error / Status Alert */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-amber-300 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="p-1 hover:bg-amber-500/20 rounded text-amber-400"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Prompts Cards List */}
      <div className="space-y-5">
        {videoPrompts.map((prompt) => {
          const sceneNum = prompt.sceneNumber;
          const isEditing = editingSceneNum === sceneNum;
          const isRegen = regeneratingSceneNum === sceneNum;
          const isExpanded = expandedScenes[sceneNum] ?? true;
          const currentTab = getSceneTab(sceneNum);

          const sceneRef = scenes.find((s) => s.sceneNumber === sceneNum);

          return (
            <div
              key={sceneNum}
              className={`p-5 rounded-2xl bg-[#161b22] border transition-all ${
                isEditing
                  ? 'border-cyan-500/60 shadow-lg shadow-cyan-950/40'
                  : 'border-[#30363d] hover:border-[#484f58]'
              } space-y-4`}
            >
              {/* Scene Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#21262d]">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="px-2.5 py-1 rounded-md text-xs font-black bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 tracking-wide">
                    SCENE #{sceneNum}
                  </span>
                  <h3 className="font-bold text-sm text-white">{prompt.title}</h3>
                  <span className="text-xs text-gray-400 font-mono">
                    ({prompt.duration} • {prompt.aspectRatio})
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-300">
                    {prompt.visualStyle}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const textToCopy =
                        currentTab === 'veo'
                          ? prompt.modelPrompts?.veo
                          : currentTab === 'runway'
                          ? prompt.modelPrompts?.runway
                          : currentTab === 'kling'
                          ? prompt.modelPrompts?.kling
                          : currentTab === 'luma'
                          ? prompt.modelPrompts?.luma
                          : currentTab === 'sora'
                          ? prompt.modelPrompts?.sora
                          : prompt.finalPrompt;
                      handleCopy(textToCopy || prompt.finalPrompt, `prompt-${sceneNum}`);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-xs font-semibold text-gray-200 transition-colors"
                  >
                    {copiedId === `prompt-${sceneNum}` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-gray-400" />
                        <span>Copy Prompt</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleRegenerateSinglePrompt(sceneNum)}
                    disabled={isRegen || isRegeneratingAll}
                    className="px-2.5 py-1.5 rounded-lg bg-[#0d1117] border border-[#30363d] hover:border-cyan-500/50 text-xs font-semibold text-gray-300 hover:text-cyan-400 transition-all flex items-center gap-1.5 disabled:opacity-50"
                    title={`Regenerate Scene #${sceneNum} AI prompt only`}
                  >
                    <RotateCw
                      className={`w-3.5 h-3.5 ${
                        isRegen ? 'animate-spin text-cyan-400' : 'text-gray-400'
                      }`}
                    />
                    <span>{isRegen ? 'Regenerating...' : 'Regen Scene'}</span>
                  </button>

                  {!isEditing ? (
                    <button
                      onClick={() => startEdit(prompt)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#0d1117] border border-[#30363d] hover:border-gray-500 text-xs font-semibold text-gray-300 hover:text-white flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingSceneNum(null)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#21262d] text-xs font-medium text-gray-300 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => saveEdit(sceneNum)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1"
                      >
                        <Save className="w-3 h-3" /> Save
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => toggleExpand(sceneNum)}
                    className="p-1.5 rounded-lg bg-[#0d1117] border border-[#30363d] text-gray-400 hover:text-gray-200"
                    title="Toggle Technical Details"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Locked Character Consistency Banner for the scene */}
              <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 flex items-start gap-2.5">
                <div className="p-1 rounded bg-purple-500/20 text-purple-400 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                      Locked Character Consistency Profile Anchor
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono">
                      Strict Fidelity
                    </span>
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editCharConsistency}
                      onChange={(e) => setEditCharConsistency(e.target.value)}
                      className="w-full bg-[#0d1117] border border-[#30363d] rounded p-1.5 text-xs text-purple-200 font-mono focus:outline-none focus:border-purple-500 mt-1"
                    />
                  ) : (
                    <p className="text-xs text-purple-200/90 font-mono leading-relaxed">
                      {prompt.characterConsistencyDescription}
                    </p>
                  )}
                </div>
              </div>

              {/* Edit Mode View */}
              {isEditing ? (
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider block mb-1">
                      Master AI Video Prompt
                    </label>
                    <textarea
                      rows={3}
                      value={editFinalPrompt}
                      onChange={(e) => setEditFinalPrompt(e.target.value)}
                      className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-xs font-mono text-cyan-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                        Scene Action
                      </label>
                      <input
                        type="text"
                        value={editAction}
                        onChange={(e) => setEditAction(e.target.value)}
                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                        Environment & Lighting
                      </label>
                      <input
                        type="text"
                        value={editEnvironment}
                        onChange={(e) => setEditEnvironment(e.target.value)}
                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#21262d]">
                    <span className="text-[11px] font-bold text-gray-300 block">
                      Dedicated Model Specific Prompts
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-cyan-400 uppercase block mb-0.5">
                          Google Veo Prompt
                        </label>
                        <textarea
                          rows={2}
                          value={editVeo}
                          onChange={(e) => setEditVeo(e.target.value)}
                          className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-[11px] font-mono text-gray-200"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-emerald-400 uppercase block mb-0.5">
                          Runway Gen-3 Prompt
                        </label>
                        <textarea
                          rows={2}
                          value={editRunway}
                          onChange={(e) => setEditRunway(e.target.value)}
                          className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-[11px] font-mono text-gray-200"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-amber-400 uppercase block mb-0.5">
                          Kling AI Prompt
                        </label>
                        <textarea
                          rows={2}
                          value={editKling}
                          onChange={(e) => setEditKling(e.target.value)}
                          className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-[11px] font-mono text-gray-200"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-rose-400 uppercase block mb-0.5">
                          OpenAI Sora Prompt
                        </label>
                        <textarea
                          rows={2}
                          value={editSora}
                          onChange={(e) => setEditSora(e.target.value)}
                          className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-[11px] font-mono text-gray-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Interactive Display View */
                <div className="space-y-4">
                  {/* Model Selector Tabs for Individual Card */}
                  <div className="flex items-center gap-1.5 border-b border-[#21262d] pb-2 overflow-x-auto">
                    {[
                      { id: 'master', label: 'Master Prompt' },
                      { id: 'veo', label: 'Google Veo' },
                      { id: 'runway', label: 'Runway Gen-3' },
                      { id: 'kling', label: 'Kling AI' },
                      { id: 'luma', label: 'Luma Dream' },
                      { id: 'sora', label: 'OpenAI Sora' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setSceneTab(sceneNum, tab.id)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                          currentTab === tab.id
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-[#21262d]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Prompt Text Box */}
                  <div className="p-4 rounded-xl bg-[#090c10] border border-[#21262d] relative group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        {currentTab === 'master'
                          ? 'Master Complete Video Prompt'
                          : currentTab === 'veo'
                          ? 'Google Veo Formatted Prompt'
                          : currentTab === 'runway'
                          ? 'Runway Gen-3 Formatted Prompt'
                          : currentTab === 'kling'
                          ? 'Kling AI Master Descriptor'
                          : currentTab === 'luma'
                          ? 'Luma Dream Machine Dynamic Keyframe'
                          : 'OpenAI Sora Cinematic Narrative Prompt'}
                      </span>

                      <button
                        onClick={() => {
                          const val =
                            currentTab === 'veo'
                              ? prompt.modelPrompts?.veo
                              : currentTab === 'runway'
                              ? prompt.modelPrompts?.runway
                              : currentTab === 'kling'
                              ? prompt.modelPrompts?.kling
                              : currentTab === 'luma'
                              ? prompt.modelPrompts?.luma
                              : currentTab === 'sora'
                              ? prompt.modelPrompts?.sora
                              : prompt.finalPrompt;
                          handleCopy(val || prompt.finalPrompt, `tab-${sceneNum}-${currentTab}`);
                        }}
                        className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#21262d] transition-colors"
                        title="Copy this specific prompt"
                      >
                        {copiedId === `tab-${sceneNum}-${currentTab}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-cyan-100 font-mono leading-relaxed select-all">
                      {currentTab === 'veo'
                        ? prompt.modelPrompts?.veo || prompt.finalPrompt
                        : currentTab === 'runway'
                        ? prompt.modelPrompts?.runway || prompt.finalPrompt
                        : currentTab === 'kling'
                        ? prompt.modelPrompts?.kling || prompt.finalPrompt
                        : currentTab === 'luma'
                        ? prompt.modelPrompts?.luma || prompt.finalPrompt
                        : currentTab === 'sora'
                        ? prompt.modelPrompts?.sora || prompt.finalPrompt
                        : prompt.finalPrompt}
                    </p>
                  </div>

                  {/* 23-Point Parameter Breakdown (Collapsible) */}
                  {isExpanded && (
                    <div className="pt-2 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                        {/* Environment & Atmosphere */}
                        <div className="p-3 rounded-xl bg-[#0d1117] border border-[#21262d] space-y-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            Environment & Atmosphere
                          </span>
                          <p className="text-gray-200 text-[11px] leading-snug">
                            {prompt.environment}
                          </p>
                          <p className="text-gray-400 text-[10px] italic">
                            Atmosphere: {prompt.atmosphere}
                          </p>
                        </div>

                        {/* Action, Facial Expressions & Body Movement */}
                        <div className="p-3 rounded-xl bg-[#0d1117] border border-[#21262d] space-y-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            Action & Choreography
                          </span>
                          <p className="text-gray-200 text-[11px] leading-snug">
                            {prompt.action}
                          </p>
                          <p className="text-gray-400 text-[10px]">
                            Expressions: {prompt.facialExpressions}
                          </p>
                          <p className="text-gray-400 text-[10px]">
                            Movement: {prompt.bodyMovement}
                          </p>
                        </div>

                        {/* Camera Shot, Motion & Lens Framing */}
                        <div className="p-3 rounded-xl bg-[#0d1117] border border-[#21262d] space-y-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            Camera & Lens
                          </span>
                          <p className="text-cyan-300 font-semibold text-[11px]">
                            {prompt.cameraShot}
                          </p>
                          <p className="text-gray-300 text-[11px]">
                            Motion: {prompt.cameraMovement}
                          </p>
                          <p className="text-gray-400 text-[10px] font-mono">
                            Lens: {prompt.lensFraming}
                          </p>
                        </div>

                        {/* Lighting Setup */}
                        <div className="p-3 rounded-xl bg-[#0d1117] border border-[#21262d] space-y-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block flex items-center gap-1">
                            <Sun className="w-3 h-3 text-amber-400" />
                            Lighting Mood
                          </span>
                          <p className="text-amber-200 text-[11px] leading-snug">
                            {prompt.lighting}
                          </p>
                        </div>

                        {/* Animation Style & Physics */}
                        <div className="p-3 rounded-xl bg-[#0d1117] border border-[#21262d] space-y-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            Animation & Physics
                          </span>
                          <p className="text-gray-300 text-[11px]">
                            Style: {prompt.animationStyle}
                          </p>
                          <p className="text-gray-400 text-[10px]">
                            Physics: {prompt.physicsMotion}
                          </p>
                        </div>

                        {/* Audio, Dialogue & SFX */}
                        <div className="p-3 rounded-xl bg-[#0d1117] border border-[#21262d] space-y-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block flex items-center gap-1">
                            <Volume2 className="w-3 h-3 text-cyan-400" />
                            Dialogue & Audio Cues
                          </span>
                          {prompt.dialogue && (
                            <p className="text-emerald-300 text-[11px] font-mono italic">
                              "{prompt.dialogue}"
                            </p>
                          )}
                          <p className="text-gray-400 text-[10px]">
                            SFX: {prompt.soundEffects}
                          </p>
                          <p className="text-gray-400 text-[10px]">
                            Music: {prompt.music}
                          </p>
                        </div>
                      </div>

                      {/* Transition & Negative Prompt Footer */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        <div className="p-2.5 rounded-lg bg-[#090c10] border border-[#21262d] flex items-center justify-between text-xs">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">
                            Transition
                          </span>
                          <span className="text-[11px] font-mono text-cyan-300">
                            {prompt.transition}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#090c10] border border-[#21262d] text-xs space-y-0.5">
                          <span className="text-[10px] font-bold text-rose-400 uppercase block">
                            Negative Prompt
                          </span>
                          <p className="text-[10px] font-mono text-rose-300/80 line-clamp-1">
                            {prompt.negativePrompt}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
