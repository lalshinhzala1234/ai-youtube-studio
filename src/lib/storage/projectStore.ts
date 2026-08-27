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

  // Resolve numeric scene count
  let resolvedScenes = 5;
  if (typeof settings.sceneCount === 'number') {
    resolvedScenes = settings.sceneCount;
  } else if (settings.sceneCount === 'Auto') {
    resolvedScenes = settings.duration?.includes('30') || settings.duration?.includes('1') ? 3 : settings.duration?.includes('10') ? 8 : 5;
  } else if (!isNaN(Number(settings.sceneCount))) {
    resolvedScenes = Number(settings.sceneCount);
  } else if (settings.targetScenesCount) {
    resolvedScenes = settings.targetScenesCount;
  }

  const normalizedSettings: VideoSettings = {
    ...settings,
    targetScenesCount: resolvedScenes,
    targetDuration: settings.duration || settings.targetDuration || '3-5 Minutes',
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
  projectPartial.thumbnail = generateThumbnailForProject(title, normalizedSettings);
  projectPartial.youtubeSeo = generateSeoForProject(title, normalizedSettings);
  projectPartial.shorts = generateShortsForProject(title, normalizedSettings);

  return projectPartial;
}

// Section Generator Helpers
export function generateConceptForProject(title: string, settings: VideoSettings): VideoConcept {
  const isKids = settings.videoType === 'Kids' || title.toLowerCase().includes('kids') || title.toLowerCase().includes('abc');
  const isDoc = settings.videoType === 'Documentary' || settings.videoType === 'Story' || title.toLowerCase().includes('krishna') || title.toLowerCase().includes('myth');
  const isTech = settings.videoType === 'Explainer' || settings.videoType === 'Educational' || title.toLowerCase().includes('ai') || title.toLowerCase().includes('tech');

  let premise = `An engaging, high-retention video production exploring "${title}" with structured pacing and vivid visual presentation.`;
  let coreAngle = `Approaching "${title}" through dynamic narrative beats, relatable metaphors, and immersive audio-visual worldbuilding.`;
  let demographic = `${settings.audience} viewers interested in ${settings.videoType || 'engaging online video'}`;
  let whyItWorks = `Combines a strong 0-15s curiosity hook with clear visual payoff and a pacing curve designed for ${settings.tone} delivery.`;

  if (isKids) {
    premise = `A vibrant and joyful adventure around "${title}", guiding young learners with musical mnemonics, colorful characters, and interactive call-and-response beats.`;
    coreAngle = `Gentle, colorful repetition and playful humor that makes learning letters, sounds, or stories effortless for children.`;
    demographic = `Toddlers, Preschoolers (Ages 2-7) and Parents watching in ${settings.language}`;
    whyItWorks = `Vibrant high-contrast animations keep toddlers focused, while structured repetition builds phonetic and cognitive confidence.`;
  } else if (isDoc) {
    premise = `A cinematic, deep-dive exploration into the lore, historical gravity, and untold perspectives of "${title}".`;
    coreAngle = `Dramatic scene reconstruction with photorealistic cinematography, ancient artifacts, and philosophical reflections.`;
    demographic = `Enthusiasts of mythology, historical mysteries, and cinematic epics watching in ${settings.language}`;
    whyItWorks = `High narrative tension and atmospheric lighting maintain bingeable pacing from hook to climactic resolution.`;
  } else if (isTech) {
    premise = `A crystal-clear, fast-paced technical breakdown of "${title}" that turns complex concepts into digestible visual models.`;
    coreAngle = `Deconstructive motion graphics, real-world case studies, and future projections with high-energy pattern interrupts.`;
    demographic = `Tech enthusiasts, students, and curious learners watching in ${settings.language}`;
    whyItWorks = `Demystifies complex terminology through concrete visual metaphors and immediate practical relevance.`;
  }

  return {
    titleWorking: title,
    premise,
    coreAngle,
    targetAudience: {
      demographic,
      interests: [settings.videoType, settings.visualStyle, 'YouTube Long Form', 'Visual Storytelling'],
      painPointsOrCuriosity: `Viewers want a captivating, visually rich explanation of "${title}" without dry jargon or boring pacing.`,
      viewingMotivation: `To be thoroughly entertained and gain clear insights through a ${settings.tone.toLowerCase()} presentation.`,
    },
    educationalOrEntertainmentValue: `Delivers premium ${settings.visualStyle} visuals with tightly timed ${settings.narration} narration in ${settings.language}.`,
    whyItWorks,
    toneAnalysis: `${settings.tone} delivery tailored with ${settings.visualStyle} aesthetics and ${settings.aspectRatio} composition.`,
  };
}

