import { NextRequest, NextResponse } from 'next/server';
import { aiProvider } from '@/lib/ai';
import { withUsageProtection } from '@/lib/security/usageProtection';
import { generateThumbnailForProject } from '@/lib/storage/projectStore';

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

    const protectionResult = await withUsageProtection(req, 'generate-thumbnails', async () => {
      try {
        const thumbnailData = await aiProvider.generateThumbnails(
          idea,
          settings || {},
          concept,
          hook,
          script,
          characters || [],
          scenes || []
        );
        return { success: true, thumbnail: thumbnailData, source: 'ai' };
      } catch (aiErr: any) {
        console.warn('AI thumbnail generation warning, using fallback:', aiErr?.userMessage || aiErr?.message);
        const fallback = generateThumbnailForProject(
          idea,
          settings || {},
          characters || []
        );
        return {
          success: true,
          thumbnail: fallback,
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
    console.error('Error in /api/generate/thumbnails:', error);
    return NextResponse.json(
      { error: 'Failed to process thumbnail generation.' },
      { status: 500 }
    );
  }
}
