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
 * In AI Auto mode: assigns organic, pacing-aware durations (hook is punchy, climax is longer, resolution is balanced).
 * In Manual mode: allocates user-specified durations evenly with exact remainder reconciliation.
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
  // Weights: [Opening Hook / Setup: 0.8, Rising Action: 1.0, Turning Point: 1.1, Climax: 1.3, Resolution: 0.8]
  const baseWeights = [0.8, 1.0, 1.05, 1.1, 1.3, 1.25, 0.9, 0.8];
  const weights: number[] = [];
  for (let i = 0; i < count; i++) {
    if (i === 0) {
      weights.push(0.8); // Punchy hook
    } else if (i === count - 1) {
      weights.push(0.85); // Clean resolution
    } else if (i === count - 2) {
      weights.push(1.35); // Dramatic climax
    } else if (i === Math.floor(count / 2)) {
      weights.push(1.15); // Core turning point
    } else {
      const normalizedIdx = Math.floor((i / count) * baseWeights.length);
      weights.push(baseWeights[normalizedIdx % baseWeights.length] || 1.0);
    }
  }

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const rawDurations = weights.map((w) => Math.max(3, Math.round((w / totalWeight) * totalSec)));
  
  // Reconcile rounding differences so total exactly equals totalSec
  let currentSum = rawDurations.reduce((a, b) => a + b, 0);
  let diff = totalSec - currentSum;
  let adjustIndex = count - 2 >= 0 ? count - 2 : 0; // adjust climax or first

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
// FEATURE 1 & 2: UNIVERSAL STORY ENGINE
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
      sourceText: rawStory,
      fullStory: rawStory,
      exactStory: rawStory,
      summary: `Original authentic story provided by user: "${rawStory.slice(0, 180)}..."`,
      progression: progression.length > 0 ? progression : [
        {
          act: 'Act 1: Complete Narrative',
          title: 'User Story Narrative',
          summary: rawStory,
          characters: ['Protagonist'],
          keyActions: 'Follows user story narrative sequence strictly.',
        },
      ],
      charactersInvolved: ['Story Characters'],
      keyThemes: [settings.videoType || 'Story', style, lang],
      tone: settings.tone,
      pacingNote: 'Pacing preserved exactly per user original text.',
    };
  }

  // Mode B1: REFINED USER STORY
  if (storyMode === 'user_refined' && rawStory) {
    const refinedStory = refineUserStoryText(rawStory, idea, settings);
    const paragraphs = refinedStory.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

    const progression: StoryProgressionBeat[] = paragraphs.map((para, i) => {
      const actNumber = i + 1;
      let actName = `Act ${actNumber}: Progression`;
      if (i === 0) actName = 'Act 1: The Beginning & Visual Hook';
      else if (i === 1) actName = 'Act 2: The Rising Discovery';
      else if (i === Math.floor(paragraphs.length / 2)) actName = 'Act 3: The Core Turning Point';
      else if (i === paragraphs.length - 2) actName = 'Act 4: The Dramatic Climax';
      else if (i === paragraphs.length - 1) actName = `Act ${actNumber}: The Resolution & Meaningful Impact`;

      return {
        act: actName,
        title: `Scene Progression Beat ${actNumber}`,
        summary: para.slice(0, 180) + (para.length > 180 ? '...' : ''),
        characters: ['Story Protagonist', 'Key Characters'],
        keyActions: para.slice(0, 140),
        dialogueSnippet: para.includes('"') ? para.match(/"([^"]+)"/)?.[0] : undefined,
      };
    });

    return {
      storyMode: 'user_refined',
      storySource: 'user_story',
      sourceText: rawStory,
      refinedStory,
      fullStory: refinedStory,
      summary: `Refined cinematic adaptation of user story, polished for high-retention storytelling while preserving authentic characters and plot.`,
      progression,
      charactersInvolved: ['Protagonist', 'Supporting Characters'],
      keyThemes: [settings.videoType || 'Cinematic Story', settings.tone, style, lang],
      tone: settings.tone,
      pacingNote: 'Enhanced cinematic pacing with escalating dramatic tension.',
    };
  }

  // Mode A: AI CREATE STORY (Generic and Universal for ANY topic)
  const aiGeneratedStory = createUniversalStoryText(idea, settings, characterInstructions);
  const paragraphs = aiGeneratedStory.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  const progression: StoryProgressionBeat[] = paragraphs.map((para, i) => {
    const actNumber = i + 1;
    let actName = `Act ${actNumber}: Narrative Beat`;
    if (i === 0) actName = 'Act 1: The Beginning & Visual Hook';
    else if (i === 1) actName = 'Act 2: The Rising Discovery';
    else if (i === 2) actName = 'Act 3: The Core Turning Point';
    else if (i === 3) actName = 'Act 4: The Dramatic Climax';
    else if (i === 4 || i === paragraphs.length - 1) actName = 'Act 5: The Resolution & Legacy';

    return {
      act: actName,
      title: `Story Movement ${actNumber}`,
      summary: para.slice(0, 200) + (para.length > 200 ? '...' : ''),
      characters: ['Primary Character', 'Companion / Environment'],
      keyActions: para.slice(0, 150),
      dialogueSnippet: para.includes('"') ? para.match(/"([^"]+)"/)?.[0] : undefined,
    };
  });

  return {
    storyMode: 'ai_create',
    storySource: 'ai_create',
    fullStory: aiGeneratedStory,
    summary: `Complete original AI-crafted story for "${idea}", tailored for ${settings.tone} tone and ${style} visual aesthetic in ${lang}.`,
    progression,
    charactersInvolved: ['Protagonist', 'Key Companion', 'Antagonist / Catalyst'],
    keyThemes: [settings.videoType || 'Story', settings.tone, style, 'Visual Storytelling'],
    tone: settings.tone,
    pacingNote: `Structured for optimal YouTube viewer retention across ${settings.targetDuration || 'full duration'}.`,
  };
}

