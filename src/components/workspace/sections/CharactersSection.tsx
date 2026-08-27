'use client';

import React, { useState } from 'react';
import {
  Users,
  Lock,
  ShieldCheck,
  Sparkles,
  Copy,
  RotateCw,
  Edit3,
  Save,
  X,
  Check,
  AlertCircle,
  Eye,
  User,
  Volume2,
  Layers,
  Shirt,
  MessageSquare,
} from 'lucide-react';
import { YouTubeProject, CharacterProfile } from '@/types/project';

interface CharactersSectionProps {
  project: YouTubeProject;
  onUpdateProject: (updated: YouTubeProject) => void;
}

export const CharactersSection: React.FC<CharactersSectionProps> = ({
  project,
  onUpdateProject,
}) => {
  const { characters = [] } = project;
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingCharId, setEditingCharId] = useState<string | null>(null);

  // Edit fields
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [appearance, setAppearance] = useState('');
  const [face, setFace] = useState('');
  const [hair, setHair] = useState('');
  const [skin, setSkin] = useState('');
  const [body, setBody] = useState('');
  const [clothing, setClothing] = useState('');
  const [accessories, setAccessories] = useState('');
  const [personality, setPersonality] = useState('');
  const [expressions, setExpressions] = useState('');
  const [voice, setVoice] = useState('');
  const [speakingStyle, setSpeakingStyle] = useState('');
  const [characterPurpose, setCharacterPurpose] = useState('');
  const [promptAnchor, setPromptAnchor] = useState('');

  const handleCopyAll = () => {
    const text = characters
      .map(
        (c) =>
          `CHARACTER: ${c.name} (${c.role})\nAGE/GENDER: ${c.age || c.ageOrSpecies || 'N/A'}, ${c.gender || 'N/A'}\nAPPEARANCE: ${c.appearance || c.visualAppearance}\nFACE: ${c.face || 'N/A'}\nHAIR: ${c.hair || 'N/A'}\nSKIN/FEATURES: ${c.skinOrVisualCharacteristics || 'N/A'}\nBODY/BUILD: ${c.bodyOrBuild || 'N/A'}\nCLOTHING: ${c.clothing || c.clothingOutfit}\nACCESSORIES: ${c.accessories || c.signatureItem}\nPERSONALITY: ${c.personality || 'N/A'}\nVOICE: ${c.voice || c.voiceStyle || 'N/A'}\nPURPOSE: ${c.characterPurpose || 'N/A'}\nLOCKED PROMPT ANCHOR:\n${c.visualPromptAnchor}`
      )
      .join('\n\n==============================\n\n');

    navigator.clipboard.writeText(`REUSABLE CHARACTER CONSISTENCY PROFILES (${project.idea})\n\n${text}`);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopyAnchor = (char: CharacterProfile) => {
    navigator.clipboard.writeText(char.visualPromptAnchor);
    setCopiedId(char.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/generate/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: project.idea,
          settings: project.settings,
          concept: project.concept,
          script: project.script,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      if (!data?.characters || !Array.isArray(data.characters)) {
        throw new Error('Invalid character profiles returned from AI');
      }

      const newCharacters: CharacterProfile[] = data.characters;

      // Update ONLY characters, preserving Concept, Hook, Script, Scenes, SEO, Thumbnail, Shorts
      const updated: YouTubeProject = {
        ...project,
        characters: newCharacters,
        updatedAt: new Date().toISOString(),
      };

      onUpdateProject(updated);
    } catch (err: any) {
      console.error('Failed to regenerate characters with AI:', err);
      setErrorMessage(
        err?.message || 'Failed to regenerate characters. Existing character profiles have been preserved.'
      );
    } finally {
      setIsRegenerating(false);
    }
  };

  const startEdit = (char: CharacterProfile) => {
    setEditingCharId(char.id);
    setName(char.name);
    setRole(char.role);
    setAge(char.age || char.ageOrSpecies || '');
    setGender(char.gender || '');
    setAppearance(char.appearance || char.visualAppearance || '');
    setFace(char.face || '');
    setHair(char.hair || '');
    setSkin(char.skinOrVisualCharacteristics || '');
    setBody(char.bodyOrBuild || '');
    setClothing(char.clothing || char.clothingOutfit || '');
    setAccessories(char.accessories || char.signatureItem || '');
    setPersonality(char.personality || '');
    setExpressions(char.expressions || '');
    setVoice(char.voice || char.voiceStyle || '');
    setSpeakingStyle(char.speakingStyle || '');
    setCharacterPurpose(char.characterPurpose || '');
    setPromptAnchor(char.visualPromptAnchor || '');
  };

  const saveEdit = (charId: string) => {
    const updatedChars = characters.map((c) => {
      if (c.id === charId) {
        return {
          ...c,
          name,
          role,
          age,
          ageOrSpecies: age,
          gender: gender || undefined,
          appearance,
          visualAppearance: appearance,
          face: face || undefined,
          hair: hair || undefined,
          skinOrVisualCharacteristics: skin || undefined,
          bodyOrBuild: body || undefined,
          clothing,
          clothingOutfit: clothing,
          accessories,
          signatureItem: accessories,
          personality: personality || undefined,
          expressions: expressions || undefined,
          voice: voice || undefined,
          voiceStyle: voice || undefined,
          speakingStyle: speakingStyle || undefined,
          characterPurpose: characterPurpose || undefined,
          visualPromptAnchor: promptAnchor,
        };
      }
      return c;
    });

    const updated: YouTubeProject = {
      ...project,
      characters: updatedChars,
      updatedAt: new Date().toISOString(),
    };
    onUpdateProject(updated);
    setEditingCharId(null);
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
        <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider">
          <Users className="w-4 h-4" />
          Section 4: Locked Character Consistency Profiles
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyAll}
            disabled={characters.length === 0}
            className="px-3 py-1.5 rounded-lg bg-[#0d1117] border border-[#30363d] hover:border-gray-500 text-xs font-semibold text-gray-300 hover:text-white transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
            <span>{copiedAll ? 'Copied Profiles!' : 'Copy All Profiles'}</span>
          </button>

          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="px-3 py-1.5 rounded-lg bg-[#0d1117] border border-[#30363d] hover:border-purple-500/50 text-xs font-semibold text-gray-300 hover:text-purple-400 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin text-purple-400' : 'text-gray-400'}`} />
            <span>{isRegenerating ? 'Regenerating with AI...' : 'Regenerate Characters'}</span>
          </button>
        </div>
      </div>

      {/* Intro Header */}
      <div className="p-5 rounded-2xl bg-[#161b22] border border-[#30363d] space-y-2">
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>Locked Continuity Engine Active</span>
        </div>
        <p className="text-xs text-gray-300 leading-relaxed">
          These profiles act as immutable reference visual blueprints for all generated scenes and video diffusion prompts. Reusing the locked visual prompt anchors guarantees facial, clothing, and aesthetic consistency across all video generation tools (Midjourney, Runway Gen-3, Sora).
        </p>
      </div>

      {/* Characters List */}
      {characters.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#161b22] border border-[#30363d] text-center space-y-3">
          <Users className="w-10 h-10 text-gray-600 mx-auto" />
          <p className="text-sm text-gray-400 font-medium">No character profiles generated yet.</p>
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="px-4 py-2 rounded-xl bg-purple-600 text-xs font-semibold text-white hover:bg-purple-500 transition-all"
          >
            {isRegenerating ? 'Generating...' : 'Generate Characters with AI'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {characters.map((char, index) => {
            const isEditing = editingCharId === char.id;

            return (
              <div
                key={char.id || index}
                className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d] space-y-5"
              >
                {/* Header & Role */}
                <div className="flex items-center justify-between pb-3 border-b border-[#21262d]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">{char.name}</h3>
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {char.role}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {char.age || char.ageOrSpecies || 'Unspecified Age'}
                        {char.gender && ` • ${char.gender}`}
                      </p>
                    </div>
                  </div>

                  <div>
                    {!isEditing ? (
                      <button
                        onClick={() => startEdit(char)}
                        className="px-3 py-1.5 rounded-lg bg-[#0d1117] border border-[#30363d] hover:border-gray-500 text-xs font-medium text-gray-300 flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingCharId(null)}
                          className="px-3 py-1.5 rounded-lg bg-[#21262d] text-xs font-medium text-gray-300"
                        >
                          <X className="w-3.5 h-3.5" /> Cancel
                        </button>
                        <button
                          onClick={() => saveEdit(char.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-xs font-bold text-white flex items-center gap-1.5"
                        >
                          <Save className="w-3.5 h-3.5" /> Save
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Character Name</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Role / Archetype</label>
                        <input
                          type="text"
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Age & Gender</label>
                        <input
                          type="text"
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-purple-400 block mb-1">Overall Visual Appearance</label>
                      <textarea
                        rows={2}
                        value={appearance}
                        onChange={(e) => setAppearance(e.target.value)}
                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Facial Features</label>
                        <input
                          type="text"
                          value={face}
                          onChange={(e) => setFace(e.target.value)}
                          className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Hair Style & Color</label>
                        <input
                          type="text"
                          value={hair}
                          onChange={(e) => setHair(e.target.value)}
                          className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Skin & Visual Features</label>
                        <input
                          type="text"
                          value={skin}
                          onChange={(e) => setSkin(e.target.value)}
                          className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Body / Build</label>
                        <input
                          type="text"
                          value={body}
                          onChange={(e) => setBody(e.target.value)}
                          className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-amber-400 block mb-1">Signature Clothing / Outfit</label>
                        <input
                          type="text"
                          value={clothing}
                          onChange={(e) => setClothing(e.target.value)}
                          className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-amber-400 block mb-1">Accessories & Props</label>
                        <input
                          type="text"
                          value={accessories}
                          onChange={(e) => setAccessories(e.target.value)}
                          className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-blue-400 block mb-1">Voice & Timbre</label>
                        <input
                          type="text"
                          value={voice}
                          onChange={(e) => setVoice(e.target.value)}
                          className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-blue-400 block mb-1">Speaking Style</label>
                        <input
                          type="text"
                          value={speakingStyle}
                          onChange={(e) => setSpeakingStyle(e.target.value)}
                          className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">Character Purpose & Story Role</label>
                      <input
                        type="text"
                        value={characterPurpose}
                        onChange={(e) => setCharacterPurpose(e.target.value)}
                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">Locked AI Diffusion Prompt Anchor</label>
                      <textarea
                        rows={3}
                        value={promptAnchor}
                        onChange={(e) => setPromptAnchor(e.target.value)}
                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Overall Appearance */}
                    <div className="p-3.5 rounded-xl bg-[#0d1117] border border-[#21262d] text-xs">
                      <span className="text-[10px] font-bold uppercase text-purple-400 block mb-1">
                        Visual Appearance & Presence ({project.settings.visualStyle})
                      </span>
                      <p className="text-gray-200 leading-relaxed">
                        {char.appearance || char.visualAppearance}
                      </p>
                    </div>

                    {/* Detailed Physical Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                      {char.face && (
                        <div className="p-3 rounded-lg bg-[#0d1117] border border-[#21262d]">
                          <span className="text-[10px] font-bold uppercase text-gray-400 block mb-0.5">Face & Eyes</span>
                          <p className="text-gray-300 text-[11px]">{char.face}</p>
                        </div>
                      )}
                      {char.hair && (
                        <div className="p-3 rounded-lg bg-[#0d1117] border border-[#21262d]">
                          <span className="text-[10px] font-bold uppercase text-gray-400 block mb-0.5">Hair & Grooming</span>
                          <p className="text-gray-300 text-[11px]">{char.hair}</p>
                        </div>
                      )}
                      {char.skinOrVisualCharacteristics && (
                        <div className="p-3 rounded-lg bg-[#0d1117] border border-[#21262d]">
                          <span className="text-[10px] font-bold uppercase text-gray-400 block mb-0.5">Skin & Complexion</span>
                          <p className="text-gray-300 text-[11px]">{char.skinOrVisualCharacteristics}</p>
                        </div>
                      )}
                      {char.bodyOrBuild && (
                        <div className="p-3 rounded-lg bg-[#0d1117] border border-[#21262d]">
                          <span className="text-[10px] font-bold uppercase text-gray-400 block mb-0.5">Body & Build</span>
                          <p className="text-gray-300 text-[11px]">{char.bodyOrBuild}</p>
                        </div>
                      )}
                    </div>

                    {/* Wardrobe & Props */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3.5 rounded-xl bg-[#0d1117] border border-[#21262d] space-y-1">
                        <span className="text-[10px] font-bold uppercase text-amber-400 flex items-center gap-1.5">
                          <Shirt className="w-3.5 h-3.5" /> Signature Wardrobe / Outfit
                        </span>
                        <p className="text-gray-200 text-[11px] leading-relaxed">
                          {char.clothing || char.clothingOutfit}
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[#0d1117] border border-[#21262d] space-y-1">
                        <span className="text-[10px] font-bold uppercase text-amber-400 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" /> Signature Accessories & Props
                        </span>
                        <p className="text-gray-200 text-[11px] leading-relaxed">
                          {char.accessories || char.signatureItem}
                        </p>
                      </div>
                    </div>

                    {/* Voice & Delivery */}
                    {(char.voice || char.speakingStyle || char.characterPurpose) && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        {char.voice && (
                          <div className="p-3 rounded-lg bg-[#0d1117] border border-[#21262d]">
                            <span className="text-[10px] font-bold uppercase text-blue-400 flex items-center gap-1 mb-0.5">
                              <Volume2 className="w-3 h-3" /> Voice & Timbre
                            </span>
                            <p className="text-gray-300 text-[11px]">{char.voice}</p>
                          </div>
                        )}
                        {char.speakingStyle && (
                          <div className="p-3 rounded-lg bg-[#0d1117] border border-[#21262d]">
                            <span className="text-[10px] font-bold uppercase text-blue-400 flex items-center gap-1 mb-0.5">
                              <MessageSquare className="w-3 h-3" /> Speaking Style
                            </span>
                            <p className="text-gray-300 text-[11px]">{char.speakingStyle}</p>
                          </div>
                        )}
                        {char.characterPurpose && (
                          <div className="p-3 rounded-lg bg-[#0d1117] border border-[#21262d]">
                            <span className="text-[10px] font-bold uppercase text-emerald-400 flex items-center gap-1 mb-0.5">
                              <ShieldCheck className="w-3 h-3" /> Narrative Purpose
                            </span>
                            <p className="text-gray-300 text-[11px]">{char.characterPurpose}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Locked Prompt Anchor Box */}
                    <div className="p-4 rounded-xl bg-[#090c10] border border-purple-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-purple-400 flex items-center gap-1.5 tracking-wider">
                          <Lock className="w-3.5 h-3.5" /> Reusable Locked Diffusion Anchor
                        </span>
                        <button
                          onClick={() => handleCopyAnchor(char)}
                          className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-all"
                        >
                          {copiedId === char.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Anchor</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-purple-200/90 font-mono bg-[#0d1117] p-3 rounded-lg border border-[#21262d] leading-relaxed select-all">
                        {char.visualPromptAnchor}
                      </p>
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
