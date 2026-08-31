'use client';

import React, { useState } from 'react';
import {
  Package,
  Sparkles,
  Copy,
  Check,
  ShieldCheck,
  Tag,
  Layers,
  HelpCircle,
  FileCode,
} from 'lucide-react';
import { YouTubeProject, PropProfile } from '@/types/project';

interface PropsSectionProps {
  project: YouTubeProject;
  onUpdateProject: (updated: YouTubeProject) => void;
}

export const PropsSection: React.FC<PropsSectionProps> = ({
  project,
  onUpdateProject,
}) => {
  const propsList: PropProfile[] =
    project.props && project.props.length > 0
      ? project.props
      : project.assetRegistry?.props
      ? Object.values(project.assetRegistry.props)
      : [];

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const totalRequired = propsList.length;
  const totalReady = propsList.filter(
    (p) => p.status === 'REFERENCE_READY' || p.referenceImageStatus === 'READY'
  ).length;
  const totalMissing = totalRequired - totalReady;

  const handleCopyPrompt = (p: PropProfile) => {
    const text = p.generationPrompt || `Prop reference for ${p.displayName || p.id}, ${p.appearance}`;
    navigator.clipboard.writeText(text);
    setCopiedId(p.id);
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
    const text = propsList
      .map(
        (p) =>
          `PROP ID: ${p.id}\nNAME: ${p.displayName || p.id}\nTYPE: ${p.type}\nDESCRIPTION: ${p.description}\nAPPEARANCE: ${p.appearance}\nLOCKED ATTRIBUTES: ${formatLockedAttributes(p.lockedAttributes)}\nGENERATION PROMPT: ${p.generationPrompt || 'N/A'}`
      )
      .join('\n\n==============================\n\n');

    navigator.clipboard.writeText(`PROJECT PROPS REGISTRY (${project.idea})\n\n${text}`);
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
              <Package className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Props & Special Objects Registry</h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Single Source of Truth
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Registered physical props, vehicles, and key narrative artifacts. Video prompts only reference these registered IDs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAll}
              disabled={propsList.length === 0}
              className="px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-xs font-semibold text-gray-300 hover:text-white transition-colors flex items-center gap-1.5"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
              <span>{copiedAll ? 'Copied All' : 'Copy Registry'}</span>
            </button>
          </div>
        </div>

        {/* Status Indicators Bar */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#30363d]">
          <div className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400 font-medium">TOTAL PROPS REQUIRED</div>
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

      {/* Empty State */}
      {propsList.length === 0 && (
        <div className="p-8 text-center bg-[#161b22] border border-[#30363d] rounded-xl text-gray-400 text-sm">
          No props registered for this project. Props are automatically extracted from your story or idea.
        </div>
      )}

      {/* Props Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {propsList.map((prop) => (
          <div
            key={prop.id}
            className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 flex flex-col justify-between hover:border-[#444c56] transition-all space-y-4"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded">
                      {prop.id}
                    </span>
                    <span className="text-xs capitalize px-2 py-0.5 rounded bg-[#21262d] text-gray-300 border border-[#30363d]">
                      {prop.type}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1.5">{prop.displayName || prop.id}</h3>
                </div>

                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  READY
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-gray-300 mt-3 leading-relaxed">{prop.description}</p>

              {/* Appearance Details */}
              <div className="mt-3 bg-[#0d1117] border border-[#21262d] rounded-lg p-3 text-xs text-gray-300 space-y-2">
                <div>
                  <span className="text-gray-400 font-semibold">Appearance: </span>
                  <span>{prop.appearance}</span>
                </div>

                {getLockedAttributesList(prop.lockedAttributes).length > 0 && (
                  <div className="pt-2 border-t border-[#21262d] flex items-center gap-1.5 flex-wrap">
                    <span className="text-gray-400 text-[11px] font-semibold">Locked Traits:</span>
                    {getLockedAttributesList(prop.lockedAttributes).map((attr, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded text-[10px] bg-[#161b22] border border-[#30363d] text-amber-300"
                      >
                        {attr}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Generation Prompt */}
              {prop.generationPrompt && (
                <div className="mt-3">
                  <div className="text-[11px] font-semibold text-gray-400 mb-1 flex items-center gap-1">
                    <FileCode className="w-3 h-3 text-amber-400" />
                    <span>Prop Generation Prompt (8K Midjourney / Image FX)</span>
                  </div>
                  <div className="bg-[#090c10] border border-[#21262d] rounded-lg p-2.5 text-[11px] font-mono text-gray-300 leading-relaxed select-all">
                    {prop.generationPrompt}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-[#21262d] flex items-center justify-between">
              <span className="text-[11px] text-gray-400">
                Used in Scenes: {prop.usageScenes ? prop.usageScenes.join(', ') : 'All Scenes'}
              </span>
              <button
                onClick={() => handleCopyPrompt(prop)}
                className="px-2.5 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-xs text-gray-300 hover:text-white flex items-center gap-1 transition-colors"
              >
                {copiedId === prop.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedId === prop.id ? 'Copied' : 'Copy Prompt'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