export function generateHookForProject(title: string, settings: VideoSettings): VideoHook {
  return {
    selectedHookId: 'hook-opt-1',
    hookOptions: [
      {
        id: 'hook-opt-1',
        type: 'Visual Hook',
        text: `What if everything you were told about "${title}" was only the beginning of the real story?`,
        visualDirection: `Extreme dynamic camera push-in on the primary subject in ${settings.visualStyle} style with atmospheric particles and sound riser.`,
        estimatedDeliverySeconds: 5,
        explanation: 'Creates an immediate curiosity gap within the first 5 seconds to halt scrolling and boost viewer retention.',
      },
      {
        id: 'hook-opt-2',
        type: 'Pattern Interrupt',
        text: `Stop scrolling! In the next few minutes, we are revealing the secret truth behind "${title}" that almost nobody talks about.`,
        visualDirection: 'Rapid visual glitch cut followed by a bold high-contrast title flash and dramatic bass drop.',
        estimatedDeliverySeconds: 6,
        explanation: 'Breaks standard viewer habituation and establishes instant high stakes.',
      },
      {
        id: 'hook-opt-3',
        type: 'Curiosity / Question',
        text: `Have you ever wondered what actually happens when you dive deep into "${title}"? The answer will surprise you.`,
        visualDirection: 'Macro shot zooming out to reveal a vast cinematic landscape with glowing focal element.',
        estimatedDeliverySeconds: 6,
        explanation: 'Directly engages the audience with a relatable question and promised payoff.',
      },
    ],
    retentionStrategy: `Maintain audience momentum with 3-5 second visual cuts, dynamic ${(settings.narration || 'Voiceover').toLowerCase()} pacing, and recurring audio markers.`,
    first30SecondsRoadmap: [
      `00:00 - 00:05: High-impact opening visual hook in ${settings.visualStyle} and core curiosity statement`,
      `00:05 - 00:15: Introduction of the core conflict or premise in ${settings.language}`,
      `00:15 - 00:30: Escalating roadmap outlining the most exciting discoveries coming up`,
    ],
  };
}

export function generateCharactersForProject(title: string, settings: VideoSettings): CharacterProfile[] {
  const isKids = settings.videoType === 'Kids';
  if (isKids) {
    return [
      {
        id: 'char-protagonist',
        name: 'Sparky the Explorer',
        role: 'Protagonist / Host Guide',
        ageOrSpecies: 'Animated Friendly Mascot',
        visualAppearance: `Expressive cartoon character, vibrant colors, oversized friendly eyes, ${settings.visualStyle} rendering`,
        hairOrFeatures: 'Soft 3D textures with warm highlights',
        clothingOutfit: 'Signature explorer vest with tiny golden badge',
        signatureItem: 'Magic glowing magnifying glass',
        personalityTraits: ['Curious', 'Joyful', 'Energetic', 'Encouraging'],
        voiceStyle: `Warm, cheerful, articulate voice in ${settings.language}`,
        visualPromptAnchor: `Sparky the explorer mascot, 3D animated character, ${settings.visualStyle}, expressive cheerful eyes, Unreal Engine 5 render, cinematic lighting`,
      },
      {
        id: 'char-sidekick',
        name: 'Barnaby the Wise Helper',
        role: 'Co-Host / Comedic Relief',
        ageOrSpecies: 'Cuddly Animal Companion',
        visualAppearance: 'Chubby round silhouette, gentle demeanor, warm pastel palette',
        hairOrFeatures: 'Plush texture with soft lighting',
        clothingOutfit: 'Colorful scarf with star patterns',
        signatureItem: 'Musical drum with glowing symbols',
        personalityTraits: ['Gentle', 'Loyal', 'Playful', 'Patient'],
        voiceStyle: `Friendly, melodic, and supportive in ${settings.language}`,
        visualPromptAnchor: `Barnaby the animated companion, cute 3D character, ${settings.visualStyle}, smiling face, volumetric lighting`,
      },
    ];
  }

  return [
    {
      id: 'char-host',
      name: 'The Guide',
      role: 'Narrator / Expert Presenter',
      ageOrSpecies: 'Lead Presenter',
      visualAppearance: `Clean aesthetic silhouette, cinematic lighting, styled for ${settings.visualStyle}`,
      hairOrFeatures: 'Distinctive hair and sharp visual contrast',
      clothingOutfit: 'Modern stylish attire matching thematic color palette',
      signatureItem: 'Interactive holographic device or classic notebook',
      personalityTraits: ['Knowledgeable', 'Engaging', 'Confident', 'Captivating'],
      voiceStyle: `${settings.tone} delivery, articulate and well-paced in ${settings.language}`,
      visualPromptAnchor: `Cinematic presenter character for ${title}, ${settings.visualStyle}, dramatic key lighting, photorealistic 8k render`,
    },
  ];
}

