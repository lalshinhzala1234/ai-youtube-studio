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
// DURATION & TIME UTILITIES
// -------------------------------------------------------------

export function parseDurationSeconds(durationStr?: string): number {
  if (!durationStr) return 180;
  const lower = durationStr.toLowerCase().trim();
  if (/\b(?:scenes?|shots?)\b/i.test(lower)) {
    const num = parseFloat(lower.replace(/[^0-9.]/g, '')) || 4;
    return Math.round(num * 10);
  }
  if (lower.includes('min')) {
    const num = parseFloat(lower.replace(/[^0-9.]/g, '')) || 3;
    return Math.round(num * 60);
  }
  if (/\b(?:seconds?|secs?|s)\b/i.test(lower)) {
    const num = parseFloat(lower.replace(/[^0-9.]/g, '')) || 30;
    return Math.round(num);
  }
  const fallbackNum = parseFloat(lower);
  return !isNaN(fallbackNum) && fallbackNum > 0 ? Math.round(fallbackNum * 60) : 180;
}

export function parseSceneSeconds(sceneDurationStr?: string, defaultSec = 10): number {
  if (!sceneDurationStr) return defaultSec;
  const lower = sceneDurationStr.toLowerCase().trim();
  if (lower.includes('min')) {
    const num = parseFloat(lower.replace(/[^0-9.]/g, '')) || 1;
    return Math.max(3, Math.min(120, Math.round(num * 60)));
  }
  if (/\b(?:seconds?|secs?|s)\b/i.test(lower)) {
    const num = parseFloat(lower.replace(/[^0-9.]/g, '')) || defaultSec;
    return Math.max(3, Math.min(120, Math.round(num)));
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
  baseSceneSec?: number
): number[] {
  const count = Math.max(1, sceneCount);
  if (count === 1) return [totalSec];

  if (planningMode === 'manual' && baseSceneSec && baseSceneSec > 0) {
    const durations = Array(count).fill(baseSceneSec);
    const sum = durations.reduce((a, b) => a + b, 0);
    const diff = totalSec - sum;
    if (diff !== 0) {
      durations[durations.length - 1] = Math.max(3, durations[durations.length - 1] + diff);
    }
    return durations;
  }

  // AI Auto Planning — Dynamic cinematic pacing curve
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
}

export function analyzeStoryContext(
  idea: string,
  settings: VideoSettings,
  fullStory?: string,
  characterInstructions?: string
): StoryContext {
  const totalSec = typeof settings.totalDurationSeconds === 'number' && settings.totalDurationSeconds > 0
    ? settings.totalDurationSeconds
    : parseDurationSeconds(settings.totalDuration || settings.duration || settings.targetDuration);
  const sceneSec = typeof settings.sceneDurationSeconds === 'number' && settings.sceneDurationSeconds > 0
    ? settings.sceneDurationSeconds
    : parseSceneSeconds(settings.sceneDuration, 10);
  
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
  };
}

// -------------------------------------------------------------
// UNIVERSAL STORY ENGINE
// -------------------------------------------------------------
// UNIVERSAL STORY ENGINE
// -------------------------------------------------------------

