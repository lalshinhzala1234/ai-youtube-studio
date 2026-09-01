import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  ProjectSettings,
  ConceptData,
  HookData,
  ScriptData,
  ScriptSection,
  HookOption,
  CharacterProfile,
  SceneBreakdown,
  SceneVideoPrompt,
  ModelSpecificPrompts,
  ThumbnailData,
  ThumbnailConcept,
  SeoData,
  TitleOption,
  ShortsData,
  ShortScript,
  VisualBeat,
} from '@/types/project';

function getApiKey(): string {
  // Strictly read from server-side environment variables
  return process.env.GEMINI_API_KEY || process.env.API_KEY || '';
}

function getGeminiModelName(): string {
  // Defaults to official standard Google Gemini 2.5 Flash model, configurable via env
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
}

function cleanJsonString(raw: string): string {
  let cleaned = raw.trim();
  // Strip markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '');
  }
  return cleaned.trim();
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2, delayMs = 2500): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const msg = err?.message || String(err);
      const isRateLimit = msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('Rate limit');
      if (isRateLimit && attempt < maxRetries) {
        // Exponential backoff
        const wait = delayMs * Math.pow(1.5, attempt);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

/**
 * Generate real AI Video Concept using user's actual project settings.
 */
export async function generateConceptAI(
  idea: string,
  settings: ProjectSettings
): Promise<ConceptData> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server environment.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: getGeminiModelName(),
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7,
    },
  });

  const prompt = `You are a world-class YouTube Strategist and Executive Producer.
Analyze the user's video idea and exact production settings to produce a high-retention, YouTube-optimized video concept.

PROJECT SPECIFICATIONS:
- Video Idea / Topic: "${idea}"
- Video Category / Type: "${settings.videoType}"
- Target Audience: "${settings.audience || 'General'}"
- Language: "${settings.language}"
- Target Duration: "${settings.targetDuration || settings.duration || '3 minutes'}"
- Format: "${settings.format || 'YouTube Long Form'}"
- Visual Style: "${settings.visualStyle}"
- Tone: "${settings.tone}"
- Narration Style: "${settings.narration || 'Voiceover'}"
- Scene Count Target: ${settings.targetScenesCount || settings.sceneCount || 5}
- Aspect Ratio: "${settings.aspectRatio || '16:9'}"
${settings.customStyle ? `- Custom Visual Style Detail: "${settings.customStyle}"` : ''}
${settings.customDuration ? `- Custom Duration Detail: "${settings.customDuration}"` : ''}

Generate a comprehensive JSON response matching this exact structure:
{
  "title": "High-converting, captivating YouTube working title",
  "titleWorking": "Catchy YouTube working title",
  "premise": "Compelling 2-4 sentence core premise explaining what happens in the video and why it is fascinating",
  "coreAngle": "The unique creative angle, twist, or format differentiator that makes this video stand out from competitors",
  "targetAudience": {
    "demographic": "Specific viewer age group and demographic (tailored to ${settings.audience || 'General'})",
    "viewingMotivation": "Why viewers will click, stay engaged, and watch till the final second",
    "painPointsOrCuriosity": "The burning curiosity gap, mystery, or desire answered by this video",
    "interests": ["Interest 1", "Interest 2", "Interest 3", "Interest 4"]
  },
  "tone": "${settings.tone}",
  "learningGoal": "Key educational takeaway, core message, or high-value entertainment payoff",
  "storySummary": "A vivid chronological summary of the video's narrative arc or progression",
  "whyItWorks": "Deep strategic analysis on why this concept triggers high click-through and average view duration (AVD) on the YouTube algorithm",
  "educationalOrEntertainmentValue": "Clear explanation of the emotional and practical value delivered to the viewer in ${settings.language}"
}

Respond ONLY with valid JSON.`;

  const result = await withRetry(() => model.generateContent(prompt));
  const text = result.response.text();
  const parsed = JSON.parse(cleanJsonString(text));

  const concept: ConceptData = {
    title: parsed.title || parsed.titleWorking || idea,
    titleWorking: parsed.titleWorking || parsed.title || idea,
    premise: parsed.premise || `An immersive breakdown of "${idea}".`,
    coreAngle: parsed.coreAngle || `Dynamic storytelling in ${settings.visualStyle} style.`,
    targetAudience: {
      demographic: parsed.targetAudience?.demographic || `${settings.audience || 'General'} viewers`,
      viewingMotivation: parsed.targetAudience?.viewingMotivation || `High engagement with ${settings.tone} delivery.`,
      painPointsOrCuriosity: parsed.targetAudience?.painPointsOrCuriosity || `Curiosity about ${idea}.`,
      interests: parsed.targetAudience?.interests || [settings.videoType, settings.visualStyle, 'Visual Storytelling'],
    },
    tone: parsed.tone || settings.tone,
    learningGoal: parsed.learningGoal || `Master the key concepts of ${idea}.`,
    storySummary: parsed.storySummary || parsed.premise,
    whyItWorks: parsed.whyItWorks || `Strong opening hook and high-contrast ${settings.visualStyle} visuals keep retention high.`,
    educationalOrEntertainmentValue: parsed.educationalOrEntertainmentValue || `High value storytelling delivered in ${settings.language}.`,
    toneAnalysis: `${settings.tone} delivery tailored with ${settings.visualStyle} aesthetics.`,
  };

  return concept;
}

/**
 * Generate real AI Video Hook Matrix using user's actual project settings and concept.
 */
export async function generateHookAI(
  idea: string,
  settings: ProjectSettings,
  concept?: ConceptData
): Promise<HookData> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server environment.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: getGeminiModelName(),
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7,
    },
  });

  const prompt = `You are a YouTube Retention Specialist and Viral Hook Architect.
Design high-converting opening hooks (0-15 seconds) specifically engineered to maximize Average View Duration (AVD) and stop the scroll.

PROJECT SPECIFICATIONS:
- Video Idea: "${idea}"
- Concept Premise: "${concept?.premise || idea}"
- Creative Angle: "${concept?.coreAngle || 'Unique perspective'}"
- Video Type: "${settings.videoType}"
- Target Audience: "${settings.audience || 'General'}"
- Language: "${settings.language}"
- Visual Style: "${settings.visualStyle}"
- Tone: "${settings.tone}"
- Narration: "${settings.narration || 'Voiceover'}"
- Format: "${settings.format || 'YouTube Long Form'}"

Generate a comprehensive JSON response matching this exact structure:
{
  "hook": "Spoken opening hook dialogue for the primary recommended hook option in ${settings.language}",
  "visualHook": "Exact visual shot, subject action, camera movement, and aesthetic in ${settings.visualStyle} for the opening 0-5 seconds",
  "first10Seconds": "Detailed beat-by-beat description of what happens visually and audibly in the first 10 seconds",
  "retentionReason": "Psychological breakdown of why this opening stops viewer drop-off and hooks curiosity",
  "hookOptions": [
    {
      "id": "hook-opt-1",
      "type": "Curiosity Gap / Question",
      "text": "Spoken hook text in ${settings.language}",
      "visualDirection": "Visual framing in ${settings.visualStyle} with camera motion",
      "explanation": "Psychological trigger explaining why viewers cannot click away",
      "estimatedDeliverySeconds": 5
    },
    {
      "id": "hook-opt-2",
      "type": "Bold Claim / High Stakes",
      "text": "High stakes spoken hook in ${settings.language}",
      "visualDirection": "Rapid visual shock or transition in ${settings.visualStyle}",
      "explanation": "Breaks viewer habituation and triggers instant focus",
      "estimatedDeliverySeconds": 6
    },
    {
      "id": "hook-opt-3",
      "type": "Visual Shock / Pattern Interrupt",
      "text": "Intriguing provocative statement in ${settings.language}",
      "visualDirection": "Dynamic camera push-in or unexpected visual reveal in ${settings.visualStyle}",
      "explanation": "Creates immediate cognitive tension requiring payoff",
      "estimatedDeliverySeconds": 5
    }
  ],
  "selectedHookId": "hook-opt-1",
  "first30SecondsRoadmap": [
    "00:00 - 00:05: High-impact opening hook statement with dynamic ${settings.visualStyle} visual",
    "00:05 - 00:15: Introduction of core tension, mystery, or stakes in ${settings.language}",
    "00:15 - 00:30: Fast-paced roadmap promising the ultimate payoff to retain viewers"
  ],
  "retentionStrategy": "Continuous 3-5 second visual cuts with dynamic sound cues matching ${settings.tone} energy."
}

Respond ONLY with valid JSON.`;

  const result = await withRetry(() => model.generateContent(prompt));
  const text = result.response.text();
  const parsed = JSON.parse(cleanJsonString(text));

  const hookOptions: HookOption[] = Array.isArray(parsed.hookOptions) && parsed.hookOptions.length > 0
    ? parsed.hookOptions.map((opt: any, index: number) => ({
        id: opt.id || `hook-opt-${index + 1}`,
        type: opt.type || 'Visual Hook',
        text: opt.text || opt.hook || `What if the secret behind "${idea}" changes everything?`,
        visualDirection: opt.visualDirection || opt.visualHook || `Dramatic dynamic shot in ${settings.visualStyle}.`,
        explanation: opt.explanation || opt.retentionReason || 'Creates an irresistible curiosity gap.',
        estimatedDeliverySeconds: Number(opt.estimatedDeliverySeconds) || 5,
      }))
    : [
        {
          id: 'hook-opt-1',
          type: 'Curiosity Gap',
          text: parsed.hook || `What if everything you thought about "${idea}" was just the beginning?`,
          visualDirection: parsed.visualHook || `Dramatic push-in in ${settings.visualStyle} with volumetric lighting.`,
          explanation: parsed.retentionReason || 'Halts scrolling by posing a high-stakes premise.',
          estimatedDeliverySeconds: 5,
        },
      ];

  const hook: HookData = {
    hook: parsed.hook || hookOptions[0]?.text || '',
    visualHook: parsed.visualHook || hookOptions[0]?.visualDirection || '',
    first10Seconds: parsed.first10Seconds || 'High-energy opening shot followed by immediate premise reveal.',
    retentionReason: parsed.retentionReason || 'Creates instant cognitive curiosity.',
    hookOptions,
    selectedHookId: parsed.selectedHookId || hookOptions[0]?.id || 'hook-opt-1',
    first30SecondsRoadmap: Array.isArray(parsed.first30SecondsRoadmap) && parsed.first30SecondsRoadmap.length > 0
      ? parsed.first30SecondsRoadmap
      : [
          `00:00 - 00:05: Opening hook in ${settings.visualStyle}`,
          `00:05 - 00:15: Core conflict in ${settings.language}`,
          `00:15 - 00:30: Escalating promise of payoff`,
        ],
    retentionStrategy: parsed.retentionStrategy || `Maintain dynamic visual cuts every 3-5 seconds with ${settings.tone} pacing.`,
  };

  return hook;
}

/**
 * Generate real AI Full Production Script using user's actual project settings, concept, and selected hook.
 */
