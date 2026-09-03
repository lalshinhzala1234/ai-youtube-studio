import {
  generateConceptAI,
  generateHookAI,
  generateScriptAI,
  generateCharactersAI,
  generateScenesAI,
  generateSingleSceneAI,
  generateAllVideoPromptsAI,
  generateSingleVideoPromptAI,
  generateThumbnailsAI,
  generateSingleThumbnailAI,
  generateSeoAI,
  generateShortsAI,
  generateSingleShortAI,
} from '@/lib/gemini';
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
import { AIProvider } from './types';
import { sanitizeAIError } from './errors';

export class GeminiProvider implements AIProvider {
  public readonly name = 'Gemini';

  private async executeWithSanitization<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err: unknown) {
      throw sanitizeAIError(err);
    }
  }

  async generateConcept(idea: string, settings: ProjectSettings): Promise<ConceptData> {
    return this.executeWithSanitization(() => generateConceptAI(idea, settings));
  }

  async generateHook(
    idea: string,
    settings: ProjectSettings,
    concept?: ConceptData
  ): Promise<HookData> {
    return this.executeWithSanitization(() => generateHookAI(idea, settings, concept));
  }

  async generateScript(
    idea: string,
    settings: ProjectSettings,
    concept?: ConceptData,
    hook?: HookData
  ): Promise<ScriptData> {
    return this.executeWithSanitization(() => generateScriptAI(idea, settings, concept, hook));
  }

  async generateCharacters(
    idea: string,
    settings: ProjectSettings,
    concept?: ConceptData,
    script?: ScriptData,
    storyText?: string
  ): Promise<CharacterProfile[]> {
    return this.executeWithSanitization(() =>
      generateCharactersAI(idea, settings, concept, script, storyText)
    );
  }

  async generateScenes(
    idea: string,
    settings: ProjectSettings,
    concept?: ConceptData,
    hook?: HookData,
    script?: ScriptData,
    characters?: CharacterProfile[]
  ): Promise<SceneBreakdown[]> {
    return this.executeWithSanitization(() =>
      generateScenesAI(idea, settings, concept, hook, script, characters)
    );
  }

  async generateSingleScene(
    sceneNumber: number,
    idea: string,
    settings: ProjectSettings,
    currentScene: SceneBreakdown,
    allScenes: SceneBreakdown[],
    concept?: ConceptData,
    script?: ScriptData,
    characters?: CharacterProfile[]
  ): Promise<SceneBreakdown> {
    return this.executeWithSanitization(() =>
      generateSingleSceneAI(
        idea,
        settings,
        sceneNumber,
        currentScene,
        allScenes,
        concept,
        script,
        characters
      )
    );
  }

  async generateVideoPrompts(
    idea: string,
    settings: ProjectSettings,
    scenes: SceneBreakdown[],
    characters?: CharacterProfile[],
    concept?: ConceptData,
    hook?: HookData,
    script?: ScriptData
  ): Promise<SceneVideoPrompt[]> {
    return this.executeWithSanitization(() =>
      generateAllVideoPromptsAI(
        idea,
        settings,
        concept,
        hook,
        script,
        characters || [],
        scenes || []
      )
    );
  }

  async generateSingleVideoPrompt(
    sceneNumber: number,
    scene: SceneBreakdown,
    idea: string,
    settings: ProjectSettings,
    characters?: CharacterProfile[],
    allPrompts: SceneVideoPrompt[] = [],
    concept?: ConceptData,
    script?: ScriptData,
    allScenes: SceneBreakdown[] = []
  ): Promise<SceneVideoPrompt> {
    return this.executeWithSanitization(() =>
      generateSingleVideoPromptAI(
        idea,
        settings,
        sceneNumber,
        { sceneNumber, finalPrompt: scene.aiVideoPrompt || '' },
        allPrompts,
        concept,
        script,
        characters || [],
        allScenes.length > 0 ? allScenes : [scene]
      )
    );
  }

  async generateThumbnails(
    idea: string,
    settings: ProjectSettings,
    concept?: ConceptData,
    hook?: HookData,
    script?: ScriptData,
    characters: CharacterProfile[] = [],
    scenes: SceneBreakdown[] = []
  ): Promise<ThumbnailData> {
    return this.executeWithSanitization(() =>
      generateThumbnailsAI(
        idea,
        settings,
        concept,
        hook,
        script,
        characters,
        scenes
      )
    );
  }

  async generateSingleThumbnail(
    index: number,
    idea: string,
    settings: ProjectSettings,
    concept?: ConceptData,
    characters: CharacterProfile[] = [],
    existingConcepts: ThumbnailConcept[] = [],
    scenes: SceneBreakdown[] = []
  ): Promise<ThumbnailConcept> {
    return this.executeWithSanitization(() =>
      generateSingleThumbnailAI(
        idea,
        settings,
        index,
        existingConcepts,
        characters,
        scenes
      )
    );
  }

  async generateSeo(
    idea: string,
    settings: ProjectSettings,
    concept?: ConceptData,
    hook?: HookData,
    script?: ScriptData,
    scenes: SceneBreakdown[] = []
  ): Promise<SeoData> {
    return this.executeWithSanitization(() =>
      generateSeoAI(idea, settings, concept, hook, script, scenes)
    );
  }

  async generateShorts(
    idea: string,
    settings: ProjectSettings,
    concept?: ConceptData,
    script?: ScriptData,
    scenes?: SceneBreakdown[],
    characters?: CharacterProfile[],
    hook?: HookData
  ): Promise<ShortsData> {
    return this.executeWithSanitization(() =>
      generateShortsAI(idea, settings, concept, hook, script, characters || [], scenes || [])
    );
  }

  async generateSingleShort(
    index: number,
    idea: string,
    settings: ProjectSettings,
    concept?: ConceptData,
    script?: ScriptData,
    scenes: SceneBreakdown[] = [],
    existingShorts: ShortScript[] = [],
    characters: CharacterProfile[] = []
  ): Promise<ShortScript> {
    return this.executeWithSanitization(() =>
      generateSingleShortAI(
        idea,
        settings,
        index,
        existingShorts,
        concept,
        script,
        characters,
        scenes
      )
    );
  }
}