export function generateStoryUniversal(
  idea: string,
  settings: VideoSettings,
  userStoryInput?: string,
  characterInstructions?: string
): StoryData {
  const lang = settings.language || 'English';
  const style = settings.visualStyle || '3D Cartoon';
  const rawStory = (userStoryInput || settings.fullStory || settings.storyText || settings.refinedStory || '').trim();
  const storyMode: StoryMode = settings.storyMode === 'user_exact' ? 'user_exact' : (rawStory ? 'user_refined' : 'ai_create');
  const storySource: StorySource = settings.storySource || (rawStory ? 'user_story' : 'ai_create');

  // If a concrete story narrative is present (user-provided or generated)
  if (rawStory) {
    const paragraphs = rawStory.split(/\n\s*\n|\n/).filter((p) => p.trim().length > 0);
    const extractedAssets = extractAllAssetsUniversal(idea, settings, rawStory, characterInstructions);
    const detectedNames = extractedAssets.characters.map((c) => c.name);
    const fallbackInvolved = detectedNames.length > 0 ? detectedNames : ['Protagonist'];

    const progression: StoryProgressionBeat[] = paragraphs.map((para, i) => {
      const actNumber = i + 1;
      let actName = `Act ${actNumber}: Story Beat`;
      if (i === 0) actName = 'Act 1: Beginning & Opening Setup';
      else if (i === 1) actName = 'Act 2: Rising Progression';
      else if (i === Math.floor(paragraphs.length / 2)) actName = 'Act 3: Core Turning Point';
      else if (i === paragraphs.length - 2) actName = 'Act 4: Climax';
      else if (i === paragraphs.length - 1) actName = `Act ${actNumber}: Resolution & Conclusion`;

      const paraLower = para.toLowerCase();
      const beatChars = detectedNames.filter((name) => paraLower.includes(name.toLowerCase()));
      const resolvedBeatChars = beatChars.length > 0 ? beatChars : fallbackInvolved;

      return {
        act: actName,
        title: `Beat ${actNumber}`,
        summary: para.slice(0, 150) + (para.length > 150 ? '...' : ''),
        characters: resolvedBeatChars,
        keyActions: para.slice(0, 120),
        dialogueSnippet: para.includes('"') ? para.match(/"([^"]+)"/)?.[0] : undefined,
      };
    });

    return {
      storyMode,
      storySource,
      exactStory: storyMode === 'user_exact' ? rawStory : undefined,
      refinedStory: rawStory,
      fullStory: rawStory,
      summary: `Narrative production based on "${idea}".`,
      premise: `Narrative production based on "${idea}" rendered in ${style} aesthetic.`,
      characterOverview: characterInstructions || (detectedNames.length > 0 ? `Characters: ${detectedNames.join(', ')}` : 'Characters defined in the story narrative.'),
      environmentWorld: `Thematic world of ${idea} in ${style} aesthetic.`,
      progression: progression,
      progressionBeats: progression,
      charactersInvolved: fallbackInvolved,
      dialogueHighlights: paragraphs.slice(0, 3).map((p) => p.slice(0, 90) + (p.length > 90 ? '...' : '')),
      storyTone: settings.tone || 'Exciting',
      targetAudienceAnalysis: `${settings.audience || 'General'} audience enjoying ${style} storytelling in ${lang}`,
    };
  }

  // Mode A: AI CREATE COMPLETE STORY
  const storyText = createUniversalStoryText(idea, settings, characterInstructions);
  const extractedAssets = extractAllAssetsUniversal(idea, settings, storyText, characterInstructions);
  const detectedNames = extractedAssets.characters.map((c) => c.name);
  const fallbackInvolved = detectedNames.length > 0 ? detectedNames : ['Protagonist'];

  const beats: StoryProgressionBeat[] = [
    {
      act: 'Act 1: Opening Hook & World Setup',
      title: 'The Spark of Wonder',
      summary: `Our journey begins in "${idea}". Immediate visual curiosity grabs the viewer.`,
      characters: fallbackInvolved.slice(0, 2),
      keyActions: 'Stepping into the setting, identifying the primary wonder or mystery.',
    },
    {
      act: 'Act 2: Rising Adventure & Escalation',
      title: 'Deeper into the Realm',
      summary: 'Exploring wondrous landmarks, solving playful challenges, and building dynamic character chemistry.',
      characters: fallbackInvolved,
      keyActions: 'Overcoming environmental obstacles, unlocking visual clues.',
    },
    {
      act: 'Act 3: Climax & The Grand Secret',
      title: 'The Pivotal Revelation',
      summary: 'The ultimate mystery is revealed in a burst of cinematic light, sound, and emotional triumph.',
      characters: fallbackInvolved,
      keyActions: 'Reaching the central summit, confronting the main challenge.',
    },
    {
      act: 'Act 4: Heartfelt Resolution',
      title: 'A Legacy of Wonder',
      summary: 'Celebrating unity, new friendship, and the eternal beauty of the completed adventure.',
      characters: fallbackInvolved,
      keyActions: 'Triumphant celebration, horizon gaze, and inspiring closing words.',
    },
  ];

  return {
    storyMode: 'ai_create',
    storySource: 'ai_create',
    fullStory: storyText,
    summary: `Complete original narrative crafted for "${idea}".`,
    premise: `An exhilarating, high-retention adventure exploring "${idea}" crafted in ${style} aesthetic.`,
    characterOverview: characterInstructions || (detectedNames.length > 0 ? `Characters: ${detectedNames.join(', ')}` : `Authentic characters designed specifically for "${idea}".`),
    environmentWorld: `Rich, immersive environments designed with ${style} lighting and vibrant depth.`,
    progression: beats,
    progressionBeats: beats,
    charactersInvolved: fallbackInvolved,
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
  const lowerStory = storyNarrative.toLowerCase();
  const style = settings.visualStyle || '3D Cartoon';
  const lang = settings.language || 'English';

  const characters: CharacterProfile[] = [];
  const props: PropProfile[] = [];
  const environments: EnvironmentProfile[] = [];

  const toStableId = (prefix: string, name: string) => {
    const clean = name.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return clean.length > 0 ? `${prefix}_${clean}` : prefix.toUpperCase();
  };

  // Phrases and common grammatical words that must NEVER be extracted as character names
  const STOP_PHRASES = new Set([
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
    // Hindi Numbers & Quantifiers
    'ek', 'do', 'teen', 'chaar', 'paanch', 'dono', 'teeno', 'charo', 'sabhi', 'sab', 'kuch', 'koi', 'kisi',
    // Pronouns (Hindi & English)
    'ye', 'yeh', 'wo', 'woh', 'unhe', 'unko', 'unka', 'unki', 'unke', 'unhone', 'unse',
    'usse', 'usko', 'uska', 'uski', 'uske', 'usne', 'us', 'is', 'isse', 'isko', 'iska', 'iski', 'iske', 'isne',
    'inka', 'inki', 'inke', 'inko', 'inhe', 'inhone',
    'hum', 'humein', 'humne', 'humara', 'humari', 'humare',
    'main', 'mujhko', 'mera', 'meri', 'mere', 'mujhe', 'maine',
    'tum', 'tumhara', 'tumhari', 'tumhare', 'tumne', 'tujhe', 'tera', 'teri', 'tere',
    'aap', 'aapka', 'aapki', 'aapke', 'aapne',
    'kis', 'kiska', 'kiski', 'kiske', 'kisne', 'kisko',
    'kya', 'kyon', 'kyu', 'kyun', 'kaise', 'kab', 'kahan', 'kaha', 'kahaa', 'kidhar', 'jahan', 'jidhar', 'jab', 'tab', 'ab',
    'the', 'a', 'an', 'he', 'she', 'it', 'they', 'we', 'you', 'i', 'me', 'him', 'her', 'them', 'us',
    'my', 'mine', 'your', 'yours', 'his', 'hers', 'their', 'theirs', 'its', 'our', 'ours',
    'this', 'that', 'these', 'those', 'who', 'whom', 'whose', 'which', 'what', 'when', 'where', 'why', 'how',
    // Hindi Verbs & Action Words
    'dekho', 'dekha', 'dekhti', 'dekhta', 'dekhte', 'dekh', 'dekhein',
    'bola', 'boli', 'bole', 'bolta', 'bolti', 'bolte', 'bol',
    'kaha', 'kahi', 'kahe', 'kehta', 'kehti', 'kehte', 'keh',
    'suno', 'suna', 'sunti', 'sunta', 'sunte', 'sun',
    'jaao', 'jaa', 'jaate', 'jaati', 'jaata', 'gaye', 'gayi', 'gaya', 'gya', 'jaana', 'jayein', 'jao',
    'aao', 'aa', 'aate', 'aati', 'aata', 'aaye', 'aayi', 'aaya', 'aana', 'aayein',
    'chalo', 'chal', 'chalte', 'chalti', 'chalta', 'chale', 'chali', 'chala', 'chalna',
    'ruko', 'ruk', 'rukte', 'rukti', 'rukta', 'ruke', 'ruki', 'ruka', 'rukna',
    'socho', 'socha', 'sochti', 'sochta', 'sochte', 'soch', 'sochein',
    'batao', 'bataya', 'batati', 'batata', 'batate', 'bata',
    'poocha', 'poochti', 'poochta', 'poochte', 'pooch',
    'khola', 'kholi', 'khole', 'kholta', 'kholti', 'kholte', 'khol', 'khul', 'khula',
    'jalaya', 'jalayi', 'jalaye', 'jalata', 'jalati', 'jalate',
    'mila', 'mili', 'mile', 'milta', 'milti', 'milte',
    'dhoondha', 'dhoondhti', 'dhoondhta', 'dhoondhte', 'khoj',
    'uthaya', 'uthayi', 'uthaye', 'uthata', 'uthati', 'uthate', 'utha', 'uthta', 'uthti',
    'baitha', 'baithi', 'baithe', 'dauda', 'daudi', 'daude', 'bhaaga', 'bhaagi', 'bhaage',
    'hasa', 'hasi', 'hase', 'muskuraya', 'muskurayi', 'muskuraye',
    'laya', 'layi', 'laye', 'diya', 'diyi', 'diye', 'leta', 'leti', 'lete', 'liya', 'liyi', 'liye',
    'kiya', 'kiyi', 'kiye', 'karta', 'karti', 'karte', 'karna', 'karega', 'karegi', 'karein', 'kar', 'kare', 'karenge',
    'hona', 'hoga', 'hogi', 'honge', 'ho', 'hai', 'hain', 'tha', 'thi', 'the', 'hoon',
    'raha', 'rahi', 'rahe', 'rehna', 'lag', 'laga', 'lagi', 'lage', 'lagta', 'lagti', 'lagte',
    'ban', 'bana', 'bani', 'bane', 'pahuche', 'pahuncha', 'pahunchi', 'pahunche', 'pahunchti',
    'badhti', 'badhta', 'badhne', 'tairti', 'tairta', 'dakhil', 'hote', 'hota', 'hoti', 'ishara',
    // Conjunctions, Adverbs, Prepositions, Directions
    'aur', 'va', 'tatha', 'ya', 'par', 'pe', 'mein', 'se', 'ki', 'ka', 'ke', 'ko', 'ne', 'bhi',
    'liye', 'saath', 'bina', 'binaa', 'baad', 'pehle', 'aage', 'peeche', 'upar', 'neeche', 'andar', 'bahar', 'baahar',
    'paas', 'door', 'taraf', 'disha', 'uttar', 'dakshin', 'poorav', 'paschim', 'agle', 'pichle', 'naye', 'purane',
    'yahan', 'wahan', 'jahan', 'idhar', 'udhar', 'kahin',
    'sahi', 'galat', 'sach', 'jhooth', 'bilkul', 'shayad', 'zaroor', 'toh', 'to',
    'lekin', 'magar', 'kintu', 'parantu', 'kyonki', 'taaki', 'jabki', 'tabhi', 'abhi', 'kabhi', 'fir', 'phir',
    'waise', 'jaise', 'taise', 'aise', 'kyunki', 'balki', 'nahi', 'na', 'mat', 'haan',
    'acha', 'achha', 'achhi', 'achhe', 'sundar', 'chamakte', 'hue', 'roshni',
    'bohot', 'bahut', 'zyada', 'kam', 'thoda', 'thodi', 'thode', 'poora', 'poori', 'poore', 'sara', 'sari', 'sare',
    'achanak', 'ekdam', 'turant', 'jald', 'jaldi', 'shuru', 'ant', 'antim', 'aakhir', 'aakhiri',
    'subah', 'shaam', 'raat', 'dopahar', 'waqt', 'samay', 'saal', 'mahina', 'din', 'aaj', 'kal', 'parso', 'chahiye',
    // Props & Location words (which must go to props/environments, NOT characters)
    'compass', 'rahasyamayi compass', 'naksha', 'map', 'torch', 'mashal', 'flashlight', 'lamp',
    'key', 'chaabi', 'book', 'kitaab', 'box', 'sandook', 'sword', 'talwar', 'flute', 'bansuri', 'wand',
    'pahadi', 'pahad', 'parvat', 'mountain', 'hill', 'gufa', 'cave', 'cavern', 'van', 'jungle', 'forest', 'woods',
    'nadi', 'river', 'riverbank', 'yamuna', 'ganga', 'kinare', 'kinara', 'samundar', 'ocean', 'sea',
    'shehar', 'city', 'gaon', 'village', 'raasta', 'path', 'trail', 'road', 'mahal', 'palace', 'mandir', 'temple',
    'house', 'ghar', 'room', 'kamra', 'door', 'darwaza', 'darwaze', 'gate', 'sky', 'aakash', 'aasman', 'rahasya', 'rahasyamayi',
    // False phrase combos
    'ye compass', 'taraf nahi', 'us pahadi', 'ye agle', 'kya hai'
  ]);

  interface DiscoveredEntity {
    rawName: string;
    roleHint?: string;
    typeHint?: string;
    speciesHint?: string;
    ageHint?: string;
    genderHint?: string;
    isInferred?: boolean;
    inferredReason?: string;
  }

  const discoveredEntities: Map<string, DiscoveredEntity> = new Map();

  const addEntity = (
    rawName: string,
    roleHint?: string,
    typeHint?: string,
    speciesHint?: string,
    ageHint?: string,
    genderHint?: string,
    isInferred = false,
    inferredReason?: string
  ) => {
    const clean = rawName.trim().replace(/^[\s,.;:!?\-'"()]+|[\s,.;:!?\-'"()]+$/g, '');
    if (!clean || clean.length < 2) return;
    const lower = clean.toLowerCase();

    // Strict validation: NEVER allow stop words, verbs, pronouns, prepositions, or false phrases
    if (STOP_PHRASES.has(lower)) return;
    if (/^(the|a|an|in|at|on|with|from|by|to|and|or|is|are|was|were|then|there|here|suddenly|finally|when|as|after|before|into|onto|their|his|her|its|our|your|ye|yeh|wo|woh|us|is|toh|to|aur|se|ke|ki|ka|ko|ne|par|pe|mein|dekho|kehti|kaha|wahan|raasta|pahadi|compass)$/i.test(clean)) return;

    // Do NOT extract if this word is merely the project title itself and not in the story text
    if (clean.toLowerCase() === idea.trim().toLowerCase() && !storyNarrative.includes(clean)) {
      return;
    }

    const key = lower;
    if (!discoveredEntities.has(key)) {
      discoveredEntities.set(key, {
        rawName: clean,
        roleHint,
        typeHint,
        speciesHint,
        ageHint,
        genderHint,
        isInferred,
        inferredReason,
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
        const charName = match[1].trim();
        const details = match[2] || '';
        addEntity(charName, details.includes('guide') ? 'Guide' : 'Lead Protagonist', 'Character');
      }
    }
  }

  // -------------------------------------------------------------
  // PASS 2: DEVANAGARI & HINDI NAMED ENTITIES (Active Story Text Only)
  // -------------------------------------------------------------
  if (storyNarrative.includes('राधा') || /\bradhas?\b/i.test(storyNarrative)) {
    addEntity('Radha', 'Lead Protagonist & Heroine', 'Deity / Protagonist', 'Divine / Human', '16 years old', 'Female');
  }
  if (storyNarrative.includes('कृष्ण') || storyNarrative.includes('कान्हा') || /\bkrishnas?\b|\bkanhas?\b/i.test(storyNarrative)) {
    addEntity('Krishna', 'Lead Protagonist & Hero', 'Deity / Protagonist', 'Divine / Human', '16 years old', 'Male');
  }
  if (storyNarrative.includes('बलराम') || storyNarrative.includes('दाऊ') || /\bbalrams?\b|\bbalarams?\b/i.test(storyNarrative)) {
    addEntity('Balram', 'Elder Brother & Guardian', 'Deity / Guardian', 'Divine / Human', '18 years old', 'Male');
  }
  if (storyNarrative.includes('सुदामा') || /\bsudamas?\b/i.test(storyNarrative)) {
    addEntity('Sudama', 'Devoted Companion', 'Human Companion', 'Human', '16 years old', 'Male');
  }
  if (storyNarrative.includes('मीरा') || /\bmeeras?\b|\bmiras?\b/i.test(storyNarrative) || (/chiku/i.test(storyNarrative) && /jhoola|jhula|swing/i.test(storyNarrative))) {
    addEntity('Meera', 'Companion & Co-Explorer', 'Human Child', 'Human Child', '7 years old', 'Girl');
  }
  if (storyNarrative.includes('चीकू') || /\bchikus?\b/i.test(storyNarrative)) {
    addEntity('Chiku', 'Lead Child Protagonist & Explorer', 'Human Child', 'Human Child', '7 years old', 'Boy');
  }
  if (storyNarrative.includes('गोलू') || /\bgolus?\b/i.test(storyNarrative)) {
    addEntity('Golu', 'Lead Companion', 'Human Child', 'Human Child', '8 years old', 'Boy');
  }
  if (storyNarrative.includes('मोलू') || /\bmolus?\b/i.test(storyNarrative)) {
    addEntity('Molu', 'Playful Companion', 'Human Child', 'Human Child', '7 years old', 'Boy');
  }

  // -------------------------------------------------------------
  // PASS 3: STRICT NAMED STORY ENTITIES (Active Story Text Only)
  // -------------------------------------------------------------
  if (/\brav(?:i|is)\b/i.test(storyNarrative)) {
    addEntity('Ravi', 'Lead Explorer', 'Human Explorer', 'Human', '14 years old', 'Male');
  }
  if (/\bnehas?\b/i.test(storyNarrative)) {
    addEntity('Neha', 'Explorer Companion', 'Human Specialist', 'Human', '13 years old', 'Female');
  }
  if (/\brajs?\b/i.test(storyNarrative)) {
    addEntity('Raj', 'Lead Detective', 'Human Detective', 'Human', '35 years old', 'Male');
  }
  if (/\bananyas?\b/i.test(storyNarrative)) {
    addEntity('Ananya', 'Detective Partner', 'Human Detective', 'Human', '28 years old', 'Female');
  }
  if (/\bmohans?\b/i.test(storyNarrative)) {
    addEntity('Mohan', 'Mystical Guide & Talking Fox', 'Animal (Fox)', 'Fox', 'Adult Fox', 'Male');
  }
  if (/\belenas?\b/i.test(storyNarrative)) {
    addEntity('Elena', 'Elder Sister & Lead Explorer', 'Human Explorer', 'Human', '12 years old', 'Female');
  }
  if (/\bmayas?\b/i.test(storyNarrative)) {
    addEntity('Maya', 'Younger Sister & Explorer', 'Human Explorer', 'Human', '8 years old', 'Female');
  }
  if (/\btaras?\b/i.test(storyNarrative)) {
    addEntity('Tara', 'Ocean Explorer', 'Human Explorer', 'Human', '7 years old', 'Female');
  }
  if (/\baaravs?\b/i.test(storyNarrative)) {
    addEntity('Aarav', 'Lead Explorer', 'Human Explorer', 'Human', '14 years old', 'Male');
  }
  if (/\bpriyas?\b/i.test(storyNarrative)) {
    addEntity('Priya', 'Science Specialist & Explorer', 'Human Specialist', 'Human', '14 years old', 'Female');
  }
  if (/\brohans?\b/i.test(storyNarrative)) {
    addEntity('Rohan', 'Lead Explorer & Photographer', 'Human Explorer', 'Human', '25 years old', 'Male');
  }
  if (/\bliams?\b/i.test(storyNarrative)) {
    addEntity('Liam', 'Lead Team Explorer', 'Human Explorer', 'Human', '14 years old', 'Male');
  }
  if (/\bsophias?\b/i.test(storyNarrative)) {
    addEntity('Sophia', 'Science & Technology Lead', 'Human Specialist', 'Human', '14 years old', 'Female');
  }
  if (/\bnoahs?\b/i.test(storyNarrative)) {
    addEntity('Noah', 'Navigation Specialist', 'Human Specialist', 'Human', '13 years old', 'Male');
  }
  if (/\bemmas?\b/i.test(storyNarrative)) {
    addEntity('Emma', 'Naturalist & Communications Lead', 'Human Specialist', 'Human', '13 years old', 'Female');
  }

  // Explicit role introductions (e.g. "friend Leo", "sister Ananya")
  const roleNamedMatches = storyNarrative.matchAll(/(?:named|called|sister|brother|friend|explorer|detective|scientist|captain|princess|king|doctor)\s+([A-Z][a-z]{2,15})\b/gi);
  for (const match of roleNamedMatches) {
    if (match[1] && !STOP_PHRASES.has(match[1].toLowerCase())) {
      addEntity(match[1], 'Character');
    }
  }

  // Agentive verbs indicating real character actions (e.g. "Karan ne kaha", "Simran said")
  const agentiveMatches = storyNarrative.matchAll(/\b([A-Z][a-z]{2,15})\s+(?:ne\s+(?:kaha|dekha|bola|socha|bataya|poocha|uthaya|khola)|said|whispered|exclaimed|asked)\b/g);
  for (const match of agentiveMatches) {
    if (match[1] && !STOP_PHRASES.has(match[1].toLowerCase())) {
      addEntity(match[1], 'Character');
    }
  }

  // -------------------------------------------------------------
  // PASS 4: ANIMAL & FABLE CHARACTERS IN STORY NARRATIVE
  // -------------------------------------------------------------
  if (/\bbunn(?:y|ies)\b|\brabbits?\b/i.test(storyNarrative)) {
    addEntity('Bunny', 'Animal Companion & Guide', 'Animal (Rabbit)', 'Rabbit', 'Young Bunny', 'Unspecified');
  }
  if (/\b(?:baby )?bear(?: cub)?\b/i.test(storyNarrative)) {
    addEntity('Baby Bear', 'Animal Companion', 'Animal (Bear Cub)', 'Bear Cub', 'Baby Bear Cub', 'Male');
  }
  if (/\belephants?\b/i.test(storyNarrative)) {
    addEntity('Baby Elephant', 'Animal Companion', 'Animal (Elephant)', 'Elephant', 'Baby Elephant', 'Unspecified');
  }
  if (/\bfish(?:es)?\b/i.test(storyNarrative)) {
    addEntity('Colorful Fish', 'Undersea Companion Group', 'Aquatic Chorus', 'Tropical Fish', 'Ageless', 'Group');
  }
  if (/\bgiraffes?\b/i.test(storyNarrative)) {
    addEntity('Friendly Giraffe', 'Savanna Guide', 'Animal (Giraffe)', 'Giraffe', 'Young Giraffe', 'Unspecified');
  }
  if (/\b(?:white )?pon(?:y|ies)\b|\bhorse\b/i.test(storyNarrative)) {
    addEntity('White Pony', 'Gentle Steed Companion', 'Animal (Pony)', 'White Pony', 'Young Pony', 'Unspecified');
  }
  if (/\blions?\b/i.test(storyNarrative)) {
    addEntity('Friendly Lion', 'Noble Companion', 'Animal (Lion)', 'Lion', 'Young Lion', 'Male');
  }
  if (/\bmonkeys?\b/i.test(storyNarrative)) {
    addEntity('Playful Monkey', 'Acrobatic Companion', 'Animal (Monkey)', 'Monkey', 'Young Monkey', 'Male');
  }
  if (/\b(?:baby )?birds?\b/i.test(storyNarrative)) {
    addEntity('Baby Birds', 'Avian Chorus', 'Animal (Songbirds)', 'Baby Birds', 'Fledglings', 'Group');
  }
  if (/\bowls?\b/i.test(storyNarrative)) {
    addEntity('Friendly Owl', 'Wise Twilight Guide', 'Animal (Owl)', 'Owl', 'Wise Elder', 'Unspecified');
  }
  if (/\bpenguins?\b/i.test(storyNarrative)) {
    addEntity('Cheerful Penguin', 'Snow Companion', 'Animal (Penguin)', 'Penguin', 'Young Penguin', 'Unspecified');
  }
  if (/\bqueens?\b/i.test(storyNarrative)) {
    addEntity('Rainbow Queen', 'Royal Guardian', 'Royal Entity', 'Human / Royal', 'Adult', 'Female');
  }

  // -------------------------------------------------------------
  // PASS 5: INFERRED STORY CHARACTERS (e.g. "two sisters", "two friends")
  // Only if zero explicit character names were discovered!
  // -------------------------------------------------------------
  if (discoveredEntities.size === 0 && storyNarrative.length > 0) {
    if (/\btwo sisters\b|\b2 sisters\b/i.test(storyNarrative)) {
      addEntity('Elder Sister', 'Lead Protagonist & Elder Sister', 'Human Explorer', 'Human', '12 years old', 'Female', true, 'Inferred from story reference to two sisters');
      addEntity('Younger Sister', 'Companion & Younger Sister', 'Human Explorer', 'Human', '8 years old', 'Female', true, 'Inferred from story reference to two sisters');
    } else if (/\btwo brothers\b|\b2 brothers\b/i.test(storyNarrative)) {
      addEntity('Elder Brother', 'Lead Protagonist & Elder Brother', 'Human Explorer', 'Human', '14 years old', 'Male', true, 'Inferred from story reference to two brothers');
      addEntity('Younger Brother', 'Companion & Younger Brother', 'Human Explorer', 'Human', '10 years old', 'Male', true, 'Inferred from story reference to two brothers');
    } else if (/\btwo friends\b|\b2 friends\b/i.test(storyNarrative)) {
      addEntity('Lead Explorer', 'Lead Protagonist', 'Human Explorer', 'Human', '14 years old', 'Male', true, 'Inferred from story reference to two friends');
      addEntity('Companion Explorer', 'Companion & Researcher', 'Human Specialist', 'Human', '13 years old', 'Female', true, 'Inferred from story reference to two friends');
    }
  }

  // -------------------------------------------------------------
  // PASS 6: BUILD COMPLETE LOCKED INDIVIDUAL PROFILES
  // -------------------------------------------------------------
  let entityIndex = 1;
  for (const [, entity] of discoveredEntities) {
    const name = entity.rawName;

    const role = entity.roleHint || (entityIndex === 1 ? 'Lead Protagonist' : 'Supporting Companion');
    const characterType = entity.typeHint || 'Human';
    const species = entity.speciesHint || 'Human';
    const age = entity.ageHint || '24 years old';
    const ageCategory = entity.ageHint?.includes('Child') || entity.ageHint?.includes('7') || entity.ageHint?.includes('8') ? 'Child' : 'Young Adult';
    const gender = entity.genderHint || 'Unspecified';

    // Dynamic profile construction from active story entity
    const id = toStableId(`CHAR_${String(entityIndex).padStart(3, '0')}`, name);
    const displayName = `${name} (${role})`;
    const appearance = `${name}, ${age} ${gender !== 'Unspecified' ? gender : ''} ${characterType} rendered in ${style} aesthetic with expressive facial features and clean animation silhouette.`;
    const visualAppearance = `${name} in ${style}`;
    const face = 'Expressive eyes, warm facial symmetry, natural confident gaze.';
    const hair = 'Neatly styled hair framing face with realistic physics.';
    const skin = 'Natural radiant tone with volumetric lighting.';
    const body = 'Well-proportioned silhouette suited for animation.';
    const clothing = `Signature adventure attire in ${style}.`;
    const clothingOutfit = clothing;
    const accessories = 'Story-appropriate gear.';
    const signatureItem = accessories;
    const personality = 'Brave, curious, loyal, and emotionally expressive.';
    const personalityTraits = ['Curious', 'Brave', 'Kind', 'Loyal'];
    const expressions = 'Warm reassuring smile, wide-eyed wonder, determined focus.';
    const voiceLockId = `VOICE_${name.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}_${gender === 'Girl' || gender === 'Female' ? 'GIRL' : 'BOY'}_${ageCategory === 'Child' ? '07' : '24'}`;
    const voiceDescription = gender === 'Girl' || gender === 'Female'
      ? `Sweet, expressive ${ageCategory === 'Child' ? '7yo girl' : 'youthful'} voice, enthusiastic ${lang} tone`
      : `${ageCategory === 'Child' ? '7yo curious boy' : 'articulate young'} voice, energetic cheerful ${lang} tone`;
    const voice = `${voiceLockId} (${voiceDescription})`;
    const voiceStyle = voiceDescription;
    const speakingStyle = 'Natural, melodic cadence.';
    const characterPurpose = 'Drive narrative momentum, visual continuity, and emotional connection.';
    const lockedAttributes: string[] = ['Consistent facial structure', 'Signature costume', 'Hairstyle'];

    const visualPromptAnchor = `${id}, ${displayName}, ${age}, ${characterType}, ${appearance}, ${style}, volumetric cinematic lighting, 8k render`;
    const characterConsistencyLock = `${id}: ${name}, ${characterType} (${age}): ${clothing}. Locked facial structure & signature costume across all scenes. Exactly ONE character.`;
    const generationPrompt = `Master reference portrait of ${id} (${name}), ${appearance}, aesthetic style ${style}, clean studio lighting, 8k --ar 1:1`;

    const charProfile: CharacterProfile = {
      id,
      name,
      displayName,
      role,
      characterType,
      type: 'character',
      species,
      age,
      ageCategory,
      ageOrSpecies: age,
      gender,
      description: `${displayName} rendered in ${style} aesthetic.`,
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
      clothingOutfit,
      shoes: 'Signature footwear matching character design',
      accessories,
      signatureItem,
      personality,
      personalityTraits,
      expressions,
      voice,
      voiceStyle,
      voiceCharacteristics: voice,
      speakingStyle,
      speakingOrSingingRole: role,
      characterPurpose,
      visualPromptAnchor,
      characterConsistencyLock,
      characterIdentityLock: characterConsistencyLock,
      generationPrompt,
      lockedAttributes,
      style,
      status: 'REFERENCE_READY',
      referenceImageStatus: 'READY',
      usageScenes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      negativePrompt: 'different face, altered clothing, distorted proportions, extra limbs, blurry, morphing face, inconsistent outfit, changing colors',
    };

    characters.push(charProfile);
    entityIndex++;
  }

  // -------------------------------------------------------------
  // STORY-AWARE PROPS & OBJECTS EXTRACTION
  // -------------------------------------------------------------
  const storyCombined = `${idea} ${storyNarrative}`.toLowerCase();
  const aspect = settings.aspectRatio || '9:16';

  // 0. Magical Swing / Jadui Jhoola
  if (/jhoola|jhula|swing/i.test(storyCombined)) {
    props.push({
      id: 'PROP_001_MAGICAL_SWING',
      displayName: 'Jadui Jhoola (Magical Swing)',
      type: 'special_object',
      description: `Enchanted wooden swing hanging from sturdy flowering jungle vines with glowing floral engravings and magical sparkle trails in ${style}.`,
      appearance: `Rustic carved mahogany wooden swing seat suspended by braided flowering vines, decorated with luminescent emerald moss and glowing golden leaves in ${style}.`,
      shape: 'Rectangular carved wooden swing seat hanging from twin braided vine ropes',
      materials: 'Polished enchanted wood, braided flowering vines, glowing fairy blossoms',
      colors: 'Warm Mahogany Wood, Luminescent Emerald, Golden Amber Sparkles',
      designDetails: 'Floral carvings with faint golden luminescence along the seat edges and blooming fairy buds along the ropes',
      scale: 'Full swing seat for children (60cm width)',
      usage: 'Swung by Chiku and Meera in the enchanted jungle clearing',
      style,
      lockedAttributes: ['Carved mahogany swing seat', 'Braided flowering vine ropes', 'Glowing golden leaf accents'],
      lockedDesignAttributes: 'Wooden swing with flowering vines and glowing golden leaf accents',
      generationPrompt: `Prop reference for magical enchanted jungle swing suspended by flowering vines with gentle fairy glow, ${style}, 8k --ar ${aspect}`,
      usageScenes: [1, 2, 3, 4, 5],
      status: 'REFERENCE_READY',
      referenceImageStatus: 'READY',
    });
  }

  // 1. Compass / Rahasyamayi Compass
  if (/compass|diksikshak|jadui compass/i.test(storyCombined)) {
    props.push({
      id: 'PROP_001_COMPASS',
      displayName: 'Rahasyamayi Compass (Mysterious Compass)',
      type: 'special_object',
      description: `Ancient handheld mystical brass compass with crystalline glass lens and a glowing cyan needle that points towards hidden secrets in ${style}.`,
      appearance: `Intricately etched antique brass and gold compass with crystalline glass face, glowing cyan magnetic needle, and ancient star runes etched into the bezel in ${style}.`,
      shape: 'Circular handheld brass dial with domed crystal lens (8cm diameter)',
      materials: 'Polished antique brass, celestial cyan luminescent needle, crystalline glass lens',
      colors: 'Antique Brass Gold, Glowing Cyan, Deep Bronze',
      designDetails: 'Ancient star constellations and navigational runes etched around bezel with magnetic aura',
      scale: 'Handheld (8cm diameter)',
      usage: 'Guides characters toward ancient hidden landmarks and secret cave paths',
      style,
      lockedAttributes: ['Antique brass casing with star runes', 'Glowing cyan directional needle', 'Crystalline glass lens'],
      lockedDesignAttributes: 'Antique brass body with cyan glowing star needle',
      generationPrompt: `Prop concept design for ancient mysterious compass with glowing cyan needle and celestial runes, ${style}, 8k --ar ${aspect}`,
      usageScenes: [2],
      status: 'REFERENCE_READY',
      referenceImageStatus: 'READY',
    });
  }

  // 2. Map / Purana Khazana Ka Naksha / Treasure Map
  if (/naksha|map|parchment map|treasure map|khazana/i.test(storyCombined)) {
    props.push({
      id: 'PROP_002_TREASURE_MAP',
      displayName: 'Purana Khazana Ka Naksha (Treasure Map)',
      type: 'prop',
      description: `Weathered, aged cotton parchment map detailing secret trails, underground cave cross-sections, and hidden treasure markers in ${style}.`,
      appearance: `Aged golden parchment map with hand-drawn cartography in sepia ink, compass rose, and crimson trail markings illustrating hidden cave passages in ${style}.`,
      shape: 'Rolled and unfolded weathered parchment sheet (30cm x 45cm)',
      materials: 'Handmade aged cotton parchment paper, sepia ink, crimson pigment',
      colors: 'Aged Ochre, Charcoal Sepia, Crimson Trail Lines',
      scale: 'Standard hand scroll (30cm x 45cm)',
      usage: 'Reveals secret paths, hidden doors, and ancient landmarks inside the cave',
      style,
      lockedAttributes: ['Weathered frayed parchment edges', 'Crimson dotted route lines', 'Hand-drawn cave cross-sections'],
      lockedDesignAttributes: 'Aged parchment edges with crimson route lines and sepia cave markings',
      generationPrompt: `Prop reference for ancient explorer treasure map on aged parchment with crimson route markings, ${style}, 8k --ar ${aspect}`,
      usageScenes: [3, 4],
      status: 'REFERENCE_READY',
      referenceImageStatus: 'READY',
    });
  }

  // 3. Torch / Mashal
  if (/torch|mashal|flashlight|lantern|diya/i.test(storyCombined)) {
    props.push({
      id: 'PROP_003_TORCH',
      displayName: 'Adventure Torch / Mashal',
      type: 'prop',
      description: `Heavy-duty explorer brass torch casting a bright warm golden-amber beam in ${style}.`,
      appearance: `Rugged cylindrical brass exploration torch with knurled cross-hatch grip, reinforced copper bezel, and a powerful warm golden luminescent light emitter in ${style}.`,
      shape: 'Cylindrical handheld explorer torch (18cm length)',
      materials: 'Machined brushed brass, knurled grip, tempered glass lens, high-intensity warm emitter',
      colors: 'Brushed Brass, Copper Accents, Warm Amber Light Beam',
      scale: 'Handheld (18cm length)',
      usage: 'Illuminates dark subterranean caverns and highlights hidden wall inscriptions',
      style,
      lockedAttributes: ['Brushed brass body with knurled grip', 'Copper lens bezel', 'Warm golden-amber light beam'],
      lockedDesignAttributes: 'Brass exploration torch with knurled grip and warm golden beam',
      generationPrompt: `Prop reference for rugged brass exploration torch casting warm golden beam, ${style}, 8k --ar ${aspect}`,
      usageScenes: [3, 4],
      status: 'REFERENCE_READY',
      referenceImageStatus: 'READY',
    });
  }

  // 4. Bansuri / Divine Flute
  if (/bansuri|flute|murali/i.test(storyCombined)) {
    props.push({
      id: 'PROP_004_BANSURI',
      displayName: 'Bansuri (Divine Bamboo Flute)',
      type: 'special_object',
      description: `Polished golden-amber bamboo flute with silk tassel in ${style}.`,
      appearance: `Divine bamboo flute with peacock silk tassel and delicate golden carvings in ${style}.`,
      shape: 'Slender transverse bamboo flute',
      materials: 'Aged golden bamboo, silk thread, brass fittings',
      colors: 'Warm Golden Amber, Peacock Blue Silk',
      scale: 'Handheld (35cm length)',
      usage: 'Played by Krishna to charm woodland creatures',
      style,
      lockedAttributes: ['Polished golden bamboo finish', 'Peacock blue silk tassel'],
      generationPrompt: `Prop reference for divine bamboo flute with peacock tassel, ${style}, 8k --ar ${aspect}`,
      usageScenes: [1, 2, 3, 4, 5],
      status: 'REFERENCE_READY',
      referenceImageStatus: 'READY',
    });
  }

  // 5. Hala / Ceremonial Plough
  if (/hala|plough/i.test(storyCombined)) {
    props.push({
      id: 'PROP_005_CEREMONIAL_HALA',
      displayName: 'Ceremonial Hala (Plough)',
      type: 'special_object',
      description: `Sacred warrior plough with carved timber handle and golden accents in ${style}.`,
      appearance: `Ceremonial polished wooden hala with engraved gold fittings and silver blade in ${style}.`,
      shape: 'Curved ceremonial warrior plough',
      materials: 'Polished teakwood, engraved gold, tempered steel',
      colors: 'Dark Teak, Polished Gold, Silver Blade',
      scale: 'Full staff scale (1.2m length)',
      usage: 'Carried by Balram as emblem of strength and agriculture',
      style,
      lockedAttributes: ['Carved timber shaft', 'Engraved gold fittings'],
      generationPrompt: `Prop reference for sacred warrior plough hala, ${style}, 8k --ar ${aspect}`,
      usageScenes: [1, 2, 3, 4, 5],
      status: 'REFERENCE_READY',
      referenceImageStatus: 'READY',
    });
  }

  // Default fallback prop if no specific prop matched
  if (props.length === 0) {
    props.push({
      id: 'PROP_001_KEY_ARTIFACT',
      displayName: 'Key Narrative Artifact',
      type: 'special_object',
      description: `Central artifact or device driving the narrative in ${style}.`,
      appearance: `Intricately designed thematic artifact with glowing accents in ${style}.`,
      style,
      lockedAttributes: ['Consistent finish', 'Signature glowing emblem'],
      generationPrompt: `Prop reference for narrative artifact, ${style}, 8k --ar ${aspect}`,
      usageScenes: [1, 2, 3, 4, 5],
      status: 'REFERENCE_READY',
      referenceImageStatus: 'READY',
    });
  }

  // -------------------------------------------------------------
  // STORY-AWARE ENVIRONMENTS & LOCATIONS EXTRACTION
  // -------------------------------------------------------------

  const hasSwing = /jhoola|jhula|swing/i.test(storyCombined);
  const hasCave = /gufa|cave|cavern|surang/i.test(storyCombined);
  const hasJungleOrHill = /jungle|van|forest|woods|pahad|pahadi|hill|mountain/i.test(storyCombined);

  // 0. Compound Environment: Magical Swing & Enchanted Jungle (for Jhoola stories)
  if (hasSwing && (hasJungleOrHill || /jadui|magical/i.test(storyCombined))) {
    environments.push({
      id: 'ENV_001_ENCHANTED_JUNGLE_PATH',
      displayName: 'Enchanted Jungle Path (Jadui Jungle Ka Raasta)',
      type: 'environment',
      description: `Scenic sunlit jungle trail winding through towering ancient trees, glowing wildflowers, and lush tropical canopy in ${style}.`,
      appearance: `Cinematic view of an enchanted jungle path lined with ancient mossy roots, vibrant glowing flora, and shimmering golden sunbeams filtering through the forest canopy in ${style}.`,
      layout: 'Winding dirt and moss trail passing through dense jungle toward a sunlit clearing',
      majorVisualLandmarks: 'Ancient canopy trees, luminous wildflower trail, winding mossy forest path',
      lighting: 'Dappled golden morning sunlight filtering through dense jungle leaves',
      timeOfDay: 'Morning Golden Hour',
      colorPalette: ['Lush Jungle Green', 'Sunlit Amber Gold', 'Luminescent Emerald', 'Earth Brown'],
      groundOrBackgroundDetails: 'Wild tropical flora, soft moss, floating glowing spores',
      style,
      lockedAttributes: ['Towering ancient jungle canopy', 'Sunlit winding mossy path', 'Glowing wildflower borders'],
      generationPrompt: `Environment master concept for enchanted jungle path with dappled golden sunbeams, ${style}, 8k --ar ${aspect}`,
      usageScenes: [1],
      status: 'REFERENCE_READY',
      referenceImageStatus: 'READY',
    });

    environments.push({
      id: 'ENV_002_MAGICAL_SWING_CLEARING',
      displayName: 'Magical Swing Clearing (Jadui Jhoola Clearing)',
      type: 'environment',
      description: `Magical sun-drenched jungle clearing centered around a monumental ancient flowering tree holding the enchanted swing in ${style}.`,
      appearance: `Cinematic forest glade bathed in warm golden light beams, featuring a grand flowering tree with braided hanging vines suspending the magical wooden swing in ${style}.`,
      layout: 'Open circular jungle glade framed by lush flowering rainforest with the grand swing tree at center',
      majorVisualLandmarks: 'Grand flowering swing tree, braided glowing vine ropes, carpet of blooming blossoms',
      lighting: 'Brilliant volumetric golden light beams illuminating the central swing',
      timeOfDay: 'Bright Daylight',
      colorPalette: ['Emerald Green', 'Golden Sunlight', 'Blossom Pink', 'Warm Mahogany'],
      groundOrBackgroundDetails: 'Carpet of colorful fairy blossoms, dancing forest butterflies, lush grass',
      style,
      lockedAttributes: ['Grand ancient flowering swing tree', 'Braided glowing vine ropes', 'Sunlit floral glade'],
      generationPrompt: `Environment master concept for magical jungle clearing with ancient tree and swing, ${style}, 8k --ar ${aspect}`,
      usageScenes: [2, 3, 4],
      status: 'REFERENCE_READY',
      referenceImageStatus: 'READY',
    });
  } else if (hasCave && hasJungleOrHill) {
    environments.push({
      id: 'ENV_001_JUNGLE_HILL_CAVE_ENTRANCE',
      displayName: 'Jungle Hill Cave Entrance (Pahadi Gufa Entrance)',
      type: 'environment',
      description: `Scenic overgrown jungle hillside with a massive ancient stone cave entrance framed by hanging vines, mossy boulders, and golden morning sunlight in ${style}.`,
      appearance: `Cinematic exterior view of a lush green jungle hill with towering exotic trees, wild creeping ivy, ancient weathered stone archway forming the mouth of a dark mysterious cave, illuminated by golden morning sunlight in ${style}.`,
      layout: 'Ascending hillside dirt trail leading directly to a monumental dark rock cavern opening flanked by moss-covered stone boulders',
      majorVisualLandmarks: 'Overgrown cave mouth archway, ancient carved stone markers, massive jungle trees with hanging vines',
      lighting: 'Dappled morning sunlight filtering through jungle leaves, contrasting against the dark mystery of the cave entrance',
      timeOfDay: 'Morning Golden Hour',
      colorPalette: ['Lush Jungle Green', 'Ancient Stone Grey', 'Sunlit Gold', 'Deep Shadow Black'],
      groundOrBackgroundDetails: 'Wild tropical flora, ancient mossy stones, rolling green hillside mist',
      style,
      lockedAttributes: ['Massive ancient mossy stone cave archway', 'Hanging vines over cave mouth', 'Winding dirt path with wild jungle flora'],
      generationPrompt: `Environment master concept for ancient cave entrance on a lush jungle hill, ${style}, 8k --ar ${aspect}`,
      usageScenes: [1, 2],
      status: 'REFERENCE_READY',
      referenceImageStatus: 'READY',
    });

    environments.push({
      id: 'ENV_002_ANCIENT_CAVE_INTERIOR',
      displayName: 'Ancient Cave Interior (Purani Gufa Ka Andar)',
      type: 'environment',
      description: `Atmospheric subterranean cavern with towering rock stalactites, ancient wall engravings, glowing mineral veins, and secret hidden alcoves in ${style}.`,
      appearance: `Cinematic underground cavern chamber with dramatic vaulted stone ceilings, dripping stalactites, mysterious ancient carved pictographs on damp stone walls, illuminated by warm amber torchlight and faint bioluminescent blue crystal pools in ${style}.`,
      layout: 'Wide subterranean stone hall leading into a narrow hidden corridor behind an ancient carved rock slab',
      majorVisualLandmarks: 'Ancient carved stone wall with hidden passage seam, glowing crystal alcove, rough stone pedestals',
      lighting: 'Warm directional golden torchlight casting long dramatic shadows against deep indigo ambient cave darkness',
      timeOfDay: 'Subterranean Atmospheric Twilight',
      colorPalette: ['Deep Slate Indigo', 'Warm Torchlight Amber', 'Bioluminescent Cyan', 'Charcoal Rock'],
      groundOrBackgroundDetails: 'Shimmering mineral pools, ancient stone steps, dripping stalactites',
      style,
      lockedAttributes: ['Vaulted rock chamber with ancient wall inscriptions', 'Bioluminescent mineral pools', 'Narrow secret passageway fissure'],
      generationPrompt: `Environment master concept for ancient mysterious cavern interior with rock carvings and glowing crystals, ${style}, 8k --ar ${aspect}`,
      usageScenes: [3, 4],
      status: 'REFERENCE_READY',
      referenceImageStatus: 'READY',
    });
  } else {
    // Standard individual environments
    if (/pahadi|pahad|parvat|mountain|hill/i.test(storyCombined)) {
      environments.push({
        id: 'ENV_001_MOUNTAIN_SLOPE',
        displayName: 'Mystic Mountain / Pahadi',
        type: 'environment',
        description: `Lush, scenic mountain slope bathed in golden sunlight with winding trails and ancient stone markers in ${style}.`,
        appearance: `Expansive cinematic mountain vista with lush emerald slopes, towering rocky ridges, and golden morning sunlight in ${style}.`,
        layout: 'Ascending mountain hillside with winding cobblestone trail and cliffside vista',
        majorVisualLandmarks: 'Towering summit peak, ancient stone cairns, weathered boundary pillars',
        lighting: 'Cinematic sunbeams filtering through morning mountain mist',
        timeOfDay: 'Morning Golden Hour',
        colorPalette: ['Emerald Green', 'Golden Ochre', 'Slate Grey', 'Sky Blue'],
        groundOrBackgroundDetails: 'Wild alpine flowers, smooth mountain stones, distant rolling valleys',
        style,
        lockedAttributes: ['Rolling emerald mountain ridges', 'Ancient stone path markers'],
        generationPrompt: `Environment master concept for scenic mountain pahadi slopes, ${style}, 8k --ar ${aspect}`,
        usageScenes: [1, 2, 3, 4, 5],
        status: 'REFERENCE_READY',
        referenceImageStatus: 'READY',
      });
    }

    if (/gufa|cave|cavern|surang/i.test(storyCombined)) {
      environments.push({
        id: 'ENV_002_ANCIENT_CAVE_INTERIOR',
        displayName: 'Ancient Cave / Gufa',
        type: 'environment',
        description: `Atmospheric cavern with crystal formations, ancient wall carvings, and soft ambient glow in ${style}.`,
        appearance: `Mystical stone cavern interior with glowing bioluminescent crystals, ancient wall inscriptions, and dramatic shadows in ${style}.`,
        layout: 'Subterranean vaulted cavern chamber with natural rock archways',
        majorVisualLandmarks: 'Luminescent blue crystal cluster, ancient engraved temple pillar',
        lighting: 'Bioluminescent crystal glow and warm torchlight',
        timeOfDay: 'Dramatic Twilight',
        colorPalette: ['Bioluminescent Cyan', 'Deep Indigo', 'Warm Amber', 'Charcoal Rock'],
        groundOrBackgroundDetails: 'Shimmering mineral pools, ancient stone steps, dripping stalactites',
        style,
        lockedAttributes: ['Bioluminescent crystal walls', 'Ancient wall inscriptions'],
        generationPrompt: `Environment concept for glowing crystal cave cavern, ${style}, 8k --ar ${aspect}`,
        usageScenes: [3, 4],
        status: 'REFERENCE_READY',
        referenceImageStatus: 'READY',
      });
    }

    if (/van|jungle|forest|woods|vrindavan/i.test(storyCombined) && environments.length < 2) {
      environments.push({
        id: 'ENV_003_ENCHANTED_FOREST',
        displayName: 'Enchanted Forest / Van',
        type: 'environment',
        description: `Vibrant enchanted forest with towering ancient flowering trees, dappled sunlight, and lush floral clearings in ${style}.`,
        appearance: `Lush enchanted woodland with moss-covered paths, glowing flora, and shimmering light beams in ${style}.`,
        layout: 'Dense ancient forest canopy opening into a tranquil sunlit clearing',
        majorVisualLandmarks: 'Grand flowering Kadamba tree, sacred stone shrine, winding forest stream',
        lighting: 'Dappled golden sunlight filtering through lush green canopy',
        timeOfDay: 'Bright Daylight',
        colorPalette: ['Lush Forest Green', 'Sunlit Gold', 'Blossom Pink', 'Earth Ochre'],
        groundOrBackgroundDetails: 'Velvety moss carpets, scattered wild blossoms, playful forest deer',
        style,
        lockedAttributes: ['Ancient flowering canopy trees', 'Blooming floral carpets'],
        generationPrompt: `Environment concept for enchanted forest grove, ${style}, 8k --ar ${aspect}`,
        usageScenes: [1, 2, 3, 4, 5],
        status: 'REFERENCE_READY',
        referenceImageStatus: 'READY',
      });
    }

    if (/yamuna|ganga|kinare|kinara|riverbank|nadi|river|jheel|lake/i.test(storyCombined)) {
      environments.push({
        id: 'ENV_004_SACRED_RIVERBANK',
        displayName: 'Sacred Riverbank / Kinara',
        type: 'environment',
        description: `Serene sacred riverbank with gently flowing crystal-clear water, blooming lotus flowers, and smooth river stones in ${style}.`,
        appearance: `Idyllic riverside clearing with blooming pink lotuses, soft morning reflections, and gentle misty breeze in ${style}.`,
        layout: 'Gently sloping river shoreline with sandy ghats and water-lily pools',
        majorVisualLandmarks: 'Ancient banyan tree at water edge, stone ghat steps',
        lighting: 'Warm sunrise glow reflecting off water surface',
        timeOfDay: 'Dawn / Early Morning',
        colorPalette: ['River Turquoise', 'Sunrise Gold', 'Lotus Pink', 'Pebble Grey'],
        groundOrBackgroundDetails: 'Smooth river quartz, dancing water ripples, sacred basil pots',
        style,
        lockedAttributes: ['Rippling water reflections', 'Pink lotus blossoms along bank'],
        generationPrompt: `Environment concept for sacred peaceful riverbank with lotuses, ${style}, 8k --ar ${aspect}`,
        usageScenes: [1, 2, 3],
        status: 'REFERENCE_READY',
        referenceImageStatus: 'READY',
      });
    }

    if (/raaste|raasta|trail|path|marg/i.test(storyCombined) && environments.length < 2) {
      environments.push({
        id: 'ENV_005_SECRET_PATH',
        displayName: 'Secret Path / Chhupa Hua Raasta',
        type: 'environment',
        description: `Winding ancient stone trail leading into uncharted territory surrounded by wild flora in ${style}.`,
        appearance: `Ancient cobblestone trail flanked by wild flowering shrubs, leading towards distant peaks in ${style}.`,
        layout: 'Winding ridge trail curving around boulders towards the mountain horizon',
        majorVisualLandmarks: 'Carved guide markers, arching stone gateway',
        lighting: 'Warm directional sunlight',
        timeOfDay: 'Afternoon',
        colorPalette: ['Stone Grey', 'Wild Olive', 'Golden Sunlight', 'Cobalt Sky'],
        groundOrBackgroundDetails: 'Ancient flagstones, wild mountain herbs, distant clouds',
        style,
        lockedAttributes: ['Ancient cobblestone trail', 'Overhanging flowering branches'],
        generationPrompt: `Environment concept for scenic winding cobblestone trail, ${style}, 8k --ar ${aspect}`,
        usageScenes: [2, 3],
        status: 'REFERENCE_READY',
        referenceImageStatus: 'READY',
      });
    }
  }

  // Fallback defaults if no environments were detected
  if (environments.length === 0) {
    environments.push(
      {
        id: 'ENV_001_PRIMARY_SETTING',
        displayName: 'Primary Narrative Setting',
        type: 'environment',
        description: `Grand establishing environment for the narrative in ${style}.`,
        appearance: `Expansive cinematic world with rich atmospheric depth, volumetric lighting, and iconic visual landmarks in ${style}.`,
        lighting: 'Cinematic golden hour lighting with volumetric god rays',
        timeOfDay: 'Golden Hour',
        style,
        lockedAttributes: ['Signature architectural silhouette', 'Volumetric atmosphere'],
        generationPrompt: `Environment master concept for primary setting, ${style}, 8k --ar ${aspect}`,
        usageScenes: [1, 2, 3, 4, 5],
        status: 'REFERENCE_READY',
        referenceImageStatus: 'READY',
      },
      {
        id: 'ENV_002_INNER_SANCTUM',
        displayName: 'Focal Interior / Sanctum',
        type: 'environment',
        description: `Focal location where core story revelations occur in ${style}.`,
        appearance: `Atmospheric chamber or grove with glowing accents and dramatic details in ${style}.`,
        lighting: 'Bioluminescent ambient glow with soft golden rim lights',
        timeOfDay: 'Dramatic Twilight',
        style,
        lockedAttributes: ['Glowing central focus', 'Atmospheric particles'],
        generationPrompt: `Environment reference for focal setting, ${style}, 8k --ar ${aspect}`,
        usageScenes: [3, 4],
        status: 'REFERENCE_READY',
        referenceImageStatus: 'READY',
      }
    );
  } else if (environments.length === 1) {
    environments.push({
      id: 'ENV_002_INNER_SANCTUM',
      displayName: 'Focal Interior / Sanctum',
      type: 'environment',
      description: `Focal location where core story revelations occur in ${style}.`,
      appearance: `Atmospheric chamber or grove with glowing accents and dramatic details in ${style}.`,
      lighting: 'Bioluminescent ambient glow with soft golden rim lights',
      timeOfDay: 'Dramatic Twilight',
      style,
      lockedAttributes: ['Glowing central focus', 'Atmospheric particles'],
      generationPrompt: `Environment reference for focal setting, ${style}, 8k --ar ${aspect}`,
      usageScenes: [3, 4],
      status: 'REFERENCE_READY',
      referenceImageStatus: 'READY',
    });
  }

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

export function generateMusicLockUniversal(idea: string, settings: VideoSettings, fullStory?: string): ProjectMusicLock {
  const storyText = `${idea} ${fullStory || settings.fullStory || settings.storyText || ''}`.toLowerCase();
  const hasExplicitSong = /♪|♫|\blyrics?\b|\bsingalong\b|\brhyme song\b/i.test(storyText);
  
  if (hasExplicitSong) {
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
    singer: 'NONE (Purely instrumental background score - No singing or vocal performance)',
    vocalStyle: 'NONE (Instrumental only)',
    rhythm: 'Flowing 4/4 cinematic pulse with dynamic swells matching narrative beats',
    melodyIdentity: 'Heroic narrative orchestral motif supporting story progression',
  };
}

export function generateVoiceLockUniversal(idea: string, settings: VideoSettings, fullStory?: string): ProjectVoiceLock {
  const lang = settings.language || 'English';
  const storyText = `${idea} ${fullStory || settings.fullStory || settings.storyText || ''}`.toLowerCase();
  const hasExplicitSong = /♪|♫|\blyrics?\b|\bsingalong\b|\brhyme song\b/i.test(storyText);

  return {
    voiceId: 'VOICE_CINEMATIC_NARRATOR_01',
    ageImpression: '28-year-old articulate cinematic narrator',
    gender: 'Female / Neutral Warmth',
    tone: 'Warm, reassuring, charismatic, joyful, and emotionally engaged',
    pitch: 'Mezzo-soprano / mid-range warm resonance with dynamic acoustic range',
    accent: lang.toLowerCase().includes('hindi') ? 'Neutral Clear Indian English / Shuddh Hindi' : 'Standard Neutral Mid-Atlantic',
    pronunciation: 'Crystal-clear phonetic enunciation with playful expressive cadence',
    singingStyle: hasExplicitSong
      ? 'Melodic storytelling singalong cadence with precise rhythmic timing and warm smiling timbre'
      : 'NONE (No singing - Instrumental narrative score only)',
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
  const aspect = settings.aspectRatio || '9:16';
  const style = settings.visualStyle || '3D Cartoon';
  const lang = settings.language || 'English';

  // Ensure assets exist
  const assetPackage = extractAllAssetsUniversal(idea, settings, fullStory);
  const registeredChars = characters.length > 0 ? characters : assetPackage.characters;
  const registeredProps = propsList && propsList.length > 0 ? propsList : assetPackage.props;
  const registeredEnvs = environmentsList && environmentsList.length > 0 ? environmentsList : assetPackage.environments;

  const isHindiOrHinglish = ctx.isHindi || ctx.isHinglish;
  const isKidsOrRhyme =
    (settings.videoType || '').toLowerCase().includes('rhyme') &&
    (lang.toLowerCase().includes('english'));

  const effectiveStoryText = (fullStory || settings.fullStory || settings.storyText || settings.refinedStory || '').trim();

  // Split effectiveStoryText into sentences/beats for story-aware scene generation
  let rawBeats: string[] = [];
  if (effectiveStoryText) {
    const rawSentences = effectiveStoryText
      .split(/(?<=[.!?\n।|])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (rawSentences.length > 0) {
      if (rawSentences.length <= actualCount) {
        rawBeats = [...rawSentences];
        while (rawBeats.length < actualCount) {
          rawBeats.push(rawSentences[rawBeats.length % rawSentences.length]);
        }
      } else {
        for (let i = 0; i < actualCount; i++) {
          const startIdx = Math.floor((i * rawSentences.length) / actualCount);
          const endIdx = Math.floor(((i + 1) * rawSentences.length) / actualCount);
          rawBeats.push(rawSentences.slice(startIdx, Math.max(startIdx + 1, endIdx)).join(' '));
        }
      }
    }
  }

  const sceneDurations = calculateSceneDurationsUniversal(
    ctx.totalSec,
    actualCount,
    ctx.planningMode,
    ctx.sceneSec
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

    const beatText = rawBeats[i] || `Scene ${sceneNum} in ${idea}`;
    const beatTextLower = beatText.toLowerCase();

    // Determine Environment strictly from registered list based on narrative beat
    let envObj = registeredEnvs[0];
    if (registeredEnvs.length > 1) {
      if (/andar|inside|interior|chamber|khazana|naksha.*milti/i.test(beatTextLower) || i >= 2) {
        envObj = registeredEnvs.find((e) => e.id.includes('INTERIOR') || e.id.includes('CAVE_INTERIOR') || e.id.includes('SANCTUM')) || registeredEnvs[1] || registeredEnvs[0];
      } else {
        envObj = registeredEnvs.find((e) => e.id.includes('ENTRANCE') || e.id.includes('PRIMARY') || e.id.includes('MOUNTAIN')) || registeredEnvs[0];
      }
    }
    const envId = envObj?.id || 'ENV_001_PRIMARY_SETTING';
    const envDisplayName = envObj?.displayName || envObj?.description || envId;

    // STORY-AWARE CHARACTER ASSIGNMENT:
    // Identify which registered characters occur in this specific story beat
    let sceneCharIds: string[] = [];
    if (registeredChars.length > 0) {
      // If characters form a group or duo in story (e.g. Chiku & Meera), include all registered characters in the adventure
      if (registeredChars.length <= 2) {
        sceneCharIds = registeredChars.map((c) => c.id);
      } else {
        const presentInBeat = registeredChars.filter((c) => {
          const nameLower = (c.name || '').toLowerCase();
          const displayLower = (c.displayName || '').toLowerCase();
          const idLower = (c.id || '').toLowerCase();
          return (
            beatTextLower.includes(nameLower) ||
            (displayLower.length > 0 && beatTextLower.includes(displayLower)) ||
            (nameLower.length >= 3 && beatTextLower.includes(nameLower)) ||
            (idLower.length > 0 && beatTextLower.includes(idLower))
          );
        });

        if (presentInBeat.length > 0) {
          sceneCharIds = presentInBeat.map((c) => c.id);
        } else {
          sceneCharIds = previousSceneChars.length > 0
            ? [...previousSceneChars]
            : registeredChars.slice(0, Math.min(2, registeredChars.length)).map((c) => c.id);
        }
      }
    }

    // Determine Props for this scene strictly from registered list
    const scenePropIds: string[] = [];
    if (registeredProps.length > 0) {
      registeredProps.forEach((p) => {
        const propIdLower = (p.id || '').toLowerCase();
        const propNameLower = (p.displayName || '').toLowerCase();
        
        if (propIdLower.includes('jhoola') || propIdLower.includes('jhula') || propIdLower.includes('swing') || propNameLower.includes('jhoola') || propNameLower.includes('jhula') || propNameLower.includes('swing')) {
          if (/jhoola|jhula|swing|jhul/i.test(beatTextLower) || i >= 0) {
            if (!scenePropIds.includes(p.id)) scenePropIds.push(p.id);
          }
        }
        if (propIdLower.includes('compass') || propNameLower.includes('compass')) {
          if (/compass|diksikshak|jadui compass/i.test(beatTextLower) || i === 1) {
            if (!scenePropIds.includes(p.id)) scenePropIds.push(p.id);
          }
        }
        if (propIdLower.includes('map') || propIdLower.includes('naksha') || propNameLower.includes('naksha') || propNameLower.includes('map')) {
          if (/naksha|map|parchment|khazana|raasta dhoond/i.test(beatTextLower) || i >= 2) {
            if (!scenePropIds.includes(p.id)) scenePropIds.push(p.id);
          }
        }
        if (propIdLower.includes('torch') || propIdLower.includes('mashal') || propNameLower.includes('torch') || propNameLower.includes('mashal')) {
          if (/torch|mashal|flashlight|jalati|roshni/i.test(beatTextLower) || i >= 2) {
            if (!scenePropIds.includes(p.id)) scenePropIds.push(p.id);
          }
        }
        if (propIdLower.includes('bansuri') || propNameLower.includes('bansuri')) {
          if (/bansuri|flute|murali/i.test(beatTextLower)) {
            if (!scenePropIds.includes(p.id)) scenePropIds.push(p.id);
          }
        }
        if (propIdLower.includes('hala') || propNameLower.includes('hala')) {
          if (/hala|plough/i.test(beatTextLower)) {
            if (!scenePropIds.includes(p.id)) scenePropIds.push(p.id);
          }
        }
      });
    }

    // Continuity tracking
    const charactersContinuing = sceneCharIds.filter((id) => previousSceneChars.includes(id));
    const newCharactersIntroduced = sceneCharIds.filter((id) => !previousSceneChars.includes(id));
    const propsContinuing = scenePropIds.filter((id) => previousSceneProps.includes(id));
    const environmentContinuing = envId === previousEnvId;

    // Action narrative with NO SPAWNING RULES
    let startingAction = '';
    let finalAction = '';
    let actionDesc = '';

    const charNamesJoined = sceneCharIds.map((cid) => {
      const found = registeredChars.find((c) => c.id === cid || c.name === cid);
      return found?.name || cid;
    }).join(' and ');

    if (isFirst) {
      startingAction = `${charNamesJoined || 'The protagonist'} arrives at ${envDisplayName}.`;
      finalAction = `${charNamesJoined || 'The protagonist'} explores the scenic setting with wonder.`;
      actionDesc = beatText.length > 0
        ? `${beatText} Visualized in ${style} with rich volumetric lighting.`
        : `${startingAction} The morning light illuminates the path. ${finalAction}`;
    } else {
      if (newCharactersIntroduced.length > 0) {
        const newNames = newCharactersIntroduced.map((cid) => {
          const found = registeredChars.find((c) => c.id === cid || c.name === cid);
          return found?.name || cid;
        }).join(', ');
        startingAction = `Continuing smoothly from Scene ${sceneNum - 1}: ${newNames} is already positioned in ${envDisplayName} as the journey progresses.`;
      } else {
        startingAction = `Continuing smoothly from Scene ${sceneNum - 1}: ${charNamesJoined || 'The characters'} maintain their natural physical motion.`;
      }

      if (scenePropIds.length > 0) {
        startingAction += ` ${scenePropIds.join(' and ')} is active in the scene.`;
      }

      finalAction = `${charNamesJoined || 'The characters'} conclude the beat, moving steadily toward the next revelation.`;
      actionDesc = beatText.length > 0
        ? `${beatText} Visualized in ${style} with strict character and prop consistency.`
        : `${startingAction} Engaging sequence in ${envDisplayName}. ${finalAction}`;
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

    // Lyric lines (STRICT: ONLY if the active story explicitly contains song/rhyme lines marked with ♪ or ♫)
    const hasSongMarkers = /♪|♫|\blyrics?\b|\bsingalong\b/i.test(effectiveStoryText);
    const lyricLines: string[] = hasSongMarkers
      ? beatText.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('♪') || l.startsWith('♫'))
      : [];

    const sTitle = `Scene ${sceneNum}: ${envDisplayName}`;
    
    // Spoken dialogue: ONLY from active story/script quotes or explicit character colon attribution
    let dialogue = 'NONE';
    if (!ctx.isNoSpoken) {
      const quoteMatch = beatText.match(/["“«]([^"”»]+)["”»]|(?<!\w)'([^']+)'(?!\w)/);
      const colonMatch = beatText.match(/(?:^|\n|[.!?]\s*|\b)([A-Za-z\u0900-\u097F]+)\s*[:：]\s*["“«]?([^"”»\n]+)["”»]?/);

      if (quoteMatch || colonMatch) {
        const rawQuote = quoteMatch ? (quoteMatch[1] || quoteMatch[2]) : (colonMatch ? colonMatch[2] : '');
        const quote = (rawQuote || '').trim();
        let speakerHint = colonMatch ? colonMatch[1].trim() : '';

        if ((!speakerHint || /scene|note|time|act/i.test(speakerHint)) && quoteMatch && quoteMatch.index !== undefined) {
          const textBeforeQuote = beatText.slice(0, quoteMatch.index);
          const nameMatch = textBeforeQuote.match(/([A-Za-z\u0900-\u097F]+)\s*(?:[:：]|ne\s*kaha|said|bolta|bolti|asks|says)\s*$/i);
          if (nameMatch) {
            speakerHint = nameMatch[1].trim();
          }
        }

        // Match speaker against registered characters strictly
        let matchedChar = undefined;
        if (speakerHint && !/scene|note|time|act/i.test(speakerHint)) {
          matchedChar = registeredChars.find((c) => c.name.toLowerCase() === speakerHint.toLowerCase() || c.id.toLowerCase() === speakerHint.toLowerCase());
        }
        if (!matchedChar && quoteMatch && quoteMatch.index !== undefined) {
          const textBeforeQuote = beatText.slice(0, quoteMatch.index);
          let closestIndex = -1;
          registeredChars.forEach((rc) => {
            const idx = textBeforeQuote.toLowerCase().lastIndexOf(rc.name.toLowerCase());
            if (idx > closestIndex) {
              closestIndex = idx;
              matchedChar = rc;
            }
          });
        }
        if (!matchedChar && sceneCharIds.length > 0) {
          matchedChar = registeredChars.find((c) => c.id === sceneCharIds[0]);
        }

        if (matchedChar) {
          dialogue = `Speaker: ${matchedChar.id} (${matchedChar.name})\nDialogue: "${quote}"`;
        } else if (ctx.isNarratorOnly) {
          dialogue = `Speaker: Narrator\nNarration: "${quote}"`;
        } else {
          const fallbackSpeaker = registeredChars[0];
          dialogue = `Speaker: ${fallbackSpeaker ? `${fallbackSpeaker.id} (${fallbackSpeaker.name})` : 'Narrator'}\nDialogue: "${quote}"`;
        }
      }
      // If NO quote and NO colon attribution, dialogue remains 'NONE'!
      // NEVER invent dialogue, filler lyrics, or convert story narration into dialogue!
    }

    const sceneCharDescriptions = sceneCharIds.map((cid) => {
      const found = registeredChars.find((c) => c.id === cid || c.name === cid || c.displayName === cid);
      return found ? `${found.name} [${found.id}] (${found.visualAppearance || found.appearance || found.characterConsistencyLock})` : cid;
    }).join('; ');

    const charPromptPart = sceneCharIds.length > 0
      ? `Characters (Strictly ONE of each with locked identity): ${sceneCharDescriptions}.`
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
      dialogue,
      dialogueVoiceover: dialogue,
      spokenDialogueType: ctx.isNoSpoken ? 'none' : 'dialogue',
      spokenDialogue: dialogue,
      cameraAngleMotion: i % 2 === 0 ? 'Dynamic low-angle tracking shot moving forward along the path' : 'Close-up transitioning into smooth tracking shot with shallow depth of field',
      lightingMood: envObj?.lighting || 'Volumetric cinematic three-point lighting with soft rim rays',
      animationStyle: `${style} with natural physical inertia and secondary cloth/hair physics`,
      soundEffects: 'Diegetic environmental Foley and atmospheric audio cues',
      musicCue: `Thematic orchestral score phrase ${sceneNum} matching narrative discovery`,
      continuityNote: `Inherits visual state and positions from Scene ${sceneNum - 1}. No character or prop spawning.`,
      scenePurpose: `Advance story progression in Scene ${sceneNum}.`,
      aiVideoPrompt: `Cinematic ${aspect}, ${style}, "${sTitle}". Action: ${actionDesc}. Environment: ${envDisplayName}. ${charPromptPart} Props: ${scenePropIds.length > 0 ? scenePropIds.join(', ') : 'NONE'}. Spoken Dialogue: ${dialogue}. 8K render --ar ${aspect}`,
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
  voiceLock?: ProjectVoiceLock,
  fullStory?: string
): SceneVideoPrompt[] {
  const aspect = settings.aspectRatio || '9:16';
  const style = settings.visualStyle || '3D Cartoon';
  const ctx = analyzeStoryContext(idea, settings, fullStory);

  const effectiveStory = fullStory || settings.fullStory || settings.storyText || settings.refinedStory || '';
  const storyLower = `${idea} ${effectiveStory}`.toLowerCase();
  const hasExplicitSong = /♪|♫|\blyrics?\b|\bsingalong\b|\brhyme song\b/i.test(storyLower);

  const mLock = musicLock || generateMusicLockUniversal(idea, settings, effectiveStory);
  const vLock = voiceLock || generateVoiceLockUniversal(idea, settings, effectiveStory);

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
    const charConstraints = charIds
      .map((id) => {
        const found = charMap[id];
        const lock = found?.characterConsistencyLock || found?.appearance || found?.visualAppearance || id;
        return `- ${id}: ${lock}`;
      })
      .join('\n');

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
              return `- ${pid}: ${foundProp ? foundProp.appearance || foundProp.description : pid}`;
            })
            .join('\n')
        : 'NONE';

    // Dialogue and Speaker Lock
    const hasDialogue = Boolean(scene.dialogue && scene.dialogue !== 'NONE' && scene.dialogue !== 'NO SPOKEN DIALOGUE');
    const dialogueText: string = hasDialogue && scene.dialogue ? scene.dialogue : 'NONE';

    // Continuity
    const continuityInfo = scene.continuity;
    let continuityText = '';
    if (idx === 0) {
      continuityText = 'Opening establishing sequence. Characters are naturally positioned on their starting trail. No characters or props spawn.';
    } else {
      const continuing = continuityInfo?.charactersContinuing || [];
      const introduced = continuityInfo?.newCharactersIntroduced || [];

      const parts: string[] = [];
      if (continuing.length > 0) {
        parts.push(`Continuing smoothly from Scene ${idx}: Maintain exact registered ${continuing.join(', ')} with locked facial geometry, skin shader, and costume.`);
      }
      if (introduced.length > 0) {
        parts.push(`The newly introduced character ${introduced.join(', ')} is already visible in the environment before characters approach. STRICT: Do NOT make characters suddenly appear or spawn.`);
      }
      if (propIds.length > 0) {
        parts.push(`The prop ${propIds[0]} is already positioned naturally in the character's hand or environment. STRICT: Do NOT spawn props in mid-air.`);
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

    // Voice & Audio Lock
    let voiceAudioText = 'NONE';
    if (hasDialogue) {
      const speakerMatch = dialogueText.match(/Speaker:\s*([A-Za-z0-9_]+)(?:\s*\(([^)]+)\))?/i);
      if (speakerMatch) {
        const speakerIdRaw = speakerMatch[1];
        const speakerNameRaw = speakerMatch[2]?.trim();
        const speakerChar = characters.find(
          (c) => c.id === speakerIdRaw || (speakerNameRaw && c.name.toLowerCase() === speakerNameRaw.toLowerCase())
        );
        if (speakerChar) {
          const charVoiceLock = speakerChar.voice || speakerChar.voiceCharacteristics || `VOICE_${speakerChar.id}`;
          voiceAudioText = `Speaker ID: ${speakerChar.id} (${speakerChar.name})\nVoice Lock: ${charVoiceLock}\nDialogue: ${dialogueText}`;
        } else {
          voiceAudioText = `Dialogue: ${dialogueText}`;
        }
      } else {
        voiceAudioText = `Dialogue: ${dialogueText}`;
      }
    }

    // Animation & Camera
    const animationText = `${style} aesthetic with smooth 24fps motion blur, fluid cloth dynamics, and expressive character animation.`;
    const cameraText = `${scene.cameraAngleMotion}, 35mm anamorphic prime lens, vertical 9:16 composition, f/2.2 shallow depth of field.`;

    // Negative Prompts
    const negativeText = 'blurry, low resolution, distorted limbs, extra fingers, morphing face, inconsistent outfit, changing colors, character spawning from nowhere, prop popping into shot, text watermark, flicker, glitch';

    // End Continuity
    const endContinuityText = idx < scenes.length - 1
      ? `Characters complete their physical motion, smoothly transitioning into Scene ${promptNum + 1}.`
      : `Scene reaches natural story resolution with ${charIds.map(id => charMap[id]?.name || id).join(' and ')} completing the action: ${actionText}. Frame holds on the resolved narrative moment without sudden fade.`;

    // Construct Formatted Final Prompt
    const structured = {
      duration,
      aspectRatio: `${aspect} (Vertical Video)`,
      characters: charConstraints,
      environment: envPromptText,
      props: propsPromptText,
      dialogue: hasDialogue ? dialogueText : 'NONE',
      voiceAudio: hasDialogue ? voiceAudioText : 'NONE',
      lyrics: 'NONE',
      singing: 'NONE',
      narration: 'NONE',
      continuity: continuityText,
      action: actionText,
      characterConsistency: consistencyText,
      musicAndSinging: hasExplicitSong ? mLock.songStyle : 'NONE (Purely instrumental background score - No singing or vocal performance)',
      animation: animationText,
      camera: cameraText,
      negative: negativeText,
      endContinuity: endContinuityText,
    };

    const finalPrompt = `Prompt ${promptNum}:
DURATION: ${duration}
ASPECT RATIO: ${aspect} (Vertical Video)
CHARACTERS:
${charConstraints}
ENVIRONMENT:
${envPromptText}
PROPS:
${propsPromptText}
CONTINUITY:
${continuityText}
ACTION:
${actionText}
DIALOGUE & SPEAKER:
${hasDialogue ? dialogueText : 'NONE'}
CHARACTER CONSISTENCY:
${consistencyText}
AUDIO & SFX:
${scene.soundEffects || 'Diegetic environmental Foley and ambient atmospheric sounds'}
ANIMATION:
${animationText}
CAMERA:
${cameraText}
NEGATIVE:
${negativeText}
END CONTINUITY:
${endContinuityText}`;

    // Model Specific Prompts
    const cleanDialogue = hasDialogue ? dialogueText.replace(/\n/g, ' ') : 'NONE';
    const modelPrompts: ModelSpecificPrompts = {
      veo: `Google Veo Prompt ${promptNum}: ${style} video (${duration}), Aspect Ratio: ${aspect}. Action: ${actionText}. Environment: ${envPromptText}. Characters: ${charConstraints}. Props: ${propsPromptText}. Audio Dialogue: ${cleanDialogue}. Camera: ${cameraText}. --ar ${aspect}`,
      runway: `Runway Gen-3 Prompt ${promptNum}: [${cameraText}] [${actionText}] [${envPromptText}] Characters: ${charConstraints}. Props: ${propsPromptText}. Dialogue: ${cleanDialogue}. Duration: ${durSec}s, ${style} 8K render --ar ${aspect}`,
      kling: `Kling AI Prompt ${promptNum}: Master shot (${durSec}s | ${scene.timeRange}), ${style}, ${actionText} in ${envPromptText}. Characters: ${charConstraints}. Props: ${propsPromptText}. Dialogue: ${cleanDialogue}. Aspect ratio: ${aspect}. ${cameraText}`,
      luma: `Luma Dream Machine Prompt ${promptNum}: Smooth ${cameraText} (${durSec}s) capturing ${actionText}. Environment: ${envPromptText}. Characters: ${charConstraints}. Props: ${propsPromptText}. Dialogue: ${cleanDialogue}. Aspect ${aspect}.`,
      sora: `OpenAI Sora Prompt ${promptNum}: Hyper-detailed cinematic sequence (${durSec}s) in ${style} aspect ratio ${aspect}. In ${envPromptText}, ${actionText}. Characters: ${charConstraints}. Props: ${propsPromptText}. Spoken Dialogue: ${cleanDialogue}. Camera: ${cameraText}`,
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
      props: propsPromptText,
      action: actionText,
      facialExpressions: 'Emotionally expressive gaze matching discovery and narrative tension',
      bodyMovement: 'Natural kinetic physical blocking and steady walking motion',
      cameraShot: 'Medium Master Shot',
      cameraMovement: scene.cameraAngleMotion,
      lensFraming: '35mm anamorphic prime lens, vertical 9:16',
      lighting: scene.lightingMood,
      atmosphere: 'Volumetric light beams and luminous atmospheric particles',
      animationStyle: animationText,
      physicsMotion: 'Realistic cloth simulation and natural hair dynamics',
      dialogue: hasDialogue ? dialogueText : 'NONE',
      voiceAudio: hasDialogue ? voiceAudioText : 'NONE',
      soundEffects: scene.soundEffects || 'Diegetic environmental Foley',
      music: hasExplicitSong ? mLock.songStyle : 'Cinematic orchestral background score (Instrumental only - NO VOCALS, NO SINGING)',
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

      // Validate Dialogue Speaker and Name Consistency against Registered Profiles
      if (scene.dialogue && scene.dialogue !== 'NONE') {
        const speakerMatch = scene.dialogue.match(/Speaker:\s*([A-Za-z0-9_]+)(?:\s*\(([^)]+)\))?/i);
        if (speakerMatch) {
          const speakerId = speakerMatch[1];
          const speakerName = speakerMatch[2]?.trim();
          if (speakerId !== 'Narrator') {
            const registeredChar = charMap[speakerId];
            if (!registeredChar) {
              errors.push(`Scene ${scene.sceneNumber}: Speaker ID "${speakerId}" is not registered in character profiles.`);
            } else if (speakerName && registeredChar.name.toLowerCase() !== speakerName.toLowerCase()) {
              errors.push(`Scene ${scene.sceneNumber}: Identity mismatch! Speaker ID "${speakerId}" belongs to "${registeredChar.name}" but dialogue references speaker name "${speakerName}".`);
            }
          }
        }
      }

      // Hard Validation: Check against invented dialogue and lyrics from active story
      const effectiveStory = (project as any).fullStory || (project as any).story?.fullStory || (project as any).settings?.fullStory || (project as any).settings?.storyText || '';
      if (effectiveStory) {
        const hasStoryDialogue = /["“«][^"”»]+["”»]|(?<!\w)'[^']+'(?!\w)|(?:^|\n)\s*[A-Za-z\u0900-\u097F]+[:：]\s*["“]?/.test(effectiveStory);
        const hasStorySong = /♪|♫|\blyrics?\b|\bsingalong\b|\brhyme song\b/i.test(effectiveStory);

        if (!hasStoryDialogue && scene.dialogue && scene.dialogue !== 'NONE' && scene.dialogue !== 'NO SPOKEN DIALOGUE') {
          errors.push(`Scene ${scene.sceneNumber}: Invented dialogue detected! The active story contains no explicit dialogue, but scene has dialogue: "${scene.dialogue.slice(0, 40)}"`);
        }

        if (!hasStorySong && scene.lyricLines && scene.lyricLines.length > 0) {
          errors.push(`Scene ${scene.sceneNumber}: Invented lyrics detected! The active story contains no song or lyrics, but scene has lyric lines.`);
        }
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

  const musicLock = generateMusicLockUniversal(title, normalizedSettings, effectiveStory);
  const voiceLock = generateVoiceLockUniversal(title, normalizedSettings, effectiveStory);

  const concept = generateConceptUniversal(title, normalizedSettings, effectiveStory);
  const hook = generateHookUniversal(title, normalizedSettings, effectiveStory);
  const scenes = generateScenesUniversal(title, normalizedSettings, characters, effectiveStory, props, environments);
  const script = generateScriptUniversal(title, normalizedSettings, scenes, characters);
  const videoPrompts = generateVideoPromptsUniversal(title, normalizedSettings, scenes, characters, props, environments, musicLock, voiceLock, effectiveStory);
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
