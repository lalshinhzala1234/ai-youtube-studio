import {
  YouTubeProject,
  VideoSettings,
  StoryData,
  VideoConcept,
  VideoHook,
  VideoScript,
  CharacterProfile,
  PropProfile,
  EnvironmentProfile,
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
import {
  generateCompleteProjectPackage,
  generateStoryUniversal,
  generateConceptUniversal,
  generateHookUniversal,
  generateCharactersUniversal,
  generateScenesUniversal,
  generateScriptUniversal,
  generateVideoPromptsUniversal,
  generateMusicLockUniversal,
  generateVoiceLockUniversal,
  generateThumbnailUniversal,
  generateSeoUniversal,
  generateShortsUniversal,
  parseDurationSeconds as parseDurationSec,
  parseSceneSeconds as parseSceneSec,
  formatTimestamp,
  formatDurationLabel,
} from '@/lib/storyEngine';

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
    story?: StoryData;
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

  const totalSec = parseDurationSec(settings.totalDuration || settings.duration || settings.targetDuration);
  const sceneSec = parseSceneSec(settings.sceneDuration, 10);
  const calculatedScenesCount = Math.max(1, Math.ceil(totalSec / sceneSec));

  let resolvedScenes = calculatedScenesCount;
  if (typeof settings.sceneCount === 'number') {
    resolvedScenes = settings.sceneCount;
  } else if (!isNaN(Number(settings.sceneCount)) && Number(settings.sceneCount) > 0) {
    resolvedScenes = Number(settings.sceneCount);
  } else if (settings.targetScenesCount) {
    resolvedScenes = settings.targetScenesCount;
  }

  const voiceMode = settings.voiceMode || (settings.narration === 'Both' ? 'Narrator + Character Dialogue' : settings.narration === 'Voiceover' ? 'Narrator' : 'Character Dialogue');

  const effectiveStory =
    overrides?.story?.fullStory?.trim() ||
    overrides?.story?.refinedStory?.trim() ||
    overrides?.story?.exactStory?.trim() ||
    settings?.fullStory?.trim() ||
    settings?.storyText?.trim() ||
    '';

  const effectiveCharacterInstructions =
    settings.characterInstructions?.trim() ||
    overrides?.story?.characterOverview?.trim() ||
    '';

  const normalizedSettings: VideoSettings = {
    ...settings,
    totalDuration: settings.totalDuration || settings.duration || formatDurationLabel(totalSec),
    totalDurationSeconds: totalSec,
    sceneDuration: settings.sceneDuration || `${sceneSec} seconds`,
    sceneDurationSeconds: sceneSec,
    voiceMode,
    targetScenesCount: resolvedScenes,
    targetDuration: settings.totalDuration || settings.duration || formatDurationLabel(totalSec),
    includeCharacters: settings.includeCharacters ?? true,
    aspectRatio: settings.aspectRatio || '9:16',
    storyIdea: settings.storyIdea || title,
    storyText: effectiveStory,
    fullStory: effectiveStory,
    refinedStory: overrides?.story?.refinedStory || settings.refinedStory,
    characterInstructions: effectiveCharacterInstructions,
  };

  const project = generateCompleteProjectPackage(
    title,
    normalizedSettings,
    effectiveStory,
    effectiveCharacterInstructions,
    id
  );

  if (overrides) {
    if (overrides.story) project.story = overrides.story;
    if (overrides.concept) project.concept = overrides.concept;
    if (overrides.hook) project.hook = overrides.hook;
    if (overrides.characters) project.characters = overrides.characters;
    if (overrides.script) project.script = overrides.script;
    if (overrides.scenes) project.scenes = overrides.scenes;
    if (overrides.videoPrompts) project.videoPrompts = overrides.videoPrompts;
  }

  if (process.env.NODE_ENV !== 'production' || typeof window !== 'undefined') {
    console.log('[STORY PIPELINE]', {
      effectiveStoryLength: effectiveStory.length,
      hasStoryOverride: !!overrides?.story,
    });
    console.log('[ASSET PIPELINE]', {
      characterCount: project.characters.length,
      environmentCount: (project.environments || []).length,
      propCount: (project.props || []).length,
    });
    console.log('[SCENE PIPELINE]', {
      sceneCount: project.scenes.length,
      sceneCharacterIds: project.scenes.map((s) => s.assetDependencies?.characters || s.characters),
    });
    console.log('[VIDEO PROMPT PIPELINE]', {
      promptCount: (project.videoPrompts || []).length,
      promptCharacterIds: (project.videoPrompts || []).map((vp) => vp.assetDependencies?.characters || []),
    });
  }

  return project;
}