export async function generateScriptAI(
  idea: string,
  settings: ProjectSettings,
  concept?: ConceptData,
  hook?: HookData
): Promise<ScriptData> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server environment.');
  }

  const selectedHookText = hook?.hookOptions?.find((h) => h.id === hook.selectedHookId)?.text || hook?.hook || idea;
  const targetSceneCount = Number(settings.targetScenesCount || settings.sceneCount) || 5;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: getGeminiModelName(),
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7,
    },
  });

  const prompt = `You are an elite YouTube Screenwriter and Showrunner.
Write a full, read-ready production script with timestamped sections, detailed visual directions, voiceover narration, and dialogue.

PROJECT SPECIFICATIONS:
- Video Idea: "${idea}"
- Working Title: "${concept?.titleWorking || idea}"
- Core Premise: "${concept?.premise || idea}"
- Target Duration: "${settings.targetDuration || settings.duration || '3 minutes'}"
- Number of Planned Scenes / Acts: ${targetSceneCount}
- Target Audience: "${settings.audience || 'General'}"
- Language: "${settings.language}" (ALL spoken narration & dialogue MUST be in ${settings.language})
- Visual Style: "${settings.visualStyle}"
- Tone: "${settings.tone}"
- Narration Style: "${settings.narration || 'Voiceover'}" (Provide narrator dialogue and character dialogue accordingly)
- Selected Opening Hook: "${selectedHookText}"

Generate a comprehensive JSON response matching this exact structure:
{
  "completeScript": "The entire compiled screenplay with all spoken lines and act headers in ${settings.language}",
  "narratorDialogue": "All narrator voiceover dialogue extracted into one clean read-ready transcript",
  "characterDialogue": "All character dialogue exchanges (or host lines) compiled cleanly",
  "sceneIntent": "Overall directorial statement describing the emotional pacing, narrative momentum, and visual flow",
  "totalWordCount": 450,
  "estimatedReadTime": "${settings.targetDuration || settings.duration || '3 minutes'}",
  "sections": [
    {
      "id": "sec-1",
      "name": "Act 1: The Opening Hook & Premise",
      "timecode": "00:00 - 00:30",
      "visualDirection": "Detailed cinematography, camera movement, character positioning in ${settings.visualStyle}",
      "dialogueOrNarration": "Exact spoken narration or dialogue in ${settings.language}",
      "narratorDialogue": "Spoken line for narrator",
      "characterDialogue": "Spoken line for character (if applicable)",
      "sceneIntent": "Hook viewer attention, establish stakes, and spark curiosity",
      "onScreenText": "TEXT OVERLAY IN CAPS",
      "soundEffectOrMusicCue": "Upbeat cinematic intro riser with gentle bass pulse",
      "deliveryNotes": "High energy delivery in ${settings.language}"
    }
  ]
}

Ensure you provide exactly ${targetSceneCount} logically escalating sections spanning the entire target duration.
Respond ONLY with valid JSON.`;

  const result = await withRetry(() => model.generateContent(prompt));
  const text = result.response.text();
  const parsed = JSON.parse(cleanJsonString(text));

  const sections: ScriptSection[] = Array.isArray(parsed.sections) && parsed.sections.length > 0
    ? parsed.sections.map((sec: any, index: number) => ({
        id: sec.id || `sec-${index + 1}`,
        name: sec.name || `Act ${index + 1}: Scene Breakdown`,
        timecode: sec.timecode || `0${index}:00 - 0${index + 1}:00`,
        visualDirection: sec.visualDirection || `Cinematic shot rendered in ${settings.visualStyle}.`,
        dialogueOrNarration: sec.dialogueOrNarration || sec.narratorDialogue || sec.characterDialogue || `Voiceover dialogue for scene ${index + 1}.`,
        narratorDialogue: sec.narratorDialogue || sec.dialogueOrNarration,
        characterDialogue: sec.characterDialogue,
        sceneIntent: sec.sceneIntent || 'Drive forward narrative momentum.',
        onScreenText: sec.onScreenText || undefined,
        soundEffectOrMusicCue: sec.soundEffectOrMusicCue || 'Cinematic background music',
        deliveryNotes: sec.deliveryNotes || `${settings.tone} delivery in ${settings.language}`,
      }))
    : [
        {
          id: 'sec-1',
          name: 'Act 1: The Hook & Introduction',
          timecode: '00:00 - 00:45',
          visualDirection: `Opening pan over dramatic environment in ${settings.visualStyle}.`,
          dialogueOrNarration: selectedHookText,
          narratorDialogue: selectedHookText,
          sceneIntent: 'Capture immediate viewer attention.',
          onScreenText: idea.toUpperCase(),
          soundEffectOrMusicCue: 'Upbeat cinematic intro riser',
        },
      ];

  const totalWords = sections.reduce((acc, s) => acc + (s.dialogueOrNarration ? s.dialogueOrNarration.split(/\s+/).length : 0), 0);

  const script: ScriptData = {
    totalWordCount: parsed.totalWordCount || totalWords || 450,
    estimatedReadTime: parsed.estimatedReadTime || settings.targetDuration || settings.duration || '3 minutes',
    completeScript: parsed.completeScript || sections.map((s) => `[${s.name} - ${s.timecode}]\n${s.dialogueOrNarration}`).join('\n\n'),
    narratorDialogue: parsed.narratorDialogue || sections.map((s) => s.narratorDialogue || s.dialogueOrNarration).join('\n'),
    characterDialogue: parsed.characterDialogue,
    sceneIntent: parsed.sceneIntent || 'Engaging, continuous pacing with high retention beats.',
    sections,
  };

  return script;
}

/**
 * Helper to compute seconds from time string e.g. "3 minutes" or "60s" or "30 seconds"
 */
export function parseDurationToTotalSeconds(durationStr?: string): number {
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

/**
 * Helper to compute single scene duration seconds e.g. "5 seconds", "10 seconds", "15 seconds"
 */
export function parseSceneDurationToSeconds(sceneDurationStr?: string, defaultSec = 10): number {
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

/**
 * Generate real AI Character Profiles with reusable locked consistency anchors.
 */
export async function generateCharactersAI(
  idea: string,
  settings: ProjectSettings,
  concept?: ConceptData,
  script?: ScriptData,
  storyText?: string
): Promise<CharacterProfile[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server environment.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: getGeminiModelName(),
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.5,
    },
  });

  const activeStory = (
    storyText ||
    settings.fullStory ||
    settings.storyText ||
    settings.refinedStory ||
    script?.completeScript ||
    script?.narratorDialogue ||
    ''
  ).trim();

  const prompt = `You are an elite Character Designer, Concept Artist, and Visual Continuity Director for AI video production (Midjourney, Runway Gen-3, OpenAI Sora, Kling AI).
Your task is to analyze the ACTIVE STORY narrative below and extract every distinct individual character required by the story.

ACTIVE STORY CONTENT:
"""
${activeStory || 'No explicit story text provided.'}
"""

PROJECT METADATA (REFERENCE ONLY - NEVER EXTRACT CHARACTERS MERELY FROM TITLE/METADATA):
- Project Title / Idea: "${idea}"
- Concept Premise: "${concept?.premise || idea}"
- Visual Style: "${settings.visualStyle || '3D Cartoon'}"
- Tone: "${settings.tone || 'Exciting'}"
- Language: "${settings.language || 'English'}"
- Character Instructions: "${settings.characterInstructions || 'None'}"

CRITICAL EXTRACTION RULES:
1. STORY-FIRST EXTRACTION: Extract characters ONLY from what is described or taking part in the ACTIVE STORY CONTENT above.
2. NEVER EXTRACT MERELY FROM TITLE: NEVER create a character merely because a word or name appears in the project title, idea, or metadata if that character does not exist in the active story text.
3. EVERY DISTINCT CHARACTER MUST BE AN INDIVIDUAL PROFILE:
   - If the story contains Radha, Krishna, and Balram, create THREE separate character profiles: "Radha", "Krishna", "Balram".
   - If the story contains "Chiku enters the meadow with his two friends, a cute Bunny and a playful Baby Bear", create THREE separate character profiles: "Chiku", "Bunny", "Baby Bear".
   - If the story contains 2 sisters "Elena and Maya", create TWO separate profiles: "Elena" and "Maya".
4. NEVER COMBINE CHARACTERS: "two friends", "the companions", "some animals", "group of kids", "characters", "people" are NEVER character names or IDs. Every character must be an individual entity.
5. NO NAMED CHARACTERS IN STORY: If the active story is purely ambient or environmental with NO explicit characters, return an empty JSON array []. Do NOT invent characters from the project title.
6. COMPLETE LOCKED IDENTITY BLUEPRINT: Every extracted character profile must contain complete, rich attributes for 100% visual and voice consistency across all video generation models.

Generate a JSON array of character objects matching this exact structure:
[
  {
    "id": "STABLE_UPPERCASE_ID (e.g. RADHA, KRISHNA, BALRAM, MAIN_CHILD_HERO, BUNNY_FRIEND, BABY_BEAR_FRIEND)",
    "name": "Character Name (e.g. Chiku, Radha, Krishna, Bunny, Baby Bear)",
    "displayName": "Display Name with Role (e.g. Chiku (Lead Protagonist))",
    "role": "Role (e.g. Lead Protagonist / Animal Companion / Guide)",
    "characterType": "Human Child / Rabbit / Deity / Young Adult / etc.",
    "species": "Human / Rabbit / Bear Cub / Asian Elephant / etc.",
    "age": "Age or Age Range (e.g. 7 years old)",
    "ageCategory": "Child / Young Adult / Adult / Elder",
    "gender": "Boy / Girl / Male / Female / Unspecified",
    "appearance": "Comprehensive visual description combining face, eyes, hair, build, skin, and presence in ${settings.visualStyle}",
    "visualAppearance": "Short visual appearance summary in ${settings.visualStyle}",
    "face": "Detailed facial features: eye shape/color, nose, mouth, cheeks, expressions",
    "hair": "Exact hairstyle, texture, cut, and color (or fur texture/groom)",
    "skinOrVisualCharacteristics": "Skin tone or texture/fur details with lighting characteristics",
    "bodyOrBuild": "Height, body proportions, silhouette",
    "clothing": "Exact signature clothing outfit, fabrics, colors, footwear",
    "clothingOutfit": "Exact signature outfit description",
    "accessories": "Signature props, items always carried, necklace, badge, bag",
    "signatureItem": "Primary signature item",
    "personality": "Key personality traits summary",
    "personalityTraits": ["Trait 1", "Trait 2", "Trait 3"],
    "expressions": "Signature emotional reactions and expressions",
    "voice": "Voice characteristics, timbre, and accent in ${settings.language}",
    "voiceStyle": "Voice delivery style in ${settings.language}",
    "speakingStyle": "Pacing and speech patterns in ${settings.language}",
    "characterPurpose": "Strategic narrative purpose in the story",
    "visualPromptAnchor": "Master diffusion prompt anchor locking exact features for AI video generation: [ID], [Name], [Age/Species], [Outfit], [Facial Features], ${settings.visualStyle}, volumetric lighting, 8k render",
    "characterIdentityLock": "Strict identity lock: [ID]: [Name], [Key Visuals], [Signature Clothing]. Exactly ONE character. NEVER change facial structure or costume.",
    "generationPrompt": "Master character reference portrait prompt for Midjourney / SDXL in ${settings.visualStyle}, 8k",
    "lockedAttributes": ["Signature Outfit", "Hairstyle/Fur", "Key Accessory"]
  }
]

Respond ONLY with valid JSON (array of objects).`;

  const result = await withRetry(() => model.generateContent(prompt));
  const text = result.response.text();
  const parsed = JSON.parse(cleanJsonString(text));

  const list = Array.isArray(parsed) ? parsed : parsed.characters || [parsed];

  const characters: CharacterProfile[] = list.map((c: any, index: number) => {
    const name = c.name || `Character ${index + 1}`;
    const charType = c.characterType || (index === 0 ? 'Protagonist' : 'Companion');
    const ageOrSpec = c.age || c.species || c.ageOrSpecies || 'Young';
    const clothing = c.clothing || c.clothingOutfit || 'Signature outfit';
    const anchor = c.visualPromptAnchor || `${name}, ${charType}, ${ageOrSpec}, ${clothing}, ${settings.visualStyle} style, 8k render`;
    const lock = c.characterIdentityLock || `${name} — ${charType} (${ageOrSpec}): ${clothing}. Locked style: ${settings.visualStyle}.`;

    return {
      id: c.id || `char-${index + 1}`,
      name,
      role: c.role || (index === 0 ? 'Lead Protagonist' : 'Supporting Character'),
      characterType: charType,
      species: c.species || 'Human',
      age: c.age || c.ageOrSpecies || 'Young',
      ageOrSpecies: c.ageOrSpecies || c.age || c.species || 'Young',
      gender: c.gender || 'Unspecified',
      appearance: c.appearance || c.visualAppearance || `${name} with distinctive features in ${settings.visualStyle}.`,
      visualAppearance: c.visualAppearance || c.appearance || `${name} in ${settings.visualStyle} style.`,
      face: c.face || 'Expressive eyes and warm facial features.',
      hair: c.hair || 'Distinctive hair/features matching character type.',
      skinOrVisualCharacteristics: c.skinOrVisualCharacteristics || c.skin || 'Natural tone with warm lighting.',
      bodyOrBuild: c.bodyOrBuild || 'Natural build and silhouette.',
      clothing,
      clothingOutfit: clothing,
      accessories: c.accessories || c.signatureItem || 'Signature item.',
      signatureItem: c.signatureItem || c.accessories || 'Signature item.',
      personality: c.personality || 'Engaging and curious.',
      personalityTraits: Array.isArray(c.personalityTraits) ? c.personalityTraits : ['Curious', 'Brave', 'Kind'],
      expressions: c.expressions || 'Expressive and animated.',
      voice: c.voice || c.voiceStyle || `Expressive delivery in ${settings.language}.`,
      voiceStyle: c.voiceStyle || c.voice || `Expressive delivery in ${settings.language}.`,
      speakingStyle: c.speakingStyle || 'Clear and natural.',
      characterPurpose: c.characterPurpose || 'Drive story emotional connection.',
      visualPromptAnchor: anchor,
      characterIdentityLock: lock,
    };
  });

  return characters;
}