function refineUserStoryText(raw: string, idea: string, settings: VideoSettings): string {
  const lang = settings.language || 'English';
  const isHindi = lang.toLowerCase().includes('hindi');
  
  // Polish paragraphs for cinematic clarity while preserving all original text meaning
  const paragraphs = raw.split(/\n\s*\n|\n/).filter((p) => p.trim().length > 0);
  if (paragraphs.length >= 3) {
    return paragraphs
      .map((p, idx) => {
        let cleaned = p.trim();
        if (!cleaned.endsWith('.') && !cleaned.endsWith('!') && !cleaned.endsWith('?')) {
          cleaned += '.';
        }
        return cleaned;
      })
      .join('\n\n');
  }

  // If provided as one dense block, divide logically into 5 cinematic story beats
  const sentences = raw.match(/[^.!?]+[.!?]+/g) || [raw];
  const chunkCount = Math.min(5, Math.max(3, Math.ceil(sentences.length / 2)));
  const chunkSize = Math.ceil(sentences.length / chunkCount);
  const chunks: string[] = [];
  for (let i = 0; i < sentences.length; i += chunkSize) {
    chunks.push(sentences.slice(i, i + chunkSize).join(' ').trim());
  }

  return chunks.filter(Boolean).join('\n\n');
}

function createUniversalStoryText(idea: string, settings: VideoSettings, characterInstructions?: string): string {
  const lang = settings.language || 'English';
  const isHindi = lang.toLowerCase().includes('hindi');
  const style = settings.visualStyle || '3D Cartoon';
  const tone = settings.tone || 'Exciting';

  if (isHindi) {
    return `एक समय की बात है, "${idea}" की इस अनूठी दुनिया में एक नई सुबह की शुरुआत होती है। चारों ओर एक रहस्यमयी और मनमोहक वातावरण फैला हुआ है, जहाँ हर दृश्य में रोमांच और कौतूहल की झलक मिलती है।\n\nजैसे-जैसे यात्रा आगे बढ़ती है, मुख्य पात्रों के सामने एक अप्रत्याशित चुनौती और जादुई संकेत प्रकट होता है। वे साहस और आपसी समझ के साथ उस रास्ते पर आगे कदम बढ़ाते हैं, जहाँ हर मोड़ पर नई खोज उनका इंतज़ार कर रही होती है।\n\nकहानी के इस महत्वपूर्ण मोड़ पर, एक गहरा रहस्य सामने आता है जो सब कुछ बदल कर रख देता है। परिस्थितियाँ कठिन हो जाती हैं और उन्हें अपनी असली शक्ति और दृढ़ संकल्प का परिचय देना पड़ता है।\n\nचरम संघर्ष और रोमांच के क्षण में, वे मिलकर पूरी लगन और बहादुरी के साथ इस चुनौती का सामना करते हैं। अद्भुत दृश्यों और चमत्कारी ऊर्जा के बीच जीत हासिल होती है।\n\nअंत में, चारों ओर शांति और उत्सव का माहौल छा जाता है। यह कहानी हमें सिखाती है कि सच्ची लगन, एकता और साहस से हर मुश्किल आसान हो जाती है।`;
  }

  return `In the vibrant world of "${idea}", a monumental journey begins. The morning air is filled with palpable wonder, and every detail of the environment hints at an ancient secret waiting to be uncovered.\n\nAs the expedition advances, unexpected signals draw our characters deeper into uncharted territory. Guided by intuition and shared courage, they navigate intricate obstacles and uncover visual clues that illuminate the path ahead.\n\nAt the central turning point, the true stakes of the quest are revealed. A sudden shift in the environment forces a critical decision, testing the bonds of trust and determination that hold the group together.\n\nIn a climactic surge of action and visual splendor, the characters confront the ultimate challenge. Leveraging their distinct strengths and steadfast resolve, they turn the tide in an exhilarating display of triumph.\n\nWith balance restored and the quest fulfilled, a radiant dawn breaks across the horizon. Their extraordinary journey leaves an indelible mark of inspiration, unity, and timeless wonder.`;
}

// -------------------------------------------------------------
// FEATURE 5: DYNAMIC UNIVERSAL CHARACTER EXTRACTION
// -------------------------------------------------------------