// Section Generator Helpers
export function generateStoryForProject(title: string, settings: VideoSettings, userStory?: string): StoryData {
  const effectiveStory =
    userStory?.trim() ||
    settings.fullStory?.trim() ||
    settings.storyText?.trim() ||
    settings.refinedStory?.trim() ||
    '';
  return generateStoryUniversal(
    title,
    settings,
    effectiveStory,
    settings.characterInstructions
  );
}

export function generateConceptForProject(title: string, settings: VideoSettings, storyContent?: string): VideoConcept {
  const effectiveStory =
    storyContent?.trim() ||
    settings.fullStory?.trim() ||
    settings.storyText?.trim() ||
    settings.refinedStory?.trim() ||
    '';
  return generateConceptUniversal(title, settings, effectiveStory);
}

export function generateHookForProject(title: string, settings: VideoSettings, storyContent?: string): VideoHook {
  const effectiveStory =
    storyContent?.trim() ||
    settings.fullStory?.trim() ||
    settings.storyText?.trim() ||
    settings.refinedStory?.trim() ||
    '';
  return generateHookUniversal(title, settings, effectiveStory);
}

export function generateCharactersForProject(
  title: string,
  settings: VideoSettings,
  characterInstructions?: string,
  storyContent?: string
): CharacterProfile[] {
  const effectiveStory =
    storyContent?.trim() ||
    settings.fullStory?.trim() ||
    settings.storyText?.trim() ||
    settings.refinedStory?.trim() ||
    '';
  return generateCharactersUniversal(
    title,
    settings,
    effectiveStory,
    characterInstructions || settings.characterInstructions
  );
}

export function generateScriptForProject(
  title: string,
  settings: VideoSettings,
  characters: CharacterProfile[] = [],
  scenes: SceneBreakdown[] = [],
  storyContent?: string
): VideoScript {
  const effectiveStory =
    storyContent?.trim() ||
    settings.fullStory?.trim() ||
    settings.storyText?.trim() ||
    settings.refinedStory?.trim() ||
    '';
  const resolvedChars =
    characters.length > 0
      ? characters
      : generateCharactersUniversal(title, settings, effectiveStory, settings.characterInstructions);
  const resolvedScenes =
    scenes.length > 0
      ? scenes
      : generateScenesUniversal(title, settings, resolvedChars, effectiveStory);
  return generateScriptUniversal(title, settings, resolvedScenes, resolvedChars);
}

export function generateScenesForProject(
  title: string,
  settings: VideoSettings,
  targetSceneCountOrCharacters?: number | CharacterProfile[],
  characters: CharacterProfile[] = [],
  storyContent?: string
): SceneBreakdown[] {
  const effectiveStory =
    storyContent?.trim() ||
    settings.fullStory?.trim() ||
    settings.storyText?.trim() ||
    settings.refinedStory?.trim() ||
    '';
  const resolvedChars = Array.isArray(targetSceneCountOrCharacters)
    ? targetSceneCountOrCharacters
    : characters.length > 0
    ? characters
    : generateCharactersUniversal(title, settings, effectiveStory, settings.characterInstructions);

  return generateScenesUniversal(title, settings, resolvedChars, effectiveStory);
}

export const generateSceneBreakdownsForProject = generateScenesForProject;

export function generateVideoPromptsForProject(
  title: string,
  settings: VideoSettings,
  scenes: SceneBreakdown[] = [],
  characters: CharacterProfile[] = [],
  propsList?: PropProfile[],
  environmentsList?: EnvironmentProfile[],
  storyContent?: string
): SceneVideoPrompt[] {
  const effectiveStory =
    storyContent?.trim() ||
    settings.fullStory?.trim() ||
    settings.storyText?.trim() ||
    settings.refinedStory?.trim() ||
    '';
  const resolvedChars =
    characters.length > 0
      ? characters
      : generateCharactersUniversal(title, settings, effectiveStory, settings.characterInstructions);
  const resolvedScenes =
    scenes.length > 0
      ? scenes
      : generateScenesUniversal(title, settings, resolvedChars, effectiveStory);
  const musicLock = generateMusicLockUniversal(title, settings, effectiveStory);
  const voiceLock = generateVoiceLockUniversal(title, settings, effectiveStory);
  return generateVideoPromptsUniversal(
    title,
    settings,
    resolvedScenes,
    resolvedChars,
    propsList,
    environmentsList,
    musicLock,
    voiceLock,
    effectiveStory
  );
}

