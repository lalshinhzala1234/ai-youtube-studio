import { NextRequest, NextResponse } from 'next/server';
import { aiProvider } from '@/lib/ai';
import { withUsageProtection } from '@/lib/security/usageProtection';
import { generateSeoForProject } from '@/lib/storage/projectStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idea, settings, concept, hook, script, scenes } = body;

    if (!idea || typeof idea !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "idea" field.' },
        { status: 400 }
      );
    }

    const protectionResult = await withUsageProtection(req, 'generate-seo', async () => {
      try {
        const seoData = await aiProvider.generateSeo(
          idea,
          settings || {},
          concept,
          hook,
          script,
          scenes || []
        );
        return { success: true, seo: seoData, source: 'ai' };
      } catch (aiErr: any) {
        console.warn('AI SEO generation warning, using fallback:', aiErr?.userMessage || aiErr?.message);
        const fallback = generateSeoForProject(
          idea,
          settings || {},
          scenes || []
        );
        return {
          success: true,
          seo: fallback,
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
    console.error('Error in /api/generate/seo:', error);
    return NextResponse.json(
      { error: 'Failed to process YouTube SEO generation.' },
      { status: 500 }
    );
  }
}