export function generateCharactersUniversal(
  idea: string,
  settings: VideoSettings,
  fullStory?: string,
  characterInstructions?: string
): CharacterProfile[] {
  const combinedText = `${idea} ${fullStory || ''} ${characterInstructions || ''}`;
  const lowerText = combinedText.toLowerCase();
  const style = settings.visualStyle || '3D Cartoon';
  const lang = settings.language || 'English';
  const isHindi = lang.toLowerCase().includes('hindi');

  // Specific high-frequency cultural templates if explicitly mentioned
  if (
    lowerText.includes('krishna') ||
    lowerText.includes('balram') ||
    lowerText.includes('vrindavan') ||
    lowerText.includes('kanha')
  ) {
    return [
      {
        id: 'char-krishna',
        name: 'Krishna',
        characterType: 'Human Boy',
        role: 'Protagonist / Divine Hero',
        species: 'Human / Divine Deity',
        age: '8-10 years old',
        ageOrSpecies: '8-10 years old',
        gender: 'Boy',
        appearance: `Radiant, charming 8-year-old Indian boy with soft luminous dark-blue skin, sparkling lotus-shaped eyes, and curly raven-black hair tied in a graceful topknot adorned with an iridescent peacock feather in ${style}.`,
        visualAppearance: `Young 8yo dark-blue skinned Indian boy Krishna with peacock feather in curly topknot, yellow silk dhoti, golden flute in ${style}.`,
        face: 'Charming effulgent smile, bright lotus eyes filled with warmth and playful intelligence.',
        hair: 'Curly jet-black hair tied in an ornate topknot with a fresh peacock feather and pearl hairband.',
        skinOrVisualCharacteristics: 'Luminous dark-blue (Megha-shyam) complexion emitting a gentle golden divine aura.',
        bodyOrBuild: 'Slender, graceful youth build with joyful and nimble kinetic movements.',
        clothing: 'Vibrant pitambari golden-yellow silk dhoti with an embroidered red border and jeweled golden waistband.',
        clothingOutfit: 'Pitambari golden-yellow silk dhoti, ruby-encrusted golden belt, jasmine garland.',
        accessories: 'Handcrafted golden bamboo flute (Bansuri), peacock feather, delicate pearl necklace, golden armlets.',
        signatureItem: 'Golden bamboo flute (Bansuri) and peacock feather.',
        personality: 'Playful, wise, compassionate, fearless, and deeply loving.',
        personalityTraits: ['Playful', 'Wise', 'Compassionate', 'Courageous'],
        expressions: 'Mischievous twinkle in his eye, radiant benevolent smile, serene flute-playing gaze.',
        voice: `Sweet, melodious, and reassuring Indian youth tone speaking pure ${lang}.`,
        voiceStyle: `Melodious and warm in ${lang}.`,
        speakingStyle: 'Affectionate, uplifting, and poetic Indian youth tone.',
        characterPurpose: 'Guides the adventure, protects Vrindavan, and spreads joyful harmony.',
        visualPromptAnchor: `Krishna, 8yo Indian boy, luminous dark-blue skin, lotus eyes, peacock feather in curly hair topknot, yellow silk dhoti, golden flute in hand, ${style}, volumetric lighting, 8k render`,
        characterIdentityLock: 'Krishna — Human Boy (8-10yo Divine Protagonist): luminous dark-blue skin, peacock feather in curly hair, pitambari yellow silk dhoti, golden bamboo flute.',
      },
      {
        id: 'char-balram',
        name: 'Balram',
        characterType: 'Human Boy',
        role: 'Elder Brother / Protector',
        species: 'Human / Divine Deity',
        age: '10-12 years old',
        ageOrSpecies: '10-12 years old',
        gender: 'Boy',
        appearance: `Strong, protective 11-year-old Indian boy with a fair glowing complexion, athletic build, deep protective dark eyes, and lustrous black hair tied in an ornate warrior knot in ${style}.`,
        visualAppearance: `11yo fair-complexioned Indian youth Balram with royal indigo-blue dhoti, silver wrist cuffs, miniature silver plough in ${style}.`,
        face: 'Broad noble jaw, affectionate protective gaze, hearty brotherly smile.',
        hair: 'Silky raven hair tied in a secure traditional warrior topknot with silver beads.',
        skinOrVisualCharacteristics: 'Radiant fair golden complexion with strong athletic glow.',
        bodyOrBuild: 'Stout, broad-shouldered, strong protective youth build.',
        clothing: 'Royal indigo-blue silk dhoti with golden brocade trim and a silver silk shoulder sash.',
        clothingOutfit: 'Royal indigo-blue silk dhoti, silver shoulder sash, silver wrist cuffs.',
        accessories: 'Miniature silver ceremonial plough (Hala), silver torque necklace, golden arm cuffs.',
        signatureItem: 'Silver ceremonial plough and silver wrist cuffs.',
        personality: 'Protective, honest, dependable, hearty, and steadfast brother.',
        personalityTraits: ['Protective', 'Loyal', 'Strong', 'Dependable'],
        expressions: 'Reassuring smile, alert vigilant stance, brotherly pride.',
        voice: `Resonant, hearty, protective boyish baritone speaking pure ${lang}.`,
        voiceStyle: `Hearty and protective in ${lang}.`,
        speakingStyle: 'Direct, loyal, hearty, and grounded.',
        characterPurpose: 'Stands as unyielding guardian and loyal companion alongside Krishna.',
        visualPromptAnchor: `Balram, 11yo Indian boy, fair complexion, noble warrior topknot, royal indigo silk dhoti, silver ceremonial plough, ${style}, cinematic lighting, 8k render`,
        characterIdentityLock: 'Balram — Human Boy (10-12yo Loyal Brother): fair golden complexion, warrior topknot, indigo silk dhoti, silver plough.',
      },
    ];
  }

  // DYNAMIC EXTRACTION: Parse characters from the story text or title
  const detectedCharacters = extractCharactersFromStory(combinedText, idea, settings);
  if (detectedCharacters.length > 0) {
    return detectedCharacters;
  }

  // Fallback: Smart Title-Derived Protagonist
  const cleanTitle = idea.replace(/^(the|a|an)\s+/i, '').trim();
  const primaryName = cleanTitle.split(/\s+/)[0] || 'Protagonist';

  return [
    {
      id: 'char-protagonist',
      name: primaryName,
      characterType: settings.videoType === 'Kids' ? 'Human Child' : 'Human Adult',
      role: 'Lead Protagonist',
      species: 'Human',
      age: settings.videoType === 'Kids' ? '8 years old' : '26 years old',
      ageOrSpecies: settings.videoType === 'Kids' ? '8 years old' : '26 years old',
      gender: 'Unspecified',
      appearance: `Distinctive and charismatic protagonist designed specifically for "${idea}" in ${style} aesthetic with sharp visual contrast and expressive facial features.`,
      visualAppearance: `Protagonist ${primaryName} in tailored thematic attire matching "${idea}" in ${style}.`,
      face: 'Bright expressive eyes, confident and curious smile, distinct character silhouette.',
      hair: 'Styled hair with signature thematic accessory matching the project palette.',
      skinOrVisualCharacteristics: 'Warm cinematic rim lighting with expressive facial proportions.',
      bodyOrBuild: 'Balanced, energetic silhouette with natural kinetic posture.',
      clothing: `Tailored signature outfit styled with distinctive thematic accents matching ${idea}.`,
      clothingOutfit: 'Tailored signature outfit with themed utility belt.',
      accessories: 'Signature thematic prop or medallion.',
      signatureItem: 'Signature story medallion and journal.',
      personality: 'Curious, perceptive, articulate, and inspiring.',
      personalityTraits: ['Curious', 'Perceptive', 'Brave', 'Inspiring'],
      expressions: 'Engaged curiosity, bold determination, and joyful discovery.',
      voice: `${settings.tone} delivery in ${lang}.`,
      voiceStyle: `Clear, captivating delivery in ${lang}.`,
      speakingStyle: 'Engaging, rhythmic, and clear.',
      characterPurpose: `Anchor viewer engagement and drive the narrative of "${idea}".`,
      visualPromptAnchor: `${primaryName}, protagonist for "${idea}", ${style}, signature attire, volumetric cinematic lighting, photorealistic 8k render`,
      characterIdentityLock: `${primaryName} — Protagonist (${settings.videoType === 'Kids' ? '8yo' : '26yo'}): signature styled hair, themed outfit, high contrast aesthetic in ${style}.`,
    },
  ];
}

