import {
  YouTubeProject,
  VideoSettings,
  VideoConcept,
  VideoHook,
  VideoScript,
  CharacterProfile,
  SceneBreakdown,
  SceneVideoPrompt,
  ModelSpecificPrompts,
  ThumbnailData,
  ThumbnailConcept,
  YouTubeSEO,
  SeoData,
  TitleOption,
  ShortsData,
  ShortScript,
} from '@/types/project';

const STORAGE_KEY = 'yt_studio_projects_v2';
const ACTIVE_PROJECT_KEY = 'yt_studio_active_id';

export const INITIAL_DEMO_PROJECTS: YouTubeProject[] = [
  {
    id: 'proj-kids-abc-1',
    projectId: 'proj-kids-abc-1',
    title: 'Kids ABC Adventure: Magical Jungle Journey',
    idea: 'Kids ABC Adventure: Magical Jungle Journey',
    createdAt: '2026-08-20T10:00:00.000Z',
    updatedAt: '2026-08-23T14:20:00.000Z',
    settings: {
      videoType: 'Kids',
      audience: 'Kids',
      language: 'English',
      duration: '3 minutes',
      targetDuration: '3-5 Minutes',
      format: 'YouTube Long Form',
      visualStyle: '3D Cartoon',
      tone: 'Fun',
      narration: 'Both',
      sceneCount: '5',
      targetScenesCount: 4,
      aspectRatio: '16:9',
      includeCharacters: true,
      targetPace: 'Gentle Kids Pace',
    },
    concept: {
      titleWorking: 'Kids ABC Adventure: The Safari Alphabet Expedition',
      premise: 'A cheerful safari expedition through a magical glowing jungle where every letter of the alphabet comes alive as an adorable animated 3D animal.',
      coreAngle: 'Interactive call-and-response phonics with upbeat rhythm and repetition designed for toddlers and early learners.',
      targetAudience: {
        demographic: 'Toddlers & Preschoolers (Ages 2-6) and Parents',
        interests: ['ABC Learning', 'Animal Cartoons', 'Sing-Along Nursery Rhymes'],
        painPointsOrCuriosity: 'Parents want screen time that is genuinely educational, calm, and delightful rather than over-stimulating.',
        viewingMotivation: 'Learning phonics sounds and animal names through immersive visual delight.',
      },
      educationalOrEntertainmentValue: 'Teaches letter recognition, phonetic pronunciation, and animal vocabulary through phonics mnemonics.',
      whyItWorks: 'High contrast vibrant 3D models with big expressive eyes retain infant focus, while rhythmic pacing avoids cognitive overload.',
      toneAnalysis: 'High-energy, warm, cheerful, and encouraging with musical audio accompaniment.',
    },
    hook: {
      selectedHookId: 'hook-1',
      hookOptions: [
        {
          id: 'hook-1',
          type: 'Visual Hook',
          text: 'Look! A magical golden letter is hiding behind the giant jungle leaves! Can you guess what letter makes the "Ah-Ah" sound?',
          visualDirection: 'Camera glides through oversized lush jungle leaves with golden sparkle particles revealing the letter A shaped like an apple tree.',
          estimatedDeliverySeconds: 6,
          explanation: 'Immediate visual curiosity with an engaging question that prompts instant vocal participation from the toddler.',
        },
        {
          id: 'hook-2',
          type: 'Pattern Interrupt',
          text: 'Wait! Did you hear that roar? It’s not a scary monster... it’s Leo the Laughing Lion!',
          visualDirection: 'Camera fast-zooms into a dark bush, which opens to reveal an ultra-cute smiling cartoon lion cub holding a letter L.',
          estimatedDeliverySeconds: 5,
          explanation: 'Subverts expectations of danger with immediate comedic relief and character charm.',
        },
      ],
      retentionStrategy: 'Use bouncing on-screen character icons and gentle musical chimes every 4 seconds to maintain eye tracking.',
      first30SecondsRoadmap: [
        '00:00 - 00:06: Golden glowing letter reveal with sparkling sound effect',
        '00:06 - 00:15: Pip the Explorer Bunny appears and invites viewer onto the safari cart',
        '00:15 - 00:30: Letter A & Alligator musical rhyme sequence with call-and-response',
      ],
    },
    characters: [
      {
        id: 'char-1',
        name: 'Pip the Explorer Bunny',
        role: 'Protagonist / Host Guide',
        ageOrSpecies: '3-year-old Fluffy White Bunny',
        visualAppearance: 'Chubby white bunny with oversized floppy ears, large twinkling blue eyes, and pink button nose',
        hairOrFeatures: 'Soft velvety fur texture with Pixar-level subsurface scattering',
        clothingOutfit: 'Khaki safari vest with tiny brass buttons, safari pith hat, and yellow mini sneakers',
        signatureItem: 'Magnifying glass with a glowing crystal lens',
        personalityTraits: ['Curious', 'Bubbly', 'Supportive', 'Enthusiastic'],
        voiceStyle: 'High-pitched, warm, energetic, and articulate with musical cadence',
        visualPromptAnchor: 'Pip the chubby safari bunny, 3D Pixar character design, soft white fur, safari vest and pith hat, expressive big eyes, Unreal Engine 5 render',
      },
      {
        id: 'char-2',
        name: 'Barnaby the Gentle Bear',
        role: 'Sidekick / Rhyme Co-Host',
        ageOrSpecies: 'Friendly Brown Honey Bear',
        visualAppearance: 'Cuddly round caramel-brown bear with a cream-colored belly',
        hairOrFeatures: 'Plush teddy bear fur texture',
        clothingOutfit: 'Teal bandana with white polka dots',
        signatureItem: 'Wooden drum that plays letter beat taps',
        personalityTraits: ['Gentle', 'Playful', 'Loves Honey', 'Patient'],
        voiceStyle: 'Warm, baritone-gentle, friendly, reminiscent of Winnie the Pooh',
        visualPromptAnchor: 'Barnaby the friendly cartoon bear, 3D Pixar style, caramel brown fur, teal polka dot bandana, wholesome expression',
      },
    ],
    script: {
      totalWordCount: 420,
      estimatedReadTime: '3 min 15 sec',
      sections: [
        {
          id: 'sec-1',
          name: 'Scene 1: The Safari Gates Open',
          timecode: '00:00 - 00:35',
          visualDirection: 'Golden sunrise over vibrant cartoon jungle canopy. Wooden safari gates swing open with playful xylophone chime.',
          dialogueOrNarration: 'Pip: "Hop-hop-hooray! Welcome to the Alphabet Safari, little explorers! Today we are on a secret mission to find all 26 magic letters! Hop aboard the Safari Cart!"',
          onScreenText: 'WELCOME TO ALPHABET SAFARI! 🦁',
          soundEffectOrMusicCue: 'Upbeat playful ukulele & marimba intro theme',
          deliveryNotes: 'Enthusiastic and welcoming with pauses for toddler responses.',
        },
        {
          id: 'sec-2',
          name: 'Scene 2: Letter A — Alligator in the Apple River',
          timecode: '00:35 - 01:15',
          visualDirection: 'Safari cart stops by a sparkling turquoise stream. An emerald green baby alligator with a purple bow juggles red apples.',
          dialogueOrNarration: 'Pip: "Look over there! It’s Allie the Alligator! A is for Alligator... /æ/ /æ/ Alligator! Can you say /æ/ /æ/ Alligator with me?"\nBarnaby: "Chomp, chomp, yummy red apples!"',
          onScreenText: 'A is for ALLIGATOR (Ah - Ah - Alligator)',
          soundEffectOrMusicCue: 'Playful water splashes and gentle cartoon woodblock chomps',
          deliveryNotes: 'Emphasize the phonetic vowel sound /æ/ clearly twice.',
        },
        {
          id: 'sec-3',
          name: 'Scene 3: Letter B & C — Bear & Cheetah Race',
          timecode: '01:15 - 02:10',
          visualDirection: 'Sunny meadow with giant rainbow flowers. Barnaby the Bear bounces on a trampoline while Charlie the Cheetah zooms past with racing goggles.',
          dialogueOrNarration: 'Pip: "B is for Bear! /b/ /b/ Bear! And zoom! C is for Cheetah! /k/ /k/ Cheetah!"\nBarnaby: "Bouncing high for the letter B!"',
          onScreenText: 'B = BEAR 🐻 | C = CHEETAH 🐆',
          soundEffectOrMusicCue: 'Boing sound effect followed by cartoon whoosh whistle',
        },
        {
          id: 'sec-4',
          name: 'Scene 4: The Safari Dance Party & Celebration',
          timecode: '02:10 - 03:00',
          visualDirection: 'All animals gather at the sunset campfire clearing, dancing under glowing fireflies as rainbow confetti floats down.',
          dialogueOrNarration: 'Pip: "You did it! You found the letters and made so many animal friends! Give yourself a big happy clap!"\nBarnaby: "See you next time on the Alphabet Safari! Bye-bye!"',
          onScreenText: 'GREAT JOB! YOU ARE A SUPER EXPLORER! ⭐',
          soundEffectOrMusicCue: 'Grand celebration fanfare with cheering cartoon children',
        },
      ],
    },
    scenes: [
      {
        sceneNumber: 1,
        durationSeconds: 35,
        timeRange: '00:00 - 00:35',
        title: 'Safari Gate Opening & Welcome',
        location: 'Glowing Emerald Jungle Entrance with Wooden Totem Gates',
        charactersPresent: ['Pip the Explorer Bunny'],
        characterActions: 'Pip hops out from behind a giant monstera leaf, waves at the viewer, and points toward the colorful open safari buggy.',
        dialogueVoiceover: 'Hop-hop-hooray! Welcome to the Alphabet Safari, little explorers! Hop aboard the Safari Cart!',
        cameraAngleMotion: 'Wide establishing crane shot descending into a playful eye-level dolly push-in toward Pip.',
        lightingMood: 'Golden hour fairy-tale lighting with warm volumetric sunbeams through palm leaves.',
        animationStyle: '3D Pixar Animation, smooth squash-and-stretch cartoon motion.',
        soundEffects: 'Jungle birds chirping, rustling leaves, cheerful xylophone glissando.',
        musicCue: 'Upbeat marimba & acoustic guitar melody.',
        aiVideoPrompt: 'Cinematic 3D animation, Pixar style, cute fluffy white bunny wearing a khaki safari vest and pith hat waving in front of giant cartoon jungle gates, magical golden sunbeams, vibrant colors, 8k render, Octane render --ar 16:9',
        characterLockedPrompt: 'Pip the chubby safari bunny, 3D Pixar character, khaki vest, yellow sneakers, big blue eyes, smiling face',
      },
      {
        sceneNumber: 2,
        durationSeconds: 40,
        timeRange: '00:35 - 01:15',
        title: 'Allie the Alligator at the Apple Stream',
        location: 'Crystal Turquoise Riverbank with Giant Floating Apples',
        charactersPresent: ['Pip the Explorer Bunny', 'Allie the Alligator'],
        characterActions: 'Allie the baby alligator pops out of water wearing a purple bow, happily balancing three glossy red apples on her snout.',
        dialogueVoiceover: 'A is for Alligator... /æ/ /æ/ Alligator! Can you say /æ/ /æ/ Alligator with me?',
        cameraAngleMotion: 'Low angle river-level track following the floating apples, snapping into a medium two-shot.',
        lightingMood: 'Bright daylight with crystal water caustics dancing on the riverbank.',
        animationStyle: '3D Pixar Animation, glossy water shaders, soft fluid dynamics.',
        soundEffects: 'Gentle water ripples, cartoon pop sound, friendly alligator giggle.',
        musicCue: 'Rhythmic bouncy bassline with rhythmic clapping.',
        aiVideoPrompt: 'Adorable baby cartoon alligator with emerald scales and cute purple bow juggling shiny red apples in a turquoise jungle stream, 3D Disney Pixar aesthetic, ultra-detailed water reflections, 8k resolution --ar 16:9',
        characterLockedPrompt: 'Allie the baby alligator, cute emerald cartoon alligator with purple hair bow, smiling expressive eyes',
      },
      {
        sceneNumber: 3,
        durationSeconds: 55,
        timeRange: '01:15 - 02:10',
        title: 'The Bear & Cheetah Meadow Sprint',
        location: 'Pastel Meadow with Rainbow Giant Mushrooms and Trampoline Flowers',
        charactersPresent: ['Pip the Explorer Bunny', 'Barnaby the Bear', 'Charlie the Cheetah'],
        characterActions: 'Barnaby does a slow-motion playful belly bounce on a giant pink flower while Charlie dashes across leaving a sparkling dust trail.',
        dialogueVoiceover: 'B is for Bear! /b/ /b/ Bear! And zoom! C is for Cheetah! /k/ /k/ Cheetah!',
        cameraAngleMotion: 'Dynamic lateral high-speed tracking shot matching Charlie’s speed, easing into a comic freeze frame on Barnaby.',
        lightingMood: 'Vibrant afternoon sunlight with floating rainbow bubbles.',
        animationStyle: 'High-energy cartoon physics, anime-inspired speed lines rendered in 3D.',
        soundEffects: 'Springy boing sound, supersonic cartoon zip, cheerful giggle.',
        musicCue: 'Fast tempo brass and xylophone carnival tune.',
        aiVideoPrompt: 'Cute caramel teddy bear bouncing on giant glowing mushroom in sunny cartoon valley while a speedy baby cheetah in goggles races by, 3D Pixar style, saturated vivid colors, cinematic depth of field --ar 16:9',
        characterLockedPrompt: 'Barnaby the friendly bear, caramel brown fur, teal bandana, round belly, joyful expression',
      },
      {
        sceneNumber: 4,
        durationSeconds: 50,
        timeRange: '02:10 - 03:00',
        title: 'The Sunset Alphabet Dance Party',
        location: 'Sunset Jungle Clearing with Bioluminescent Lanterns and Fireflies',
        charactersPresent: ['Pip the Explorer Bunny', 'Barnaby the Bear', 'Allie the Alligator', 'Charlie the Cheetah'],
        characterActions: 'All characters do a synchronised toddler dance wave, jumping in unison as the 26 glowing letters form a rainbow arch in the sky.',
        dialogueVoiceover: 'You did it! You found the letters and made so many animal friends! See you next time on the Alphabet Safari!',
        cameraAngleMotion: 'Slow 360 degree panoramic crane shot pulling back into a wide magical sunset panorama.',
        lightingMood: 'Warm orange and magenta twilight with hundreds of glowing golden fireflies.',
        animationStyle: 'Magical particle effects, soft volumetric fog, celebratory character choreography.',
        soundEffects: 'Firefly twinkles, cheering children, celebratory party poppers.',
        musicCue: 'Triumphant orchestral celebration reprise with kids choir chorus.',
        aiVideoPrompt: 'All cute 3D safari animals dancing together in a glowing sunset jungle clearing, magical floating neon alphabet letters forming a rainbow in twilight sky, 3D Pixar masterpiece, cinematic lighting, 8k render --ar 16:9',
        characterLockedPrompt: 'Ensemble cast of Pip the bunny, Barnaby the bear, and safari animals in festive celebration',
      },
    ],
    thumbnail: {
      concepts: [
        {
          id: 'thumb-1',
          title: 'Extreme Close-Up Glowing Letter Surprise',
          focalPoint: 'Pip the Bunny holding a glowing 3D Golden Letter A with extreme wide-eyed excitement',
          facialExpression: 'Huge open-mouthed happy smile with sparkling dilated cartoon eyes',
          composition: 'Character on left third looking right toward a giant sparkling 3D letter "A", warm jungle background blurred with bokeh',
          colorPalette: ['#FFDD00', '#FF2D55', '#34C759', '#0A84FF'],
          textOverlay: 'ABC MAGIC! 🦁',
          fontStyle: 'Chubby 3D cartoon typography with white stroke and bold yellow drop shadow',
          clickabilityScore: 96,
          previewDescription: 'High contrast primary colors engineered to stand out on mobile YouTube feeds for parents and kids.',
        },
      ],
      selectedConceptId: 'thumb-1',
      aiPrompt: 'YouTube thumbnail of cute 3D Pixar white bunny wearing safari hat holding a glowing magical golden 3D letter A, vibrant jungle background, high contrast, 8k, ultra sharp focus, saturated vivid colors, 16:9 aspect ratio',
      midjourneyPrompt: '/imagine prompt: High CTR YouTube thumbnail, adorable 3D Pixar bunny character in safari vest, holding glowing giant letter A with bright emerald alligator in background, extreme high contrast, vibrant saturated colors, Unreal Engine 5 render --ar 16:9 --v 6.0',
      dallEPrompt: 'A vibrant 3D Pixar-style YouTube video thumbnail showing a cute white rabbit in a safari hat holding a giant glowing letter A next to a smiling baby alligator in a colorful jungle.',
    },
    youtubeSeo: {
      selectedTitle: 'Kids ABC Safari! 🦁 Learn Alphabet & Animal Phonics for Toddlers (3D Cartoon)',
      titleOptions: [
        {
          id: 't-1',
          title: 'Kids ABC Safari! 🦁 Learn Alphabet & Animal Phonics for Toddlers (3D Cartoon)',
          style: 'High Emotion',
          estimatedCTR: 'Very High (12-16%)',
        },
        {
          id: 't-2',
          title: 'Learn ABCs with Jungle Animals! 🐘 Phonics Song & 3D Animal Adventure',
          style: 'SEO / Search',
          estimatedCTR: 'High (9-12%)',
        },
        {
          id: 't-3',
          title: 'The Magic Alphabet Jungle: A to Z Phonics for Preschoolers',
          style: 'Curiosity Gap',
          estimatedCTR: 'Solid (7-9%)',
        },
      ],
      description: 'Join Pip the Safari Bunny on a magical 3D animated adventure through the Alphabet Jungle! 🌿 Learn letter names, phonics sounds, and meet friendly animals from A to Z.\n\n⏰ Timestamps:\n00:00 - Welcome to Alphabet Safari\n00:35 - Letter A (Alligator & Apples)\n01:15 - Letter B & C (Bear & Cheetah)\n02:10 - Sunset Safari Dance Celebration\n\n✨ Perfect for toddlers, preschoolers, and kindergarten phonics readiness.\n\n#ABC #Phonics #KidsLearning #PreschoolSongs #AnimalCartoons',
      seoKeywords: [
        { keyword: 'abc song for toddlers', volumeLevel: 'High', competition: 'High', intent: 'Educational Search' },
        { keyword: 'learn alphabet 3d cartoon', volumeLevel: 'High', competition: 'Medium', intent: 'Visual Discovery' },
        { keyword: 'animal phonics sounds', volumeLevel: 'Trending', competition: 'Low', intent: 'Preschool Learning' },
        { keyword: 'kindergarten alphabet safari', volumeLevel: 'Long-Tail', competition: 'Low', intent: 'Curated Classroom' },
      ],
      tags: ['ABC song', 'phonics for kids', 'learn alphabet', 'kids animation 3d', 'safari animals for children', 'preschool learning', 'nursery rhymes', 'alphabet phonics'],
      hashtags: ['#KidsLearning', '#ABC', '#Phonics', '#PreschoolCartoons', '#ToddlerFun'],
    },
    shorts: {
      ideas: [
        {
          id: 'short-1',
          title: 'Can You Guess What Allie the Alligator Loves to Eat? 🐊🍎',
          hook: 'Wait! Look at this baby alligator balancing 3 red apples on her nose!',
          angle: 'Fast 15-second visual teaser with interactive tap-the-screen call to action.',
          estimatedViralPotential: 'Extreme',
          targetDuration: '25 Seconds',
        },
        {
          id: 'short-2',
          title: 'The Fastest Cheetah in the Alphabet Jungle! ⚡🐆',
          hook: 'Blink and you will miss Charlie the Cheetah zooming past Barnaby the Bear!',
          angle: 'Speed cut pattern interrupt with comical cartoon sound effects.',
          estimatedViralPotential: 'Very High',
          targetDuration: '30 Seconds',
        },
      ],
      scripts: [
        {
          id: 'short-script-1',
          title: 'Allie the Alligator Apple Chomp Challenge',
          hook: 'Can you say /æ/ /æ/ Alligator before Allie chomps the big red apple?',
          targetDuration: '25s',
          visualBeats: [
            { second: '0-5s', visual: 'Extreme close up of baby alligator with 3 balancing apples wobbling', audioNarration: 'Watch out! The apples are about to drop!', onScreenCaption: 'CAN SHE CATCH THEM?! 🍎👀' },
            { second: '5-18s', visual: 'Slow motion cartoon chomp with rainbow apple juice splash', audioNarration: 'CHOMP! A is for Alligator! Say /æ/ /æ/ Alligator!', onScreenCaption: 'A = ALLIGATOR 🐊' },
            { second: '18-25s', visual: 'Pip the Bunny pops up pointing to subscribe button', audioNarration: 'Tap subscribe to explore the rest of the Alphabet Safari!', onScreenCaption: 'TAP SUBSCRIBE FOR MORE! 🔔' },
          ],
          callToAction: 'Subscribe for daily 3D alphabet cartoons!',
          audioSoundtrack: 'Fast bouncy marimba beat with cartoon sound effects',
        },
      ],
    },
  },
];