/**
 * Generate real AI Scene-by-Scene Breakdown with visual cues, technical camera specs, and timeline pacing.
 */
export async function generateScenesAI(
  idea: string,
  settings: ProjectSettings,
  concept?: ConceptData,
  hook?: HookData,
  script?: ScriptData,
  characters?: CharacterProfile[]
): Promise<SceneBreakdown[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server environment.');
  }

  const totalSeconds = parseDurationToTotalSeconds(settings.totalDuration || settings.targetDuration || settings.duration);
  const sceneSeconds = parseSceneDurationToSeconds(settings.sceneDuration, 10);
  const targetCount = settings.targetScenesCount || Math.max(1, Math.round(totalSeconds / sceneSeconds));
  const avgSecondsPerScene = sceneSeconds || Math.max(5, Math.round(totalSeconds / targetCount));

  const voiceMode = settings.voiceMode || (settings.narration === 'Both' ? 'Narrator + Character Dialogue' : settings.narration === 'Voiceover' ? 'Narrator' : 'Character Dialogue');
  const isNoSpokenWords = voiceMode === 'No Spoken Dialogue';

  const dialogueDirective = isNoSpokenWords
    ? 'STRICT AUDIO DIRECTIVE: NO SPOKEN WORDS. NO NARRATION. DO NOT GENERATE ANY SPEECH. Dialogue field MUST be strictly "NONE (No Spoken Dialogue)".'
    : voiceMode === 'Character Dialogue'
    ? `STRICT DIALOGUE DIRECTIVE: Only character spoken dialogue in ${settings.language}. Format: CharacterName: "Spoken line". Use ONLY authentic story dialogue in ${settings.language}.`
    : voiceMode === 'Narrator'
    ? `STRICT DIALOGUE DIRECTIVE: Only narrator voiceover lines in ${settings.language}.`
    : `STRICT DIALOGUE DIRECTIVE: Include both narrator setup and character spoken dialogue in ${settings.language}.`;

  const charactersContext = characters && characters.length > 0
    ? characters.map((c) => `- ${c.name} [Type: ${c.characterType || 'Main Character'} | Species: ${c.species || c.ageOrSpecies || 'Standard'}]: Anchor: [${c.characterIdentityLock || c.visualPromptAnchor || c.clothingOutfit || c.visualAppearance}]`).join('\n')
    : 'No recurring characters specified.';

  const scriptContext = script?.sections && script.sections.length > 0
    ? script.sections.map((s, idx) => `Section ${idx + 1} (${s.timecode}): ${s.name}\nVisual: ${s.visualDirection}\nDialogue: ${s.dialogueOrNarration}`).join('\n\n')
    : script?.completeScript || idea;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: getGeminiModelName(),
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7,
    },
  });

  const prompt = `You are a Hollywood Cinematographer and Senior AI Video Director (Runway, Sora, Luma Dream Machine, Google Veo).
Generate a complete, chronological Scene-by-Scene Breakdown for this YouTube video.

PROJECT SPECIFICATIONS:
- Video Idea: "${idea}"
- Working Title: "${concept?.titleWorking || idea}"
- Premise: "${concept?.premise || idea}"
- Total Video Duration: "${settings.totalDuration || settings.targetDuration || settings.duration || '3 minutes'}" (${totalSeconds} total seconds)
- Scene Duration: "${settings.sceneDuration || `${avgSecondsPerScene} seconds`}" (${avgSecondsPerScene} seconds per scene)
- Scene Count Target: EXACTLY ${targetCount} SCENES
- Visual Style: "${settings.visualStyle}"
- Aspect Ratio: "${settings.aspectRatio || '16:9'}"
- Tone: "${settings.tone}"
- Language: "${settings.language}"
- Voice Mode: "${voiceMode}"
- Dialogue / Narration Rule: ${dialogueDirective}
- Opening Hook: "${hook?.hook || hook?.hookOptions?.[0]?.text || idea}"

LOCKED CHARACTER CONTINUITY PROFILES:
${charactersContext}

SCRIPT BLUEPRINT:
${scriptContext}

Generate exactly ${targetCount} scenes sequentially spanning the entire video.
Each scene MUST have durationSeconds = ${avgSecondsPerScene}.
Timestamps must be continuous without gaps (e.g. 00:00 - 00:${avgSecondsPerScene < 10 ? '0' : ''}${avgSecondsPerScene}, etc.).
Maintain strict continuity: character appearances, locations, and actions must flow logically.

Generate a JSON array of scene objects matching this exact structure:
[
  {
    "sceneNumber": 1,
    "title": "Story-derived Scene Title",
    "durationSeconds": ${avgSecondsPerScene},
    "duration": "${avgSecondsPerScene}s",
    "timeRange": "00:00 - 00:${avgSecondsPerScene.toString().padStart(2, '0')}",
    "location": "Specific story-derived location and environment setting",
    "timeOfDay": "Time of day (e.g. Dawn / Golden Hour / Noon / Midnight)",
    "characters": ["Character Name 1"],
    "charactersPresent": ["Character Name 1"],
    "characterActions": "Explicit physical actions, blocking, gestures, reactions for this story beat",
    "environment": "Detailed set dressing, objects, depth, atmosphere in ${settings.visualStyle}",
    "visualDescription": "Cinematic composition, foreground/background layers, color grading",
    "dialogue": "${isNoSpokenWords ? 'NONE (No Spoken Dialogue)' : `Exact spoken line or narration in ${settings.language}`}",
    "dialogueVoiceover": "${isNoSpokenWords ? 'NO SPOKEN WORDS. NO NARRATION.' : `Exact spoken line in ${settings.language}`}",
    "spokenDialogueType": "${voiceMode}",
    "narrator": "${isNoSpokenWords ? 'NONE' : `Narrator line in ${settings.language}`}",
    "camera": "Lens and framing (e.g. 35mm Low-Angle Tracking Shot / 50mm Medium Close-Up)",
    "cameraMovement": "Camera motion (e.g. Smooth forward dolly, slow orbital crane, whip pan)",
    "cameraAngleMotion": "Lens + camera motion combined",
    "lighting": "Lighting setup (e.g. Warm golden hour sunbeams, atmospheric neon rim light)",
    "lightingMood": "Lighting mood summary",
    "animation": "Motion dynamics and speed ramp",
    "animationStyle": "Motion style in ${settings.visualStyle}",
    "soundEffects": "Diegetic sound effects (e.g. jungle leaf rustle, gentle elephant rumble)",
    "music": "Music cue and tempo",
    "musicCue": "Music cue description",
    "transition": "Transition into next scene (e.g. Match cut on action / Whip pan / Slow crossfade)",
    "continuityNote": "Visual and environmental elements carried forward from previous scene",
    "scenePurpose": "Directorial purpose in driving story tension and retention",
    "aiVideoPrompt": "Complete photorealistic AI video prompt formatted with style, camera motion, lighting, and aspect ratio (${settings.aspectRatio || '16:9'})",
    "characterLockedPrompt": "AI prompt with locked character visual anchor integrated for visual consistency"
  }
]

Respond ONLY with valid JSON.`;

  const result = await withRetry(() => model.generateContent(prompt));
  const text = result.response.text();
  const parsed = JSON.parse(cleanJsonString(text));

  const list = Array.isArray(parsed) ? parsed : parsed.scenes || [parsed];

  let cumulativeSeconds = 0;
  const scenes: SceneBreakdown[] = list.map((s: any, index: number) => {
    const durSec = Number(s.durationSeconds) || Number(s.duration) || avgSecondsPerScene;
    const startSec = cumulativeSeconds;
    const endSec = cumulativeSeconds + durSec;
    cumulativeSeconds = endSec;

    const formatTime = (secs: number) => {
      const m = Math.floor(secs / 60);
      const sec = Math.floor(secs % 60);
      return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    const timeRangeStr = s.timeRange || `${formatTime(startSec)} - ${formatTime(endSec)}`;
    const charList = Array.isArray(s.characters)
      ? s.characters
      : Array.isArray(s.charactersPresent)
      ? s.charactersPresent
      : (characters && characters.length > 0 ? [characters[0].name] : []);

    const cameraAngleMotion = s.cameraAngleMotion || `${s.camera || '35mm Eye-Level'} with ${s.cameraMovement || 'slow smooth push-in'}`;
    const lightingMood = s.lightingMood || s.lighting || `Atmospheric cinematic lighting in ${settings.visualStyle}`;
    const dialogueVoiceover = s.dialogueVoiceover || s.dialogue || s.narrator || `Narrator voiceover for Scene ${index + 1}.`;

    return {
      sceneNumber: Number(s.sceneNumber) || index + 1,
      title: s.title || `Scene ${index + 1}: Story Progression`,
      durationSeconds: durSec,
      duration: `${durSec}s`,
      timeRange: timeRangeStr,
      location: s.location || 'Central Narrative Set',
      timeOfDay: s.timeOfDay || 'Cinematic Lighting',
      characters: charList,
      charactersPresent: charList,
      characterActions: s.characterActions || 'Enters frame, reacts with focused expression, and delivers spoken dialogue.',
      environment: s.environment || `High detail environment textured in ${settings.visualStyle}.`,
      visualDescription: s.visualDescription || `${settings.visualStyle} scene featuring dynamic composition and atmospheric depth.`,
      dialogue: s.dialogue || dialogueVoiceover,
      dialogueVoiceover: dialogueVoiceover,
      narrator: s.narrator || dialogueVoiceover,
      camera: s.camera || '35mm Cinematic Lens',
      cameraMovement: s.cameraMovement || 'Slow push-in dolly',
      cameraAngleMotion: cameraAngleMotion,
      lighting: s.lighting || lightingMood,
      lightingMood: lightingMood,
      animation: s.animation || s.animationStyle || 'Fluid cinematic character motion',
      animationStyle: s.animationStyle || s.animation || 'Fluid cinematic motion',
      soundEffects: s.soundEffects || 'Subtle atmospheric ambience',
      music: s.music || s.musicCue || 'Cinematic score supporting dramatic tension',
      musicCue: s.musicCue || s.music || 'Cinematic score cue',
      transition: s.transition || 'Smooth cut to next scene',
      scenePurpose: s.scenePurpose || 'Advance the core premise and maintain high viewer engagement.',
      aiVideoPrompt: s.aiVideoPrompt || `Cinematic shot, ${s.location || 'narrative environment'}, ${cameraAngleMotion}, ${lightingMood}, photorealistic 8k, --ar ${settings.aspectRatio || '16:9'} ${settings.visualStyle}`,
      characterLockedPrompt: s.characterLockedPrompt || s.aiVideoPrompt || `Cinematic shot with locked character consistency, ${settings.visualStyle}`,
    };
  });

  return scenes;
}

