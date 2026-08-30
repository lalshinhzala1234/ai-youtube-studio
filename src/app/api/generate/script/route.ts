import { NextRequest, NextResponse } from 'next/server';
import { aiProvider } from '@/lib/ai';
import { withUsageProtection } from '@/lib/security/usageProtection';
import { generateScriptForProject } from '@/lib/storage/projectStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idea, settings, concept, hook } = body;

    if (!idea || typeof idea !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "idea" field.' },
        { status: 400 }
      );
    }

    const protectionResult = await withUsageProtection(req, 'generate-script', async () => {
      try {
        const script = await aiProvider.generateScript(idea, settings || {}, concept, hook);
        return { success: true, script, source: 'ai' };
      } catch (aiErr: any) {
        console.warn('AI script generation warning, using fallback:', aiErr?.userMessage || aiErr?.message);
        const fallback = generateScriptForProject(idea, settings || {});
        return {
          success: true,
          script: fallback,
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
    console.error('Error in /api/generate/script:', error);
    return NextResponse.json(
      { error: 'Failed to process request.' },
      { status: 500 }
    );
  }
}