export function generateThumbnailForProject(
  title: string,
  settings: VideoSettings,
  characters: CharacterProfile[] = []
): ThumbnailData {
  return generateThumbnailUniversal(title, settings, characters);
}

export function generateSeoForProject(
  title: string,
  settings: VideoSettings,
  scenes: SceneBreakdown[] = []
): YouTubeSEO {
  return generateSeoUniversal(title, settings, scenes);
}

export function generateShortsForProject(
  title: string,
  settings: VideoSettings,
  characters: CharacterProfile[] = [],
  scenes: SceneBreakdown[] = []
): ShortsData {
  return generateShortsUniversal(title, settings, characters, scenes);
}

export function regenerateSingleShort(
  project: YouTubeProject,
  indexOrId: number | string
): YouTubeProject {
  const currentShorts = project.shorts?.scripts ? [...project.shorts.scripts] : [];
  const targetIdx = typeof indexOrId === 'number'
    ? indexOrId
    : currentShorts.findIndex((s) => s.id === indexOrId);

  const freshShortsData = generateShortsUniversal(
    project.idea,
    project.settings,
    project.characters,
    project.scenes
  );
  const freshScript = freshShortsData.scripts[targetIdx >= 0 ? targetIdx % freshShortsData.scripts.length : 0] || freshShortsData.scripts[0];

  if (targetIdx >= 0 && targetIdx < currentShorts.length) {
    currentShorts[targetIdx] = {
      ...freshScript,
      id: currentShorts[targetIdx]?.id || `short-${targetIdx + 1}`,
    };
  } else {
    currentShorts.push(freshScript);
  }

  const updated: YouTubeProject = {
    ...project,
    shorts: {
      ...project.shorts,
      scripts: currentShorts,
    },
    updatedAt: new Date().toISOString(),
  };

  saveProject(updated);
  return updated;
}

export function regenerateShortsConcept(
  project: YouTubeProject,
  shortId: string
): YouTubeProject {
  return regenerateSingleShort(project, shortId);
}

export function regenerateSingleThumbnail(
  project: YouTubeProject,
  index: number
): YouTubeProject {
  const currentConcepts = project.thumbnail?.concepts ? [...project.thumbnail.concepts] : [];
  const freshThumbnail = generateThumbnailUniversal(
    project.idea,
    project.settings,
    project.characters
  );
  const freshConcept = freshThumbnail.concepts[index % freshThumbnail.concepts.length] || freshThumbnail.concepts[0];

  if (index >= 0 && index < currentConcepts.length) {
    currentConcepts[index] = {
      ...freshConcept,
      id: currentConcepts[index]?.id || `thumb-${index + 1}`,
    };
  } else {
    currentConcepts.push(freshConcept);
  }

  const updated: YouTubeProject = {
    ...project,
    thumbnail: {
      ...project.thumbnail,
      concepts: currentConcepts,
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
      updated.characters = generateCharactersForProject(
        project.idea,
        project.settings,
        project.characterInstructions,
        project.fullStory || project.story?.fullStory || project.settings.storyText
      );
      updated.assetRegistry = {
        ...(project.assetRegistry || { characters: {}, props: {}, environments: {} }),
        characters: Object.fromEntries(updated.characters.map((c) => [c.id, c])),
      };
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
        project.characters,
        project.props || Object.values(project.assetRegistry?.props || {}),
        project.environments || Object.values(project.assetRegistry?.environments || {}),
        project.fullStory || project.story?.fullStory || project.settings.storyText
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
  const propsList = project.props || Object.values(project.assetRegistry?.props || {});
  const environmentsList = project.environments || Object.values(project.assetRegistry?.environments || {});
  const storyContent = project.fullStory || project.story?.fullStory || project.settings.storyText;

  const currentPrompts = project.videoPrompts && project.videoPrompts.length > 0
    ? [...project.videoPrompts]
    : generateVideoPromptsForProject(project.idea, project.settings, project.scenes, project.characters, propsList, environmentsList, storyContent);

  const sceneRef = project.scenes.find((s) => s.sceneNumber === sceneNumber);
  const targetIdx = currentPrompts.findIndex((p) => p.sceneNumber === sceneNumber);

  const fallbackAll = generateVideoPromptsForProject(project.idea, project.settings, project.scenes, project.characters, propsList, environmentsList, storyContent);
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