/**
 * Regenerate an individual single scene while maintaining strict continuity with the rest of the project.
 */
export async function generateSingleSceneAI(
  idea: string,
  settings: ProjectSettings,
  sceneNumber: number,
  existingScene: SceneBreakdown,
  allScenes?: SceneBreakdown[],
  concept?: ConceptData,
  script?: ScriptData,
  characters?: CharacterProfile[]
): Promise<SceneBreakdown> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server environment.');
  }

  const prevScene = allScenes?.find((s) => s.sceneNumber === sceneNumber - 1);
  const nextScene = allScenes?.find((s) => s.sceneNumber === sceneNumber + 1);

  const charactersContext = characters && characters.length > 0
    ? characters.map((c) => `- ${c.name} (${c.role}): [${c.visualPromptAnchor || c.clothingOutfit || c.visualAppearance}]`).join('\n')
    : 'No recurring characters.';

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: getGeminiModelName(),
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.75,
    },
  });

  const prompt = `You are a Senior Cinematographer and Visual Director.
Regenerate Scene #${sceneNumber} for the YouTube project "${idea}".

PROJECT SPECIFICATIONS:
- Video Idea: "${idea}"
- Concept: "${concept?.premise || idea}"
- Visual Style: "${settings.visualStyle}"
- Aspect Ratio: "${settings.aspectRatio || '16:9'}"
- Tone: "${settings.tone}"
- Language: "${settings.language}" (Dialogue & Voiceover MUST be in ${settings.language})

CONTINUITY CONTEXT:
${prevScene ? `- Previous Scene #${prevScene.sceneNumber}: "${prevScene.title}" at "${prevScene.location}" with action: "${prevScene.characterActions}"` : '- This is the opening scene.'}
- Target Scene #${sceneNumber}: "${existingScene.title}" (${existingScene.timeRange}, ${existingScene.durationSeconds}s)
${nextScene ? `- Next Scene #${nextScene.sceneNumber}: "${nextScene.title}" at "${nextScene.location}"` : '- This is the final scene.'}

LOCKED CHARACTERS:
${charactersContext}

Provide an upgraded, highly creative, visually compelling version of Scene #${sceneNumber} that seamlessly bridges between preceding and subsequent scenes.

Generate a JSON object matching this structure:
{
  "sceneNumber": ${sceneNumber},
  "title": "Fresh, engaging scene title",
  "durationSeconds": ${existingScene.durationSeconds || 30},
  "duration": "${existingScene.durationSeconds || 30}s",
  "timeRange": "${existingScene.timeRange || '00:00 - 00:30'}",
  "location": "Consistent location in ${settings.visualStyle}",
  "timeOfDay": "Time of day",
  "characters": ["Character name(s)"],
  "characterActions": "Explicit, dynamic blocking and physical character actions",
  "environment": "Detailed environmental set dressing in ${settings.visualStyle}",
  "visualDescription": "Composition, lighting, color harmony, and cinematic layers",
  "dialogue": "Spoken dialogue/narration line in ${settings.language}",
  "dialogueVoiceover": "Exact spoken line in ${settings.language}",
  "narrator": "Narrator voiceover",
  "camera": "Lens and angle (e.g. 50mm Medium Tracking Shot)",
  "cameraMovement": "Camera motion dynamics",
  "cameraAngleMotion": "Lens + camera movement combined",
  "lighting": "Atmospheric lighting setup",
  "lightingMood": "Lighting mood",
  "animation": "Motion cues",
  "soundEffects": "Diegetic sound effects",
  "music": "Score cue and vibe",
  "transition": "Transition into next scene",
  "scenePurpose": "Strategic role in narrative tension",
  "aiVideoPrompt": "Direct photorealistic AI video prompt for Sora/Runway (--ar ${settings.aspectRatio || '16:9'} ${settings.visualStyle})",
  "characterLockedPrompt": "Prompt with locked character consistency anchor"
}

