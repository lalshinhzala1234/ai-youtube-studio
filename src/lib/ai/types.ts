import {
  ProjectSettings,
  ConceptData,
  HookData,
  ScriptData,
  CharacterProfile,
  SceneBreakdown,
  SceneVideoPrompt,
  ThumbnailData,
  ThumbnailConcept,
  SeoData,
  ShortsData,
  ShortScript,
} from '@/types/project';

export type AIErrorCode =
  | 'MISSING_API_KEY'
  | 'INVALID_API_KEY'
  | 'RATE_LIMITED'
  | 'QUOTA_EXCEEDED'
  | 'TIMEOUT'
  | 'MALFORMED_RESPONSE'
  | 'PROVIDER_UNAVAILABLE'
  | 'DUPLICATE_REQUEST'
  | 'INTERNAL_ERROR';

export interface AIProvider {
  readonly name: string;
  generateConcept(idea: string, settings: ProjectSettings): Promise<ConceptData>;
  generateHook(idea: string, settings: ProjectSettings, concept?: ConceptData): Promise<HookData>;
  generateScript(
    idea: string,
    settings: ProjectSettings,
    concept?: ConceptData,
    hook?: HookData
  ): Promise<ScriptData>;
  generateCharacters(
    idea: string,
    settings: ProjectSettings,
    concept?: ConceptData,
    script?: ScriptData
  ): Promise<CharacterProfile[]>;
  generateScenes(
    idea: string,
    settings: ProjectSettings,
    concept?: ConceptData,
    hook?: HookData,
    script?: ScriptData,
    characters?: CharacterProfile[]
  ): Promise<SceneBreakdown[]>;
  generateSingleScene(
    sceneNumber: number,
    idea: string,
    settings: ProjectSettings,
    currentScene: SceneBreakdown,
    allScenes: SceneBreakdown[],
    concept?: ConceptData,
    script?: ScriptData,
    characters?: CharacterProfile[]
  ): Promise<SceneBreakdown>;
  generateVideoPrompts(
    idea: string,
    settings: ProjectSettings,
    scenes: SceneBreakdown[],
    characters?: CharacterProfile[],
    concept?: ConceptData,
    hook?: HookData,
    script?: ScriptData
  ): Promise<SceneVideoPrompt[]>;
  generateSingleVideoPrompt(
    sceneNumber: number,
    scene: SceneBreakdown,
    idea: string,
    settings: ProjectSettings,
    characters?: CharacterProfile[],
    allPrompts?: SceneVideoPrompt[],
    concept?: ConceptData,
    script?: ScriptData,
    allScenes?: SceneBreakdown[]
  ): Promise<SceneVideoPrompt>;
  generateThumbnails(
    idea: string,
    settings: ProjectSettings,
    concept?: ConceptData,
    hook?: HookData,
    script?: ScriptData,
    characters?: CharacterProfile[],
    scenes?: SceneBreakdown[]
  ): Promise<ThumbnailData>;
  generateSingleThumbnail(
    index: number,
    idea: string,
    settings: ProjectSettings,
    concept?: ConceptData,
    characters?: CharacterProfile[],
    existingConcepts?: ThumbnailConcept[],
    scenes?: SceneBreakdown[]
  ): Promise<ThumbnailConcept>;
  generateSeo(
    idea: string,
    settings: ProjectSettings,
    concept?: ConceptData,
    hook?: HookData,
    script?: ScriptData,
    scenes?: SceneBreakdown[]
  ): Promise<SeoData>;
  generateShorts(
    idea: string,
    settings: ProjectSettings,
    concept?: ConceptData,
    script?: ScriptData,
    scenes?: SceneBreakdown[],
    characters?: CharacterProfile[],
    hook?: HookData
  ): Promise<ShortsData>;
  generateSingleShort(
    index: number,
    idea: string,
    settings: ProjectSettings,
    concept?: ConceptData,
    script?: ScriptData,
    scenes?: SceneBreakdown[],
    existingShorts?: ShortScript[],
    characters?: CharacterProfile[]
  ): Promise<ShortScript>;
}