export function generateScriptForProject(title: string, settings: VideoSettings): VideoScript {
  const sections = [
    {
      id: 'sec-intro',
      name: 'Act 1: The Hook & Introduction',
      timecode: '00:00 - 00:45',
      visualDirection: `Opening pan over a dramatic scene representing ${title}. Animated title card rendered in ${settings.visualStyle}.`,
      dialogueOrNarration: `Welcome! Today we are taking you on a journey into ${title}. Before we get started, prepare yourself for what we are about to uncover.`,
      onScreenText: title.toUpperCase(),
      soundEffectOrMusicCue: 'Upbeat cinematic intro riser with gentle bass pulse',
      deliveryNotes: `High energy and confident delivery in ${settings.language}.`,
    },
    {
      id: 'sec-exploration',
      name: 'Act 2: The Core Discovery',
      timecode: '00:45 - 02:30',
      visualDirection: `Dynamic sequence of visual demonstrations and scene highlights in ${settings.visualStyle}.`,
      dialogueOrNarration: `Let's break down the foundational elements. Notice how each piece connects to the central theme of ${title}.`,
      onScreenText: 'KEY DISCOVERY #1 ⚡',
      soundEffectOrMusicCue: 'Steady rhythmic underscore building curiosity',
      deliveryNotes: 'Measured and clear pacing with thoughtful emphasis on key terms.',
    },
    {
      id: 'sec-climax',
      name: 'Act 3: The Climax & Takeaway',
      timecode: '02:30 - 03:45',
      visualDirection: `Wide angle panoramic shot showing the complete picture with vibrant color grading.`,
      dialogueOrNarration: `And that brings everything together! When you understand how ${title} works, everything changes.`,
      onScreenText: 'THE BIG REVEAL 🌟',
      soundEffectOrMusicCue: 'Triumphant crescendo with melodic resolution',
      deliveryNotes: 'Inspirational and impactful conclusion.',
    },
    {
      id: 'sec-outro',
      name: 'Act 4: Call to Action & Conclusion',
      timecode: '03:45 - 04:30',
      visualDirection: 'End screen graphic with animated subscribe button and recommended video tiles.',
      dialogueOrNarration: `If you enjoyed this exploration of ${title}, hit like and subscribe for our next deep-dive! Let us know your thoughts in the comments below!`,
      onScreenText: 'SUBSCRIBE FOR MORE! 🔔',
      soundEffectOrMusicCue: 'Uplifting modern outro beat with friendly fadeout',
      deliveryNotes: 'Warm and friendly call to action.',
    },
  ];

  return {
    totalWordCount: 580,
    estimatedReadTime: settings.duration || '3 min 45 sec',
    sections,
  };
}

export const generateSceneBreakdownsForProject = (
  title: string,
  settings: VideoSettings,
  _characters?: CharacterProfile[]
): SceneBreakdown[] => {
  return generateScenesForProject(
    title,
    settings,
    settings.targetScenesCount || 5
  );
};

export function generateScenesForProject(
  title: string,
  settings: VideoSettings,
  count: number = 5
): SceneBreakdown[] {
  const sceneTitles = [
    'The Spark of Curiosity',
    'Unveiling the Hidden World',
    'The Turning Point & Conflict',
    'The Breakthrough Moment',
    'Grand Finale & Transformation',
    'Bonus Scene: Behind the Secret',
    'Deep Dive Chapter',
    'The Ultimate Revelation',
  ];

  return Array.from({ length: Math.max(3, Math.min(12, count)) }).map((_, i) => {
    const sceneNum = i + 1;
    const sTitle = sceneTitles[i % sceneTitles.length];
    const duration = Math.round(180 / count) || 45;
    const startSec = i * duration;
    const endSec = (i + 1) * duration;
    const formatTime = (sec: number) => {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `0${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return {
      sceneNumber: sceneNum,
      durationSeconds: duration,
      timeRange: `${formatTime(startSec)} - ${formatTime(endSec)}`,
      title: `Scene ${sceneNum}: ${sTitle}`,
      location: `Thematic Environment for ${title} #${sceneNum}`,
      charactersPresent: settings.includeCharacters ? ['Lead Character / Host'] : [],
      characterActions: `Dynamic movement and key gestures representing the theme of ${sTitle}.`,
      dialogueVoiceover: `Voiceover narration explaining the critical developments in ${sTitle} in ${settings.language}.`,
      cameraAngleMotion: i % 2 === 0 ? 'Smooth orbital crane shot rotating 45 degrees' : 'Dynamic forward dolly push with shallow depth of field',
      lightingMood: i % 2 === 0 ? 'Warm golden hour with soft rim lighting' : 'High-contrast dramatic studio lighting with cool ambient fill',
      animationStyle: `${settings.visualStyle} with ${settings.aspectRatio} composition framing.`,
      soundEffects: 'Ambient environmental atmosphere, transition swoosh, and subtle melodic chime.',
      musicCue: `${settings.tone} orchestral rhythm matching scene progression.`,
      aiVideoPrompt: `Cinematic 8K video, ${settings.visualStyle}, scene depicting "${title} - ${sTitle}", ${settings.aspectRatio} aspect ratio, dramatic lighting, volumetric atmospheric depth, photorealistic render, Unreal Engine 5 aesthetic --ar ${settings.aspectRatio === '9:16' ? '9:16' : '16:9'}`,
      characterLockedPrompt: `Consistent character styling for ${title} in scene ${sceneNum}, maintain facial structure and signature outfit`,
    };
  });
}

