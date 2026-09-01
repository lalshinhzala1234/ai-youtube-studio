import {
  VideoSettings,
  ProjectSettings,
  YouTubeProject,
  StoryData,
  StoryMode,
  StorySource,
  PlanningMode,
  StoryProgressionBeat,
  ConceptData,
  HookData,
  ScriptData,
  ScriptSection,
  CharacterProfile,
  PropProfile,
  EnvironmentProfile,
  AssetRegistry,
  ProjectMusicLock,
  ProjectVoiceLock,
  SceneContinuityInfo,
  SceneAssetDependencies,
  AssetValidationResult,
  SceneBreakdown,
  SceneVideoPrompt,
  ModelSpecificPrompts,
  ThumbnailData,
  ThumbnailConcept,
  SeoData,
  ShortsData,
  ShortScript,
  VisualBeat,
} from '@/types/project';

// -------------------------------------------------------------
// SHARED STORY-AWARE LIBRARIES & HELPERS
// (module scope so both asset extraction and scene planning use the SAME
// story-derived data — never rediscovered independently downstream)
// -------------------------------------------------------------

export const SETTING_LIBRARY: Array<{ pattern: RegExp; label: string; description: string; lighting: string; timeOfDay: string }> = [
  { pattern: /jungle|forest|van\b/i, label: 'Ancient Jungle', description: 'Ancient dense jungle with towering trees, moss-covered rocks, a winding forest path, and soft morning mist.', lighting: 'Dappled sunlight filtering through the forest canopy', timeOfDay: 'Morning' },
  { pattern: /ocean|sea|samundar|underwater|undersea/i, label: 'Undersea World', description: 'Vivid undersea world with coral reefs, drifting light rays, and gentle currents.', lighting: 'Soft blue-green caustic light rippling through water', timeOfDay: 'Midday' },
  { pattern: /river|kinare|yamuna|ganga|stream/i, label: 'Riverside', description: 'Tranquil riverside with flowing water, smooth pebbles, and overhanging trees.', lighting: 'Warm golden-hour light reflecting off the water', timeOfDay: 'Golden Hour' },
  { pattern: /city|shehar|town|street/i, label: 'City Streets', description: 'Bustling city streets with tall buildings, warm shopfront lights, and gentle background activity.', lighting: 'Warm ambient city lighting with soft shadows', timeOfDay: 'Evening' },
  { pattern: /space|galaxy|planet|star(s)?\b/i, label: 'Outer Space', description: 'Vast starlit expanse with distant nebulae and a softly glowing planet in the background.', lighting: 'Cool starlight with subtle nebula color washes', timeOfDay: 'Timeless' },
  { pattern: /desert|registan/i, label: 'Desert Dunes', description: 'Sweeping golden desert dunes with rippling sand patterns and a wide open sky.', lighting: 'Warm harsh sunlight with long dramatic shadows', timeOfDay: 'Afternoon' },
  { pattern: /mountain|pahad/i, label: 'Mountain Range', description: 'Dramatic mountain range with rocky outcrops, thin mist, and a winding trail.', lighting: 'Crisp cool light with distant haze', timeOfDay: 'Morning' },
  { pattern: /palace|kingdom|rajmahal|mahal/i, label: 'Royal Palace', description: 'Ornate royal palace interior with tall pillars, rich fabrics, and warm lantern light.', lighting: 'Warm golden lantern and candle light', timeOfDay: 'Evening' },
  { pattern: /cave|gufa/i, label: 'Hidden Cave', description: 'Atmospheric hidden cave with glowing crystal formations and echoing chambers.', lighting: 'Soft bioluminescent glow from crystal formations', timeOfDay: 'N/A (Interior)' },
  { pattern: /village|gaon/i, label: 'Countryside Village', description: 'Warm countryside village with thatched roofs, open courtyards, and simple lanes.', lighting: 'Soft natural daylight with warm undertones', timeOfDay: 'Daytime' },
  { pattern: /house|ghar|room|interior/i, label: 'House Interior', description: 'Lived-in interior with furnished rooms, warm household lighting, and personal details.', lighting: 'Soft warm indoor lighting with window daylight fill', timeOfDay: 'Daytime' },
  { pattern: /office|building|corridor/i, label: 'Office / Building Interior', description: 'Modern office or building interior with clean lines and functional lighting.', lighting: 'Even cool-white overhead lighting', timeOfDay: 'Daytime' },
  { pattern: /station|crime scene|murder|investigat/i, label: 'Investigation Scene', description: 'Muted, tense location consistent with an investigation — police tape, evidence markers, dim overhead light.', lighting: 'Low-key dramatic lighting with hard shadows', timeOfDay: 'Night' },
];

export const PROP_LIBRARY: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /golden key|silver key|ancient key|magic key|\bkey\b/i, label: 'Key' },
  { pattern: /old map|ancient map|treasure map|\bmap\b/i, label: 'Map' },
  { pattern: /lantern/i, label: 'Lantern' },
  { pattern: /sword/i, label: 'Sword' },
  { pattern: /amulet/i, label: 'Amulet' },
  { pattern: /crystal/i, label: 'Crystal' },
  { pattern: /\bbook\b|storybook|diary|journal/i, label: 'Book' },
  { pattern: /\bletter\b/i, label: 'Letter' },
  { pattern: /torch/i, label: 'Torch' },
  { pattern: /compass/i, label: 'Compass' },
  { pattern: /necklace/i, label: 'Necklace' },
  { pattern: /\bring\b/i, label: 'Ring' },
  { pattern: /\bstone\b|gemstone/i, label: 'Stone' },
  { pattern: /scroll/i, label: 'Scroll' },
  { pattern: /mirror/i, label: 'Mirror' },
  { pattern: /feather/i, label: 'Feather' },
  { pattern: /\begg\b/i, label: 'Egg' },
  { pattern: /\bseed\b/i, label: 'Seed' },
  { pattern: /\bcoin\b/i, label: 'Coin' },
  { pattern: /flute/i, label: 'Flute' },
  { pattern: /\bstaff\b/i, label: 'Staff' },
  { pattern: /\bwand\b/i, label: 'Wand' },
  { pattern: /shield/i, label: 'Shield' },
  { pattern: /\bbow\b|\barrow\b/i, label: 'Bow & Arrow' },
  { pattern: /\bboat\b/i, label: 'Boat' },
  { pattern: /gun|pistol|weapon/i, label: 'Weapon' },
  { pattern: /evidence|clue/i, label: 'Evidence' },
  { pattern: /camera/i, label: 'Camera' },
  { pattern: /phone|mobile/i, label: 'Phone' },
];

/**
 * Splits raw story text into narrative "beats" (roughly one beat per sentence,
 * across English, Hinglish, and Devanagari punctuation). Used so scene planning,
 * character presence, environment, and props can all be derived from the SAME
 * real slice of story text instead of being guessed independently.
 */
export function splitStoryIntoBeats(storyText: string): string[] {
  if (!storyText || !storyText.trim()) return [];
  const raw = storyText
    .split(/(?<=[.!?।])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return raw.length > 0 ? raw : [storyText.trim()];
}

/** Maps `actualCount` scenes onto `beats.length` story beats, proportionally. */
export function mapScenesToBeats(sceneCount: number, beats: string[]): string[][] {
  if (beats.length === 0 || sceneCount <= 0) return Array.from({ length: Math.max(sceneCount, 0) }, () => []);
  const groups: string[][] = Array.from({ length: sceneCount }, () => []);
  beats.forEach((beat, beatIdx) => {
    const sceneIdx = Math.min(sceneCount - 1, Math.floor((beatIdx * sceneCount) / beats.length));
    groups[sceneIdx].push(beat);
  });
  // If a scene ended up with no beats (more scenes than beats), reuse the nearest
  // preceding beat so every scene stays traceable to real story text rather than empty.
  for (let i = 0; i < groups.length; i++) {
    if (groups[i].length === 0) {
      const prevWithContent = [...groups.slice(0, i)].reverse().find((g) => g.length > 0);
      groups[i] = prevWithContent ? [prevWithContent[prevWithContent.length - 1]] : beats.length > 0 ? [beats[beats.length - 1]] : [];
    }
  }
  return groups;
}

/** Finds the beat index (0-based) where a character's name is first mentioned as a whole word. */
export function findCharacterFirstBeat(name: string, beats: string[]): number {
  if (!name) return 0;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`\\b${escaped}\\b`, 'i');
  for (let i = 0; i < beats.length; i++) {
    if (pattern.test(beats[i])) return i;
  }
  return -1; // not found by literal name anywhere in the beats
}

