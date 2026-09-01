'use client';

import React, { useState } from 'react';
import {
  Smartphone,
  Sparkles,
  Flame,
  Clock,
  Play,
  MessageSquare,
  Copy,
  Check,
  RotateCw,
  Edit3,
  Save,
  X,
  Music,
  Hash,
  Layers,
  Users,
  Repeat,
  FileText,
  Volume2,
} from 'lucide-react';
import { YouTubeProject, ShortScript, ShortsData } from '@/types/project';
import {
  generateShortsForProject,
  regenerateSingleShort,
  saveProject,
} from '@/lib/storage/projectStore';

interface ShortsSectionProps {
  project: YouTubeProject;
  onUpdateProject: (updated: YouTubeProject) => void;
}

export const ShortsSection: React.FC<ShortsSectionProps> = ({
  project,
  onUpdateProject,
}) => {
  const { shorts } = project;
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [editingShortIndex, setEditingShortIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ShortScript | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const scripts: ShortScript[] =
    shorts?.scripts && shorts.scripts.length > 0
      ? shorts.scripts
      : generateShortsForProject(project.idea, project.settings, project.characters, project.scenes).scripts;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAllShorts = () => {
    const combined = scripts
      .map((s, idx) => {
        const beats = (s.visualBeats || [])
          .map(
            (b) =>
              `  [${b.second}] Visual: ${b.visual}\n  Audio: "${b.audioNarration}"\n  Caption: ${b.onScreenCaption}`
          )
          .join('\n\n');

        return `=== SHORT #${idx + 1}: ${s.shortTitle || s.title} (${s.duration || s.targetDuration || '45s'}) ===
HOOK (0-3s): "${s.hook}"

FULL SPOKEN SCRIPT:
${s.script || s.hook}

TIMELINE BEATS:
${beats}

ADAPTED SCENES: ${s.sceneSelection?.join(', ') || 'Scenes from long form'}
CHARACTERS: ${s.characters?.join(', ') || 'Main Characters'}
CTA: ${s.callToAction || s.CTA || 'Subscribe!'}
CAPTION: ${s.shortDescription || ''}
HASHTAGS: ${s.hashtags?.join(' ') || '#Shorts #Viral'}`;
      })
      .join('\n\n========================================\n\n');

    handleCopy(combined, 'all_shorts');
  };

  const handleGenerateAllAI = async () => {
    setIsGeneratingAll(true);
    setStatusMessage('Generating 3 vertical Shorts scripts derived from long-form content...');

    try {
      const res = await fetch('/api/generate/shorts', {
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
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      if (data.shorts && Array.isArray(data.shorts.scripts)) {
        const updatedProject: YouTubeProject = {
          ...project,
          shorts: data.shorts,
          updatedAt: new Date().toISOString(),
        };
        saveProject(updatedProject);
        onUpdateProject(updatedProject);
        setStatusMessage(
          data.source === 'gemini'
            ? 'Generated 3 AI vertical Shorts using Gemini!'
            : 'Generated 3 Shorts scripts (fallback mode)'
        );
      }
    } catch (err: any) {
      console.warn('AI shorts generation failed, using local fallback:', err?.message);
      const fallback = generateShortsForProject(
        project.idea,
        project.settings,
        project.characters,
        project.scenes
      );
      const updatedProject: YouTubeProject = {
        ...project,
        shorts: fallback,
        updatedAt: new Date().toISOString(),
      };
      saveProject(updatedProject);
      onUpdateProject(updatedProject);
      setStatusMessage('Generated 3 Shorts scripts (offline fallback)');
    } finally {
      setIsGeneratingAll(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleRegenerateSingle = async (index: number) => {
    setRegeneratingIndex(index);
    setStatusMessage(`Regenerating Short #${index + 1}...`);

    try {
      const res = await fetch('/api/generate/short-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: project.idea,
          settings: project.settings,
          shortIndex: index,
          existingShorts: scripts,
          concept: project.concept,
          script: project.script,
          characters: project.characters || [],
          scenes: project.scenes || [],
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      if (data.script) {
        const updatedScripts = [...scripts];
        updatedScripts[index] = data.script;

        const updatedProject: YouTubeProject = {
          ...project,
          shorts: {
            ...project.shorts,
            scripts: updatedScripts,
          },
          updatedAt: new Date().toISOString(),
        };
        saveProject(updatedProject);
        onUpdateProject(updatedProject);
        setStatusMessage(`Short #${index + 1} regenerated successfully!`);
      }
    } catch (err: any) {
      console.warn('Single short regeneration failed, using local fallback:', err?.message);
      const updatedProject = regenerateSingleShort(project, index);
      onUpdateProject(updatedProject);
      setStatusMessage(`Short #${index + 1} regenerated (fallback mode)`);
    } finally {
      setRegeneratingIndex(null);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const startEdit = (index: number, script: ShortScript) => {
    setEditingShortIndex(index);
    setEditForm({ ...script });
  };

  const cancelEdit = () => {
    setEditingShortIndex(null);
    setEditForm(null);
  };

  const saveEdit = (index: number) => {
    if (!editForm) return;

    const updatedScripts = [...scripts];
    updatedScripts[index] = {
      ...editForm,
      title: editForm.shortTitle || editForm.title,
      duration: editForm.duration || editForm.targetDuration || '45s',
      callToAction: editForm.callToAction || editForm.CTA || 'Subscribe!',
      CTA: editForm.callToAction || editForm.CTA || 'Subscribe!',
    };

    const updatedProject: YouTubeProject = {
      ...project,
      shorts: {
        ...project.shorts,
        scripts: updatedScripts,
      },
      updatedAt: new Date().toISOString(),
    };
    saveProject(updatedProject);
    onUpdateProject(updatedProject);
    setEditingShortIndex(null);
    setEditForm(null);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-[#161b22] border border-[#30363d]">
        <div className="flex items-center gap-2 text-xs font-semibold text-pink-400 uppercase tracking-wider">
          <Smartphone className="w-4 h-4" />
          Section 9: YouTube Shorts, TikTok & Reels Suite (9:16 Vertical)
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyAllShorts}
            className="px-3 py-1.5 rounded-lg bg-[#0d1117] border border-[#30363d] hover:border-gray-500 text-xs font-semibold text-gray-300 hover:text-white transition-all flex items-center gap-1.5"
          >
            {copiedId === 'all_shorts' ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-gray-400" />
            )}
            <span>{copiedId === 'all_shorts' ? 'Copied All Shorts!' : 'Copy All Shorts'}</span>
          </button>

          <button
            onClick={handleGenerateAllAI}
            disabled={isGeneratingAll || regeneratingIndex !== null}
            className="px-3.5 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-xs font-bold text-white transition-all flex items-center gap-1.5 shadow-md shadow-pink-600/20 disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isGeneratingAll ? 'animate-spin' : ''}`} />
            <span>{isGeneratingAll ? 'Generating AI Shorts...' : 'Regenerate All Shorts'}</span>
          </button>
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div className="p-3 rounded-lg bg-pink-950/40 border border-pink-800/60 text-xs text-pink-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-pink-400 animate-pulse flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Header Info */}
      <div className="p-5 rounded-2xl bg-[#161b22] border border-[#30363d] space-y-1">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span>9:16 Vertical Video Repurposing Studio</span>
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-300 border border-pink-500/30">
            3 Viral Vertical Cuts
          </span>
        </h2>
        <p className="text-xs text-gray-400">
          Repurposed directly from your long-form video storyline. Each short features a 1-3s swipe-stop hook, complete spoken script, second-by-second visual cut breakdowns with on-screen text captions, and seamless loop CTA.
        </p>
      </div>

      {/* Shorts Scripts List */}
      <div className="space-y-6">
        {scripts.map((script, index) => {
          const isEditing = editingShortIndex === index && editForm !== null;
          const isThisRegenerating = regeneratingIndex === index;

          return (
            <div
              key={script.id || `short-${index}`}
              className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d] space-y-5 hover:border-[#484f58] transition-all"
            >
              {/* Header Bar */}
              <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-[#21262d]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                      SHORT #{index + 1}
                    </span>
                    <span className="text-xs font-mono bg-[#0d1117] text-pink-300 px-2.5 py-1 rounded border border-[#21262d] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-pink-400" />
                      {script.duration || script.targetDuration || '45s'} • 9:16 Vertical
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">
                    {script.shortTitle || script.title}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleRegenerateSingle(index)}
                    disabled={isThisRegenerating || isGeneratingAll}
                    title="Regenerate this specific short only"
                    className="px-2.5 py-1.5 rounded-lg bg-[#0d1117] border border-[#30363d] hover:border-pink-500/50 text-xs font-semibold text-gray-300 hover:text-pink-300 transition-all flex items-center gap-1 disabled:opacity-50"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isThisRegenerating ? 'animate-spin text-pink-400' : ''}`} />
                    <span>{isThisRegenerating ? 'Regenerating...' : 'Regenerate'}</span>
                  </button>

                  <button
                    onClick={() =>
                      handleCopy(
                        script.script || script.hook,
                        `script-${index}`
                      )
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-[#0d1117] border border-[#30363d] hover:border-gray-500 text-xs font-semibold text-gray-300 hover:text-white transition-all flex items-center gap-1"
                  >
                    {copiedId === `script-${index}` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-gray-400" />
                    )}
                    <span>{copiedId === `script-${index}` ? 'Copied Script!' : 'Copy Script'}</span>
                  </button>

                  {!isEditing ? (
                    <button
                      onClick={() => startEdit(index, script)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#0d1117] border border-[#30363d] hover:border-gray-500 text-xs font-semibold text-gray-300 hover:text-white transition-all flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={cancelEdit}
                        className="px-2.5 py-1.5 rounded-lg bg-[#21262d] text-xs font-semibold text-gray-300 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => saveEdit(index)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {isEditing && editForm ? (
                /* EDIT FORM */
                <div className="space-y-4 pt-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                        Shorts Title
                      </label>
                      <input
                        type="text"
                        value={editForm.shortTitle || editForm.title || ''}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            shortTitle: e.target.value,
                            title: e.target.value,
                          })
                        }
                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-pink-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                        Target Duration
                      </label>
                      <input
                        type="text"
                        value={editForm.duration || editForm.targetDuration || '45s'}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            duration: e.target.value,
                            targetDuration: e.target.value,
                          })
                        }
                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-pink-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-pink-300 block mb-1">
                      0-3s Swipe-Stop Opening Hook
                    </label>
                    <textarea
                      rows={2}
                      value={editForm.hook || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, hook: e.target.value })
                      }
                      className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-300 block mb-1">
                      Full Spoken Script / Narration
                    </label>
                    <textarea
                      rows={4}
                      value={editForm.script || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, script: e.target.value })
                      }
                      className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-pink-500 leading-relaxed font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                        Call to Action / Ending Loop
                      </label>
                      <input
                        type="text"
                        value={editForm.callToAction || editForm.CTA || ''}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            callToAction: e.target.value,
                            CTA: e.target.value,
                          })
                        }
                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-pink-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                        Caption / Short Description
                      </label>
                      <input
                        type="text"
                        value={editForm.shortDescription || ''}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            shortDescription: e.target.value,
                          })
                        }
                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-pink-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* DISPLAY VIEW */
                <div className="space-y-4">
                  {/* Hook Banner */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-pink-950/40 via-purple-950/20 to-transparent border border-pink-900/50 space-y-1">
                    <span className="text-[10px] uppercase font-extrabold text-pink-300 tracking-wider flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-pink-400" /> 0-3s Swipe-Stop Hook
                    </span>
                    <p className="text-sm font-bold text-white italic leading-snug">
                      &ldquo;{script.hook}&rdquo;
                    </p>
                  </div>

                  {/* Spoken Word Script Box */}
                  {script.script && (
                    <div className="p-4 rounded-xl bg-[#090c10] border border-[#21262d] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1.5">
                          <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> Spoken Word Narration Script
                        </span>
                        <button
                          onClick={() => handleCopy(script.script || '', `spoken-${index}`)}
                          className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          {copiedId === `spoken-${index}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          {copiedId === `spoken-${index}` ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <p className="text-xs text-gray-200 font-mono leading-relaxed bg-[#161b22] p-3 rounded-lg border border-[#30363d] select-all">
                        {script.script}
                      </p>
                    </div>
                  )}

                  {/* Beat-by-Beat Visual & Caption Breakdown */}
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-pink-400" /> Synchronized 9:16 Visual Cuts & Captions
                    </span>

                    <div className="space-y-2">
                      {script.visualBeats?.map((beat, bIdx) => (
                        <div
                          key={bIdx}
                          className="p-3 rounded-xl bg-[#0d1117] border border-[#21262d] grid grid-cols-1 md:grid-cols-12 gap-3 text-xs items-center"
                        >
                          {/* Timestamp & Visual */}
                          <div className="md:col-span-5 flex items-start gap-2.5">
                            <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 font-mono text-[10px] font-bold shrink-0">
                              {beat.second}
                            </span>
                            <span className="text-gray-300 leading-snug">{beat.visual}</span>
                          </div>

                          {/* Audio Voiceover */}
                          <div className="md:col-span-4 text-gray-200 font-medium italic border-l border-[#21262d] pl-3">
                            &ldquo;{beat.audioNarration}&rdquo;
                          </div>

                          {/* On-screen text caption */}
                          <div className="md:col-span-3 text-amber-400 font-mono text-[11px] font-bold flex items-center gap-1 justify-start md:justify-end">
                            <MessageSquare className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 truncate">
                              {beat.onScreenCaption}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Context & Metadata Footer */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                    {/* Scene Adaptations */}
                    <div className="p-2.5 rounded-lg bg-[#0d1117] border border-[#21262d] space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">
                        Adapted From Long-Form
                      </span>
                      <p className="text-gray-300 text-[11px] font-medium">
                        {script.sceneSelection?.join(', ') || 'Scenes 1, 3, 5'}
                      </p>
                    </div>

                    {/* Soundtrack recommendation */}
                    <div className="p-2.5 rounded-lg bg-[#0d1117] border border-[#21262d] space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-cyan-400 flex items-center gap-1">
                        <Music className="w-3 h-3" /> Audio Soundtrack
                      </span>
                      <p className="text-gray-300 text-[11px] truncate">
                        {script.audioSoundtrack || 'Fast rhythmic synth with dramatic drop'}
                      </p>
                    </div>

                    {/* CTA & Ending */}
                    <div className="p-2.5 rounded-lg bg-[#0d1117] border border-[#21262d] space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                        Call to Action
                      </span>
                      <p className="text-white text-[11px] font-semibold truncate">
                        {script.callToAction || script.CTA || 'Subscribe for the full video!'}
                      </p>
                    </div>
                  </div>

                  {/* Description & Hashtags Card */}
                  {(script.shortDescription || (script.hashtags && script.hashtags.length > 0)) && (
                    <div className="p-3 rounded-xl bg-[#0d1117] border border-[#21262d] flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="space-y-1">
                        {script.shortDescription && (
                          <p className="text-gray-300 text-xs">{script.shortDescription}</p>
                        )}
                        {script.hashtags && script.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {script.hashtags.map((h, hIdx) => (
                              <span key={hIdx} className="text-pink-400 font-mono text-[11px]">
                                {h}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() =>
                          handleCopy(
                            `${script.shortDescription || ''}\n\n${script.hashtags?.join(' ') || ''}`,
                            `desc-${index}`
                          )
                        }
                        className="px-2.5 py-1 rounded bg-[#161b22] hover:bg-[#21262d] text-xs text-gray-300 hover:text-white border border-[#30363d] flex items-center gap-1"
                      >
                        {copiedId === `desc-${index}` ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-gray-400" />
                        )}
                        <span>{copiedId === `desc-${index}` ? 'Copied' : 'Copy Caption & Tags'}</span>
                      </button>
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