export function createSampleProject(): YouTubeProject {
  return INITIAL_DEMO_PROJECTS[0];
}

export function loadAllProjects(): YouTubeProject[] {
  if (typeof window === 'undefined') return INITIAL_DEMO_PROJECTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_PROJECTS));
      return INITIAL_DEMO_PROJECTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_PROJECTS));
    return INITIAL_DEMO_PROJECTS;
  } catch (err) {
    console.error('Failed to load projects from storage:', err);
    return INITIAL_DEMO_PROJECTS;
  }
}

export function loadProjectById(id: string): YouTubeProject | null {
  const all = loadAllProjects();
  return all.find((p) => p.id === id || p.projectId === id) || null;
}

export function saveProject(project: YouTubeProject): void {
  if (typeof window === 'undefined') return;
  try {
    const all = loadAllProjects();
    const existingIndex = all.findIndex((p) => p.id === project.id || p.projectId === project.id);
    const updated: YouTubeProject = {
      ...project,
      id: project.id || project.projectId || `proj-${Date.now()}`,
      projectId: project.id || project.projectId || `proj-${Date.now()}`,
      title: project.title || project.idea,
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      all[existingIndex] = updated;
    } else {
      all.unshift(updated);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    localStorage.setItem(ACTIVE_PROJECT_KEY, updated.id);
  } catch (err) {
    console.error('Failed to save project:', err);
  }
}

export function deleteProject(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const all = loadAllProjects().filter((p) => p.id !== id && p.projectId !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    if (getActiveProjectId() === id) {
      localStorage.removeItem(ACTIVE_PROJECT_KEY);
    }
  } catch (err) {
    console.error('Failed to delete project:', err);
  }
}

export function getActiveProjectId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_PROJECT_KEY);
}

export function setActiveProjectId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_PROJECT_KEY, id);
}

// -------------------------------------------------------------
// Context-Aware Dynamic Generation Functions for Projects & Modules
// -------------------------------------------------------------

