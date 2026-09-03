import { NextRequest, NextResponse } from 'next/server';
import { aiProvider } from '@/lib/ai';
import { withUsageProtection } from '@/lib/security/usageProtection';
import { generateShortsForProject } from '@/lib/storage/projectStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idea, settings, shortIndex, concept, script, scenes } = body;

    if (!idea || typeof idea !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "idea" field.' },
        { status: 400 }
      );
    }

    const idx = typeof shortIndex === 'number' ? shortIndex : 0;

    const protectionResult = await withUsageProtection(
      req,
      `generate-short-single-${idx}`,
      async () => {
        try {
          const generatedShort = await aiProvider.generateSingleShort(
            idx,
            idea,
            settings || {},
            concept,
            script,
            scenes || []
          );
          return { success: true, script: generatedShort, source: 'ai' };
        } catch (aiErr: any) {
          console.warn('AI single short regeneration warning, using fallback:', aiErr?.userMessage || aiErr?.message);
          const fallbackList = generateShortsForProject(idea, settings || {}, [], scenes || []).scripts;
          const fallback = fallbackList[idx] || fallbackList[0];
          return {
            success: true,
            script: fallback,
            source: 'fallback',
            warning: aiErr?.userMessage || 'AI service temporarily unavailable',
          };
        }
      }
    );

    if (!protectionResult.success) {
      return protectionResult.response;
    }

    return NextResponse.json(protectionResult.data);
  } catch (error: any) {
    console.error('Error in /api/generate/short-single:', error);
    return NextResponse.json(
      { error: 'Failed to process single Short regeneration.' },
      { status: 500 }
    );
  }
}