export function generateVideoPromptsForProject(
  title: string,
  settings: VideoSettings,
  scenes: SceneBreakdown[] = [],
  characters: CharacterProfile[] = []
): SceneVideoPrompt[] {
  const activeScenes = scenes.length > 0 ? scenes : generateScenesForProject(title, settings, settings.targetScenesCount || 5);
  const primaryChar = characters[0];
  const charConsistencyDesc = primaryChar
    ? `${primaryChar.name} (${primaryChar.role}): ${primaryChar.appearance || primaryChar.visualAppearance || 'Signature character look'}, wearing ${primaryChar.clothing || primaryChar.clothingOutfit || 'signature outfit'}. Locked anchor: ${primaryChar.visualPromptAnchor || primaryChar.name}`
    : 'Consistent visual continuity matching project aesthetic';

  return activeScenes.map((scene) => {
    const sceneNum = scene.sceneNumber;
    const duration = `${scene.durationSeconds || 30}s`;
    const aspect = settings.aspectRatio || '16:9';
    const style = settings.visualStyle || 'Cinematic 4K Photorealistic';

    const action = scene.characterActions || `Dynamic cinematic action for scene ${sceneNum}`;
    const environment = scene.environment || scene.visualDescription || scene.location || `Thematic environment for ${title}`;
    const lighting = scene.lightingMood || scene.lighting || 'Cinematic three-point lighting with soft rim light';
    const camera = scene.cameraAngleMotion || scene.camera || '35mm anamorphic tracking shot';

    const finalPrompt = `Cinematic ${aspect} video, ${style}, "${scene.title}". Action: ${action}. Environment: ${environment}. Character Consistency: ${charConsistencyDesc}. Camera: ${camera}. Lighting: ${lighting}. Volumetric atmospheric depth, 8K render, photorealistic Unreal Engine 5 aesthetic --ar ${aspect === '9:16' ? '9:16' : '16:9'}`;

    const modelPrompts: ModelSpecificPrompts = {
      veo: `Google Veo prompt: Cinematic ${style} render of "${scene.title}". Action: ${action} in ${environment}. ${lighting}. Camera: ${camera}. ${aspect} aspect ratio. Audio cues: ${scene.soundEffects || 'Atmospheric sound'}.`,
      runway: `[${camera}] [${action}] [${environment}, ${lighting}] cinematic 8k render, photorealistic, ${style} --ar ${aspect === '9:16' ? '9:16' : '16:9'}`,
      kling: `Kling AI text-to-video: Master shot, ${style}, ${action} in ${environment}. ${camera}, ${lighting}, high dynamic range, fluid motion, 4k ultra-detailed.`,
      luma: `Luma Dream Machine: Smooth ${camera} capturing ${action}. Environment: ${environment}. Lighting: ${lighting}. Physics: natural cloth dynamics and realistic motion blur.`,
      sora: `OpenAI Sora: A hyper-detailed cinematic sequence in ${style} aspect ratio ${aspect}. In ${environment}, ${action}. Features ${charConsistencyDesc}. Visualized with ${camera}, ${lighting}, volumetric atmospheric depth, natural physical motion, and rich textures.`,
    };

    return {
      sceneNumber: sceneNum,
      title: scene.title,
      duration,
      durationSeconds: scene.durationSeconds || 30,
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
      atmosphere: 'Volumetric light rays, subtle atmospheric haze, and visual depth',
      animationStyle: `${style} with natural cinematic motion blur`,
      physicsMotion: 'Realistic cloth simulation, hair dynamics, and natural physical inertia',
      dialogue: scene.dialogueVoiceover || scene.dialogue || '',
      voiceAudio: 'Rich resonant vocal tone with clean acoustic isolation',
      soundEffects: scene.soundEffects || 'Diegetic environmental Foley and atmospheric soundbed',
      music: scene.musicCue || scene.music || 'Cinematic thematic score building tension',
      transition: scene.transition || 'Match cut to subsequent sequence',
      negativePrompt: 'blurry, low resolution, distorted limbs, extra fingers, morphing face, bad anatomy, text watermark, oversaturated artifacts, flickering, glitch',
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
