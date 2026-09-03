import { NextRequest, NextResponse } from 'next/server';
import { aiProvider } from '@/lib/ai';
import { withUsageProtection } from '@/lib/security/usageProtection';
import { generateSceneBreakdownsForProject } from '@/lib/storage/projectStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idea, settings, concept, hook, script, characters } = body;

    if (!idea || typeof idea !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "idea" field.' },
        { status: 400 }
      );
    }

    const protectionResult = await withUsageProtection(req, 'generate-scenes', async () => {
      try {
        const scenes = await aiProvider.generateScenes(
          idea,
          settings || {},
          concept,
          hook,
          script,
          characters
        );
        return { success: true, scenes, source: 'ai' };
      } catch (aiErr: any) {
        console.warn('AI scene breakdown generation warning, using fallback:', aiErr?.userMessage || aiErr?.message);
        const fallback = generateSceneBreakdownsForProject(idea, settings || {}, characters);
        return {
          success: true,
          scenes: fallback,
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
    console.error('Error in /api/generate/scenes:', error);
    return NextResponse.json(
      { error: 'Failed to process scene breakdown generation.' },
      { status: 500 }
    );
  }
}
