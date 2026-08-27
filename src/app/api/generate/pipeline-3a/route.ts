import { NextRequest, NextResponse } from 'next/server';
import { aiProvider } from '@/lib/ai';
import { withUsageProtection } from '@/lib/security/usageProtection';
import {
  generateConceptForProject,
  generateHookForProject,
  generateScriptForProject,
} from '@/lib/storage/projectStore';
import { ConceptData, HookData, ScriptData } from '@/types/project';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idea, settings } = body;

    if (!idea || typeof idea !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "idea" field.' },
        { status: 400 }
      );
    }

    const safeSettings = settings || {};

    const protectionResult = await withUsageProtection(req, 'generate-pipeline-3a', async () => {
      // 1. Generate Concept
      let concept: ConceptData;
      let conceptSource = 'ai';
      try {
        concept = await aiProvider.generateConcept(idea, safeSettings);
      } catch (err: any) {
        console.warn('Concept AI fallback:', err?.userMessage || err?.message);
        concept = generateConceptForProject(idea, safeSettings);
        conceptSource = 'fallback';
      }

      // 2. Generate Hook based on Concept
      let hook: HookData;
      let hookSource = 'ai';
      try {
        hook = await aiProvider.generateHook(idea, safeSettings, concept);
      } catch (err: any) {
        console.warn('Hook AI fallback:', err?.userMessage || err?.message);
        hook = generateHookForProject(idea, safeSettings);
        hookSource = 'fallback';
      }

      // 3. Generate Script based on Concept and Hook
      let script: ScriptData;
      let scriptSource = 'ai';
      try {
        script = await aiProvider.generateScript(idea, safeSettings, concept, hook);
      } catch (err: any) {
        console.warn('Script AI fallback:', err?.userMessage || err?.message);
        script = generateScriptForProject(idea, safeSettings);
        scriptSource = 'fallback';
      }

      return {
        success: true,
        concept,
        hook,
        script,
        sources: {
          concept: conceptSource,
          hook: hookSource,
          script: scriptSource,
        },
      };
    });

    if (!protectionResult.success) {
      return protectionResult.response;
    }

    return NextResponse.json(protectionResult.data);
  } catch (error: any) {
    console.error('Error in /api/generate/pipeline-3a:', error);
    return NextResponse.json(
      { error: 'Pipeline generation failed.' },
      { status: 500 }
    );
  }
}
