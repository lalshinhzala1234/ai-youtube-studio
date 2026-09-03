'use client';

import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Flame,
  Type,
  Palette,
  Copy,
  Check,
  RotateCw,
  Edit3,
  Save,
  X,
  Sparkles,
  Layers,
  Sun,
  Camera,
  ShieldCheck,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { YouTubeProject, ThumbnailConcept, ThumbnailData } from '@/types/project';
import {
  generateThumbnailForProject,
  regenerateSingleThumbnail,
  saveProject,
} from '@/lib/storage/projectStore';

interface ThumbnailSectionProps {
  project: YouTubeProject;
  onUpdateProject: (updated: YouTubeProject) => void;
}

export const ThumbnailSection: React.FC<ThumbnailSectionProps> = ({
  project,
  onUpdateProject,
}) => {
  const { thumbnail } = project;
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ThumbnailConcept | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const concepts: ThumbnailConcept[] =
    thumbnail?.concepts && thumbnail.concepts.length > 0
      ? thumbnail.concepts
      : generateThumbnailForProject(project.idea, project.settings, project.characters).concepts;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyAllPrompts = () => {
    const combined = concepts
      .map((c, i) => `=== THUMBNAIL CONCEPT #${i + 1}: ${c.conceptTitle || c.title} ===\nPROMPT:\n${c.aiImagePrompt}\n\nNEGATIVE PROMPT:\n${c.negativePrompt || 'blurry, bad anatomy, artifacts'}\n\nTEXT OVERLAY: "${c.suggestedText || c.textOverlay || ''}" (${c.textPlacement || 'Top-Left'})\n`)
      .join('\n\n');
    handleCopy(combined, 'all_prompts');
  };

  const handleGenerateAllAI = async () => {
    setIsGeneratingAll(true);
    setStatusMessage('Generating 3 AI Thumbnail Concepts...');

    try {
      const res = await fetch('/api/generate/thumbnails', {
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
      if (data.thumbnail && Array.isArray(data.thumbnail.concepts)) {
        const updatedProject: YouTubeProject = {
          ...project,
          thumbnail: data.thumbnail,
          updatedAt: new Date().toISOString(),
        };
        saveProject(updatedProject);
        onUpdateProject(updatedProject);
        setStatusMessage(
          data.source === 'gemini'
            ? 'Generated 3 AI thumbnail concepts using Gemini!'
            : 'Generated 3 thumbnail concepts (offline fallback)'
        );
      }
    } catch (err: any) {
      console.warn('AI thumbnail generation failed, using local fallback:', err?.message);
      const fallback = generateThumbnailForProject(project.idea, project.settings, project.characters);
      const updatedProject: YouTubeProject = {
        ...project,
        thumbnail: fallback,
        updatedAt: new Date().toISOString(),
      };
      saveProject(updatedProject);
      onUpdateProject(updatedProject);
      setStatusMessage('Generated 3 thumbnail concepts (fallback mode)');
    } finally {
      setIsGeneratingAll(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleRegenerateSingle = async (index: number) => {
    setRegeneratingIndex(index);
    setStatusMessage(`Regenerating Thumbnail #${index + 1}...`);

    try {
      const res = await fetch('/api/generate/thumbnail-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: project.idea,
          settings: project.settings,
          conceptIndex: index,
          existingConcepts: concepts,
          characters: project.characters || [],
          scenes: project.scenes || [],
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      if (data.concept) {
        const updatedConcepts = [...concepts];
        updatedConcepts[index] = data.concept;

        const updatedProject: YouTubeProject = {
          ...project,
          thumbnail: {
            ...project.thumbnail,
            concepts: updatedConcepts,
          },
          updatedAt: new Date().toISOString(),
        };
        saveProject(updatedProject);
        onUpdateProject(updatedProject);
        setStatusMessage(`Thumbnail #${index + 1} regenerated successfully!`);
      }
    } catch (err: any) {
      console.warn('Single thumbnail regeneration failed, using local fallback:', err?.message);
      const updatedProject = regenerateSingleThumbnail(project, index);
      onUpdateProject(updatedProject);
      setStatusMessage(`Thumbnail #${index + 1} regenerated (fallback mode)`);
    } finally {
      setRegeneratingIndex(null);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const startEdit = (index: number, concept: ThumbnailConcept) => {
    setEditingIndex(index);
    setEditForm({ ...concept });
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditForm(null);
  };

  const saveEdit = (index: number) => {
    if (!editForm) return;

    const updatedConcepts = [...concepts];
    updatedConcepts[index] = {
      ...editForm,
      title: editForm.conceptTitle || editForm.title,
      suggestedText: editForm.suggestedText || editForm.textOverlay,
      textOverlay: editForm.suggestedText || editForm.textOverlay,
    };

    const updatedProject: YouTubeProject = {
      ...project,
      thumbnail: {
        ...project.thumbnail,
        concepts: updatedConcepts,
      },
      updatedAt: new Date().toISOString(),
    };
    saveProject(updatedProject);
    onUpdateProject(updatedProject);
    setEditingIndex(null);
    setEditForm(null);
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-[#161b22] border border-[#30363d]">
        <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 uppercase tracking-wider">
          <ImageIcon className="w-4 h-4" />
          Section 7: High-CTR Thumbnail Concept Studio
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyAllPrompts}
            className="px-3 py-1.5 rounded-lg bg-[#0d1117] border border-[#30363d] hover:border-gray-500 text-xs font-semibold text-gray-300 hover:text-white transition-all flex items-center gap-1.5"
          >
            {copiedKey === 'all_prompts' ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-gray-400" />
            )}
            <span>{copiedKey === 'all_prompts' ? 'Copied All Prompts!' : 'Copy All Prompts'}</span>
          </button>

          <button
            onClick={handleGenerateAllAI}
            disabled={isGeneratingAll || regeneratingIndex !== null}
            className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition-all flex items-center gap-1.5 shadow-md shadow-rose-600/20 disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isGeneratingAll ? 'animate-spin' : ''}`} />
            <span>{isGeneratingAll ? 'Generating AI Thumbnails...' : 'Regenerate All Thumbnails'}</span>
          </button>
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-rose-400 animate-pulse flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Strategy Intro */}
      <div className="p-5 rounded-2xl bg-[#161b22] border border-[#30363d] space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>3 High-Converting Thumbnail Strategies</span>
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
              Midjourney v6 & DALL-E 3 Ready
            </span>
          </h2>
          {project.characters && project.characters.length > 0 && (
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2.5 py-1 rounded-lg">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Locked to {project.characters[0]?.name} Profile</span>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">
          Each concept represents a proven algorithmic engagement angle (High Emotion, Curiosity Mystery, and Action Climax).
          Characters remain visually locked to the established Character Consistency Profile.
        </p>
      </div>

      {/* 3 Thumbnail Concepts List */}
      <div className="space-y-6">
        {concepts.map((concept, index) => {
          const isEditing = editingIndex === index && editForm !== null;
          const isThisRegenerating = regeneratingIndex === index;

          return (
            <div
              key={concept.id || `concept-${index}`}
              className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d] space-y-5 hover:border-[#484f58] transition-all"
            >
              {/* Concept Title Bar */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      CONCEPT #{index + 1}
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      {concept.conceptTitle || concept.title}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-400">
                    {concept.visualConcept || concept.previewDescription}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold font-mono">
                    <Flame className="w-3.5 h-3.5" />
                    <span>CTR: {concept.clickabilityScore || 94}/100</span>
                  </div>

                  <button
                    onClick={() => handleRegenerateSingle(index)}
                    disabled={isThisRegenerating || isGeneratingAll}
                    title="Regenerate this specific thumbnail only"
                    className="px-2.5 py-1 rounded-lg bg-[#0d1117] border border-[#30363d] hover:border-rose-500/50 text-xs font-semibold text-gray-300 hover:text-rose-400 transition-all flex items-center gap-1 disabled:opacity-50"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isThisRegenerating ? 'animate-spin text-rose-400' : ''}`} />
                    <span>{isThisRegenerating ? 'Regenerating...' : 'Regenerate'}</span>
                  </button>

                  {!isEditing ? (
                    <button
                      onClick={() => startEdit(index, concept)}
                      className="px-2.5 py-1 rounded-lg bg-[#0d1117] border border-[#30363d] hover:border-gray-500 text-xs font-semibold text-gray-300 hover:text-white transition-all flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={cancelEdit}
                        className="px-2.5 py-1 rounded-lg bg-[#21262d] text-xs font-semibold text-gray-300 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => saveEdit(index)}
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1"
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
                <div className="space-y-4 pt-2 border-t border-[#30363d]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                        Concept Title
                      </label>
                      <input
                        type="text"
                        value={editForm.conceptTitle || editForm.title || ''}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            conceptTitle: e.target.value,
                            title: e.target.value,
                          })
                        }
                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-amber-400 block mb-1">
                        Suggested Text Overlay
                      </label>
                      <input
                        type="text"
                        value={editForm.suggestedText || editForm.textOverlay || ''}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            suggestedText: e.target.value,
                            textOverlay: e.target.value,
                          })
                        }
                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                        Main Subject Focus
                      </label>
                      <input
                        type="text"
                        value={editForm.mainSubject || ''}
                        onChange={(e) =>
                          setEditForm({ ...editForm, mainSubject: e.target.value })
                        }
                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                        Character Expression
                      </label>
                      <input
                        type="text"
                        value={editForm.characterExpression || editForm.facialExpression || ''}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            characterExpression: e.target.value,
                            facialExpression: e.target.value,
                          })
                        }
                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                        Text Placement & Style
                      </label>
                      <input
                        type="text"
                        value={editForm.textPlacement || ''}
                        onChange={(e) =>
                          setEditForm({ ...editForm, textPlacement: e.target.value })
                        }
                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                      Visual Hook Concept
                    </label>
                    <textarea
                      rows={2}
                      value={editForm.visualConcept || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, visualConcept: e.target.value })
                      }
                      className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-rose-300 block mb-1">
                      AI Image Prompt (Midjourney / DALL-E)
                    </label>
                    <textarea
                      rows={3}
                      value={editForm.aiImagePrompt || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, aiImagePrompt: e.target.value })
                      }
                      className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2.5 text-xs font-mono text-gray-200 focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                      Negative Prompt
                    </label>
                    <input
                      type="text"
                      value={editForm.negativePrompt || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, negativePrompt: e.target.value })
                      }
                      className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              ) : (
                /* DISPLAY VIEW */
                <div className="space-y-4">
                  {/* Detailed Specs Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    {/* Subject & Expression */}
                    <div className="p-3 rounded-xl bg-[#0d1117] border border-[#21262d] space-y-1">
                      <span className="text-[10px] uppercase font-bold text-rose-300 flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Subject & Expression
                      </span>
                      <p className="text-gray-200 font-semibold">{concept.mainSubject || 'Featured Character'}</p>
                      <p className="text-gray-400 text-[11px]">
                        {concept.characterExpression || concept.facialExpression}
                      </p>
                    </div>

                    {/* Text Overlay & Placement */}
                    <div className="p-3 rounded-xl bg-[#0d1117] border border-[#21262d] space-y-1">
                      <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                        <Type className="w-3 h-3" /> Text & Placement
                      </span>
                      <div className="inline-block bg-red-600/20 border border-red-500/40 text-white font-black text-xs px-2 py-0.5 rounded">
                        &ldquo;{concept.suggestedText || concept.textOverlay || 'NO TEXT'}&rdquo;
                      </div>
                      <p className="text-gray-400 text-[11px]">
                        Position: {concept.textPlacement || 'Top-Left'} • {concept.fontStyle || 'Bold Sans'}
                      </p>
                    </div>

                    {/* Lighting & Colors */}
                    <div className="p-3 rounded-xl bg-[#0d1117] border border-[#21262d] space-y-1">
                      <span className="text-[10px] uppercase font-bold text-cyan-400 flex items-center gap-1">
                        <Sun className="w-3 h-3" /> Lighting & Colors
                      </span>
                      <p className="text-gray-200 text-[11px] line-clamp-2">{concept.lighting || 'Cinematic rim light'}</p>
                      <p className="text-cyan-300/90 text-[11px] font-mono">{concept.colorDirection || 'Complimentary contrast'}</p>
                    </div>

                    {/* Composition & Framing */}
                    <div className="p-3 rounded-xl bg-[#0d1117] border border-[#21262d] space-y-1">
                      <span className="text-[10px] uppercase font-bold text-indigo-400 flex items-center gap-1">
                        <Camera className="w-3 h-3" /> Composition
                      </span>
                      <p className="text-gray-200 text-[11px] line-clamp-2">{concept.composition || 'Rule of thirds, dramatic framing'}</p>
                      <p className="text-gray-400 text-[11px]">Focal: {concept.focalPoint}</p>
                    </div>
                  </div>

                  {/* Background & Foreground Elements */}
                  {(concept.background || concept.foregroundElements) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {concept.background && (
                        <div className="p-2.5 rounded-lg bg-[#0d1117]/80 border border-[#21262d]">
                          <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">
                            Background Environment
                          </span>
                          <p className="text-gray-300 text-[11px]">{concept.background}</p>
                        </div>
                      )}
                      {concept.foregroundElements && (
                        <div className="p-2.5 rounded-lg bg-[#0d1117]/80 border border-[#21262d]">
                          <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">
                            Foreground & Depth Elements
                          </span>
                          <p className="text-gray-300 text-[11px]">{concept.foregroundElements}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI Generation Prompt Card */}
                  <div className="p-4 rounded-xl bg-[#090c10] border border-[#21262d] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                        <span className="text-[11px] uppercase font-bold text-gray-300 tracking-wide">
                          Production AI Image Prompt
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopy(concept.aiImagePrompt || '', `prompt-${index}`)}
                        className="px-2.5 py-1 rounded bg-[#161b22] hover:bg-[#21262d] text-xs text-rose-300 hover:text-rose-200 border border-[#30363d] flex items-center gap-1 transition-all"
                      >
                        {copiedKey === `prompt-${index}` ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedKey === `prompt-${index}` ? 'Copied Prompt!' : 'Copy Prompt'}</span>
                      </button>
                    </div>

                    <div className="p-3 rounded-lg bg-[#161b22] border border-[#30363d]">
                      <p className="text-xs font-mono text-gray-200 select-all leading-relaxed break-words">
                        {concept.aiImagePrompt}
                      </p>
                    </div>

                    {concept.negativePrompt && (
                      <div className="flex items-center gap-2 text-[11px] text-gray-400 bg-[#161b22]/50 px-2.5 py-1.5 rounded border border-[#21262d]">
                        <span className="font-bold text-red-400/80 uppercase text-[10px]">Negative:</span>
                        <span className="font-mono text-gray-300 select-all">{concept.negativePrompt}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
