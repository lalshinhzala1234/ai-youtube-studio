import { NextRequest, NextResponse } from 'next/server';
import { aiProvider } from '@/lib/ai';
import { withUsageProtection } from '@/lib/security/usageProtection';
import { generateThumbnailForProject } from '@/lib/storage/projectStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idea, settings, conceptIndex, concept, characters } = body;

    if (!idea || typeof idea !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "idea" field.' },
        { status: 400 }
      );
    }

    const idx = typeof conceptIndex === 'number' ? conceptIndex : 0;

    const protectionResult = await withUsageProtection(
      req,
      `generate-thumbnail-single-${idx}`,
      async () => {
        try {
          const generatedConcept = await aiProvider.generateSingleThumbnail(
            idx,
            idea,
            settings || {},
            concept,
            characters || []
          );
          return { success: true, concept: generatedConcept, source: 'ai' };
        } catch (aiErr: any) {
          console.warn('AI single thumbnail regeneration warning, using fallback:', aiErr?.userMessage || aiErr?.message);
          const fallbackList = generateThumbnailForProject(idea, settings || {}, characters || []).concepts;
          const fallback = fallbackList[idx] || fallbackList[0];
          return {
            success: true,
            concept: fallback,
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
    console.error('Error in /api/generate/thumbnail-single:', error);
    return NextResponse.json(
      { error: 'Failed to process single thumbnail regeneration.' },
      { status: 500 }
    );
  }
}
