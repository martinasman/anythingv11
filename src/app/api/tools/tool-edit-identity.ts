import { z } from 'zod';
import { generateText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createClient } from '@supabase/supabase-js';
import type { IdentityArtifact } from '@/types/database';

// ============================================
// TYPES
// ============================================

export interface ProgressUpdate {
  type: 'stage' | 'change';
  stage?: string;
  message?: string;
}

type ProgressCallback = (update: ProgressUpdate) => Promise<void>;

// ============================================
// SCHEMA DEFINITION
// ============================================

export const editIdentitySchema = z.object({
  editInstructions: z.string().describe('What changes to make to the brand identity (e.g., "rename to TechFlow", "change primary color to #FF5500", "update tagline")'),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

async function regenerateLogo(
  businessName: string,
  colors: { primary: string; secondary: string; accent: string }
): Promise<string> {
  try {
    console.log('[Edit Identity] Regenerating logo...');

    const logoPrompt = `Create a professional, unique logo design for "${businessName}".
Brand Colors: Primary ${colors.primary}, Secondary ${colors.secondary}, Accent ${colors.accent}

Design Requirements:
- Create an ACTUAL DESIGNED LOGO with meaningful shapes/symbols
- Use the brand colors creatively
- Modern, professional, memorable design
- Simple enough to be recognizable at small sizes
- NO text/typography in the logo

Create a clean, professional logo with the specified colors on a transparent or white background.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'AnythingV10',
      },
      body: JSON.stringify({
        model: 'nexa-ai/nanobanana-pro',
        messages: [{ role: 'user', content: logoPrompt }],
        modalities: ['image', 'text'],
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();
    const message = result.choices?.[0]?.message;

    let imageData: string | null = null;

    // Check for images in response
    if (message?.images && Array.isArray(message.images) && message.images.length > 0) {
      const firstImage = message.images[0];
      if (typeof firstImage === 'string') {
        if (firstImage.startsWith('data:')) {
          imageData = firstImage;
        } else {
          let mimeType = 'image/png';
          if (firstImage.startsWith('/9j/')) mimeType = 'image/jpeg';
          else if (firstImage.startsWith('UklGR')) mimeType = 'image/webp';
          imageData = `data:${mimeType};base64,${firstImage}`;
        }
      }
    }

    if (!imageData) {
      throw new Error('No image in response');
    }

    console.log('[Edit Identity] ✅ Logo regenerated');
    return imageData;
  } catch (error) {
    console.error('[Edit Identity] Logo generation failed:', error);
    // Return fallback SVG logo
    const initial = businessName.charAt(0).toUpperCase();
    const svg = `<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="400" fill="${colors.primary}"/>
      <text x="200" y="250" font-family="Arial, sans-serif" font-size="180" font-weight="bold" fill="white" text-anchor="middle">${initial}</text>
    </svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }
}

// ============================================
// TOOL IMPLEMENTATION
// ============================================

export async function editBrandIdentity(params: z.infer<typeof editIdentitySchema> & { projectId: string; onProgress?: ProgressCallback }) {
  const { editInstructions, projectId, onProgress } = params;

  try {
    console.log('[Edit Identity] 🎨 Starting identity edit...');
    console.log('[Edit Identity] Instructions:', editInstructions);

    // Stage 1: Fetching current identity
    await onProgress?.({ type: 'stage', stage: 'fetch', message: 'Loading your current brand...' });

    // 1. Fetch current identity artifact
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: artifact, error: fetchError } = await (supabase
      .from('artifacts') as any)
      .select('*')
      .eq('project_id', projectId)
      .eq('type', 'identity')
      .single();

    if (fetchError || !artifact) {
      console.error('[Edit Identity] No existing identity found:', fetchError);
      throw new Error('No brand identity found to edit. Generate one first.');
    }

    const currentIdentity = artifact.data as IdentityArtifact;
    console.log('[Edit Identity] Current identity:', currentIdentity.name);

    // Stage 2: Analyzing changes
    await onProgress?.({ type: 'stage', stage: 'analyze', message: 'Analyzing what needs to change...' });

    // 2. Use AI to determine what changes to make
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY!,
    });

    const prompt = `You are editing a brand identity. Current identity:

Name: ${currentIdentity.name}
Tagline: ${currentIdentity.tagline}
Colors:
- Primary: ${currentIdentity.colors.primary}
- Secondary: ${currentIdentity.colors.secondary}
- Accent: ${currentIdentity.colors.accent}
Font: ${currentIdentity.font}

User Request: ${editInstructions}

Return the UPDATED identity as JSON. Only change what the user requested.
Keep everything else exactly the same.

{
  "name": "...",
  "tagline": "...",
  "colors": {
    "primary": "#...",
    "secondary": "#...",
    "accent": "#..."
  },
  "font": "...",
  "needsNewLogo": true/false
}

Set "needsNewLogo" to true ONLY if:
- The name changed
- The colors changed significantly
- User explicitly asked for a new logo`;

    // Stage 3: Generating updates
    await onProgress?.({ type: 'stage', stage: 'generate', message: 'Generating updated brand...' });

    const { text } = await generateText({
      model: openrouter('anthropic/claude-3.5-sonnet'),
      prompt,
      temperature: 0.3,
    });

    // 3. Parse the response
    let updates: {
      name: string;
      tagline: string;
      colors: { primary: string; secondary: string; accent: string };
      font: string;
      needsNewLogo: boolean;
    };

    try {
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
      updates = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('[Edit Identity] Failed to parse:', text.slice(0, 500));
      throw new Error('Failed to parse AI response');
    }

    // 4. Regenerate logo if needed
    let logoUrl = currentIdentity.logoUrl;
    if (updates.needsNewLogo) {
      // Stage 4: Regenerating logo
      await onProgress?.({ type: 'stage', stage: 'logo', message: 'Regenerating logo...' });
      console.log('[Edit Identity] Regenerating logo due to changes...');
      logoUrl = await regenerateLogo(updates.name, updates.colors);
    }

    // 5. Build updated identity
    const updatedIdentity: IdentityArtifact = {
      name: updates.name,
      tagline: updates.tagline,
      colors: updates.colors,
      font: updates.font,
      logoUrl,
    };

    // Stage 5: Saving
    await onProgress?.({ type: 'stage', stage: 'save', message: 'Saving your updates...' });

    // 6. Save to database
    const { data: updatedArtifact, error: saveError } = await (supabase
      .from('artifacts') as any)
      .update({
        data: updatedIdentity,
        version: (artifact.version || 1) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('project_id', projectId)
      .eq('type', 'identity')
      .select()
      .single();

    if (saveError) {
      console.error('[Edit Identity] Failed to save:', saveError);
      throw new Error('Failed to save identity updates');
    }

    console.log('[Edit Identity] ✅ Identity updated successfully');

    return {
      success: true,
      artifact: updatedArtifact,
      identity: updatedIdentity, // Return for other tools to use
      summary: `🎨 Brand updated: ${editInstructions}`,
    };
  } catch (error) {
    console.error('[Edit Identity] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
