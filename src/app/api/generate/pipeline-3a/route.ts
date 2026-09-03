import { NextRequest, NextResponse } from 'next/server';
import { aiProvider } from '@/lib/ai';
import { withUsageProtection } from '@/lib/security/usageProtection';
import {
  generateStoryForProject,
  generateConceptForProject,
  generateHookForProject,
  generateScriptForProject,
} from '@/lib/storage/projectStore';
import { StoryData, ConceptData, HookData, ScriptData } from '@/types/project';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idea, settings } = body;

    if (!idea || typeof idea !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "idea" field.' },
        { status: 400 }
      );
    }

    const safeSettings = settings || {};

    const protectionResult = await withUsageProtection(req, 'generate-pipeline-3a', async () => {
      // 1. Generate Story
      let story: StoryData;
      let storySource = 'story-engine';
      try {
        if (aiProvider.generateStory) {
          story = await aiProvider.generateStory(idea, safeSettings, safeSettings.storyText || safeSettings.fullStory);
          storySource = 'ai';
        } else {
          story = generateStoryForProject(idea, safeSettings, safeSettings.storyText || safeSettings.fullStory);
        }
      } catch (err: any) {
        console.warn('Story AI generation failed:', err?.userMessage || err?.message);
        // For a new AI-created story, never replace a failed generation with
        // generic/template text. That generic fallback was the source of
        // downstream stale-looking assets. User-supplied stories remain local.
        if (safeSettings.storySource === 'user_story' || safeSettings.storyText || safeSettings.fullStory) {
          story = generateStoryForProject(idea, safeSettings, safeSettings.storyText || safeSettings.fullStory);
          storySource = 'user_story';
        } else {
          throw new Error(err?.userMessage || err?.message || 'AI story generation failed.');
        }
      }

      // Propagate effective story into safeSettings so concept, hook, and script inherit it
      const enrichedSettings = {
        ...safeSettings,
        fullStory: story.fullStory,
        storyText: story.sourceText || safeSettings.storyText,
        refinedStory: story.refinedStory,
      };

      // 2. Generate Concept
      let concept: ConceptData;
      let conceptSource = 'ai';
      try {
        concept = await aiProvider.generateConcept(idea, enrichedSettings);
      } catch (err: any) {
        console.warn('Concept AI fallback:', err?.userMessage || err?.message);
        concept = generateConceptForProject(idea, enrichedSettings);
        conceptSource = 'fallback';
      }

      // 3. Generate Hook based on Concept
      let hook: HookData;
      let hookSource = 'ai';
      try {
        hook = await aiProvider.generateHook(idea, enrichedSettings, concept);
      } catch (err: any) {
        console.warn('Hook AI fallback:', err?.userMessage || err?.message);
        hook = generateHookForProject(idea, enrichedSettings);
        hookSource = 'fallback';
      }

      // 4. Generate Script based on Concept and Hook
      let script: ScriptData;
      let scriptSource = 'ai';
      try {
        script = await aiProvider.generateScript(idea, enrichedSettings, concept, hook);
      } catch (err: any) {
        console.warn('Script AI fallback:', err?.userMessage || err?.message);
        script = generateScriptForProject(idea, enrichedSettings);
        scriptSource = 'fallback';
      }

      return {
        success: true,
        story,
        concept,
        hook,
        script,
        sources: {
          story: storySource,
          concept: conceptSource,
          hook: hookSource,
          script: scriptSource,
        },
      };
    });

    if (!protectionResult.success) {
      return protectionResult.response;
    }

    return NextResponse.json(protectionResult.data);
  } catch (error: any) {
    console.error('Error in /api/generate/pipeline-3a:', error);
    return NextResponse.json(
      { error: 'Pipeline generation failed.' },
      { status: 500 }
    );
  }
}
