'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Target,
  CheckCircle2,
  Edit3,
  Copy,
  RotateCw,
  Save,
  X,
  Check,
  BookOpen,
  Film,
  AlertCircle,
  Volume2,
} from 'lucide-react';
import { YouTubeProject, ConceptData } from '@/types/project';

interface ConceptSectionProps {
  project: YouTubeProject;
  onUpdateProject: (updated: YouTubeProject) => void;
}

export const ConceptSection: React.FC<ConceptSectionProps> = ({
  project,
  onUpdateProject,
}) => {
  const { concept } = project;
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Edit form state
  const [titleWorking, setTitleWorking] = useState(concept.titleWorking || concept.title || project.idea);
  const [premise, setPremise] = useState(concept.premise || '');
  const [coreAngle, setCoreAngle] = useState(concept.coreAngle || '');
  const [learningGoal, setLearningGoal] = useState(concept.learningGoal || '');
  const [storySummary, setStorySummary] = useState(concept.storySummary || '');
  const [demographic, setDemographic] = useState(concept.targetAudience?.demographic || '');
  const [viewingMotivation, setViewingMotivation] = useState(concept.targetAudience?.viewingMotivation || '');
  const [painPoints, setPainPoints] = useState(concept.targetAudience?.painPointsOrCuriosity || '');
  const [whyItWorks, setWhyItWorks] = useState(concept.whyItWorks || '');

  const handleCopy = () => {
    const text = `VIDEO CONCEPT: ${titleWorking}\n\nCORE PREMISE:\n${premise}\n\nCREATIVE ANGLE:\n${coreAngle}\n\nLEARNING / ENTERTAINMENT GOAL:\n${learningGoal || 'Engage and inform audience'}\n\nSTORY / NARRATIVE SUMMARY:\n${storySummary || premise}\n\nTARGET AUDIENCE:\nDemographic: ${demographic}\nMotivation: ${viewingMotivation}\nCuriosity: ${painPoints}\n\nWHY IT WORKS:\n${whyItWorks}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/generate/concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: project.idea,
          settings: project.settings,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      if (!data?.concept) {
        throw new Error('Invalid concept returned from AI');
      }

      const newConcept: ConceptData = data.concept;

      // Preserve all other sections in project state, update only concept
      const updated: YouTubeProject = {
        ...project,
        concept: newConcept,
        updatedAt: new Date().toISOString(),
      };

      onUpdateProject(updated);

      // Sync local edit states
      setTitleWorking(newConcept.titleWorking || newConcept.title || project.idea);
      setPremise(newConcept.premise);
      setCoreAngle(newConcept.coreAngle);
      setLearningGoal(newConcept.learningGoal || '');
      setStorySummary(newConcept.storySummary || '');
      setDemographic(newConcept.targetAudience?.demographic || '');
      setViewingMotivation(newConcept.targetAudience?.viewingMotivation || '');
      setPainPoints(newConcept.targetAudience?.painPointsOrCuriosity || '');
      setWhyItWorks(newConcept.whyItWorks);
    } catch (err: any) {
      console.error('Failed to regenerate concept with AI:', err);
      setErrorMessage(
        err?.message || 'Failed to regenerate concept. Previous content has been preserved.'
      );
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSave = () => {
    const updated: YouTubeProject = {
      ...project,
      concept: {
        ...project.concept,
        title: titleWorking,
        titleWorking,
        premise,
        coreAngle,
        learningGoal: learningGoal || undefined,
        storySummary: storySummary || undefined,
        targetAudience: {
          ...project.concept.targetAudience,
          demographic,
          viewingMotivation,
          painPointsOrCuriosity: painPoints,
        },
        whyItWorks,
      },
      updatedAt: new Date().toISOString(),
    };
    onUpdateProject(updated);
    setIsEditing(false);
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
        <div className="flex items-center gap-2 text-xs font-semibold text-red-400 uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          Section 1: Real AI Video Concept & Strategic Premise
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-[#0d1117] border border-[#30363d] hover:border-gray-500 text-xs font-semibold text-gray-300 hover:text-white transition-all flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          <button
            onClick={handleRegenerate}
            disabled={isRegenerating || isEditing}
            className="px-3 py-1.5 rounded-lg bg-[#0d1117] border border-[#30363d] hover:border-amber-500/50 text-xs font-semibold text-gray-300 hover:text-amber-400 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin text-amber-400' : 'text-gray-400'}`} />
            <span>{isRegenerating ? 'Regenerating with AI...' : 'Regenerate Concept'}</span>
          </button>

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition-all flex items-center gap-1.5 shadow-md shadow-red-600/20"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-lg bg-[#21262d] text-xs font-semibold text-gray-300 hover:text-white transition-colors flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSave}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Concept Card */}
      <div className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d] space-y-4">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase text-gray-400 block mb-1">Working Title</label>
              <input
                type="text"
                value={titleWorking}
                onChange={(e) => setTitleWorking(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-400 block mb-1">Core Premise</label>
              <textarea
                rows={3}
                value={premise}
                onChange={(e) => setPremise(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-400 block mb-1">Creative Angle</label>
              <textarea
                rows={2}
                value={coreAngle}
                onChange={(e) => setCoreAngle(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-400 block mb-1">Learning / Entertainment Goal</label>
              <textarea
                rows={2}
                value={learningGoal}
                onChange={(e) => setLearningGoal(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-400 block mb-1">Story Arc Summary</label>
              <textarea
                rows={3}
                value={storySummary}
                onChange={(e) => setStorySummary(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-bold text-white">
                {concept.titleWorking || concept.title || project.idea}
              </h2>
              {concept.tone && (
                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-red-950/60 text-red-300 border border-red-800/40 flex items-center gap-1">
                  <Volume2 className="w-3 h-3 text-red-400" />
                  Tone: {concept.tone}
                </span>
              )}
            </div>

            <div className="p-4 rounded-xl bg-[#0d1117] border border-[#21262d] space-y-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                Core Premise
              </span>
              <p className="text-sm text-gray-200 leading-relaxed">{concept.premise}</p>
            </div>

            <div className="p-4 rounded-xl bg-[#0d1117] border border-[#21262d] space-y-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                Unique Creative Angle
              </span>
              <p className="text-sm text-gray-200 leading-relaxed">{concept.coreAngle}</p>
            </div>

            {concept.learningGoal && (
              <div className="p-4 rounded-xl bg-[#0d1117] border border-[#21262d] space-y-2">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  Learning Goal & Audience Value
                </span>
                <p className="text-sm text-gray-200 leading-relaxed">{concept.learningGoal}</p>
              </div>
            )}

            {concept.storySummary && (
              <div className="p-4 rounded-xl bg-[#0d1117] border border-[#21262d] space-y-2">
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5" />
                  Story Arc Summary
                </span>
                <p className="text-sm text-gray-200 leading-relaxed">{concept.storySummary}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Target Audience Profile */}
      <div className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d] space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
          <Target className="w-4 h-4" />
          Target Audience & Retention Motivations
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold uppercase text-gray-400 block mb-1">Core Demographic</label>
              <input
                type="text"
                value={demographic}
                onChange={(e) => setDemographic(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-400 block mb-1">Viewing Motivation</label>
              <input
                type="text"
                value={viewingMotivation}
                onChange={(e) => setViewingMotivation(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-400 block mb-1">Viewer Pain Point / Curiosity</label>
              <input
                type="text"
                value={painPoints}
                onChange={(e) => setPainPoints(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#0d1117] border border-[#21262d] space-y-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                  Core Demographic
                </span>
                <p className="text-sm font-medium text-white">{concept.targetAudience?.demographic || 'General Audience'}</p>
              </div>

              <div className="p-4 rounded-xl bg-[#0d1117] border border-[#21262d] space-y-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                  Viewing Motivation
                </span>
                <p className="text-sm text-gray-200">{concept.targetAudience?.viewingMotivation || 'High interest in topic'}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0d1117] border border-[#21262d] space-y-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                Viewer Pain Point / Burning Curiosity
              </span>
              <p className="text-sm text-gray-200">{concept.targetAudience?.painPointsOrCuriosity || 'Curiosity regarding the subject'}</p>
            </div>
          </>
        )}
      </div>

      {/* Why It Works & Tone */}
      <div className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d] space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
          <CheckCircle2 className="w-4 h-4" />
          Why This Video Works (Algorithm Retention Strategy)
        </div>
        {isEditing ? (
          <textarea
            rows={2}
            value={whyItWorks}
            onChange={(e) => setWhyItWorks(e.target.value)}
            className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
          />
        ) : (
          <p className="text-sm text-gray-200 leading-relaxed">{concept.whyItWorks}</p>
        )}
      </div>
    </div>
  );
};
