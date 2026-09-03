import { NextRequest, NextResponse } from 'next/server';
import { aiProvider } from '@/lib/ai';
import { withUsageProtection } from '@/lib/security/usageProtection';
import { generateShortsForProject } from '@/lib/storage/projectStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idea, settings, concept, hook, script, characters, scenes } = body;

    if (!idea || typeof idea !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "idea" field.' },
        { status: 400 }
      );
    }

    const protectionResult = await withUsageProtection(req, 'generate-shorts', async () => {
      try {
        const shortsData = await aiProvider.generateShorts(
          idea,
          settings || {},
          concept,
          script,
          scenes || [],
          characters || [],
          hook
        );
        return { success: true, shorts: shortsData, source: 'ai' };
      } catch (aiErr: any) {
        console.warn('AI shorts generation warning, using fallback:', aiErr?.userMessage || aiErr?.message);
        const fallback = generateShortsForProject(
          idea,
          settings || {},
          [],
          scenes || []
        );
        return {
          success: true,
          shorts: fallback,
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
    console.error('Error in /api/generate/shorts:', error);
    return NextResponse.json(
      { error: 'Failed to process Shorts generation.' },
      { status: 500 }
    );
  }
}
