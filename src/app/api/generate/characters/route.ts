import { NextRequest, NextResponse } from 'next/server';
import { aiProvider } from '@/lib/ai';
import { withUsageProtection } from '@/lib/security/usageProtection';
import { generateCharactersForProject } from '@/lib/storage/projectStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idea, settings, concept, script, story, fullStory, storyText } = body;

    if (!idea || typeof idea !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "idea" field.' },
        { status: 400 }
      );
    }

    const safeSettings = settings || {};
    const activeStoryText =
      storyText ||
      fullStory ||
      (typeof story === 'string' ? story : story?.fullStory || story?.sourceText) ||
      safeSettings.fullStory ||
      safeSettings.storyText ||
      safeSettings.refinedStory ||
      '';

    const mergedSettings = {
      ...safeSettings,
      fullStory: activeStoryText || safeSettings.fullStory,
    };

    const protectionResult = await withUsageProtection(req, 'generate-characters', async () => {
      try {
        const characters = await aiProvider.generateCharacters(
          idea,
          mergedSettings,
          concept,
          script,
          activeStoryText
        );
        return { success: true, characters, source: 'ai' };
      } catch (aiErr: any) {
        console.warn('AI character generation warning, using fallback:', aiErr?.userMessage || aiErr?.message);
        const fallback = generateCharactersForProject(idea, mergedSettings);
        return {
          success: true,
          characters: fallback,
          source: 'fallback',
          warning: aiErr?.userMessage || 'AI service temporarily unavailable',
        };
      }
    });

    if (!protectionResult.success) {
      return protectionResult.response;
    }

    return NextResponse.json(protectionResult.data);
  } catch (error: any) {
    console.error('Error in /api/generate/characters:', error);
    return NextResponse.json(
      { error: 'Failed to process character generation.' },
      { status: 500 }
    );
  }
}
