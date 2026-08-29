export type VideoType =
  | 'Kids Story'
  | 'Kids Rhyme'
  | 'Kids'
  | 'Educational'
  | 'Explainer'
  | 'Documentary'
  | 'Cinematic Story'
  | 'Story'
  | 'Entertainment'
  | 'Faceless'
  | 'Music'
  | 'Other'
  | string;

export type TargetAudience = 'Kids' | 'Teens' | 'General' | 'Adults' | string;

export type Language =
  | 'Hindi'
  | 'English'
  | 'Hinglish'
  | 'Gujarati'
  | 'Marathi'
  | 'Bengali'
  | 'Tamil'
  | 'Telugu'
  | 'Other'
  | string;

export type VideoDuration =
  | '30 seconds'
  | '1 minute'
  | '2 minutes'
  | '3 minutes'
  | '5 minutes'
  | '10 minutes'
  | 'Custom'
  | string;

export type SceneDurationOption =
  | '5 seconds'
  | '10 seconds'
  | '15 seconds'
  | '20 seconds'
  | '30 seconds'
  | 'Custom'
  | string;

export type VideoFormat = 'YouTube Long Form' | 'YouTube Shorts' | string;

export type VisualStyle =
  | '3D Cartoon'
  | '2D Cartoon'
  | 'Cinematic'
  | 'Realistic'
  | 'Anime'
  | 'Educational'
  | 'Custom'
  | string;

export type Tone =
  | 'Fun'
  | 'Emotional'
  | 'Educational'
  | 'Exciting'
  | 'Funny'
  | 'Inspirational'
  | 'Dramatic'
  | string;

export type VoiceMode =
  | 'Narrator'
  | 'Character Dialogue'
  | 'Narrator + Character Dialogue'
  | 'No Spoken Dialogue'
  | string;

export type Narration = VoiceMode;

export type SceneCountOption = 'Auto' | '5' | '10' | '15' | '20' | 'Custom' | number | string;

export type AspectRatio = '16:9' | '9:16' | '1:1' | string;

export type TargetPace =
  | 'Ultra Fast (Shorts / MrBeast)'
  | 'Dynamic & Engaging (3-5s cuts)'
  | 'Steady Documentary'
  | 'Gentle Kids Pace'
  | string;

export interface ProjectSettings {
  videoType: VideoType;
  audience?: TargetAudience;
  language: Language;
  duration?: VideoDuration;
  totalDuration?: string;
  totalDurationSeconds?: number;
  sceneDuration?: SceneDurationOption;
  sceneDurationSeconds?: number;
  voiceMode?: VoiceMode;
  format?: VideoFormat;
  visualStyle: VisualStyle;
  tone: Tone;
  narration?: Narration;
  sceneCount?: SceneCountOption;
  aspectRatio?: AspectRatio;
  targetDuration: string;
  targetPace?: TargetPace;
  targetScenesCount: number;
  includeCharacters: boolean;
  customDuration?: string;
  customSceneDuration?: string;
  customStyle?: string;
  customScenes?: number;
  customLanguage?: string;
  customTone?: string;
}

export type VideoSettings = ProjectSettings;

export interface TargetAudienceProfile {
  demographic: string;
  viewingMotivation: string;
  painPointsOrCuriosity: string;
  interests?: string[];
}

export interface ConceptData {
  title?: string;
  titleWorking: string;
  premise: string;
  coreAngle: string;
  targetAudience: TargetAudienceProfile;
  tone?: string;
  learningGoal?: string;
  storySummary?: string;
  whyItWorks: string;
  educationalOrEntertainmentValue?: string;
  toneAnalysis?: string;
}

export interface HookOption {
  id: string;
  type: string;
  text: string;
  visualDirection: string;
  explanation: string;
  estimatedDeliverySeconds: number;
}

export interface HookData {
  hook?: string;
  visualHook?: string;
  first10Seconds?: string;
  retentionReason?: string;
  hookOptions: HookOption[];
  selectedHookId: string;
  first30SecondsRoadmap: string[];
  retentionStrategy?: string;
}

export interface ScriptSection {
  id: string;
  name: string;
  timecode: string;
  visualDirection: string;
  dialogueOrNarration: string;
  narratorDialogue?: string;
  characterDialogue?: string;
  sceneIntent?: string;
  onScreenText?: string;
  soundEffectOrMusicCue?: string;
  deliveryNotes?: string;
}

export interface ScriptData {
  totalWordCount: number;
  estimatedReadTime: string;
  completeScript?: string;
  narratorDialogue?: string;
  characterDialogue?: string;
  sceneIntent?: string;
  sections: ScriptSection[];
}

export interface CharacterProfile {
  id: string;
  name: string;
  characterType?: string; // Human Boy, Human Girl, Adult Man, Adult Woman, Animal, Bird, Fantasy Creature, Robot, Monster, Magical Object, Vehicle, etc.
  role: string;
  age?: string;
  ageOrSpecies?: string;
  gender?: string;
  species?: string;
  appearance?: string;
  visualAppearance: string;
  face?: string;
  hair?: string;
  eyes?: string;
  skinOrVisualCharacteristics?: string;
  bodyOrBuild?: string;
  bodyType?: string;
  clothing?: string;
  clothingOutfit: string;
  shoes?: string;
  accessories?: string;
  signatureItem: string;
  personality?: string;
  personalityTraits?: string[];
  expressions?: string;
  voice?: string;
  voiceStyle?: string;
  language?: string;
  speakingStyle?: string;
  characterPurpose?: string;
  specialFeatures?: string;
  visualPromptAnchor: string;
  characterIdentityLock?: string;
  hairOrFeatures?: string;
}

