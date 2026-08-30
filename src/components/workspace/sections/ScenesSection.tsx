'use client';

import React, { useState } from 'react';
import {
  Film,
  Clock,
  Video,
  Camera,
  Layers,
  Sparkles,
  Copy,
  RotateCw,
  Edit3,
  Save,
  X,
  Check,
  AlertCircle,
  Volume2,
  Music,
  MapPin,
  Compass,
  ArrowRight,
  Sun,
  User,
  Zap,
} from 'lucide-react';
import { YouTubeProject, SceneBreakdown } from '@/types/project';

interface ScenesSectionProps {
  project: YouTubeProject;
  onUpdateProject: (updated: YouTubeProject) => void;
}

export const ScenesSection: React.FC<ScenesSectionProps> = ({
  project,
  onUpdateProject,
}) => {
  const { scenes = [] } = project;
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isRegeneratingAll, setIsRegeneratingAll] = useState(false);
  const [regeneratingSceneNum, setRegeneratingSceneNum] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingSceneNum, setEditingSceneNum] = useState<number | null>(null);

  // Edit fields
  const [title, setTitle] = useState('');
  const [timeRange, setTimeRange] = useState('');
  const [durationSec, setDurationSec] = useState<number>(30);
  const [location, setLocation] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('');
  const [charactersPresent, setCharactersPresent] = useState('');
  const [actions, setActions] = useState('');
  const [environment, setEnvironment] = useState('');
  const [visualDescription, setVisualDescription] = useState('');
  const [dialogue, setDialogue] = useState('');
  const [narrator, setNarrator] = useState('');
  const [cameraMotion, setCameraMotion] = useState('');
  const [lightingMood, setLightingMood] = useState('');
  const [animation, setAnimation] = useState('');
  const [soundFx, setSoundFx] = useState('');
  const [music, setMusic] = useState('');
  const [transition, setTransition] = useState('');
  const [scenePurpose, setScenePurpose] = useState('');

  const totalCalculatedSeconds = scenes.reduce(
    (acc, s) => acc + (Number(s.durationSeconds) || 30),
    0
  );

  const formatTotalTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleCopyAll = () => {
    const text = scenes
      .map(
        (s) =>
          `SCENE ${s.sceneNumber}: ${s.title} (${s.timeRange || `${s.durationSeconds}s`})\nLOCATION: ${s.location} (${s.timeOfDay || 'Default'})\nCHARACTERS: ${Array.isArray(s.characters) ? s.characters.join(', ') : s.charactersPresent?.join(', ') || 'N/A'}\nACTION: ${s.characterActions}\nVISUAL: ${s.visualDescription || s.environment || 'N/A'}\nVOICEOVER: ${s.dialogueVoiceover || s.dialogue || s.narrator || 'N/A'}\nCAMERA: ${s.cameraAngleMotion || s.camera || 'N/A'}\nLIGHTING: ${s.lightingMood || s.lighting || 'N/A'}\nAUDIO: SFX [${s.soundEffects || 'N/A'}] | MUSIC [${s.music || s.musicCue || 'N/A'}]\nTRANSITION: ${s.transition || 'N/A'}`
      )
      .join('\n\n==============================\n\n');

    navigator.clipboard.writeText(`SCENE-BY-SCENE PRODUCTION BREAKDOWN (${project.idea})\n\n${text}`);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopyScene = (scene: SceneBreakdown, idx: number) => {
    const text = `SCENE ${scene.sceneNumber}: ${scene.title}\nTIME: ${scene.timeRange} (${scene.durationSeconds}s)\nLOCATION: ${scene.location}\nACTION: ${scene.characterActions}\nSPOKEN: ${scene.dialogueVoiceover || scene.dialogue || scene.narrator}\nCAMERA: ${scene.cameraAngleMotion}\nLIGHTING: ${scene.lightingMood}`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Regenerate ALL scenes
  const handleRegenerateAll = async () => {
    setIsRegeneratingAll(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/generate/scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: project.idea,
          settings: project.settings,
          concept: project.concept,
          hook: project.hook,
          script: project.script,
          characters: project.characters,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      if (!data?.scenes || !Array.isArray(data.scenes)) {
        throw new Error('Invalid scenes array returned from AI');
      }

      const newScenes: SceneBreakdown[] = data.scenes;

      // Update ONLY scenes, preserving Concept, Hook, Script, Characters, SEO, Thumbnail, Shorts
      const updated: YouTubeProject = {
        ...project,
        scenes: newScenes,
        updatedAt: new Date().toISOString(),
      };

      onUpdateProject(updated);
    } catch (err: any) {
      console.error('Failed to regenerate scene breakdown with AI:', err);
      setErrorMessage(
        err?.message || 'Failed to regenerate scene breakdown. Existing scenes have been preserved.'
      );
    } finally {
      setIsRegeneratingAll(false);
    }
  };

  // Regenerate an individual scene
  const handleRegenerateSingleScene = async (scene: SceneBreakdown) => {
    setRegeneratingSceneNum(scene.sceneNumber);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/generate/scene-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: project.idea,
          settings: project.settings,
          sceneNumber: scene.sceneNumber,
          existingScene: scene,
          allScenes: project.scenes,
          concept: project.concept,
          script: project.script,
          characters: project.characters,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      if (!data?.scene) {
        throw new Error('Invalid single scene returned from AI');
      }

      const newScene: SceneBreakdown = data.scene;

      // Replace ONLY this specific scene, preserving all other scenes and all project tabs
      const updatedScenes = scenes.map((s) =>
        s.sceneNumber === scene.sceneNumber ? newScene : s
      );

      const updated: YouTubeProject = {
        ...project,
        scenes: updatedScenes,
        updatedAt: new Date().toISOString(),
      };

      onUpdateProject(updated);
    } catch (err: any) {
      console.error(`Failed to regenerate Scene #${scene.sceneNumber}:`, err);
      setErrorMessage(
        err?.message || `Failed to regenerate Scene #${scene.sceneNumber}. Previous scene data preserved.`
      );
    } finally {
      setRegeneratingSceneNum(null);
    }
  };

  const startEdit = (scene: SceneBreakdown) => {
    setEditingSceneNum(scene.sceneNumber);
    setTitle(scene.title);
    setTimeRange(scene.timeRange || '');
    setDurationSec(scene.durationSeconds || 30);
    setLocation(scene.location);
    setTimeOfDay(scene.timeOfDay || '');
    setCharactersPresent(
      Array.isArray(scene.characters)
        ? scene.characters.join(', ')
        : scene.charactersPresent?.join(', ') || ''
    );
    setActions(scene.characterActions);
    setEnvironment(scene.environment || '');
    setVisualDescription(scene.visualDescription || '');
    setDialogue(scene.dialogue || scene.dialogueVoiceover || '');
    setNarrator(scene.narrator || '');
    setCameraMotion(scene.cameraAngleMotion || scene.camera || '');
    setLightingMood(scene.lightingMood || scene.lighting || '');
    setAnimation(scene.animation || scene.animationStyle || '');
    setSoundFx(scene.soundEffects || '');
    setMusic(scene.music || scene.musicCue || '');
    setTransition(scene.transition || '');
    setScenePurpose(scene.scenePurpose || '');
  };

  const saveEdit = (sceneNum: number) => {
    const charArray = charactersPresent
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const updatedScenes = scenes.map((s) => {
      if (s.sceneNumber === sceneNum) {
        return {
          ...s,
          title,
          timeRange,
          durationSeconds: durationSec,
          duration: `${durationSec}s`,
          location,
          timeOfDay: timeOfDay || undefined,
          characters: charArray,
          charactersPresent: charArray,
          characterActions: actions,
          environment: environment || undefined,
          visualDescription: visualDescription || undefined,
          dialogue,
          dialogueVoiceover: dialogue,
          narrator: narrator || undefined,
          cameraAngleMotion: cameraMotion,
          lightingMood,
          animation: animation || undefined,
          soundEffects: soundFx || undefined,
          music: music || undefined,
          musicCue: music || undefined,
          transition: transition || undefined,
          scenePurpose: scenePurpose || undefined,
        };
      }
      return s;
    });

    const updated: YouTubeProject = {
      ...project,
      scenes: updatedScenes,
      updatedAt: new Date().toISOString(),
    };
    onUpdateProject(updated);
    setEditingSceneNum(null);
  };

  return (
    <div className="space-y-6">
      {/* Error Alert if AI failed (Preserves previous content) */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/50 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-amber-400 hover:text-white text-xs underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-[#161b22] border border-[#30363d]">
        <div className="flex items-center gap-2 text-xs font-semibold text-pink-400 uppercase tracking-wider">
          <Film className="w-4 h-4" />
          Section 5: AI Scene-by-Scene Continuity Breakdown
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyAll}
            disabled={scenes.length === 0}
            className="px-3 py-1.5 rounded-lg bg-[#0d1117] border border-[#30363d] hover:border-gray-500 text-xs font-semibold text-gray-300 hover:text-white transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
            <span>{copiedAll ? 'Copied Breakdown!' : 'Copy Breakdown'}</span>
          </button>

          <button
            onClick={handleRegenerateAll}
            disabled={isRegeneratingAll}
            className="px-3 py-1.5 rounded-lg bg-[#0d1117] border border-[#30363d] hover:border-pink-500/50 text-xs font-semibold text-gray-300 hover:text-pink-400 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRegeneratingAll ? 'animate-spin text-pink-400' : 'text-gray-400'}`} />
            <span>{isRegeneratingAll ? 'Regenerating Scenes with AI...' : 'Regenerate Scene Breakdown'}</span>
          </button>
        </div>
      </div>

      {/* Overview Stats Bar */}
      <div className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">
              Production Timeline ({scenes.length} Scenes)
            </h2>
            <p className="text-xs text-gray-400">
              Synchronized shot sequence matching target duration of {project.settings.targetDuration || project.settings.duration} in {project.settings.visualStyle} aesthetic.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="bg-[#0d1117] px-3 py-1.5 rounded-lg border border-[#21262d] font-mono text-gray-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Runtime: {formatTotalTime(totalCalculatedSeconds)}
            </span>
            <span className="bg-[#0d1117] px-3 py-1.5 rounded-lg border border-[#21262d] font-mono text-gray-300">
              Target: {project.settings.targetScenesCount || project.settings.sceneCount || scenes.length} Scenes
            </span>
          </div>
        </div>
      </div>

      {/* Scenes List */}
      {scenes.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#161b22] border border-[#30363d] text-center space-y-3">
          <Film className="w-10 h-10 text-gray-600 mx-auto" />
          <p className="text-sm text-gray-400 font-medium">No scenes generated yet.</p>
          <button
            onClick={handleRegenerateAll}
            disabled={isRegeneratingAll}
            className="px-4 py-2 rounded-xl bg-pink-600 text-xs font-semibold text-white hover:bg-pink-500 transition-all"
          >
            {isRegeneratingAll ? 'Generating...' : 'Generate Scene Breakdown with AI'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {scenes.map((scene, idx) => {
            const isEditing = editingSceneNum === scene.sceneNumber;
            const isSingleRegenerating = regeneratingSceneNum === scene.sceneNumber;

            return (
              <div
                key={scene.sceneNumber || idx}
                className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d] space-y-5"
              >
                {/* Scene Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#21262d]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-pink-500/15 border border-pink-500/30 text-pink-300 font-bold text-xs flex items-center justify-center">
                      #{scene.sceneNumber}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-white">{scene.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-400 font-mono mt-0.5">
                        <span className="text-amber-400">{scene.timeRange}</span>
                        <span>•</span>
                        <span>{scene.durationSeconds}s duration</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyScene(scene, idx)}
                      className="px-2.5 py-1 rounded bg-[#0d1117] border border-[#30363d] hover:border-gray-500 text-xs text-gray-300 flex items-center gap-1"
                    >
                      {copiedIndex === idx ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-gray-400" />
                      )}
                      <span>{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
                    </button>

                    {/* Individual Scene Regenerate Button */}
                    <button
                      onClick={() => handleRegenerateSingleScene(scene)}
                      disabled={isSingleRegenerating || isRegeneratingAll}
                      title="Regenerate this specific scene with AI"
                      className="px-2.5 py-1 rounded bg-[#0d1117] border border-[#30363d] hover:border-pink-500/50 text-xs text-gray-300 hover:text-pink-400 flex items-center gap-1 disabled:opacity-50 transition-all"
                    >
                      <RotateCw className={`w-3 h-3 ${isSingleRegenerating ? 'animate-spin text-pink-400' : 'text-gray-400'}`} />
                      <span>{isSingleRegenerating ? 'Regenerating...' : 'Regenerate Scene'}</span>
                    </button>

                    {!isEditing ? (
                      <button
                        onClick={() => startEdit(scene)}
                        className="px-2.5 py-1 rounded bg-[#0d1117] border border-[#30363d] hover:border-gray-500 text-xs text-gray-300 flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setEditingSceneNum(null)}
                          className="px-2.5 py-1 rounded bg-[#21262d] text-xs text-gray-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => saveEdit(scene.sceneNumber)}
                          className="px-2.5 py-1 rounded bg-emerald-600 text-xs font-bold text-white flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" /> Save
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Scene Title</label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-pink-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Time Range</label>
                        <input
                          type="text"
                          value={timeRange}
                          onChange={(e) => setTimeRange(e.target.value)}
                          className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-pink-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Duration (Seconds)</label>
                        <input
                          type="number"
                          value={durationSec}
                          onChange={(e) => setDurationSec(Number(e.target.value))}
                          className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-pink-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Location</label>
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-pink-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Time of Day</label>
                        <input
                          type="text"
                          value={timeOfDay}
                          onChange={(e) => setTimeOfDay(e.target.value)}
                          className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-pink-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Characters Present</label>
                        <input
                          type="text"
                          value={charactersPresent}
                          onChange={(e) => setCharactersPresent(e.target.value)}
                          className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-pink-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-purple-400 block mb-1">Character Actions & Blocking</label>
                      <textarea
                        rows={2}
                        value={actions}
                        onChange={(e) => setActions(e.target.value)}
                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">Spoken Dialogue / Narration</label>
                      <textarea
                        rows={2}
                        value={dialogue}
                        onChange={(e) => setDialogue(e.target.value)}
                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-blue-400 block mb-1">Camera Angle & Motion</label>
                        <input
                          type="text"
                          value={cameraMotion}
                          onChange={(e) => setCameraMotion(e.target.value)}
                          className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-amber-400 block mb-1">Lighting & Mood</label>
                        <input
                          type="text"
                          value={lightingMood}
                          onChange={(e) => setLightingMood(e.target.value)}
                          className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-rose-400 block mb-1">Sound Effects (SFX)</label>
                        <input
                          type="text"
                          value={soundFx}
                          onChange={(e) => setSoundFx(e.target.value)}
                          className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-rose-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-rose-400 block mb-1">Music Cue</label>
                        <input
                          type="text"
                          value={music}
                          onChange={(e) => setMusic(e.target.value)}
                          className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-rose-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Scene Transition</label>
                        <input
                          type="text"
                          value={transition}
                          onChange={(e) => setTransition(e.target.value)}
                          className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-gray-500"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Location & Characters Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[#0d1117] border border-[#21262d] text-xs">
                      <div className="flex items-center gap-2 text-gray-200">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="font-semibold">{scene.location}</span>
                        {scene.timeOfDay && (
                          <span className="text-gray-400 font-mono text-[11px]">
                            ({scene.timeOfDay})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-gray-300">
                        <User className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-purple-300 font-medium">
                          {Array.isArray(scene.characters) && scene.characters.length > 0
                            ? scene.characters.join(', ')
                            : scene.charactersPresent?.join(', ') || 'No recurring cast'}
                        </span>
                      </div>
                    </div>

                    {/* Character Actions & Visual Description */}
                    <div className="p-3.5 rounded-xl bg-[#0d1117] border border-[#21262d] text-xs space-y-1.5">
                      <span className="text-[10px] font-bold uppercase text-purple-400 block">
                        Character Actions & Visual Staging
                      </span>
                      <p className="text-gray-200 leading-relaxed">{scene.characterActions}</p>
                      {scene.visualDescription && (
                        <p className="text-gray-400 text-[11px] pt-1 border-t border-[#21262d]">
                          {scene.visualDescription}
                        </p>
                      )}
                    </div>

                    {/* Spoken Dialogue / Voiceover */}
                    <div className="p-4 rounded-xl bg-[#090c10] border border-[#21262d] space-y-1.5">
                      <span className="text-[10px] font-bold uppercase text-emerald-400 flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5" /> Dialogue & Voiceover ({project.settings.language})
                      </span>
                      <p className="text-sm text-gray-100 font-medium leading-relaxed">
                        {scene.dialogueVoiceover || scene.dialogue || scene.narrator}
                      </p>
                    </div>

                    {/* Technical Specs: Camera, Lighting, Audio, Transition */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                      <div className="p-2.5 rounded-lg bg-[#0d1117] border border-[#21262d]">
                        <span className="text-[10px] font-bold uppercase text-blue-400 flex items-center gap-1 mb-0.5">
                          <Camera className="w-3 h-3" /> Camera Motion
                        </span>
                        <p className="text-gray-300 text-[11px]">{scene.cameraAngleMotion || scene.camera}</p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-[#0d1117] border border-[#21262d]">
                        <span className="text-[10px] font-bold uppercase text-amber-400 flex items-center gap-1 mb-0.5">
                          <Sun className="w-3 h-3" /> Lighting Mood
                        </span>
                        <p className="text-gray-300 text-[11px]">{scene.lightingMood || scene.lighting}</p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-[#0d1117] border border-[#21262d]">
                        <span className="text-[10px] font-bold uppercase text-rose-400 flex items-center gap-1 mb-0.5">
                          <Music className="w-3 h-3" /> Audio / SFX
                        </span>
                        <p className="text-gray-300 text-[11px]">
                          {scene.soundEffects || scene.music || scene.musicCue || 'Atmospheric score'}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-[#0d1117] border border-[#21262d]">
                        <span className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1 mb-0.5">
                          <ArrowRight className="w-3 h-3" /> Transition
                        </span>
                        <p className="text-gray-300 text-[11px]">{scene.transition || 'Cut to next scene'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
