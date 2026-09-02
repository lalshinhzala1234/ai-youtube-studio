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
  if (storyNarrative.includes('चीकू') || /\bchikus?\b/i.test(storyNarrative)) {
    addEntity('Chiku', 'Lead Child Protagonist & Explorer', 'Human Child', 'Human Child', '7 years old', 'Boy');
  }
  if (storyNarrative.includes('मीरा') || /\bmeeras?\b|\bmiras?\b/i.test(storyNarrative)) {
    addEntity('Meera', 'Companion & Co-Explorer', 'Human Child', 'Human Child', '7 years old', 'Girl');
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
    const lowerName = name.toLowerCase();

    let id = toStableId(`CHAR_${String(entityIndex).padStart(3, '0')}`, name);
    let displayName = `${name}`;
    let role = entity.roleHint || (entityIndex === 1 ? 'Lead Protagonist' : 'Supporting Companion');
    let characterType = entity.typeHint || 'Human';
    let species = entity.speciesHint || 'Human';
    let age = entity.ageHint || '24 years old';
    let ageCategory = 'Young Adult';
    let gender = entity.genderHint || 'Unspecified';
    let appearance = `${name} with distinctive features rendered in ${style} aesthetic.`;
    let visualAppearance = `${name} in ${style}`;
    let face = 'Expressive eyes, warm facial symmetry, natural confident gaze.';
    let hair = 'Neatly styled hair framing face with realistic physics.';
    let skin = 'Natural radiant tone with volumetric lighting.';
    let body = 'Well-proportioned silhouette suited for animation.';
    let clothing = `Signature tailored outfit in ${style}.`;
    let clothingOutfit = clothing;
    let accessories = 'Signature item and explorer gear.';
    let signatureItem = accessories;
    let personality = 'Brave, curious, loyal, and emotionally expressive.';
    let personalityTraits = ['Curious', 'Brave', 'Kind', 'Loyal'];
    let expressions = 'Warm reassuring smile, wide-eyed wonder, determined focus.';
    let voice = `Clear articulate vocal enunciation in ${lang}.`;
    let voiceStyle = `Warm and engaging delivery in ${lang}.`;
    let speakingStyle = 'Natural, melodic cadence.';
    let characterPurpose = 'Drive narrative momentum, visual continuity, and emotional connection.';
    let lockedAttributes: string[] = ['Signature Outfit', 'Facial Geometry', 'Hairstyle / Fur'];

    // ARCHETYPE PROFILE ENRICHMENTS
    if (lowerName === 'radha') {
      id = toStableId(`CHAR_${String(entityIndex).padStart(3, '0')}`, 'Radha');
      displayName = 'Radha (Divine Heroine)';
      role = 'Lead Protagonist';
      characterType = 'Deity / Protagonist';
      species = 'Divine / Human';
      age = '16 years old';
      ageCategory = 'Young Adult';
      gender = 'Female';
      appearance = `Radiant youthful maiden Radha with lotus-petal hazel eyes, glowing fair golden complexion, long cascading dark braid with fresh jasmine blossoms, wearing a vibrant turquoise and magenta lehenga with delicate golden embroidery and silver payal in ${style}.`;
      visualAppearance = `Radha in turquoise and magenta lehenga with jasmine garland in ${style}`;
      face = 'Lotus-petal hazel eyes with gentle kajal, sweet compassionate smile, delicate bindi.';
      hair = 'Long lustrous dark-brown hair braided with fragrant white jasmine flowers.';
      skin = 'Luminous fair golden complexion with warm heavenly glow.';
      clothing = 'Vibrant turquoise choli and flowing magenta lehenga adorned with fine golden gota patti border, diaphanous dupatta.';
      clothingOutfit = clothing;
      accessories = 'Silver payal anklets, pearl necklace, delicate floral ear ornaments.';
      signatureItem = accessories;
      personality = 'Devoted, graceful, compassionate, radiant, and inspiring.';
      personalityTraits = ['Graceful', 'Devoted', 'Compassionate', 'Joyful'];
      voice = `Sweet, melodic, and serene voice in ${lang}.`;
      lockedAttributes = ['Turquoise and magenta lehenga', 'Jasmine garland in dark braid', 'Lotus eyes and golden embroidery'];
    } else if (lowerName === 'krishna' || lowerName === 'kanha') {
      id = toStableId(`CHAR_${String(entityIndex).padStart(3, '0')}`, 'Krishna');
      displayName = 'Krishna (Divine Hero)';
      role = 'Lead Protagonist';
      characterType = 'Deity / Protagonist';
      species = 'Divine / Human';
      age = '16 years old';
      ageCategory = 'Young Adult';
      gender = 'Male';
      appearance = `Enchanting youthful prince Krishna with soft dark blue-cloud (Shyam) complexion, sparkling almond eyes full of gentle mischief, wearing a golden pitambar dhoti, ornate golden crown with a majestic peacock feather (mor pankh), and holding a polished bamboo flute (bansuri) in ${style}.`;
      visualAppearance = `Krishna with blue-cloud complexion, peacock feather crown, and bamboo flute in ${style}`;
      face = 'Mesmerizing almond eyes, playful benevolent smile, tilak on forehead.';
      hair = 'Soft dark curly locks framing the forehead under golden headpiece.';
      skin = 'Radiant soft cloud-blue (Shyamavarna) skin tone with celestial volumetric rim light.';
      clothing = 'Gleaming yellow-gold silk pitambar dhoti with embroidered red waistband.';
      clothingOutfit = clothing;
      accessories = 'Peacock feather (mor pankh) in golden crown, polished bamboo flute (bansuri), vanamala garland.';
      signatureItem = 'Polished bamboo flute (bansuri)';
      personality = 'Playful, wise, benevolent, charming, and courageous.';
      personalityTraits = ['Playful', 'Wise', 'Charming', 'Benevolent'];
      voice = `Warm, soothing, and charismatic voice in ${lang}.`;
      lockedAttributes = ['Cloud-blue Shyam skin', 'Peacock feather in crown', 'Yellow silk pitambar', 'Bamboo flute'];
    } else if (lowerName === 'balram' || lowerName === 'balaram') {
      id = toStableId(`CHAR_${String(entityIndex).padStart(3, '0')}`, 'Balram');
      displayName = 'Balram (Mighty Guardian)';
      role = 'Elder Brother & Guardian';
      characterType = 'Deity / Guardian';
      species = 'Divine / Human';
      age = '18 years old';
      ageCategory = 'Young Adult';
      gender = 'Male';
      appearance = `Stalwart, noble elder brother Balram with luminous fair-sand complexion, powerful athletic physique, wearing a deep indigo blue dhoti with golden borders, single diamond earring (kundal), and carrying a ceremonial wooden plough (hala) in ${style}.`;
      visualAppearance = `Balram with fair complexion, indigo blue dhoti, and ceremonial hala in ${style}`;
      face = 'Strong noble jawline, protective steady eyes, reassuring smile.';
      hair = 'Thick dark wavy hair tied in a warrior knot with golden clip.';
      skin = 'Fair radiant complexion with warm bronze highlights.';
      clothing = 'Deep royal indigo silk dhoti with golden embroidery, royal silk sash.';
      clothingOutfit = clothing;
      accessories = 'Single golden kundal earring, ornate armlets, ceremonial wooden hala.';
      signatureItem = 'Ceremonial wooden plough (hala)';
      personality = 'Protective, righteous, strong, loyal, and dependable.';
      personalityTraits = ['Protective', 'Righteous', 'Strong', 'Loyal'];
      voice = `Deep, resonant, and reassuring voice in ${lang}.`;
      lockedAttributes = ['Indigo silk dhoti', 'Fair complexion with warrior knot', 'Ceremonial hala'];
    } else if (lowerName === 'chiku') {
      id = toStableId(`CHAR_${String(entityIndex).padStart(3, '0')}`, 'Chiku');
      displayName = 'Chiku (Lead Child Protagonist)';
      role = 'Lead Protagonist & Guide';
      characterType = 'Human Child';
      species = 'Human Child';
      age = '7 years old';
      ageCategory = 'Child';
      gender = 'Boy';
      appearance = `Energetic, charming 7yo child Chiku in blue denim overalls with vibrant yellow hooded shirt, bright red sneakers, joyful sparkling hazel eyes, and playful tousled brown hair in ${style}.`;
      visualAppearance = `7yo Chiku in blue overalls, yellow hoodie, red sneakers in ${style}`;
      face = 'Bright sparkling hazel eyes, rosy cheeks, enthusiastic welcoming smile.';
      hair = 'Playful tousled warm-brown hair.';
      skin = 'Warm radiant child skin tone.';
      clothing = 'Blue denim overalls with brass buttons over a bright yellow hoodie, red canvas sneakers.';
      clothingOutfit = clothing;
      accessories = 'Magic Alphabet Explorer Badge pinned to overalls.';
      signatureItem = 'Magic Explorer Badge';
      personality = 'Curious, fearless, joyful, welcoming, and expressive.';
      personalityTraits = ['Curious', 'Joyful', 'Adventurous', 'Caring'];
      voice = `Clear, joyful child enunciation in ${lang}.`;
      lockedAttributes = ['Blue denim overalls', 'Yellow hoodie', 'Red sneakers', 'Tousled brown hair'];
    } else if (lowerName === 'meera' || lowerName === 'mira') {
      id = toStableId(`CHAR_${String(entityIndex).padStart(3, '0')}`, 'Meera');
      displayName = 'Meera (Explorer Companion)';
      role = 'Companion & Co-Explorer';
      characterType = 'Human Child';
      species = 'Human Child';
      age = '7 years old';
      ageCategory = 'Child';
      gender = 'Girl';
      appearance = `Curious, cheerful 7yo girl Meera with glossy dark hair in two sweet braids with bright red ribbons, sparkling expressive brown eyes, wearing a turquoise tunic over coral leggings and yellow sneakers in ${style}.`;
      visualAppearance = `7yo Meera in turquoise tunic, coral leggings, twin braids with red ribbons in ${style}`;
      face = 'Sparkling dark brown eyes, bright cheerful dimpled smile, attentive lively expression.';
      hair = 'Glossy dark hair styled into twin braids with bright red ribbons.';
      skin = 'Warm radiant child skin tone.';
      clothing = 'Turquoise adventure tunic with delicate yellow stitching, coral leggings, yellow sneakers.';
      clothingOutfit = clothing;
      accessories = 'Small explorer satchel with notepad.';
      signatureItem = 'Explorer satchel';
      personality = 'Observant, smart, enthusiastic, loyal, and thoughtful.';
      personalityTraits = ['Observant', 'Smart', 'Enthusiastic', 'Loyal'];
      voice = `Sweet, clear, expressive child voice in ${lang}.`;
      lockedAttributes = ['Twin braids with red ribbons', 'Turquoise tunic', 'Coral leggings', 'Yellow sneakers'];
    } else if (lowerName === 'ravi') {
      id = toStableId(`CHAR_${String(entityIndex).padStart(3, '0')}`, 'Ravi');
      displayName = 'Ravi (Lead Explorer)';
      role = 'Lead Protagonist';
      characterType = 'Human Explorer';
      species = 'Human';
      age = '14 years old';
      ageCategory = 'Teen';
      gender = 'Male';
      appearance = `Adventurous and courageous 14yo explorer Ravi with dark wavy hair, warm brown eyes, wearing a burnt-orange hooded adventure jacket over khaki trousers and sturdy hiking boots in ${style}.`;
      visualAppearance = `14yo Ravi in burnt-orange jacket and hiking boots in ${style}`;
      face = 'Determined, warm brown eyes, confident smile, athletic features.';
      hair = 'Dark wavy hair cut short and practical for exploration.';
      skin = 'Warm sun-kissed Indian skin tone.';
      clothing = 'Burnt-orange hooded adventure jacket, khaki cargo trousers, sturdy leather trail boots.';
      clothingOutfit = clothing;
      accessories = 'Brass map compass and durable canvas backpack.';
      signatureItem = 'Brass map compass';
      personality = 'Courageous, resourceful, loyal, and quick-thinking.';
      personalityTraits = ['Courageous', 'Resourceful', 'Loyal', 'Kind'];
      voice = `Clear, confident teen voice in ${lang}.`;
      lockedAttributes = ['Burnt-orange adventure jacket', 'Dark wavy hair', 'Brass compass'];
    } else if (lowerName === 'neha') {
      id = toStableId(`CHAR_${String(entityIndex).padStart(3, '0')}`, 'Neha');
      displayName = 'Neha (Explorer Companion)';
      role = 'Companion & Researcher';
      characterType = 'Human Specialist';
      species = 'Human';
      age = '13 years old';
      ageCategory = 'Teen';
      gender = 'Female';
      appearance = `Curious and quick-witted 13yo researcher Neha with dark hair tied in a sleek ponytail, hazel eyes, wearing a turquoise windbreaker over denim jeans and teal sneakers in ${style}.`;
      visualAppearance = `13yo Neha in turquoise windbreaker and ponytail in ${style}`;
      face = 'Bright intelligent hazel eyes, animated expressions, warm smile.';
      hair = 'Glossy dark hair gathered in a high ponytail with a teal band.';
      skin = 'Radiant warm skin tone.';
      clothing = 'Turquoise weather-proof windbreaker, dark denim jeans, teal sneakers.';
      clothingOutfit = clothing;
      accessories = 'Field research tablet and magnifying loupe.';
      signatureItem = 'Field research tablet';
      personality = 'Analytical, observant, empathetic, and fearless.';
      personalityTraits = ['Analytical', 'Observant', 'Empathetic', 'Fearless'];
      voice = `Bright, expressive teen voice in ${lang}.`;
      lockedAttributes = ['Turquoise windbreaker', 'High dark ponytail', 'Field tablet'];
    } else if (lowerName === 'raj') {
      id = toStableId(`CHAR_${String(entityIndex).padStart(3, '0')}`, 'Raj');
      displayName = 'Raj (Lead Detective)';
      role = 'Lead Detective';
      characterType = 'Human Detective';
      species = 'Human';
      age = '35 years old';
      ageCategory = 'Adult';
      gender = 'Male';
      appearance = `Sharp, observant 35yo lead detective Raj with tailored charcoal trench coat over pressed navy suit, keen dark eyes, and classic leather dress shoes in ${style}.`;
      visualAppearance = `35yo Detective Raj in charcoal trench coat in ${style}`;
      face = 'Sharp jawline, focused dark eyes, slight five o clock shadow, astute expression.';
      hair = 'Short neatly parted dark hair with subtle grey temples.';
      skin = 'Olive-toned clear complexion.';
      clothing = 'Tailored charcoal wool trench coat, navy suit vest, white dress shirt, leather shoes.';
      clothingOutfit = clothing;
      accessories = 'Silver fountain pen, leather case notebook, gold pocket watch.';
      signatureItem = 'Leather case notebook';
      personality = 'Astute, methodical, calm, and protective.';
      personalityTraits = ['Astute', 'Methodical', 'Calm', 'Protective'];
      voice = `Deep, measured, and authoritative voice in ${lang}.`;
      lockedAttributes = ['Charcoal wool trench coat', 'Navy suit vest', 'Leather case notebook'];
    } else if (lowerName === 'ananya') {
      id = toStableId(`CHAR_${String(entityIndex).padStart(3, '0')}`, 'Ananya');
      displayName = 'Ananya (Detective Partner)';
      role = 'Detective Partner';
      characterType = 'Human Detective';
      species = 'Human';
      age = '28 years old';
      ageCategory = 'Adult';
      gender = 'Female';
      appearance = `Brilliant 28yo investigative detective Ananya with burgundy tailored blazer over black turtleneck, dark tailored trousers, sharp hazel eyes, and sleek chin-length bob in ${style}.`;
      visualAppearance = `28yo Detective Ananya in burgundy blazer in ${style}`;
      face = 'Keen hazel eyes, thoughtful analytical gaze, calm confident poise.';
      hair = 'Sleek chin-length dark-brown bob with clean side part.';
      skin = 'Warm golden skin tone.';
      clothing = 'Burgundy structured blazer, fine black knit turtleneck, dark tailored trousers, ankle boots.';
      clothingOutfit = clothing;
      accessories = 'Digital audio recorder and high-resolution forensic scanner.';
      signatureItem = 'Forensic scanner';
      personality = 'Brilliant, forensic-minded, decisive, and loyal.';
      personalityTraits = ['Brilliant', 'Decisive', 'Forensic', 'Loyal'];
      voice = `Crisp, articulate, and insightful voice in ${lang}.`;
      lockedAttributes = ['Burgundy structured blazer', 'Black turtleneck', 'Sleek bob haircut'];
    } else if (lowerName === 'mohan') {
      id = toStableId(`CHAR_${String(entityIndex).padStart(3, '0')}`, 'Mohan');
      displayName = 'Mohan (Talking Fox)';
      role = 'Mystical Guide & Talking Fox';
      characterType = 'Animal (Fox)';
      species = 'Fox';
      age = 'Adult Fox';
      ageCategory = 'Adult';
      gender = 'Male';
      appearance = `Clever, articulate talking red fox with lush russet fur, bushy white-tipped tail, intelligent amber eyes, wearing a miniature mustard tweed vest and brass spectacles in ${style}.`;
      visualAppearance = `Talking fox Mohan with russet coat, tweed vest, and brass spectacles in ${style}`;
      face = 'Expressive fox muzzle, twitching whiskers, wise twinkling amber eyes.';
      hair = 'Plush russet-orange fur with white bib and black ear tips.';
      skin = 'Dense clean fox coat.';
      clothing = 'Miniature mustard tweed waistcoat with brass buttons.';
      clothingOutfit = clothing;
      accessories = 'Brass half-moon reading spectacles and ancient rolled scroll.';
      signatureItem = 'Brass reading spectacles';
      personality = 'Clever, witty, articulate, mystical, and loyal.';
      personalityTraits = ['Clever', 'Witty', 'Articulate', 'Mystical'];
      voice = `Articulate, whimsical, and cultured voice in ${lang}.`;
      lockedAttributes = ['Russet coat with white-tipped tail', 'Mustard tweed vest', 'Brass spectacles'];
    } else if (lowerName === 'bunny') {
      id = toStableId(`CHAR_${String(entityIndex).padStart(3, '0')}`, 'Bunny');
      displayName = 'Bunny (Animal Companion)';
      role = 'Animal Companion & Guide';
      characterType = 'Animal (Rabbit)';
      species = 'Rabbit';
      age = 'Young Bunny';
      ageCategory = 'Child';
      gender = 'Unspecified';
      appearance = `Adorably fluffy snowy-white bunny with tall perky pink-lined ears, round button nose, big glossy dark eyes, wearing a tiny teal satin bow tie in ${style}.`;
      visualAppearance = `Fluffy white bunny with pink-lined ears and teal bow tie in ${style}`;
      face = 'Cheery whiskers, twitching pink nose, glossy curious eyes.';
      hair = 'Plush cloud-soft white fur with micro-fiber groom rendering.';
      clothing = 'Tiny teal satin bow tie around neck.';
      clothingOutfit = clothing;
      accessories = 'Teal satin bow tie and small wicker basket of strawberries.';
      signatureItem = 'Teal satin bow tie';
      personality = 'Playful, bouncy, affectionate, and cheerful.';
      personalityTraits = ['Playful', 'Bouncy', 'Affectionate'];
      lockedAttributes = ['Snow white fluffy fur', 'Pink inner ears', 'Teal satin bow tie'];
    } else if (lowerName === 'baby bear') {
      id = toStableId(`CHAR_${String(entityIndex).padStart(3, '0')}`, 'Baby_Bear');
      displayName = 'Baby Bear (Animal Companion)';
      role = 'Animal Companion';
      characterType = 'Animal (Bear Cub)';
      species = 'Bear Cub';
      age = 'Baby Bear Cub';
      ageCategory = 'Child';
      gender = 'Male';
      appearance = `Plush honey-caramel brown baby bear cub with round ears, honey-colored muzzle, soft button nose, wearing a cozy red-and-white knitted scarf in ${style}.`;
      visualAppearance = `Caramel baby bear with striped scarf in ${style}`;
      face = 'Warm teddy-bear smile, twinkling dark eyes, soft velvet nose.';
      hair = 'Dense velvety caramel-brown fur.';
      clothing = 'Red-and-white striped woolen knit scarf.';
      clothingOutfit = clothing;
      accessories = 'Red-and-white striped scarf and miniature wooden honey spoon.';
      signatureItem = 'Red-and-white striped scarf';
      personality = 'Gentle, cuddly, loyal, and friendly.';
      personalityTraits = ['Gentle', 'Cuddly', 'Loyal'];
      lockedAttributes = ['Caramel brown fur', 'Red-and-white striped scarf'];
    } else if (lowerName === 'baby elephant') {
      id = toStableId(`CHAR_${String(entityIndex).padStart(3, '0')}`, 'Baby_Elephant');
      displayName = 'Baby Elephant (Animal Companion)';
      role = 'Animal Companion';
      characterType = 'Animal (Elephant)';
      species = 'Asian Elephant';
      age = 'Baby Elephant';
      ageCategory = 'Child';
      gender = 'Unspecified';
      appearance = `Charming pastel sky-blue baby elephant with oversized gentle floppy ears with pink inner shading, friendly curved trunk, and shiny golden ankle bangles in ${style}.`;
      visualAppearance = `Sky-blue baby elephant with pink inner ears in ${style}`;
      clothing = 'Tiny yellow saddle cloth with rainbow embroidered border.';
      clothingOutfit = clothing;
      accessories = 'Yellow embroidered saddle cloth and golden ankle bangles.';
      signatureItem = 'Yellow embroidered saddle cloth';
      personality = 'Playful, joyful, gentle, and musical.';
      personalityTraits = ['Playful', 'Joyful', 'Gentle'];
      lockedAttributes = ['Sky-blue skin', 'Pink-lined ears', 'Yellow saddle cloth'];
    } else if (lowerName === 'colorful fish') {
      id = 'COLORFUL_FISH_GROUP';
      displayName = 'Colorful Fish Group';
      role = 'Undersea Chorus';
      characterType = 'Aquatic Group';
      species = 'Tropical Fish';
      age = 'Group';
      ageCategory = 'Ageless';
      gender = 'Group';
      appearance = `Vibrant trio of friendly tropical cartoon fish (tangerine orange, electric blue, and sunny yellow) with sparkling scales, iridescent translucent fins, and happy smiling eyes in ${style}.`;
      visualAppearance = `Trio of bright orange, blue, and yellow tropical fish in ${style}`;
      clothing = 'Iridescent natural scales with shimmering stardust fin borders.';
      clothingOutfit = clothing;
      accessories = 'Glittering stardust water bubbles.';
      signatureItem = 'Glittering stardust bubbles';
      personality = 'Synchronized, rhythmic, playful underwater dancers.';
      personalityTraits = ['Rhythmic', 'Playful', 'Harmonious'];
      lockedAttributes = ['Trio orange/blue/yellow scales', 'Translucent glittering fins'];
    } else if (lowerName === 'friendly giraffe') {
      id = 'FRIENDLY_GIRAFFE';
      displayName = 'Friendly Giraffe';
      role = 'Savanna Guide';
      characterType = 'Animal (Giraffe)';
      species = 'Giraffe';
      age = 'Young Giraffe';
      ageCategory = 'Child';
      gender = 'Unspecified';
      appearance = `Cheerful warm-golden cartoon giraffe with soft chestnut-brown star spots, gentle oversized eyelashes, and a bright leafy green neck scarf in ${style}.`;
      visualAppearance = `Golden giraffe with star spots and green scarf in ${style}`;
      clothing = 'Bright emerald-green silk neck scarf.';
      clothingOutfit = clothing;
      accessories = 'Leafy green neck scarf.';
      signatureItem = 'Emerald green neck scarf';
      personality = 'Gentle, observant, encouraging, and friendly.';
      personalityTraits = ['Gentle', 'Observant', 'Friendly'];
      lockedAttributes = ['Golden coat with star spots', 'Emerald green neck scarf'];
    } else if (lowerName === 'white pony') {
      id = 'WHITE_PONY';
      displayName = 'White Pony';
      role = 'Gentle Steed Companion';
      characterType = 'Animal (Pony)';
      species = 'White Pony';
      age = 'Young Pony';
      ageCategory = 'Child';
      gender = 'Unspecified';
      appearance = `Graceful silky white pony with shimmering silver-blue braided mane, glittering golden hooves, and a pastel lavender saddle blanket in ${style}.`;
      visualAppearance = `Silky white pony with silver-blue mane and lavender saddle in ${style}`;
      clothing = 'Pastel lavender velvet saddle blanket with silver tassel trim.';
      clothingOutfit = clothing;
      accessories = 'Lavender saddle blanket and golden horseshoes.';
      signatureItem = 'Lavender velvet saddle blanket';
      personality = 'Graceful, swift, spirited, and gentle.';
      personalityTraits = ['Graceful', 'Swift', 'Gentle'];
      lockedAttributes = ['Silky white coat', 'Silver-blue braided mane', 'Lavender saddle'];
    } else if (lowerName === 'friendly lion') {
      id = 'FRIENDLY_LION';
      displayName = 'Friendly Lion';
      role = 'Noble Companion';
      characterType = 'Animal (Lion)';
      species = 'Lion';
      age = 'Young Lion';
      ageCategory = 'Child';
      gender = 'Male';
      appearance = `Noble yet friendly golden lion cub with a plush sunny-orange mane, warm amber eyes, and a tiny polished golden crown pin on his chest in ${style}.`;
      visualAppearance = `Golden lion cub with orange mane and crown pin in ${style}`;
      clothing = 'Polished golden crown lapel pin.';
      clothingOutfit = clothing;
      accessories = 'Golden crown badge.';
      signatureItem = 'Golden crown badge';
      personality = 'Brave, noble, cheerful, and protective.';
      personalityTraits = ['Brave', 'Noble', 'Protective'];
      lockedAttributes = ['Golden cub coat', 'Sunny orange mane', 'Golden crown badge'];
    } else if (lowerName === 'playful monkey') {
      id = 'PLAYFUL_MONKEY';
      displayName = 'Playful Monkey';
      role = 'Acrobatic Companion';
      characterType = 'Animal (Monkey)';
      species = 'Monkey';
      age = 'Young Monkey';
      ageCategory = 'Child';
      gender = 'Male';
      appearance = `Spirited chestnut-brown cartoon monkey with peach muzzle, curved expressive tail, wearing a tiny red aviator cap with brass goggles in ${style}.`;
      visualAppearance = `Chestnut monkey with red aviator cap and goggles in ${style}`;
      clothing = 'Red leather aviator cap with brass goggles pushed up on forehead.';
      clothingOutfit = clothing;
      accessories = 'Aviator cap and brass goggles.';
      signatureItem = 'Red aviator cap with brass goggles';
      personality = 'Acrobatic, cheeky, clever, and energetic.';
      personalityTraits = ['Cheeky', 'Acrobatic', 'Clever'];
      lockedAttributes = ['Chestnut brown coat', 'Red aviator cap', 'Brass goggles'];
    } else if (lowerName === 'baby birds') {
      id = 'BABY_BIRDS_GROUP';
      displayName = 'Baby Birds Group';
      role = 'Avian Chorus';
      characterType = 'Avian Group';
      species = 'Baby Songbirds';
      age = 'Fledglings';
      ageCategory = 'Child';
      gender = 'Group';
      appearance = `Charming trio of pastel songbird chicks (sky blue, lemon yellow, and cotton candy pink) with fluffy down feathers and tiny musical note badges in ${style}.`;
      visualAppearance = `Trio of blue, yellow, and pink fluffy songbird chicks in ${style}`;
      clothing = 'Tiny polished silver musical note chest badges.';
      clothingOutfit = clothing;
      accessories = 'Silver musical note badges.';
      signatureItem = 'Silver musical note badges';
      personality = 'Musical, joyful, harmonious, and uplifting.';
      personalityTraits = ['Musical', 'Joyful', 'Harmonious'];
      lockedAttributes = ['Trio pastel down feathers', 'Silver musical note badges'];
    } else if (lowerName === 'friendly owl') {
      id = 'FRIENDLY_OWL';
      displayName = 'Friendly Owl';
      role = 'Wise Twilight Guide';
      characterType = 'Animal (Owl)';
      species = 'Owl';
      age = 'Wise Elder';
      ageCategory = 'Elder';
      gender = 'Unspecified';
      appearance = `Gentle scholarly tawny owl with fluffy speckled feathers, oversized glowing amber eyes, wearing round horn-rimmed reading glasses and a tiny tweed vest in ${style}.`;
      visualAppearance = `Speckled tawny owl with round glasses and tweed vest in ${style}`;
      clothing = 'Miniature brown tweed vest with brass pocket-watch chain.';
      clothingOutfit = clothing;
      accessories = 'Horn-rimmed spectacles and brass pocket-watch.';
      signatureItem = 'Horn-rimmed spectacles';
      personality = 'Wise, patient, encouraging, and articulate.';
      personalityTraits = ['Wise', 'Patient', 'Encouraging'];
      lockedAttributes = ['Tawny speckled feathers', 'Horn-rimmed spectacles', 'Tweed vest'];
    } else if (lowerName === 'cheerful penguin') {
      id = 'CHEERFUL_PENGUIN';
      displayName = 'Cheerful Penguin';
      role = 'Snow Companion';
      characterType = 'Animal (Penguin)';
      species = 'Penguin';
      age = 'Young Penguin';
      ageCategory = 'Child';
      gender = 'Unspecified';
      appearance = `Chubby black-and-white cartoon penguin chick with bright orange flipper feet, rosy cheeks, wearing a cozy knitted turquoise beanie with a fluffy pom-pom in ${style}.`;
      visualAppearance = `Penguin chick in turquoise pom-pom beanie in ${style}`;
      clothing = 'Knitted turquoise beanie with white fluffy pom-pom.';
      clothingOutfit = clothing;
      accessories = 'Turquoise beanie and rainbow ice-skates.';
      signatureItem = 'Turquoise pom-pom beanie';
      personality = 'Bouncy, cheerful, clumsy, and enthusiastic.';
      personalityTraits = ['Cheerful', 'Bouncy', 'Enthusiastic'];
      lockedAttributes = ['Plump penguin silhouette', 'Turquoise pom-pom beanie', 'Rosy cheeks'];
    } else if (lowerName === 'rainbow queen') {
      id = 'RAINBOW_QUEEN';
      displayName = 'Rainbow Queen';
      role = 'Royal Guardian';
      characterType = 'Royal / Magical';
      species = 'Human / Royal';
      age = 'Adult';
      ageCategory = 'Adult';
      gender = 'Female';
      appearance = `Majestic and warm Rainbow Queen wearing a shimmering iridescent prism gown with flowing crystalline cape, delicate golden starlight tiara, and compassionate smiling face in ${style}.`;
      visualAppearance = `Rainbow Queen in iridescent prism gown and starlight tiara in ${style}`;
      clothing = 'Iridescent prism gown with crystalline stardust train.';
      clothingOutfit = clothing;
      accessories = 'Golden starlight tiara and crystal prism scepter.';
      signatureItem = 'Starlight tiara and prism scepter';
      personality = 'Regal, benevolent, welcoming, and inspiring.';
      personalityTraits = ['Regal', 'Benevolent', 'Inspiring'];
      lockedAttributes = ['Iridescent prism gown', 'Golden starlight tiara', 'Prism scepter'];
    } else if (lowerName === 'elena' || lowerName === 'elder sister') {
      id = 'CHAR_001_ELENA';
      displayName = 'Elena (Elder Sister & Lead Explorer)';
      role = 'Lead Protagonist';
      characterType = 'Human Explorer';
      species = 'Human';
      age = '12 years old';
      ageCategory = 'Child';
      gender = 'Female';
      appearance = `Intelligent and protective 12yo sister Elena with wavy auburn hair in a neat half-up braid, warm green eyes, wearing an emerald green adventure tunic over brown leggings and leather trail boots in ${style}.`;
      visualAppearance = `12yo Elena in emerald green tunic and trail boots in ${style}`;
      face = 'Warm green eyes, gentle determined gaze, light freckles on bridge of nose.';
      hair = 'Wavy auburn hair secured in a half-up adventurer braid.';
      skin = 'Fair skin tone with sun-kissed cheeks.';
      clothing = 'Emerald green adventure tunic, brown leggings, sturdy leather trail boots.';
      clothingOutfit = clothing;
      accessories = 'Vintage brass compass on leather cord and leather messenger satchel.';
      signatureItem = 'Vintage brass compass';
      personality = 'Protective, observant, intelligent, and courageous.';
      personalityTraits = ['Protective', 'Intelligent', 'Courageous', 'Caring'];
      voice = `Clear, thoughtful, and articulate in ${lang}.`;
      lockedAttributes = ['Emerald green tunic', 'Auburn half-up braid', 'Vintage brass compass', 'Brown trail boots'];
    } else if (lowerName === 'maya' || lowerName === 'younger sister') {
      id = toStableId(`CHAR_${String(entityIndex).padStart(3, '0')}`, 'Maya');
      displayName = 'Maya (Sister & Explorer)';
      role = entityIndex === 1 ? 'Lead Protagonist' : 'Companion & Explorer';
      characterType = 'Human Explorer';
      species = 'Human';
      age = '8 years old';
      ageCategory = 'Child';
      gender = 'Female';
      appearance = `Playful, spirited 8yo sister Maya with twin high buns tied with yellow ribbons, bright amber eyes, wearing a sunny yellow knit cardigan over denim dungarees and teal canvas sneakers in ${style}.`;
      visualAppearance = `8yo Maya in yellow cardigan, dungarees, and twin buns in ${style}`;
      face = 'Big curious amber eyes, cheerful dimpled smile, animated expressions.';
      hair = 'Dark brown hair styled into twin high buns tied with sunny yellow ribbons.';
      skin = 'Warm radiant child skin tone.';
      clothing = 'Sunny yellow knit cardigan over denim overalls, teal canvas sneakers.';
      clothingOutfit = clothing;
      accessories = 'Yellow hair ribbons and flower-covered sketchbook.';
      signatureItem = 'Yellow hair ribbons & flower sketchbook';
      personality = 'Playful, enthusiastic, creative, and fearless.';
      personalityTraits = ['Playful', 'Creative', 'Fearless', 'Affectionate'];
      voice = `High-spirited, energetic, and joyful in ${lang}.`;
      lockedAttributes = ['Twin buns with yellow ribbons', 'Sunny yellow cardigan', 'Denim overalls', 'Teal sneakers'];
    } else if (lowerName === 'tara') {
      id = toStableId(`CHAR_${String(entityIndex).padStart(3, '0')}`, 'Tara');
      displayName = 'Tara (Sister & Explorer)';
      role = entityIndex === 1 ? 'Lead Protagonist' : 'Companion & Explorer';
      characterType = 'Human Explorer';
      species = 'Human';
      age = '7 years old';
      ageCategory = 'Child';
      gender = 'Female';
      appearance = `Curious, spirited 7yo sister Tara with dark braided pigtails with aqua clips, bright hazel eyes, wearing a turquoise marine exploration jacket over navy shorts and water shoes in ${style}.`;
      visualAppearance = `7yo Tara in turquoise exploration jacket and braided pigtails in ${style}`;
      face = 'Bright curious hazel eyes, cheerful dimpled smile, animated expressions.';
      hair = 'Dark braided pigtails secured with aqua-blue clips.';
      skin = 'Warm radiant child skin tone.';
      clothing = 'Turquoise marine exploration jacket, navy shorts, aqua-blue water shoes.';
      clothingOutfit = clothing;
      accessories = 'Waterproof dive torch and shell charm necklace.';
      signatureItem = 'Waterproof dive torch';
      personality = 'Curious, quick-witted, brave, and cheerful.';
      personalityTraits = ['Curious', 'Brave', 'Quick-witted', 'Cheerful'];
      voice = `High-spirited, energetic, and joyful in ${lang}.`;
      lockedAttributes = ['Braided pigtails with aqua clips', 'Turquoise marine jacket', 'Dive torch', 'Navy shorts'];
    } else if (lowerName === 'liam') {
      id = toStableId(`CHAR_${String(entityIndex).padStart(3, '0')}`, 'Liam');
      displayName = 'Liam (Lead Explorer)';
      role = 'Lead Protagonist';
      characterType = 'Human Explorer';
      species = 'Human';
      age = '14 years old';
      ageCategory = 'Teen';
      gender = 'Male';
      appearance = `Determined and resourceful 14yo explorer Liam with dark wavy hair, expressive grey-blue eyes, wearing a cobalt-blue tactical windbreaker over grey cargo trousers and hiking boots in ${style}.`;
      visualAppearance = `14yo Liam in cobalt windbreaker and cargo trousers in ${style}`;
      clothing = 'Cobalt-blue tactical windbreaker, charcoal cargo trousers, rugged trail shoes.';
      clothingOutfit = clothing;
      accessories = 'Tactical digital chronometer and carabiner gear clips.';
      signatureItem = 'Tactical chronometer';
      personality = 'Confident, analytical, courageous, and dependable.';
      personalityTraits = ['Confident', 'Analytical', 'Courageous'];
      voice = `Clear, confident teen enunciation in ${lang}.`;
      lockedAttributes = ['Cobalt-blue windbreaker', 'Dark wavy hair', 'Tactical chronometer'];
    } else if (lowerName === 'sophia') {
      id = toStableId(`CHAR_${String(entityIndex).padStart(3, '0')}`, 'Sophia');
      displayName = 'Sophia (Tech Specialist)';
      role = 'Lead Specialist';
      characterType = 'Human Specialist';
      species = 'Human';
      age = '14 years old';
      ageCategory = 'Teen';
      gender = 'Female';
      appearance = `Brilliant 14yo tech strategist Sophia with sleek auburn ponytail, hazel eyes behind thin rose-gold frames, wearing a coral-pink technical vest and dark leggings in ${style}.`;
      visualAppearance = `14yo Sophia in coral vest and rose-gold glasses in ${style}`;
      clothing = 'Coral-pink technical vest over long-sleeve grey shirt, dark trail leggings.';
      clothingOutfit = clothing;
      accessories = 'Rose-gold rimmed spectacles and handheld holographic data scanner.';
      signatureItem = 'Holographic data scanner';
      personality = 'Inventive, quick-thinking, curious, and empathetic.';
      personalityTraits = ['Inventive', 'Quick-thinking', 'Empathetic'];
      voice = `Bright, articulate, and insightful in ${lang}.`;
      lockedAttributes = ['Coral-pink technical vest', 'Rose-gold spectacles', 'Auburn ponytail'];
    } else if (lowerName === 'noah') {
      id = toStableId(`CHAR_${String(entityIndex).padStart(3, '0')}`, 'Noah');
      displayName = 'Noah (Field Specialist)';
      role = 'Field Specialist';
      characterType = 'Human Specialist';
      species = 'Human';
      age = '13 years old';
      ageCategory = 'Teen';
      gender = 'Male';
      appearance = `Observant 13yo field scout Noah with curly dark-brown hair, warm hazel eyes, wearing an olive-drab utility jacket with orange accents, sturdy khaki shorts, and trail sneakers in ${style}.`;
      visualAppearance = `13yo Noah in olive utility jacket and khaki shorts in ${style}`;
      clothing = 'Olive-drab utility jacket with high-vis orange zipper pulls, khaki shorts.';
      clothingOutfit = clothing;
      accessories = 'Multi-spectrum exploration monocular on neck lanyard.';
      signatureItem = 'Exploration monocular';
      personality = 'Observant, cautious, loyal, and quick-witted.';
      personalityTraits = ['Observant', 'Loyal', 'Quick-witted'];
      voice = `Calm, measured, and observant in ${lang}.`;
      lockedAttributes = ['Olive utility jacket with orange pulls', 'Curly dark hair', 'Exploration monocular'];
    } else if (lowerName === 'emma') {
      id = toStableId(`CHAR_${String(entityIndex).padStart(3, '0')}`, 'Emma');
      displayName = 'Emma (Naturalist)';
      role = 'Naturalist & Communications';
      characterType = 'Human Specialist';
      species = 'Human';
      age = '13 years old';
      ageCategory = 'Teen';
      gender = 'Female';
      appearance = `Spirited 13yo naturalist Emma with golden-blonde braid tied with a teal band, bright green eyes, wearing a teal fleece pullover, denim shorts over thermal tights, and trail boots in ${style}.`;
      visualAppearance = `13yo Emma in teal fleece and golden braid in ${style}`;
      clothing = 'Teal fleece pullover, denim shorts over dark thermal tights, brown trail boots.';
      clothingOutfit = clothing;
      accessories = 'Field specimen notebook and audio-recorder microphone.';
      signatureItem = 'Field specimen notebook';
      personality = 'Enthusiastic, compassionate, communicative, and observant.';
      personalityTraits = ['Enthusiastic', 'Compassionate', 'Observant'];
      voice = `Expressive, warm, and upbeat in ${lang}.`;
      lockedAttributes = ['Teal fleece pullover', 'Golden-blonde braid', 'Field notebook'];
    }

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

  // 1. Compass / Rahasyamayi Compass
  if (/compass|diksikshak|jadui compass/i.test(storyCombined)) {
    props.push({
      id: toStableId('PROP_001', 'Rahasyamayi Compass'),
      displayName: 'Rahasyamayi Compass (Mysterious Compass)',
      type: 'special_object',
      description: `Ancient mystical compass with glowing celestial needle that points towards hidden secrets in ${style}.`,
      appearance: `Intricately etched brass and gold compass with crystalline glass face, glowing cyan needle, and celestial engravings in ${style}.`,
      shape: 'Circular handheld brass dial with domed crystal lens',
      materials: 'Polished antique brass, celestial cyan crystal needle, glass lens',
      colors: 'Antique Gold, Cyan Luminescence, Brushed Brass',
      designDetails: 'Ancient star constellations etched around bezel with magnetic aura',
      scale: 'Handheld (8cm diameter)',
      usage: 'Guides characters toward ancient hidden landmarks',
      style,
      lockedAttributes: ['Brass casing with celestial runes', 'Glowing cyan directional needle', 'Crystalline glass lens'],
      lockedDesignAttributes: 'Antique brass body with cyan glowing star needle',
      generationPrompt: `Prop concept design for ancient mysterious compass with glowing needle, ${style}, 8k`,
      usageScenes: [1, 2, 3, 4, 5],
      status: 'REFERENCE_READY',
      referenceImageStatus: 'READY',
    });
  }

  // 2. Map / Purana Naksha
  if (/naksha|map|parchment map|treasure map/i.test(storyCombined)) {
    props.push({
      id: toStableId(`PROP_${String(props.length + 1).padStart(3, '0')}`, 'Purana Naksha'),
      displayName: 'Purana Naksha (Ancient Map)',
      type: 'prop',
      description: `Weathered parchment map detailing secret trails and hidden landmarks in ${style}.`,
      appearance: `Aged golden parchment map with hand-drawn cartography, compass rose, and mystical trail markings in ${style}.`,
      shape: 'Rolled weathered parchment scroll',
      materials: 'Handmade cotton parchment paper, sepia ink',
      colors: 'Aged Ochre, Charcoal Ink, Crimson Trail Lines',
      scale: 'Standard hand scroll (30cm x 45cm)',
      usage: 'Shows secret paths and ancient landmarks',
      style,
      lockedAttributes: ['Aged parchment edges', 'Glowing trail markings'],
      lockedDesignAttributes: 'Aged parchment edges with crimson route lines',
      generationPrompt: `Prop reference for ancient explorer map on parchment, ${style}, 8k`,
      usageScenes: [1, 2, 3, 4],
      status: 'REFERENCE_READY',
      referenceImageStatus: 'READY',
    });
  }

  // 3. Torch / Mashal
  if (/torch|mashal|flashlight|lantern|diya/i.test(storyCombined)) {
    props.push({
      id: toStableId(`PROP_${String(props.length + 1).padStart(3, '0')}`, 'Adventure Torch'),
      displayName: 'Adventure Torch / Mashal',
      type: 'prop',
      description: `Durable exploration torch casting a warm beam of light in ${style}.`,
      appearance: `Heavy-duty brass exploration torch with warm golden luminescent beam in ${style}.`,
      shape: 'Cylindrical explorer torch',
      materials: 'Machined brass, tempered glass lens',
      colors: 'Brass Gold, Warm Amber Light',
      scale: 'Handheld (18cm length)',
      usage: 'Illuminates dark caves and ancient trails',
      style,
      lockedAttributes: ['Brass body with knurled grip', 'Warm golden beam emitter'],
      generationPrompt: `Prop reference for explorer torch with warm light beam, ${style}, 8k`,
      usageScenes: [2, 3, 4],
      status: 'REFERENCE_READY',
      referenceImageStatus: 'READY',
    });
  }

  // 4. Bansuri / Divine Flute
  if (/bansuri|flute|murali/i.test(storyCombined)) {
    props.push({
      id: toStableId(`PROP_${String(props.length + 1).padStart(3, '0')}`, 'Bansuri'),
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
      generationPrompt: `Prop reference for divine bamboo flute with peacock tassel, ${style}, 8k`,
      usageScenes: [1, 2, 3, 4, 5],
      status: 'REFERENCE_READY',
      referenceImageStatus: 'READY',
    });
  }

  // 5. Hala / Ceremonial Plough
  if (/hala|plough/i.test(storyCombined)) {
    props.push({
      id: toStableId(`PROP_${String(props.length + 1).padStart(3, '0')}`, 'Ceremonial Hala'),
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
      generationPrompt: `Prop reference for sacred warrior plough hala, ${style}, 8k`,
      usageScenes: [1, 2, 3, 4, 5],
      status: 'REFERENCE_READY',
      referenceImageStatus: 'READY',
    });
  }

  // Default fallback prop if no specific prop matched
  if (props.length === 0) {
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
  }

  // -------------------------------------------------------------
  // STORY-AWARE ENVIRONMENTS & LOCATIONS EXTRACTION
  // -------------------------------------------------------------

  // 1. Mountain / Pahadi
  if (/pahadi|pahad|parvat|mountain|hill/i.test(storyCombined)) {
    environments.push({
      id: toStableId('ENV_001', 'Pahadi'),
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
      generationPrompt: `Environment master concept for scenic mountain pahadi slopes, ${style}, 8k --ar 16:9`,
      usageScenes: [1, 2, 3, 4, 5],
      status: 'REFERENCE_READY',
      referenceImageStatus: 'READY',
    });
  }

  // 2. Cave / Gufa
  if (/gufa|cave|cavern|surang/i.test(storyCombined)) {
    environments.push({
      id: toStableId(`ENV_${String(environments.length + 1).padStart(3, '0')}`, 'Gufa'),
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
      generationPrompt: `Environment concept for glowing crystal cave cavern, ${style}, 8k --ar 16:9`,
      usageScenes: [3, 4],
      status: 'REFERENCE_READY',
      referenceImageStatus: 'READY',
    });
  }

  // 3. Forest / Van / Jungle / Vrindavan
  if (/van|jungle|forest|woods|vrindavan/i.test(storyCombined)) {
    environments.push({
      id: toStableId(`ENV_${String(environments.length + 1).padStart(3, '0')}`, 'Mystic Forest'),
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
      generationPrompt: `Environment concept for enchanted forest grove, ${style}, 8k --ar 16:9`,
      usageScenes: [1, 2, 3, 4, 5],
      status: 'REFERENCE_READY',
      referenceImageStatus: 'READY',
    });
  }

  // 4. Riverbank / Yamuna / Ganga / Nadi
  if (/yamuna|ganga|kinare|kinara|riverbank|nadi|river|jheel|lake/i.test(storyCombined)) {
    environments.push({
      id: toStableId(`ENV_${String(environments.length + 1).padStart(3, '0')}`, 'Yamuna Kinara'),
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
      generationPrompt: `Environment concept for sacred peaceful riverbank with lotuses, ${style}, 8k --ar 16:9`,
      usageScenes: [1, 2, 3],
      status: 'REFERENCE_READY',
      referenceImageStatus: 'READY',
    });
  }

  // 5. Raasta / Mysterious Path
  if (/raaste|raasta|trail|path|marg/i.test(storyCombined) && environments.length < 2) {
    environments.push({
      id: toStableId(`ENV_${String(environments.length + 1).padStart(3, '0')}`, 'Mysterious Path'),
      displayName: 'Mysterious Path / Raasta',
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
      generationPrompt: `Environment concept for scenic winding cobblestone trail, ${style}, 8k --ar 16:9`,
      usageScenes: [2, 3],
      status: 'REFERENCE_READY',
      referenceImageStatus: 'READY',
    });
  }

  // Fallback defaults if no environments were detected
  if (environments.length === 0) {
    environments.push(
      {
        id: toStableId('ENV', 'PRIMARY_SETTING'),
        displayName: 'Primary Narrative Setting',
        type: 'environment',
        description: `Grand establishing environment for the narrative in ${style}.`,
        appearance: `Expansive cinematic world with rich atmospheric depth, volumetric lighting, and iconic visual landmarks in ${style}.`,
        lighting: 'Cinematic golden hour lighting with volumetric god rays',
        timeOfDay: 'Golden Hour',
        style,
        lockedAttributes: ['Signature architectural silhouette', 'Volumetric atmosphere'],
        generationPrompt: `Environment master concept for primary setting, ${style}, 8k --ar 16:9`,
        usageScenes: [1, 2, 3, 4, 5],
        status: 'REFERENCE_READY',
        referenceImageStatus: 'READY',
      },
      {
        id: toStableId('ENV', 'INNER_SANCTUM'),
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
  } else if (environments.length === 1) {
    environments.push({
      id: toStableId('ENV', 'INNER_SANCTUM'),
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

  const isKidsOrRhyme =
    (settings.videoType || '').toLowerCase().includes('kids') ||
    (settings.videoType || '').toLowerCase().includes('rhyme') ||
    idea.toLowerCase().includes('abc');

  const effectiveStoryText = (fullStory || settings.fullStory || settings.storyText || settings.refinedStory || '').trim();

  // Split effectiveStoryText into sentences/beats for story-aware scene generation
  let rawBeats: string[] = [];
  if (effectiveStoryText) {
    const rawSentences = effectiveStoryText
      .split(/(?<=[.!?\n।])\s+/)
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

    // Determine Environment strictly from registered list
    const envObj = registeredEnvs[i % registeredEnvs.length] || registeredEnvs[0];
    const envId = envObj?.id || 'PRIMARY_ENVIRONMENT';
    const envDisplayName = envObj?.displayName || envObj?.description || envId;

    // STORY-AWARE CHARACTER ASSIGNMENT:
    // Identify which registered characters occur in this specific story beat
    let sceneCharIds: string[] = [];
    if (registeredChars.length > 0) {
      const presentInBeat = registeredChars.filter((c) => {
        const nameLower = (c.name || '').toLowerCase();
        const displayLower = (c.displayName || '').toLowerCase();
        const idLower = (c.id || '').toLowerCase();
        return (
          beatTextLower.includes(nameLower) ||
          (displayLower.length > 0 && beatTextLower.includes(displayLower)) ||
          (nameLower.length >= 3 && beatTextLower.includes(nameLower)) ||
          idLower.length > 0 && beatTextLower.includes(idLower)
        );
      });

      if (presentInBeat.length > 0) {
        sceneCharIds = presentInBeat.map((c) => c.id);
      } else {
        // If beat has no explicit name (e.g. ambient description or pronoun like 'they'),
        // inherit characters from previous scene, or include lead characters
        if (previousSceneChars.length > 0) {
          sceneCharIds = [...previousSceneChars];
        } else if (registeredChars.length > 0) {
          // Include active cast up to 2 characters
          sceneCharIds = registeredChars.slice(0, Math.min(2, registeredChars.length)).map((c) => c.id);
        }
      }
    }

    // Determine Props for this scene strictly from registered list
    const scenePropIds: string[] = [];
    if (registeredProps.length > 0) {
      const matchedProp = registeredProps.find((p) => {
        const propNameLower = (p.displayName || p.id || '').toLowerCase();
        return (
          (propNameLower.length > 0 && beatTextLower.includes(propNameLower)) ||
          (p.description && beatTextLower.includes(p.description.toLowerCase()))
        );
      });
      if (matchedProp) {
        scenePropIds.push(matchedProp.id);
      } else {
        const propForScene = registeredProps[i % registeredProps.length];
        if (propForScene) {
          scenePropIds.push(propForScene.id);
        }
      }
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
      startingAction = `${charNamesJoined || 'The protagonist'} stands ready at the edge of ${envDisplayName}.`;
      finalAction = `${charNamesJoined || 'The protagonist'} gestures forward, beginning the journey.`;
      actionDesc = beatText.length > 0
        ? `${beatText} Visualized in ${style} with high dynamic range.`
        : `${startingAction} The morning light illuminates the path. ${finalAction}`;
    } else {
      if (newCharactersIntroduced.length > 0) {
        const newNames = newCharactersIntroduced.map((cid) => {
          const found = registeredChars.find((c) => c.id === cid || c.name === cid);
          return found?.name || cid;
        }).join(', ');
        startingAction = `Continuing from Scene ${sceneNum - 1}: ${newNames} is already visible in ${envDisplayName} as the interaction unfolds.`;
      } else {
        startingAction = `Continuing smoothly from Scene ${sceneNum - 1}: ${charNamesJoined || 'The characters'} maintain their natural physical motion.`;
      }

      if (scenePropIds.length > 0) {
        startingAction += ` ${scenePropIds[0]} is active in the scene.`;
      }

      finalAction = `${charNamesJoined || 'The characters'} conclude the beat, moving toward the next narrative development.`;
      actionDesc = beatText.length > 0
        ? `${beatText} Visualized in ${style} with character consistency.`
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

    // Lyric lines (only populated for kids songs/rhymes)
    const lyricLines: string[] = isKidsOrRhyme
      ? [
          `♪ Line ${sceneNum}A: Journey through the wonder of ${envDisplayName} ♪`,
          `♪ Line ${sceneNum}B: With joyful steps and friends so true ♪`,
          `♪ Line ${sceneNum}C: Singing together all the way through ♪`,
        ]
      : [];

    const sTitle = `Scene ${sceneNum}: ${envDisplayName}`;
    
    // Spoken dialogue / narration
    let dialogue = 'NONE';
    if (!ctx.isNoSpoken) {
      if (isKidsOrRhyme && lyricLines.length > 0) {
        dialogue = `Speaker: ${sceneCharIds[0] || 'Lead'}\nDialogue: "${lyricLines[0]}"`;
      } else {
        const quoteMatch = beatText.match(/["“]([^"”]+)["”]|'([^']+)'/);
        if (quoteMatch) {
          const quote = quoteMatch[1] || quoteMatch[2];
          const speaker = sceneCharIds[0]
            ? registeredChars.find((c) => c.id === sceneCharIds[0])?.name || 'Character'
            : 'Narrator';
          dialogue = `Speaker: ${speaker}\nDialogue: "${quote}"`;
        } else if (ctx.isNarratorOnly) {
          dialogue = `Speaker: Narrator\nNarration: "${beatText.slice(0, 140)}"`;
        } else {
          const speaker = sceneCharIds[0]
            ? registeredChars.find((c) => c.id === sceneCharIds[0])?.name || 'Lead'
            : 'Narrator';
          dialogue = `Speaker: ${speaker}\nDialogue: "${beatText.slice(0, 140)}"`;
        }
      }
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
      cameraAngleMotion: i % 2 === 0 ? '35mm anamorphic tracking shot with smooth lateral dolly' : 'Dynamic low-angle crane sweep rising gently',
      lightingMood: envObj?.lighting || 'Volumetric cinematic three-point lighting with soft rim rays',
      animationStyle: `${style} with natural physical inertia and secondary cloth/hair physics`,
      soundEffects: 'Diegetic environmental Foley and sparkling melodic accents',
      musicCue: `Musical phrase ${sceneNum} matching project tempo and key`,
      continuityNote: `Inherits visual state and positions from Scene ${sceneNum - 1}. No character or prop spawning.`,
      scenePurpose: `Advance story progression in Scene ${sceneNum}.`,
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
    const charConstraints = charIds
      .map((id) => {
        const found = charMap[id];
        const lock = found?.characterConsistencyLock || found?.appearance || found?.visualAppearance || id;
        return `Exactly ONE: ${id} (${lock})`;
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
              return `${pid}: ${foundProp ? foundProp.appearance || foundProp.description : pid}`;
            })
            .join(' | ')
        : 'NONE (No primary props in shot)';

    // Lyrics / Dialogue
    const lyricsText =
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

    // Music and Singing / Audio Lock
    const isKidsOrRhyme =
      (settings.videoType || '').toLowerCase().includes('kids') ||
      (settings.videoType || '').toLowerCase().includes('rhyme') ||
      idea.toLowerCase().includes('abc');

    const musicAndSingingText = isKidsOrRhyme
      ? `Project Music Lock: ${mLock.songStyle}, Tempo: ${mLock.tempo}, Key: ${mLock.key}. Singer: ${mLock.singer}. Vocalist Voice Lock: ${vLock.voiceId} (${vLock.ageImpression}, ${vLock.tone}, ${vLock.pronunciation}). Current lyrics are the next musical phrase of the SAME continuous song.`
      : `Cinematic Score: ${mLock.songStyle || 'Thematic Orchestral & Atmospheric Score'}, Tempo: ${mLock.tempo || '75 BPM'}, Key: ${mLock.key || 'D Minor'}. Dialogue / Narration: ${vLock.tone || 'Cinematic, narrative'}, ${vLock.pronunciation || 'Clear'}. Audio Mix: Balanced diegetic sound effects with background score.`;

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
      lyrics: lyricsText,
      continuity: continuityText,
      action: actionText,
      characterConsistency: consistencyText,
      musicAndSinging: musicAndSingingText,
      animation: animationText,
      camera: cameraText,
      negative: negativeText,
      endContinuity: endContinuityText,
    };

    const finalPrompt = `Prompt ${promptNum}:
DURATION: ${duration}
CHARACTERS:
${charConstraints}
ENVIRONMENT: ${envPromptText}
PROPS: ${propsPromptText}
LYRICS / DIALOGUE:
${lyricsText}
CONTINUITY: ${continuityText}
ACTION: ${actionText}
CHARACTER CONSISTENCY:
${consistencyText}
MUSIC AND SINGING: ${musicAndSingingText}
ANIMATION: ${animationText}
CAMERA: ${cameraText}
NEGATIVE: ${negativeText}
END CONTINUITY: ${endContinuityText}`;

    // Model Specific Prompts
    const modelPrompts: ModelSpecificPrompts = {
      veo: `Google Veo Prompt ${promptNum}: ${style} video (${duration}). Action: ${actionText}. Environment: ${envPromptText}. Characters: ${charConstraints}. Camera: ${cameraText}. Audio: ${lyricsText}. --ar ${aspect}`,
      runway: `Runway Gen-3 Prompt ${promptNum}: [${cameraText}] [${actionText}] [${envPromptText}] Characters: ${charConstraints}. Duration: ${durSec}s, ${style} 8K render --ar ${aspect}`,
      kling: `Kling AI Prompt ${promptNum}: Master shot (${durSec}s | ${scene.timeRange}), ${style}, ${actionText} in ${envPromptText}. Characters: ${charConstraints}. Aspect ratio: ${aspect}. ${cameraText}`,
      luma: `Luma Dream Machine Prompt ${promptNum}: Smooth ${cameraText} (${durSec}s) capturing ${actionText}. Environment: ${envPromptText}. Characters: ${charConstraints}. Aspect ${aspect}.`,
      sora: `OpenAI Sora Prompt ${promptNum}: Hyper-detailed cinematic sequence (${durSec}s) in ${style} aspect ratio ${aspect}. In ${envPromptText}, ${actionText}. Characters: ${charConstraints}. Audio: ${lyricsText}. Camera: ${cameraText}`,
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
      facialExpressions: 'Emotionally expressive gaze matching song cadence and discovery',
      bodyMovement: 'Natural kinetic physical blocking and rhythmic step-wise motion',
      cameraShot: 'Medium Master Shot',
      cameraMovement: scene.cameraAngleMotion,
      lensFraming: '35mm anamorphic prime lens, f/2.2',
      lighting: scene.lightingMood,
      atmosphere: 'Volumetric light beams and luminous atmospheric particles',
      animationStyle: animationText,
      physicsMotion: 'Realistic cloth simulation and natural hair dynamics',
      dialogue: lyricsText,
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