Respond ONLY with valid JSON.`;

  const result = await withRetry(() => model.generateContent(prompt));
  const text = result.response.text();
  const parsed = JSON.parse(cleanJsonString(text));

  const cameraAngleMotion = parsed.cameraAngleMotion || `${parsed.camera || '35mm Lens'} with ${parsed.cameraMovement || 'dynamic tracking'}`;
  const lightingMood = parsed.lightingMood || parsed.lighting || `Cinematic lighting in ${settings.visualStyle}`;
  const dialogueVoiceover = parsed.dialogueVoiceover || parsed.dialogue || parsed.narrator || existingScene.dialogueVoiceover;

  const regeneratedScene: SceneBreakdown = {
    sceneNumber,
    title: parsed.title || existingScene.title,
    durationSeconds: Number(parsed.durationSeconds) || existingScene.durationSeconds || 30,
    duration: `${parsed.durationSeconds || existingScene.durationSeconds || 30}s`,
    timeRange: parsed.timeRange || existingScene.timeRange,
    location: parsed.location || existingScene.location,
    timeOfDay: parsed.timeOfDay || existingScene.timeOfDay || 'Cinematic Lighting',
    characters: Array.isArray(parsed.characters) ? parsed.characters : existingScene.characters || [],
    charactersPresent: Array.isArray(parsed.characters) ? parsed.characters : existingScene.charactersPresent || [],
    characterActions: parsed.characterActions || existingScene.characterActions,
    environment: parsed.environment || existingScene.environment || `Environment styled in ${settings.visualStyle}`,
    visualDescription: parsed.visualDescription || existingScene.visualDescription,
    dialogue: parsed.dialogue || dialogueVoiceover,
    dialogueVoiceover: dialogueVoiceover,
    narrator: parsed.narrator || dialogueVoiceover,
    camera: parsed.camera || existingScene.camera || '35mm Lens',
    cameraMovement: parsed.cameraMovement || existingScene.cameraMovement || 'Slow push-in',
    cameraAngleMotion: cameraAngleMotion,
    lighting: parsed.lighting || lightingMood,
    lightingMood: lightingMood,
    animation: parsed.animation || existingScene.animation || 'Fluid character motion',
    animationStyle: parsed.animationStyle || existingScene.animationStyle || 'Fluid motion',
    soundEffects: parsed.soundEffects || existingScene.soundEffects || 'Atmospheric sound',
    music: parsed.music || existingScene.music || 'Dramatic soundtrack',
    musicCue: parsed.musicCue || existingScene.musicCue || 'Dramatic soundtrack cue',
    transition: parsed.transition || existingScene.transition || 'Cut to next scene',
    scenePurpose: parsed.scenePurpose || existingScene.scenePurpose || 'Maintain audience retention and momentum.',
    aiVideoPrompt: parsed.aiVideoPrompt || existingScene.aiVideoPrompt,
    characterLockedPrompt: parsed.characterLockedPrompt || existingScene.characterLockedPrompt || parsed.aiVideoPrompt || existingScene.aiVideoPrompt,
  };

  return regeneratedScene;
}

/**
 * Generate real AI Video Prompts for ALL scenes based on locked characters, scene breakdown, script, and project settings.
 */
export async function generateAllVideoPromptsAI(
  idea: string,
  settings: ProjectSettings,
  concept?: ConceptData,
  hook?: HookData,
  script?: ScriptData,
  characters: CharacterProfile[] = [],
  scenes: SceneBreakdown[] = []
): Promise<SceneVideoPrompt[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server environment.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: getGeminiModelName(),
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7,
    },
  });

  const charactersContext = characters.length > 0
    ? characters
        .map(
          (c, idx) =>
            `Character #${idx + 1}: ${c.name} (${c.role})\n` +
            `- LOCKED Physical Appearance: ${c.appearance || c.visualAppearance}\n` +
            `- Face & Hair: ${c.face || 'N/A'}, ${c.hair || 'N/A'}\n` +
            `- Skin & Build: ${c.skinOrVisualCharacteristics || 'N/A'}, ${c.bodyOrBuild || 'N/A'}\n` +
            `- Signature Outfit / Wardrobe: ${c.clothing || c.clothingOutfit}\n` +
            `- Signature Items / Props: ${c.accessories || c.signatureItem}\n` +
            `- Locked Diffusion Anchor: "${c.visualPromptAnchor}"`
        )
        .join('\n\n')
    : 'No specific recurring characters. Ensure atmospheric consistency.';

  const scenesContext = scenes.length > 0
    ? scenes
        .map(
          (s) =>
            `SCENE #${s.sceneNumber}: "${s.title}" (${s.timeRange || `${s.durationSeconds || 30}s`})\n` +
            `- Location & Time: ${s.location} (${s.timeOfDay || 'Day'})\n` +
            `- Characters Present: ${Array.isArray(s.characters) ? s.characters.join(', ') : s.charactersPresent?.join(', ') || 'N/A'}\n` +
            `- Character Actions & Staging: ${s.characterActions}\n` +
            `- Environment: ${s.environment || s.visualDescription || 'N/A'}\n` +
            `- Spoken Dialogue/Voiceover: ${s.dialogueVoiceover || s.dialogue || s.narrator || 'N/A'}\n` +
            `- Camera: ${s.cameraAngleMotion || s.camera || '35mm cinematic'}\n` +
            `- Lighting: ${s.lightingMood || s.lighting || 'Cinematic'}\n` +
            `- SFX & Music: ${s.soundEffects || 'SFX'} | ${s.music || s.musicCue || 'Music'}\n` +
            `- Transition: ${s.transition || 'Cut'}`
        )
        .join('\n\n')
    : `Generate prompts for 5 sequential scenes for topic "${idea}".`;

  const voiceMode = settings.voiceMode || (settings.narration === 'Both' ? 'Narrator + Character Dialogue' : settings.narration === 'Voiceover' ? 'Narrator' : 'Character Dialogue');
  const isNoSpokenWords = voiceMode === 'No Spoken Dialogue';

  const prompt = `You are an elite Hollywood Director of Photography and AI Prompt Engineering Director for generative video systems (Google Veo, Runway Gen-3, Kling AI, Luma Dream Machine, OpenAI Sora).

Generate a complete, production-ready AI Video Prompt specification for EVERY scene listed below.

CRITICAL CONTINUITY & CONSISTENCY RULES:
1. LOCKED CHARACTER CONSISTENCY: For any character that appears in a scene, the visual description MUST STRICTLY match the Locked Character Consistency Profile. NEVER invent different clothing, hairstyle, facial features, proportions, age, or colors.
2. FAITHFUL SCENE BREAKDOWN: Follow the exact locations, blocking, dialogue, and actions defined in the Scene Breakdown. Do NOT invent unrelated events.
3. AUDIO & DIALOGUE ENFORCEMENT: Voice Mode is "${voiceMode}". ${isNoSpokenWords ? 'STRICT DIRECTIVE: NO SPOKEN WORDS. NO NARRATION. Audio cues must indicate background music and Foley only. Set dialogue to "NONE".' : `Include the exact spoken dialogue/voiceover in ${settings.language}.`}
4. DEDICATED MODEL FORMATS: Provide customized, optimized video prompt strings for:
   - Google Veo: High cinematic realism, detailed motion descriptors, aspect ratio flag, lighting mood, audio sync note.
   - Runway Gen-3: Structured with camera dynamics [e.g. "Low angle dolly forward into..."], subject motion, cinematic 8k render keywords.
   - Kling AI: High dynamic range, master shot composition, continuous physical motion, rich color rendering.
   - Luma Dream Machine: Fluid keyframe motion description, organic lighting interaction, smooth parallax depth.
   - OpenAI Sora: Hyper-detailed narrative visual prompt describing character anatomy, material textures, volumetric atmosphere, and precise physical causality.

PROJECT SPECS:
- Video Topic: "${idea}"
- Visual Style: "${settings.visualStyle}"
- Aspect Ratio: "${settings.aspectRatio || '16:9'}"
- Tone: "${settings.tone}"
- Language: "${settings.language}"
- Voice Mode: "${voiceMode}"

LOCKED CHARACTER PROFILES:
${charactersContext}

SCENE BREAKDOWN SEQUENCE:
${scenesContext}

Generate a JSON object with a "videoPrompts" array containing an entry for EVERY scene matching this exact schema:
{
  "videoPrompts": [
    {
      "sceneNumber": 1,
      "title": "Scene Title",
      "duration": "10s",
      "durationSeconds": 10,
      "aspectRatio": "${settings.aspectRatio || '16:9'}",
      "visualStyle": "${settings.visualStyle}",
      "characterConsistencyDescription": "Exact character visual attributes from locked profile (face, hair, signature clothes, props)",
      "environment": "Detailed physical environment, architecture, set dressing, and weather",
      "action": "Core character actions, interactions, and movements in the scene",
      "facialExpressions": "Subtle and overt facial cues, gaze direction, emotional micro-expressions",
      "bodyMovement": "Body posture, kinetics, pacing, gestures, and gait",
      "cameraShot": "Shot type (e.g. Extreme Close Up, Wide Establishing, Medium Two-Shot)",
      "cameraMovement": "Camera motion (e.g. Slow orbital crane pan, steadycam tracking forward, whip pan)",
      "lensFraming": "Lens focal length and framing (e.g. 35mm anamorphic, shallow depth of field, f/1.8 bokeh, rule of thirds)",
      "lighting": "Key light, rim light, fill, volumetric rays, color temperature (e.g. 3200K warm golden hour, dramatic chiaroscuro)",
      "atmosphere": "Atmospheric haze, dust motes, fog, particles, air quality, environmental mood",
      "animationStyle": "${settings.visualStyle} motion aesthetic, fluid frame rate, cinematic motion blur",
      "physicsMotion": "Physical dynamics (e.g. fabric cloth simulation, wind in hair, fluid splashes, gravity inertia)",
      "dialogue": "${isNoSpokenWords ? 'NONE (No Spoken Dialogue)' : `Exact spoken line in ${settings.language}`}",
      "voiceAudio": "${isNoSpokenWords ? 'NO SPOKEN AUDIO. Ambient Foley and background score only.' : 'Vocal tone, cadence, timbre, and delivery pacing'}",
      "soundEffects": "Layered diegetic Foley and environmental sound effects",
      "music": "Score style, instrumentation, tempo, and emotional swell",
      "transition": "Transition into the subsequent shot (e.g. Match cut on motion, whip pan, fade to black)",
      "negativePrompt": "blurry, low resolution, distorted limbs, extra fingers, morphing face, bad anatomy, text watermark, oversaturated artifacts, flickering, glitch",
      "finalPrompt": "Master comprehensive video prompt combining character, action, environment, camera, lighting, and style for maximum visual fidelity",
      "modelPrompts": {
        "veo": "Google Veo prompt with cinematic visual descriptors, camera motion, and visual style",
        "runway": "Runway Gen-3 prompt: [Camera movement] + [Subject & Action] + [Environment & Lighting] --ar ${settings.aspectRatio || '16:9'}",
        "kling": "Kling AI prompt: Master cinematic render of [Scene action], 4k resolution, high dynamic range, fluid physics",
        "luma": "Luma Dream Machine prompt: Smooth [camera move], [character action in environment], photorealistic lighting and depth of field",
        "sora": "OpenAI Sora prompt: Hyper-detailed photorealistic cinematic sequence of [Action and environment] with volumetric lighting, precise physical dynamics, and character consistency"
      }
    }
  ]
}

Respond ONLY with valid JSON.`;

  const result = await withRetry(() => model.generateContent(prompt));
  const text = result.response.text();
  const parsed = JSON.parse(cleanJsonString(text));

  const list = Array.isArray(parsed.videoPrompts)
    ? parsed.videoPrompts
    : Array.isArray(parsed)
    ? parsed
    : [];

  if (list.length === 0) {
    throw new Error('AI returned empty video prompts array');
  }

  return list.map((item: any, idx: number) => {
    const sceneNum = item.sceneNumber || idx + 1;
    const sceneRef = scenes.find((s) => s.sceneNumber === sceneNum) || scenes[idx];
    const durationSec = Number(item.durationSeconds) || sceneRef?.durationSeconds || 30;

    const modelPrompts: ModelSpecificPrompts = {
      veo: item.modelPrompts?.veo || item.finalPrompt || `${settings.visualStyle} scene ${sceneNum}`,
      runway: item.modelPrompts?.runway || item.finalPrompt || `${settings.visualStyle} scene ${sceneNum} --ar ${settings.aspectRatio || '16:9'}`,
      kling: item.modelPrompts?.kling || item.finalPrompt || `${settings.visualStyle} scene ${sceneNum}`,
      luma: item.modelPrompts?.luma || item.finalPrompt || `${settings.visualStyle} scene ${sceneNum}`,
      sora: item.modelPrompts?.sora || item.finalPrompt || `${settings.visualStyle} scene ${sceneNum}`,
    };

    return {
      sceneNumber: sceneNum,
      title: item.title || sceneRef?.title || `Scene #${sceneNum}`,
      duration: item.duration || `${durationSec}s`,
      durationSeconds: durationSec,
      aspectRatio: item.aspectRatio || settings.aspectRatio || '16:9',
      visualStyle: item.visualStyle || settings.visualStyle,
      characterConsistencyDescription: item.characterConsistencyDescription || sceneRef?.characterLockedPrompt || 'Consistent visual styling matching project theme',
      environment: item.environment || sceneRef?.environment || 'Cinematic environment',
      action: item.action || sceneRef?.characterActions || 'Dynamic scene action',
      facialExpressions: item.facialExpressions || 'Engaged and natural emotional expression',
      bodyMovement: item.bodyMovement || 'Fluid cinematic physical gestures',
      cameraShot: item.cameraShot || 'Medium Cinematic Shot',
      cameraMovement: item.cameraMovement || sceneRef?.cameraAngleMotion || 'Smooth tracking camera movement',
      lensFraming: item.lensFraming || '35mm lens, f/2.0 shallow depth of field',
      lighting: item.lighting || sceneRef?.lightingMood || 'Cinematic three-point lighting',
      atmosphere: item.atmosphere || 'Atmospheric volumetric lighting and depth',
      animationStyle: item.animationStyle || `${settings.visualStyle} with natural motion blur`,
      physicsMotion: item.physicsMotion || 'Realistic material and cloth physics',
      dialogue: item.dialogue || sceneRef?.dialogueVoiceover || '',
      voiceAudio: item.voiceAudio || 'Clear resonant voice delivery',
      soundEffects: item.soundEffects || sceneRef?.soundEffects || 'Environmental Foley',
      music: item.music || sceneRef?.music || sceneRef?.musicCue || 'Cinematic background score',
      transition: item.transition || sceneRef?.transition || 'Cut to next scene',
      negativePrompt: item.negativePrompt || 'blurry, low resolution, bad anatomy, deformed limbs, artifacts, watermark',
      finalPrompt: item.finalPrompt || `${item.action}, ${item.environment}, ${item.lighting}, ${settings.visualStyle}`,
      modelPrompts,
    };
  });
}

/**
 * Regenerate an individual scene's video prompt with real AI, preserving all other scenes and project tabs.
 */
export async function generateSingleVideoPromptAI(
  idea: string,
  settings: ProjectSettings,
  sceneNumber: number,
  existingPrompt?: Partial<SceneVideoPrompt>,
  allPrompts: SceneVideoPrompt[] = [],
  concept?: ConceptData,
  script?: ScriptData,
  characters: CharacterProfile[] = [],
  scenes: SceneBreakdown[] = []
): Promise<SceneVideoPrompt> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server environment.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: getGeminiModelName(),
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7,
    },
  });

  const sceneRef = scenes.find((s) => s.sceneNumber === sceneNumber);
  const prevPrompt = allPrompts.find((p) => p.sceneNumber === sceneNumber - 1);
  const nextPrompt = allPrompts.find((p) => p.sceneNumber === sceneNumber + 1);

  const charactersContext = characters.length > 0
    ? characters
        .map(
          (c) =>
            `- Character ${c.name} (${c.role}): Locked Appearance: ${c.appearance || c.visualAppearance} | Outfit: ${c.clothing || c.clothingOutfit} | Anchor: "${c.visualPromptAnchor}"`
        )
        .join('\n')
    : 'No recurring characters.';

  const prompt = `You are an elite Hollywood Director of Photography and AI Prompt Engineering Director for generative video models (Google Veo, Runway Gen-3, Kling AI, Luma Dream Machine, OpenAI Sora).

Regenerate a production-ready AI Video Prompt specifically for SCENE #${sceneNumber}.

CRITICAL REQUIREMENTS:
1. ONLY modify Scene #${sceneNumber}'s video prompt parameters.
2. LOCKED CHARACTER CONSISTENCY: Visual descriptions MUST STRICTLY match the Locked Character Consistency Profile. Never alter clothes, face, hairstyle, or proportions.
3. SCENE BREAKDOWN FIDELITY: Follow Scene #${sceneNumber}'s defined action: "${sceneRef?.characterActions || existingPrompt?.action || 'Scene action'}" and location: "${sceneRef?.location || existingPrompt?.environment || 'Scene location'}".
4. CONTINUITY: Seamlessly bridge from Scene #${sceneNumber - 1} (${prevPrompt?.title || 'Preceding scene'}) to Scene #${sceneNumber + 1} (${nextPrompt?.title || 'Next scene'}).

PROJECT SPECS:
- Idea: "${idea}"
- Visual Style: "${settings.visualStyle}"
- Aspect Ratio: "${settings.aspectRatio || '16:9'}"
- Tone: "${settings.tone}"
- Language: "${settings.language}"

LOCKED CHARACTER PROFILES:
${charactersContext}

TARGET SCENE DETAILS:
- Title: "${sceneRef?.title || existingPrompt?.title || `Scene #${sceneNumber}`}"
- Location: "${sceneRef?.location || existingPrompt?.environment || 'Thematic Environment'}"
- Action: "${sceneRef?.characterActions || existingPrompt?.action || 'Key dynamic actions'}"
- Dialogue: "${sceneRef?.dialogueVoiceover || sceneRef?.dialogue || existingPrompt?.dialogue || ''}"
- Lighting: "${sceneRef?.lightingMood || existingPrompt?.lighting || 'Cinematic lighting'}"
- Camera: "${sceneRef?.cameraAngleMotion || existingPrompt?.cameraMovement || 'Cinematic motion'}"