function parseDurationSeconds(durationStr?: string): number {
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

function parseSceneSeconds(sceneDurationStr?: string, defaultSec = 10): number {
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

export function createNewProjectPlaceholder(
  idea: string,
  settings: VideoSettings,
  overrides?: {
    concept?: VideoConcept;
    hook?: VideoHook;
    script?: VideoScript;
    characters?: CharacterProfile[];
    scenes?: SceneBreakdown[];
    videoPrompts?: SceneVideoPrompt[];
  }
): YouTubeProject {
  const now = new Date().toISOString();
  const id = `proj-${Date.now()}`;
  const title = idea.trim();

  const totalSec = parseDurationSeconds(settings.totalDuration || settings.duration || settings.targetDuration);
  const sceneSec = parseSceneSeconds(settings.sceneDuration, 10);
  const calculatedScenesCount = Math.max(1, Math.round(totalSec / sceneSec));

  let resolvedScenes = calculatedScenesCount;
  if (typeof settings.sceneCount === 'number') {
    resolvedScenes = settings.sceneCount;
  } else if (!isNaN(Number(settings.sceneCount)) && Number(settings.sceneCount) > 0) {
    resolvedScenes = Number(settings.sceneCount);
  } else if (settings.targetScenesCount) {
    resolvedScenes = settings.targetScenesCount;
  }

  const voiceMode = settings.voiceMode || (settings.narration === 'Both' ? 'Narrator + Character Dialogue' : settings.narration === 'Voiceover' ? 'Narrator' : 'Character Dialogue');

  const normalizedSettings: VideoSettings = {
    ...settings,
    totalDuration: settings.totalDuration || settings.duration || `${Math.round(totalSec / 60)} minutes`,
    sceneDuration: settings.sceneDuration || `${sceneSec} seconds`,
    voiceMode,
    targetScenesCount: resolvedScenes,
    targetDuration: settings.totalDuration || settings.duration || `${Math.round(totalSec / 60)} minutes`,
    includeCharacters: settings.includeCharacters ?? true,
    aspectRatio: settings.aspectRatio || '16:9',
  };

  const projectPartial: YouTubeProject = {
    id,
    projectId: id,
    title,
    idea: title,
    createdAt: now,
    updatedAt: now,
    settings: normalizedSettings,
    concept: {} as any,
    hook: {} as any,
    characters: [],
    script: {} as any,
    scenes: [],
    videoPrompts: [],
    thumbnail: {} as any,
    youtubeSeo: {} as any,
    shorts: {} as any,
  };

  projectPartial.concept = overrides?.concept || generateConceptForProject(title, normalizedSettings);
  projectPartial.hook = overrides?.hook || generateHookForProject(title, normalizedSettings);
  projectPartial.characters = overrides?.characters || (normalizedSettings.includeCharacters
    ? generateCharactersForProject(title, normalizedSettings)
    : []);
  projectPartial.script = overrides?.script || generateScriptForProject(title, normalizedSettings);
  projectPartial.scenes = overrides?.scenes || generateScenesForProject(title, normalizedSettings, resolvedScenes);
  projectPartial.videoPrompts = overrides?.videoPrompts || generateVideoPromptsForProject(title, normalizedSettings, projectPartial.scenes, projectPartial.characters);
  projectPartial.thumbnail = generateThumbnailForProject(title, normalizedSettings, projectPartial.characters);
  projectPartial.youtubeSeo = generateSeoForProject(title, normalizedSettings, projectPartial.scenes);
  projectPartial.shorts = generateShortsForProject(title, normalizedSettings, projectPartial.characters, projectPartial.scenes);

  return projectPartial;
}

// Section Generator Helpers
export function generateConceptForProject(title: string, settings: VideoSettings): VideoConcept {
  const lower = title.toLowerCase();
  const isKids = settings.videoType === 'Kids' || settings.videoType === 'Kids Story' || lower.includes('boy') || lower.includes('girl') || lower.includes('elephant') || lower.includes('jungle') || lower.includes('magical') || lower.includes('kids') || lower.includes('golu');
  const isDoc = settings.videoType === 'Documentary' || settings.videoType === 'Story' || lower.includes('history') || lower.includes('secret') || lower.includes('truth') || lower.includes('underwater');
  const isHindi = settings.language === 'Hindi' || (settings.language && settings.language.toLowerCase().includes('hindi'));

  let premise = `An immersive, high-retention video production exploring "${title}" crafted in ${settings.visualStyle} style in ${settings.language}.`;
  let coreAngle = `Approaching "${title}" through vivid narrative pacing, distinctive visual worldbuilding, and emotional character connection in ${settings.language}.`;
  let demographic = `${settings.audience || 'General'} audience enjoying ${settings.visualStyle} visual storytelling in ${settings.language}`;
  let whyItWorks = `Combines high-contrast visual curiosity with emotional story stakes designed for ${settings.tone} delivery in ${settings.language}.`;

  if (isKids) {
    premise = isHindi
      ? `"${title}" par aadharit ek manmohak aur jadui kahani, jismein paatra dosti, saahas aur anokhe chamatkaron ka anubhav karte hain.`
      : `A heartwarming and magical journey centered on "${title}", following endearing characters as they discover wonder, friendship, and courage.`;
    coreAngle = isHindi
      ? `Jadui vatavaran, dil ko chhu lene wale paatra, aur ${settings.language} mein shuddh evam aakarshak samvaad.`
      : `Vibrant character dynamics, magical sensory visual worldbuilding, and authentic dialogue in ${settings.language}.`;
    demographic = `Children, families, and story lovers watching in ${settings.language}`;
    whyItWorks = isHindi
      ? `Sundar ${settings.visualStyle} animation, pyaare paatra, aur Hindi bhasha ki madhurta darshakon ko baandh kar rakhti hai.`
      : `Immediate character charm, magical creatures, and luminous ${settings.visualStyle} animation maintain complete viewer engagement.`;
  } else if (isDoc) {
    premise = isHindi
      ? `"${title}" ke ankahe raazon aur anokhi duniya ki ek romanchak cinematic khoj yatra.`
      : `A cinematic, deep-dive visual investigation exploring the untold truths and captivating dimensions of "${title}".`;
    coreAngle = isHindi
      ? `Gahraayi se bhare drishya, rahasyamayi vatavaran aur ${settings.language} mein prabhavi nirdeshan.`
      : `Dramatic visual reconstruction, atmospheric lighting, and high-tension narrative pacing.`;
    demographic = `Curious viewers, documentary enthusiasts, and mystery fans watching in ${settings.language}`;
    whyItWorks = isHindi
      ? `Pehle drishya se hi suspense aur anokha aakarshan darshakon ko antim kshan tak jode rakhta hai.`
      : `High narrative tension and atmospheric depth keep retention high from the opening hook to the climactic reveal.`;
  }

  return {
    titleWorking: title,
    premise,
    coreAngle,
    targetAudience: {
      demographic,
      interests: [settings.videoType || 'Animation', settings.visualStyle, 'Cinematic Storytelling', settings.language],
      painPointsOrCuriosity: isHindi
        ? `Darshak "${title}" ki sundar aur prabhavshali kahani ko Hindi bhasha aur behtareen visuals ke sath dekhna chahte hain.`
        : `Viewers want a captivating, visually rich experience of "${title}" with authentic emotion and seamless visual continuity.`,
      viewingMotivation: isHindi
        ? `"${title}" ke jadui sansaar aur romanchak anubhav ko ${settings.tone} andaaz mein mehsus karna.`
        : `To experience the wonder of "${title}" delivered in ${settings.tone} tone with ${settings.visualStyle} aesthetics.`,
    },
    educationalOrEntertainmentValue: `Delivers premium ${settings.visualStyle} visuals with authentic ${settings.voiceMode || settings.narration} in ${settings.language}.`,
    whyItWorks,
    toneAnalysis: `${settings.tone} delivery tailored with ${settings.visualStyle} aesthetics and ${settings.aspectRatio} composition in ${settings.language}.`,
  };
}

export function generateHookForProject(title: string, settings: VideoSettings): VideoHook {
  const isHindi = settings.language === 'Hindi' || (settings.language && settings.language.toLowerCase().includes('hindi'));
  const lower = title.toLowerCase();
  const isGoluMoluElephant = lower.includes('golu') || lower.includes('molu') || (lower.includes('elephant') && (lower.includes('sister') || lower.includes('brother') || lower.includes('jungle')));

  let hook1 = `What happens when "${title}" becomes an unforgettable adventure?`;
  let hook2 = `You won't believe the magical secret hiding deep inside "${title}"!`;
  let hook3 = `Have you ever wondered what would happen if "${title}" were real?`;

  if (isHindi) {
    if (isGoluMoluElephant) {
      hook1 = 'Kya aapne kabhi socha hai ki jungle ke sabse gehre hisse mein ek bolne wala haathi mil jaye toh kya hoga?';
      hook2 = 'Aap yakeen nahi karenge ki Golu aur Molu ko jungle mein kaunsa jadui dost mila!';
      hook3 = 'Agar aapko ek sach-much ka bolne wala haathi Appu mil jaye, toh aap kya karenge?';
    } else {
      hook1 = `Kya aapne kabhi socha hai ki "${title}" ke pichhe kaunsa anokha chamatkar chhipa hai?`;
      hook2 = `Aap yakeen nahi karenge ki is romanchak yatra mein kaunsa gehra raaz saamne aayega!`;
      hook3 = `Agar aapko "${title}" ka anokha rahasya jaan-ne ka mauka mile, toh aap kya karenge?`;
    }
  }

  return {
    selectedHookId: 'hook-opt-1',
    hookOptions: [
      {
        id: 'hook-opt-1',
        type: 'Visual Hook',
        text: hook1,
        visualDirection: `Dynamic camera push-in through lush environmental elements in ${settings.visualStyle} with glowing atmospheric light particles.`,
        estimatedDeliverySeconds: 5,
        explanation: 'Creates an immediate curiosity gap within the first 5 seconds to halt scrolling and boost viewer retention.',
      },
      {
        id: 'hook-opt-2',
        type: 'Pattern Interrupt',
        text: hook2,
        visualDirection: 'Rapid visual transition into an unexpected magical encounter with dramatic musical riser.',
        estimatedDeliverySeconds: 6,
        explanation: 'Breaks standard viewer habituation and establishes instant high stakes.',
      },
      {
        id: 'hook-opt-3',
        type: 'Curiosity / Question',
        text: hook3,
        visualDirection: 'Atmospheric low-angle tracking shot revealing the wonder of the world.',
        estimatedDeliverySeconds: 5,
        explanation: 'Directly engages the audience with a relatable question and promised payoff.',
      },
    ],
    retentionStrategy: `Maintain audience momentum with continuous visual cuts, dynamic ${settings.voiceMode || settings.narration} pacing, and recurring audio markers in ${settings.language}.`,
    first30SecondsRoadmap: [
      `00:00 - 00:05: High-impact opening visual hook in ${settings.visualStyle} revealing the magical world`,
      `00:05 - 00:15: Introduction of the protagonists and initial discovery in ${settings.language}`,
      `00:15 - 00:30: Escalating wonder as the central bond and adventure unfold in ${settings.language}`,
    ],
  };
}

export function generateCharactersForProject(title: string, settings: VideoSettings): CharacterProfile[] {
  const lower = title.toLowerCase();

  // 1. Golu & Molu Jungle Elephant Adventure
  if (lower.includes('golu') || lower.includes('molu') || (lower.includes('elephant') && (lower.includes('sister') || lower.includes('brother') || lower.includes('jungle')))) {
    return [
      {
        id: 'char-1',
        name: 'Golu',
        role: 'Protagonist (Elder Brother)',
        characterType: 'Human Boy',
        species: 'Human',
        age: '7 years old',
        ageOrSpecies: '7 years old',
        gender: 'Boy',
        appearance: `Curious and protective 7-year-old Indian boy with warm brown skin, sparkling obsidian eyes, a joyful smile, and messy short black hair. Rendered in ${settings.visualStyle}.`,
        visualAppearance: `7yo Indian boy, warm complexion, lively expressive eyes, bright cheerful presence in ${settings.visualStyle}.`,
        face: 'Round friendly face, glowing brown eyes, animated joyful expressions.',
        hair: 'Short tousled black hair with a neat front fringe.',
        skinOrVisualCharacteristics: 'Warm sun-kissed Indian skin tone with soft subsurface rim lighting.',
        bodyOrBuild: 'Slender energetic young boy with agile posture.',
        clothing: 'Bright saffron-orange cotton t-shirt, dark blue denim shorts, and red canvas sneakers with white laces.',
        clothingOutfit: 'Saffron-orange cotton t-shirt, dark blue denim shorts, red canvas sneakers.',
        accessories: 'Handmade braided red cotton wristband and a tiny brass lucky bell amulet.',
        signatureItem: 'Braided red wristband with brass bell amulet.',
        personality: 'Curious, protective, compassionate, fearless, and deeply loving towards animals.',
        personalityTraits: ['Curious', 'Protective', 'Adventurous', 'Playful'],
        expressions: 'Eyes widening in awe, warm toothy grin, attentive listening head-tilt.',
        voice: `High-pitched, warm, energetic child voice in ${settings.language}.`,
        voiceStyle: `Cheerful, articulate child delivery in ${settings.language}.`,
        speakingStyle: 'Excited and curious questions filled with brotherly warmth.',
        characterPurpose: 'Lead protagonist grounding the courage and curiosity of the adventure.',
        visualPromptAnchor: `Golu, 7yo Indian boy, round face, messy short black hair, sparkling black eyes, saffron orange t-shirt, denim shorts, red sneakers, brass amulet, ${settings.visualStyle} aesthetic, cinematic lighting, 8k render`,
        characterIdentityLock: 'Golu — Human Boy (7yo Indian boy): saffron orange t-shirt, denim shorts, red sneakers, black hair, warm brown skin, brass wrist amulet.',
      },
      {
        id: 'char-2',
        name: 'Molu',
        role: 'Co-Protagonist (Younger Sister)',
        characterType: 'Human Girl',
        species: 'Human',
        age: '5 years old',
        ageOrSpecies: '5 years old',
        gender: 'Girl',
        appearance: `Adorable and spirited 5-year-old Indian girl with twin braided pigtails tied with red ribbons, wide twinkling dark eyes, button nose, and joyful dimples. Rendered in ${settings.visualStyle}.`,
        visualAppearance: `5yo Indian girl, twin pigtails with red ribbons, vibrant yellow and turquoise dress in ${settings.visualStyle}.`,
        face: 'Cherubic round face, sparkling curious eyes, sweet innocent smile with dimples.',
        hair: 'Glossy black twin braided pigtails with bright red ribbon bows.',
        skinOrVisualCharacteristics: 'Smooth warm Indian skin tone with luminous cheek highlights.',
        bodyOrBuild: 'Petite, energetic toddler build with playful skipping gait.',
        clothing: 'Vibrant sunshine-yellow cotton tunic top with turquoise embroidered border, matching turquoise leggings, and tiny golden sandals.',
        clothingOutfit: 'Sunshine-yellow tunic with turquoise borders, turquoise leggings, golden sandals.',
        accessories: 'Delicate jingling silver anklets (ghungroo) and tiny floral hair clips.',
        signatureItem: 'Jingling silver anklets and red hair ribbons.',
        personality: 'Spontaneous, affectionate, bubbly, fearless, and wonder-filled.',
        personalityTraits: ['Bubbly', 'Wonder-filled', 'Affectionate', 'Brave'],
        expressions: 'Clapping hands in delight, gasping in awe, radiant smiling laughter.',
        voice: `Sweet, lively, melodious young girl voice in ${settings.language}.`,
        voiceStyle: `Bubbly and enthusiastic child voice in ${settings.language}.`,
        speakingStyle: 'Enthusiastic exclamations and joyful giggles.',
        characterPurpose: 'Brings innocent wonder, emotional heart, and spontaneous humor to the journey.',
        visualPromptAnchor: `Molu, 5yo Indian girl, twin braided pigtails with red ribbons, sparkling dark eyes, sunshine yellow tunic top with turquoise border, silver anklets, ${settings.visualStyle} aesthetic, cinematic lighting, 8k render`,
        characterIdentityLock: 'Molu — Human Girl (5yo Indian girl): twin black pigtails with red ribbons, sunshine yellow tunic, turquoise leggings, silver anklets, warm brown skin.',
      },
      {
        id: 'char-3',
        name: 'Appu',
        role: 'Magical Companion',
        characterType: 'Fantasy Creature / Animal',
        species: 'Asian Elephant',
        age: 'Young Magical Elephant',
        ageOrSpecies: 'Young Magical Elephant',
        gender: 'Male',
        appearance: `Adorable young Asian elephant with smooth slate-grey skin, glowing sapphire-blue eyes, golden ornamental markings on his forehead, and glowing golden sparkles surrounding his trunk. Rendered in ${settings.visualStyle}.`,
        visualAppearance: `Young magical elephant with glowing sapphire eyes and golden forehead crest in ${settings.visualStyle}.`,
        face: 'Gentle expressive eyes, smiling curved trunk, friendly oversized ears with pink inner contours.',
        hair: 'Fine soft texture with magical golden dust particles floating near head.',
        skinOrVisualCharacteristics: 'Velvety slate-grey elephant skin texture with glowing golden runic accents.',
        bodyOrBuild: 'Plump, huggable baby elephant build with sturdy playful steps.',
        clothing: 'Ornate saffron silk collar with a tinkling enchanted golden bell.',
        clothingOutfit: 'Saffron silk collar with enchanted golden bell.',
        accessories: 'Enchanted golden bell that emits soft harmonious chimes.',
        signatureItem: 'Enchanted golden bell necklace.',
        personality: 'Gentle, wise beyond his years, playful, and fiercely loyal.',
        personalityTraits: ['Magical', 'Gentle', 'Wise', 'Playful'],
        expressions: 'Playful trunk curls, soft affectionate blinks, gentle head bobs.',
        voice: `Warm, gentle, melodic voice with gentle acoustic reverb in ${settings.language}.`,
        voiceStyle: `Soft baritone with gentle warmth in ${settings.language}.`,
        speakingStyle: 'Poetic, gentle, and comforting words of ancient jungle wisdom in Hindi.',
        characterPurpose: 'Magical guide creating the central wonder and adventure bond.',
        visualPromptAnchor: `Appu, cute young Asian elephant, glowing sapphire blue eyes, golden forehead markings, saffron silk collar with golden bell, velvety slate grey skin, ${settings.visualStyle}, cinematic volumetric rays, Octane render`,
        characterIdentityLock: 'Appu — Fantasy Creature (Young Asian Elephant): slate grey skin, glowing sapphire eyes, golden forehead runes, saffron silk bell collar.',
      },
    ];
  }

  // 2. Two Sisters Underwater City Adventure
  if (lower.includes('underwater') || lower.includes('subsea') || lower.includes('ocean') || (lower.includes('sister') && lower.includes('city'))) {
    return [
      {
        id: 'char-1',
        name: 'Maya',
        role: 'Protagonist (Elder Sister)',
        characterType: 'Human Girl',
        species: 'Human',
        age: '13 years old',
        ageOrSpecies: '13 years old',
        gender: 'Girl',
        appearance: `Brave and resourceful 13-year-old girl with sharp intelligent hazel eyes, athletic swimmer build, and dark brown hair woven into a tight hydrodynamic braid. Rendered in ${settings.visualStyle}.`,
        visualAppearance: `13yo girl in neon-cyan diving exploration suit with clear dome helmet in ${settings.visualStyle}.`,
        face: 'Determined gaze, confident smile, freckles across nose bridge.',
        hair: 'Dark brown hair in a neat braided ponytail with blue waterproof clips.',
        skinOrVisualCharacteristics: 'Sun-kissed olive complexion illuminated by bioluminescent aquatic ambient reflections.',
        bodyOrBuild: 'Athletic, agile swimmer build with confident posture.',
        clothing: 'High-tech neon-cyan and deep navy hydrodynamic diving suit with luminescent LED trim and streamlined aquatic propulsion fins.',
        clothingOutfit: 'Neon-cyan exploration diving suit with glowing LED trim, magnetic boots.',
        accessories: 'Wrist-mounted holographic sonar navigation scanner and glowing sea-glass pendant.',
        signatureItem: 'Holographic ocean scanner and sea-glass pendant.',
        personality: 'Analytical, protective, daring, and deeply fascinated by marine archaeology.',
        personalityTraits: ['Analytical', 'Brave', 'Protective', 'Curious'],
        expressions: 'Focused analytical squint, awe-filled jaw drop upon discovering ancient ruins.',
        voice: `Confident, clear, and reassuring young teen voice in ${settings.language}.`,
        voiceStyle: `Clear and inquisitive delivery in ${settings.language}.`,
        speakingStyle: 'Decisive, encouraging, and filled with scientific excitement.',
        characterPurpose: 'Drives navigation, problem-solving, and protective sisterly leadership.',
        visualPromptAnchor: `Maya, 13yo girl, dark braided hair, hazel eyes, neon-cyan high-tech diving suit with glowing blue LED trim, clear exploration helmet, holographic wrist scanner, ${settings.visualStyle}, underwater bioluminescence, 8k render`,
        characterIdentityLock: 'Maya — Human Girl (13yo Elder Sister): neon-cyan diving suit with glowing blue trim, dark braided ponytail, hazel eyes, holographic wrist scanner.',
      },
      {
        id: 'char-2',
        name: 'Tara',
        role: 'Co-Protagonist (Younger Sister)',
        characterType: 'Human Girl',
        species: 'Human',
        age: '9 years old',
        ageOrSpecies: '9 years old',
        gender: 'Girl',
        appearance: `Imaginative and spirited 9-year-old girl with large inquisitive emerald-green eyes, shoulder-length wavy auburn hair, and an infectious energetic demeanor. Rendered in ${settings.visualStyle}.`,
        visualAppearance: `9yo girl in vibrant coral-pink diving suit with bubble glass helmet in ${settings.visualStyle}.`,
        face: 'Round expressive face, sparkling emerald eyes, wide radiant grin.',
        hair: 'Shoulder-length wavy auburn hair floating gently inside transparent helmet.',
        skinOrVisualCharacteristics: 'Fair complexion with rosy cheeks bathed in shimmering underwater caustic light.',
        bodyOrBuild: 'Petite, energetic build with agile underwater somersaults.',
        clothing: 'Vibrant coral-pink and pearl-white thermal diving suit with glowing bioluminescent yellow accents and compact mini-propulsion jetpack.',
        clothingOutfit: 'Coral-pink and pearl-white diving suit, mini-propulsion jetpack, yellow flippers.',
        accessories: 'Waterproof digital creature sketchbook with LED stylus and a glowing seashell necklace.',
        signatureItem: 'Digital creature sketchbook and glowing seashell necklace.',
        personality: 'Artistic, intuitive, compassionate towards sea creatures, and fearless.',
        personalityTraits: ['Artistic', 'Intuitive', 'Enthusiastic', 'Compassionate'],
        expressions: 'Reaching out in wonder to touch glowing jellyfish, beaming joyful smile.',
        voice: `High-pitched, enthusiastic, wonder-struck child voice in ${settings.language}.`,
        voiceStyle: `Lively, musical, and expressive in ${settings.language}.`,
        speakingStyle: 'Excited descriptions of glowing sea creatures and hidden architecture.',
        characterPurpose: 'Unlocks ancient city symbols through artistic intuition and connects with sea life.',
        visualPromptAnchor: `Tara, 9yo girl, wavy auburn hair, emerald green eyes, coral-pink and pearl diving suit with yellow accents, bubble glass helmet, glowing seashell necklace, ${settings.visualStyle}, underwater caustic lighting, 8k render`,
        characterIdentityLock: 'Tara — Human Girl (9yo Younger Sister): coral-pink and pearl diving suit, yellow glowing accents, wavy auburn hair, emerald eyes, glowing seashell necklace.',
      },
      {
        id: 'char-3',
        name: 'Coralia',
        role: 'Ancient Guardian',
        characterType: 'Fantasy Creature',
        species: 'Bioluminescent Ocean Spirit',
        age: 'Ancient Guardian Spirit',
        ageOrSpecies: 'Ancient Guardian Spirit',
        gender: 'Female',
        appearance: `Graceful ethereal guardian spirit of the sunken city with translucent glowing turquoise-and-gold aquatic fins, shimmering crystalline crown, and starry luminescence. Rendered in ${settings.visualStyle}.`,
        visualAppearance: `Ethereal glowing turquoise water spirit with crystalline crown in ${settings.visualStyle}.`,
        face: 'Serene ancient gaze, luminescent facial markings, tranquil smile.',
        hair: 'Flowing aquatic ribbons of bioluminescent cyan water.',
        skinOrVisualCharacteristics: 'Translucent pearlescent skin emitting gentle pulsing aqua light.',
        bodyOrBuild: 'Fluid, gliding ethereal silhouette surrounded by floating stardust bubbles.',
        clothing: 'Woven sea-silk tunic adorned with iridescent pearl shells and glowing coral fronds.',
        clothingOutfit: 'Woven sea-silk tunic with glowing coral fronds.',
        accessories: 'Crystalline trident staff that channels ocean tides and activates city gates.',
        signatureItem: 'Crystalline sea staff.',
        personality: 'Wise, protective, serene, and welcoming to pure-hearted explorers.',
        personalityTraits: ['Serene', 'Wise', 'Protective', 'Majestic'],
        expressions: 'Benevolent welcoming smile, gentle telepathic nod.',
        voice: `Ethereal, resonant, calming voice with ocean acoustics in ${settings.language}.`,
        voiceStyle: `Harmonic, soothing soprano in ${settings.language}.`,
        speakingStyle: 'Ancient riddles and poetic blessings of the deep ocean.',
        characterPurpose: 'Reveals the lost history and awakens the crystal energy of the sunken city.',
        visualPromptAnchor: `Coralia, bioluminescent ocean spirit, glowing turquoise fins, pearlescent skin, crystalline crown, floating underwater stardust, ${settings.visualStyle}, deep sea volumetric illumination, 8k render`,
        characterIdentityLock: 'Coralia — Fantasy Creature (Bioluminescent Ocean Spirit): translucent turquoise fins, crystalline crown, pearlescent glowing skin, woven sea-silk tunic.',
      },
    ];
  }

  // 3. Universal Dynamic Character Generator
  return [
    {
      id: 'char-1',
      name: 'Lead Explorer',
      role: 'Protagonist',
      characterType: 'Lead Explorer',
      species: 'Human',
      age: '20 years old',
      ageOrSpecies: '20 years old',
      gender: 'Unspecified',
      appearance: `Distinctive, visually striking protagonist designed for "${title}" in ${settings.visualStyle} aesthetic.`,
      visualAppearance: `Lead character in ${settings.visualStyle} style with high aesthetic contrast.`,
      face: 'Sharp expressive eyes and confident demeanor.',
      hair: 'Modern styled hair matching thematic palette.',
      skinOrVisualCharacteristics: 'Warm cinematic rim lighting.',
      bodyOrBuild: 'Balanced silhouette and purposeful posture.',
      clothing: 'Tailored signature outfit styled with distinctive thematic accents.',
      clothingOutfit: 'Tailored signature outfit styled with distinctive thematic accents.',
      accessories: 'Signature thematic prop or device.',
      signatureItem: 'Signature thematic prop or device.',
      personality: 'Passionate, perceptive, articulate, and inspiring.',
      personalityTraits: ['Perceptive', 'Passionate', 'Inspiring'],
      expressions: 'Engaged curiosity and confident focus.',
      voice: `${settings.tone} delivery in ${settings.language}.`,
      voiceStyle: `Clear and captivating delivery in ${settings.language}.`,
      speakingStyle: 'Engaging, rhythmic, and clear.',
      characterPurpose: 'Anchor viewer engagement throughout the journey.',
      visualPromptAnchor: `Lead Explorer for "${title}", ${settings.visualStyle}, cinematic lighting, photorealistic 8k render`,
      characterIdentityLock: `Lead Explorer for "${title}" — Locked aesthetic in ${settings.visualStyle}.`,
    },
  ];
}

export function generateScriptForProject(title: string, settings: VideoSettings): VideoScript {
  const totalSec = parseDurationSeconds(settings.totalDuration || settings.duration);
  const wordsPerMin = 130;
  const estimatedWords = Math.max(80, Math.round((totalSec / 60) * wordsPerMin));
  const sceneSec = parseSceneSeconds(settings.sceneDuration, 5);
  const numActs = Math.max(1, Math.round(totalSec / sceneSec));

  const voiceMode = settings.voiceMode || 'Narrator + Character Dialogue';
  const isNoSpoken = voiceMode === 'No Spoken Dialogue';
  const isHindi = settings.language === 'Hindi' || (settings.language && settings.language.toLowerCase().includes('hindi'));

  const lower = title.toLowerCase();
  const isGoluMoluElephant = lower.includes('golu') || lower.includes('molu') || (lower.includes('elephant') && (lower.includes('sister') || lower.includes('brother') || lower.includes('jungle')));

  const sections = Array.from({ length: numActs }).map((_, i) => {
    const actNum = i + 1;
    const startSec = i * sceneSec;
    const endSec = (i + 1) * sceneSec;
    const formatTime = (sec: number) => {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const isFirst = i === 0;
    const isLast = i === numActs - 1;

    let dialogue = '';
    if (isNoSpoken) {
      dialogue = 'NO SPOKEN WORDS. NO NARRATION.';
    } else if (isGoluMoluElephant && isHindi) {
      if (isFirst) dialogue = 'Narrator: "Jungle ki hari-bhari vaadiyon mein shuru hoti hai Golu aur Molu ki ek anokhi dastaan."';
      else if (actNum === 2) dialogue = 'Molu: "Bhaiya, dekho yeh zameen par kya chamak raha hai!"';
      else if (actNum === 3) dialogue = 'Golu: "Lagta hai aage koi bahut bada raaz chhipa hai!"';
      else if (actNum === 4) dialogue = 'Appu: "Namaste Golu! Namaste Molu! Daro mat, main Appu hoon."';
      else if (actNum === 5) dialogue = 'Molu: "Arrey wah! Yeh pyaara haathi toh humse baatein kar raha hai!"';
      else if (actNum === 6) dialogue = 'Golu: "Aap bol sakte ho?! Yeh toh jaise koi sapna hai!"';
      else if (actNum === 7) dialogue = 'Appu: "Chalo dosto, main tumhe jungle ka sabse pavitra sthaan dikhata hoon."';
      else if (actNum === 8) dialogue = 'Molu: "Yay! Appu bhaiya, yeh paani kitna chamakdaar hai!"';
      else if (actNum === 9) dialogue = 'Golu: "Dekho Molu, saare sitaare jungle mein utar aaye hain!"';
      else if (actNum === 10) dialogue = 'Appu: "Yeh pavitra kamal tumhari sachi dosti ka prateek hai."';
      else if (actNum === 11) dialogue = 'Molu: "Appu, kya tum hamesha hamare dost rahoge?"';
      else dialogue = 'Appu: "Hamesha! Sachi dosti kabhi khatam nahi hoti."';
    } else if (isHindi) {
      if (isFirst) dialogue = `Narrator: "Ek rahasyamayi yatra shuru hoti hai: ${title}."`;
      else if (isLast) dialogue = 'Narrator: "Aur is tarah saahas aur dosti ki yeh anokhi kahani hamesha ke liye yaadgaar ban gayi."';
      else dialogue = `Character: "Aage dekho! Ek adbhut chamatkar hamara intezaar kar raha hai."`;
    } else {
      if (isFirst) dialogue = `Narrator: "Deep in the heart of the world, where few have ever walked, begins the tale of ${title}."`;
      else if (isLast) dialogue = 'Narrator: "And so, the journey leaves an enduring mark of courage and friendship for all who believe."';
      else dialogue = 'Character: "Look ahead! The path is revealing something truly wondrous."';
    }

    const isNarrator = dialogue.startsWith('Narrator:');

    return {
      id: `sec-${actNum}`,
      name: `Act ${actNum}: ${isFirst ? 'The Discovery & Hook' : isLast ? 'The Climax & Resolution' : `The Journey Progression Part ${actNum}`}`,
      timecode: `${formatTime(startSec)} - ${formatTime(endSec)}`,
      visualDirection: `Cinematic sequence depicting scene ${actNum} of "${title}" rendered in ${settings.visualStyle}.`,
      dialogueOrNarration: dialogue,
      narratorDialogue: isNoSpoken ? undefined : (isNarrator ? dialogue : undefined),
      characterDialogue: isNoSpoken ? undefined : (!isNarrator ? dialogue : undefined),
      sceneIntent: isFirst ? 'Capture immediate attention and spark wonder.' : isLast ? 'Deliver emotional payoff and lasting impression.' : 'Advance story conflict and world exploration.',
      onScreenText: isFirst ? title.toUpperCase() : undefined,
      soundEffectOrMusicCue: isFirst ? 'Atmospheric ambient intro with mystical chimes' : 'Dynamic cinematic score matching emotional cadence',
      deliveryNotes: isNoSpoken ? 'No spoken dialogue. Emphasize Foley and musical resonance.' : `Warm and expressive delivery in ${settings.language}.`,
    };
  });

  return {
    totalWordCount: estimatedWords,
    estimatedReadTime: settings.totalDuration || settings.duration || `${Math.round(totalSec / 60)} minutes`,
    sections,
  };
}

export function generateScenesForProject(
  title: string,
  settings: VideoSettings,
  count?: number
): SceneBreakdown[] {
  const totalSec = parseDurationSeconds(settings.totalDuration || settings.duration);
  const sceneSec = parseSceneSeconds(settings.sceneDuration, 5);
  const actualCount = count || Math.max(1, Math.round(totalSec / sceneSec));
  const finalDurationPerScene = sceneSec || Math.max(5, Math.round(totalSec / actualCount));

  const voiceMode = settings.voiceMode || 'Narrator + Character Dialogue';
  const isNoSpoken = voiceMode === 'No Spoken Dialogue';
  const lower = title.toLowerCase();

  const isGoluMoluElephant = lower.includes('golu') || lower.includes('molu') || (lower.includes('elephant') && (lower.includes('sister') || lower.includes('brother') || lower.includes('jungle')));
  const isUnderwaterSisters = lower.includes('underwater') || lower.includes('subsea') || lower.includes('ocean') || (lower.includes('sister') && lower.includes('city'));

  // Specific 12-scene beats for Golu & Molu + Elephant in Hindi
  const goluMoluBeats = [
    { title: 'The Sunlit Jungle Trail', loc: 'Emerald Jungle Path', act: 'Golu walks forward holding Molu’s hand as golden dust particles float through towering palm trees.', dia: 'Golu: "Molu, dekho! Yeh jungle kitna sundar aur anokha hai!"', chars: ['Golu', 'Molu'] },
    { title: 'The Sparkling Footprints', loc: 'Lush Fern Clearing', act: 'Molu points excitedly at giant shimmering golden footprints pressed into the soft moss.', dia: 'Molu: "Bhaiya, dekho yeh zameen par kya chamak raha hai!"', chars: ['Golu', 'Molu'] },
    { title: 'The Giant Leaf Gateway', loc: 'Giant Monstera Gateway', act: 'Golu gently pushes aside giant tropical leaves revealing a hidden radiant clearing.', dia: 'Golu: "Lagta hai aage koi bahut bada raaz chhipa hai!"', chars: ['Golu', 'Molu'] },
    { title: 'The Magical Elephant Emerges', loc: 'Crystal Riverbank', act: 'Appu the young slate-grey elephant steps out from the bamboo with glowing sapphire eyes and a golden forehead crest.', dia: 'Appu: "Namaste Golu! Namaste Molu! Daro mat, main Appu hoon."', chars: ['Golu', 'Molu', 'Appu'] },
    { title: 'The Astonished Reaction', loc: 'Crystal Riverbank', act: 'Molu claps her hands in sheer joy while Golu smiles in utter astonishment.', dia: 'Molu: "Arrey wah! Yeh pyaara haathi toh humse baatein kar raha hai!"', chars: ['Golu', 'Molu', 'Appu'] },
    { title: 'The Golden Trunk Greeting', loc: 'Sparkling Riverbank Edge', act: 'Appu gently extends his glowing trunk tip touching Golu and Molu’s outstretched hands in friendship.', dia: 'Golu: "Aap bol sakte ho?! Yeh toh jaise koi sapna hai!"', chars: ['Golu', 'Molu', 'Appu'] },
    { title: 'The Ancient Glowing Banyan', loc: 'Ancient Tree of Life', act: 'Appu guides Golu and Molu towards a towering sacred banyan tree glowing with golden hanging vines.', dia: 'Appu: "Chalo dosto, main tumhe jungle ka sabse pavitra sthaan dikhata hoon."', chars: ['Golu', 'Molu', 'Appu'] },
    { title: 'Riding Across the Turquoise Stream', loc: 'Turquoise Lily Stream', act: 'Appu lets Golu and Molu sit safely on his broad back as giant glowing water lilies drift by.', dia: 'Molu: "Yay! Appu bhaiya, yeh paani kitna chamakdaar hai!"', chars: ['Golu', 'Molu', 'Appu'] },
    { title: 'The Dancing Firefly Grove', loc: 'Bioluminescent Grove', act: 'Golden fireflies swirl playfully around Molu’s pigtails and Golu’s outstretched hands.', dia: 'Golu: "Dekho Molu, saare sitaare jungle mein utar aaye hain!"', chars: ['Golu', 'Molu', 'Appu'] },
    { title: 'The Secret Jungle Gift', loc: 'Crystal Grove Altar', act: 'Appu picks a glowing golden lotus with his trunk and gently gifts it into Molu’s joyful hands.', dia: 'Appu: "Yeh pavitra kamal tumhari sachi dosti ka prateek hai."', chars: ['Golu', 'Molu', 'Appu'] },
    { title: 'The Sunset Overlook Promise', loc: 'Golden Hilltop Overlook', act: 'Golu, Molu, and Appu stand together on a scenic clifftop watching the radiant golden sunset over the jungle.', dia: 'Molu: "Appu, kya tum hamesha hamare dost rahoge?"', chars: ['Golu', 'Molu', 'Appu'] },
    { title: 'The Eternal Bond of Friendship', loc: 'Golden Hilltop Silhouette', act: 'Appu raises his trunk triumphantly emitting magical golden sparkles as Golu and Molu hug him warmly.', dia: 'Appu: "Hamesha! Sachi dosti kabhi khatam nahi hoti."', chars: ['Golu', 'Molu', 'Appu'] },
  ];

  // Specific 12-scene beats for Two Sisters Underwater City
  const underwaterSistersBeats = [
    { 
      title: 'The Deep Oceanic Descent', 
      loc: 'Azure Coral Drop-Off', 
      act: 'Maya and Tara descend through sunlit turquoise waters in their high-tech diving suits with glowing LED trim.', 
      dia: (settings.language === 'Hindi' || (settings.language && settings.language.toLowerCase().includes('hindi')))
        ? 'Maya: "Systems theek hain, Tara. Mere peeche gehre samandar mein aao."'
        : 'Maya: "Systems green, Tara. Follow my dive trajectory down the trench."', 
      chars: ['Maya', 'Tara'] 
    },
    { 
      title: 'The Bioluminescent Reef Trench', 
      loc: 'Luminescent Coral Valley', 
      act: 'Tara swims close to glowing purple anemones and holographic sea-whips that pulse with ambient light.', 
      dia: (settings.language === 'Hindi' || (settings.language && settings.language.toLowerCase().includes('hindi')))
        ? 'Tara: "Maya didi, dekho yeh corals! Yeh neon roshni ki tarah chamak rahe hain!"'
        : 'Tara: "Maya, look at these corals! They’re glowing like neon signs!"', 
      chars: ['Maya', 'Tara'] 
    },
    { 
      title: 'The Holographic Sonar Beacon', 
      loc: 'Sunken Archway Ruins', 
      act: 'Maya activates her wrist sonar scanner which projects a 3D blueprint of massive sunken architecture ahead.', 
      dia: (settings.language === 'Hindi' || (settings.language && settings.language.toLowerCase().includes('hindi')))
        ? 'Maya: "Sonar ne confirm kiya hai! Aage 50 meter par ek vishaal dooba hua shahar hai."'
        : 'Maya: "Sonar confirmed! There’s a massive submerged dome 50 meters ahead."', 
      chars: ['Maya', 'Tara'] 
    },
    { 
      title: 'The Crystal Gateway Reveal', 
      loc: 'Ancient Thalassa Gate', 
      act: 'The sisters swim through a towering pearlescent sea-gate carved with glowing oceanic glyphs.', 
      dia: (settings.language === 'Hindi' || (settings.language && settings.language.toLowerCase().includes('hindi')))
        ? 'Tara: "Yeh sach hai! Samandar ke neeche chhipa hua jadui shahar!"'
        : 'Tara: "It’s real! The lost underwater city of Thalassa!"', 
      chars: ['Maya', 'Tara'] 
    },
    { 
      title: 'The Ocean Guardian Awakes', 
      loc: 'Grand Plaza of Coral', 
      act: 'Coralia the bioluminescent water guardian manifests in a swirl of stardust bubbles and turquoise light.', 
      dia: (settings.language === 'Hindi' || (settings.language && settings.language.toLowerCase().includes('hindi')))
        ? 'Coralia: "Samandar ke is pavitra shahar mein tumhara swagat hai, saahasi behno."'
        : 'Coralia: "Welcome, young explorers of the surface realm."', 
      chars: ['Maya', 'Tara', 'Coralia'] 
    },
    { 
      title: 'First Contact in the Sunken City', 
      loc: 'Crystal Plaza Altar', 
      act: 'Maya and Tara float in awe as Coralia gestures with her crystalline staff, illuminating the city dome.', 
      dia: (settings.language === 'Hindi' || (settings.language && settings.language.toLowerCase().includes('hindi')))
        ? 'Maya: "Hum is anokhi duniya ki raksha aur khoj karne aaye hain."'
        : 'Maya: "We come in peace to document and protect this wonder."', 
      chars: ['Maya', 'Tara', 'Coralia'] 
    },
    { 
      title: 'The Hydro-Spire Power Core', 
      loc: 'Luminescent Energy Spire', 
      act: 'Coralia leads the sisters inside the central energy spire where a giant sapphire sea-crystal rotates gently.', 
      dia: (settings.language === 'Hindi' || (settings.language && settings.language.toLowerCase().includes('hindi')))
        ? 'Coralia: "Yeh crystal is poore jaldweep ko jeevan aur roshni deta hai."'
        : 'Coralia: "This crystal preserves the breathable biome of the deep."', 
      chars: ['Maya', 'Tara', 'Coralia'] 
    },
    { 
      title: 'Restoring the Energy Conduit', 
      loc: 'Crystal Conduit Chamber', 
      act: 'Tara uses her electronic sketch tool to align ancient symbol locks matching the sea-crystal frequency.', 
      dia: (settings.language === 'Hindi' || (settings.language && settings.language.toLowerCase().includes('hindi')))
        ? 'Tara: "Maine prateekon ka raaz suljha liya! Energy grid phir se chalu ho raha hai!"'
        : 'Tara: "I solved the glyph sequence! The power grid is re-engaging!"', 
      chars: ['Maya', 'Tara', 'Coralia'] 
    },
    { 
      title: 'The Bioluminescent Marine Symphony', 
      loc: 'Grand Marine Pavilion', 
      act: 'Schools of glowing translucent manta rays and neon dolphins glide gracefully above the crystal dome.', 
      dia: (settings.language === 'Hindi' || (settings.language && settings.language.toLowerCase().includes('hindi')))
        ? 'Maya: "Upar dekho Tara! Saare jal-jeev hamari safalta ka utsav mana rahe hain!"'
        : 'Maya: "Look at the canopy! The entire marine ecosystem is celebrating!"', 
      chars: ['Maya', 'Tara', 'Coralia'] 
    },
    { 
      title: 'The Ancient Pearl of Wisdom', 
      loc: 'Inner Sanctum Shrine', 
      act: 'Coralia bestows a glowing sea-pearl pendant to Tara and Maya, embedding ancient ocean knowledge.', 
      dia: (settings.language === 'Hindi' || (settings.language && settings.language.toLowerCase().includes('hindi')))
        ? 'Coralia: "Ab se tum dono is samandari shahar ki aadhikaarik sanrakshak ho."'
        : 'Coralia: "You are now the guardians of the deep across both land and sea."', 
      chars: ['Maya', 'Tara', 'Coralia'] 
    },
    { 
      title: 'The Sisterly Oath of Discovery', 
      loc: 'Panoramic Dome Balcony', 
      act: 'Maya and Tara hold hands overlooking the glowing underwater metropolis shimmering in royal blues and cyans.', 
      dia: (settings.language === 'Hindi' || (settings.language && settings.language.toLowerCase().includes('hindi')))
        ? 'Tara: "Humne yeh kar dikhaya, Maya didi. Sabse badi khoj!"'
        : 'Tara: "We did it together, Maya. The greatest discovery in human history."', 
      chars: ['Maya', 'Tara'] 
    },
    { 
      title: 'Ascent to the Surface with the Secret', 
      loc: 'Sunlit Upper Ocean Boundary', 
      act: 'Maya and Tara propel upwards towards the sparkling sunlit ocean surface, their glowing pendants shining bright.', 
      dia: (settings.language === 'Hindi' || (settings.language && settings.language.toLowerCase().includes('hindi')))
        ? 'Maya: "Duniya ko pata chalega ki samandar ke aanchal mein kitne chamatkar chhipe hain."'
        : 'Maya: "The surface will learn that the ocean holds wonders beyond imagination."', 
      chars: ['Maya', 'Tara'] 
    },
  ];

  const beats = isGoluMoluElephant
    ? goluMoluBeats
    : isUnderwaterSisters
    ? underwaterSistersBeats
    : [];

  return Array.from({ length: actualCount }).map((_, i) => {
    const sceneNum = i + 1;
    const beat = beats.length > 0 ? beats[i % beats.length] : null;

    const sTitle = beat ? beat.title : `Scene ${sceneNum}: Story Progression`;
    const sLoc = beat ? beat.loc : `Thematic Environment #${sceneNum} for "${title}"`;
    const sAct = beat ? beat.act : `Cinematic action sequence advancing narrative beat #${sceneNum} for "${title}".`;
    
    let sDia = isNoSpoken
      ? 'NONE (No Spoken Dialogue)'
      : beat
      ? beat.dia
      : `Narrator / Character: "Continuing the momentous journey of ${title} in scene ${sceneNum}."`;

    const startSec = i * finalDurationPerScene;
    const endSec = (i + 1) * finalDurationPerScene;
    const formatTime = (sec: number) => {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const sceneChars = beat && beat.chars ? beat.chars : (settings.includeCharacters ? ['Lead Character'] : []);

    const charAnchorDesc = isGoluMoluElephant
      ? 'Golu (7yo Indian boy, saffron t-shirt, denim shorts, brass amulet), Molu (5yo Indian girl, twin pigtails with red ribbons, sunshine yellow tunic), and Appu (baby elephant, slate grey, sapphire eyes, golden forehead markings, silk bell collar)'
      : isUnderwaterSisters
      ? 'Maya (13yo girl, dark braided ponytail, neon-cyan diving suit with blue LED trim) and Tara (9yo girl, wavy auburn hair, coral-pink diving suit, bubble helmet)'
      : `Consistent styling for ${title} in scene ${sceneNum}`;

    return {
      sceneNumber: sceneNum,
      durationSeconds: finalDurationPerScene,
      duration: `${finalDurationPerScene}s`,
      timeRange: `${formatTime(startSec)} - ${formatTime(endSec)}`,
      title: `Scene ${sceneNum}: ${sTitle}`,
      location: sLoc,
      timeOfDay: i < actualCount / 2 ? 'Daylight Golden Hour' : 'Twilight Magic Hour',
      characters: sceneChars,
      charactersPresent: sceneChars,
      characterActions: sAct,
      dialogue: sDia,
      dialogueVoiceover: sDia,
      spokenDialogueType: voiceMode,
      narrator: isNoSpoken ? 'NONE' : sDia,
      cameraAngleMotion: i % 2 === 0 ? 'Smooth orbital crane shot rotating 35 degrees' : 'Dynamic forward dolly tracking with shallow depth of field',
      lightingMood: i % 2 === 0 ? 'Warm golden hour with soft volumetric sunbeams' : 'Bioluminescent ambient glow with cool fill and golden rim lights',
      animationStyle: `${settings.visualStyle} with fluid cinematic frame pacing`,
      soundEffects: isGoluMoluElephant ? 'Jungle leaf rustle, gentle elephant chime, tropical birds' : isUnderwaterSisters ? 'Hydro-ambient hum, bubbling oxygen regulator, crystalline chime' : 'Diegetic atmospheric Foley',
      musicCue: `${settings.tone} orchestral melody building warmth and adventure`,
      continuityNote: i > 0 ? `Carries visual continuity and character positions from Scene ${sceneNum - 1}.` : 'Opening establishing continuity.',
      scenePurpose: `Advance emotional bond and visual discovery in Scene ${sceneNum}.`,
      aiVideoPrompt: `Cinematic 8K, ${settings.visualStyle}, "${sTitle}" in ${sLoc}. Characters: ${charAnchorDesc}. Action: ${sAct}. ${settings.aspectRatio} aspect ratio, volumetric lighting, Octane render --ar ${settings.aspectRatio === '9:16' ? '9:16' : '16:9'}`,
      characterLockedPrompt: charAnchorDesc,
    };
  });
}

export const generateSceneBreakdownsForProject = generateScenesForProject;

export function generateVideoPromptsForProject(
  title: string,
  settings: VideoSettings,
  scenes: SceneBreakdown[] = [],
  characters: CharacterProfile[] = []
): SceneVideoPrompt[] {
  const activeScenes = scenes.length > 0 ? scenes : generateScenesForProject(title, settings);
  const primaryChar = characters[0];
  const charConsistencyDesc = characters.length > 0
    ? characters.map(c => `${c.name} [${c.characterType || c.role}]: ${c.characterIdentityLock || c.visualPromptAnchor || c.clothingOutfit}`).join(' | ')
    : 'Consistent visual continuity matching project aesthetic';

  const voiceMode = settings.voiceMode || 'Narrator + Character Dialogue';
  const isNoSpoken = voiceMode === 'No Spoken Dialogue';

  return activeScenes.map((scene) => {
    const sceneNum = scene.sceneNumber;
    const duration = `${scene.durationSeconds || 5}s`;
    const aspect = settings.aspectRatio || '16:9';
    const style = settings.visualStyle || '3D Cartoon';

    const action = scene.characterActions || `Dynamic cinematic action for scene ${sceneNum}`;
    const environment = scene.location || scene.environment || `Thematic environment for ${title}`;
    const lighting = scene.lightingMood || 'Cinematic three-point lighting with volumetric sunbeams';
    const camera = scene.cameraAngleMotion || '35mm anamorphic tracking shot';
    const audioCue = isNoSpoken ? 'NO SPOKEN WORDS. Ambient Foley and background score only.' : (scene.dialogueVoiceover || scene.dialogue || '');

    const finalPrompt = `Cinematic ${aspect} video, ${style}, "${scene.title}". Action: ${action}. Environment: ${environment}. Characters: ${charConsistencyDesc}. Camera: ${camera}. Lighting: ${lighting}. Audio: ${audioCue}. Volumetric atmospheric depth, 8K render, Octane render --ar ${aspect === '9:16' ? '9:16' : '16:9'}`;

    const modelPrompts: ModelSpecificPrompts = {
      veo: `Google Veo prompt: Cinematic ${style} render of "${scene.title}". Duration: ${duration}. Aspect ratio: ${aspect}. Action: ${action} in ${environment}. ${lighting}. Camera: ${camera}. Audio: ${audioCue}.`,
      runway: `[${camera}] [${action}] [${environment}, ${lighting}] Duration ${duration}, cinematic 8k render, ${style} --ar ${aspect === '9:16' ? '9:16' : '16:9'}`,
      kling: `Kling AI text-to-video: Master shot (${duration}), ${style}, ${action} in ${environment}. Aspect ratio ${aspect}. ${camera}, ${lighting}, high dynamic range, fluid physics.`,
      luma: `Luma Dream Machine: Smooth ${camera} (${duration}) capturing ${action}. Environment: ${environment}. Lighting: ${lighting}. Aspect ${aspect}. Natural dynamics and depth.`,
      sora: `OpenAI Sora: Hyper-detailed photorealistic cinematic sequence (${duration}) in ${style} aspect ratio ${aspect}. In ${environment}, ${action}. Features ${charConsistencyDesc}. Camera: ${camera}, Lighting: ${lighting}, volumetric atmospheric depth.`,
    };

    return {
      sceneNumber: sceneNum,
      title: scene.title,
      duration,
      durationSeconds: scene.durationSeconds || 5,
      aspectRatio: aspect,
      visualStyle: style,
      characterConsistencyDescription: charConsistencyDesc,
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
      dialogue: isNoSpoken ? 'NONE (No Spoken Dialogue)' : (scene.dialogue || scene.dialogueVoiceover || ''),
      voiceAudio: isNoSpoken ? 'NO SPOKEN AUDIO. Background score and environmental Foley only.' : 'Rich resonant vocal tone with clean acoustic isolation',
      soundEffects: scene.soundEffects || 'Diegetic environmental Foley and atmospheric soundbed',
      music: scene.musicCue || 'Cinematic thematic score building warmth and wonder',
      transition: scene.transition || 'Match cut to subsequent sequence',
      negativePrompt: 'blurry, low resolution, distorted limbs, extra fingers, morphing face, bad anatomy, text watermark, oversaturated artifacts, flickering, glitch, invented dialogue',
      finalPrompt,
      modelPrompts,
    };
  });
}

export function generateThumbnailForProject(
  title: string,
  settings: VideoSettings,
  characters: CharacterProfile[] = []
): ThumbnailData {
  const primaryChar = characters[0];
  const charDesc = primaryChar
    ? `${primaryChar.name} (${primaryChar.appearance || primaryChar.visualAppearance || 'signature visual features'}) wearing ${primaryChar.clothing || primaryChar.clothingOutfit || 'signature outfit'}`
    : `protagonist representing ${title}`;

  const c1: ThumbnailConcept = {
    id: 'c1',
    conceptTitle: 'High-Emotion Close-Up & Shocking Reaction',
    title: 'High-Emotion Close-Up & Shocking Reaction',
    visualConcept: 'Dramatic character expression framed tightly with glowing subject artifact to maximize raw emotional click appeal.',
    mainSubject: `Intense close-up portrait of ${charDesc}`,
    characterExpression: 'Shocked, wide eyes with mouth open in genuine disbelief, looking directly into the camera',
    facialExpression: 'Shocked, wide eyes with mouth open in genuine disbelief',
    background: `Vibrant contextual ${settings.visualStyle} environment with dramatic atmospheric lighting`,
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
    aiImagePrompt: `Cinematic 16:9 YouTube thumbnail, ${charDesc}, extreme emotional reaction with wide eyes and open mouth, pointing towards glowing artifact, ${settings.visualStyle}, electric cyan and warm amber rim lighting, 8k resolution, photorealistic Unreal Engine 5 render, highly detailed --ar 16:9 --v 6.0`,
    negativePrompt: 'blurry, distorted face, bad anatomy, extra fingers, text watermark, low resolution, dark muddy colors',
    colorPalette: ['#00E5FF', '#FF7700', '#FFE600', '#090C10'],
  };

  const c2: ThumbnailConcept = {
    id: 'c2',
    conceptTitle: 'The Mystery Split & Paradox Reveal',
    title: 'The Mystery Split & Paradox Reveal',
    visualConcept: 'Dual before-and-after split composition creating an irresistible curiosity gap in viewer minds.',
    mainSubject: `Split screen: on the left a mysterious unopened vault/door, on the right ${charDesc} discovering the truth`,
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
    aiImagePrompt: `Cinematic YouTube thumbnail with split composition, left side shows dark mysterious scene with neon violet glow, right side shows ${charDesc} with golden lighting discovering truth, ${settings.visualStyle}, ultra high detail, 8k --ar 16:9 --v 6.0`,
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
    background: `Expansive panoramic ${settings.visualStyle} landscape with towering structures and stormy skies`,
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
    aiImagePrompt: `Epic 16:9 YouTube thumbnail, low angle master shot of ${charDesc} facing a colossal panoramic horizon, ${settings.visualStyle}, golden hour lighting with volumetric god rays, dramatic clouds, Unreal Engine 5 render, photorealistic 8k --ar 16:9 --v 6.0`,
    negativePrompt: 'blurry, cartoonish distortion, extra limbs, watermark logo, low quality render',
    colorPalette: ['#FF4500', '#0A192F', '#00F0FF', '#FFFFFF'],
  };

  return {
    concepts: [c1, c2, c3],
    selectedConceptId: 'c1',
    aiPrompt: c1.aiImagePrompt || `Cinematic 16:9 thumbnail for ${title}`,
    midjourneyPrompt: c1.aiImagePrompt || `Cinematic 16:9 thumbnail for ${title}`,
    canvaLayoutSuggestion: 'Position bold yellow/cyan text in the upper left; keep primary character face in the right third of the frame.',
    dallEPrompt: c1.aiImagePrompt || `Cinematic 16:9 thumbnail for ${title}`,
  };
}

export function generateSeoForProject(
  title: string,
  settings: VideoSettings,
  scenes: SceneBreakdown[] = []
): YouTubeSEO {
  const currentYear = new Date().getFullYear();
  const rawTitleClean = title.trim();

  const titleOptions: TitleOption[] = [
    {
      id: 't-1',
      title: `The Untold Story of ${rawTitleClean} (${currentYear} Full Breakdown)`,
      style: 'Documentary / Mystery',
      curiosityScore: 96,
      searchRelevanceScore: 94,
      clarityScore: 92,
      clickAppealScore: 97,
      charCount: `The Untold Story of ${rawTitleClean} (${currentYear} Full Breakdown)`.length,
      estimatedCTR: '14.8%',
      badge: 'best-overall',
    },
    {
      id: 't-2',
      title: `${rawTitleClean} Explained: Everything You Need to Know`,
      style: 'Search & How-To',
      curiosityScore: 84,
      searchRelevanceScore: 98,
      clarityScore: 96,
      clickAppealScore: 89,
      charCount: `${rawTitleClean} Explained: Everything You Need to Know`.length,
      estimatedCTR: '11.5%',
      badge: 'best-search',
    },
    {
      id: 't-3',
      title: `Why Nobody Talks About This ${rawTitleClean} Secret...`,
      style: 'Curiosity Gap / Pattern Interrupt',
      curiosityScore: 98,
      searchRelevanceScore: 82,
      clarityScore: 88,
      clickAppealScore: 95,
      charCount: `Why Nobody Talks About This ${rawTitleClean} Secret...`.length,
      estimatedCTR: '15.2%',
      badge: 'best-curiosity',
    },
    {
      id: 't-4',
      title: `I Tested ${rawTitleClean} for 30 Days (Here's What Happened)`,
      style: 'Challenge / Case Study',
      curiosityScore: 91,
      searchRelevanceScore: 86,
      clarityScore: 90,
      clickAppealScore: 92,
      charCount: `I Tested ${rawTitleClean} for 30 Days (Here's What Happened)`.length,
      estimatedCTR: '12.4%',
      badge: null,
    },
    {
      id: 't-5',
      title: `The Truth Behind ${rawTitleClean} Will Shock You!`,
      style: 'High Emotion & Urgency',
      curiosityScore: 93,
      searchRelevanceScore: 80,
      clarityScore: 85,
      clickAppealScore: 91,
      charCount: `The Truth Behind ${rawTitleClean} Will Shock You!`.length,
      estimatedCTR: '11.9%',
      badge: null,
    },
    {
      id: 't-6',
      title: `5 Massive Mistakes People Make with ${rawTitleClean}`,
      style: 'Listicle & Warning',
      curiosityScore: 88,
      searchRelevanceScore: 91,
      clarityScore: 94,
      clickAppealScore: 89,
      charCount: `5 Massive Mistakes People Make with ${rawTitleClean}`.length,
      estimatedCTR: '10.8%',
      badge: null,
    },
    {
      id: 't-7',
      title: `How ${rawTitleClean} Actually Works (Step-by-Step Guide)`,
      style: 'Educational Masterclass',
      curiosityScore: 82,
      searchRelevanceScore: 96,
      clarityScore: 95,
      clickAppealScore: 87,
      charCount: `How ${rawTitleClean} Actually Works (Step-by-Step Guide)`.length,
      estimatedCTR: '10.2%',
      badge: null,
    },
    {
      id: 't-8',
      title: `The Dark Reality of ${rawTitleClean} Revealed`,
      style: 'Investigative Deep Dive',
      curiosityScore: 95,
      searchRelevanceScore: 85,
      clarityScore: 89,
      clickAppealScore: 93,
      charCount: `The Dark Reality of ${rawTitleClean} Revealed`.length,
      estimatedCTR: '13.1%',
      badge: null,
    },
    {
      id: 't-9',
      title: `Before You Try ${rawTitleClean}, WATCH THIS!`,
      style: 'Negative Urgency Warning',
      curiosityScore: 92,
      searchRelevanceScore: 87,
      clarityScore: 91,
      clickAppealScore: 93,
      charCount: `Before You Try ${rawTitleClean}, WATCH THIS!`.length,
      estimatedCTR: '12.6%',
      badge: null,
    },
    {
      id: 't-10',
      title: `The Ultimate ${currentYear} Guide to ${rawTitleClean}`,
      style: 'Definitive Authority',
      curiosityScore: 80,
      searchRelevanceScore: 95,
      clarityScore: 97,
      clickAppealScore: 86,
      charCount: `The Ultimate ${currentYear} Guide to ${rawTitleClean}`.length,
      estimatedCTR: '9.8%',
      badge: null,
    },
  ];

  // Build accurate timestamp chapters from actual scene breakdown
  let cumulativeSeconds = 0;
  const chapters = scenes.length > 0
    ? scenes.map((s, idx) => {
        const minutes = Math.floor(cumulativeSeconds / 60);
        const seconds = cumulativeSeconds % 60;
        const timecode = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        cumulativeSeconds += s.durationSeconds || 30;
        return {
          timecode,
          title: s.title || `Scene ${idx + 1}`,
        };
      })
    : [
        { timecode: '00:00', title: 'Introduction & Hook' },
        { timecode: '00:30', title: 'The Core Discovery' },
        { timecode: '01:15', title: 'Deep Dive & Evidence' },
        { timecode: '02:00', title: 'The Turning Point' },
        { timecode: '02:45', title: 'Conclusion & Next Steps' },
      ];

  const primaryKeyword = rawTitleClean.toLowerCase();
  const secondaryKeywords = [
    `${primaryKeyword} explained`,
    `${primaryKeyword} guide`,
    `${primaryKeyword} ${currentYear}`,
    `${primaryKeyword} breakdown`,
    `best ${primaryKeyword} tips`,
  ];
  const longTailKeywords = [
    `how does ${primaryKeyword} work step by step`,
    `everything you need to know about ${primaryKeyword}`,
    `why ${primaryKeyword} is changing everything`,
    `the real truth about ${primaryKeyword} in ${currentYear}`,
  ];

  const hashtags = [
    `#${rawTitleClean.replace(/[^a-zA-Z0-9]/g, '')}`,
    '#YouTubeStrategy',
    '#ViralVideo',
    '#DeepDive',
    '#Documentary',
    '#Education',
  ];

  const tags = [
    rawTitleClean,
    `${rawTitleClean} tutorial`,
    `${rawTitleClean} documentary`,
    `${rawTitleClean} explained`,
    `${rawTitleClean} breakdown`,
    `${rawTitleClean} review`,
    `${rawTitleClean} guide`,
    settings.visualStyle,
    settings.videoType,
    'youtube content creation',
    'viral video strategy',
    'video production',
    'storytelling',
    'ai filmmaking',
    'educational video',
  ];

  const description = `In this deep dive, we uncover the complete story and hidden secrets behind ${rawTitleClean}.\n\n` +
    `Whether you are discovering this for the first time or looking for an in-depth breakdown, this video covers everything you need to know about ${primaryKeyword} with full cinematic visuals.\n\n` +
    `📌 TIMESTAMPS:\n` +
    chapters.map((ch) => `${ch.timecode} - ${ch.title}`).join('\n') +
    `\n\n🔔 Subscribe to the channel for more in-depth breakdowns and cinematic stories!\n` +
    `💬 Question of the day: What surprised you most about ${rawTitleClean}? Let us know in the comments below!\n\n` +
    `✨ Production Specs: Visual Style: ${settings.visualStyle} | Language: ${settings.language}\n\n` +
    hashtags.join(' ');

  return {
    selectedTitle: titleOptions[0].title,
    titleOptions,
    description,
    primaryKeyword,
    secondaryKeywords,
    longTailKeywords,
    keywordsStructured: {
      primaryKeyword,
      secondaryKeywords,
      longTailKeywords,
    },
    tags,
    hashtags,
    chapters,
    seoKeywords: [
      { keyword: primaryKeyword, volumeLevel: 'High (50k+)', competition: 'Medium', intent: 'General Discovery' },
      { keyword: `${primaryKeyword} explained`, volumeLevel: 'High (25k+)', competition: 'Low', intent: 'Educational Research' },
      { keyword: `${primaryKeyword} ${currentYear}`, volumeLevel: 'Trending (15k+)', competition: 'Low', intent: 'Fresh News' },
      { keyword: `how does ${primaryKeyword} work`, volumeLevel: 'Long-Tail (8k+)', competition: 'Low', intent: 'How-To Action' },
    ],
  };
}

export function generateShortsForProject(
  title: string,
  settings: VideoSettings,
  characters: CharacterProfile[] = [],
  scenes: SceneBreakdown[] = []
): ShortsData {
  const primaryChar = characters[0]?.name || 'Protagonist';

  const s1: ShortScript = {
    id: 's1',
    shortTitle: 'The 3-Second Viral Hook',
    title: 'The 3-Second Viral Hook',
    hook: `Stop scrolling! You won't believe what happens with ${title}...`,
    duration: '40s',
    targetDuration: '40s',
    script: `Stop scrolling! If you thought ${title} was straightforward, wait until you see this. Most people have no idea this actually happened, but the evidence reveals a totally different story. Tap the subscribe button to watch the full long-form breakdown on our channel right now!`,
    visualBeats: [
      {
        second: '0-3s',
        visual: `Dynamic rapid zoom-in on ${primaryChar}'s shocked facial expression in 9:16 vertical`,
        audioNarration: `Stop scrolling! You won't believe what happens with ${title}...`,
        onScreenCaption: 'WAIT TILL THE END 👀',
      },
      {
        second: '4-15s',
        visual: 'Fast montage of the climactic mystery evidence with glowing text highlights',
        audioNarration: 'Most people have no idea this actually happened, but the evidence reveals a totally different story.',
        onScreenCaption: 'THE REAL STORY ⚡',
      },
      {
        second: '16-30s',
        visual: 'High-energy side-by-side comparison revealing the crucial turning point',
        audioNarration: 'Watch how every single detail leads directly to this shocking moment.',
        onScreenCaption: 'MIND = BLOWN 🤯',
      },
      {
        second: '31-40s',
        visual: 'Pulsing channel subscribe button with arrow pointing down to full video link',
        audioNarration: 'Tap subscribe to watch the full breakdown on our channel right now!',
        onScreenCaption: 'FULL VIDEO ON CHANNEL 🔔',
      },
    ],
    characters: [primaryChar],
    sceneSelection: ['Scene 1', 'Scene 3'],
    ending: 'And that changes everything you thought you knew.',
    callToAction: 'Subscribe for the full video on our channel!',
    CTA: 'Subscribe for the full video on our channel!',
    shortDescription: `You won't believe this detail about ${title}! Full video on our channel. #Shorts #Viral`,
    hashtags: ['#Shorts', '#Viral', `#${title.replace(/[^a-zA-Z0-9]/g, '')}`, '#YouTubeShorts', '#Storytime'],
    audioSoundtrack: 'Fast-paced phonk rhythm with dramatic bass drop',
  };

  const s2: ShortScript = {
    id: 's2',
    shortTitle: 'The Biggest Myth Exposed',
    title: 'The Biggest Myth Exposed',
    hook: `99% of people get this WRONG about ${title}!`,
    duration: '35s',
    targetDuration: '35s',
    script: `99% of people get this completely wrong about ${title}! Everyone assumed it worked one way, but when we look at the actual facts, the truth is completely backwards. Watch what happens when we test it. Subscribe for part 2!`,
    visualBeats: [
      {
        second: '0-3s',
        visual: 'Red flashing warning banner over high-contrast portrait of the character',
        audioNarration: `99% of people get this WRONG about ${title}!`,
        onScreenCaption: 'DO NOT MAKE THIS MISTAKE ⚠️',
      },
      {
        second: '4-18s',
        visual: 'Split screen showing common misconception vs verified reality in bold colors',
        audioNarration: 'Everyone assumed it worked one way, but when we look at the actual facts, the truth is completely backwards.',
        onScreenCaption: 'MYTH VS REALITY 🔍',
      },
      {
        second: '19-35s',
        visual: 'Rapid 3-step proof breakdown concluding with glowing subscribe icon',
        audioNarration: 'Watch what happens when we test it. Subscribe for part 2!',
        onScreenCaption: 'SUBSCRIBE FOR PART 2 🔔',
      },
    ],
    characters: [primaryChar],
    sceneSelection: ['Scene 2', 'Scene 4'],
    ending: 'Never make this mistake again!',
    callToAction: 'Subscribe for part 2 on our channel!',
    CTA: 'Subscribe for part 2 on our channel!',
    shortDescription: `The biggest misconception about ${title} debunked! #Shorts #Facts`,
    hashtags: ['#Shorts', '#MythBusters', '#Trending', '#DidYouKnow', '#YouTube'],
    audioSoundtrack: 'Tense investigative synth building to triumphant crescendo',
  };

  const s3: ShortScript = {
    id: 's3',
    shortTitle: 'The Climax Behind-The-Scenes',
    title: 'The Climax Behind-The-Scenes',
    hook: `Here is what nobody noticed in the climax of ${title}...`,
    duration: '45s',
    targetDuration: '45s',
    script: `Here is what nobody noticed in the climax of ${title}. If you look closely at the background in this scene, there is a hidden detail that predicts the entire ending. Let me show you what you missed. Subscribe to see more hidden secrets!`,
    visualBeats: [
      {
        second: '0-4s',
        visual: 'Magnifying glass effect zooming into a background detail with pulsing circle',
        audioNarration: `Here is what nobody noticed in the climax of ${title}...`,
        onScreenCaption: 'DID YOU NOTICE THIS? 🔎',
      },
      {
        second: '5-22s',
        visual: 'Slow motion breakdown with yellow arrows pointing out subtle clues',
        audioNarration: 'If you look closely at the background in this scene, there is a hidden detail that predicts the entire ending.',
        onScreenCaption: 'HIDDEN DETAIL REVEALED ⚡',
      },
      {
        second: '23-45s',
        visual: 'Full frame reveal showing how all clues connect together seamlessly',
        audioNarration: 'Let me show you what you missed. Subscribe to see more hidden secrets!',
        onScreenCaption: 'FOLLOW FOR MORE 🚀',
      },
    ],
    characters: [primaryChar],
    sceneSelection: ['Scene 4', 'Scene 5'],
    ending: 'Once you see it, you can never unsee it.',
    callToAction: 'Subscribe to see more hidden secrets!',
    CTA: 'Subscribe to see more hidden secrets!',
    shortDescription: `The hidden detail in ${title} that changes everything! #Shorts #FilmTheory`,
    hashtags: ['#Shorts', '#HiddenDetails', '#FilmSecrets', '#ViralShorts', '#DeepDive'],
    audioSoundtrack: 'Mysterious atmospheric arpeggio with punchy beat drop',
  };

  return {
    scripts: [s1, s2, s3],
    ideas: [
      {
        id: 'short-idea-1',
        title: s1.title,
        hook: s1.hook,
        angle: 'Viral curiosity gap pattern interrupt',
        estimatedViralPotential: 'Extreme (90%+ retention)',
        targetDuration: '40s',
      },
      {
        id: 'short-idea-2',
        title: s2.title,
        hook: s2.hook,
        angle: 'Myth debunker with high comment debate volume',
        estimatedViralPotential: 'Very High',
        targetDuration: '35s',
      },
      {
        id: 'short-idea-3',
        title: s3.title,
        hook: s3.hook,
        angle: 'Hidden detail easter egg discovery',
        estimatedViralPotential: 'High',
        targetDuration: '45s',
      },
    ],
  };
}

export function regenerateSingleThumbnail(
  project: YouTubeProject,
  conceptIndex: number
): YouTubeProject {
  const currentConcepts = project.thumbnail?.concepts && project.thumbnail.concepts.length > 0
    ? [...project.thumbnail.concepts]
    : generateThumbnailForProject(project.idea, project.settings, project.characters).concepts;

  const freshList = generateThumbnailForProject(project.idea, project.settings, project.characters).concepts;
  const fresh = freshList[conceptIndex] || freshList[0];

  if (conceptIndex >= 0 && conceptIndex < currentConcepts.length) {
    currentConcepts[conceptIndex] = {
      ...fresh,
      id: currentConcepts[conceptIndex].id || `c${conceptIndex + 1}`,
    };
  } else {
    currentConcepts.push(fresh);
  }

  const updated: YouTubeProject = {
    ...project,
    thumbnail: {
      ...project.thumbnail,
      concepts: currentConcepts,
      selectedConceptId: currentConcepts[0]?.id || 'c1',
    },
    updatedAt: new Date().toISOString(),
  };

  saveProject(updated);
  return updated;
}

export function regenerateSingleShort(
  project: YouTubeProject,
  shortIndex: number
): YouTubeProject {
  const currentScripts = project.shorts?.scripts && project.shorts.scripts.length > 0
    ? [...project.shorts.scripts]
    : generateShortsForProject(project.idea, project.settings, project.characters, project.scenes).scripts;

  const freshList = generateShortsForProject(project.idea, project.settings, project.characters, project.scenes).scripts;
  const fresh = freshList[shortIndex] || freshList[0];

  if (shortIndex >= 0 && shortIndex < currentScripts.length) {
    currentScripts[shortIndex] = {
      ...fresh,
      id: currentScripts[shortIndex].id || `s${shortIndex + 1}`,
    };
  } else {
    currentScripts.push(fresh);
  }

  const updated: YouTubeProject = {
    ...project,
    shorts: {
      ...project.shorts,
      scripts: currentScripts,
    },
    updatedAt: new Date().toISOString(),
  };

  saveProject(updated);
  return updated;
}


// -------------------------------------------------------------
// Granular Section Regeneration Functions (Step 6 Mandate)
// -------------------------------------------------------------

export function regenerateProjectSection(
  project: YouTubeProject,
  sectionKey:
    | 'concept'
    | 'hook'
    | 'script'
    | 'characters'
    | 'scenes'
    | 'thumbnail'
    | 'youtubeSeo'
    | 'seo'
    | 'shorts'
    | 'prompts'
    | 'videoPrompts'
): YouTubeProject {
  const updated: YouTubeProject = { ...project };

  switch (sectionKey) {
    case 'concept':
      updated.concept = generateConceptForProject(project.idea, project.settings);
      break;
    case 'hook':
      updated.hook = generateHookForProject(project.idea, project.settings);
      break;
    case 'script':
      updated.script = generateScriptForProject(project.idea, project.settings);
      break;
    case 'characters':
      updated.characters = generateCharactersForProject(project.idea, project.settings);
      break;
    case 'scenes':
      updated.scenes = generateScenesForProject(
        project.idea,
        project.settings,
        project.settings.targetScenesCount || 5
      );
      break;
    case 'prompts':
    case 'videoPrompts':
      updated.videoPrompts = generateVideoPromptsForProject(
        project.idea,
        project.settings,
        project.scenes,
        project.characters
      );
      break;
    case 'thumbnail':
      updated.thumbnail = generateThumbnailForProject(project.idea, project.settings, project.characters);
      break;
    case 'youtubeSeo':
    case 'seo':
      updated.youtubeSeo = generateSeoForProject(project.idea, project.settings, project.scenes);
      break;
    case 'shorts':
      updated.shorts = generateShortsForProject(project.idea, project.settings, project.characters, project.scenes);
      break;
  }

  saveProject(updated);
  return updated;
}

export function regenerateSingleScene(
  project: YouTubeProject,
  sceneNumber: number
): YouTubeProject {
  const scenes = [...project.scenes];
  const targetIdx = scenes.findIndex((s) => s.sceneNumber === sceneNumber);
  if (targetIdx >= 0) {
    const s = scenes[targetIdx];
    scenes[targetIdx] = {
      ...s,
      cameraAngleMotion: s.cameraAngleMotion.includes('crane') ? 'Dynamic low-angle tracking shot with cinematic flare' : 'Smooth orbital crane shot rotating 45 degrees',
      lightingMood: s.lightingMood.includes('golden') ? 'Moody neon backlight with volumetric haze' : 'Warm golden hour with soft rim lighting',
      aiVideoPrompt: `Cinematic 8K masterpiece, ${project.settings.visualStyle}, dramatic scene for "${project.idea} - ${s.title}", stunning volumetric atmosphere, Unreal Engine 5 render --ar ${project.settings.aspectRatio === '9:16' ? '9:16' : '16:9'}`,
      soundEffects: 'Refined spatial audio with dynamic stereo panning.',
    };
  }

  const updated: YouTubeProject = { ...project, scenes };
  saveProject(updated);
  return updated;
}

export function regenerateSingleVideoPrompt(
  project: YouTubeProject,
  sceneNumber: number
): YouTubeProject {
  const currentPrompts = project.videoPrompts && project.videoPrompts.length > 0
    ? [...project.videoPrompts]
    : generateVideoPromptsForProject(project.idea, project.settings, project.scenes, project.characters);

  const sceneRef = project.scenes.find((s) => s.sceneNumber === sceneNumber);
  const targetIdx = currentPrompts.findIndex((p) => p.sceneNumber === sceneNumber);

  const fallbackAll = generateVideoPromptsForProject(project.idea, project.settings, project.scenes, project.characters);
  const freshPrompt = fallbackAll.find((p) => p.sceneNumber === sceneNumber) || fallbackAll[0];

  if (targetIdx >= 0) {
    currentPrompts[targetIdx] = {
      ...freshPrompt,
      sceneNumber,
      title: sceneRef?.title || currentPrompts[targetIdx].title,
    };
  } else {
    currentPrompts.push({
      ...freshPrompt,
      sceneNumber,
      title: sceneRef?.title || `Scene #${sceneNumber}`,
    });
  }

  // Also update scene.aiVideoPrompt for backwards-compatibility
  const updatedScenes = project.scenes.map((s) => {
    if (s.sceneNumber === sceneNumber) {
      return {
        ...s,
        aiVideoPrompt: freshPrompt.finalPrompt,
      };
    }
    return s;
  });

  const updated: YouTubeProject = {
    ...project,
    scenes: updatedScenes,
    videoPrompts: currentPrompts,
  };

  saveProject(updated);
  return updated;
}
