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
    const progression: StoryProgressionBeat[] = paragraphs.map((para, i) => {
      const actNumber = i + 1;
      let actName = `Act ${actNumber}: Story Beat`;
      if (i === 0) actName = 'Act 1: Beginning & Opening Setup';
      else if (i === 1) actName = 'Act 2: Rising Progression';
      else if (i === Math.floor(paragraphs.length / 2)) actName = 'Act 3: Core Turning Point';
      else if (i === paragraphs.length - 2) actName = 'Act 4: Climax';
      else if (i === paragraphs.length - 1) actName = `Act ${actNumber}: Resolution & Conclusion`;

      return {
        act: actName,
        title: `Beat ${actNumber}`,
        summary: para.slice(0, 150) + (para.length > 150 ? '...' : ''),
        characters: ['Story Characters'],
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
      charactersInvolved: ['Story Characters'],
      dialogueHighlights: paragraphs.slice(0, 3).map((p) => p.slice(0, 90) + '...'),
      storyTone: settings.tone || 'Exciting',
      targetAudienceAnalysis: `${settings.audience || 'General'} audience enjoying ${style} storytelling in ${lang}`,
    };
  }

  // Mode B1: USER STORY WITH AI REFINEMENT
  if (storyMode === 'user_refined' && rawStory) {
    const refinedStoryText = rawStory;
    const paragraphs = refinedStoryText.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

    const progression: StoryProgressionBeat[] = [
      {
        act: 'Act 1: Hook & Setting the Stakes',
        title: 'Opening Discovery',
        summary: paragraphs[0] || `Introduction to the world of ${idea}.`,
        characters: ['Protagonist'],
        keyActions: 'Arrival, initial observation, discovering unexpected signals.',
      },
      {
        act: 'Act 2: Rising Action & Exploration',
        title: 'Journey Unfolds',
        summary: paragraphs[1] || `The adventure deepens with exciting exploration and obstacle solving.`,
        characters: ['Protagonist', 'Companions'],
        keyActions: 'Navigating obstacles, discovering vital clues.',
      },
      {
        act: 'Act 3: Turning Point & Discovery',
        title: 'The Core Secret',
        summary: paragraphs[2] || `A dramatic revelation reshapes everything known so far.`,
        characters: ['Protagonist', 'Key Characters'],
        keyActions: 'Unlocking the central mystery, confronting unexpected stakes.',
      },
      {
        act: 'Act 4: The Climax & Resolution',
        title: 'Triumph and Renewal',
        summary: paragraphs[3] || paragraphs[paragraphs.length - 1] || `A triumphant conclusion uniting the characters in joy and accomplishment.`,
        characters: ['All Characters'],
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
      charactersInvolved: ['Protagonist', 'Companions', 'All Characters'],
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
  const beats: StoryProgressionBeat[] = [
    {
      act: 'Act 1: Opening Hook & World Setup',
      title: 'The Spark of Wonder',
      summary: `Our characters arrive in the extraordinary realm of "${idea}". Immediate visual curiosity grabs the viewer.`,
      characters: ['Lead Explorer / Protagonist'],
      keyActions: 'Stepping into the unknown, identifying the primary wonder or mystery.',
    },
    {
      act: 'Act 2: Rising Adventure & Escalation',
      title: 'Deeper into the Realm',
      summary: 'Exploring wondrous landmarks, solving playful challenges, and building dynamic character chemistry.',
      characters: ['Protagonist', 'Supporting Companion'],
      keyActions: 'Overcoming environmental obstacles, unlocking visual wonders.',
    },
    {
      act: 'Act 3: Climax & The Grand Secret',
      title: 'The Pivotal Revelation',
      summary: 'The ultimate mystery is revealed in a burst of cinematic light, sound, and emotional triumph.',
      characters: ['All Characters'],
      keyActions: 'Reaching the central summit, activating the source of wonder.',
    },
    {
      act: 'Act 4: Heartfelt Resolution',
      title: 'A Legacy of Wonder',
      summary: 'Celebrating unity, new friendship, and the eternal beauty of the completed adventure.',
      characters: ['All Characters'],
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
    charactersInvolved: ['Lead Explorer', 'Companions', 'All Characters'],
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
    return `एक समय की बात है, "${idea}" की इस अनूठी दुनिया में एक नई सुबह की शुरुआत होती है। चारों ओर एक रहस्यमयी और मनमोहक वातावरण फैला हुआ है, जहाँ हर दृश्य में रोमांच और कौतूहल की झलक मिलती है।\n\nजैसे-जैसे यात्रा आगे बढ़ती है, मुख्य पात्रों के सामने एक अप्रत्याशित चुनौती और जादुई संकेत प्रकट होता है। वे साहस और आपसी समझ के साथ उस रास्ते पर आगे कदम बढ़ाते हैं, जहाँ हर मोड़ पर नई खोज उनका इंतज़ार कर रही होती है।\n\nकहानी के इस महत्वपूर्ण मोड़ पर, एक गहरा रहस्य सामने आता है जो सब कुछ बदल कर रख देता है। परिस्थितियाँ कठिन हो जाती हैं और उन्हें अपनी असली शक्ति और दृढ़ संकल्प का परिचय देना पड़ता है।\n\nचरम संघर्ष और रोमांच के क्षण में, वे मिलकर पूरी लगन और बहादुरी के साथ इस चुनौती का सामना करते हैं। अद्भुत दृश्यों और चमत्कारी ऊर्जा के बीच जीत हासिल होती है।\n\nअंत में, चारों ओर शांति और उत्सव का माहौल छा जाता है। यह कहानी हमें सिखाती है कि सच्ची लगन, एकता और साहस से हर मुश्किल आसान हो जाती है।`;
  }

  return `In the vibrant world of "${idea}", a monumental journey begins. The morning air is filled with palpable wonder, and every detail of the environment hints at an ancient secret waiting to be uncovered.\n\nAs the expedition advances, unexpected signals draw our characters deeper into uncharted territory. Guided by intuition and shared courage, they navigate intricate obstacles and uncover visual clues that illuminate the path ahead.\n\nAt the central turning point, the true stakes of the quest are revealed. A sudden shift in the environment forces a critical decision, testing the bonds of trust and determination that hold the group together.\n\nIn a climactic surge of action and visual splendor, the characters confront the ultimate challenge. Leveraging their distinct strengths and steadfast resolve, they turn the tide in an exhilarating display of triumph.\n\nWith balance restored and the quest fulfilled, a radiant dawn breaks across the horizon. Their extraordinary journey leaves an indelible mark of inspiration, unity, and timeless wonder.`;
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
  const combinedText = `${idea}\n${fullStoryText || ''}\n${characterInstructions || ''}`;
  const lowerText = combinedText.toLowerCase();
  const style = settings.visualStyle || '3D Cartoon';
  const lang = settings.language || 'English';

  const characters: CharacterProfile[] = [];
  const props: PropProfile[] = [];
  const environments: EnvironmentProfile[] = [];

  // Helper to format uppercase stable ID
  const toStableId = (prefix: string, name: string) => {
    const clean = name.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return clean.length > 0 ? clean : prefix.toUpperCase();
  };

  // CHECK 1: ABC / Rhyme / Kids Alphabet Adventure Story Pattern
  const isAbcOrRhyme =
    lowerText.includes('abc') ||
    lowerText.includes('alphabet') ||
    lowerText.includes('rhyme') ||
    lowerText.includes('a is for') ||
    lowerText.includes('b is for') ||
    (lowerText.includes('bunny') && lowerText.includes('elephant') && lowerText.includes('train'));

  if (isAbcOrRhyme) {
    // 1. LEAD CHILD HERO
    const mainHero: CharacterProfile = {
      id: 'MAIN_CHILD_HERO',
      displayName: 'Main Child Hero (Leo / Adventurer)',
      name: 'Main Child Hero',
      type: 'character',
      role: 'Lead Protagonist & Guide',
      age: '6-7 years old',
      ageCategory: 'Child',
      species: 'Human Child',
      gender: 'Boy / Universal Child',
      description: 'Energetic, curious 7-year-old child wearing denim dungarees and bright sneakers, exploring the magical ABC world.',
      appearance: `Charming 7yo child in blue denim overalls with vibrant yellow hooded shirt, bright red sneakers, joyful sparkling eyes, and playful tousled brown hair in ${style}.`,
      visualAppearance: `7yo child in blue overalls, yellow hoodie, red sneakers in ${style}`,
      face: 'Bright sparkling hazel eyes, rosy cheeks, enthusiastic welcoming smile.',
      hair: 'Playful tousled warm-brown hair with a soft cowlick.',
      skinOrVisualCharacteristics: 'Warm healthy radiant skin tone, volumetric natural light.',
      bodyOrBuild: 'Nimble, energetic child proportions with expressive animated bounce.',
      clothing: 'Blue denim overalls with brass buttons over a bright yellow hoodie, red canvas sneakers.',
      clothingOutfit: 'Blue denim overalls, bright yellow hoodie, red sneakers.',
      signatureItem: 'Magic Alphabet Explorer Badge pinned to overalls.',
      personality: 'Curious, fearless, joyful, welcoming, and expressive.',
      personalityTraits: ['Curious', 'Joyful', 'Adventurous', 'Caring'],
      expressions: 'Beaming smile, wide-eyed wonder, excited singing expressions.',
      voice: `Clear, joyful child enunciation in ${lang}.`,
      voiceStyle: `Upbeat and cheerful in ${lang}.`,
      voiceCharacteristics: 'Melodic, articulate, warm child pitch.',
      speakingOrSingingRole: 'Lead singer and guide through every letter.',
      characterConsistencyLock: 'MAIN_CHILD_HERO: 7yo human child, blue denim overalls, bright yellow hoodie, red sneakers, tousled brown hair, hazel eyes. NEVER change outfit or facial model.',
      visualPromptAnchor: `MAIN_CHILD_HERO, 7yo child in blue denim overalls, yellow hoodie, red sneakers, tousled brown hair, sparkling hazel eyes, ${style}, volumetric lighting, 8k render`,
      generationPrompt: `Master character portrait of MAIN_CHILD_HERO, a 7-year-old child in blue denim overalls over bright yellow hoodie, red sneakers, tousled brown hair, sparkling hazel eyes, warm welcoming smile, ${style} aesthetic, vibrant colors, isolated studio lighting, 8k --ar 1:1`,
      lockedAttributes: ['Blue denim overalls', 'Yellow hoodie', 'Red sneakers', 'Tousled brown hair', 'Hazel eyes'],
      style,
      usageScenes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
      status: 'REFERENCE_READY',
      referenceImageStatus: 'READY',
      negativePrompt: 'blurry, adult features, different clothing, green shirt, changed hair color, extra limbs, distorted face',
    };
    characters.push(mainHero);

    // 2. BUNNY FRIEND
    characters.push({
      id: 'BUNNY_FRIEND',
      displayName: 'Bunny Friend (B)',
      name: 'Bunny Friend',
      type: 'character',
      role: 'Animal Companion / B is for Bunny',
      age: 'Young Bunny',
      ageCategory: 'Child',
      species: 'Rabbit / Animal',
      gender: 'Unspecified',
      description: 'Fluffy white bunny with pastel pink inner ears and a tiny teal bow tie.',
      appearance: `Adorably fluffy snowy-white bunny with tall perky pink-lined ears, round button nose, big glossy dark eyes, wearing a tiny teal satin bow tie in ${style}.`,
      visualAppearance: `Fluffy white bunny with pink-lined ears and teal bow tie in ${style}`,
      face: 'Cheery whiskers, twitching pink nose, glossy curious eyes.',
      hairOrFur: 'Plush cloud-soft white fur with micro-fiber groom rendering.',
      bodyOrBuild: 'Compact round bouncy bunny silhouette.',
      clothing: 'Tiny teal satin bow tie around neck.',
      clothingOutfit: 'Teal satin bow tie.',
      signatureItem: 'Teal satin bow tie and small wicker basket of strawberries.',
      personality: 'Playful, bouncy, affectionate, and cheerful.',
      characterConsistencyLock: 'BUNNY_FRIEND: Pure white fluffy fur, pink inner ears, glossy eyes, teal satin bow tie. Exactly ONE bunny.',
      visualPromptAnchor: `BUNNY_FRIEND, fluffy white bunny, pink ears, teal bow tie, glossy dark eyes, ${style}, 8k render`,
      generationPrompt: `Character reference of BUNNY_FRIEND, fluffy snow-white bunny with perky pink-lined ears, wearing a teal satin bow tie, glossy round eyes, friendly smile, ${style}, clean background, 8k`,
      lockedAttributes: ['Snow white fluffy fur', 'Pink inner ears', 'Teal satin bow tie'],
      style,
      usageScenes: [2, 3, 8, 12],
      status: 'REFERENCE_READY',
      referenceImageStatus: 'READY',
      negativePrompt: 'brown fur, multiple bunnies, scary eyes, missing bow tie, realistic wild rabbit',
    });

    // 3. BABY BEAR FRIEND
    characters.push({
      id: 'BABY_BEAR_FRIEND',
      displayName: 'Baby Bear Friend',
      name: 'Baby Bear Friend',
      type: 'character',
      role: 'Animal Companion',
      age: 'Baby Bear Cub',
      ageCategory: 'Child',
      species: 'Bear Cub / Animal',
      gender: 'Male / Cub',
      description: 'Cuddly caramel-brown baby bear cub wearing a red-and-white striped scarf.',
      appearance: `Plush honey-caramel brown baby bear cub with round ears, honey-colored muzzle, soft button nose, wearing a cozy red-and-white knitted scarf in ${style}.`,
      visualAppearance: `Caramel baby bear with striped scarf in ${style}`,
      face: 'Warm teddy-bear smile, twinkling dark eyes, soft velvet nose.',
      hairOrFur: 'Dense velvety caramel-brown fur.',
      bodyOrBuild: 'Chubby lovable teddy-bear cub proportions.',
      clothing: 'Red-and-white striped woolen knit scarf.',
      clothingOutfit: 'Red-and-white striped scarf.',
      signatureItem: 'Red-and-white striped scarf and miniature wooden honey spoon.',
      personality: 'Gentle, cuddly, loyal, and friendly.',
      characterConsistencyLock: 'BABY_BEAR_FRIEND: Honey caramel brown cub, red-and-white striped scarf, teddy-bear face. Exactly ONE bear cub.',
      visualPromptAnchor: `BABY_BEAR_FRIEND, honey-caramel bear cub, red-and-white striped scarf, ${style}, 8k`,
      generationPrompt: `Character reference sheet for BABY_BEAR_FRIEND, caramel baby bear cub wearing red-white striped scarf, cute round ears, ${style}, 8k`,
      lockedAttributes: ['Caramel brown fur', 'Red-and-white striped scarf'],
      style,
      usageScenes: [3, 8, 9, 12],
      status: 'REFERENCE_READY',
      referenceImageStatus: 'READY',
      negativePrompt: 'ferocious bear, adult grizzly, missing scarf, dark black fur',
    });

    // 4. BABY ELEPHANT
    characters.push({
      id: 'BABY_ELEPHANT',
      displayName: 'Baby Elephant (E)',
      name: 'Baby Elephant',
      type: 'character',
      role: 'Animal Companion / E is for Elephant',
      age: 'Baby Elephant',
      ageCategory: 'Child',
      species: 'Elephant / Animal',
      gender: 'Unspecified',
      description: 'Pastel sky-blue baby elephant with soft oversized floppy ears and a playful curled trunk.',
      appearance: `Charming pastel sky-blue baby elephant with oversized gentle floppy ears with pink inner shading, friendly curved trunk, and shiny golden ankle bangles in ${style}.`,
      visualAppearance: `Sky-blue baby elephant with pink inner ears in ${style}`,
      face: 'Gentle smiling eyes, curled playful trunk blowing flower petals.',
      skinOrVisualCharacteristics: 'Smooth sky-blue skin texture with soft pastel highlights.',
      bodyOrBuild: 'Plump, adorable baby elephant build with cute rounded feet.',
      clothing: 'Tiny yellow saddle cloth with rainbow embroidered border.',
      clothingOutfit: 'Yellow embroidered saddle cloth.',
      signatureItem: 'Yellow embroidered saddle cloth.',
      personality: 'Playful, joyful, gentle, and musical.',
      characterConsistencyLock: 'BABY_ELEPHANT: Pastel sky-blue skin, pink-lined floppy ears, yellow saddle cloth. Exactly ONE elephant.',
      visualPromptAnchor: `BABY_ELEPHANT, sky-blue baby elephant, pink-lined ears, yellow saddle cloth, ${style}, 8k`,
      generationPrompt: `Character model sheet for BABY_ELEPHANT, cute sky-blue baby elephant, oversized floppy ears, yellow saddle cloth, ${style}`,
      lockedAttributes: ['Sky-blue skin', 'Pink-lined ears', 'Yellow saddle cloth'],
      style,
      usageScenes: [5, 12],
      status: 'REFERENCE_READY',
      referenceImageStatus: 'READY',
      negativePrompt: 'giant wild elephant, tusks, aggressive, grey wrinkled skin',
    });

    // 5. COLORFUL FISH GROUP
    characters.push({
      id: 'COLORFUL_FISH_GROUP',
      displayName: 'Colorful Fish Group (F)',
      name: 'Colorful Fish Group',
      type: 'character',
      role: 'Undersea Chorus / F is for Fish',
      species: 'Tropical Fish',
      age: 'Group',
      ageCategory: 'Ageless',
      gender: 'Group',
      description: 'A harmonious trio of glowing tropical fish (tangerine orange, electric blue, and sunny yellow) with glittering fins.',
      appearance: `Vibrant trio of friendly tropical cartoon fish with sparkling scales, iridescent translucent fins, and happy smiling eyes in ${style}.`,
      visualAppearance: `Trio of bright orange, blue, and yellow tropical fish in ${style}`,
      signatureItem: 'Glittering stardust water bubbles.',
      personality: 'Synchronized, rhythmic, playful underwater dancers.',
      characterConsistencyLock: 'COLORFUL_FISH_GROUP: Group of 3 distinct tropical fish (Orange, Cyan, Yellow) swimming in unison.',
      visualPromptAnchor: `COLORFUL_FISH_GROUP, three glowing tropical cartoon fish swimming together, ${style}, 8k`,
      generationPrompt: `Reference design for COLORFUL_FISH_GROUP, trio of cute friendly animated tropical fish, iridescent fins, ${style}`,
      lockedAttributes: ['Trio of Orange, Cyan, Yellow fish', 'Iridescent fins'],
      style,
      usageScenes: [6],
      status: 'REFERENCE_READY',
      referenceImageStatus: 'READY',
    });

    // 6. FRIENDLY GIRAFFE
    characters.push({
      id: 'FRIENDLY_GIRAFFE',
      displayName: 'Friendly Giraffe (G)',
      name: 'Friendly Giraffe',
      type: 'character',
      role: 'Savanna Host / G is for Giraffe',
      species: 'Giraffe / Animal',
      age: 'Young Giraffe',
      ageCategory: 'Child',
      gender: 'Unspecified',
      description: 'Gentle golden giraffe with warm caramel heart-shaped spots and a purple ribbon bow.',
      appearance: `Graceful golden-yellow young giraffe with soft caramel patches, long elegant neck, big gentle brown eyes with long eyelashes, wearing a pastel purple ribbon around collar in ${style}.`,
      visualAppearance: `Golden giraffe with heart-shaped spots and purple ribbon in ${style}`,
      face: 'Kind warm smile, velvet ossicones, long expressive eyelashes.',
      bodyOrBuild: 'Slender elegant neck with gentle posture.',
      clothing: 'Pastel purple silk neck ribbon.',
      clothingOutfit: 'Pastel purple neck ribbon.',
      signatureItem: 'Pastel purple neck ribbon and flower crown.',
      personality: 'Gentle, gracious, friendly, and tall.',
      characterConsistencyLock: 'FRIENDLY_GIRAFFE: Golden yellow coat, caramel heart spots, purple neck ribbon. Exactly ONE giraffe.',
      visualPromptAnchor: `FRIENDLY_GIRAFFE, golden giraffe with caramel spots, purple neck ribbon, kind eyes, ${style}, 8k`,
      generationPrompt: `Character reference of FRIENDLY_GIRAFFE, cute friendly cartoon giraffe with heart patches and purple ribbon, ${style}`,
      lockedAttributes: ['Golden coat with caramel spots', 'Purple neck ribbon'],
      style,
      usageScenes: [7, 8],
      status: 'REFERENCE_READY',
      referenceImageStatus: 'READY',
    });

    // 7. WHITE PONY
    characters.push({
      id: 'WHITE_PONY',
      displayName: 'White Pony (H)',
      name: 'White Pony',
      type: 'character',
      role: 'Animal Friend / H is for Horse/Pony',
      species: 'Pony / Horse',
      age: 'Young Pony',
      ageCategory: 'Child',
      gender: 'Unspecified',
      description: 'Silky-maned snow-white pony with braided pastel mane and sparkling silver horseshoes.',
      appearance: `Dazzling snow-white pony with a silky rainbow-accented mane braided with wildflowers, gentle starry blue eyes, and glittering silver hooves in ${style}.`,
      visualAppearance: `Snow-white pony with braided wildflower mane in ${style}`,
      signatureItem: 'Wildflower braided mane and silver horseshoes.',
      personality: 'Spirited, gentle, friendly, and swift.',
      characterConsistencyLock: 'WHITE_PONY: Snow-white coat, wildflower braided mane, blue eyes. Exactly ONE pony.',
      visualPromptAnchor: `WHITE_PONY, snow-white pony with wildflower braided mane, sparkling hooves, ${style}, 8k`,
      generationPrompt: `Reference sheet for WHITE_PONY, cute snow-white pony, braided colorful mane, ${style}`,
      lockedAttributes: ['Snow-white coat', 'Braided wildflower mane'],
      style,
      usageScenes: [8],
      status: 'REFERENCE_READY',
      referenceImageStatus: 'READY',
    });

    // 8. FRIENDLY LION
    characters.push({
      id: 'FRIENDLY_LION',
      displayName: 'Friendly Lion (L)',
      name: 'Friendly Lion',
      type: 'character',
      role: 'Savanna King / L is for Lion',
      species: 'Lion / Animal',
      age: 'Young Lion Cub',
      ageCategory: 'Child',
      gender: 'Male / Cub',
      description: 'Golden-furred lion cub with a fluffy sunflower-like golden mane and a playful grin.',
      appearance: `Cheerful golden lion cub with an ultra-soft fluffy honey-golden mane shaped like sunflower petals, emerald eyes, and a cute pink nose in ${style}.`,
      visualAppearance: `Golden lion cub with fluffy sunflower mane in ${style}`,
      signatureItem: 'Golden lion badge.',
      personality: 'Brave, cheerful, friendly, and playful.',
      characterConsistencyLock: 'FRIENDLY_LION: Honey golden cub fur, sunflower petal mane, emerald eyes. Exactly ONE lion cub.',
      visualPromptAnchor: `FRIENDLY_LION, golden lion cub with soft fluffy mane, emerald eyes, smiling, ${style}, 8k`,
      generationPrompt: `Character design for FRIENDLY_LION, cute friendly lion cub with sunflower-fluffy mane, ${style}`,
      lockedAttributes: ['Golden fur', 'Sunflower fluffy mane', 'Emerald eyes'],
      style,
      usageScenes: [9],
      status: 'REFERENCE_READY',
      referenceImageStatus: 'READY',
    });

    // 9. PLAYFUL MONKEY
    characters.push({
      id: 'PLAYFUL_MONKEY',
      displayName: 'Playful Monkey (M)',
      name: 'Playful Monkey',
      type: 'character',
      role: 'Jungle Acrobat / M is for Monkey',
      species: 'Monkey / Animal',
      age: 'Young Monkey',
      ageCategory: 'Child',
      gender: 'Unspecified',
      description: 'Nimble caramel monkey with a curling tail and a tiny red explorer cap.',
      appearance: `Lively caramel-furred monkey with beige face, big expressive round eyes, prehensile curling tail, wearing a tilted red explorer cap in ${style}.`,
      visualAppearance: `Caramel monkey with tilted red explorer cap in ${style}`,
      signatureItem: 'Tilted red explorer cap and yellow banana.',
      personality: 'Acrobatic, cheeky, hilarious, and energetic.',
      characterConsistencyLock: 'PLAYFUL_MONKEY: Caramel fur, beige face, red explorer cap. Exactly ONE monkey.',
      visualPromptAnchor: `PLAYFUL_MONKEY, agile cartoon monkey wearing red cap, smiling, ${style}, 8k`,
      generationPrompt: `Reference model for PLAYFUL_MONKEY, cute cartoon monkey with red cap and long curling tail, ${style}`,
      lockedAttributes: ['Caramel fur', 'Red explorer cap'],
      style,
      usageScenes: [9],
      status: 'REFERENCE_READY',
      referenceImageStatus: 'READY',
    });

    // 10. BABY BIRDS GROUP
    characters.push({
      id: 'BABY_BIRDS_GROUP',
      displayName: 'Baby Birds Group (N)',
      name: 'Baby Birds Group',
      type: 'character',
      role: 'Songbirds / N is for Nest',
      species: 'Songbirds',
      age: 'Fledglings',
      ageCategory: 'Child',
      gender: 'Group',
      description: 'Trio of fluffy pastel-colored fledgling songbirds (lemon yellow, sky blue, candy pink) chirping happily in their nest.',
      appearance: `Three round fluffy baby birds with bright beaks and wide singing eyes, nestled together in a cozy golden twig nest in ${style}.`,
      visualAppearance: `Trio of yellow, blue, and pink baby songbirds in ${style}`,
      signatureItem: 'Musical note stardust.',
      personality: 'Harmonious, sweet, chirpy singers.',
      characterConsistencyLock: 'BABY_BIRDS_GROUP: Trio of fluffy baby songbirds (Yellow, Blue, Pink) in nest.',
      visualPromptAnchor: `BABY_BIRDS_GROUP, three fluffy colorful baby birds singing together, ${style}, 8k`,
      generationPrompt: `Reference design for BABY_BIRDS_GROUP, three cute baby songbirds in golden twig nest, ${style}`,
      lockedAttributes: ['Trio of Yellow, Blue, Pink chicks'],
      style,
      usageScenes: [10],
      status: 'REFERENCE_READY',
      referenceImageStatus: 'READY',
    });

    // 11. FRIENDLY OWL
    characters.push({
      id: 'FRIENDLY_OWL',
      displayName: 'Friendly Owl (O)',
      name: 'Friendly Owl',
      type: 'character',
      role: 'Night Scholar / O is for Owl',
      species: 'Owl / Bird',
      age: 'Wise Little Owl',
      ageCategory: 'Child',
      gender: 'Unspecified',
      description: 'Plump amber-feathered little owl with oversized round spectacles and a tiny graduation mortarboard tassel.',
      appearance: `Chubby amber-and-cream feathered owl with huge luminous golden eyes, round gold-wire spectacles, and soft tufted feathers in ${style}.`,
      visualAppearance: `Plump amber owl with gold-wire spectacles in ${style}`,
      signatureItem: 'Gold-wire spectacles and tiny scroll.',
      personality: 'Curious, scholarly, gentle, and observant.',
      characterConsistencyLock: 'FRIENDLY_OWL: Amber and cream feathers, gold-wire spectacles, golden eyes. Exactly ONE owl.',
      visualPromptAnchor: `FRIENDLY_OWL, cute amber owl wearing gold round spectacles, ${style}, 8k`,
      generationPrompt: `Reference sheet for FRIENDLY_OWL, cute scholarly owl with round spectacles and fluffy feathers, ${style}`,
      lockedAttributes: ['Amber and cream feathers', 'Gold-wire spectacles'],
      style,
      usageScenes: [10],
      status: 'REFERENCE_READY',
      referenceImageStatus: 'READY',
    });

    // 12. BABY PENGUIN
    characters.push({
      id: 'BABY_PENGUIN',
      displayName: 'Baby Penguin (P)',
      name: 'Baby Penguin',
      type: 'character',
      role: 'Snow Explorer / P is for Penguin',
      species: 'Penguin / Bird',
      age: 'Baby Chick',
      ageCategory: 'Child',
      gender: 'Unspecified',
      description: 'Chubby velvet black-and-white penguin chick with bright orange earmuffs and matching booties.',
      appearance: `Ultra-cute chubby black-and-white penguin chick with soft downy belly, bright orange flipper booties, and cozy fuzzy orange earmuffs in ${style}.`,
      visualAppearance: `Baby penguin with orange earmuffs and booties in ${style}`,
      signatureItem: 'Orange fuzzy earmuffs and booties.',
      personality: 'Waddling, joyful, curious, and energetic.',
      characterConsistencyLock: 'BABY_PENGUIN: Black-and-white chick, fuzzy orange earmuffs, orange booties. Exactly ONE penguin.',
      visualPromptAnchor: `BABY_PENGUIN, chubby baby penguin chick with orange earmuffs, smiling, ${style}, 8k`,
      generationPrompt: `Character model of BABY_PENGUIN, cute cartoon penguin chick with orange earmuffs, ${style}`,
      lockedAttributes: ['Black-and-white chick', 'Orange earmuffs and booties'],
      style,
      usageScenes: [11],
      status: 'REFERENCE_READY',
      referenceImageStatus: 'READY',
    });

    // 13. FRIENDLY QUEEN
    characters.push({
      id: 'FRIENDLY_QUEEN',
      displayName: 'Friendly Queen (Q)',
      name: 'Friendly Queen',
      type: 'character',
      role: 'Rainbow Monarch / Q is for Queen',
      species: 'Human Adult',
      age: 'Young Queen (24yo)',
      ageCategory: 'Young Adult',
      gender: 'Female',
      description: 'Kind and regal young queen wearing a glittering pastel lavender and pink ballgown with a sparkling crystal tiara.',
      appearance: `Graceful, warm-hearted queen with smiling sapphire eyes, strawberry blonde wavy hair in a loose braid, wearing a sparkling pastel lavender gown with starlight embroidery and a delicate crystal tiara in ${style}.`,
      visualAppearance: `Queen in pastel lavender gown and crystal tiara in ${style}`,
      face: 'Warm benevolent smile, glowing kind eyes, regal poise.',
      hair: 'Lustrous strawberry blonde hair cascading in an ornate braid with pearl pins.',
      clothing: 'Sparkling pastel lavender ballgown with iridescent starlight tulle skirt and pearl hem.',
      clothingOutfit: 'Pastel lavender starlight ballgown.',
      signatureItem: 'Crystal tiara and starlight wand.',
      personality: 'Warm, gracious, inspiring, and generous.',
      characterConsistencyLock: 'FRIENDLY_QUEEN: Strawberry blonde braided hair, crystal tiara, pastel lavender ballgown. Exactly ONE queen.',
      visualPromptAnchor: `FRIENDLY_QUEEN, young beautiful queen, crystal tiara, pastel lavender ballgown, smiling, ${style}, 8k`,
      generationPrompt: `Reference portrait of FRIENDLY_QUEEN, benevolent young queen with crystal tiara and sparkling lavender dress, ${style}`,
      lockedAttributes: ['Strawberry blonde braided hair', 'Crystal tiara', 'Lavender gown'],
      style,
      usageScenes: [11],
      status: 'REFERENCE_READY',
      referenceImageStatus: 'READY',
    });

    // PROPS FOR ABC STORY
    props.push(
      {
        id: 'ABC_ADVENTURE_TRAIN',
        displayName: 'ABC Adventure Train (C)',
        type: 'vehicle',
        description: 'Vibrant multi-colored magical steam train with carriages shaped like alphabet building blocks.',
        appearance: `Charming toy-like steam locomotive with a cherry-red engine, brass chimney emitting puffy musical steam clouds, and pastel alphabet passenger cars in ${style}.`,
        style,
        lockedAttributes: ['Cherry-red engine', 'Brass chimney', 'Alphabet block carriages'],
        generationPrompt: `Reference model for ABC_ADVENTURE_TRAIN, colorful toy steam train with red locomotive and alphabet cars, ${style}, 8k`,
        usageScenes: [1, 2, 3, 4, 12, 13],
        status: 'REFERENCE_READY',
        referenceImageStatus: 'READY',
      },
      {
        id: 'ICE_CREAM_CART',
        displayName: 'Ice Cream Cart (I)',
        type: 'prop',
        description: 'Pastel-striped vintage ice cream cart with golden wheels and decorative awning.',
        appearance: `Vintage wheeled cart painted in pink and cream candy stripes, adorned with a brass bell, glass display case with colorful ice cream tubs, and a whimsical striped parasol in ${style}.`,
        style,
        lockedAttributes: ['Pink and cream candy stripes', 'Golden spoked wheels', 'Brass bell'],
        generationPrompt: `Reference prop sheet of ICE_CREAM_CART, pastel striped ice cream push cart, ${style}, 8k`,
        usageScenes: [8],
        status: 'REFERENCE_READY',
        referenceImageStatus: 'READY',
      },
      {
        id: 'STRAWBERRY_ICE_CREAM',
        displayName: 'Strawberry Ice Cream Cone',
        type: 'prop',
        description: 'Triple-scoop sparkling strawberry and vanilla ice cream in a crisp waffle cone.',
        appearance: `Glistening strawberry pink ice cream cone topped with rainbow sprinkles, chocolate drizzle, and a glowing candied cherry in ${style}.`,
        style,
        lockedAttributes: ['Strawberry pink scoops', 'Waffle cone', 'Rainbow sprinkles'],
        generationPrompt: `Reference image of STRAWBERRY_ICE_CREAM cone with waffle texture, ${style}`,
        usageScenes: [8],
        status: 'REFERENCE_READY',
        referenceImageStatus: 'READY',
      },
      {
        id: 'GIANT_JELLY_PLATFORM',
        displayName: 'Giant Jelly Platform (J)',
        type: 'prop',
        description: 'Translucent, bouncy giant rainbow jelly trampoline sitting in the meadow.',
        appearance: `Huge wobbly mound of glowing translucent cherry and lemon jelly with soft gelatin physics and sugar crystal sparkle in ${style}.`,
        style,
        lockedAttributes: ['Translucent rainbow jelly', 'Bouncy dome shape'],
        generationPrompt: `Prop design for GIANT_JELLY_PLATFORM, translucent wobbly cartoon jelly mound, ${style}`,
        usageScenes: [8],
        status: 'REFERENCE_READY',
        referenceImageStatus: 'READY',
      },
      {
        id: 'RAINBOW_KITE',
        displayName: 'Rainbow Kite (K)',
        type: 'prop',
        description: 'Diamond-shaped silk rainbow kite with streaming satin ribbons.',
        appearance: `Vibrant diamond kite with concentric rainbow silk bands, glowing golden tail ribbons dancing gracefully in the breeze in ${style}.`,
        style,
        lockedAttributes: ['Diamond silk frame', 'Rainbow gradient', 'Trailing ribbons'],
        generationPrompt: `Reference image of RAINBOW_KITE, colorful diamond kite with long ribbons, ${style}`,
        usageScenes: [8],
        status: 'REFERENCE_READY',
        referenceImageStatus: 'READY',
      },
      {
        id: 'MAGIC_BIRD_NEST',
        displayName: 'Magic Bird Nest (N)',
        type: 'prop',
        description: 'Intricately woven golden twig nest cushioned with soft moss and glowing starlight feathers.',
        appearance: `Cozy woven nest made of spun golden willow twigs, lined with emerald moss and soft pastel feathers in ${style}.`,
        style,
        lockedAttributes: ['Golden woven twigs', 'Emerald moss lining'],
        generationPrompt: `Prop reference for MAGIC_BIRD_NEST, cozy golden cartoon bird nest, ${style}`,
        usageScenes: [10],
        status: 'REFERENCE_READY',
        referenceImageStatus: 'READY',
      },
      {
        id: 'CHILD_SLED',
        displayName: 'Child Sled (S)',
        type: 'vehicle',
        description: 'Polished wooden winter sled with bright red runners and brass bell.',
        appearance: `Curved ash-wood snow sled with candy-red steel runners, festive green braided pull rope, and cozy fur blanket in ${style}.`,
        style,
        lockedAttributes: ['Ash wood curved deck', 'Candy red runners'],
        generationPrompt: `Reference model of CHILD_SLED, charming wooden winter snow sled, ${style}`,
        usageScenes: [11],
        status: 'REFERENCE_READY',
        referenceImageStatus: 'READY',
      },
      {
        id: 'QUEENS_MAGIC_CARRIAGE',
        displayName: "Queen's Magic Carriage (Q)",
        type: 'vehicle',
        description: 'Ornate crystal and pastel gold carriage shaped like an open blooming flower.',
        appearance: `Enchanted open carriage sculpted from luminous rose quartz and gold filigree, equipped with glowing starlight lantern wheels in ${style}.`,
        style,
        lockedAttributes: ['Rose quartz and gold filigree', 'Flower petal silhouette'],
        generationPrompt: `Vehicle reference for QUEENS_MAGIC_CARRIAGE, ornate pastel fairy-tale carriage, ${style}`,
        usageScenes: [11],
        status: 'REFERENCE_READY',
        referenceImageStatus: 'READY',
      }
    );

    // ENVIRONMENTS FOR ABC STORY
    environments.push(
      {
        id: 'ABC_ADVENTURE_MEADOW',
        displayName: 'ABC Adventure Meadow',
        type: 'environment',
        description: 'Lush rolling green hills dotted with giant colorful alphabet letter statues and sparkling wildflowers.',
        appearance: `Expansive sun-drenched meadow with velvet emerald grass, oversized glowing 3D alphabet letters rising from flowerbeds, gentle bubbling brook, and sunny blue skies in ${style}.`,
        lighting: 'Warm golden daylight with soft sunbeams and floating pollen particles',
        timeOfDay: 'Bright Sunny Morning',
        colorPalette: ['#4CAF50', '#FFEB3B', '#2196F3', '#FF4081'],
        layout: 'Wide open rolling landscape with curved railway tracks meandering through letter landmarks.',
        style,
        lockedAttributes: ['Emerald rolling hills', 'Giant 3D alphabet statues', 'Curving toy train tracks'],
        generationPrompt: `Environment master concept for ABC_ADVENTURE_MEADOW, lush cartoon rolling hills with giant 3D colorful alphabet letters, sunny day, ${style}, 8k --ar 16:9`,
        usageScenes: [1, 2, 4, 12, 13],
        status: 'REFERENCE_READY',
        referenceImageStatus: 'READY',
      },
      {
        id: 'MAGIC_APPLE_ORCHARD',
        displayName: 'Magic Apple Orchard (A)',
        type: 'environment',
        description: 'Sunlit orchard of giant blooming apple trees laden with glowing ruby-red and golden apples.',
        appearance: `Charming orchard with twisted ancient apple trees, vibrant ruby-red apples with soft golden halos, clover-strewn ground, and warm morning mist in ${style}.`,
        lighting: 'Dappled golden morning sunlight filtering through emerald leaves',
        timeOfDay: 'Morning Golden Hour',
        colorPalette: ['#D32F2F', '#388E3C', '#FFD54F'],
        layout: 'Arched rows of apple trees framing a cobblestone pathway.',
        style,
        lockedAttributes: ['Ruby-red glowing apples', 'Twisted apple trees', 'Cobblestone path'],
        generationPrompt: `Environment reference of MAGIC_APPLE_ORCHARD, cartoon apple orchard with glowing red apples, ${style}, 8k`,
        usageScenes: [2],
        status: 'REFERENCE_READY',
        referenceImageStatus: 'READY',
      },
      {
        id: 'MAGIC_GARDEN',
        displayName: 'Magic Garden & Daisy Meadow (D)',
        type: 'environment',
        description: 'Whimsical garden filled with oversized blooming daisies, dancing butterflies, and musical fountains.',
        appearance: `Vibrant enchanted flower garden with giant daisies taller than the characters, pastel mushroom stools, and dancing stardust in ${style}.`,
        lighting: 'Soft diffused sunny backlight with glowing ambient petals',
        timeOfDay: 'Midday Sunlight',
        colorPalette: ['#FFFFFF', '#FFCA28', '#81C784', '#BA68C8'],
        style,
        lockedAttributes: ['Giant daisies', 'Mushroom seating', 'Dancing butterflies'],
        generationPrompt: `Environment reference for MAGIC_GARDEN, giant cartoon flowers and daisies, ${style}`,
        usageScenes: [3],
        status: 'REFERENCE_READY',
        referenceImageStatus: 'READY',
      },
      {
        id: 'SUNNY_ANIMAL_PARK',
        displayName: 'Sunny Animal Park (P)',
        type: 'environment',
        description: 'Playful sunny sanctuary park with wooden footbridges, picnic clearings, and gentle shaded groves.',
        appearance: `Friendly cartoon nature park with smooth paved paths, wooden gazebos, flower borders, and playful animal signposts in ${style}.`,
        lighting: 'Warm high-key sunlight with soft atmospheric depth',
        timeOfDay: 'Sunny Afternoon',
        style,
        lockedAttributes: ['Wooden bridges', 'Floral borders', 'Playful signposts'],
        generationPrompt: `Environment reference for SUNNY_ANIMAL_PARK, clean sunny cartoon park, ${style}`,
        usageScenes: [4, 8],
        status: 'REFERENCE_READY',
        referenceImageStatus: 'READY',
      },
      {
        id: 'MAGICAL_UNDERWATER_WORLD',
        displayName: 'Magical Underwater World (U / F)',
        type: 'environment',
        description: 'Bioluminescent coral reef with crystalline turquoise water, shimmering sea anemones, and rising bubbles.',
        appearance: `Luminous undersea wonderland with soft pink and cyan coral spires, dancing sea fans, shafts of sunlight piercing turquoise water, and floating star bubbles in ${style}.`,
        lighting: 'Volumetric underwater caustics and glowing bioluminescent corals',
        timeOfDay: 'Daylight Underwater',
        colorPalette: ['#00E5FF', '#FF4081', '#7C4DFF', '#00B0FF'],
        style,
        lockedAttributes: ['Cyan and pink coral spires', 'Dancing light caustics'],
        generationPrompt: `Environment concept for MAGICAL_UNDERWATER_WORLD, colorful glowing cartoon coral reef, ${style}, 8k`,
        usageScenes: [6],
        status: 'REFERENCE_READY',
        referenceImageStatus: 'READY',
      },
      {
        id: 'MAGICAL_SAVANNA',
        displayName: 'Magical Savanna (S / G / L)',
        type: 'environment',
        description: 'Golden grassy savanna with iconic flat-topped acacia trees, warm orange horizon, and gentle watering hole.',
        appearance: `Expansive golden grass plains dotted with majestic umbrella acacia trees, purple distant mountain silhouettes, and warm amber sunbeams in ${style}.`,
        lighting: 'Warm golden hour sunset with rich orange and amber tones',
        timeOfDay: 'Golden Hour Sunset',
        colorPalette: ['#FFA000', '#FF6F00', '#4E342E', '#F57C00'],
        style,
        lockedAttributes: ['Flat-topped umbrella acacia trees', 'Golden savanna grass', 'Warm amber sky'],
        generationPrompt: `Environment reference for MAGICAL_SAVANNA, stylized golden acacia plains at sunset, ${style}, 8k`,
        usageScenes: [7, 8, 9],
        status: 'REFERENCE_READY',
        referenceImageStatus: 'READY',
      },
      {
        id: 'MAGICAL_JUNGLE',
        displayName: 'Magical Jungle (J / M)',
        type: 'environment',
        description: 'Lush emerald rainforest canopy with swinging floral vines, giant monstera leaves, and fruit trees.',
        appearance: `Vibrant tropical jungle with multi-layered green canopy, hanging orchid vines, exotic oversized blossoms, and glowing fireflies in ${style}.`,
        lighting: 'Dappled emerald canopy light with glowing amber sunbeams',
        timeOfDay: 'Late Afternoon',
        style,
        lockedAttributes: ['Emerald monstera leaves', 'Twisting orchid vines', 'Sunbeam shafts'],
        generationPrompt: `Environment reference for MAGICAL_JUNGLE, lush stylized tropical canopy, ${style}`,
        usageScenes: [9],
        status: 'REFERENCE_READY',
        referenceImageStatus: 'READY',
      },
      {
        id: 'MAGICAL_TWILIGHT_FOREST',
        displayName: 'Magical Twilight Forest (T / O)',
        type: 'environment',
        description: 'Enchanted grove of ancient twisted oak trees with glowing blue mushrooms and starry twilight sky.',
        appearance: `Dreamy twilight forest with moss-draped willow branches, bioluminescent cyan and violet mushrooms, soft floating orbs, and crescent moon in ${style}.`,
        lighting: 'Cool indigo twilight with soft cyan and warm lantern glow',
        timeOfDay: 'Enchanted Twilight',
        colorPalette: ['#1A237E', '#311B92', '#00E5FF', '#FFD54F'],
        style,
        lockedAttributes: ['Bioluminescent blue mushrooms', 'Ancient twisted oak', 'Indigo twilight'],
        generationPrompt: `Environment concept for MAGICAL_TWILIGHT_FOREST, glowing twilight fairy forest, ${style}, 8k`,
        usageScenes: [10],
        status: 'REFERENCE_READY',
        referenceImageStatus: 'READY',
      },
      {
        id: 'MAGICAL_SNOW_WORLD',
        displayName: 'Magical Snow World (W / S / P)',
        type: 'environment',
        description: 'Sparkling winter wonderland with frosted pine trees, smooth snow hills, and ice crystal archways.',
        appearance: `Whimsical snow-covered valley with soft powdery snowbanks, candy-cane directional poles, frosted pine groves, and gentle falling snowflakes in ${style}.`,
        lighting: 'Crisp bright winter sunlight with sparkling iridescent snow reflections',
        timeOfDay: 'Bright Winter Morning',
        colorPalette: ['#E0F7FA', '#FFFFFF', '#0288D1', '#FF5252'],
        style,
        lockedAttributes: ['Powder snowbanks', 'Frosted pine trees', 'Iridescent ice crystals'],
        generationPrompt: `Environment master of MAGICAL_SNOW_WORLD, sparkling cartoon winter wonderland, ${style}, 8k`,
        usageScenes: [11],
        status: 'REFERENCE_READY',
        referenceImageStatus: 'READY',
      },
      {
        id: 'FANTASY_RAINBOW_KINGDOM',
        displayName: 'Fantasy Rainbow Kingdom (R / Q)',
        type: 'environment',
        description: 'Majestic castle kingdom atop candy-floss clouds connected by a glowing crystalline rainbow bridge.',
        appearance: `Spectacular floating pastel kingdom with sparkling crystal castle spires, billowing pearlescent clouds, and a sweeping 7-color luminous rainbow bridge in ${style}.`,
        lighting: 'Radiant prismatic starlight with soft pastel lens flares',
        timeOfDay: 'Majestic Starlight Dawn',
        colorPalette: ['#FF80AB', '#B388FF', '#8C9EFF', '#80D8FF', '#A7FFEB', '#FFFF8D', '#FFD180'],
        style,
        lockedAttributes: ['Crystal castle spires', 'Solid glowing rainbow bridge', 'Floating pastel clouds'],
        generationPrompt: `Environment concept for FANTASY_RAINBOW_KINGDOM, whimsical rainbow bridge leading to cloud castle, ${style}, 8k`,
        usageScenes: [11, 12],
        status: 'REFERENCE_READY',
        referenceImageStatus: 'READY',
      },
      {
        id: 'MAGICAL_BEACH',
        displayName: 'Magical Beach (B / Y)',
        type: 'environment',
        description: 'Golden sandy cove with gentle turquoise waves, seashell umbrellas, and a cheerful lighthouse.',
        appearance: `Sunlit tropical beach with soft sparkling golden sand, crystalline turquoise surf, playful sandcastles, and striped beach umbrellas in ${style}.`,
        lighting: 'Brilliant tropical sunlight with warm sand reflections',
        timeOfDay: 'Sunny Midday',
        style,
        lockedAttributes: ['Golden sparkling sand', 'Turquoise gentle surf'],
        generationPrompt: `Environment reference for MAGICAL_BEACH, sunny cartoon tropical beach, ${style}`,
        usageScenes: [12],
        status: 'REFERENCE_READY',
        referenceImageStatus: 'READY',
      }
    );
  } else if (
    lowerText.includes('rohan') ||
    lowerText.includes('photographer') ||
    lowerText.includes('railway station')
  ) {
    // PHOTOGRAPHER MYSTERY PROJECT TEMPLATE
    const rohan: CharacterProfile = {
      id: 'ROHAN_PHOTOGRAPHER',
      displayName: 'Rohan (Photographer)',
      name: 'Rohan',
      type: 'character',
      role: 'Photographer & Lead Protagonist',
      age: '25 years old',
      ageCategory: 'Young Adult',
      species: 'Human',
      gender: 'Male',
      description: 'A 25-year-old urban explorer and photographer with sharp observant eyes, wearing a weathered canvas field jacket.',
      appearance: `25yo Indian young man Rohan with alert observant brown eyes, wind-swept dark brown hair, subtle stubble, wearing an olive-drab canvas field jacket with utility pockets, dark slim-fit denim, and rugged brown leather explorer boots in ${style}.`,
      visualAppearance: `25yo photographer Rohan in olive canvas field jacket, dark jeans, carrying rangefinder camera in ${style}`,
      face: 'Sharp observant dark-brown eyes, thoughtful focused jawline, subtle stubble.',
      hair: 'Wind-swept dark-brown hair with natural texture.',
      skinOrVisualCharacteristics: 'Warm natural skin tone with cinematic amber rim lighting.',
      bodyOrBuild: 'Athletic, lean build suited for agile urban exploration.',
      clothing: 'Olive canvas field jacket with brass snap buttons, dark charcoal t-shirt, rugged indigo denim, brown leather boots.',
      clothingOutfit: 'Olive canvas field jacket, dark denim, brown leather explorer boots.',
      signatureItem: 'Vintage 35mm mechanical rangefinder camera with a worn brown leather neck strap.',
      personality: 'Observant, patient, curious, resourceful, and intuitive.',
      personalityTraits: ['Observant', 'Curious', 'Resourceful', 'Determined'],
      expressions: 'Focused squint through camera viewfinder, surprised widening of eyes upon discovery.',
      voice: `Calm, articulate, and thoughtful baritone delivery in ${lang}.`,
      voiceStyle: `Reflective and captivating in ${lang}.`,
      voiceCharacteristics: 'Warm, resonant, intimate narrator tone.',
      speakingOrSingingRole: 'Lead explorer and narrator of the investigative journey.',
      characterConsistencyLock: 'ROHAN_PHOTOGRAPHER: 25yo man, olive canvas jacket, vintage rangefinder camera on leather strap, wind-swept dark hair, brown boots. Exactly ONE Rohan.',
      visualPromptAnchor: `ROHAN_PHOTOGRAPHER, 25yo man in olive canvas field jacket, dark jeans, vintage 35mm rangefinder camera on neck strap, wind-swept hair, ${style}, volumetric cinematic lighting, 8k render`,
      generationPrompt: `Character reference portrait of ROHAN_PHOTOGRAPHER, 25-year-old male photographer in olive canvas field jacket, vintage 35mm camera, rugged boots, cinematic atmospheric sunset light, ${style}, 8k`,
      lockedAttributes: ['Olive canvas field jacket', 'Vintage 35mm rangefinder camera', 'Dark indigo denim', 'Brown leather boots'],
      style,
      usageScenes: [1, 2, 3, 4, 5, 6, 7, 8],
      status: 'REFERENCE_READY',
      referenceImageStatus: 'READY',
      negativePrompt: 'different clothes, missing camera, extra fingers, blurry face, futuristic suit',
    };
    characters.push(rohan);

    props.push(
      {
        id: 'VINTAGE_RANGEFINDER_CAMERA',
        displayName: 'Vintage 35mm Rangefinder Camera',
        type: 'special_object',
        description: 'Classic chrome-and-black mechanical 35mm rangefinder camera with worn leather neck strap.',
        appearance: `Vintage mechanical camera with brushed silver top plate, black textured grip, 50mm f/1.4 prime lens with amber glass coating, and distressed brown leather strap in ${style}.`,
        style,
        lockedAttributes: ['Brushed chrome top plate', 'Black leatherette grip', 'Distressed brown leather strap'],
        generationPrompt: `Prop reference for VINTAGE_RANGEFINDER_CAMERA, detailed vintage 35mm camera with leather strap, ${style}, 8k`,
        usageScenes: [1, 2, 3, 4, 5, 6, 7, 8],
        status: 'REFERENCE_READY',
        referenceImageStatus: 'READY',
      },
      {
        id: 'MYSTERIOUS_ANTIQUE_PHOTOGRAPH',
        displayName: 'Mysterious Antique Photograph',
        type: 'special_object',
        description: 'Sepia-toned vintage gelatin silver photograph with handwritten dates on the white border.',
        appearance: `Aged 1940s black-and-white photograph with gentle sepia patina, showing the railway station in its glorious heyday, with faded handwritten notes on the bottom margin in ${style}.`,
        style,
        lockedAttributes: ['Sepia vintage gelatin print', 'Handwritten date margin'],
        generationPrompt: `Prop sheet for MYSTERIOUS_ANTIQUE_PHOTOGRAPH, aged black-and-white historical photo with sepia edges, ${style}`,
        usageScenes: [3, 4, 5, 6, 7],
        status: 'REFERENCE_READY',
        referenceImageStatus: 'READY',
      },
      {
        id: 'RUSTY_BRASS_KEY',
        displayName: 'Rusty Antique Brass Key',
        type: 'prop',
        description: 'Heavy ornate iron-and-brass key with intricate clover-shaped bow.',
        appearance: `Heft antique brass key with green verdigris patina, clover-leaf head, and long notched bit in ${style}.`,
        style,
        lockedAttributes: ['Antique brass with green patina', 'Clover-shaped head'],
        generationPrompt: `Prop reference of RUSTY_BRASS_KEY, ornate antique skeleton key with patina, ${style}`,
        usageScenes: [3, 4],
        status: 'REFERENCE_READY',
        referenceImageStatus: 'READY',
      }
    );

    environments.push(
      {
        id: 'ABANDONED_RAILWAY_STATION_SUNSET',
        displayName: 'Abandoned Railway Station at Sunset',
        type: 'environment',
        description: 'Colonial-era weathered railway platform with rusted iron tracks, overgrown ivy, and dramatic sunset rays.',
        appearance: `Historic red-brick train station platform with weathered clocktower frozen at 5:15, overgrown wildflowers between rusty rails, and rich golden-orange sunset god rays piercing broken skylights in ${style}.`,
        lighting: 'Dramatic golden hour sunset with volumetric dust beams and deep orange fill',
        timeOfDay: 'Sunset Magic Hour',
        colorPalette: ['#FF6F00', '#3E2723', '#263238', '#FFB300'],
        style,
        lockedAttributes: ['Historic red brick platform', 'Frozen clocktower', 'Overgrown rails in sunset light'],
        generationPrompt: `Master environment concept of ABANDONED_RAILWAY_STATION_SUNSET, dramatic colonial train platform at golden sunset, ${style}, 8k --ar 16:9`,
        usageScenes: [1, 2, 7, 8],
        status: 'REFERENCE_READY',
        referenceImageStatus: 'READY',
      },
      {
        id: 'LOCKED_STATION_ROOM',
        displayName: 'Locked Station Room & Archives',
        type: 'environment',
        description: 'Dusty forgotten station master office filled with wooden filing cabinets, old telegraphs, and sunbeams.',
        appearance: `Atmospheric vintage office with mahogany roll-top desk, brass telegraph machine, wooden shelving lined with ledger books, and shafts of golden evening light illuminating swirling dust motes in ${style}.`,
        lighting: 'High-contrast directional window sunbeams with rich amber bounce and soft shadows',
        timeOfDay: 'Late Sunset',
        colorPalette: ['#4E342E', '#FFB74D', '#1A237E'],
        style,
        lockedAttributes: ['Roll-top mahogany desk', 'Brass telegraph', 'Atmospheric sunbeam dust motes'],
        generationPrompt: `Environment reference for LOCKED_STATION_ROOM, dusty vintage station office with sunbeams, ${style}, 8k`,
        usageScenes: [3, 4, 5, 6],
        status: 'REFERENCE_READY',
        referenceImageStatus: 'READY',
      }
    );
  } else {
    // GENERAL / UNIVERSAL STORY PARSER (For any topic, story, or genre)
    // Extract characters dynamically
    const primaryName = idea.replace(/^(the|a|an)\s+/i, '').split(/\s+/)[0] || 'Protagonist';
    
    characters.push({
      id: toStableId('CHAR_LEAD', `${primaryName}_HERO`),
      displayName: `${primaryName} (Lead Protagonist)`,
      name: primaryName,
      type: 'character',
      role: 'Lead Protagonist',
      age: settings.videoType === 'Kids' ? '8 years old' : '26 years old',
      ageCategory: settings.videoType === 'Kids' ? 'Child' : 'Young Adult',
      species: 'Human',
      gender: 'Unspecified',
      description: `Charismatic lead protagonist for "${idea}" in ${style} aesthetic.`,
      appearance: `Distinctive protagonist ${primaryName} with expressive features, signature tailored outfit matching "${idea}", volumetric lighting in ${style}.`,
      visualAppearance: `${primaryName} in signature attire matching ${idea} in ${style}`,
      face: 'Bright expressive eyes, confident smile, distinct silhouette.',
      hair: 'Styled hair with signature character highlights.',
      clothing: `Tailored outfit designed specifically for ${idea} in ${style}.`,
      clothingOutfit: 'Signature thematic adventure attire.',
      signatureItem: 'Signature story emblem and journal.',
      personality: 'Curious, perceptive, courageous, and inspiring.',
      characterConsistencyLock: `${primaryName.toUpperCase()}_HERO: Signature outfit, hairstyle, facial structure locked across all scenes. Exactly ONE protagonist.`,
      visualPromptAnchor: `${primaryName}, protagonist for "${idea}", ${style}, volumetric cinematic lighting, 8k render`,
      generationPrompt: `Master character portrait of ${primaryName}, protagonist for "${idea}", ${style}, 8k`,
      lockedAttributes: ['Signature thematic outfit', 'Consistent facial structure'],
      style,
      usageScenes: [1, 2, 3, 4, 5],
      status: 'REFERENCE_READY',
      referenceImageStatus: 'READY',
    });

    // Extract Props for General Story
    props.push({
      id: toStableId('PROP', `${primaryName}_KEY_ARTIFACT`),
      displayName: `Primary Artifact of ${idea}`,
      type: 'special_object',
      description: `Central artifact or device driving the narrative of "${idea}".`,
      appearance: `Intricately designed thematic artifact with glowing accents in ${style}.`,
      style,
      lockedAttributes: ['Consistent metallic finish', 'Signature glowing emblem'],
      generationPrompt: `Prop reference for primary artifact of ${idea}, ${style}, 8k`,
      usageScenes: [1, 2, 3, 4, 5],
      status: 'REFERENCE_READY',
      referenceImageStatus: 'READY',
    });

    // Extract Environments for General Story
    environments.push(
      {
        id: toStableId('ENV', `${idea}_PRIMARY_REALM`),
        displayName: `${idea} — Primary Setting`,
        type: 'environment',
        description: `Grand establishing environment for "${idea}".`,
        appearance: `Expansive cinematic world of "${idea}" with rich atmospheric depth, volumetric lighting, and iconic visual landmarks in ${style}.`,
        lighting: 'Cinematic golden hour lighting with volumetric god rays',
        timeOfDay: 'Golden Hour',
        style,
        lockedAttributes: ['Signature architectural silhouette', 'Volumetric atmosphere'],
        generationPrompt: `Environment master concept for "${idea}", ${style}, 8k --ar 16:9`,
        usageScenes: [1, 2, 3, 4, 5],
        status: 'REFERENCE_READY',
        referenceImageStatus: 'READY',
      },
      {
        id: toStableId('ENV', `${idea}_INNER_SANCTUM`),
        displayName: `${idea} — Inner Sanctum`,
        type: 'environment',
        description: `Focal interior location where core story revelations occur.`,
        appearance: `Atmospheric chamber with glowing artifacts and dramatic architectural details in ${style}.`,
        lighting: 'Bioluminescent ambient glow with soft golden rim lights',
        timeOfDay: 'Dramatic Twilight',
        style,
        lockedAttributes: ['Glowing central altar', 'Ornate pillars'],
        generationPrompt: `Environment reference for inner sanctum of "${idea}", ${style}, 8k`,
        usageScenes: [3, 4],
        status: 'REFERENCE_READY',
        referenceImageStatus: 'READY',
      }
    );
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

    // Determine Environment strictly from registered list
    const envObj = registeredEnvs[i % registeredEnvs.length] || registeredEnvs[0];
    const envId = envObj?.id || 'PRIMARY_ENVIRONMENT';
    const envDisplayName = envObj?.displayName || envObj?.description || envId;

    // Determine Characters for this scene strictly from registered list
    let sceneCharIds: string[] = [];
    if (registeredChars.length > 0) {
      // Main hero is always present in key scenes
      const leadChar = registeredChars[0];
      if (leadChar) sceneCharIds.push(leadChar.id);

      // Rotate secondary characters based on scene
      if (registeredChars.length > 1) {
        const secondaryIdx = 1 + (i % (registeredChars.length - 1));
        const secChar = registeredChars[secondaryIdx];
        if (secChar && !sceneCharIds.includes(secChar.id)) {
          sceneCharIds.push(secChar.id);
        }
      }
      // Add third character for climactic scenes
      if ((i === Math.floor(actualCount / 2) || isLast) && registeredChars.length > 2) {
        const thirdChar = registeredChars[2];
        if (thirdChar && !sceneCharIds.includes(thirdChar.id)) {
          sceneCharIds.push(thirdChar.id);
        }
      }
    }

    // Determine Props for this scene strictly from registered list
    const scenePropIds: string[] = [];
    if (registeredProps.length > 0) {
      const propForScene = registeredProps[i % registeredProps.length];
      if (propForScene) {
        scenePropIds.push(propForScene.id);
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

    if (isFirst) {
      startingAction = `${sceneCharIds[0] || 'The protagonist'} stands ready at the edge of ${envDisplayName}.`;
      finalAction = `${sceneCharIds[0] || 'The protagonist'} gestures forward, inviting everyone onto the path.`;
      actionDesc = `${startingAction} The morning light illuminates the path. ${finalAction}`;
    } else {
      if (newCharactersIntroduced.length > 0) {
        startingAction = `Continuing from Scene ${sceneNum - 1}: ${newCharactersIntroduced.join(', ')} is already visible in ${envDisplayName} before the main group approaches.`;
      } else {
        startingAction = `Continuing smoothly from Scene ${sceneNum - 1}: ${sceneCharIds.join(' and ')} continue their synchronized movement.`;
      }

      if (scenePropIds.length > 0) {
        startingAction += ` ${scenePropIds[0]} is already stationed in the setting as characters interact with it naturally.`;
      }

      finalAction = `${sceneCharIds.join(' and ')} complete the sequence with joyful expressions, looking toward the next vista.`;
      actionDesc = `${startingAction} Engaging rhythmic interaction in ${envDisplayName}. ${finalAction}`;
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

    // Lyric lines (up to 3 lines per scene)
    const lyricLines: string[] = [
      `♪ Line ${sceneNum}A: Journey through the wonder of ${envDisplayName} ♪`,
      `♪ Line ${sceneNum}B: With joyful steps and friends so true ♪`,
      `♪ Line ${sceneNum}C: Singing together all the way through ♪`,
    ];

    const sTitle = `Scene ${sceneNum}: ${envDisplayName}`;
    const dialogue = ctx.isNoSpoken ? 'NONE' : `Speaker: ${sceneCharIds[0] || 'Lead'}\nDialogue: "${lyricLines[0]}"`;

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
      scenePurpose: `Advance story progression and rhyme phrase in Scene ${sceneNum}.`,
      aiVideoPrompt: `Cinematic ${aspect}, ${style}, "${sTitle}". Action: ${actionDesc}. Environment: ${envDisplayName}. Characters: Exactly ONE of each: ${sceneCharIds.join(', ')}. Props: ${scenePropIds.length > 0 ? scenePropIds.join(', ') : 'NONE'}. 8K render --ar ${aspect}`,
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

    // Music and Singing Lock
    const musicAndSingingText = `Project Music Lock: ${mLock.songStyle}, Tempo: ${mLock.tempo}, Key: ${mLock.key}. Singer: ${mLock.singer}. Vocalist Voice Lock: ${vLock.voiceId} (${vLock.ageImpression}, ${vLock.tone}, ${vLock.pronunciation}). Current lyrics are the next musical phrase of the SAME continuous song.`;

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