Generate a JSON object matching this exact structure:
{
  "sceneNumber": ${sceneNumber},
  "title": "${sceneRef?.title || existingPrompt?.title || `Scene #${sceneNumber}`}",
  "duration": "${sceneRef?.durationSeconds || existingPrompt?.durationSeconds || 30}s",
  "durationSeconds": ${sceneRef?.durationSeconds || existingPrompt?.durationSeconds || 30},
  "aspectRatio": "${settings.aspectRatio || '16:9'}",
  "visualStyle": "${settings.visualStyle}",
  "characterConsistencyDescription": "Locked visual traits from character profiles",
  "environment": "Vivid environmental setup and props in ${settings.visualStyle}",
  "action": "Clear character actions and staging",
  "facialExpressions": "Expressive facial emotion and gaze",
  "bodyMovement": "Body posture, dynamic movement, and physical blocking",
  "cameraShot": "Shot framing (e.g. Medium Close Up, Wide Pan)",
  "cameraMovement": "Dynamic camera motion path",
  "lensFraming": "Lens focal length and depth of field (e.g. 50mm f/1.8)",
  "lighting": "Atmospheric lighting setup",
  "atmosphere": "Volumetric particles, haze, and environment mood",
  "animationStyle": "${settings.visualStyle} motion cadence",
  "physicsMotion": "Physical interaction and fluid cloth motion",
  "dialogue": "${sceneRef?.dialogueVoiceover || sceneRef?.dialogue || existingPrompt?.dialogue || ''}",
  "voiceAudio": "Delivery cadence and audio tone",
  "soundEffects": "${sceneRef?.soundEffects || 'Diegetic SFX'}",
  "music": "${sceneRef?.music || sceneRef?.musicCue || 'Score soundtrack'}",
  "transition": "${sceneRef?.transition || 'Cut'}",
  "negativePrompt": "blurry, low resolution, bad anatomy, deformed limbs, artifacts, watermark, jitter",
  "finalPrompt": "Master comprehensive AI video prompt combining all parameters",
  "modelPrompts": {
    "veo": "Google Veo formatted prompt",
    "runway": "Runway Gen-3 prompt with camera motion and --ar ${settings.aspectRatio || '16:9'}",
    "kling": "Kling AI prompt with high dynamic range master shot",
    "luma": "Luma Dream Machine prompt with fluid motion description",
    "sora": "OpenAI Sora hyper-detailed narrative cinematic prompt"
  }
}

Respond ONLY with valid JSON.`;

  const result = await withRetry(() => model.generateContent(prompt));
  const text = result.response.text();
  const parsed = JSON.parse(cleanJsonString(text));

  const durationSec = Number(parsed.durationSeconds) || existingPrompt?.durationSeconds || sceneRef?.durationSeconds || 30;

  const modelPrompts: ModelSpecificPrompts = {
    veo: parsed.modelPrompts?.veo || parsed.finalPrompt || existingPrompt?.modelPrompts?.veo || `${settings.visualStyle} scene ${sceneNumber}`,
    runway: parsed.modelPrompts?.runway || parsed.finalPrompt || existingPrompt?.modelPrompts?.runway || `${settings.visualStyle} scene ${sceneNumber} --ar ${settings.aspectRatio || '16:9'}`,
    kling: parsed.modelPrompts?.kling || parsed.finalPrompt || existingPrompt?.modelPrompts?.kling || `${settings.visualStyle} scene ${sceneNumber}`,
    luma: parsed.modelPrompts?.luma || parsed.finalPrompt || existingPrompt?.modelPrompts?.luma || `${settings.visualStyle} scene ${sceneNumber}`,
    sora: parsed.modelPrompts?.sora || parsed.finalPrompt || existingPrompt?.modelPrompts?.sora || `${settings.visualStyle} scene ${sceneNumber}`,
  };

  const regenerated: SceneVideoPrompt = {
    sceneNumber,
    title: parsed.title || sceneRef?.title || existingPrompt?.title || `Scene #${sceneNumber}`,
    duration: parsed.duration || `${durationSec}s`,
    durationSeconds: durationSec,
    aspectRatio: parsed.aspectRatio || settings.aspectRatio || '16:9',
    visualStyle: parsed.visualStyle || settings.visualStyle,
    characterConsistencyDescription: parsed.characterConsistencyDescription || existingPrompt?.characterConsistencyDescription || sceneRef?.characterLockedPrompt || 'Consistent character visual styling',
    environment: parsed.environment || sceneRef?.environment || existingPrompt?.environment || 'Cinematic environment',
    action: parsed.action || sceneRef?.characterActions || existingPrompt?.action || 'Scene action',
    facialExpressions: parsed.facialExpressions || existingPrompt?.facialExpressions || 'Natural expression',
    bodyMovement: parsed.bodyMovement || existingPrompt?.bodyMovement || 'Dynamic motion',
    cameraShot: parsed.cameraShot || existingPrompt?.cameraShot || 'Medium shot',
    cameraMovement: parsed.cameraMovement || sceneRef?.cameraAngleMotion || existingPrompt?.cameraMovement || 'Smooth pan',
    lensFraming: parsed.lensFraming || existingPrompt?.lensFraming || '35mm cinematic lens',
    lighting: parsed.lighting || sceneRef?.lightingMood || existingPrompt?.lighting || 'Cinematic lighting',
    atmosphere: parsed.atmosphere || existingPrompt?.atmosphere || 'Atmospheric depth',
    animationStyle: parsed.animationStyle || existingPrompt?.animationStyle || `${settings.visualStyle} motion`,
    physicsMotion: parsed.physicsMotion || existingPrompt?.physicsMotion || 'Natural physics',
    dialogue: parsed.dialogue || sceneRef?.dialogueVoiceover || existingPrompt?.dialogue || '',
    voiceAudio: parsed.voiceAudio || existingPrompt?.voiceAudio || 'Clear vocal tone',
    soundEffects: parsed.soundEffects || sceneRef?.soundEffects || existingPrompt?.soundEffects || 'Diegetic SFX',
    music: parsed.music || sceneRef?.music || sceneRef?.musicCue || existingPrompt?.music || 'Atmospheric score',
    transition: parsed.transition || sceneRef?.transition || existingPrompt?.transition || 'Cut',
    negativePrompt: parsed.negativePrompt || existingPrompt?.negativePrompt || 'blurry, distorted, bad anatomy, artifacts',
    finalPrompt: parsed.finalPrompt || `${parsed.action || 'Action'}, ${parsed.environment || 'Environment'}, ${settings.visualStyle}`,
    modelPrompts,
  };

  return regenerated;
}

/**
 * Generate 3 distinct high-CTR Thumbnail concepts and AI image prompts.
 */
export async function generateThumbnailsAI(
  idea: string,
  settings: ProjectSettings,
  concept?: ConceptData,
  hook?: HookData,
  script?: ScriptData,
  characters: CharacterProfile[] = [],
  scenes: SceneBreakdown[] = []
): Promise<ThumbnailData> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server environment.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: getGeminiModelName(),
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.75,
    },
  });

  const charactersContext = characters.length > 0
    ? characters
        .map(
          (c, idx) =>
            `Character #${idx + 1}: ${c.name} (${c.role})\n` +
            `- Appearance: ${c.appearance || c.visualAppearance}\n` +
            `- Face/Hair: ${c.face || ''}, ${c.hair || ''}\n` +
            `- Signature Outfit: ${c.clothing || c.clothingOutfit}\n` +
            `- Visual Anchor: "${c.visualPromptAnchor}"`
        )
        .join('\n\n')
    : 'No specific recurring characters. Ensure atmospheric consistency.';

  const prompt = `You are an elite YouTube Creative Director & Thumbnail Strategist responsible for 9-figure view channels (MrBeast, Veritasium, Mark Rober style high-CTR thumbnails).

Create 3 DISTINCT, high-converting thumbnail concepts for this YouTube video.

PROJECT SPECIFICATIONS:
- Video Idea: "${idea}"
- Concept: "${concept?.premise || concept?.coreAngle || idea}"
- Hook Angle: "${hook?.hookOptions?.find((h) => h.id === hook?.selectedHookId)?.text || hook?.hookOptions?.[0]?.text || ''}"
- Visual Style: "${settings.visualStyle}"
- Target Audience: "${settings.audience || 'General'}"
- Tone: "${settings.tone}"
- Language: "${settings.language}"

LOCKED CHARACTER CONSISTENCY:
${charactersContext}

THUMBNAIL STRATEGY REQUIREMENTS:
1. Concept #1: High Emotion / Dramatic Character Face & Shocking Focal Element
2. Concept #2: High Curiosity / Mysterious Story Question & Visual Paradox
3. Concept #3: High Action / Climax Scene Moment with Dynamic Scale Contrast
4. Keep character facial appearance, hair, and wardrobe strictly aligned with the Locked Character Profiles.
5. Provide a production-ready Midjourney v6 / DALL-E 3 image prompt for each concept with lighting, composition, and --ar 16:9.
6. Suggested text overlay must be short (2-4 words max, huge visual punch) or empty if purely visual.

Output a JSON object with this exact structure:
{
  "concepts": [
    {
      "id": "c1",
      "conceptTitle": "Concept 1 Title",
      "visualConcept": "Detailed explanation of the visual hook and why it drives clicks",
      "mainSubject": "Main character or focal subject description",
      "characterExpression": "Intense micro-expression (e.g. eyes wide in shock, mouth agape)",
      "background": "Cinematic contextual background",
      "foregroundElements": "Foreground props, glowing particles, or depth elements",
      "composition": "Compositional framing (e.g. Rule of thirds, dynamic low angle, extreme foreground zoom)",
      "focalPoint": "Primary point of eye convergence",
      "lighting": "High contrast rim lighting, directional spotlight, volumetric glow",
      "colorDirection": "Complementary saturated palette (e.g. Electric Cyan #00E5FF vs Fiery Amber #FF7700)",
      "emotion": "Dominant psychological trigger (e.g. Disbelief, High Stakes, Curiosity)",
      "suggestedText": "2-4 WORDS MAX",
      "textPlacement": "Top-Left / Top-Right / Bottom-Right",
      "fontStyle": "Heavy bold sans-serif, drop shadow, high-contrast border",
      "clickabilityScore": 94,
      "previewDescription": "A short summary describing what the viewer sees at first glance",
      "aiImagePrompt": "Cinematic 16:9 YouTube thumbnail, [Subject & Expression with Locked Character Profile], [Action/Pose], [Background & Environment], [Lighting & Color], 8k resolution, ultra-detailed, photorealistic render --ar 16:9 --v 6.0",
      "negativePrompt": "blurry, low quality, bad anatomy, deformed hands, extra fingers, text watermark, watermark logo, noisy artifacts, dark muddy colors",
      "colorPalette": ["#FF0055", "#00F0FF", "#FFE600", "#111827"]
    }
  ],
  "canvaLayoutSuggestion": "Recommendation for overlay text placement, typography pairings, and graphic badges"
}

Respond ONLY with valid JSON.`;

  const result = await withRetry(() => model.generateContent(prompt));
  const text = result.response.text();
  const parsed = JSON.parse(cleanJsonString(text));

  const list = Array.isArray(parsed.concepts) ? parsed.concepts : [];
  if (list.length === 0) {
    throw new Error('AI returned empty thumbnail concepts');
  }

  const concepts: ThumbnailConcept[] = list.map((c: any, idx: number) => {
    const cId = c.id || `c${idx + 1}`;
    const cTitle = c.conceptTitle || c.title || `Concept #${idx + 1}`;
    return {
      id: cId,
      conceptTitle: cTitle,
      title: cTitle,
      visualConcept: c.visualConcept || c.previewDescription || 'High CTR visual concept',
      mainSubject: c.mainSubject || 'Featured Character',
      characterExpression: c.characterExpression || c.facialExpression || 'Intense and expressive',
      facialExpression: c.characterExpression || c.facialExpression || 'Intense and expressive',
      background: c.background || 'Dynamic cinematic background',
      foregroundElements: c.foregroundElements || 'Visual depth cues and props',
      composition: c.composition || 'Rule of thirds, dramatic framing',
      focalPoint: c.focalPoint || 'Main subject face and key item',
      lighting: c.lighting || 'Cinematic rim light with soft key illumination',
      colorDirection: c.colorDirection || 'High contrast complementary colors',
      emotion: c.emotion || 'Curiosity and suspense',
      suggestedText: c.suggestedText || c.textOverlay || 'REVEALED',
      textOverlay: c.suggestedText || c.textOverlay || 'REVEALED',
      textPlacement: c.textPlacement || 'Top Left',
      fontStyle: c.fontStyle || 'Bold Impact Sans-Serif with Drop Shadow',
      clickabilityScore: Number(c.clickabilityScore) || 92,
      previewDescription: c.previewDescription || c.visualConcept || 'Compelling thumbnail composition',
      aiImagePrompt: c.aiImagePrompt || `Cinematic YouTube thumbnail for ${idea}, ${settings.visualStyle}, ultra-detailed 8k --ar 16:9`,
      negativePrompt: c.negativePrompt || 'blurry, bad anatomy, text watermark, deformed, artifacts',
      colorPalette: Array.isArray(c.colorPalette) ? c.colorPalette : ['#FF4500', '#00D2FF', '#FFFFFF'],
    };
  });

  return {
    concepts,
    midjourneyPrompt: concepts[0]?.aiImagePrompt || `Cinematic 16:9 thumbnail for ${idea}`,
    canvaLayoutSuggestion: parsed.canvaLayoutSuggestion || 'Place bold text in top-left with high contrast backdrop; keep face on right third.',
    selectedConceptId: concepts[0]?.id || 'c1',
  };
}