/** Extracts quoted dialogue lines from a beat, with the nearest preceding character name as speaker. */
export function extractQuotedDialogue(
  beatText: string,
  candidateCharacters: CharacterProfile[]
): Array<{ speakerName: string; speakerId: string; line: string }> {
  const results: Array<{ speakerName: string; speakerId: string; line: string }> = [];
  const quoteMatches = Array.from(beatText.matchAll(/["“]([^"”]{2,300})["”]/g));
  for (const match of quoteMatches) {
    if (match.index === undefined) continue;
    const before = beatText.slice(0, match.index);
    let bestSpeaker: CharacterProfile | undefined;
    let bestPos = -1;
    for (const c of candidateCharacters) {
      const idx = before.toLowerCase().lastIndexOf(c.name.toLowerCase());
      if (idx > bestPos) {
        bestPos = idx;
        bestSpeaker = c;
      }
    }
    if (bestSpeaker) {
      results.push({ speakerName: bestSpeaker.name, speakerId: bestSpeaker.id, line: match[1].trim() });
    }
  }
  return results;
}



export function parseDurationSeconds(durationStr?: string): number {
  if (!durationStr) return 180;
  const lower = durationStr.toLowerCase().trim();
  if (lower.includes('min')) {
    const num = parseFloat(lower.replace(/[^0-9.]/g, '')) || 3;
    return Math.round(num * 60);
  }
  if (lower.includes('sec') || lower.includes('s')) {
    const num = parseFloat(lower.replace(/[^0-9.]/g, '')) || 30;
    return Math.round(num);
  }
  const fallbackNum = parseFloat(lower);
  return !isNaN(fallbackNum) && fallbackNum > 0 ? Math.round(fallbackNum * 60) : 180;
}

export function parseSceneSeconds(sceneDurationStr?: string, defaultSec = 10): number {
  if (!sceneDurationStr) return defaultSec;
  const lower = sceneDurationStr.toLowerCase().trim();
  if (lower.includes('sec') || lower.includes('s')) {
    const num = parseFloat(lower.replace(/[^0-9.]/g, '')) || defaultSec;
    return Math.max(3, Math.min(120, Math.round(num)));
  }
  if (lower.includes('min')) {
    const num = parseFloat(lower.replace(/[^0-9.]/g, '')) || 1;
    return Math.max(3, Math.min(120, Math.round(num * 60)));
  }
  const fallbackNum = parseFloat(lower);
  return !isNaN(fallbackNum) && fallbackNum > 0 ? Math.max(3, Math.min(120, Math.round(fallbackNum))) : defaultSec;
}

export function formatTimestamp(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function formatDurationLabel(sec: number): string {
  if (sec < 60) return `${sec} seconds`;
  const m = Math.floor(sec / 60);
  const rem = sec % 60;
  return rem === 0 ? `${m} minute${m > 1 ? 's' : ''}` : `${m}m ${rem}s`;
}

/**
 * Calculates adaptive per-scene durations matching the requested total video duration.
 */
export function calculateSceneDurationsUniversal(
  totalSec: number,
  sceneCount: number,
  planningMode: PlanningMode = 'ai_auto',
  baseSceneSec?: number,
  contentWeights?: number[]
): number[] {
  const count = Math.max(1, sceneCount);
  if (count === 1) return [totalSec];

  if (planningMode === 'manual' && baseSceneSec && baseSceneSec > 0) {
    // MANUAL PLANNING: the user's exact scene count / per-scene duration is authoritative.
    // AI auto-planning must never override these values.
    const durations = Array(count).fill(baseSceneSec);
    const sum = durations.reduce((a, b) => a + b, 0);
    const diff = totalSec - sum;
    if (diff !== 0) {
      durations[durations.length - 1] = Math.max(3, durations[durations.length - 1] + diff);
    }
    return durations;
  }

  // AI Auto Planning — Dynamic cinematic pacing curve, blended with actual per-scene
  // content weight (dialogue/narration word count) when available, so a
  // dialogue-heavy or action-heavy beat gets more time than a brief transitional one
  // instead of dividing the total duration equally or by position alone.
  const baseWeights = [0.8, 1.0, 1.05, 1.1, 1.3, 1.25, 0.9, 0.8];
  const weights: number[] = [];
  for (let i = 0; i < count; i++) {
    if (i === 0) {
      weights.push(0.8);
    } else if (i === count - 1) {
      weights.push(0.85);
    } else if (i === count - 2) {
      weights.push(1.35);
    } else if (i === Math.floor(count / 2)) {
      weights.push(1.15);
    } else {
      const normalizedIdx = Math.floor((i / count) * baseWeights.length);
      weights.push(baseWeights[normalizedIdx % baseWeights.length] || 1.0);
    }
  }

  if (contentWeights && contentWeights.length === count) {
    const avgContent = contentWeights.reduce((a, b) => a + b, 0) / count || 1;
    for (let i = 0; i < count; i++) {
      const normalizedContent = avgContent > 0 ? contentWeights[i] / avgContent : 1;
      // Blend: 55% cinematic pacing curve, 45% actual content weight — content-heavy
      // beats (more dialogue/narration words) get materially more allocated time.
      weights[i] = weights[i] * 0.55 + normalizedContent * 0.45;
    }
  }

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const rawDurations = weights.map((w) => Math.max(3, Math.round((w / totalWeight) * totalSec)));
  
  let currentSum = rawDurations.reduce((a, b) => a + b, 0);
  let diff = totalSec - currentSum;
  let adjustIndex = count - 2 >= 0 ? count - 2 : 0;

  while (diff !== 0) {
    if (diff > 0) {
      rawDurations[adjustIndex] += 1;
      diff -= 1;
    } else {
      if (rawDurations[adjustIndex] > 3) {
        rawDurations[adjustIndex] -= 1;
        diff += 1;
      } else {
        adjustIndex = (adjustIndex + 1) % count;
      }
    }
  }

  return rawDurations;
}

// -------------------------------------------------------------
// STORY CONTEXT & ANALYZER
// -------------------------------------------------------------

export interface StoryContext {
  title: string;
  fullStory?: string;
  characterInstructions?: string;
  settings: VideoSettings;
  totalSec: number;
  sceneSec: number;
  sceneCount: number;
  isHindi: boolean;
  isHinglish: boolean;
  voiceMode: string;
  isNoSpoken: boolean;
  isNarratorOnly: boolean;
  isCharOnly: boolean;
  isBoth: boolean;
  storyMode: StoryMode;
  planningMode: PlanningMode;
  isMusicProject: boolean;
}

export function analyzeStoryContext(
  idea: string,
  settings: VideoSettings,
  fullStory?: string,
  characterInstructions?: string
): StoryContext {
  const totalSec = parseDurationSeconds(settings.totalDuration || settings.duration || settings.targetDuration);
  const sceneSec = parseSceneSeconds(settings.sceneDuration, 10);
  
  let sceneCount = Math.max(1, Math.round(totalSec / sceneSec));
  if (settings.sceneCount && settings.sceneCount !== 'Auto') {
    const parsed = parseInt(String(settings.sceneCount), 10);
    if (!isNaN(parsed) && parsed > 0) sceneCount = parsed;
  } else if (settings.targetScenesCount && settings.targetScenesCount > 0) {
    sceneCount = settings.targetScenesCount;
  }

  const lang = (settings.language || 'English').toLowerCase();
  const isHindi = lang.includes('hindi') && !lang.includes('hinglish');
  const isHinglish = lang.includes('hinglish');

  const voiceMode = settings.voiceMode || 'Narrator + Character Dialogue';
  const isNoSpoken = voiceMode === 'No Spoken Dialogue' || voiceMode.toLowerCase().includes('no spoken');
  const isNarratorOnly = voiceMode === 'Narrator' || voiceMode.toLowerCase().includes('narrator only');
  const isCharOnly = voiceMode === 'Character Dialogue' || (voiceMode.toLowerCase().includes('character dialogue') && !voiceMode.toLowerCase().includes('narrator'));
  const isBoth = !isNoSpoken && !isNarratorOnly && !isCharOnly;

  const storyMode: StoryMode = settings.storyMode || (fullStory ? 'user_refined' : 'ai_create');
  const planningMode: PlanningMode = settings.planningMode || 'ai_auto';

  // Only "Kids Rhyme" and "Music" video types are actual song/lyrics projects — every
  // other video type (Story, Educational, Documentary, Cinematic, Explainer, etc.)
  // must use narration/dialogue, never be treated as a continuous song.
  const videoTypeLower = (settings.videoType || '').toLowerCase();
  const isMusicProject = videoTypeLower.includes('rhyme') || videoTypeLower.includes('music');

  return {
    title: idea.trim(),
    fullStory: fullStory?.trim(),
    characterInstructions: characterInstructions?.trim(),
    settings,
    totalSec,
    sceneSec,
    sceneCount,
    isHindi,
    isHinglish,
    voiceMode,
    isNoSpoken,
    isNarratorOnly,
    isCharOnly,
    isBoth,
    storyMode,
    planningMode,
    isMusicProject,
  };
}

/** Returns the names of any registered characters actually mentioned (whole word,
 * case-insensitive) inside a given chunk of story text — used to ground story
 * progression beats and scenes in the real character registry instead of
 * generic placeholders like "Protagonist" / "All Characters". */
export function namesInText(text: string, chars: CharacterProfile[]): string[] {
  if (!text) return [];
  return chars
    .filter((c) => {
      const escaped = c.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`\\b${escaped}\\b`, 'i').test(text);
    })
    .map((c) => c.name);
}

// -------------------------------------------------------------
// UNIVERSAL STORY ENGINE
// -------------------------------------------------------------

export function generateStoryUniversal(
  idea: string,
  settings: VideoSettings,
  userStoryInput?: string,
  characterInstructions?: string
): StoryData {
  const storyMode: StoryMode = settings.storyMode || (userStoryInput ? 'user_refined' : 'ai_create');
  const storySource: StorySource = settings.storySource || (userStoryInput ? 'user_story' : 'ai_create');
  const lang = settings.language || 'English';
  const isHindi = lang.toLowerCase().includes('hindi');
  const style = settings.visualStyle || '3D Cartoon';
  const rawStory = (userStoryInput || settings.storyText || settings.fullStory || '').trim();

  // Mode B2: EXACT USER STORY
  if (storyMode === 'user_exact' && rawStory) {
    const paragraphs = rawStory.split(/\n\s*\n|\n/).filter((p) => p.trim().length > 0);
    // Extract the REAL character registry from the user's own story text (never
    // from the project title) so progression beats reference actual characters
    // instead of a generic "Story Characters" placeholder.
    const exactAssets = extractAllAssetsUniversal(idea, settings, rawStory, characterInstructions);
    let carryForwardChars: string[] = [];
    const progression: StoryProgressionBeat[] = paragraphs.map((para, i) => {
      const actNumber = i + 1;
      let actName = `Act ${actNumber}: Story Beat`;
      if (i === 0) actName = 'Act 1: Beginning & Opening Setup';
      else if (i === 1) actName = 'Act 2: Rising Progression';
      else if (i === Math.floor(paragraphs.length / 2)) actName = 'Act 3: Core Turning Point';
      else if (i === paragraphs.length - 2) actName = 'Act 4: Climax';
      else if (i === paragraphs.length - 1) actName = `Act ${actNumber}: Resolution & Conclusion`;

      let beatChars = namesInText(para, exactAssets.characters);
      if (beatChars.length === 0) beatChars = carryForwardChars;
      if (beatChars.length > 0) carryForwardChars = beatChars;

      return {
        act: actName,
        title: `Beat ${actNumber}`,
        summary: para.slice(0, 150) + (para.length > 150 ? '...' : ''),
        characters: beatChars.length > 0 ? beatChars : ['Narrator'],
        keyActions: para.slice(0, 120),
        dialogueSnippet: para.includes('"') ? para.match(/"([^"]+)"/)?.[0] : undefined,
      };
    });

    return {
      storyMode: 'user_exact',
      storySource: 'user_story',
      exactStory: rawStory,
      fullStory: rawStory,
      summary: `Original story production based on "${idea}".`,
      premise: `Original story production based on "${idea}" maintained with exact narrative fidelity.`,
      characterOverview: characterInstructions || 'Characters defined in the story narrative.',
      environmentWorld: `Thematic world of ${idea} in ${style} aesthetic.`,
      progression: progression,
      progressionBeats: progression,
      charactersInvolved: exactAssets.characters.length > 0 ? exactAssets.characters.map((c) => c.name) : ['Narrator'],
      dialogueHighlights: paragraphs.slice(0, 3).map((p) => p.slice(0, 90) + '...'),
      storyTone: settings.tone || 'Exciting',
      targetAudienceAnalysis: `${settings.audience || 'General'} audience enjoying ${style} storytelling in ${lang}`,
    };
  }

  // Mode B1: USER STORY WITH AI REFINEMENT
  if (storyMode === 'user_refined' && rawStory) {
    const refinedStoryText = rawStory;
    const paragraphs = refinedStoryText.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

    // Extract the REAL character registry from the refined story text (never from
    // the project title) so progression beats reference actual characters instead
    // of generic "Protagonist" / "Companions" / "All Characters" placeholders.
    const refinedAssets = extractAllAssetsUniversal(idea, settings, refinedStoryText, characterInstructions);
    const allRealNames = refinedAssets.characters.map((c) => c.name);
    // Roughly quarter the story text (by paragraph, or by beat-splitting when the
    // story isn't paragraph-separated) so each of the 4 acts is grounded in a real
    // slice of story content instead of being entirely generic prose.
    const actChunks: string[] =
      paragraphs.length >= 4
        ? paragraphs
        : (() => {
            const beats = splitStoryIntoBeats(refinedStoryText);
            const groups = mapScenesToBeats(4, beats);
            return groups.map((g) => g.join(' '));
          })();

    const charsForAct = (chunk: string, fallback: string[]): string[] => {
      const found = namesInText(chunk, refinedAssets.characters);
      return found.length > 0 ? found : fallback;
    };

    const act1Chars = charsForAct(actChunks[0] || '', allRealNames.slice(0, 1));
    const act2Chars = charsForAct(actChunks[1] || '', act1Chars);
    const act3Chars = charsForAct(actChunks[2] || '', allRealNames);
    const act4Chars = charsForAct(actChunks[3] || actChunks[actChunks.length - 1] || '', allRealNames);

    const progression: StoryProgressionBeat[] = [
      {
        act: 'Act 1: Hook & Setting the Stakes',
        title: 'Opening Discovery',
        summary: paragraphs[0] || actChunks[0] || `Introduction to the world of ${idea}.`,
        characters: act1Chars.length > 0 ? act1Chars : ['Narrator'],
        keyActions: 'Arrival, initial observation, discovering unexpected signals.',
      },
      {
        act: 'Act 2: Rising Action & Exploration',
        title: 'Journey Unfolds',
        summary: paragraphs[1] || actChunks[1] || `The adventure deepens with exciting exploration and obstacle solving.`,
        characters: act2Chars.length > 0 ? act2Chars : ['Narrator'],
        keyActions: 'Navigating obstacles, discovering vital clues.',
      },
      {
        act: 'Act 3: Turning Point & Discovery',
        title: 'The Core Secret',
        summary: paragraphs[2] || actChunks[2] || `A dramatic revelation reshapes everything known so far.`,
        characters: act3Chars.length > 0 ? act3Chars : ['Narrator'],
        keyActions: 'Unlocking the central mystery, confronting unexpected stakes.',
      },
      {
        act: 'Act 4: The Climax & Resolution',
        title: 'Triumph and Renewal',
        summary: paragraphs[3] || paragraphs[paragraphs.length - 1] || actChunks[3] || `A conclusion uniting the characters.`,
        characters: act4Chars.length > 0 ? act4Chars : ['Narrator'],
        keyActions: 'Mastery, triumphant realization, and lasting legacy.',
      },
    ];

    return {
      storyMode: 'user_refined',
      storySource: 'user_story',
      refinedStory: refinedStoryText,
      fullStory: refinedStoryText,
      summary: `Polished narrative journey based on "${idea}".`,
      premise: `Polished narrative journey based on "${idea}" enriched for ${style} video production.`,
      characterOverview: characterInstructions || `Characters adapted dynamically for "${idea}".`,
      environmentWorld: `Vibrant visual world of ${idea} rendered in ${style} aesthetic.`,
      progression: progression,
      progressionBeats: progression,
      charactersInvolved: allRealNames.length > 0 ? allRealNames : ['Narrator'],
      dialogueHighlights: [
        'Engaging moments of discovery and camaraderie.',
        'High-stakes turning points and wondrous revelations.',
        'Inspiring words of courage, curiosity, and celebration.',
      ],
      storyTone: settings.tone || 'Exciting',
      targetAudienceAnalysis: `${settings.audience || 'General'} audience watching ${style} video in ${lang}`,
    };
  }

  // Mode A: AI CREATE COMPLETE STORY
  const storyText = createUniversalStoryText(idea, settings, characterInstructions);
  // Extract the REAL character registry from the generated story text itself so
  // progression beats reference actual characters instead of generic "Lead
  // Explorer" / "Protagonist" / "All Characters" placeholders.
  const createdAssets = extractAllAssetsUniversal(idea, settings, storyText, characterInstructions);
  const createdNames = createdAssets.characters.map((c) => c.name);
  const createdBeats = splitStoryIntoBeats(storyText);
  const createdActChunks = mapScenesToBeats(4, createdBeats).map((g) => g.join(' '));
  const actCharsOrFallback = (chunk: string, fallback: string[]): string[] => {
    const found = namesInText(chunk, createdAssets.characters);
    return found.length > 0 ? found : fallback;
  };
  const cAct1 = actCharsOrFallback(createdActChunks[0] || '', createdNames.slice(0, 1));
  const cAct2 = actCharsOrFallback(createdActChunks[1] || '', cAct1.length > 0 ? cAct1 : createdNames);
  const cAct3 = actCharsOrFallback(createdActChunks[2] || '', createdNames);
  const cAct4 = actCharsOrFallback(createdActChunks[3] || '', createdNames);

  const beats: StoryProgressionBeat[] = [
    {
      act: 'Act 1: Opening Hook & World Setup',
      title: 'The Spark of Wonder',
      summary: createdActChunks[0] || `Our characters arrive in the extraordinary realm of "${idea}". Immediate visual curiosity grabs the viewer.`,
      characters: cAct1.length > 0 ? cAct1 : ['Narrator'],
      keyActions: 'Stepping into the unknown, identifying the primary wonder or mystery.',
    },
    {
      act: 'Act 2: Rising Adventure & Escalation',
      title: 'Deeper into the Realm',
      summary: createdActChunks[1] || 'Exploring wondrous landmarks, solving playful challenges, and building dynamic character chemistry.',
      characters: cAct2.length > 0 ? cAct2 : ['Narrator'],
      keyActions: 'Overcoming environmental obstacles, unlocking visual wonders.',
    },
    {
      act: 'Act 3: Climax & The Grand Secret',
      title: 'The Pivotal Revelation',
      summary: createdActChunks[2] || 'The ultimate mystery is revealed in a burst of cinematic light, sound, and emotional triumph.',
      characters: cAct3.length > 0 ? cAct3 : ['Narrator'],
      keyActions: 'Reaching the central summit, activating the source of wonder.',
    },
    {
      act: 'Act 4: Heartfelt Resolution',
      title: 'A Legacy of Wonder',
      summary: createdActChunks[3] || 'Celebrating unity, new friendship, and the eternal beauty of the completed adventure.',
      characters: cAct4.length > 0 ? cAct4 : ['Narrator'],
      keyActions: 'Triumphant celebration, horizon gaze, and inspiring closing words.',
    },
  ];

  return {
    storyMode: 'ai_create',
    storySource: 'ai_create',
    fullStory: storyText,
    summary: `Complete original narrative crafted for "${idea}".`,
    premise: `An exhilarating, high-retention adventure exploring "${idea}" crafted in ${style} aesthetic.`,
    characterOverview: characterInstructions || `Authentic, relatable characters designed specifically for "${idea}".`,
    environmentWorld: `Rich, immersive environments designed with ${style} lighting and vibrant depth.`,
    progression: beats,
    progressionBeats: beats,
    charactersInvolved: createdNames.length > 0 ? createdNames : ['Narrator'],
    dialogueHighlights: [
      'Memorable opening question inviting immediate curiosity.',
      'Rhythmic and engaging character interactions.',
      'Inspiring, heartfelt closing sentiment.',
    ],
    storyTone: settings.tone || 'Exciting',
    targetAudienceAnalysis: `${settings.audience || 'General'} audience on YouTube seeking ${settings.tone} content in ${lang}`,
  };
}

function createUniversalStoryText(idea: string, settings: VideoSettings, characterInstructions?: string): string {
  const lang = settings.language || 'English';
  const isHindi = lang.toLowerCase().includes('hindi');
  const style = settings.visualStyle || '3D Cartoon';

  if (isHindi) {
    return `एक समय की बात है, इस अनूठी और मनमोहक दुनिया में एक नई सुबह की शुरुआत होती है। चारों ओर एक रहस्यमयी और रोमांचक वातावरण फैला हुआ है, जहाँ हर दृश्य में कौतूहल की झलक मिलती है।\n\nजैसे-जैसे यात्रा आगे बढ़ती है, एक अप्रत्याशित चुनौती और जादुई संकेत प्रकट होता है। साहस और आपसी समझ के साथ उस रास्ते पर आगे कदम बढ़ते हैं, जहाँ हर मोड़ पर नई खोज इंतज़ार कर रही होती है।\n\nकहानी के इस महत्वपूर्ण मोड़ पर, एक गहरा रहस्य सामने आता है जो सब कुछ बदल कर रख देता है। परिस्थितियाँ कठिन हो जाती हैं और असली शक्ति और दृढ़ संकल्प का परिचय देना पड़ता है।\n\nचरम संघर्ष और रोमांच के क्षण में, पूरी लगन और बहादुरी के साथ इस चुनौती का सामना किया जाता है। अद्भुत दृश्यों और चमत्कारी ऊर्जा के बीच जीत हासिल होती है।\n\nअंत में, चारों ओर शांति और उत्सव का माहौल छा जाता है। यह कहानी हमें सिखाती है कि सच्ची लगन, एकता और साहस से हर मुश्किल आसान हो जाती है।`;
  }

  return `In a vibrant, wondrous realm, a monumental journey begins. The morning air is filled with palpable curiosity, and every detail of the environment hints at a hidden wonder waiting to be uncovered.\n\nAs the expedition advances, unexpected signals lead deeper into uncharted territory. Guided by intuition and steadfast courage, intricate obstacles are navigated to uncover visual clues illuminating the path ahead.\n\nAt the central turning point, the true stakes of the quest are revealed. A sudden shift in the environment forces a critical decision, testing the bonds of determination.\n\nIn a climactic surge of action and visual splendor, the ultimate challenge is confronted. Leveraging distinct strengths and steadfast resolve, the tide turns in an exhilarating display of triumph.\n\nWith harmony restored and the quest fulfilled, a radiant dawn breaks across the horizon, leaving an indelible mark of inspiration, unity, and timeless wonder.`;
}

// -------------------------------------------------------------
// CENTRAL ASSET EXTRACTION & REGISTRY ENGINE (CORE UPGRADE)
// -------------------------------------------------------------

export function extractAllAssetsUniversal(
  idea: string,
  settings: VideoSettings,
  fullStoryText?: string,
  characterInstructions?: string
): {
  characters: CharacterProfile[];
  props: PropProfile[];
  environments: EnvironmentProfile[];
  assetRegistry: AssetRegistry;
} {
  // STRICT RULE 1 & 2: Characters are extracted EXCLUSIVELY from active story text and user character instructions.
  // NEVER extract characters merely from project title, project name, page title, or metadata.
  const activeStory = (
    fullStoryText ||
    settings.fullStory ||
    settings.storyText ||
    settings.refinedStory ||
    ''
  ).trim();

  const instructions = (characterInstructions || settings.characterInstructions || '').trim();
  const storyNarrative = `${activeStory}\n${instructions}`.trim();
  const style = settings.visualStyle || '3D Cartoon';
  const lang = settings.language || 'English';

  const characters: CharacterProfile[] = [];
  const props: PropProfile[] = [];
  const environments: EnvironmentProfile[] = [];

  const toStableId = (prefix: string, name: string) => {
    const clean = name.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return clean.length > 0 ? `${prefix}_${clean}` : prefix.toUpperCase();
  };

  // -------------------------------------------------------------
  // GENERIC LINGUISTIC RESOURCES (never tied to a specific story/name)
  // -------------------------------------------------------------

  // Common grammatical / filler words (English + romanized Hindi + Devanagari) that must
  // NEVER be treated as a character name, however they are capitalized in the raw text.
  const STOP_WORDS = new Set([
    'i', 'me', 'my', 'mine', 'myself', 'we', 'us', 'our', 'ours', 'ourselves',
    'you', 'your', 'yours', 'yourself', 'yourselves',
    'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself',
    'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
    'who', 'whom', 'whose', 'which', 'what',
    'two friends', 'three friends', 'four friends', 'his friends', 'her friends', 'their friends',
    'my friends', 'best friends', 'good friends', 'the friends', 'friends', 'two sisters', 'three sisters',
    'the sisters', 'two brothers', 'the brothers', 'two companions', 'the companions', 'companions',
    'children', 'the children', 'kids', 'the kids', 'the group', 'group', 'everyone', 'someone',
    'people', 'the people', 'characters', 'main characters', 'lead characters', 'the team', 'the crew',
    'some animals', 'the animals', 'animals', 'creatures', 'one day', 'once upon a time',
    'चारों ओर', 'मुख्य पात्रों', 'वे', 'सभी', 'दोनों दोस्त', 'दोस्त', 'मित्र', 'साथी', 'लोग', 'एक समय',
    'कहानी', 'यात्रा', 'दृश्य', 'रास्ता', 'रहस्य', 'समय', 'थी', 'था', 'थे', 'adventure', 'journey',
    'morning', 'evening', 'sunlight', 'forest', 'mountain', 'kingdom', 'world', 'realm', 'universe',
    'chapter', 'scene', 'act', 'title', 'idea', 'video', 'youtube', 'secret', 'ancient', 'city', 'ocean',
    'ek', 'do', 'teen', 'chaar', 'paanch', 'dono', 'sabhi', 'sab', 'unke', 'unka', 'unki', 'uske', 'uska', 'uski',
    'unhe', 'unhi', 'unhone', 'inhe', 'humne', 'humein', 'humara', 'mera', 'meri', 'mere', 'aapka', 'aapke',
    'tera', 'teri', 'tere', 'yeh', 'woh', 'wahan', 'yahan', 'jahan', 'kahan', 'tab', 'jab', 'phir',
    'kaha', 'kahaa', 'bole', 'boli', 'bola', 'kahaani', 'yatra', 'jungle', 'van', 'shehar', 'samundar', 'neeche',
    'upar', 'aage', 'peeche', 'andar', 'bahar', 'rahasya', 'rahasyamayi', 'sundar', 'chamakte', 'hue', 'roshni',
    'darwaza', 'darwaze', 'paas', 'pahunchti', 'pahunche', 'pahuncha', 'lekar', 'badhti', 'badhta', 'tairti', 'tairta',
    'khul', 'jata', 'jati', 'jaate', 'jaata', 'jaati', 'uthta', 'uthti', 'poora', 'poori', 'behnein', 'behen', 'bhai',
    'dost', 'mitra', 'saath', 'apne', 'mein', 'ja', 'rahe', 'rahi', 'raha', 'tha', 'thi', 'the', 'hai', 'hain',
    'hoon', 'milti', 'milta', 'mile', 'mila', 'jiska', 'jiski', 'jiske', 'naam', 'karti', 'karta', 'karte',
    'karega', 'karegi', 'bhi', 'se', 'ki', 'ka', 'ke', 'ko', 'ne', 'aaj', 'kal', 'parso', 'yamuna', 'ganga',
    'kinare', 'jaana', 'aana', 'chahiye', 'muskuraya', 'muskurayi', 'badhne', 'laga', 'lagi', 'lage', 'achanak',
    'subah', 'shaam', 'raat', 'dopahar', 'torch', 'gate', 'cave', 'light', 'door', 'path', 'vista', 'mysterious',
    'talking', 'purane', 'purani', 'purana', 'and', 'the', 'with', 'their', 'they', 'when', 'then', 'there',
    'here', 'suddenly', 'finally', 'while', 'inside', 'outside', 'this', 'that', 'these', 'those',
  ]);

  // Generic story-role / non-name descriptors that occasionally get capitalized mid-sentence
  // (e.g. as the start of a translated clause) but are never proper nouns.
  const GENERIC_ROLE_WORDS = new Set([
    'boy', 'girl', 'man', 'woman', 'child', 'kid', 'friend', 'friends', 'sister', 'brother',
    'guide', 'explorer', 'hero', 'heroine', 'protagonist', 'narrator', 'traveler', 'traveller',
  ]);

  // Generic creature / species vocabulary used ONLY to classify a character's TYPE once a
  // name has already been discovered near it in the text. This is world-knowledge about
  // common story creatures, not a lookup keyed on any particular character's name, so it
  // generalizes to any story.
  const SPECIES_LIBRARY: Array<{
    pattern: RegExp;
    species: string;
    characterType: string;
    appearanceHint: string;
    furOrSkinHint: string;
  }> = [
    { pattern: /\bfox(?:es)?\b/i, species: 'Fox', characterType: 'Animal (Fox)', appearanceHint: 'sleek fox with a bushy tail and alert pointed ears', furOrSkinHint: 'Rich russet-orange fur with a white underbelly and dark paw markings' },
    { pattern: /\bwolves|\bwolf\b/i, species: 'Wolf', characterType: 'Animal (Wolf)', appearanceHint: 'lean wolf with keen amber eyes', furOrSkinHint: 'Silvery-grey double-layered fur' },
    { pattern: /\btigers?\b/i, species: 'Tiger', characterType: 'Animal (Tiger)', appearanceHint: 'powerful striped tiger', furOrSkinHint: 'Orange coat with bold black stripes' },
    { pattern: /\blions?\b/i, species: 'Lion', characterType: 'Animal (Lion)', appearanceHint: 'noble maned lion', furOrSkinHint: 'Golden coat with a full mane' },
    { pattern: /\bbears?\b/i, species: 'Bear', characterType: 'Animal (Bear)', appearanceHint: 'sturdy round-eared bear', furOrSkinHint: 'Thick honey-brown fur' },
    { pattern: /\brabbits?\b|\bbunn(?:y|ies)\b/i, species: 'Rabbit', characterType: 'Animal (Rabbit)', appearanceHint: 'fluffy long-eared rabbit', furOrSkinHint: 'Soft cream-white fur with pink-lined ears' },
    { pattern: /\bdogs?\b|\bpupp(?:y|ies)\b/i, species: 'Dog', characterType: 'Animal (Dog)', appearanceHint: 'friendly floppy-eared dog', furOrSkinHint: 'Short glossy fur' },
    { pattern: /\bcats?\b|\bkitten(?:s)?\b/i, species: 'Cat', characterType: 'Animal (Cat)', appearanceHint: 'agile whiskered cat', furOrSkinHint: 'Sleek tabby fur' },
    { pattern: /\bowls?\b/i, species: 'Owl', characterType: 'Animal (Owl)', appearanceHint: 'wise round-eyed owl', furOrSkinHint: 'Speckled tawny feathers' },
    { pattern: /\bbirds?\b/i, species: 'Bird', characterType: 'Animal (Bird)', appearanceHint: 'small bright-plumed bird', furOrSkinHint: 'Vivid feathered plumage' },
    { pattern: /\belephants?\b/i, species: 'Elephant', characterType: 'Animal (Elephant)', appearanceHint: 'gentle large-eared elephant', furOrSkinHint: 'Weathered grey hide' },
    { pattern: /\bmonkeys?\b/i, species: 'Monkey', characterType: 'Animal (Monkey)', appearanceHint: 'agile long-tailed monkey', furOrSkinHint: 'Chestnut-brown fur' },
    { pattern: /\bdeer\b/i, species: 'Deer', characterType: 'Animal (Deer)', appearanceHint: 'graceful antlered deer', furOrSkinHint: 'Fawn-brown coat with white spots' },
    { pattern: /\bhorses?\b|\bpon(?:y|ies)\b/i, species: 'Horse', characterType: 'Animal (Horse)', appearanceHint: 'graceful long-maned horse', furOrSkinHint: 'Glossy chestnut coat' },
    { pattern: /\bfish\b/i, species: 'Fish', characterType: 'Aquatic Creature', appearanceHint: 'shimmering scaled fish', furOrSkinHint: 'Iridescent scales' },
    { pattern: /\bpenguins?\b/i, species: 'Penguin', characterType: 'Animal (Penguin)', appearanceHint: 'plump waddling penguin', furOrSkinHint: 'Black-and-white feathers' },
    { pattern: /\bgiraffes?\b/i, species: 'Giraffe', characterType: 'Animal (Giraffe)', appearanceHint: 'tall spotted giraffe', furOrSkinHint: 'Golden coat with chestnut patches' },
    { pattern: /\bdragons?\b/i, species: 'Dragon', characterType: 'Fantasy Creature (Dragon)', appearanceHint: 'majestic scaled dragon with folded wings', furOrSkinHint: 'Iridescent emerald scales' },
    { pattern: /\brobot(?:s)?\b|\bandroid(?:s)?\b|\bA\.?I\.?\b/i, species: 'Robot', characterType: 'Robot', appearanceHint: 'sleek mechanical robot with glowing accents', furOrSkinHint: 'Brushed metal chassis with soft LED highlights' },
    { pattern: /\baliens?\b/i, species: 'Alien', characterType: 'Alien', appearanceHint: 'otherworldly alien with luminous features', furOrSkinHint: 'Smooth iridescent skin' },
    { pattern: /\bfair(?:y|ies)\b/i, species: 'Fairy', characterType: 'Fantasy Creature (Fairy)', appearanceHint: 'delicate winged fairy', furOrSkinHint: 'Glowing translucent skin with shimmering wings' },
    { pattern: /\bmermaid(?:s)?\b/i, species: 'Mermaid', characterType: 'Fantasy Creature (Mermaid)', appearanceHint: 'graceful mermaid with a shimmering tail', furOrSkinHint: 'Iridescent scaled tail' },
    { pattern: /\bunicorns?\b/i, species: 'Unicorn', characterType: 'Fantasy Creature (Unicorn)', appearanceHint: 'radiant horned unicorn', furOrSkinHint: 'Pearlescent white coat with a flowing mane' },
    { pattern: /\bghosts?\b/i, species: 'Ghost', characterType: 'Fantasy Creature (Ghost)', appearanceHint: 'gentle translucent spirit', furOrSkinHint: 'Soft glowing translucent form' },
    { pattern: /\bwitch(?:es)?\b/i, species: 'Human / Witch', characterType: 'Fantasy Being (Witch)', appearanceHint: 'mysterious witch in a flowing cloak', furOrSkinHint: 'Pale skin with a weathered, wise expression' },
    { pattern: /\bwizard(?:s)?\b/i, species: 'Human / Wizard', characterType: 'Fantasy Being (Wizard)', appearanceHint: 'wise robed wizard', furOrSkinHint: 'Weathered skin with a long flowing beard' },
  ];

  // Generic markers that signal "this word introduces a name" (works for any language/name).
  const NAME_INTRODUCTION_PATTERN = /(?:named|called|naam|jiska naam|jiski naam|jiske naam)\s+([A-Za-z][a-zA-Z]{1,20})\b/gi;

  interface DiscoveredEntity {
    rawName: string;
    firstIndex: number;
    speciesMatch?: (typeof SPECIES_LIBRARY)[number];
    contextWindow: string;
  }

  const discoveredEntities: Map<string, DiscoveredEntity> = new Map();
  // Species mentions that were NOT explicitly given a proper name nearby (e.g. "a bunny hopped by").
  const unnamedSpeciesUsed: Set<string> = new Set();

  const getContextWindow = (index: number, length: number) => {
    const start = Math.max(0, index - 60);
    const end = Math.min(storyNarrative.length, index + length + 60);
    return storyNarrative.slice(start, end);
  };

  const addEntity = (rawName: string, index: number, confidence: 'high' | 'low' = 'high') => {
    const clean = rawName.trim().replace(/^[\s,.;:!?\-'"()]+|[\s,.;:!?\-'"()]+$/g, '');
    if (!clean || clean.length < 2) return;
    const lower = clean.toLowerCase();

    if (STOP_WORDS.has(lower)) return;
    if (GENERIC_ROLE_WORDS.has(lower)) return;
    if (/^(the|a|an|in|at|on|with|from|by|to|and|or|is|are|was|were|then|there|here|suddenly|finally|when|as|after|before|into|onto|their|his|her|its|our|your)$/i.test(clean)) return;
    // Reject candidates that are actually generic species/common nouns (e.g. "Fox" at a
    // sentence boundary) rather than a character's given name.
    if (SPECIES_LIBRARY.some((s) => s.pattern.test(clean) && clean.length < 12 && new RegExp(`^${s.pattern.source}$`, 'i').test(clean))) return;
    // Low-confidence candidates (the broad generic capitalized-word scan, PASS 4)
    // reject common English gerunds/participles (e.g. "Guided", "Leveraging") that
    // are capitalized only because they start a sentence in template prose — real
    // given names essentially never take this shape. Higher-confidence passes
    // (explicit "named X", instructions, pair patterns) are exempt so genuine
    // names like "King" or "Ming" are never rejected.
    if (confidence === 'low' && /^[A-Z][a-z]*(?:ing|ed)$/.test(clean) && clean.length > 4) return;

    // Do NOT extract if this word is merely the project title itself and not in the story text
    if (clean.toLowerCase() === idea.trim().toLowerCase() && !storyNarrative.includes(clean)) {
      return;
    }

    const key = lower;
    if (!discoveredEntities.has(key)) {
      discoveredEntities.set(key, {
        rawName: clean,
        firstIndex: index,
        contextWindow: getContextWindow(index, clean.length),
      });
    }
  };

  // -------------------------------------------------------------
  // PASS 1: EXPLICIT CHARACTER INSTRUCTIONS (Highest priority)
  // -------------------------------------------------------------
  if (instructions) {
    const instructionParts = instructions.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
    for (const part of instructionParts) {
      const match = part.match(/^([A-Za-z\u0900-\u097F]+(?:\s+[A-Za-z\u0900-\u097F]+)?)(?:\s*\((.*?)\))?/);
      if (match && match[1]) {
        addEntity(match[1].trim(), storyNarrative.indexOf(match[1].trim()));
      }
    }
  }

  // -------------------------------------------------------------
  // PASS 2: EXPLICIT "named X" / "naam X" INTRODUCTIONS (any language, any name)
  // -------------------------------------------------------------
  for (const match of storyNarrative.matchAll(NAME_INTRODUCTION_PATTERN)) {
    if (match[1] && match.index !== undefined) {
      addEntity(match[1], match.index);
    }
  }

  // -------------------------------------------------------------
  // PASS 3: PAIR / LIST NAME PATTERNS ("X aur Y", "X, Y and Z")
  // -------------------------------------------------------------
  const multiNameMatches = storyNarrative.matchAll(/\b([A-Z][a-z]+(?: [A-Z][a-z]+)?)\s*,\s*([A-Z][a-z]+(?: [A-Z][a-z]+)?)(?:\s*,\s*([A-Z][a-z]+(?: [A-Z][a-z]+)?))?(?:\s*,?\s*(?:and|aur|va|tatha|or|&)\s+([A-Z][a-z]+(?: [A-Z][a-z]+)?))?/g);
  for (const match of multiNameMatches) {
    if (match.index === undefined) continue;
    if (match[1]) addEntity(match[1], match.index);
    if (match[2]) addEntity(match[2], match.index);
    if (match[3]) addEntity(match[3], match.index);
    if (match[4]) addEntity(match[4], match.index);
  }

  const pairMatches = storyNarrative.matchAll(/\b([A-Z][a-z]+)\s+(?:and|aur|va|tatha|or|&)\s+([A-Z][a-z]+)\b/g);
  for (const match of pairMatches) {
    if (match.index === undefined) continue;
    if (match[1]) addEntity(match[1], match.index);
    if (match[2]) addEntity(match[2], match.index);
  }

  // NOTE: intentionally no 'i' flag here — with case-insensitivity the [A-Z] in the
  // capture group would also match lowercase letters, letting a keyword like "named"
  // match itself as if it were the captured name. The keyword alternation is written
  // in lowercase, which is how these role-introduction phrases normally appear.
  const roleNamedMatches = storyNarrative.matchAll(/(?:named|called|sister|brother|friend|dost|explorer|photographer|detective|scientist|captain|hero|princess|king|doctor)\s+([A-Z][a-z]+)\b/g);
  for (const match of roleNamedMatches) {
    if (match[1] && match.index !== undefined) addEntity(match[1], match.index);
  }

  // -------------------------------------------------------------
  // PASS 4: GENERIC CAPITALIZED-WORD SCAN (catches any remaining proper noun)
  // Every capitalized word is treated as a candidate name; common function/filler
  // words (Hindi and English) are filtered out via STOP_WORDS / GENERIC_ROLE_WORDS
  // regardless of where in the sentence they sit, since a positional heuristic
  // alone would incorrectly reject genuine single-mention names that happen to
  // start a sentence (e.g. "Balram unke saath tha.").
  // -------------------------------------------------------------
  const capitalizedOccurrences: Map<string, number[]> = new Map();
  for (const match of storyNarrative.matchAll(/\b([A-Z][a-z]{2,15})\b/g)) {
    const word = match[1];
    if (match.index === undefined) continue;
    if (!capitalizedOccurrences.has(word)) capitalizedOccurrences.set(word, []);
    capitalizedOccurrences.get(word)!.push(match.index);
  }

  for (const [word, indices] of capitalizedOccurrences) {
    if (STOP_WORDS.has(word.toLowerCase()) || GENERIC_ROLE_WORDS.has(word.toLowerCase())) continue;
    addEntity(word, indices[0], 'low');
  }

  // -------------------------------------------------------------
  // PASS 5: SPECIES DETECTION FOR EACH DISCOVERED NAME
  // Look at the text immediately around each discovered name for a generic
  // creature/species keyword to determine its character type.
  // -------------------------------------------------------------
  for (const [, entity] of discoveredEntities) {
    for (const speciesEntry of SPECIES_LIBRARY) {
      if (speciesEntry.pattern.test(entity.contextWindow)) {
        entity.speciesMatch = speciesEntry;
        break;
      }
    }
  }

  // -------------------------------------------------------------
  // PASS 6: UNNAMED SPECIES MENTIONS (e.g. "a friendly bunny hopped along" with no
  // proper name given anywhere nearby). Only added when NO discovered name in the
  // story already claimed that species via PASS 5, so a named animal is never
  // duplicated as a second, generic entity.
  // -------------------------------------------------------------
  const claimedSpecies = new Set(
    Array.from(discoveredEntities.values())
      .map((e) => e.speciesMatch?.species)
      .filter(Boolean) as string[]
  );
  if (discoveredEntities.size === 0) {
    for (const speciesEntry of SPECIES_LIBRARY) {
      const match = speciesEntry.pattern.exec(storyNarrative);
      if (match && !claimedSpecies.has(speciesEntry.species)) {
        const genericName = speciesEntry.species;
        discoveredEntities.set(`__species_${genericName.toLowerCase()}`, {
          rawName: genericName,
          firstIndex: match.index,
          speciesMatch: speciesEntry,
          contextWindow: getContextWindow(match.index, genericName.length),
        });
        claimedSpecies.add(genericName);
      }
    }
  }

  // -------------------------------------------------------------
  // PASS 7: INFERRED STORY CHARACTERS (e.g. "two sisters", "two friends") — only
  // used when nothing explicit was found at all, so the registry is never empty.
  // -------------------------------------------------------------
  if (discoveredEntities.size === 0 && storyNarrative.length > 0) {
    if (/\btwo sisters\b|\b2 sisters\b/i.test(storyNarrative)) {
      discoveredEntities.set('elder sister', { rawName: 'Elder Sister', firstIndex: 0, contextWindow: '' });
      discoveredEntities.set('younger sister', { rawName: 'Younger Sister', firstIndex: 1, contextWindow: '' });
    } else if (/\btwo brothers\b|\b2 brothers\b/i.test(storyNarrative)) {
      discoveredEntities.set('elder brother', { rawName: 'Elder Brother', firstIndex: 0, contextWindow: '' });
      discoveredEntities.set('younger brother', { rawName: 'Younger Brother', firstIndex: 1, contextWindow: '' });
    } else if (/\btwo friends\b|\b2 friends\b/i.test(storyNarrative)) {
      discoveredEntities.set('first friend', { rawName: 'First Friend', firstIndex: 0, contextWindow: '' });
      discoveredEntities.set('second friend', { rawName: 'Second Friend', firstIndex: 1, contextWindow: '' });
    }
  }

  // -------------------------------------------------------------
  // PASS 8: BUILD COMPLETE LOCKED INDIVIDUAL PROFILES — driven entirely by the
  // discovered name + detected species/gender/age hints, never by a lookup table
  // keyed on the literal name. This is what makes the pipeline work for ANY story.
  // -------------------------------------------------------------
  const orderedEntities = Array.from(discoveredEntities.values()).sort((a, b) => a.firstIndex - b.firstIndex);

  let entityIndex = 1;
  for (const entity of orderedEntities) {
    const name = entity.rawName;
    const id = toStableId(`CHAR_${String(entityIndex).padStart(3, '0')}`, name);
    const isAnimalOrCreature = Boolean(entity.speciesMatch);
    const characterType = entity.speciesMatch?.characterType || 'Human';
    const species = entity.speciesMatch?.species || 'Human';

    // Generic role/gender/age inference from local context only (never from a name table).
    const ctxLower = entity.contextWindow.toLowerCase();
    let gender: string = 'Unspecified';
    if (/\b(he|his|boy|ladka|larka|male|beta|bhai)\b/.test(ctxLower)) gender = isAnimalOrCreature ? 'Male' : 'Male';
    else if (/\b(she|her|girl|ladki|larki|female|beti|behen)\b/.test(ctxLower)) gender = isAnimalOrCreature ? 'Female' : 'Female';

    let ageCategory = 'Young Adult';
    let age = '20 years old';
    if (/\b(child|kid|bachcha|bachcha|young|chota|choti)\b/.test(ctxLower)) {
      ageCategory = 'Child';
      age = '9 years old';
    }
    if (isAnimalOrCreature) {
      ageCategory = 'Ageless';
      age = 'Adult';
    }

    const isTalking = /\btalking\b|\bbol(ta|ti|te)\b/.test(ctxLower);
    const role = entityIndex === 1 ? 'Lead / Protagonist' : isAnimalOrCreature ? 'Animal Companion' : 'Supporting Character';

    const baseAppearanceHint = entity.speciesMatch?.appearanceHint || `${gender === 'Unspecified' ? 'expressive' : gender.toLowerCase()} human character`;
    const furOrSkin = entity.speciesMatch?.furOrSkinHint || 'Natural radiant skin tone with warm cinematic lighting';

    const appearance = isAnimalOrCreature
      ? `${name}, a ${isTalking ? 'talking ' : ''}${baseAppearanceHint}, rendered in ${style} aesthetic with expressive character-forward eyes.`
      : `${name}, a ${gender === 'Unspecified' ? '' : gender.toLowerCase() + ' '}character with warm expressive features, rendered in ${style} aesthetic.`;
    const visualAppearance = `${name} — ${characterType} in ${style}`;

    const face = isAnimalOrCreature
      ? 'Expressive, intelligent eyes with warm, character-forward gaze.'
      : 'Expressive eyes, warm facial symmetry, natural confident gaze.';
    const hair = isAnimalOrCreature ? furOrSkin : 'Neatly styled hair framing face with realistic physics.';
    const skin = isAnimalOrCreature ? furOrSkin : 'Natural radiant tone with volumetric lighting.';
    const body = isAnimalOrCreature ? 'Proportioned to species with natural posture and gait.' : 'Well-proportioned silhouette suited for animation.';
    const clothing = isAnimalOrCreature ? 'No clothing — natural coat/plumage/scales only, unless a signature accessory is noted.' : `Signature tailored outfit in ${style}.`;
    const accessories = 'Signature accessory establishing visual continuity across scenes.';
    const personality = 'Curious, warm, and emotionally expressive, with a distinct narrative role.';
    const voice = isTalking || !isAnimalOrCreature
      ? `Clear, characterful vocal delivery in ${lang}.`
      : `Non-verbal — communicates through sound design and expressive body language.`;

    const visualPromptAnchor = `${id}, ${name}, ${age}, ${characterType}, ${appearance}, ${style}, volumetric cinematic lighting, 8k render`;
    const characterConsistencyLock = `${id}: ${name}, ${characterType} (${age}): ${clothing}. Locked facial/feature structure and signature look must remain identical in every scene this character appears in.`;
    const generationPrompt = `Master reference portrait of ${id} (${name}), ${appearance}, aesthetic style ${style}, clean studio lighting, 8k --ar 1:1`;

    const charProfile: CharacterProfile = {
      id,
      name,
      displayName: `${name} (${role})`,
      role,
      characterType,
      type: 'character',
      species,
      age,
      ageCategory,
      ageOrSpecies: age,
      gender,
      description: `${name} rendered in ${style} aesthetic.`,
      appearance,
      visualAppearance,
      face,
      hair,
      eyes: 'Expressive and clear with natural highlights',
      hairOrFur: hair,
      skinOrVisualCharacteristics: skin,
      bodyOrBuild: body,
      bodyProportions: 'Natural proportions matched to age and species',
      clothing,
      clothingOutfit: clothing,
      shoes: isAnimalOrCreature ? 'N/A' : 'Signature footwear matching character design',
      accessories,
      signatureItem: accessories,
      personality,
      personalityTraits: ['Curious', 'Warm', 'Distinctive'],
      expressions: 'Warm reassuring expressions, wide-eyed curiosity, animated reactions.',
      voice,
      voiceStyle: voice,
      voiceCharacteristics: voice,
      speakingStyle: isTalking || !isAnimalOrCreature ? 'Natural, characterful cadence.' : 'Communicates via sound and gesture, not speech.',
      speakingOrSingingRole: role,
      characterPurpose: entityIndex === 1
        ? 'Lead the narrative and anchor the audience point of view.'
        : 'Support the narrative, deepen relationships, and create visual variety.',
      visualPromptAnchor,
      characterConsistencyLock,
      characterIdentityLock: characterConsistencyLock,
      generationPrompt,
      lockedAttributes: isAnimalOrCreature
        ? ['Species-accurate silhouette', 'Coat/fur/scale coloring', 'Signature accessory']
        : ['Signature Outfit', 'Facial Geometry', 'Hairstyle'],
      style,
      status: 'REFERENCE_READY',
      referenceImageStatus: 'READY',
      usageScenes: [],
      negativePrompt: 'different face, altered clothing, distorted proportions, extra limbs, blurry, morphing face, inconsistent outfit, changing colors',
    };

    characters.push(charProfile);
    entityIndex++;
  }

  // -------------------------------------------------------------
  // DEFAULT PROPS & ENVIRONMENTS (Narrative-Aware, generic keyword driven)
  // Uses the shared, module-level SETTING_LIBRARY so scene planning later
  // derives the SAME environment classification instead of rediscovering it.
  // -------------------------------------------------------------
  const lowerStory = storyNarrative.toLowerCase();
  const primarySetting = SETTING_LIBRARY.find((s) => s.pattern.test(lowerStory));

  props.push({
    id: toStableId('PROP', 'STORY_KEY_ARTIFACT'),
    displayName: 'Key Narrative Artifact',
    type: 'special_object',
    description: `Central artifact or device driving the narrative in ${style}.`,
    appearance: `Intricately designed thematic artifact with glowing accents in ${style}.`,
    style,
    lockedAttributes: ['Consistent finish', 'Signature glowing emblem'],
    generationPrompt: `Prop reference for narrative artifact, ${style}, 8k`,
    usageScenes: [1, 2, 3, 4, 5],
    status: 'REFERENCE_READY',
    referenceImageStatus: 'READY',
  });

  environments.push(
    {
      id: toStableId('ENV', primarySetting ? primarySetting.label : 'PRIMARY_SETTING'),
      displayName: primarySetting ? primarySetting.label : 'Primary Narrative Setting',
      type: 'environment',
      description: primarySetting ? primarySetting.description : `Grand establishing environment for the narrative in ${style}.`,
      appearance: primarySetting ? `${primarySetting.description} Rendered in ${style} aesthetic.` : `Expansive cinematic world with rich atmospheric depth, volumetric lighting, and iconic visual landmarks in ${style}.`,
      lighting: primarySetting ? primarySetting.lighting : 'Cinematic golden hour lighting with volumetric god rays',
      timeOfDay: primarySetting ? primarySetting.timeOfDay : 'Golden Hour',
      style,
      lockedAttributes: ['Signature environmental silhouette', 'Consistent time-of-day lighting'],
      generationPrompt: `Environment master concept for ${primarySetting ? primarySetting.label : 'primary setting'}, ${style}, 8k --ar 16:9`,
      usageScenes: [1, 2, 3, 4, 5],
      status: 'REFERENCE_READY',
      referenceImageStatus: 'READY',
    },
    {
      id: toStableId('ENV', 'FOCAL_INTERIOR'),
      displayName: 'Focal Interior / Sanctum',
      type: 'environment',
      description: `Focal location where core story revelations occur in ${style}.`,
      appearance: `Atmospheric chamber or grove with glowing accents and dramatic details in ${style}.`,
      lighting: 'Bioluminescent ambient glow with soft golden rim lights',
      timeOfDay: 'Dramatic Twilight',
      style,
      lockedAttributes: ['Glowing central focus', 'Atmospheric particles'],
      generationPrompt: `Environment reference for focal setting, ${style}, 8k`,
      usageScenes: [3, 4],
      status: 'REFERENCE_READY',
      referenceImageStatus: 'READY',
    }
  );

  // Construct Central Asset Registry
  const charRecord: Record<string, CharacterProfile> = {};
  characters.forEach((c) => {
    charRecord[c.id] = c;
  });

  const propRecord: Record<string, PropProfile> = {};
  props.forEach((p) => {
    propRecord[p.id] = p;
  });

  const envRecord: Record<string, EnvironmentProfile> = {};
  environments.forEach((e) => {
    envRecord[e.id] = e;
  });

  const assetRegistry: AssetRegistry = {
    characters: charRecord,
    props: propRecord,
    environments: envRecord,
  };

  return {
    characters,
    props,
    environments,
    assetRegistry,
  };
}

export function generateCharactersUniversal(
  idea: string,
  settings: VideoSettings,
  fullStory?: string,
  characterInstructions?: string
): CharacterProfile[] {
  const extracted = extractAllAssetsUniversal(idea, settings, fullStory, characterInstructions);
  return extracted.characters;
}

export function generatePropsUniversal(
  idea: string,
  settings: VideoSettings,
  fullStory?: string
): PropProfile[] {
  const extracted = extractAllAssetsUniversal(idea, settings, fullStory);
  return extracted.props;
}

export function generateEnvironmentsUniversal(
  idea: string,
  settings: VideoSettings,
  fullStory?: string
): EnvironmentProfile[] {
  const extracted = extractAllAssetsUniversal(idea, settings, fullStory);
  return extracted.environments;
}

export function generateAssetRegistryUniversal(
  idea: string,
  settings: VideoSettings,
  fullStory?: string,
  characterInstructions?: string
): AssetRegistry {
  const extracted = extractAllAssetsUniversal(idea, settings, fullStory, characterInstructions);
  return extracted.assetRegistry;
}

// -------------------------------------------------------------
// MUSIC & VOICE LOCK ENGINE (FEATURE 14 & 15)
// -------------------------------------------------------------

export function generateMusicLockUniversal(idea: string, settings: VideoSettings): ProjectMusicLock {
  const isKidsOrRhyme = (settings.videoType || '').toLowerCase().includes('kids') || (settings.videoType || '').toLowerCase().includes('rhyme') || idea.toLowerCase().includes('abc');
  
  if (isKidsOrRhyme) {
    return {
      songStyle: "Upbeat Acoustic Children's Singalong Pop with Orchestral Pizzicato",
      tempo: '112 BPM (Moderato, rhythmic and bouncy)',
      key: 'C Major (Bright, open, uplifting)',
      instrumentation: 'Acoustic nylon guitar, warm wooden marimba, glockenspiel, pizzicato cello, joyful handclaps, gentle kick drum',
      singer: 'Warm, playful female lead vocalist with cheerful children chorus backing',
      vocalStyle: 'Crystal-clear enunciation, expressive smiling pitch, gentle rhythmic bounce matching rhyme cadence',
      rhythm: '4/4 steady walking groove with syncopated handclaps on 2 and 4',
      melodyIdentity: 'Catchy pentatonic ascending hook with stepwise singable nursery phrasing',
    };
  }

  return {
    songStyle: 'Cinematic Narrative Orchestral Suite with Ambient Hybrid Shimmers',
    tempo: '84 BPM (Steady, evocative, and emotional)',
    key: 'D Minor transitioning to D Major (Intriguing to Triumphant)',
    instrumentation: 'Warm acoustic piano, lush cinematic string ensemble, subtle French horn pads, gentle taiko pulse, ambient granular shimmers',
    singer: 'Cinematic vocalise and wordless choral warmth',
    vocalStyle: 'Ethereal, emotive, spacious acoustic resonance',
    rhythm: 'Flowing 4/4 cinematic pulse with dynamic swells matching narrative beats',
    melodyIdentity: 'Haunting 4-note ascending motif resolving into a triumphant heroic resolution',
  };
}

export function generateVoiceLockUniversal(idea: string, settings: VideoSettings): ProjectVoiceLock {
  const lang = settings.language || 'English';
  const isKids = (settings.videoType || '').toLowerCase().includes('kids') || idea.toLowerCase().includes('abc');

  return {
    voiceId: isKids ? 'VOICE_KIDS_LEAD_FEMALE_01' : 'VOICE_CINEMATIC_NARRATOR_01',
    ageImpression: isKids ? '24-year-old warm preschool educator voice' : '28-year-old articulate cinematic narrator',
    gender: 'Female / Neutral Warmth',
    tone: 'Warm, reassuring, charismatic, joyful, and emotionally engaged',
    pitch: 'Mezzo-soprano / mid-range warm resonance with dynamic acoustic range',
    accent: lang.toLowerCase().includes('hindi') ? 'Neutral Clear Indian English / Shuddh Hindi' : 'Standard Neutral Mid-Atlantic',
    pronunciation: 'Crystal-clear phonetic enunciation with playful expressive cadence',
    singingStyle: isKids
      ? 'Melodic storytelling singalong cadence with precise rhythmic timing and warm smiling timbre'
      : 'Measured cinematic delivery with breath control and dramatic pacing',
  };
}

// -------------------------------------------------------------
// UNIVERSAL CONCEPT GENERATOR
// -------------------------------------------------------------

export function generateConceptUniversal(
  idea: string,
  settings: VideoSettings,
  fullStory?: string
): ConceptData {
  const ctx = analyzeStoryContext(idea, settings, fullStory);
  const style = settings.visualStyle || '3D Cartoon';
  const lang = settings.language || 'English';

  let premise = `An immersive, high-retention video production exploring "${idea}" crafted in ${style} aesthetic in ${lang}.`;
  let coreAngle = `Approaching "${idea}" through vivid worldbuilding, high-contrast character dynamics, and emotional visual pacing in ${lang}.`;
  let demographic = `${settings.audience || 'General'} audience enjoying ${style} visual storytelling in ${lang}`;
  let whyItWorks = `Combines instant visual curiosity with emotional story stakes designed for ${settings.tone} delivery in ${lang}.`;

  if (ctx.isHindi) {
    premise = `"${idea}" par aadharit ek manmohak aur adbhut video kahani, jismein paatra saahas, dosti aur anokhe chamatkaron ka anubhav karte hain.`;
    coreAngle = `Vivid ${style} visuals, aakarshak vatavaran, aur shuddh ${lang} bhasha mein shandar samvaad evam narration.`;
    demographic = `${settings.audience || 'Family & Kids'} audience watching premium ${style} storytelling in Hindi`;
    whyItWorks = `Sundar animation, pyaare paatra aur dilchasp kahani darshakon ko shuru se aakhri scene tak baandh kar rakhti hai.`;
  }

  return {
    titleWorking: idea,
    premise: fullStory ? `${premise} ${fullStory.slice(0, 180)}...` : premise,
    coreAngle,
    targetAudience: {
      demographic,
      interests: [settings.videoType || 'Story', style, 'Visual Storytelling', lang],
      painPointsOrCuriosity: ctx.isHindi
        ? `Darshak "${idea}" ki anokhi kahani ko behtareen animation aur shuddh Hindi bhasha mein dekhna chahte hain.`
        : `Viewers desire an unforgettable, cinematic experience of "${idea}" with high visual fidelity and continuous narrative momentum.`,
      viewingMotivation: ctx.isHindi
        ? `"${idea}" ke jadui sansaar aur romanchak kshano ka anubhav karna.`
        : `To experience the emotional stakes and wondrous world of "${idea}" in ${settings.tone} tone.`,
    },
    educationalOrEntertainmentValue: `Delivers premium ${style} cinematic visuals with authentic ${ctx.voiceMode} audio in ${lang}.`,
    whyItWorks,
    toneAnalysis: `${settings.tone} delivery tailored with ${style} aesthetics and ${settings.aspectRatio} composition in ${lang}.`,
  };
}

// -------------------------------------------------------------
// UNIVERSAL HOOK GENERATOR
// -------------------------------------------------------------

export function generateHookUniversal(
  idea: string,
  settings: VideoSettings,
  fullStory?: string
): HookData {
  const ctx = analyzeStoryContext(idea, settings, fullStory);
  const lang = settings.language || 'English';

  let hook1 = `What really happens when "${idea}" unfolds?`;
  let hook2 = `You won't believe the incredible secret hidden inside "${idea}"!`;
  let hook3 = `Have you ever wondered what would happen if "${idea}" came to life?`;

  if (ctx.isHindi) {
    hook1 = `Kya aapne kabhi socha hai ki "${idea}" ke pichhe kaunsa anokha chamatkar chhipa hai?`;
    hook2 = `Aap yakeen nahi karenge ki is romanchak yatra mein kaunsa bada raaz saamne aayega!`;
    hook3 = `Agar aapko "${idea}" ki jadui duniya mein jaane ka mauka mile, toh kya hoga?`;
  }

  return {
    selectedHookId: 'hook-opt-1',
    hookOptions: [
      {
        id: 'hook-opt-1',
        type: 'Visual Curiosity Gap',
        text: hook1,
        visualDirection: `Dynamic camera push-in through lush environmental elements in ${settings.visualStyle} with glowing atmospheric light particles.`,
        estimatedDeliverySeconds: 5,
        explanation: 'Halts viewer feed scrolling in the first 5 seconds to maximize average view duration.',
      },
      {
        id: 'hook-opt-2',
        type: 'Pattern Interrupt',
        text: hook2,
        visualDirection: 'Rapid visual transition into an unexpected high-stakes encounter with dramatic audio swell.',
        estimatedDeliverySeconds: 5,
        explanation: 'Creates intense immediate intrigue by promising a high-value narrative revelation.',
      },
      {
        id: 'hook-opt-3',
        type: 'Imaginative Question',
        text: hook3,
        visualDirection: 'Cinematic wide establishing master shot unveiling the monumental world and key characters.',
        estimatedDeliverySeconds: 5,
        explanation: 'Engages viewer personal imagination and active investment in the outcome.',
      },
    ],
    first30SecondsRoadmap: [
      `00:00 - 00:05: High-energy pattern interrupt hook for "${idea}"`,
      `00:05 - 00:15: Character introduction and stakes setup in ${lang}`,
      `00:15 - 00:30: Escalating story conflict and promise of revelation`,
    ],
    retentionStrategy: `Maintain dynamic visual cuts every ${ctx.sceneSec}s with ${settings.tone} pacing in ${lang}.`,
  };
}

// -------------------------------------------------------------
// STORY-AWARE SCENE GENERATOR WITH ASSET DEPENDENCIES & CONTINUITY
// -------------------------------------------------------------

export function generateScenesUniversal(
  idea: string,
  settings: VideoSettings,
  characters: CharacterProfile[],
  fullStory?: string,
  propsList?: PropProfile[],
  environmentsList?: EnvironmentProfile[]
): SceneBreakdown[] {
  const ctx = analyzeStoryContext(idea, settings, fullStory);
  const actualCount = ctx.sceneCount;
  const aspect = settings.aspectRatio || '16:9';
  const style = settings.visualStyle || '3D Cartoon';
  const lang = settings.language || 'English';

  // Ensure assets exist
  const assetPackage = extractAllAssetsUniversal(idea, settings, fullStory);
  const registeredChars = characters.length > 0 ? characters : assetPackage.characters;
  const registeredProps = propsList && propsList.length > 0 ? propsList : assetPackage.props;
  const registeredEnvs = environmentsList && environmentsList.length > 0 ? environmentsList : assetPackage.environments;

  // -------------------------------------------------------------
  // STORY-AWARE PLANNING: split the actual production story text (never the
  // project title/idea) into narrative beats, then map those beats onto the
  // requested scene count. Every scene below is grounded in a real slice of
  // story text (storySourceText) instead of being assembled purely from
  // rotating registry positions.
  // -------------------------------------------------------------
  const activeStoryText = (
    fullStory ||
    settings.fullStory ||
    settings.refinedStory ||
    settings.storyText ||
    ''
  ).trim();
  const storyBeats = splitStoryIntoBeats(activeStoryText);
  const beatGroups = mapScenesToBeats(actualCount, storyBeats);

  // Data-driven character introduction: use each character's REAL first-mention
  // beat position in the story (not an artificial "first 3 cluster" or a purely
  // proportional guess). A character is introduced at the scene whose beat group
  // first contains their name, and persists (same stable ID) in every scene from
  // then on, matching the single-source-of-truth character registry.
  const charFirstBeat = new Map<string, number>();
  registeredChars.forEach((c) => {
    charFirstBeat.set(c.id, findCharacterFirstBeat(c.name, storyBeats));
  });
  const charIntroScene = new Map<string, number>();
  registeredChars.forEach((c) => {
    const beatIdx = charFirstBeat.get(c.id) ?? -1;
    if (beatIdx === -1 || storyBeats.length === 0) {
      // Name not literally found in the story text (e.g. inferred/generic
      // character) — fall back to introducing them alongside the initial cast.
      charIntroScene.set(c.id, 0);
      return;
    }
    let sceneIdx = 0;
    for (let s = 0; s < beatGroups.length; s++) {
      if (beatGroups[s].some((b) => storyBeats[beatIdx] === b)) {
        sceneIdx = s;
        break;
      }
    }
    charIntroScene.set(c.id, sceneIdx);
  });

  // Per-scene content weight (word count of the mapped story beat text) drives
  // AI Auto duration allocation so dialogue/narration-heavy beats get more time
  // than a short transitional beat, instead of dividing time equally or by
  // position alone.
  const contentWeights = beatGroups.map((group) => {
    const text = group.join(' ');
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    return Math.max(1, wordCount);
  });

  const sceneDurations = calculateSceneDurationsUniversal(
    ctx.totalSec,
    actualCount,
    ctx.planningMode,
    ctx.sceneSec,
    ctx.planningMode === 'ai_auto' ? contentWeights : undefined
  );

  let cumulativeSeconds = 0;

  // Track continuity between scenes
  let previousSceneFinalAction = 'Opening scene setup';
  let previousSceneChars: string[] = [];
  let previousSceneProps: string[] = [];
  let previousEnvId = '';

  return sceneDurations.map((durSec, i) => {
    const sceneNum = i + 1;
    const startSec = cumulativeSeconds;
    const endSec = cumulativeSeconds + durSec;
    cumulativeSeconds = endSec;

    const timeRange = `${formatTimestamp(startSec)}–${formatTimestamp(endSec)}`;
    const isFirst = i === 0;
    const isLast = i === actualCount - 1;

    const beatGroupForScene = beatGroups[i] || [];
    const storyBeatText = beatGroupForScene.join(' ').trim();

    // Determine Environment from the ACTUAL story beat text for this scene first
    // (matching the same shared SETTING_LIBRARY used during asset extraction);
    // only fall back to rotating the registered environment list when the beat
    // text gives no location signal.
    const beatSetting = storyBeatText
      ? SETTING_LIBRARY.find((s) => s.pattern.test(storyBeatText.toLowerCase()))
      : undefined;
    const envFromBeat = beatSetting ? registeredEnvs.find((e) => e.displayName === beatSetting.label) : undefined;
    const envObj = envFromBeat || registeredEnvs[i % registeredEnvs.length] || registeredEnvs[0];
    const envId = envObj?.id || 'PRIMARY_ENVIRONMENT';
    const envDisplayName = envObj?.displayName || envObj?.description || envId;

    // Determine Characters for this scene from the STORY, not array position:
    // every registered character whose real first-mention scene (computed above
    // from actual story text) is at or before this scene is present — a
    // character is never forced into a scene before the story has introduced
    // them, and once introduced they keep the same stable ID going forward.
    let sceneCharIds: string[] = registeredChars
      .filter((c) => (charIntroScene.get(c.id) ?? 0) <= i)
      .map((c) => c.id);
    // If literally no character has been introduced by this point (e.g. a
    // purely ambient opening beat before anyone is named), and this is the
    // very first scene, avoid an entirely characterless establishing shot only
    // when the registry itself is non-empty — otherwise leave it empty, which
    // is the story-accurate result for a genuinely characterless beat.
    if (sceneCharIds.length === 0 && isFirst && registeredChars.length > 0 && storyBeats.length === 0) {
      sceneCharIds = [registeredChars[0].id];
    }

    // Determine Props for this scene from the ACTUAL story beat text (shared
    // PROP_LIBRARY) — a prop is only placed in a scene when the beat text that
    // maps to it actually mentions it, so props are never spawned randomly.
    const scenePropIds: string[] = [];
    if (storyBeatText) {
      for (const propEntry of PROP_LIBRARY) {
        if (propEntry.pattern.test(storyBeatText)) {
          const match = registeredProps.find((p) => p.displayName?.toLowerCase().includes(propEntry.label.toLowerCase()));
          if (match && !scenePropIds.includes(match.id)) scenePropIds.push(match.id);
        }
      }
    }
    if (scenePropIds.length === 0 && registeredProps.length > 0 && !storyBeatText) {
      // No story text to ground props against (e.g. legacy project) — preserve
      // prior behavior of referencing the registered prop for continuity.
      scenePropIds.push(registeredProps[i % registeredProps.length].id);
    }

    // Continuity tracking
    const charactersContinuing = sceneCharIds.filter((id) => previousSceneChars.includes(id));
    const newCharactersIntroduced = sceneCharIds.filter((id) => !previousSceneChars.includes(id));
    const propsContinuing = scenePropIds.filter((id) => previousSceneProps.includes(id));
    const environmentContinuing = envId === previousEnvId;

    // Visual action/blocking description — used for the CAMERA/VIDEO PROMPT only
    // (never placed into Narrator dialogue; see dialogue construction below).
    let startingAction = '';
    let finalAction = '';
    let actionDesc = '';
    const sceneCharNames = sceneCharIds
      .map((cid) => registeredChars.find((c) => c.id === cid)?.name)
      .filter(Boolean)
      .join(' and ');

    if (isFirst) {
      startingAction = `${sceneCharNames || 'The scene'} is established at ${envDisplayName}.`;
      finalAction = `The scene settles into motion as the story beat unfolds.`;
      actionDesc = storyBeatText
        ? `${startingAction} ${storyBeatText}`
        : `${startingAction} ${finalAction}`;
    } else {
      if (newCharactersIntroduced.length > 0) {
        const newNames = newCharactersIntroduced
          .map((id) => registeredChars.find((c) => c.id === id)?.name)
          .filter(Boolean)
          .join(', ');
        startingAction = `${newNames} is newly present in ${envDisplayName} as this beat of the story unfolds.`;
      } else {
        startingAction = `${sceneCharNames || 'The scene'} continues in ${envDisplayName}.`;
      }
      finalAction = `The beat concludes, carrying its outcome into the next scene.`;
      actionDesc = storyBeatText ? `${startingAction} ${storyBeatText}` : `${startingAction} ${finalAction}`;
    }

    // Update continuity history
    previousSceneFinalAction = finalAction;
    previousSceneChars = [...sceneCharIds];
    previousSceneProps = [...scenePropIds];
    previousEnvId = envId;

    const continuityInfo: SceneContinuityInfo = {
      previousSceneNum: i > 0 ? i : undefined,
      nextSceneNum: i < actualCount - 1 ? i + 2 : undefined,
      previousFinalAction: isFirst ? 'Initial establishing arrival' : previousSceneFinalAction,
      currentStartingAction: startingAction,
      charactersContinuing,
      newCharactersIntroduced,
      propsContinuing,
      environmentContinuing,
      transitionType: i % 2 === 0 ? 'Smooth match cut on kinetic motion' : 'Fluid camera pan tracking forward',
    };

    const assetDependencies: SceneAssetDependencies = {
      characters: sceneCharIds,
      environment: envId,
      props: scenePropIds,
    };

    // No voice mode in this project supports song/lyrics generation unless this
    // is actually a Kids Rhyme / Music video type, so narrative text is NEVER
    // converted into lyrics for ordinary Story/Documentary/Educational/etc.
    // projects. lyricLines stays empty unless the project genuinely is a
    // song-type project (kept as a field for backward compatibility only).
    const lyricLines: string[] = [];

    const sTitle = `Scene ${sceneNum}: ${envDisplayName}`;

    // Build story-grounded, mode-aware dialogue with an explicit, existing
    // character ID as speaker for every spoken line. Real quoted dialogue in
    // the story beat is used verbatim with correct speaker attribution when
    // present; the Narrator's line is the actual story beat text (never the
    // internal camera/action-blocking text above), so no production
    // instructions ever leak into spoken narration.
    const sceneCharsForDialogue = sceneCharIds
      .map((cid) => registeredChars.find((c) => c.id === cid))
      .filter((c): c is CharacterProfile => Boolean(c));
    const quotedLines = storyBeatText ? extractQuotedDialogue(storyBeatText, sceneCharsForDialogue) : [];
    const narratorLineText = storyBeatText || `${sceneCharNames || 'The scene'} in ${envDisplayName}.`;

    let dialogue = 'NONE (No Spoken Dialogue — background score and Foley only)';
    if (!ctx.isNoSpoken) {
      if (ctx.isNarratorOnly) {
        dialogue = `Speaker: Narrator\nLine: "${narratorLineText}"`;
      } else if (ctx.isCharOnly) {
        if (quotedLines.length > 0) {
          dialogue = quotedLines.map((q) => `Speaker: ${q.speakerName} [${q.speakerId}]\nLine: "${q.line}"`).join('\n');
        } else if (ctx.storyMode !== 'user_exact' && sceneCharsForDialogue.length > 0) {
          // No explicit quotes in the source text: only synthesize a beat-grounded
          // line when the story is allowed to be AI-authored/refined. "Use My
          // Story Exactly" mode must never invent dialogue that was not there.
          dialogue = sceneCharsForDialogue
            .map((c) => `Speaker: ${c.name} [${c.id}]\nLine: "${storyBeatText ? storyBeatText : `${c.name} reacts to ${envDisplayName}.`}"`)
            .join('\n');
        } else {
          dialogue = `Speaker: Narrator\nLine: "${narratorLineText}" (No explicit character dialogue in the source story for this beat.)`;
        }
      } else {
        // Narrator + Character Dialogue: narration line from the real story beat,
        // plus any actual quoted lines found in that beat, each with its own
        // explicit speaker. If no quotes exist, only add a synthetic character
        // line outside "Use My Story Exactly" mode.
        const narratorLine = `Speaker: Narrator\nLine: "${narratorLineText}"`;
        let charLines = '';
        if (quotedLines.length > 0) {
          charLines = quotedLines.map((q) => `Speaker: ${q.speakerName} [${q.speakerId}]\nLine: "${q.line}"`).join('\n');
        } else if (ctx.storyMode !== 'user_exact' && sceneCharsForDialogue.length > 0 && newCharactersIntroduced.length > 0) {
          const introducedChar = sceneCharsForDialogue.find((c) => newCharactersIntroduced.includes(c.id));
          if (introducedChar) {
            charLines = `Speaker: ${introducedChar.name} [${introducedChar.id}]\nLine: "${introducedChar.name} is introduced in this beat."`;
          }
        }
        dialogue = charLines ? `${narratorLine}\n${charLines}` : narratorLine;
      }
    }

    const sceneCharDescriptions = sceneCharIds.map((cid) => {
      const found = registeredChars.find((c) => c.id === cid || c.name === cid || c.displayName === cid);
      return found ? `${found.name} [${found.id}] (${found.visualAppearance || found.appearance || found.characterConsistencyLock})` : cid;
    }).join('; ');

    const charPromptPart = sceneCharIds.length > 0
      ? `Characters present (each with a locked, independent identity — exactly one instance of each listed character, no duplicates): ${sceneCharDescriptions}.`
      : 'Characters: NONE.';

    const characterLockedPrompt = sceneCharIds.map((cid) => {
      const found = registeredChars.find((c) => c.id === cid || c.name === cid || c.displayName === cid);
      return found ? `${found.id}: ${found.characterConsistencyLock || found.appearance}` : cid;
    }).join('\n');

    return {
      sceneNumber: sceneNum,
      durationSeconds: durSec,
      duration: `${durSec}s`,
      startTime: formatTimestamp(startSec),
      endTime: formatTimestamp(endSec),
      timeRange,
      title: sTitle,
      location: envDisplayName,
      environment: envDisplayName,
      characters: sceneCharIds,
      charactersPresent: sceneCharIds,
      props: scenePropIds,
      characterActions: actionDesc,
      storyBeat: storyBeatText || undefined,
      storySourceText: storyBeatText || undefined,
      sceneSummary: storyBeatText ? storyBeatText.slice(0, 220) : actionDesc.slice(0, 220),
      dialogue,
      dialogueVoiceover: dialogue,
      spokenDialogueType: ctx.isNoSpoken ? 'none' : 'dialogue',
      spokenDialogue: dialogue,
      cameraAngleMotion: i % 2 === 0 ? '35mm anamorphic tracking shot with smooth lateral dolly' : 'Dynamic low-angle crane sweep rising gently',
      lightingMood: envObj?.lighting || 'Volumetric cinematic three-point lighting with soft rim rays',
      animationStyle: `${style} with natural physical inertia and secondary cloth/hair physics`,
      soundEffects: 'Diegetic environmental Foley and ambient atmosphere',
      musicCue: `Score cue ${sceneNum} matching project tone and pacing`,
      continuityNote: `Inherits visual state and positions from Scene ${sceneNum - 1}. No character or prop spawning.`,
      scenePurpose: `Advance the story beat: ${storyBeatText ? storyBeatText.slice(0, 140) : `progression of Scene ${sceneNum}`}.`,
      aiVideoPrompt: `Cinematic ${aspect}, ${style}, "${sTitle}". Action: ${actionDesc}. Environment: ${envDisplayName}. ${charPromptPart} Props: ${scenePropIds.length > 0 ? scenePropIds.join(', ') : 'NONE'}. 8K render --ar ${aspect}`,
      characterLockedPrompt,
      assetDependencies,
      continuity: continuityInfo,
      lyricLines,
    };
  });
}

// -------------------------------------------------------------
// UNIVERSAL SCRIPT GENERATOR
// -------------------------------------------------------------

export function generateScriptUniversal(
  idea: string,
  settings: VideoSettings,
  scenes: SceneBreakdown[],
  characters: CharacterProfile[]
): ScriptData {
  const ctx = analyzeStoryContext(idea, settings);
  const wordsPerMin = 130;
  const estimatedWords = Math.max(60, Math.round((ctx.totalSec / 60) * wordsPerMin));

  const sections: ScriptSection[] = scenes.map((s) => {
    const rawDialogue = s.dialogue || s.dialogueVoiceover || s.spokenDialogue || '';
    const isNarrator = rawDialogue.startsWith('Speaker: Narrator');

    return {
      id: `sec-${s.sceneNumber}`,
      name: s.title,
      timecode: s.timeRange,
      visualDirection: `Cinematic ${settings.visualStyle} render: ${s.characterActions} (Location: ${s.location})`,
      dialogueOrNarration: rawDialogue,
      narratorDialogue: ctx.isNoSpoken ? undefined : isNarrator ? rawDialogue : undefined,
      characterDialogue: ctx.isNoSpoken ? undefined : !isNarrator ? rawDialogue : undefined,
      sceneIntent: `Advance narrative momentum and emotional connection for scene ${s.sceneNumber}.`,
      onScreenText: s.sceneNumber === 1 ? idea.toUpperCase() : undefined,
      soundEffectOrMusicCue: s.soundEffects || 'Cinematic thematic musical score',
      deliveryNotes: ctx.isNoSpoken
        ? 'STRICT: No spoken dialogue. Focus purely on audio Foley and musical cadence.'
        : `${settings.tone} delivery in ${settings.language}.`,
    };
  });

  return {
    totalWordCount: ctx.isNoSpoken ? 0 : estimatedWords,
    estimatedReadTime: formatDurationLabel(ctx.totalSec),
    completeScript: sections.map((sec) => `[${sec.name} - ${sec.timecode}]\n${sec.dialogueOrNarration}`).join('\n\n'),
    narratorDialogue: ctx.isNoSpoken ? undefined : sections.map((sec) => sec.narratorDialogue).filter(Boolean).join('\n\n'),
    characterDialogue: ctx.isNoSpoken ? undefined : sections.map((sec) => sec.characterDialogue).filter(Boolean).join('\n\n'),
    sceneIntent: `Engaging, continuous cinematic pacing with exact scene cuts across ${formatDurationLabel(ctx.totalSec)}.`,
    sections,
  };
}

// -------------------------------------------------------------
// UNIVERSAL VIDEO PROMPTS GENERATOR (FEATURE 17 & CONTINUITY ENGINE)
// -------------------------------------------------------------

export function generateVideoPromptsUniversal(
  idea: string,
  settings: VideoSettings,
  scenes: SceneBreakdown[],
  characters: CharacterProfile[],
  propsList?: PropProfile[],
  environmentsList?: EnvironmentProfile[],
  musicLock?: ProjectMusicLock,
  voiceLock?: ProjectVoiceLock
): SceneVideoPrompt[] {
  const aspect = settings.aspectRatio || '16:9';
  const style = settings.visualStyle || '3D Cartoon';
  const ctx = analyzeStoryContext(idea, settings);

  const mLock = musicLock || generateMusicLockUniversal(idea, settings);
  const vLock = voiceLock || generateVoiceLockUniversal(idea, settings);

  // Asset lookup maps
  const charMap: Record<string, CharacterProfile> = {};
  characters.forEach((c) => {
    if (c.id) charMap[c.id] = c;
    if (c.name) charMap[c.name] = c;
    if (c.displayName) charMap[c.displayName] = c;
  });

  const propMap: Record<string, PropProfile> = {};
  if (propsList) {
    propsList.forEach((p) => {
      if (p.id) propMap[p.id] = p;
      if (p.displayName) propMap[p.displayName] = p;
    });
  }

  const envMap: Record<string, EnvironmentProfile> = {};
  if (environmentsList) {
    environmentsList.forEach((e) => {
      if (e.id) envMap[e.id] = e;
      if (e.displayName) envMap[e.displayName] = e;
    });
  }

  return scenes.map((scene, idx) => {
    const promptNum = idx + 1;
    const durSec = scene.durationSeconds || ctx.sceneSec;
    const duration = `${durSec}s (${scene.timeRange})`;

    // Registered characters in this scene
    const charIds = scene.assetDependencies?.characters || scene.characters || [];
    const charConstraints = charIds.length > 0
      ? charIds
          .map((id) => {
            const found = charMap[id];
            const lock = found?.characterConsistencyLock || found?.appearance || found?.visualAppearance || id;
            const displayName = found?.name ? `${found.name} [${id}]` : id;
            return `- ${displayName}: ${lock} (exactly one instance of this character — do not duplicate or merge with another character)`;
          })
          .join('\n')
      : 'NONE (no characters in this shot)';

    // Registered Environment
    const envId = scene.assetDependencies?.environment || scene.environment || scene.location;
    const foundEnv = envMap[envId];
    const envPromptText = foundEnv
      ? `${foundEnv.id}: ${foundEnv.description || foundEnv.appearance}. Lighting: ${foundEnv.lighting || scene.lightingMood}`
      : `${envId}: Thematic setting matching project aesthetics. Lighting: ${scene.lightingMood}`;

    // Registered Props
    const propIds = scene.assetDependencies?.props || scene.props || [];
    const propsPromptText =
      propIds.length > 0
        ? propIds
            .map((pid) => {
              const foundProp = propMap[pid];
              return `${pid}: ${foundProp ? foundProp.appearance || foundProp.description : pid}`;
            })
            .join(' | ')
        : 'NONE (No primary props in shot)';

    // Dialogue / Narration text for this scene (real story-grounded content from
    // generateScenesUniversal — never lyrics unless this is genuinely a Kids
    // Rhyme / Music project, in which case scene.lyricLines would be populated).
    const audioText =
      scene.lyricLines && scene.lyricLines.length > 0
        ? scene.lyricLines.join('\n')
        : scene.dialogue || scene.spokenDialogue || 'NO SPOKEN DIALOGUE (Background score and Foley only)';

    // Continuity
    const continuityInfo = scene.continuity;
    let continuityText = '';
    if (idx === 0) {
      continuityText = 'Opening establishing sequence. Characters are naturally positioned in their starting marks.';
    } else {
      const continuing = continuityInfo?.charactersContinuing || [];
      const introduced = continuityInfo?.newCharactersIntroduced || [];
      const continuingProps = continuityInfo?.propsContinuing || [];

      const parts: string[] = [];
      if (continuing.length > 0) {
        parts.push(`Continue with the exact same registered ${continuing.join(', ')} from the previous scene with identical facial geometry, fur/skin shader, and locked costume.`);
      }
      if (introduced.length > 0) {
        parts.push(`The newly introduced character ${introduced.join(', ')} is already visible in the environment before the characters approach. STRICT: Do NOT make characters suddenly appear or spawn.`);
      }
      if (propIds.length > 0) {
        parts.push(`The prop ${propIds[0]} is already positioned naturally in the scene. STRICT: Do NOT spawn props in mid-air.`);
      }
      continuityText = parts.join(' ');
    }

    // Action
    const actionText = scene.characterActions;

    // Character Consistency Lock
    const consistencyText = charIds
      .map((id) => {
        const found = charMap[id];
        return found
          ? `${found.name} [${found.id}]: ${found.characterConsistencyLock || found.appearance}`
          : `${id}: Maintain absolute visual identity`;
      })
      .join('\n');

    // Music / Voice Lock — only framed as a continuous song for genuine Kids
    // Rhyme / Music projects. Every other video type gets a plain score/voice
    // continuity note, never "the next musical phrase of the same song".
    const musicAndSingingText = ctx.isMusicProject
      ? `Project Music Lock: ${mLock.songStyle}, Tempo: ${mLock.tempo}, Key: ${mLock.key}. Singer: ${mLock.singer}. Vocalist Voice Lock: ${vLock.voiceId} (${vLock.ageImpression}, ${vLock.tone}, ${vLock.pronunciation}). Current lyrics are the next musical phrase of the SAME continuous song.`
      : `Background Score Lock: ${mLock.songStyle} mood, Tempo: ${mLock.tempo}. Narrator/Character Voice Lock: ${vLock.voiceId} (${vLock.ageImpression}, ${vLock.tone}, ${vLock.pronunciation}). Continue the established score mood from the previous scene; this is narration/dialogue, not song lyrics.`;

    // Animation & Camera
    const animationText = `${style} aesthetic with smooth 24fps motion blur, fluid cloth dynamics, and expressive character bounce.`;
    const cameraText = `${scene.cameraAngleMotion}, 35mm anamorphic prime lens, f/2.2 shallow depth of field, steady tracking.`;

    // Negative Prompts
    const negativeText = 'blurry, low resolution, distorted limbs, extra fingers, morphing face, inconsistent outfit, changing colors, character spawning from nowhere, prop popping into shot, text watermark, flicker, glitch';

    // End Continuity
    const endContinuityText = idx < scenes.length - 1
      ? `Characters finish action while facing toward the right frame, smoothly transitioning into Scene ${promptNum + 1}.`
      : 'Final heroic pose held into soft luminous fade.';

    // Construct Formatted Final Prompt
    const structured = {
      duration,
      characters: charConstraints,
      environment: envPromptText,
      props: propsPromptText,
      lyrics: audioText,
      continuity: continuityText,
      action: actionText,
      characterConsistency: consistencyText,
      musicAndSinging: musicAndSingingText,
      animation: animationText,
      camera: cameraText,
      negative: negativeText,
      endContinuity: endContinuityText,
    };

    const audioSectionLabel = ctx.isMusicProject ? 'LYRICS:' : 'DIALOGUE / NARRATION:';
    const musicSectionLabel = ctx.isMusicProject ? 'MUSIC AND SINGING:' : 'MUSIC / VOICE CONTINUITY:';

    const finalPrompt = `Prompt ${promptNum}:
DURATION: ${duration}
CHARACTERS:
${charConstraints}
ENVIRONMENT: ${envPromptText}
PROPS: ${propsPromptText}
${audioSectionLabel}
${audioText}
CONTINUITY: ${continuityText}
ACTION: ${actionText}
CHARACTER CONSISTENCY:
${consistencyText}
${musicSectionLabel} ${musicAndSingingText}
ANIMATION: ${animationText}
CAMERA: ${cameraText}
NEGATIVE: ${negativeText}
END CONTINUITY: ${endContinuityText}`;

    // Model Specific Prompts
    const modelPrompts: ModelSpecificPrompts = {
      veo: `Google Veo Prompt ${promptNum}: ${style} video (${duration}). Action: ${actionText}. Environment: ${envPromptText}. Characters: ${charConstraints}. Camera: ${cameraText}. Audio: ${audioText}. --ar ${aspect}`,
      runway: `Runway Gen-3 Prompt ${promptNum}: [${cameraText}] [${actionText}] [${envPromptText}] Characters: ${charConstraints}. Duration: ${durSec}s, ${style} 8K render --ar ${aspect}`,
      kling: `Kling AI Prompt ${promptNum}: Master shot (${durSec}s | ${scene.timeRange}), ${style}, ${actionText} in ${envPromptText}. Characters: ${charConstraints}. Aspect ratio: ${aspect}. ${cameraText}`,
      luma: `Luma Dream Machine Prompt ${promptNum}: Smooth ${cameraText} (${durSec}s) capturing ${actionText}. Environment: ${envPromptText}. Characters: ${charConstraints}. Aspect ${aspect}.`,
      sora: `OpenAI Sora Prompt ${promptNum}: Hyper-detailed cinematic sequence (${durSec}s) in ${style} aspect ratio ${aspect}. In ${envPromptText}, ${actionText}. Characters: ${charConstraints}. Audio: ${audioText}. Camera: ${cameraText}`,
    };

    return {
      sceneNumber: promptNum,
      promptNumber: promptNum,
      title: `Prompt ${promptNum}: ${scene.title}`,
      duration,
      durationSeconds: durSec,
      startTime: scene.startTime,
      endTime: scene.endTime,
      aspectRatio: aspect,
      visualStyle: style,
      characterConsistencyDescription: consistencyText,
      characterIdentityLock: consistencyText,
      environment: envPromptText,
      action: actionText,
      facialExpressions: ctx.isMusicProject
        ? 'Emotionally expressive gaze matching song cadence and discovery'
        : 'Emotionally expressive gaze matching the story beat\'s mood and intent',
      bodyMovement: 'Natural kinetic physical blocking and rhythmic step-wise motion',
      cameraShot: 'Medium Master Shot',
      cameraMovement: scene.cameraAngleMotion,
      lensFraming: '35mm anamorphic prime lens, f/2.2',
      lighting: scene.lightingMood,
      atmosphere: 'Volumetric light beams and luminous atmospheric particles',
      animationStyle: animationText,
      physicsMotion: 'Realistic cloth simulation and natural hair dynamics',
      dialogue: audioText,
      voiceAudio: musicAndSingingText,
      soundEffects: scene.soundEffects || 'Diegetic environmental Foley',
      music: mLock.songStyle,
      transition: scene.transition || 'Match cut on action momentum',
      negativePrompt: negativeText,
      finalPrompt,
      modelPrompts,
      assetDependencies: scene.assetDependencies,
      continuityInfo,
      structuredPrompt: structured,
      validationStatus: {
        isValid: true,
        missingAssets: [],
        warnings: [],
      },
    };
  });
}

// -------------------------------------------------------------
// ASSET VALIDATION ENGINE (FEATURE 20)
// -------------------------------------------------------------

export function validateProjectAssets(project: Partial<YouTubeProject>): AssetValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const registry = project.assetRegistry || {
    characters: {},
    props: {},
    environments: {},
  };

  const charMap = registry.characters || {};
  const propMap = registry.props || {};
  const envMap = registry.environments || {};

  const totalCharactersRequired = Object.keys(charMap).length;
  const totalCharactersReady = Object.values(charMap).filter((c) => c.status === 'REFERENCE_READY' || c.referenceImageStatus === 'READY').length;
  const totalCharactersMissing = totalCharactersRequired - totalCharactersReady;

  const totalPropsRequired = Object.keys(propMap).length;
  const totalPropsReady = Object.values(propMap).filter((p) => p.status === 'REFERENCE_READY' || p.referenceImageStatus === 'READY').length;
  const totalPropsMissing = totalPropsRequired - totalPropsReady;

  const totalEnvironmentsRequired = Object.keys(envMap).length;
  const totalEnvironmentsReady = Object.values(envMap).filter((e) => e.status === 'REFERENCE_READY' || e.referenceImageStatus === 'READY').length;
  const totalEnvironmentsMissing = totalEnvironmentsRequired - totalEnvironmentsReady;

  // 1. Check Music Lock
  if (!project.musicLock) {
    errors.push('Project Music Lock is missing.');
  }

  // 2. Check Voice Lock
  if (!project.voiceLock) {
    errors.push('Project Voice Lock is missing.');
  }

  // 3. Check Scenes
  const scenes = project.scenes || [];
  if (scenes.length === 0) {
    errors.push('No scenes found in project.');
  } else {
    scenes.forEach((scene) => {
      const deps = scene.assetDependencies;
      if (!deps) {
        warnings.push(`Scene ${scene.sceneNumber}: Missing explicit Asset Dependency list.`);
      } else {
        // Validate characters
        deps.characters.forEach((cid) => {
          if (!charMap[cid]) {
            errors.push(`Scene ${scene.sceneNumber}: Referenced character "${cid}" does not exist in Asset Registry.`);
          }
        });

        // Validate environment
        if (deps.environment && !envMap[deps.environment]) {
          errors.push(`Scene ${scene.sceneNumber}: Referenced environment "${deps.environment}" does not exist in Asset Registry.`);
        }

        // Validate props
        deps.props.forEach((pid) => {
          if (!propMap[pid]) {
            errors.push(`Scene ${scene.sceneNumber}: Referenced prop "${pid}" does not exist in Asset Registry.`);
          }
        });
      }

      // Check continuity
      if (scene.sceneNumber > 1 && !scene.continuity) {
        warnings.push(`Scene ${scene.sceneNumber}: Missing scene-to-scene continuity tracking.`);
      }
    });
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    errors,
    warnings,
    totalCharactersRequired,
    totalCharactersReady,
    totalCharactersMissing,
    totalPropsRequired,
    totalPropsReady,
    totalPropsMissing,
    totalEnvironmentsRequired,
    totalEnvironmentsReady,
    totalEnvironmentsMissing,
  };
}

// -------------------------------------------------------------
// UNIVERSAL THUMBNAILS, SEO, SHORTS
// -------------------------------------------------------------

export function generateThumbnailUniversal(
  idea: string,
  settings: VideoSettings,
  characters: CharacterProfile[]
): ThumbnailData {
  const primaryChar = characters[0];
  const charDesc = primaryChar
    ? `${primaryChar.name} (${primaryChar.visualAppearance || primaryChar.appearance || 'signature traits'})`
    : `protagonist of ${idea}`;

  const style = settings.visualStyle || '3D Cartoon';
  const aspect = settings.aspectRatio || '16:9';

  const c1: ThumbnailConcept = {
    id: 'c1',
    conceptTitle: 'High-Emotion Close-Up & Shocking Reaction',
    title: 'High-Emotion Close-Up & Shocking Reaction',
    visualConcept: 'Dramatic character expression framed tightly with glowing subject artifact to maximize raw emotional click appeal.',
    mainSubject: `Intense close-up portrait of ${charDesc}`,
    characterExpression: 'Shocked, wide eyes with mouth open in genuine disbelief, looking directly into the camera',
    facialExpression: 'Shocked, wide eyes with mouth open in genuine disbelief',
    background: `Vibrant contextual ${style} environment with dramatic atmospheric lighting`,
    foregroundElements: 'Subtle glowing lens flare, floating particles, and high-contrast volumetric depth cues',
    composition: 'Extreme rule-of-thirds close-up on the right, high negative space on the left for text placement',
    focalPoint: "The character's expressive face and the glowing mystery item",
    lighting: 'High-contrast neon rim light with soft key lighting highlighting facial contours',
    colorDirection: 'Electric Cyan (#00E5FF) and Fiery Amber (#FF7700) complimentary contrast',
    emotion: 'Shock, disbelief, high-stakes curiosity',
    suggestedText: 'DO NOT TRY THIS!',
    textOverlay: 'DO NOT TRY THIS!',
    textPlacement: 'Top-Left Third',
    fontStyle: 'Heavy Bold Sans-Serif with Drop Shadow and Yellow Stroke Border',
    clickabilityScore: 96,
    previewDescription: 'Engineered for maximum Browse Features CTR (14%+ expected click-through rate).',
    aiImagePrompt: `Cinematic ${aspect} YouTube thumbnail, ${charDesc}, extreme emotional reaction with wide eyes and open mouth, pointing towards glowing artifact, ${style}, electric cyan and warm amber rim lighting, 8k resolution, photorealistic Unreal Engine 5 render, highly detailed --ar ${aspect} --v 6.0`,
    negativePrompt: 'blurry, distorted face, bad anatomy, extra fingers, text watermark, low resolution, dark muddy colors',
    colorPalette: ['#00E5FF', '#FF7700', '#FFE600', '#090C10'],
  };

  const c2: ThumbnailConcept = {
    id: 'c2',
    conceptTitle: 'The Mystery Split & Paradox Reveal',
    title: 'The Mystery Split & Paradox Reveal',
    visualConcept: 'Dual before-and-after split composition creating an irresistible curiosity gap in viewer minds.',
    mainSubject: `Split screen: on the left a mysterious unopened portal, on the right ${charDesc} discovering the truth`,
    characterExpression: 'Intense focused anticipation on the left vs triumphant shock on the right',
    facialExpression: 'Intense anticipation vs triumphant shock',
    background: `Atmospheric dual-tone background with a glowing vertical laser divider`,
    foregroundElements: 'Diagonal neon light slash separating the dual scenes with floating embers',
    composition: 'Dynamic 50/50 vertical split with high-contrast color duality',
    focalPoint: 'The central glowing barrier separating the two contrasting states',
    lighting: 'Deep violet key light on side A, brilliant golden hour spotlight on side B',
    colorDirection: 'Neon Purple (#9D00FF) vs Radiant Gold (#FFD700)',
    emotion: 'Curiosity, investigation, mystery',
    suggestedText: 'THE TRUTH! ⚡',
    textOverlay: 'THE TRUTH! ⚡',
    textPlacement: 'Bottom-Center Across Divider',
    fontStyle: 'Impact 3D Extruded Font with Neon Glow Backplate',
    clickabilityScore: 92,
    previewDescription: 'Proven viral split composition designed to trigger instant intrigue on mobile feeds.',
    aiImagePrompt: `Cinematic YouTube thumbnail with split composition, left side shows dark mysterious scene with neon violet glow, right side shows ${charDesc} with golden lighting discovering truth, ${style}, ultra high detail, 8k --ar ${aspect} --v 6.0`,
    negativePrompt: 'blurry, flat lighting, watermark, bad symmetry, distorted hands, noisy artifacts',
    colorPalette: ['#9D00FF', '#FFD700', '#FFFFFF', '#0B0F19'],
  };

  const c3: ThumbnailConcept = {
    id: 'c3',
    conceptTitle: 'Epic Action Climax & Scale Contrast',
    title: 'Epic Action Climax & Scale Contrast',
    visualConcept: 'Massive scale contrast featuring the character dwarfed by an epic environment or colossal obstacle.',
    mainSubject: `${charDesc} standing at the precipice overlooking a monumental cinematic world`,
    characterExpression: 'Determined, fearless expression with wind-blown hair and intense gaze',
    facialExpression: 'Determined, fearless and awe-inspired expression',
    background: `Expansive panoramic ${style} landscape with towering structures and stormy skies`,
    foregroundElements: 'Cliff edge, dramatic atmospheric clouds, and sweeping lightning arcs',
    composition: 'Low-angle cinematic heroic composition with sweeping leading lines',
    focalPoint: 'The silhouette of the protagonist facing the massive horizon',
    lighting: 'Golden hour silhouette with volumetric sun rays and thunderstorm rim glow',
    colorDirection: 'Sunset Orange (#FF4500) against Deep Twilight Blue (#0A192F)',
    emotion: 'Awe, adrenaline, high adventure',
    suggestedText: 'IMPOSSIBLE?!',
    textOverlay: 'IMPOSSIBLE?!',
    textPlacement: 'Top-Right Corner',
    fontStyle: 'Slanted Action Italic with Electric Outline',
    clickabilityScore: 94,
    previewDescription: 'Epic cinematic scale framing proven to capture recommended video traffic.',
    aiImagePrompt: `Epic ${aspect} YouTube thumbnail, low angle master shot of ${charDesc} facing a colossal panoramic horizon, ${style}, golden hour lighting with volumetric god rays, dramatic clouds, Unreal Engine 5 render, photorealistic 8k --ar ${aspect} --v 6.0`,
    negativePrompt: 'blurry, cartoonish distortion, extra limbs, watermark logo, low quality render',
    colorPalette: ['#FF4500', '#0A192F', '#00F0FF', '#FFFFFF'],
  };

  return {
    concepts: [c1, c2, c3],
    selectedConceptId: 'c1',
    aiPrompt: c1.aiImagePrompt || `Cinematic ${aspect} thumbnail for ${idea}`,
    midjourneyPrompt: c1.aiImagePrompt || `Cinematic ${aspect} thumbnail for ${idea}`,
    canvaLayoutSuggestion: 'Position bold yellow/cyan text in the upper left; keep primary character face in the right third of the frame.',
    dallEPrompt: c1.aiImagePrompt || `Cinematic ${aspect} thumbnail for ${idea}`,
  };
}

export function generateSeoUniversal(
  idea: string,
  settings: VideoSettings,
  scenes: SceneBreakdown[]
): SeoData {
  const lang = settings.language || 'English';
  const isHindi = lang.toLowerCase().includes('hindi');
  const isHinglish = lang.toLowerCase().includes('hinglish');

  let title1 = `${idea} (Official 4K Animation)`;
  let title2 = `The Secret of ${idea} That Nobody Talks About!`;
  let title3 = `How ${idea} Changed Everything | Complete Story`;

  if (isHindi) {
    title1 = `${idea} | पूरी कहानी (4K Hindi Animation)`;
    title2 = `${idea} का सबसे बड़ा रहस्य जो कोई नहीं जानता!`;
    title3 = `${idea} की चमत्कारी दास्तान | Hindi Story`;
  } else if (isHinglish) {
    title1 = `${idea} Full Story (4K Animated Video)`;
    title2 = `The Shocking Truth About ${idea} 😱`;
    title3 = `${idea} Ki Real Story Explained in Hindi`;
  }

  const tags = [
    idea,
    `${idea} animation`,
    `${idea} story`,
    `${idea} full video`,
    `${settings.visualStyle} animation`,
    `${settings.videoType || 'Story'} in ${lang}`,
    'YouTube Story',
    'AI Animation',
    'Cinematic Video',
    'Trending Animation',
  ];

  const chapters = scenes.map((s) => ({
    timecode: s.startTime || formatTimestamp((s.sceneNumber - 1) * 10),
    title: s.title,
  }));

  const description = `${title1}
  
Experience the complete story of "${idea}" in stunning ${settings.visualStyle} animation and immersive ${settings.tone} sound design.

✨ TIMESTAMPS / CHAPTERS:
${chapters.map((ch) => `${ch.timecode} - ${ch.title}`).join('\n')}

🔔 Subscribe for more high-quality ${settings.visualStyle} animations and stories!
👍 Drop a like and let us know your favorite scene in the comments below!

#${idea.replace(/[^a-zA-Z0-9]/g, '')} #Animation #${settings.visualStyle.replace(/\s+/g, '')} #${lang.replace(/\s+/g, '')}`;

  return {
    selectedTitle: title1,
    titleOptions: [
      { id: 't1', title: title1, style: 'High-Volume Search & Clarity', curiosityScore: 88, searchRelevanceScore: 98, clarityScore: 95, clickAppealScore: 92, charCount: title1.length, badge: 'best-search' },
      { id: 't2', title: title2, style: 'High-CTR Emotional Curiosity', curiosityScore: 98, searchRelevanceScore: 82, clarityScore: 90, clickAppealScore: 96, charCount: title2.length, badge: 'best-curiosity' },
      { id: 't3', title: title3, style: 'Evergreen Authority / Format Match', curiosityScore: 90, searchRelevanceScore: 94, clarityScore: 98, clickAppealScore: 94, charCount: title3.length, badge: 'best-overall' },
    ],
    description,
    tags,
    hashtags: ['#Story', '#Animation', '#YouTubeVideo', '#4K', `#${lang.replace(/\s+/g, '')}`],
    primaryKeyword: idea,
    secondaryKeywords: [`${idea} story`, `${idea} video`, `${settings.visualStyle} video`],
    longTailKeywords: [`watch ${idea} in ${lang}`, `best ${settings.visualStyle} animation for ${idea}`],
    chapters,
  };
}

export function generateShortsUniversal(
  idea: string,
  settings: VideoSettings,
  characters: CharacterProfile[],
  scenes: SceneBreakdown[]
): ShortsData {
  const primaryChar = characters[0]?.name || 'Protagonist';
  const lang = settings.language || 'English';
  const isHindi = lang.toLowerCase().includes('hindi');

  const short1: ShortScript = {
    id: 'short-1',
    title: isHindi ? `${idea} का सबसे बड़ा रहस्य! 😱` : `The Craziest Moment in ${idea}! 😱`,
    targetDuration: '30s',
    hook: isHindi ? 'Wait for the end! Yeh twist aapne kabhi nahi dekha hoga!' : 'Wait for the end! You will NOT believe what happened next!',
    callToAction: 'Subscribe for the full 4K episode!',
    visualBeats: [
      { second: '00:00 - 00:05', visual: `Extreme close up on ${primaryChar} looking shocked with dramatic light pulse.`, audioNarration: isHindi ? 'Pehle hi second mein sab kuch badal gaya...' : 'In the very first second, everything changed...', onScreenCaption: 'WAIT FOR THE END! 🚨' },
      { second: '00:05 - 00:15', visual: 'Fast kinetic montage of scenes showing glowing secrets and tension.', audioNarration: isHindi ? 'Dekhiye aage kya hua jab rahasya khula!' : 'Watch closely as the truth begins to reveal itself!', onScreenCaption: 'THE SECRET REVEALED ⚡' },
      { second: '00:15 - 00:25', visual: 'Climactic high-speed sequence with dazzling visual effects.', audioNarration: isHindi ? 'Aur tab hua sabse bada chamatkar!' : 'And that is when the impossible occurred!', onScreenCaption: 'UNBELIEVABLE MOMENT 🔥' },
      { second: '00:25 - 00:30', visual: `Final heroic freeze-frame of ${primaryChar} pointing to subscribe button.`, audioNarration: isHindi ? 'Puri kahani dekhne ke liye abhi subscribe karein!' : 'Subscribe now to watch the full 4K journey!', onScreenCaption: 'SUBSCRIBE FOR FULL VIDEO! 🔴' },
    ],
  };

  const short2: ShortScript = {
    id: 'short-2',
    title: isHindi ? `30 सेकंड में ${idea} ⚡` : `${idea} in 30 Seconds ⚡`,
    targetDuration: '30s',
    hook: isHindi ? '30 seconds mein dekhiye yeh adbhut kahani!' : '30 seconds of pure visual magic!',
    callToAction: 'Like & share with a friend!',
    visualBeats: [
      { second: '00:00 - 00:05', visual: 'Rapid 9:16 split-screen showing beginning vs climax.', audioNarration: isHindi ? 'Sirf 30 seconds mein dekhiye yeh kahani!' : 'Here is the entire epic in 30 seconds flat!', onScreenCaption: '30s SPEED RUN ⏱️' },
      { second: '00:05 - 00:20', visual: 'Lightning fast cuts through key story beats with beat-drop music.', audioNarration: isHindi ? 'Har scene mein ek naya romanchak mod!' : 'Every single second packed with stunning wonder!', onScreenCaption: 'EPIC HIGHLIGHTS ✨' },
      { second: '00:20 - 00:30', visual: 'Triumphant ending hero shot with call to action overlay.', audioNarration: isHindi ? 'Like karein aur dost ke saath share karein!' : 'Drop a like and follow for daily videos!', onScreenCaption: 'DROP A LIKE! 👍' },
    ],
  };

  return {
    scripts: [short1, short2],
  };
}

// -------------------------------------------------------------
// MASTER COMPLETE PACKAGE GENERATOR
// -------------------------------------------------------------

export function generateCompleteProjectPackage(
  idea: string,
  settings: VideoSettings,
  fullStory?: string,
  characterInstructions?: string,
  existingProjectId?: string
): YouTubeProject {
  const now = new Date().toISOString();
  const id = existingProjectId || `proj-${Date.now()}`;
  const title = idea.trim();

  const ctx = analyzeStoryContext(title, settings, fullStory, characterInstructions);

  const normalizedSettings: VideoSettings = {
    ...settings,
    totalDuration: settings.totalDuration || settings.duration || `${Math.round(ctx.totalSec / 60)} minutes`,
    totalDurationSeconds: ctx.totalSec,
    sceneDuration: settings.sceneDuration || `${ctx.sceneSec} seconds`,
    sceneDurationSeconds: ctx.sceneSec,
    voiceMode: ctx.voiceMode,
    targetScenesCount: ctx.sceneCount,
    targetDuration: settings.totalDuration || settings.duration || `${Math.round(ctx.totalSec / 60)} minutes`,
    includeCharacters: settings.includeCharacters ?? true,
    aspectRatio: settings.aspectRatio || '16:9',
    storyIdea: title,
    storyMode: ctx.storyMode,
    storySource: settings.storySource || (fullStory ? 'user_story' : 'ai_create'),
    storyText: fullStory || settings.storyText,
    refinedStory: settings.refinedStory,
    planningMode: ctx.planningMode,
    fullStory: ctx.fullStory,
    characterInstructions: ctx.characterInstructions,
  };

  const story = generateStoryUniversal(title, normalizedSettings, ctx.fullStory, ctx.characterInstructions);
  const effectiveStory = story.fullStory;

  // Extract all assets from the unified story
  const assetPackage = extractAllAssetsUniversal(title, normalizedSettings, effectiveStory, ctx.characterInstructions);
  const characters = normalizedSettings.includeCharacters ? assetPackage.characters : [];
  const props = assetPackage.props;
  const environments = assetPackage.environments;
  const assetRegistry = assetPackage.assetRegistry;

  const musicLock = generateMusicLockUniversal(title, normalizedSettings);
  const voiceLock = generateVoiceLockUniversal(title, normalizedSettings);

  const concept = generateConceptUniversal(title, normalizedSettings, effectiveStory);
  const hook = generateHookUniversal(title, normalizedSettings, effectiveStory);
  const scenes = generateScenesUniversal(title, normalizedSettings, characters, effectiveStory, props, environments);
  const script = generateScriptUniversal(title, normalizedSettings, scenes, characters);
  const videoPrompts = generateVideoPromptsUniversal(title, normalizedSettings, scenes, characters, props, environments, musicLock, voiceLock);
  const thumbnail = generateThumbnailUniversal(title, normalizedSettings, characters);
  const youtubeSeo = generateSeoUniversal(title, normalizedSettings, scenes);
  const shorts = generateShortsUniversal(title, normalizedSettings, characters, scenes);

  return {
    id,
    projectId: id,
    title,
    idea: title,
    storyIdea: title,
    fullStory: effectiveStory,
    characterInstructions: ctx.characterInstructions,
    createdAt: now,
    updatedAt: now,
    settings: normalizedSettings,
    story,
    concept,
    hook,
    characters,
    props,
    environments,
    assetRegistry,
    musicLock,
    voiceLock,
    script,
    scenes,
    videoPrompts,
    thumbnail,
    youtubeSeo,
    shorts,
  };
}