export interface SceneBreakdown {
  sceneNumber: number;
  duration?: string | number;
  durationSeconds: number;
  startTime?: string;
  endTime?: string;
  timeRange: string;
  title: string;
  location: string;
  timeOfDay?: string;
  characters?: string[];
  charactersPresent?: string[];
  characterActions: string;
  environment?: string;
  visualDescription?: string;
  dialogue?: string;
  dialogueVoiceover: string;
  spokenDialogueType?: 'dialogue' | 'narration' | 'none' | string;
  spokenDialogue?: string;
  voiceInstruction?: string;
  audioRestriction?: string;
  continuityNote?: string;
  narrator?: string;
  camera?: string;
  cameraMovement?: string;
  cameraAngleMotion: string;
  lighting?: string;
  lightingMood: string;
  animation?: string;
  animationStyle?: string;
  soundEffects?: string;
  music?: string;
  musicCue?: string;
  transition?: string;
  scenePurpose?: string;
  aiVideoPrompt: string;
  characterLockedPrompt?: string;
}

export interface ModelSpecificPrompts {
  veo: string;
  runway: string;
  kling: string;
  luma: string;
  sora: string;
}

export interface SceneVideoPrompt {
  sceneNumber: number;
  title: string;
  duration: string;
  durationSeconds: number;
  startTime?: string;
  endTime?: string;
  aspectRatio: string;
  visualStyle: string;
  characterConsistencyDescription: string;
  characterIdentityLock?: string;
  continuityNote?: string;
  spokenDialogueType?: 'dialogue' | 'narration' | 'none' | string;
  spokenDialogue?: string;
  voiceInstruction?: string;
  audioRestriction?: string;
  environment: string;
  action: string;
  facialExpressions: string;
  bodyMovement: string;
  cameraShot: string;
  cameraMovement: string;
  lensFraming: string;
  lighting: string;
  atmosphere: string;
  animationStyle: string;
  physicsMotion: string;
  dialogue: string;
  voiceAudio: string;
  soundEffects: string;
  music: string;
  transition: string;
  negativePrompt: string;
  finalPrompt: string;
  modelPrompts: ModelSpecificPrompts;
}

export interface ThumbnailConcept {
  id: string;
  conceptTitle?: string;
  title: string;
  visualConcept?: string;
  mainSubject?: string;
  characterExpression?: string;
  facialExpression?: string;
  background?: string;
  foregroundElements?: string;
  composition?: string;
  focalPoint: string;
  lighting?: string;
  colorDirection?: string;
  emotion?: string;
  suggestedText?: string;
  textOverlay?: string;
  textPlacement?: string;
  fontStyle?: string;
  clickabilityScore?: number;
  previewDescription?: string;
  aiImagePrompt?: string;
  negativePrompt?: string;
  colorPalette?: string[];
}

export interface ThumbnailData {
  concepts: ThumbnailConcept[];
  midjourneyPrompt: string;
  canvaLayoutSuggestion?: string;
  selectedConceptId?: string;
  aiPrompt?: string;
  dallEPrompt?: string;
}

export interface TitleOption {
  id: string;
  title: string;
  style: string;
  curiosityScore?: number;
  searchRelevanceScore?: number;
  clarityScore?: number;
  clickAppealScore?: number;
  charCount?: number;
  badge?: 'best-overall' | 'best-search' | 'best-curiosity' | null;
  estimatedCTR?: string;
}

export interface SeoKeywordsStructured {
  primaryKeyword: string;
  secondaryKeywords: string[];
  longTailKeywords: string[];
}

export interface SeoData {
  selectedTitle?: string;
  titleOptions: TitleOption[];
  description: string;
  tags: string[];
  hashtags: string[];
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  longTailKeywords?: string[];
  keywordsStructured?: SeoKeywordsStructured;
  chapters?: { timecode: string; title: string }[];
  seoKeywords?: { keyword: string; volumeLevel: string; competition: string; intent: string }[];
}

export interface VisualBeat {
  second: string;
  visual: string;
  audioNarration: string;
  onScreenCaption: string;
}

export interface ShortScript {
  id: string;
  shortTitle?: string;
  title: string;
  targetDuration?: string;
  duration?: string;
  hook: string;
  script?: string;
  visualBeats: VisualBeat[];
  characters?: string[];
  sceneSelection?: string[];
  ending?: string;
  callToAction: string;
  CTA?: string;
  shortDescription?: string;
  hashtags?: string[];
  audioSoundtrack?: string;
}

export interface ShortsData {
  scripts: ShortScript[];
  ideas?: {
    id: string;
    title: string;
    hook: string;
    angle: string;
    estimatedViralPotential: string;
    targetDuration: string;
  }[];
}

export type VideoConcept = ConceptData;
export type VideoHook = HookData;
export type VideoScript = ScriptData;
export type YouTubeSEO = SeoData;

export interface YouTubeProject {
  id: string;
  projectId?: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
  idea: string;
  settings: ProjectSettings;
  concept: ConceptData;
  hook: HookData;
  script: ScriptData;
  characters: CharacterProfile[];
  scenes: SceneBreakdown[];
  thumbnail: ThumbnailData;
  youtubeSeo: SeoData;
  shorts: ShortsData;
  videoPrompts?: SceneVideoPrompt[];
}

export type WorkspaceTab =
  | 'overview'
  | 'concept'
  | 'hook'
  | 'script'
  | 'characters'
  | 'scenes'
  | 'prompts'
  | 'thumbnail'
  | 'seo'
  | 'shorts'
  | 'export';
