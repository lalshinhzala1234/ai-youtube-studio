import { NextRequest, NextResponse } from 'next/server';
import { aiProvider } from '@/lib/ai';
import { withUsageProtection } from '@/lib/security/usageProtection';
import { SceneBreakdown } from '@/types/project';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      idea,
      settings,
      sceneNumber,
      existingScene,
      allScenes,
      concept,
      script,
      characters,
    } = body;

    if (!idea || !sceneNumber || !existingScene) {
      return NextResponse.json(
        { error: 'Missing idea, sceneNumber, or existingScene in request body.' },
        { status: 400 }
      );
    }

    const protectionResult = await withUsageProtection(
      req,
      `generate-scene-single-${sceneNumber}`,
      async () => {
        const scene = await aiProvider.generateSingleScene(
          Number(sceneNumber),
          idea,
          settings || {},
          existingScene,
          allScenes || [],
          concept,
          script,
          characters
        );
        return { success: true, scene, source: 'ai' };
      }
    );

    if (!protectionResult.success) {
      return protectionResult.response;
    }

    return NextResponse.json(protectionResult.data);
  } catch (error: any) {
    console.error('Error in /api/generate/scene-single:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate scene.' },
      { status: 500 }
    );
  }
}
