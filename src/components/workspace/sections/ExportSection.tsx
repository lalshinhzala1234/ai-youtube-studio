'use client';

import React, { useState } from 'react';
import { Download, FileText, Check, Sparkles, Code, FileSpreadsheet, Youtube, Smartphone, Image as ImageIcon } from 'lucide-react';
import { YouTubeProject } from '@/types/project';

interface ExportSectionProps {
  project: YouTubeProject;
}

export const ExportSection: React.FC<ExportSectionProps> = ({ project }) => {
  const [downloadedKey, setDownloadedKey] = useState<string | null>(null);

  const downloadFile = (content: string, filename: string, key: string, mime: string = 'text/plain') => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadedKey(key);
    setTimeout(() => setDownloadedKey(null), 2500);
  };

  const generateMarkdown = () => {
    const titleWorking = project.concept?.titleWorking || project.concept?.title || project.idea || 'Untitled Project';
    const premise = project.concept?.premise || 'N/A';
    const coreAngle = project.concept?.coreAngle || 'N/A';
    const demographic = project.concept?.targetAudience?.demographic || 'General Audience';
    const viewingMotivation = project.concept?.targetAudience?.viewingMotivation || 'Entertainment & Insight';
    const hookOptions = project.hook?.hookOptions || [];
    const scriptSections = project.script?.sections || [];
    const characters = project.characters || [];
    const scenes = project.scenes || [];
    const thumbnailConcepts = project.thumbnail?.concepts || [];
    const titleOptions = project.youtubeSeo?.titleOptions || [];
    const primaryKeyword = project.youtubeSeo?.primaryKeyword || project.youtubeSeo?.keywordsStructured?.primaryKeyword || project.idea || 'Video';
    const secondaryKeywords = project.youtubeSeo?.secondaryKeywords || project.youtubeSeo?.keywordsStructured?.secondaryKeywords || [];
    const longTailKeywords = project.youtubeSeo?.longTailKeywords || project.youtubeSeo?.keywordsStructured?.longTailKeywords || [];
    const description = project.youtubeSeo?.description || '';
    const tags = project.youtubeSeo?.tags || [];
    const hashtags = project.youtubeSeo?.hashtags || [];
    const shortsScripts = project.shorts?.scripts || [];
    const storyText = project.story?.fullStory || project.fullStory || '';
    const storyModeLabel = project.story?.storyMode === 'user_exact' ? 'User Story (Exact)' : project.story?.storyMode === 'user_refined' ? 'User Story (Refined)' : 'AI Created Story';

    return `# AI YouTube Studio Production Master Kit
## Project: ${project.idea || 'Untitled'}
**Generated Date:** ${new Date().toLocaleDateString()}
**Genre:** ${project.settings?.videoType || 'Explainer'} | **Duration:** ${project.settings?.targetDuration || '8-10 mins'}
**Visual Style:** ${project.settings?.visualStyle || 'Cinematic'} | **Tone:** ${project.settings?.tone || 'Engaging'}
**Story Mode:** ${storyModeLabel}

---

### 1. Story & Narrative Foundation
${storyText ? storyText : 'N/A'}

${project.story?.progression ? `\n#### Narrative Progression Acts:\n${project.story.progression.map((p) => `- **${p.act}:** ${p.summary}`).join('\n')}` : ''}

---

### 2. Concept & Premise
- **Title:** ${titleWorking}
- **Premise:** ${premise}
- **Unique Angle:** ${coreAngle}
- **Target Audience:** ${demographic}
- **Viewing Motivation:** ${viewingMotivation}

---

### 3. Retention Hook (0-15s)
${hookOptions.map((h, i) => `#### Option ${i + 1} (${h.type || 'Standard'})
> "${h.text || ''}"
- **Visual Direction:** ${h.visualDirection || 'N/A'}
- **Psychology:** ${h.explanation || 'N/A'}
`).join('\n')}

---

### 3. Timestamped Production Script
${scriptSections.map((s) => `#### ${s.name || 'Section'} [${s.timecode || '00:00'}]
**Visual Direction:** ${s.visualDirection || 'N/A'}
**Narration / Dialogue:**
${s.dialogueOrNarration || 'N/A'}
${s.onScreenText ? `**On-Screen Text:** ${s.onScreenText}` : ''}
${s.soundEffectOrMusicCue ? `**Audio/SFX Cue:** ${s.soundEffectOrMusicCue}` : ''}
`).join('\n')}

---

### 4. Character Consistency Profiles
${characters.map((c) => `#### Character: ${c.name || 'Character'} (${c.role || 'Protagonist'})
- **Appearance:** ${c.visualAppearance || c.appearance || 'Character appearance'}
- **Wardrobe:** ${c.clothingOutfit || c.clothing || 'Standard outfit'}
- **Signature Item / Personality:** ${c.signatureItem || c.personality || 'Distinctive traits'}
- **Locked Consistency Prompt:**
\`\`\`text
${c.visualPromptAnchor || 'Consistent character profile anchor'}
\`\`\`
`).join('\n')}

---

### 5. Scene Breakdown & Video Prompts
${scenes.map((sc) => {
  const promptRef = project.videoPrompts?.find((p) => p.sceneNumber === sc.sceneNumber);
  return `#### Scene ${sc.sceneNumber}: ${sc.title || 'Scene'} (${sc.timeRange || `${sc.durationSeconds || 30}s`})
- **Location & Environment:** ${sc.location || 'Interior/Exterior'}
- **Camera Motion:** ${sc.cameraAngleMotion || 'Cinematic move'}
- **Lighting & Atmosphere:** ${sc.lightingMood || 'Volumetric natural'}
- **Character Consistency (Locked):** ${promptRef?.characterConsistencyDescription || sc.characterLockedPrompt || 'Locked character consistency profile'}
- **Master Video Prompt:**
\`\`\`text
${promptRef?.finalPrompt || sc.aiVideoPrompt || ''}
\`\`\`
${promptRef?.modelPrompts ? `- **Google Veo:** ${promptRef.modelPrompts.veo || ''}\n- **Runway Gen-3:** ${promptRef.modelPrompts.runway || ''}\n- **Kling AI:** ${promptRef.modelPrompts.kling || ''}\n- **Luma Dream Machine:** ${promptRef.modelPrompts.luma || ''}\n- **OpenAI Sora:** ${promptRef.modelPrompts.sora || ''}\n` : ''}`;
}).join('\n')}

---

### 6. High-CTR Thumbnail Studio
${thumbnailConcepts.map((c, i) => `#### Concept #${i + 1}: ${c.conceptTitle || c.title || `Concept ${i + 1}`} (CTR Score: ${c.clickabilityScore || 94}/100)
- **Visual Hook:** ${c.visualConcept || c.previewDescription || 'High CTR visual setup'}
- **Subject:** ${c.mainSubject || 'Main Character'} (${c.characterExpression || c.facialExpression || 'Engaged'})
- **Text Overlay:** "${c.suggestedText || c.textOverlay || ''}" (Position: ${c.textPlacement || 'Top-Left'})
- **Lighting & Color:** ${c.lighting || 'Cinematic rim light'} | ${c.colorDirection || 'Complementary high contrast'}
- **AI Image Prompt:**
\`\`\`text
${c.aiImagePrompt || ''}
\`\`\`
- **Negative Prompt:** ${c.negativePrompt || 'blurry, distorted, artifacts'}
`).join('\n')}

---

### 7. YouTube SEO, Discovery & Metadata
- **Selected Main Title:** ${project.youtubeSeo?.selectedTitle || titleOptions[0]?.title || project.idea || 'Untitled'}

#### 10 Evaluated Title Variations:
${titleOptions.map((t, idx) => `${idx + 1}. [${t.badge || t.style || 'Optimized'}] ${t.title} (Est. CTR: ${t.estimatedCTR || '12%'}, Length: ${t.charCount || t.title.length} chars)`).join('\n')}

#### Structured Keywords:
- **Primary:** ${primaryKeyword}
- **Secondary:** ${secondaryKeywords.join(', ')}
- **Long-Tail Queries:**
${longTailKeywords.map((lt) => `  - ${lt}`).join('\n')}

#### Optimized YouTube Description & Chapters:
\`\`\`text
${description}
\`\`\`

#### Studio Tags:
\`\`\`text
${tags.join(', ')}
\`\`\`

#### Hashtags:
\`\`\`text
${hashtags.join(' ')}
\`\`\`

---

### 8. YouTube Shorts & 9:16 Vertical Cuts
${shortsScripts.map((s, idx) => `#### Short #${idx + 1}: ${s.shortTitle || s.title || `Short ${idx + 1}`} (${s.duration || s.targetDuration || '45s'})
- **0-3s Swipe-Stop Hook:** "${s.hook || ''}"
- **Full Spoken Narration Script:**
${s.script || s.hook || ''}

- **Visual & Caption Beats:**
${(s.visualBeats || []).map((b) => `  - [${b.second || '00'}] ${b.visual || ''} | Voice: "${b.audioNarration || ''}" | Caption: ${b.onScreenCaption || ''}`).join('\n')}

- **Soundtrack:** ${s.audioSoundtrack || 'Fast upbeat background track'}
- **CTA:** ${s.callToAction || s.CTA || 'Subscribe!'}
- **Caption & Tags:** ${s.shortDescription || ''} ${(s.hashtags || []).join(' ')}
`).join('\n')}
`;
  };

  const generatePromptsCSV = () => {
    let csv = 'SceneNumber,SceneTitle,DurationSeconds,CameraMotion,Lighting,AIVideoPrompt\n';
    (project.scenes || []).forEach((sc) => {
      csv += `"${sc.sceneNumber}","${(sc.title || '').replace(/"/g, '""')}","${sc.durationSeconds || 30}","${(sc.cameraAngleMotion || '').replace(/"/g, '""')}","${(sc.lightingMood || '').replace(/"/g, '""')}","${(sc.aiVideoPrompt || '').replace(/"/g, '""')}"\n`;
    });
    return csv;
  };

  const generateUploadKitTXT = () => {
    const titleOptions = project.youtubeSeo?.titleOptions || [];
    const primaryKeyword = project.youtubeSeo?.primaryKeyword || project.youtubeSeo?.keywordsStructured?.primaryKeyword || project.idea || 'Video';
    const description = project.youtubeSeo?.description || '';
    const tags = project.youtubeSeo?.tags || [];
    const hashtags = project.youtubeSeo?.hashtags || [];

    return `=== YOUTUBE STUDIO UPLOAD KIT ===
PROJECT: ${project.idea || 'Untitled'}

MAIN TITLE:
${project.youtubeSeo?.selectedTitle || titleOptions[0]?.title || project.idea || 'Untitled'}

TOP TITLE OPTIONS:
${titleOptions.map((t, idx) => `${idx + 1}. [${t.badge || t.style || 'Optimized'}] ${t.title}`).join('\n')}

PRIMARY KEYWORD:
${primaryKeyword}

DESCRIPTION & CHAPTERS:
${description}

STUDIO TAGS:
${tags.join(', ')}

HASHTAGS:
${hashtags.join(' ')}
`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d] space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
          <Download className="w-4 h-4" />
          Section 10: Export Center & Deliverables
        </div>
        <h2 className="text-xl font-bold text-white">Download Production Assets</h2>
        <p className="text-xs text-gray-400">
          Export full production kits formatted for editors, Runway/Luma pipelines, voiceover artists, and YouTube Studio.
        </p>
      </div>

      {/* Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Markdown */}
        <div className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d] flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Master Markdown Kit</h3>
            <p className="text-xs text-gray-400">
              Complete formatted documentation containing all 10 modules including Thumbnails, SEO, and Shorts.
            </p>
          </div>
          <button
            onClick={() => downloadFile(generateMarkdown(), `${project.idea.replace(/[^a-zA-Z0-9]/g, '_')}_Master_Kit.md`, 'md')}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
          >
            {downloadedKey === 'md' ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            <span>{downloadedKey === 'md' ? 'Downloaded!' : 'Export .MD Kit'}</span>
          </button>
        </div>

        {/* Prompts CSV */}
        <div className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d] flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">AI Video Prompts CSV</h3>
            <p className="text-xs text-gray-400">
              Spreadsheet of all scene video prompts, camera moves, and lighting cues for batch rendering.
            </p>
          </div>
          <button
            onClick={() => downloadFile(generatePromptsCSV(), `${project.idea.replace(/[^a-zA-Z0-9]/g, '_')}_Prompts.csv`, 'csv', 'text/csv')}
            className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
          >
            {downloadedKey === 'csv' ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            <span>{downloadedKey === 'csv' ? 'Downloaded!' : 'Export .CSV Prompts'}</span>
          </button>
        </div>

        {/* YouTube Upload Kit */}
        <div className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d] flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
              <Youtube className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">YouTube Upload Kit</h3>
            <p className="text-xs text-gray-400">
              Clean text file with selected title, 10 evaluated titles, keywords, timestamps, tags, and description.
            </p>
          </div>
          <button
            onClick={() => downloadFile(generateUploadKitTXT(), `${project.idea.replace(/[^a-zA-Z0-9]/g, '_')}_Upload_Kit.txt`, 'txt')}
            className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
          >
            {downloadedKey === 'txt' ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            <span>{downloadedKey === 'txt' ? 'Downloaded!' : 'Export .TXT Kit'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