function extractCharactersFromStory(text: string, idea: string, settings: VideoSettings): CharacterProfile[] {
  const style = settings.visualStyle || '3D Cartoon';
  const lang = settings.language || 'English';
  const rawItems: { name: string; descriptor: string; explicitAge?: string; explicitType?: string }[] = [];

  const lines = text.split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // 1. Explicit bullet patterns: "- 7-year-old child: Leo" or "- Animal character: Luna"
    const bulletMatch = line.match(/^[-*•]\s*(?:([0-9]+[\s-]*year[\s-]*old|[a-zA-Z\s]+(?:character|child|adult|creature|robot|teen|elder)))\s*[:\-]\s*([A-Z][a-zA-Z0-9\s]+?)(?:\s*[\(\,]\s*([^\)\n]+)\)?)?$/i);
    if (bulletMatch) {
      const typeDesc = bulletMatch[1].trim();
      const charName = bulletMatch[2].trim();
      const extra = bulletMatch[3]?.trim() || '';
      rawItems.push({
        name: charName,
        descriptor: `${typeDesc}${extra ? ', ' + extra : ''}`,
      });
      continue;
    }

    // 2. Generic bullet with descriptor only: "- 7-year-old child" or "- Animal character"
    const genericBulletMatch = line.match(/^[-*•]\s*([0-9]+[\s-]*year[\s-]*old\s+[a-zA-Z]+|[a-zA-Z\s]+(?:character|creature|robot|teenager|child|adult|elder))/i);
    if (genericBulletMatch) {
      const desc = genericBulletMatch[1].trim();
      // Generate clean name from descriptor
      let generatedName = desc.replace(/character/i, '').trim();
      generatedName = generatedName.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      if (generatedName.length > 2) {
        rawItems.push({
          name: generatedName,
          descriptor: desc,
        });
        continue;
      }
    }

    // 3. Explicit prefix "Character 1: Name" or "Main Character: Name"
    const explicitMatch = line.match(/(?:character\s*[0-9]*\s*[:\-]|main character\s*[:\-]|\bname\s*[:\-])\s*([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)?)(?:\s*[\(\[\,\-]\s*([^\]\)\n]+))?/i);
    if (explicitMatch && explicitMatch[1]) {
      const name = explicitMatch[1].trim();
      if (name.length > 1 && !['The', 'And', 'With', 'Scene', 'Act', 'Video', 'YouTube'].includes(name)) {
        rawItems.push({ name, descriptor: explicitMatch[2]?.trim() || 'Key Story Character' });
        continue;
      }
    }

    // 4. Natural intro sentence: "Rohan is a 25-year-old photographer who..." or "Maya is an 8-year-old girl..."
    const introSentenceMatch = line.match(/([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\s+(?:is|was)\s+(?:a|an)\s+([0-9]+[\s-]*year[\s-]*old\s+[a-zA-Z\s]+|[a-zA-Z\s]+?)(?:\s+(?:who|with|visiting|exploring|living|working|\.|\,))/i);
    if (introSentenceMatch && introSentenceMatch[1] && introSentenceMatch[2]) {
      const name = introSentenceMatch[1].trim();
      const desc = introSentenceMatch[2].trim();
      if (!['Once', 'There', 'This', 'Here', 'What', 'When', 'Deep'].includes(name)) {
        rawItems.push({ name, descriptor: desc });
      }
    }

    // 5. Natural comma intro: "Rohan, a 25-year-old photographer, visits..." or "Maya, an 8-year-old girl with braided hair..."
    const commaIntroMatch = line.match(/([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\s*,\s*(?:a|an)\s+([0-9]+[\s-]*year[\s-]*old\s+[a-zA-Z\s]+|[a-zA-Z\s]+?)(?:,|\s+who|\s+with|\s+and)/i);
    if (commaIntroMatch && commaIntroMatch[1] && commaIntroMatch[2]) {
      const name = commaIntroMatch[1].trim();
      const desc = commaIntroMatch[2].trim();
      if (!['Once', 'There', 'This', 'Here', 'What', 'When', 'Deep'].includes(name)) {
        rawItems.push({ name, descriptor: desc });
      }
    }

    // 6. Named entity pattern: "a <age>-year-old <role> named <Name>" or "a <role> named <Name>"
    const namedMatch = line.match(/(?:a|an)\s+([0-9]+[\s-]*year[\s-]*old\s+[a-zA-Z\s]+|[a-zA-Z\s]+?)\s+named\s+([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)?)/i);
    if (namedMatch && namedMatch[2]) {
      rawItems.push({ name: namedMatch[2].trim(), descriptor: namedMatch[1].trim() });
    }
  }

  // 7. Check high-concept phrases in Idea / Title if still empty
  if (rawItems.length === 0) {
    const lowerIdea = idea.toLowerCase();
    if (lowerIdea.includes('boy') && lowerIdea.includes('elephant')) {
      rawItems.push({ name: 'Aarav', descriptor: '7-year-old curious Indian boy' });
      rawItems.push({ name: 'Gajraj', descriptor: 'Gentle magical talking elephant with glowing tusks' });
    } else if (lowerIdea.includes('robot') && lowerIdea.includes('teen')) {
      rawItems.push({ name: 'Unit-7X', descriptor: 'Sentient companion robot' });
      rawItems.push({ name: 'Kai', descriptor: '16-year-old teenage technician' });
    } else if (lowerIdea.includes('animal') || lowerIdea.includes('creature')) {
      rawItems.push({ name: 'Luna', descriptor: 'Graceful wild animal companion' });
      rawItems.push({ name: 'Zephyr', descriptor: 'Luminous winged fantasy creature' });
    }
  }

  // Deduplicate by name
  const seen = new Set<string>();
  const uniqueItems = rawItems.filter((item) => {
    const key = item.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (uniqueItems.length === 0) {
    return [];
  }

  return uniqueItems.slice(0, 4).map((item, idx) => {
    const isLead = idx === 0;
    const desc = item.descriptor || 'Character in ' + idea;
    const lowerDesc = desc.toLowerCase();
    const lowerName = item.name.toLowerCase();

    // Age detection
    const ageMatch = desc.match(/([0-9]+)[\s-]*year[\s-]*old/i) || text.match(new RegExp(`${item.name}[^.]*?([0-9]+)[\\s-]*year[\\s-]*old`, 'i'));
    const exactAgeNum = ageMatch ? parseInt(ageMatch[1], 10) : undefined;

    const isChild = (exactAgeNum !== undefined && exactAgeNum <= 12) || lowerDesc.includes('boy') || lowerDesc.includes('girl') || lowerDesc.includes('child') || lowerDesc.includes('kid') || lowerName.includes('child');
    const isTeen = (exactAgeNum !== undefined && exactAgeNum >= 13 && exactAgeNum <= 19) || lowerDesc.includes('teen') || lowerDesc.includes('teenager');
    const isElder = (exactAgeNum !== undefined && exactAgeNum >= 60) || lowerDesc.includes('elder') || lowerDesc.includes('grand') || lowerDesc.includes('old') || lowerDesc.includes('wise') || lowerDesc.includes('guru') || lowerDesc.includes('retired');
    const isAnimal = lowerDesc.includes('animal') || lowerDesc.includes('elephant') || lowerDesc.includes('lion') || lowerDesc.includes('leopard') || lowerDesc.includes('bunny') || lowerDesc.includes('bear') || lowerDesc.includes('dog') || lowerDesc.includes('cat') || lowerDesc.includes('owl') || lowerDesc.includes('bird');
    const isRobot = lowerDesc.includes('robot') || lowerDesc.includes('ai') || lowerDesc.includes('android') || lowerDesc.includes('cyborg') || lowerDesc.includes('synthetic') || lowerDesc.includes('unit-');
    const isFantasy = lowerDesc.includes('fantasy') || lowerDesc.includes('creature') || lowerDesc.includes('sprite') || lowerDesc.includes('dragon') || lowerDesc.includes('fairy') || lowerDesc.includes('monster') || lowerDesc.includes('magical');

    let charType = 'Human Adult';
    let age = exactAgeNum ? `${exactAgeNum} years old` : '28 years old';
    let species = 'Human';
    let gender = lowerDesc.includes('female') || lowerDesc.includes('girl') || lowerDesc.includes('woman') ? 'Female' : lowerDesc.includes('male') || lowerDesc.includes('boy') || lowerDesc.includes('man') ? 'Male' : 'Unspecified';

    if (isChild) {
      charType = gender === 'Female' ? 'Human Girl' : gender === 'Male' ? 'Human Boy' : 'Human Child';
      age = exactAgeNum ? `${exactAgeNum} years old` : '8 years old';
    } else if (isTeen) {
      charType = 'Human Teen';
      age = exactAgeNum ? `${exactAgeNum} years old` : '16 years old';
    } else if (isElder) {
      charType = 'Elder / Mentor';
      age = exactAgeNum ? `${exactAgeNum} years old` : '68 years old';
    } else if (isAnimal) {
      charType = 'Animal / Creature';
      species = 'Animal';
      age = exactAgeNum ? `${exactAgeNum} years old` : 'Adult Animal';
    } else if (isRobot) {
      charType = 'Robot / AI Entity';
      species = 'Synthetic / AI';
      age = 'Ageless Synthetic';
      gender = 'Non-binary / Machine';
    } else if (isFantasy) {
      charType = 'Fantasy Creature';
      species = 'Mythical Creature';
      age = 'Timeless Entity';
    }

    // Role
    let role = isLead ? 'Lead Protagonist' : 'Supporting Companion / Catalyst';
    if (lowerDesc.includes('photographer')) role = 'Photographer & Lead Protagonist';
    else if (lowerDesc.includes('architect')) role = 'Lead Architect & Investigator';
    else if (lowerDesc.includes('mentor') || isElder) role = 'Elder Mentor & Historian';
    else if (isAnimal) role = 'Loyal Animal Companion';
    else if (isRobot) role = 'AI Navigator & Technical Specialist';
    else if (isFantasy) role = 'Mystical Guide & Elemental Guardian';

    // Signature attire and accessories
    let attire = `Tailored thematic outfit matching ${idea} in ${style}.`;
    let signatureItem = `Signature story artifact for ${item.name}.`;
    let face = `Expressive features with high emotional clarity and distinct silhouette.`;
    let hair = 'Styled hair matching personality.';

    if (lowerDesc.includes('photographer')) {
      attire = `Weathered canvas field jacket, dark denim, and sturdy explorer boots suited for urban exploration in ${style}.`;
      signatureItem = 'Vintage 35mm rangefinder camera with worn leather strap.';
      face = 'Alert, observant eyes, calm focused expression, and subtle stubble.';
      hair = 'Ruffled dark brown hair with wind-swept texture.';
    } else if (isChild) {
      attire = `Bright colorful adventure outfit with reinforced knee patches and sneakers in ${style}.`;
      signatureItem = 'Miniature exploration journal and brass pocket compass.';
      face = 'Sparkling curious eyes and an infectious adventurous grin.';
      hair = 'Neat playful hairstyle with energetic texture.';
    } else if (isElder) {
      attire = `Classic traditional vintage uniform or cardigan with brass pocket watch chain in ${style}.`;
      signatureItem = 'Ornate antique iron key and vintage pocket watch.';
      face = 'Wise smiling eyes, weathered gentle smile, and dignified silver beard.';
      hair = 'Distinguished silver-white hair combed neatly.';
    } else if (isRobot) {
      attire = 'Matte titanium chassis with glowing blue optical visor and illuminated accent conduits.';
      signatureItem = 'Integrated holographic emitter and multi-spectrum scanner.';
      face = 'Expressive LED optical sensors with responsive status illumination.';
      hair = 'Reinforced alloy plating with antenna module.';
    } else if (isAnimal) {
      attire = 'Natural sleek textured fur/coat with subtle decorative tribal harness in 8K.';
      signatureItem = 'Carved wooden charm collar.';
      face = 'Intelligent, emotive animal eyes radiating loyalty and awareness.';
      hair = 'Lustrous, detailed coat rendering with natural physics.';
    } else if (isFantasy) {
      attire = 'Iridescent bioluminescent wings, ethereal flowing garments woven from starlight.';
      signatureItem = 'Crystalline staff emitting soft starlight pulses.';
      face = 'Otherworldly delicate features with luminous violet or golden eyes.';
      hair = 'Floating luminous strands of gossamer starlight hair.';
    }

    const promptAnchor = `${item.name}, ${charType} (${age}), ${desc}, ${face}, wearing ${attire}, ${signatureItem}, ${style}, volumetric cinematic lighting, Octane 8K render`;
    const lockDesc = `${item.name} — ${charType} (${age}): ${desc}, signature outfit (${attire}), signature item (${signatureItem}) in ${style}.`;

    return {
      id: `char-${idx + 1}-${item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: item.name,
      characterType: charType,
      role,
      species,
      age,
      ageOrSpecies: age,
      gender,
      appearance: `${item.name} (${desc}) designed specifically for "${idea}" rendered in ${style} aesthetic with sharp visual contrast.`,
      visualAppearance: `${item.name} in ${attire}`,
      face,
      hair,
      skinOrVisualCharacteristics: `Cinematic lighting with rich material shaders in ${style}.`,
      bodyOrBuild: isAnimal ? 'Graceful agile quadruped build' : isRobot ? 'Articulated metallic mechanical frame' : isChild ? 'Nimble youthful silhouette' : 'Balanced, energetic posture',
      clothing: attire,
      clothingOutfit: attire,
      accessories: signatureItem,
      signatureItem,
      personality: isElder ? 'Wise, patient, observant, and encouraging.' : isChild ? 'Playful, fearless, endlessly curious.' : 'Resourceful, determined, observant, and brave.',
      personalityTraits: isElder ? ['Wise', 'Patient', 'Dignified'] : isChild ? ['Curious', 'Brave', 'Joyful'] : ['Observant', 'Determined', 'Authentic'],
      expressions: 'Expressive reactions matching narrative tension and discovery.',
      voice: `${settings.tone} delivery in ${lang}.`,
      voiceStyle: `Distinctive voice in ${lang}.`,
      speakingStyle: 'Clear, natural, and expressive.',
      characterPurpose: `Drives viewer engagement and narrative momentum as ${role} for "${idea}".`,
      visualPromptAnchor: promptAnchor,
      characterIdentityLock: lockDesc,
    };
  });
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
  } else if (ctx.isHinglish) {
    premise = `"${idea}" par based ek exciting aur dynamic story, showcasing iconic characters, thrilling moments, aur unforgettable visual wonder.`;
    coreAngle = `High-energy ${style} aesthetics paired with authentic Hinglish dialogue and relatable storytelling.`;
    demographic = `Young creators and YouTube viewers who love vibrant storytelling in Hinglish`;
    whyItWorks = `Catchy pacing, vibrant visual hooks, and modern tone keep viewer engagement at its peak.`;
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
  } else if (ctx.isHinglish) {
    hook1 = `Kya aapne kabhi socha hai ki "${idea}" ki real story kya hai?`;
    hook2 = `You won't believe the insane twist in "${idea}"!`;
    hook3 = `Agar "${idea}" sach ho jaye, toh imagine karo kya hoga!`;
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
// FEATURE 3, 4, 6: STORY-AWARE SCENE GENERATION
// -------------------------------------------------------------

export function generateScenesUniversal(
  idea: string,
  settings: VideoSettings,
  characters: CharacterProfile[],
  fullStory?: string
): SceneBreakdown[] {
  const ctx = analyzeStoryContext(idea, settings, fullStory);
  const actualCount = ctx.sceneCount;
  const aspect = settings.aspectRatio || '16:9';
  const style = settings.visualStyle || '3D Cartoon';
  const lang = settings.language || 'English';

  // Calculate dynamic durations that sum EXACTLY to ctx.totalSec
  const sceneDurations = calculateSceneDurationsUniversal(
    ctx.totalSec,
    actualCount,
    ctx.planningMode,
    ctx.sceneSec
  );

  const char1 = characters[0];
  const char2 = characters[1];
  const char3 = characters[2];

  const charConsistencyDesc = characters.length > 0
    ? characters.map((c) => `${c.name} [${c.characterType || c.role}]: ${c.characterIdentityLock || c.visualPromptAnchor}`).join(' | ')
    : `Consistent visual character styling for ${idea}`;

  // Parse story paragraphs if available for direct scene derivation
  const storyParagraphs = fullStory
    ? fullStory.split(/\n\s*\n/).filter((p) => p.trim().length > 0)
    : [];

  let cumulativeSeconds = 0;

  return sceneDurations.map((durSec, i) => {
    const sceneNum = i + 1;
    const startSec = cumulativeSeconds;
    const endSec = cumulativeSeconds + durSec;
    cumulativeSeconds = endSec;

    const timeRange = `${formatTimestamp(startSec)}–${formatTimestamp(endSec)}`;

    const isFirst = i === 0;
    const isClimax = i === actualCount - 2;
    const isLast = i === actualCount - 1;

    // Progression phase
    let phase = 'Journey Progression';
    if (isFirst) phase = 'The Opening Discovery & Hook';
    else if (i === 1) phase = 'The Rising Discovery';
    else if (i === Math.floor(actualCount / 2)) phase = 'The Core Turning Point';
    else if (isClimax) phase = 'The Dramatic Climax';
    else if (isLast) phase = 'The Resolution & Eternal Impact';

    const sTitle = `Scene ${sceneNum}: ${phase}`;
    
    // Dynamic contextual scene location
    let sLoc = `${idea} — Main Location`;
    if (isFirst) {
      sLoc = `${idea} — Establishing Setting & Arrival Area`;
    } else if (i === 1) {
      sLoc = `${idea} — Pathway to Discovery & Immediate Surroundings`;
    } else if (i === Math.floor(actualCount / 2)) {
      sLoc = `${idea} — Core Chamber & Focal Discovery Point`;
    } else if (isClimax) {
      sLoc = `${idea} — The Pivotal Revelation Site`;
    } else if (isLast) {
      sLoc = `${idea} — Expansive Horizon & Memorial Vista`;
    } else {
      sLoc = `${idea} — Story Environs (Zone ${sceneNum})`;
    }

    // Use story paragraph if aligned
    const matchingStoryBeat = storyParagraphs.length > 0
      ? storyParagraphs[Math.floor((i / actualCount) * storyParagraphs.length)]
      : undefined;

    const sAct = matchingStoryBeat
      ? matchingStoryBeat.slice(0, 160)
      : isFirst
      ? `${char1 ? char1.name : 'The protagonist'} steps forward exploring the vibrant environment as ambient light rays illuminate the path.`
      : isLast
      ? `${char1 ? char1.name : 'The characters'} stand triumphantly together overlooking the luminous horizon as golden atmospheric particles swirl in celebration.`
      : `${char1 ? char1.name : 'The lead character'} ${char2 ? `and ${char2.name}` : ''} interact dynamically, solving obstacles and uncovering wondrous secrets of ${idea}.`;

    // STRICT DIALOGUE ASSIGNMENT
    let dialogue = '';
    let spokenDialogueType = 'none';

    if (ctx.isNoSpoken) {
      dialogue = 'NONE (No Spoken Dialogue)';
      spokenDialogueType = 'none';
    } else if (ctx.isNarratorOnly) {
      spokenDialogueType = 'narration';
      if (ctx.isHindi) {
        if (isFirst) dialogue = `Speaker: Narrator\nDialogue: "${idea} ki is adbhut aur romanchak yatra ki shuruat hoti hai."`;
        else if (isLast) dialogue = `Speaker: Narrator\nDialogue: "Aur is tarah saahas aur dosti ki yeh anokhi dastaan hamesha ke liye amar ho gayi."`;
        else dialogue = `Speaker: Narrator\nDialogue: "Kahani aage badhti hai aur ek naya chamatkar samne aata hai."`;
      } else if (ctx.isHinglish) {
        if (isFirst) dialogue = `Speaker: Narrator\nDialogue: "${idea} ki yeh epic journey yahan se start hoti hai."`;
        else if (isLast) dialogue = `Speaker: Narrator\nDialogue: "Aur is tarah courage aur true friendship ki yeh story complete hui."`;
        else dialogue = `Speaker: Narrator\nDialogue: "Adventure continue hota hai ek unexpected twist ke saath."`;
      } else {
        if (isFirst) dialogue = `Speaker: Narrator\nDialogue: "Deep in the heart of this wondrous world begins the tale of ${idea}."`;
        else if (isLast) dialogue = `Speaker: Narrator\nDialogue: "And so, their courage and unity leave an enduring legacy for all who believe."`;
        else dialogue = `Speaker: Narrator\nDialogue: "The path reveals its greatest marvel as our journey advances."`;
      }
    } else if (ctx.isCharOnly) {
      spokenDialogueType = 'dialogue';
      const speakerName = (i % 2 === 0 || !char2) ? (char1?.name || 'Character') : (char2?.name || 'Companion');
      if (ctx.isHindi) {
        if (isFirst) dialogue = `Speaker: ${speakerName}\nDialogue: "Dekho aage! Yeh raasta hume ek anokhe rahasya ki taraf le jaa raha hai."`;
        else if (isLast) dialogue = `Speaker: ${speakerName}\nDialogue: "Humne yeh kar dikhaya! Hamari dosti aur saahas ki hamesha jeet hogi."`;
        else dialogue = `Speaker: ${speakerName}\nDialogue: "Hume aage badhna hoga, sachayi hamara intezaar kar rahi hai."`;
      } else if (ctx.isHinglish) {
        if (isFirst) dialogue = `Speaker: ${speakerName}\nDialogue: "Look ahead! Yeh pathway hume direct secret chamber tak le jayega."`;
        else if (isLast) dialogue = `Speaker: ${speakerName}\nDialogue: "We did it! Hamari teamwork ne everything change kar diya."`;
        else dialogue = `Speaker: ${speakerName}\nDialogue: "Careful! Aage ka raasta bahut challenging hai."`;
      } else {
        if (isFirst) dialogue = `Speaker: ${speakerName}\nDialogue: "Look ahead! The path is revealing something truly wondrous."`;
        else if (isLast) dialogue = `Speaker: ${speakerName}\nDialogue: "We did it together! Nothing can ever break this bond."`;
        else dialogue = `Speaker: ${speakerName}\nDialogue: "Stay close and follow the signal, the answer is right in front of us."`;
      }
    } else {
      // Narrator + Character Dialogue
      spokenDialogueType = 'dialogue';
      if (i % 2 === 0) {
        if (ctx.isHindi) {
          dialogue = isFirst
            ? `Speaker: Narrator\nDialogue: "${idea} ki is pavitra aur romanchak yatra ka aagaz hota hai."`
            : `Speaker: Narrator\nDialogue: "Drishya aage badhta hai aur vatavaran mein ek anokhi urja fail jaati hai."`;
        } else if (ctx.isHinglish) {
          dialogue = isFirst
            ? `Speaker: Narrator\nDialogue: "${idea} ki magical story yahan se shuru hoti hai."`
            : `Speaker: Narrator\nDialogue: "The adventure gets more exciting as new secrets unfold."`;
        } else {
          dialogue = isFirst
            ? `Speaker: Narrator\nDialogue: "Deep in the realm of wonder begins the story of ${idea}."`
            : `Speaker: Narrator\nDialogue: "With every step, the mystery deepens and the stakes rise."`;
        }
      } else {
        const speakerName = char1?.name || 'Protagonist';
        if (ctx.isHindi) {
          dialogue = `Speaker: ${speakerName}\nDialogue: "Mujhe vishwas hai ki hum is raaste par safal honge!"`;
        } else if (ctx.isHinglish) {
          dialogue = `Speaker: ${speakerName}\nDialogue: "Trust me, hum yeh mystery solve karke rahenge!"`;
        } else {
          dialogue = `Speaker: ${speakerName}\nDialogue: "I can see the glow ahead, we're right on the verge of discovery!"`;
        }
      }
    }

    const presentChars = characters.length > 0 ? characters.map((c) => c.name) : ['Lead Character'];

    const audioRestriction = ctx.isNoSpoken
      ? 'STRICT: NO SPOKEN AUDIO. Ambient Foley and background score only.'
      : undefined;

    return {
      sceneNumber: sceneNum,
      durationSeconds: durSec,
      duration: `${durSec}s`,
      startTime: formatTimestamp(startSec),
      endTime: formatTimestamp(endSec),
      timeRange,
      title: sTitle,
      location: sLoc,
      timeOfDay: i < actualCount / 2 ? 'Daylight Golden Hour' : 'Twilight Magic Hour',
      characters: presentChars,
      charactersPresent: presentChars,
      characterActions: sAct,
      dialogue,
      dialogueVoiceover: dialogue,
      spokenDialogueType,
      spokenDialogue: dialogue,
      audioRestriction,
      narrator: ctx.isNoSpoken ? 'NONE' : dialogue,
      cameraAngleMotion: i % 2 === 0 ? 'Smooth orbital crane shot rotating 35 degrees' : 'Dynamic forward dolly tracking with shallow depth of field',
      lightingMood: i % 2 === 0 ? 'Warm golden hour with soft volumetric sunbeams' : 'Bioluminescent ambient glow with cool fill and golden rim lights',
      animationStyle: `${style} with fluid cinematic frame pacing`,
      soundEffects: ctx.isNoSpoken ? 'Pure atmospheric nature Foley, wind chimes, and ambient score' : 'Diegetic environmental Foley and subtle acoustic reverb',
      musicCue: `${settings.tone} orchestral melody building warmth and adventure`,
      continuityNote: i > 0 ? `Carries visual continuity and character positions from Scene ${sceneNum - 1}.` : 'Opening establishing master continuity.',
      scenePurpose: `Advance emotional bond and visual discovery in Scene ${sceneNum}.`,
      aiVideoPrompt: `Cinematic 8K, ${style}, "${sTitle}" in ${sLoc}. Characters: ${charConsistencyDesc}. Action: ${sAct}. ${aspect} aspect ratio, volumetric lighting, Octane render --ar ${aspect}`,
      characterLockedPrompt: charConsistencyDesc,
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
// FEATURE 7: UNIVERSAL VIDEO PROMPTS GENERATOR
// -------------------------------------------------------------

export function generateVideoPromptsUniversal(
  idea: string,
  settings: VideoSettings,
  scenes: SceneBreakdown[],
  characters: CharacterProfile[]
): SceneVideoPrompt[] {
  const aspect = settings.aspectRatio || '16:9';
  const style = settings.visualStyle || '3D Cartoon';
  const ctx = analyzeStoryContext(idea, settings);

  const charConsistencyDesc = characters.length > 0
    ? characters.map((c) => `${c.name} [${c.characterType || c.role}]: ${c.characterIdentityLock || c.visualPromptAnchor}`).join(' | ')
    : 'Consistent visual continuity matching project aesthetic';

  return scenes.map((scene) => {
    const sceneNum = scene.sceneNumber;
    const duration = `${scene.durationSeconds || ctx.sceneSec}s`;
    const action = scene.characterActions || `Dynamic cinematic action for scene ${sceneNum}`;
    const environment = scene.location || scene.environment || `Thematic environment for ${idea}`;
    const lighting = scene.lightingMood || 'Cinematic three-point lighting with volumetric sunbeams';
    const camera = scene.cameraAngleMotion || '35mm anamorphic tracking shot';
    const audioCue = ctx.isNoSpoken
      ? 'NO SPOKEN WORDS. Ambient Foley and background score only.'
      : scene.dialogue || scene.dialogueVoiceover || scene.spokenDialogue || 'Atmospheric audio';

    const finalPrompt = `Cinematic ${aspect} video, ${style}, "${scene.title}". Action: ${action}. Environment: ${environment}. Characters: ${charConsistencyDesc}. Camera: ${camera}. Lighting: ${lighting}. Audio: ${audioCue}. Volumetric atmospheric depth, 8K render, Octane render --ar ${aspect}`;

    const modelPrompts: ModelSpecificPrompts = {
      veo: `Google Veo prompt: Cinematic ${style} render of "${scene.title}". Duration: ${duration} (${scene.timeRange}). Aspect ratio: ${aspect}. Action: ${action} in ${environment}. ${lighting}. Camera: ${camera}. Audio: ${audioCue}.`,
      runway: `[${camera}] [${action}] [${environment}, ${lighting}] Duration ${duration} (${scene.timeRange}), cinematic 8k render, ${style} --ar ${aspect}`,
      kling: `Kling AI text-to-video: Master shot (${duration} | ${scene.timeRange}), ${style}, ${action} in ${environment}. Aspect ratio ${aspect}. ${camera}, ${lighting}, high dynamic range, fluid physics.`,
      luma: `Luma Dream Machine: Smooth ${camera} (${duration} | ${scene.timeRange}) capturing ${action}. Environment: ${environment}. Lighting: ${lighting}. Aspect ${aspect}. Natural dynamics and depth.`,
      sora: `OpenAI Sora: Hyper-detailed photorealistic cinematic sequence (${duration} | ${scene.timeRange}) in ${style} aspect ratio ${aspect}. In ${environment}, ${action}. Features ${charConsistencyDesc}. Camera: ${camera}, Lighting: ${lighting}, volumetric atmospheric depth.`,
    };

    return {
      sceneNumber: sceneNum,
      title: scene.title,
      duration,
      durationSeconds: scene.durationSeconds || ctx.sceneSec,
      startTime: scene.startTime,
      endTime: scene.endTime,
      aspectRatio: aspect,
      visualStyle: style,
      characterConsistencyDescription: charConsistencyDesc,
      characterIdentityLock: charConsistencyDesc,
      environment,
      action,
      facialExpressions: 'Engaged, emotionally expressive gaze matching scene narrative',
      bodyMovement: 'Natural kinetic physical blocking and purposeful gesture pacing',
      cameraShot: 'Medium Cinematic Master Shot',
      cameraMovement: camera,
      lensFraming: '35mm anamorphic, f/2.0 shallow depth of field',
      lighting,
      atmosphere: 'Volumetric light rays, subtle atmospheric dust particles, and visual depth',
      animationStyle: `${style} with natural cinematic motion blur`,
      physicsMotion: 'Realistic cloth simulation, hair dynamics, and natural physical inertia',
      dialogue: ctx.isNoSpoken
        ? 'NONE (No Spoken Dialogue)'
        : scene.dialogue || scene.dialogueVoiceover || scene.spokenDialogue || 'None',
      voiceAudio: ctx.isNoSpoken ? 'NO SPOKEN AUDIO. Background score and environmental Foley only.' : 'Rich resonant vocal tone with clean acoustic isolation',
      soundEffects: scene.soundEffects || 'Diegetic environmental Foley and atmospheric soundbed',
      music: scene.musicCue || 'Cinematic thematic score building warmth and wonder',
      transition: scene.transition || 'Match cut to subsequent sequence',
      negativePrompt: 'blurry, low resolution, distorted limbs, extra fingers, morphing face, bad anatomy, text watermark, oversaturated artifacts, flickering, glitch, invented dialogue',
      finalPrompt,
      modelPrompts,
    };
  });
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

  const concept = generateConceptUniversal(title, normalizedSettings, effectiveStory);
  const hook = generateHookUniversal(title, normalizedSettings, effectiveStory);
  const characters = normalizedSettings.includeCharacters
    ? generateCharactersUniversal(title, normalizedSettings, effectiveStory, ctx.characterInstructions)
    : [];
  const scenes = generateScenesUniversal(title, normalizedSettings, characters, effectiveStory);
  const script = generateScriptUniversal(title, normalizedSettings, scenes, characters);
  const videoPrompts = generateVideoPromptsUniversal(title, normalizedSettings, scenes, characters);
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
    script,
    scenes,
    videoPrompts,
    thumbnail,
    youtubeSeo,
    shorts,
  };
}