/**
 * Regenerate an individual Thumbnail concept (e.g. Concept #2 only).
 */
export async function generateSingleThumbnailAI(
  idea: string,
  settings: ProjectSettings,
  conceptIndex: number,
  existingConcepts: ThumbnailConcept[] = [],
  characters: CharacterProfile[] = [],
  scenes: SceneBreakdown[] = []
): Promise<ThumbnailConcept> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server environment.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: getGeminiModelName(),
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.8,
    },
  });

  const existingOther = existingConcepts
    .filter((_, idx) => idx !== conceptIndex)
    .map((c, i) => `Other Concept #${i + 1}: "${c.conceptTitle || c.title}" (${c.visualConcept})`)
    .join('\n');

  const charContext = characters.length > 0
    ? characters
        .map(
          (c) =>
            `- ${c.name}: ${c.appearance || c.visualAppearance}, outfit: ${c.clothing || c.clothingOutfit}, anchor: "${c.visualPromptAnchor}"`
        )
        .join('\n')
    : 'Maintain consistent visual theme.';

  const prompt = `You are a world-class YouTube Thumbnail Artist & Strategist.
Generate a brand-new, unique Concept #${conceptIndex + 1} for this video, making sure it is distinctly different from the other existing concepts.

VIDEO DETAILS:
- Video Idea: "${idea}"
- Visual Style: "${settings.visualStyle}"
- Target Audience: "${settings.audience || 'General'}"
- Tone: "${settings.tone}"

CHARACTER CONSISTENCY:
${charContext}

OTHER EXISTING CONCEPTS (DO NOT DUPLICATE THESE):
${existingOther || 'None'}

Produce JSON matching this exact structure:
{
  "id": "c${conceptIndex + 1}",
  "conceptTitle": "Fresh Dynamic Angle Title",
  "visualConcept": "Detailed visual description maximizing curiosity and CTR",
  "mainSubject": "Main subject or character description",
  "characterExpression": "Vivid facial expression",
  "background": "Cinematic backdrop with environmental storytelling",
  "foregroundElements": "Floating props or depth elements",
  "composition": "Framing and perspective details",
  "focalPoint": "Exact focal anchor",
  "lighting": "Atmospheric lighting setup",
  "colorDirection": "High-contrast color scheme",
  "emotion": "Core emotional driver",
  "suggestedText": "2-4 WORDS",
  "textPlacement": "Top Left / Top Right",
  "fontStyle": "Punchy typography style",
  "clickabilityScore": 95,
  "previewDescription": "What the viewer sees in 0.5 seconds",
  "aiImagePrompt": "Cinematic 16:9 YouTube thumbnail, [Subject with Locked Profile], [Pose/Action], [Background], [Lighting], 8k render, photorealistic --ar 16:9 --v 6.0",
  "negativePrompt": "blurry, low quality, bad anatomy, text watermark, deformed, artifacts",
  "colorPalette": ["#FF0055", "#00F0FF", "#FFE600", "#111827"]
}

Respond ONLY with valid JSON.`;

  const result = await withRetry(() => model.generateContent(prompt));
  const text = result.response.text();
  const c = JSON.parse(cleanJsonString(text));

  const cId = c.id || `c${conceptIndex + 1}`;
  const cTitle = c.conceptTitle || c.title || `Concept #${conceptIndex + 1}`;

  return {
    id: cId,
    conceptTitle: cTitle,
    title: cTitle,
    visualConcept: c.visualConcept || c.previewDescription || 'High CTR visual concept',
    mainSubject: c.mainSubject || 'Featured Character',
    characterExpression: c.characterExpression || c.facialExpression || 'Intense and expressive',
    facialExpression: c.characterExpression || c.facialExpression || 'Intense and expressive',
    background: c.background || 'Dynamic cinematic background',
    foregroundElements: c.foregroundElements || 'Visual depth cues and props',
    composition: c.composition || 'Rule of thirds, dramatic framing',
    focalPoint: c.focalPoint || 'Main subject face and key item',
    lighting: c.lighting || 'Cinematic rim light with soft key illumination',
    colorDirection: c.colorDirection || 'High contrast complementary colors',
    emotion: c.emotion || 'Curiosity and suspense',
    suggestedText: c.suggestedText || c.textOverlay || 'REVEALED',
    textOverlay: c.suggestedText || c.textOverlay || 'REVEALED',
    textPlacement: c.textPlacement || 'Top Left',
    fontStyle: c.fontStyle || 'Bold Impact Sans-Serif with Drop Shadow',
    clickabilityScore: Number(c.clickabilityScore) || 93,
    previewDescription: c.previewDescription || c.visualConcept || 'Compelling thumbnail composition',
    aiImagePrompt: c.aiImagePrompt || `Cinematic YouTube thumbnail for ${idea}, ${settings.visualStyle}, ultra-detailed 8k --ar 16:9`,
    negativePrompt: c.negativePrompt || 'blurry, bad anatomy, text watermark, deformed, artifacts',
    colorPalette: Array.isArray(c.colorPalette) ? c.colorPalette : ['#FF4500', '#00D2FF', '#FFFFFF'],
  };
}

/**
 * Generate complete YouTube SEO package: 10 evaluated titles, rich description, structured keywords, tags, hashtags, and accurate timestamped chapters.
 */
export async function generateSeoAI(
  idea: string,
  settings: ProjectSettings,
  concept?: ConceptData,
  hook?: HookData,
  script?: ScriptData,
  scenes: SceneBreakdown[] = []
): Promise<SeoData> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server environment.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: getGeminiModelName(),
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7,
    },
  });

  const scenesContext = scenes.length > 0
    ? scenes
        .map((s, idx) => `Scene ${s.sceneNumber}: "${s.title}" (Duration: ${s.durationSeconds || 30}s)`)
        .join('\n')
    : 'Standard 5 scene sequence.';

  const totalDurationSeconds = scenes.reduce((acc, s) => acc + (s.durationSeconds || 30), 0) || 180;

  const prompt = `You are an industry-leading YouTube SEO & Algorithmic Discovery Specialist.
Create a complete, master-level YouTube SEO optimization package for this video.

PROJECT SPECIFICATIONS:
- Video Idea: "${idea}"
- Target Audience: "${settings.audience || 'General'}"
- Language: "${settings.language}"
- Tone: "${settings.tone}"
- Visual Style: "${settings.visualStyle}"
- Total Scene Count: ${scenes.length || 5}
- Estimated Total Video Duration: ${totalDurationSeconds} seconds (${Math.floor(totalDurationSeconds / 60)}m ${totalDurationSeconds % 60}s)

SCENE BREAKDOWN (Use to create realistic timestamp chapters):
${scenesContext}

REQUIREMENTS:
1. TITLES: Generate EXACTLY 10 distinct, high-CTR title options.
   - Evaluate each title for: curiosity (1-100), searchRelevance (1-100), clarity (1-100), clickAppeal (1-100).
   - Compute character count (charCount).
   - MARK EXACTLY ONE title as "badge": "best-overall".
   - MARK EXACTLY ONE title as "badge": "best-search".
   - MARK EXACTLY ONE title as "badge": "best-curiosity".
   - All other titles have "badge": null.

2. DESCRIPTION: Write an engaging, multi-paragraph YouTube description in ${settings.language}:
   - Strong opening hook (first 2 lines visible before 'Show More')
   - Natural, non-spammy keyword integration
   - Clear video summary & key takeaways
   - Audience value statement
   - Call to action (Subscribe, comment question, share)
   - Relevant hashtags at the bottom

3. KEYWORDS & TAGS:
   - primaryKeyword (The single highest-traffic root search query)
   - secondaryKeywords (5-8 high intent related phrases)
   - longTailKeywords (5-8 specific conversational search queries)
   - tags (15-25 comma-separated YouTube keyword tags)
   - hashtags (5-8 relevant hashtags prefixed with #)

4. CHAPTERS:
   - Generate chronological, logical timestamped chapters starting at 00:00.
   - Do NOT create timestamps that exceed the actual total video duration of ${totalDurationSeconds} seconds!

Output a JSON object matching this exact schema:
{
  "titleOptions": [
    {
      "id": "t1",
      "title": "Compelling Title Here",
      "style": "Curiosity / How-To / High Stakes / Story",
      "curiosityScore": 95,
      "searchRelevanceScore": 88,
      "clarityScore": 92,
      "clickAppealScore": 96,
      "charCount": 48,
      "estimatedCTR": "14.2%",
      "badge": "best-overall"
    }
  ],
  "description": "Full formatted YouTube description with paragraphs and spacing...",
  "primaryKeyword": "main root search term",
  "secondaryKeywords": ["phrase 1", "phrase 2", "phrase 3", "phrase 4", "phrase 5"],
  "longTailKeywords": ["long tail query 1", "long tail query 2", "long tail query 3", "long tail query 4"],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10", "tag11", "tag12", "tag13", "tag14", "tag15"],
  "hashtags": ["#Topic", "#Viral", "#Guide", "#YouTube", "#Trend"],
  "chapters": [
    { "timecode": "00:00", "title": "Introduction & Hook" },
    { "timecode": "00:35", "title": "The Big Reveal" }
  ]
}

Respond ONLY with valid JSON.`;

  const result = await withRetry(() => model.generateContent(prompt));
  const text = result.response.text();
  const parsed = JSON.parse(cleanJsonString(text));

  const rawTitles = Array.isArray(parsed.titleOptions) ? parsed.titleOptions : [];
  const titleOptions: TitleOption[] = rawTitles.slice(0, 10).map((t: any, idx: number) => ({
    id: t.id || `t${idx + 1}`,
    title: t.title || `Title Option #${idx + 1}`,
    style: t.style || 'High CTR',
    curiosityScore: Number(t.curiosityScore) || 85,
    searchRelevanceScore: Number(t.searchRelevanceScore) || 85,
    clarityScore: Number(t.clarityScore) || 90,
    clickAppealScore: Number(t.clickAppealScore) || 90,
    charCount: t.title ? t.title.length : (t.charCount || 50),
    estimatedCTR: t.estimatedCTR || `${(10 + Math.random() * 4).toFixed(1)}%`,
    badge: t.badge === 'best-overall' || t.badge === 'best-search' || t.badge === 'best-curiosity' ? t.badge : null,
  }));

  // Ensure badges exist
  if (!titleOptions.some((t) => t.badge === 'best-overall') && titleOptions.length > 0) {
    titleOptions[0].badge = 'best-overall';
  }
  if (!titleOptions.some((t) => t.badge === 'best-search') && titleOptions.length > 1) {
    titleOptions[1].badge = 'best-search';
  }
  if (!titleOptions.some((t) => t.badge === 'best-curiosity') && titleOptions.length > 2) {
    titleOptions[2].badge = 'best-curiosity';
  }

  const primaryKeyword = parsed.primaryKeyword || idea;
  const secondaryKeywords = Array.isArray(parsed.secondaryKeywords) ? parsed.secondaryKeywords : [idea];
  const longTailKeywords = Array.isArray(parsed.longTailKeywords) ? parsed.longTailKeywords : [idea];

  return {
    selectedTitle: titleOptions[0]?.title || idea,
    titleOptions,
    description: parsed.description || `In this video, we explore ${idea}. Subscribe for more!`,
    primaryKeyword,
    secondaryKeywords,
    longTailKeywords,
    keywordsStructured: {
      primaryKeyword,
      secondaryKeywords,
      longTailKeywords,
    },
    tags: Array.isArray(parsed.tags) ? parsed.tags : [idea, settings.visualStyle, settings.videoType],
    hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : ['#YouTube', '#Video'],
    chapters: Array.isArray(parsed.chapters) ? parsed.chapters : [],
  };
}

