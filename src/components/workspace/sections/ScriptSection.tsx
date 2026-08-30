'use client';

import React, { useState } from 'react';
import {
  FileText,
  Clock,
  Volume2,
  Film,
  Type,
  Music,
  Copy,
  RotateCw,
  Edit3,
  Save,
  Check,
  X,
  AlertCircle,
  Sparkles,
  Users,
  Compass,
} from 'lucide-react';
import { YouTubeProject, ScriptData, ScriptSection as ScriptSectionType } from '@/types/project';

interface ScriptSectionProps {
  project: YouTubeProject;
  onUpdateProject: (updated: YouTubeProject) => void;
}

export const ScriptSection: React.FC<ScriptSectionProps> = ({
  project,
  onUpdateProject,
}) => {
  const { script } = project;
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeViewMode, setActiveViewMode] = useState<'timeline' | 'complete' | 'narration'>('timeline');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);

  // Edit fields
  const [editedName, setEditedName] = useState('');
  const [editedTimecode, setEditedTimecode] = useState('');
  const [editedDialogue, setEditedDialogue] = useState('');
  const [editedNarratorDialogue, setEditedNarratorDialogue] = useState('');
  const [editedCharacterDialogue, setEditedCharacterDialogue] = useState('');
  const [editedSceneIntent, setEditedSceneIntent] = useState('');
  const [editedVisual, setEditedVisual] = useState('');
  const [editedOnScreenText, setEditedOnScreenText] = useState('');
  const [editedSoundEffect, setEditedSoundEffect] = useState('');

  const handleCopyFullScript = () => {
    let fullText = script.completeScript;
    if (!fullText) {
      fullText = script.sections
        .map(
          (s) =>
            `[${s.name} - ${s.timecode}]\n${s.sceneIntent ? `SCENE INTENT: ${s.sceneIntent}\n` : ''}VISUAL: ${s.visualDirection}\nVOICEOVER: ${s.dialogueOrNarration}\n${s.onScreenText ? `ON-SCREEN TEXT: ${s.onScreenText}\n` : ''}${s.soundEffectOrMusicCue ? `SFX/MUSIC: ${s.soundEffectOrMusicCue}\n` : ''}`
        )
        .join('\n---\n\n');
    }

    navigator.clipboard.writeText(`FULL PRODUCTION SCRIPT (${project.idea})\n\n${fullText}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateScript = async () => {
    setIsRegenerating(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/generate/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: project.idea,
          settings: project.settings,
          concept: project.concept,
          hook: project.hook,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      if (!data?.script) {
        throw new Error('Invalid script returned from AI');
      }

      const newScript: ScriptData = data.script;

      // Update ONLY script, preserving all other project sections
      const updated: YouTubeProject = {
        ...project,
        script: newScript,
        updatedAt: new Date().toISOString(),
      };

      onUpdateProject(updated);
    } catch (err: any) {
      console.error('Failed to regenerate script with AI:', err);
      setErrorMessage(
        err?.message || 'Failed to regenerate script. Previous script has been preserved.'
      );
    } finally {
      setIsRegenerating(false);
    }
  };

  const startEdit = (sec: ScriptSectionType) => {
    setEditingSectionId(sec.id);
    setEditedName(sec.name);
    setEditedTimecode(sec.timecode);
    setEditedDialogue(sec.dialogueOrNarration);
    setEditedNarratorDialogue(sec.narratorDialogue || sec.dialogueOrNarration);
    setEditedCharacterDialogue(sec.characterDialogue || '');
    setEditedSceneIntent(sec.sceneIntent || '');
    setEditedVisual(sec.visualDirection);
    setEditedOnScreenText(sec.onScreenText || '');
    setEditedSoundEffect(sec.soundEffectOrMusicCue || '');
  };

  const saveEdit = (sectionId: string) => {
    const updatedSections = script.sections.map((sec) => {
      if (sec.id === sectionId) {
        return {
          ...sec,
          name: editedName,
          timecode: editedTimecode,
          dialogueOrNarration: editedDialogue,
          narratorDialogue: editedNarratorDialogue || undefined,
          characterDialogue: editedCharacterDialogue || undefined,
          sceneIntent: editedSceneIntent || undefined,
          visualDirection: editedVisual,
          onScreenText: editedOnScreenText || undefined,
          soundEffectOrMusicCue: editedSoundEffect || undefined,
        };
      }
      return sec;
    });

    const updated: YouTubeProject = {
      ...project,
      script: {
        ...project.script,
        sections: updatedSections,
      },
      updatedAt: new Date().toISOString(),
    };
    onUpdateProject(updated);
    setEditingSectionId(null);
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
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
          <FileText className="w-4 h-4" />
          Section 3: Real AI Full Production Script & Voiceover
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyFullScript}
            className="px-3 py-1.5 rounded-lg bg-[#0d1117] border border-[#30363d] hover:border-gray-500 text-xs font-semibold text-gray-300 hover:text-white transition-all flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
            <span>{copied ? 'Copied Full Script!' : 'Copy Script'}</span>
          </button>

          <button
            onClick={handleRegenerateScript}
            disabled={isRegenerating}
            className="px-3 py-1.5 rounded-lg bg-[#0d1117] border border-[#30363d] hover:border-amber-500/50 text-xs font-semibold text-gray-300 hover:text-amber-400 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin text-amber-400' : 'text-gray-400'}`} />
            <span>{isRegenerating ? 'Regenerating with AI...' : 'Regenerate Script'}</span>
          </button>
        </div>
      </div>

      {/* Header with Stats and Directorial Scene Intent */}
      <div className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Production Script ({project.settings.language})</h2>
            <p className="text-xs text-gray-400">
              Read-ready voiceover script formatted with camera movements, character actions, and sound cues.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="bg-[#0d1117] px-2.5 py-1 rounded-md border border-[#21262d] font-mono">
              {script.totalWordCount} Words
            </span>
            <span className="bg-[#0d1117] px-2.5 py-1 rounded-md border border-[#21262d] font-mono flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              {script.estimatedReadTime}
            </span>
          </div>
        </div>

        {script.sceneIntent && (
          <div className="p-3.5 rounded-xl bg-[#0d1117] border border-[#21262d] flex items-start gap-2.5 text-xs text-gray-300">
            <Compass className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-blue-400 uppercase text-[10px] tracking-wider block mb-0.5">
                Directorial Scene Intent & Pacing
              </span>
              <p>{script.sceneIntent}</p>
            </div>
          </div>
        )}

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#21262d]">
          <button
            onClick={() => setActiveViewMode('timeline')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeViewMode === 'timeline'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-[#0d1117] text-gray-400 hover:text-white border border-[#21262d]'
            }`}
          >
            Acts Breakdown View ({script.sections.length})
          </button>
          <button
            onClick={() => setActiveViewMode('complete')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeViewMode === 'complete'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-[#0d1117] text-gray-400 hover:text-white border border-[#21262d]'
            }`}
          >
            Complete Compiled Script
          </button>
          {script.narratorDialogue && (
            <button
              onClick={() => setActiveViewMode('narration')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeViewMode === 'narration'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-[#0d1117] text-gray-400 hover:text-white border border-[#21262d]'
              }`}
            >
              Narrator Audio Track Only
            </button>
          )}
        </div>
      </div>

      {/* Complete Screenplay View Mode */}
      {activeViewMode === 'complete' && (
        <div className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              Full Screenplay Document
            </span>
            <button
              onClick={handleCopyFullScript}
              className="text-xs text-blue-400 hover:underline flex items-center gap-1"
            >
              <Copy className="w-3 h-3" /> Copy
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-[#090c10] border border-[#21262d] text-xs text-gray-200 font-mono whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto">
            {script.completeScript ||
              script.sections
                .map(
                  (s) =>
                    `==============================\n${s.name} [${s.timecode}]\n==============================\nVISUAL DIRECTION:\n${s.visualDirection}\n\nSPOKEN LINES:\n${s.dialogueOrNarration}\n${s.onScreenText ? `\nON-SCREEN GRAPHICS: ${s.onScreenText}` : ''}${s.soundEffectOrMusicCue ? `\nSFX / AUDIO CUE: ${s.soundEffectOrMusicCue}` : ''}`
                )
                .join('\n\n\n')}
          </pre>
        </div>
      )}

      {/* Narrator Track Only View Mode */}
      {activeViewMode === 'narration' && (
        <div className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" />
              Clean Voiceover Transcript ({project.settings.language})
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(script.narratorDialogue || '');
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
            >
              <Copy className="w-3 h-3" /> Copy Voiceover Only
            </button>
          </div>
          <div className="p-5 rounded-xl bg-[#090c10] border border-[#21262d] text-sm text-gray-100 whitespace-pre-line leading-relaxed max-h-[500px] overflow-y-auto">
            {script.narratorDialogue || script.sections.map((s) => s.narratorDialogue || s.dialogueOrNarration).join('\n\n')}
          </div>
        </div>
      )}

      {/* Script Sections (Timeline Mode) */}
      {activeViewMode === 'timeline' && (
        <div className="space-y-4">
          {script.sections.map((section, idx) => {
            const isEditing = editingSectionId === section.id;

            return (
              <div
                key={section.id || idx}
                className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d] space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#21262d]">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/15 border border-blue-500/30 text-blue-300">
                      {section.name}
                    </span>
                    <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-500" />
                      {section.timecode}
                    </span>
                  </div>

                  <div>
                    {!isEditing ? (
                      <button
                        onClick={() => startEdit(section)}
                        className="px-2.5 py-1 rounded bg-[#0d1117] border border-[#30363d] hover:border-gray-500 text-[11px] font-medium text-gray-300 flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" /> Edit Section
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setEditingSectionId(null)}
                          className="px-2.5 py-1 rounded bg-[#21262d] text-[11px] font-medium text-gray-300"
                        >
                          <X className="w-3 h-3" /> Cancel
                        </button>
                        <button
                          onClick={() => saveEdit(section.id)}
                          className="px-2.5 py-1 rounded bg-emerald-600 text-[11px] font-bold text-white flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" /> Save
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Section Title</label>
                        <input
                          type="text"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Timecode</label>
                        <input
                          type="text"
                          value={editedTimecode}
                          onChange={(e) => setEditedTimecode(e.target.value)}
                          className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-blue-400 block mb-1">Scene Intent</label>
                      <input
                        type="text"
                        value={editedSceneIntent}
                        onChange={(e) => setEditedSceneIntent(e.target.value)}
                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">Voiceover / Dialogue</label>
                      <textarea
                        rows={3}
                        value={editedDialogue}
                        onChange={(e) => setEditedDialogue(e.target.value)}
                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-purple-400 block mb-1">Visual Direction / B-Roll</label>
                      <textarea
                        rows={2}
                        value={editedVisual}
                        onChange={(e) => setEditedVisual(e.target.value)}
                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-amber-400 block mb-1">On-Screen Text</label>
                        <input
                          type="text"
                          value={editedOnScreenText}
                          onChange={(e) => setEditedOnScreenText(e.target.value)}
                          className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-rose-400 block mb-1">Sound Cue</label>
                        <input
                          type="text"
                          value={editedSoundEffect}
                          onChange={(e) => setEditedSoundEffect(e.target.value)}
                          className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {section.sceneIntent && (
                      <div className="text-xs text-blue-300/90 font-medium flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-blue-400 shrink-0" />
                        <span>Scene Goal: {section.sceneIntent}</span>
                      </div>
                    )}

                    {/* Visual Direction */}
                    <div className="p-3 rounded-lg bg-[#0d1117] border border-[#21262d] text-xs">
                      <span className="text-[10px] font-bold uppercase text-purple-400 flex items-center gap-1 mb-1">
                        <Film className="w-3 h-3" /> Visual Direction / B-Roll
                      </span>
                      <p className="text-gray-300">{section.visualDirection}</p>
                    </div>

                    {/* Narration Box */}
                    <div className="p-4 rounded-xl bg-[#090c10] border border-[#21262d] space-y-2">
                      <span className="text-[10px] font-bold uppercase text-emerald-400 flex items-center gap-1">
                        <Volume2 className="w-3 h-3" /> Voiceover / Spoken Narration
                      </span>
                      <p className="text-sm font-medium text-white whitespace-pre-line leading-relaxed">
                        {section.dialogueOrNarration}
                      </p>
                    </div>

                    {/* Sub-cues */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {section.onScreenText && (
                        <div className="p-2.5 rounded-lg bg-[#0d1117] border border-[#21262d]">
                          <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1 mb-0.5">
                            <Type className="w-3 h-3" /> On-Screen Text / Title
                          </span>
                          <p className="text-gray-200 font-mono text-[11px]">{section.onScreenText}</p>
                        </div>
                      )}

                      {section.soundEffectOrMusicCue && (
                        <div className="p-2.5 rounded-lg bg-[#0d1117] border border-[#21262d]">
                          <span className="text-[10px] uppercase font-bold text-rose-400 flex items-center gap-1 mb-0.5">
                            <Music className="w-3 h-3" /> Audio & SFX Cue
                          </span>
                          <p className="text-gray-300">{section.soundEffectOrMusicCue}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
