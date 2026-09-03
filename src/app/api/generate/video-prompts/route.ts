import { NextRequest, NextResponse } from 'next/server';
import { aiProvider } from '@/lib/ai';
import { withUsageProtection } from '@/lib/security/usageProtection';
import { generateVideoPromptsForProject } from '@/lib/storage/projectStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idea, settings, concept, hook, script, characters, scenes, props, environments, fullStory } = body;

    if (!idea || typeof idea !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "idea" field.' },
        { status: 400 }
      );
    }

    const protectionResult = await withUsageProtection(req, 'generate-video-prompts', async () => {
      try {
        const prompts = await aiProvider.generateVideoPrompts(
          idea,
          settings || {},
          scenes || [],
          characters || [],
          concept,
          hook,
          script
        );
        return { success: true, prompts, source: 'ai' };
      } catch (aiErr: any) {
        console.warn('AI video prompt generation warning, using fallback:', aiErr?.userMessage || aiErr?.message);
        const fallback = generateVideoPromptsForProject(
          idea,
          settings || {},
          scenes || [],
          characters || [],
          props || [],
          environments || [],
          fullStory || settings?.fullStory || settings?.storyText
        );
        return {
          success: true,
          prompts: fallback,
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
    console.error('Error in /api/generate/video-prompts:', error);
    return NextResponse.json(
      { error: 'Failed to process video prompt generation.' },
      { status: 500 }
    );
  }
}