/**
 * Generate 3 Shorts ideas in 9:16 vertical format directly derived from the long-form content.
 */
export async function generateShortsAI(
  idea: string,
  settings: ProjectSettings,
  concept?: ConceptData,
  hook?: HookData,
  script?: ScriptData,
  characters: CharacterProfile[] = [],
  scenes: SceneBreakdown[] = []
): Promise<ShortsData> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server environment.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: getGeminiModelName(),
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.75,
    },
  });

  const scenesContext = scenes.length > 0
    ? scenes
        .map((s) => `Scene ${s.sceneNumber}: "${s.title}" - Action: ${s.characterActions} - Dialogue: ${s.dialogueVoiceover || 'N/A'}`)
        .join('\n')
    : 'Long form video content.';

  const charactersContext = characters.length > 0
    ? characters.map((c) => `${c.name} (${c.role}): ${c.visualAppearance || c.appearance}`).join(', ')
    : 'Consistent characters';

  const prompt = `You are a viral YouTube Shorts, TikTok & Instagram Reels Specialist.
Create 3 high-converting, 9:16 vertical Short scripts derived directly from the long-form video content.

PROJECT SPECIFICATIONS:
- Video Idea: "${idea}"
- Concept: "${concept?.premise || concept?.coreAngle || idea}"
- Tone: "${settings.tone}"
- Visual Style: "${settings.visualStyle}"
- Language: "${settings.language}"
- Characters: ${charactersContext}

LONG-FORM SCENE BREAKDOWN TO ADAPT FROM:
${scenesContext}

REQUIREMENTS FOR EACH SHORT:
1. Format: 9:16 Vertical video.
2. Hook: Irresistible first 1-3 seconds hook that stops the scroll immediately.
3. Target Duration: 30s to 50s.
4. Complete Narration Script.
5. Visual Beats: 4-6 chronological time-stamped visual cuts with on-screen text overlays and narration.
6. Scene Selection: Explicitly identify which long-form scenes this short adapts.
7. Strong Ending & Loop/CTA.
8. Relevant Shorts hashtags (e.g. #Shorts #Viral #Story).

Output a JSON object with this exact structure:
{
  "scripts": [
    {
      "id": "s1",
      "shortTitle": "High-Paced Hook Cut",
      "title": "High-Paced Hook Cut",
      "hook": "Stop scrolling: you won't believe what happens when...",
      "duration": "45s",
      "targetDuration": "45s",
      "script": "Complete spoken word script for the narrator or character...",
      "visualBeats": [
        {
          "second": "0-3s",
          "visual": "Extreme close up of character reacting to shocking discovery",
          "audioNarration": "Wait until you see this...",
          "onScreenCaption": "DO NOT TRY THIS ⚠️"
        },
        {
          "second": "4-15s",
          "visual": "Fast cuts of the climactic action",
          "audioNarration": "Here is what went down...",
          "onScreenCaption": "THE BIG MOMENT"
        }
      ],
      "characters": ["Main Character"],
      "sceneSelection": ["Scene 1", "Scene 3", "Scene 5"],
      "ending": "Clever loop sentence leading back to the beginning",
      "callToAction": "Subscribe to watch the full long-form breakdown!",
      "CTA": "Subscribe to watch the full long-form breakdown!",
      "shortDescription": "Quick engaging caption for YouTube Shorts / TikTok",
      "hashtags": ["#Shorts", "#Viral", "#Storytime", "#YouTubeShorts"]
    }
  ]
}

Respond ONLY with valid JSON.`;

  const result = await withRetry(() => model.generateContent(prompt));
  const text = result.response.text();
  const parsed = JSON.parse(cleanJsonString(text));

  const list = Array.isArray(parsed.scripts) ? parsed.scripts : [];
  if (list.length === 0) {
    throw new Error('AI returned empty shorts scripts');
  }

  const scripts: ShortScript[] = list.map((s: any, idx: number) => {
    const sId = s.id || `s${idx + 1}`;
    const sTitle = s.shortTitle || s.title || `Short #${idx + 1}`;
    const dur = s.duration || s.targetDuration || '45s';
    const cta = s.callToAction || s.CTA || 'Subscribe for the full video!';

    return {
      id: sId,
      shortTitle: sTitle,
      title: sTitle,
      hook: s.hook || 'Watch till the end...',
      duration: dur,
      targetDuration: dur,
      script: s.script || s.hook || 'Exciting short story narration.',
      visualBeats: Array.isArray(s.visualBeats) ? s.visualBeats : [],
      characters: Array.isArray(s.characters) ? s.characters : characters.map((c) => c.name),
      sceneSelection: Array.isArray(s.sceneSelection) ? s.sceneSelection : ['Scene 1', 'Scene 2'],
      ending: s.ending || 'And that is why you should always be ready.',
      callToAction: cta,
      CTA: cta,
      shortDescription: s.shortDescription || `${sTitle} - Watch the full story on our channel!`,
      hashtags: Array.isArray(s.hashtags) ? s.hashtags : ['#Shorts', '#Viral', '#YouTube'],
      audioSoundtrack: s.audioSoundtrack || 'Fast-paced rhythmic synth with dramatic drop',
    };
  });

  return { scripts };
}

/**
 * Regenerate an individual Short script (e.g. Short #2 only).
 */
export async function generateSingleShortAI(
  idea: string,
  settings: ProjectSettings,
  shortIndex: number,
  existingShorts: ShortScript[] = [],
  concept?: ConceptData,
  script?: ScriptData,
  characters: CharacterProfile[] = [],
  scenes: SceneBreakdown[] = []
): Promise<ShortScript> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server environment.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: getGeminiModelName(),
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.8,
    },
  });

  const otherShorts = existingShorts
    .filter((_, idx) => idx !== shortIndex)
    .map((s, i) => `Other Short #${i + 1}: "${s.shortTitle || s.title}" - Hook: "${s.hook}"`)
    .join('\n');

  const prompt = `You are a viral YouTube Shorts & TikTok Creative Director.
Regenerate a brand new, high-converting Short #${shortIndex + 1} derived from this video, ensuring it has a fresh hook angle distinct from the other shorts.

VIDEO TOPIC: "${idea}"
STYLE: "${settings.visualStyle}"
LANGUAGE: "${settings.language}"
TONE: "${settings.tone}"

OTHER EXISTING SHORTS (DO NOT DUPLICATE THESE ANGLES):
${otherShorts || 'None'}

Generate JSON matching this exact structure:
{
  "id": "s${shortIndex + 1}",
  "shortTitle": "Fresh Hook Concept",
  "title": "Fresh Hook Concept",
  "hook": "Scroll-stopping first 3-second hook...",
  "duration": "45s",
  "targetDuration": "45s",
  "script": "Full spoken narration script...",
  "visualBeats": [
    {
      "second": "0-3s",
      "visual": "Opening visual hook",
      "audioNarration": "Opening spoken line",
      "onScreenCaption": "BOLD HOOK CAPTION"
    },
    {
      "second": "4-15s",
      "visual": "Mid-scene progression",
      "audioNarration": "Body narration",
      "onScreenCaption": "KEY INSIGHT"
    },
    {
      "second": "16-30s",
      "visual": "Climactic resolution",
      "audioNarration": "Ending line",
      "onScreenCaption": "FINAL TAKEAWAY"
    }
  ],
  "characters": ["Character Name"],
  "sceneSelection": ["Scene 2", "Scene 4"],
  "ending": "Loop-closing sentence",
  "callToAction": "Subscribe for the full video!",
  "CTA": "Subscribe for the full video!",
  "shortDescription": "Engaging short caption with CTA",
  "hashtags": ["#Shorts", "#Viral", "#Story", "#FYP"]
}

Respond ONLY with valid JSON.`;

  const result = await withRetry(() => model.generateContent(prompt));
  const text = result.response.text();
  const s = JSON.parse(cleanJsonString(text));

  const sId = s.id || `s${shortIndex + 1}`;
  const sTitle = s.shortTitle || s.title || `Short #${shortIndex + 1}`;
  const dur = s.duration || s.targetDuration || '45s';
  const cta = s.callToAction || s.CTA || 'Subscribe for the full video!';

  return {
    id: sId,
    shortTitle: sTitle,
    title: sTitle,
    hook: s.hook || 'Watch this before it is too late...',
    duration: dur,
    targetDuration: dur,
    script: s.script || s.hook || 'Engaging short script narration.',
    visualBeats: Array.isArray(s.visualBeats) ? s.visualBeats : [],
    characters: Array.isArray(s.characters) ? s.characters : characters.map((c) => c.name),
    sceneSelection: Array.isArray(s.sceneSelection) ? s.sceneSelection : ['Scene 1'],
    ending: s.ending || 'Follow for more!',
    callToAction: cta,
    CTA: cta,
    shortDescription: s.shortDescription || `${sTitle} - Watch full video!`,
    hashtags: Array.isArray(s.hashtags) ? s.hashtags : ['#Shorts', '#Viral'],
    audioSoundtrack: s.audioSoundtrack || 'Dramatic upbeat background music',
  };
}


