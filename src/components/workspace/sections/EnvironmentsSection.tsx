'use client';

import React, { useState } from 'react';
import {
  Compass,
  Copy,
  Check,
  ShieldCheck,
  Sun,
  Palette,
  FileCode,
} from 'lucide-react';
import { YouTubeProject, EnvironmentProfile } from '@/types/project';

interface EnvironmentsSectionProps {
  project: YouTubeProject;
  onUpdateProject: (updated: YouTubeProject) => void;
}

export const EnvironmentsSection: React.FC<EnvironmentsSectionProps> = ({
  project,
  onUpdateProject,
}) => {
  const envList: EnvironmentProfile[] =
    project.environments && project.environments.length > 0
      ? project.environments
      : project.assetRegistry?.environments
      ? Object.values(project.assetRegistry.environments)
      : [];

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const totalRequired = envList.length;
  const totalReady = envList.filter(
    (e) => e.status === 'REFERENCE_READY' || e.referenceImageStatus === 'READY'
  ).length;
  const totalMissing = totalRequired - totalReady;

  const handleCopyPrompt = (e: EnvironmentProfile) => {
    const text =
      e.generationPrompt ||
      `Environment master reference for ${e.displayName || e.id}, ${e.appearance}. Lighting: ${e.lighting || 'Cinematic'}`;
    navigator.clipboard.writeText(text);
    setCopiedId(e.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatLockedAttributes = (attrs?: string[] | string): string => {
    if (!attrs) return 'Standard';
    if (Array.isArray(attrs)) return attrs.join(', ');
    return attrs;
  };

  const getLockedAttributesList = (attrs?: string[] | string): string[] => {
    if (!attrs) return [];
    if (Array.isArray(attrs)) return attrs;
    return [attrs];
  };

  const handleCopyAll = () => {
    const text = envList
      .map(
        (e) =>
          `ENVIRONMENT ID: ${e.id}\nNAME: ${e.displayName || e.id}\nDESCRIPTION: ${e.description}\nAPPEARANCE: ${e.appearance}\nLIGHTING: ${e.lighting || 'N/A'}\nTIME OF DAY: ${e.timeOfDay || 'N/A'}\nLOCKED ATTRIBUTES: ${formatLockedAttributes(e.lockedAttributes)}\nGENERATION PROMPT:\n${e.generationPrompt || 'N/A'}`
      )
      .join('\n\n==============================\n\n');

    navigator.clipboard.writeText(`PROJECT ENVIRONMENTS REGISTRY (${project.idea})\n\n${text}`);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Compass className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">Environments & World Registry</h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Single Source of Truth
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Registered worlds, landscapes, and set locations. Video prompts only reference these registered environments.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAll}
              disabled={envList.length === 0}
              className="px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-xs font-semibold text-gray-300 hover:text-white transition-colors flex items-center gap-1.5"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{copiedAll ? 'Copied All' : 'Copy Registry'}</span>
            </button>
          </div>
        </div>

        {/* Status Indicators Bar */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#30363d]">
          <div className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400 font-medium">TOTAL ENVIRONMENTS REQUIRED</div>
            <div className="text-xl font-black text-white mt-0.5">{totalRequired}</div>
          </div>
          <div className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3 text-center">
            <div className="text-xs text-emerald-400 font-medium">REFERENCES READY</div>
            <div className="text-xl font-black text-emerald-400 mt-0.5">{totalReady}</div>
          </div>
          <div className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400 font-medium">REFERENCES MISSING</div>
            <div className="text-xl font-black text-gray-300 mt-0.5">{totalMissing}</div>
          </div>
        </div>
      </div>

      {/* Environments Grid */}
      <div className="grid grid-cols-1 gap-4">
        {envList.map((env) => (
          <div
            key={env.id}
            className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 hover:border-[#444c56] transition-all space-y-4"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
                    {env.id}
                  </span>
                  {env.timeOfDay && (
                    <span className="text-xs px-2 py-0.5 rounded bg-[#21262d] text-gray-300 border border-[#30363d] flex items-center gap-1">
                      <Sun className="w-3 h-3 text-amber-400" />
                      {env.timeOfDay}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-white mt-1.5">{env.displayName || env.id}</h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  READY
                </span>
                <button
                  onClick={() => handleCopyPrompt(env)}
                  className="px-2.5 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-xs text-gray-300 hover:text-white flex items-center gap-1 transition-colors"
                >
                  {copiedId === env.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedId === env.id ? 'Copied' : 'Copy Prompt'}</span>
                </button>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-gray-300 leading-relaxed">{env.description}</p>

            {/* Details Box */}
            <div className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3 text-xs text-gray-300 space-y-2">
              <div>
                <span className="text-gray-400 font-semibold">Visual Layout: </span>
                <span>{env.appearance}</span>
              </div>
              {env.lighting && (
                <div>
                  <span className="text-gray-400 font-semibold">Lighting & Atmosphere: </span>
                  <span className="text-amber-300">{env.lighting}</span>
                </div>
              )}
              {getLockedAttributesList(env.lockedAttributes).length > 0 && (
                <div className="pt-2 border-t border-[#21262d] flex items-center gap-1.5 flex-wrap">
                  <span className="text-gray-400 text-[11px] font-semibold">Locked Geography:</span>
                  {getLockedAttributesList(env.lockedAttributes).map((attr, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 rounded text-[10px] bg-[#161b22] border border-[#30363d] text-emerald-300"
                    >
                      {attr}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Generation Prompt */}
            {env.generationPrompt && (
              <div>
                <div className="text-[11px] font-semibold text-gray-400 mb-1 flex items-center gap-1">
                  <FileCode className="w-3 h-3 text-emerald-400" />
                  <span>Environment Concept Prompt (Midjourney / Stable Diffusion / DALL-E)</span>
                </div>
                <div className="bg-[#090c10] border border-[#21262d] rounded-lg p-2.5 text-[11px] font-mono text-gray-300 leading-relaxed select-all">
                  {env.generationPrompt}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
