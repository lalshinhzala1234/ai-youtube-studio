'use client';

import React, { useState } from 'react';
import {
  Zap,
  Clock,
  Eye,
  Check,
  HelpCircle,
  Flame,
  Copy,
  RotateCw,
  Edit3,
  Save,
  AlertCircle,
  Activity,
} from 'lucide-react';
import { YouTubeProject, HookData, HookOption } from '@/types/project';

interface HookSectionProps {
  project: YouTubeProject;
  onUpdateProject: (updated: YouTubeProject) => void;
}

export const HookSection: React.FC<HookSectionProps> = ({
  project,
  onUpdateProject,
}) => {
  const { hook, concept } = project;
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingHookId, setEditingHookId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState('');
  const [editedVisual, setEditedVisual] = useState('');

  const handleCopyAll = () => {
    const selected = hook.hookOptions.find((h) => h.id === hook.selectedHookId) || hook.hookOptions[0];
    const text = `HOOK MATRIX\n\nPRIMARY SPOKEN HOOK:\n"${hook.hook || selected?.text}"\n\nVISUAL HOOK (0-5s):\n${hook.visualHook || selected?.visualDirection}\n\nFIRST 10 SECONDS BREAKDOWN:\n${hook.first10Seconds || 'Dynamic opening and immediate conflict setup.'}\n\nRETENTION REASON:\n${hook.retentionReason || selected?.explanation}\n\nRETENTION ROADMAP:\n${hook.first30SecondsRoadmap.join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateHook = async () => {
    setIsRegenerating(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/generate/hook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: project.idea,
          settings: project.settings,
          concept: project.concept,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      if (!data?.hook) {
        throw new Error('Invalid hook returned from AI');
      }

      const newHook: HookData = data.hook;

      // Update ONLY hook, preserving all other project sections
      const updated: YouTubeProject = {
        ...project,
        hook: newHook,
        updatedAt: new Date().toISOString(),
      };

      onUpdateProject(updated);
    } catch (err: any) {
      console.error('Failed to regenerate hook with AI:', err);
      setErrorMessage(
        err?.message || 'Failed to regenerate hook. Previous hook matrix has been preserved.'
      );
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSelectHook = (hookId: string) => {
    const selectedOpt = hook.hookOptions.find((h) => h.id === hookId);
    const updated: YouTubeProject = {
      ...project,
      hook: {
        ...project.hook,
        selectedHookId: hookId,
        hook: selectedOpt ? selectedOpt.text : project.hook.hook,
        visualHook: selectedOpt ? selectedOpt.visualDirection : project.hook.visualHook,
        retentionReason: selectedOpt ? selectedOpt.explanation : project.hook.retentionReason,
      },
      updatedAt: new Date().toISOString(),
    };
    onUpdateProject(updated);
  };

  const startEdit = (opt: HookOption) => {
    setEditingHookId(opt.id);
    setEditedText(opt.text);
    setEditedVisual(opt.visualDirection);
  };

  const saveEdit = (hookId: string) => {
    const updatedOptions = hook.hookOptions.map((opt) => {
      if (opt.id === hookId) {
        return {
          ...opt,
          text: editedText,
          visualDirection: editedVisual,
        };
      }
      return opt;
    });

    const isCurrentSelected = (hook.selectedHookId || hook.hookOptions[0]?.id) === hookId;

    const updated: YouTubeProject = {
      ...project,
      hook: {
        ...project.hook,
        hookOptions: updatedOptions,
        hook: isCurrentSelected ? editedText : project.hook.hook,
        visualHook: isCurrentSelected ? editedVisual : project.hook.visualHook,
      },
      updatedAt: new Date().toISOString(),
    };
    onUpdateProject(updated);
    setEditingHookId(null);
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
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
          <Zap className="w-4 h-4" />
          Section 2: Real AI Retention Hook Matrix (0–15 Seconds)
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyAll}
            className="px-3 py-1.5 rounded-lg bg-[#0d1117] border border-[#30363d] hover:border-gray-500 text-xs font-semibold text-gray-300 hover:text-white transition-all flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
            <span>{copied ? 'Copied!' : 'Copy Hooks'}</span>
          </button>

          <button
            onClick={handleRegenerateHook}
            disabled={isRegenerating}
            className="px-3 py-1.5 rounded-lg bg-[#0d1117] border border-[#30363d] hover:border-amber-500/50 text-xs font-semibold text-gray-300 hover:text-amber-400 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin text-amber-400' : 'text-gray-400'}`} />
            <span>{isRegenerating ? 'Regenerating with AI...' : 'Regenerate Hooks'}</span>
          </button>
        </div>
      </div>

      {/* Primary Hook Summary Banner */}
      <div className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d] space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Opening Retention Strategy</h2>
          <p className="text-xs text-gray-400">
            The first 10-15 seconds determine over 70% of YouTube retention. The AI designs high-converting pattern interrupts and curiosity triggers tailored for {project.settings.language}.
          </p>
        </div>

        {(hook.first10Seconds || hook.retentionReason) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#21262d]">
            {hook.first10Seconds && (
              <div className="p-4 rounded-xl bg-[#0d1117] border border-[#21262d] space-y-1.5">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  First 10 Seconds Breakdown
                </span>
                <p className="text-xs text-gray-200 leading-relaxed">{hook.first10Seconds}</p>
              </div>
            )}

            {hook.retentionReason && (
              <div className="p-4 rounded-xl bg-[#0d1117] border border-[#21262d] space-y-1.5">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  Retention Psychology
                </span>
                <p className="text-xs text-gray-200 leading-relaxed">{hook.retentionReason}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hook Options List */}
      <div className="space-y-4">
        {hook.hookOptions.map((opt, index) => {
          const isSelected = opt.id === hook.selectedHookId || (index === 0 && !hook.selectedHookId);
          const isEditingThis = editingHookId === opt.id;

          return (
            <div
              key={opt.id}
              className={`p-6 rounded-2xl transition-all border ${
                isSelected
                  ? 'bg-[#161b22] border-amber-500/50 shadow-lg shadow-amber-500/5'
                  : 'bg-[#161b22] border-[#30363d]'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                    {opt.type}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-amber-400" />
                    ~{opt.estimatedDeliverySeconds}s delivery
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {!isEditingThis ? (
                    <>
                      <button
                        onClick={() => startEdit(opt)}
                        className="px-2.5 py-1 rounded bg-[#0d1117] border border-[#30363d] hover:border-gray-500 text-[11px] font-medium text-gray-300 flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>
                      <button
                        onClick={() => handleSelectHook(opt.id)}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-all ${
                          isSelected
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-[#0d1117] text-gray-400 hover:text-white border border-[#30363d]'
                        }`}
                      >
                        <Check className="w-3 h-3" /> {isSelected ? 'Selected Hook' : 'Select Hook'}
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingHookId(null)}
                        className="px-2.5 py-1 rounded bg-[#21262d] text-[11px] font-medium text-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => saveEdit(opt.id)}
                        className="px-2.5 py-1 rounded bg-emerald-600 text-[11px] font-bold text-white flex items-center gap-1"
                      >
                        <Save className="w-3 h-3" /> Save
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Hook Content */}
              {isEditingThis ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Spoken Dialogue / Narration</label>
                    <textarea
                      rows={2}
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Visual Direction (0-5s)</label>
                    <textarea
                      rows={2}
                      value={editedVisual}
                      onChange={(e) => setEditedVisual(e.target.value)}
                      className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-4 rounded-xl bg-[#0d1117] border border-[#21262d] mb-4">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                      Spoken Narration / Dialogue
                    </span>
                    <p className="text-base font-semibold text-white italic leading-relaxed">
                      &ldquo;{opt.text}&rdquo;
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-[#0d1117] border border-[#21262d]">
                      <span className="text-[10px] uppercase font-bold text-blue-400 block mb-1 flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Visual Direction (0-5s)
                      </span>
                      <p className="text-gray-300">{opt.visualDirection}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-[#0d1117] border border-[#21262d]">
                      <span className="text-[10px] uppercase font-bold text-purple-400 block mb-1 flex items-center gap-1">
                        <HelpCircle className="w-3 h-3" /> Psychological Trigger
                      </span>
                      <p className="text-gray-300">{opt.explanation}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* First 30 Seconds Roadmap */}
      {hook.first30SecondsRoadmap && hook.first30SecondsRoadmap.length > 0 && (
        <div className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d] space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <Flame className="w-4 h-4" />
            First 30 Seconds Retention Roadmap
          </div>
          <div className="space-y-2">
            {hook.first30SecondsRoadmap.map((step, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#0d1117] border border-[#21262d] flex items-center gap-3 text-xs text-gray-200"
              >
                <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 font-bold flex items-center justify-center shrink-0 text-[10px] font-mono">
                  {idx + 1}
                </span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
