import { NextRequest, NextResponse } from 'next/server';
import { aiProvider } from '@/lib/ai';
import { withUsageProtection } from '@/lib/security/usageProtection';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      idea,
      settings,
      sceneNumber,
      existingPrompt,
      characters,
      scenes,
    } = body;

    if (!idea || !sceneNumber) {
      return NextResponse.json(
        { error: 'Missing idea or sceneNumber in request body.' },
        { status: 400 }
      );
    }

    const sceneNum = Number(sceneNumber);
    const matchedScene = (scenes || []).find((s: any) => s.sceneNumber === sceneNum) || {
      sceneNumber: sceneNum,
      title: `Scene ${sceneNum}`,
      durationSeconds: 30,
      visualDescription: existingPrompt || 'Scene action',
      cameraAngleMotion: 'Medium cinematic shot',
      lightingMood: 'Cinematic lighting',
      location: 'Interior/Exterior',
      audioEffects: '',
      aiVideoPrompt: existingPrompt || '',
    };

    const protectionResult = await withUsageProtection(
      req,
      `generate-prompt-single-${sceneNumber}`,
      async () => {
        const prompt = await aiProvider.generateSingleVideoPrompt(
          sceneNum,
          matchedScene,
          idea,
          settings || {},
          characters || []
        );
        return { success: true, prompt, source: 'ai' };
      }
    );

    if (!protectionResult.success) {
      return protectionResult.response;
    }

    return NextResponse.json(protectionResult.data);
  } catch (error: any) {
    console.error('Error in /api/generate/video-prompt-single:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate single video prompt.' },
      { status: 500 }
    );
  }
}
