import { z } from 'zod';
import { generateText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createClient } from '@supabase/supabase-js';
import type { BusinessPlanArtifact } from '@/types/database';

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

export const editPricingSchema = z.object({
  editInstructions: z.string().describe('What changes to make to the pricing (e.g., "add a premium tier at $299", "change starter price to $99", "remove the enterprise tier")'),
});

// ============================================
// TOOL IMPLEMENTATION
// ============================================

export async function editPricing(params: z.infer<typeof editPricingSchema> & { projectId: string; onProgress?: ProgressCallback }) {
  const { editInstructions, projectId, onProgress } = params;

  try {
    console.log('[Edit Pricing] 💰 Starting pricing edit...');
    console.log('[Edit Pricing] Instructions:', editInstructions);

    // Stage 1: Fetching current pricing
    await onProgress?.({ type: 'stage', stage: 'fetch', message: 'Loading your current pricing...' });

    // 1. Fetch current business plan artifact
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: artifact, error: fetchError } = await (supabase
      .from('artifacts') as any)
      .select('*')
      .eq('project_id', projectId)
      .eq('type', 'business_plan')
      .single();

    if (fetchError || !artifact) {
      console.error('[Edit Pricing] No existing business plan found:', fetchError);
      throw new Error('No business plan found to edit. Generate one first.');
    }

    const currentPlan = artifact.data as BusinessPlanArtifact;
    console.log('[Edit Pricing] Current plan has', currentPlan.pricingTiers?.length || 0, 'tiers');

    // Stage 2: Analyzing changes
    await onProgress?.({ type: 'stage', stage: 'analyze', message: 'Analyzing what needs to change...' });

    // 2. Use AI to determine what changes to make
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY!,
    });

    const prompt = `You are editing a business plan's pricing. Current pricing structure:

PRICING TIERS:
${JSON.stringify(currentPlan.pricingTiers, null, 2)}

SERVICE PACKAGES:
${JSON.stringify(currentPlan.servicePackages, null, 2)}

OTHER INFO:
- Executive Summary: ${currentPlan.executiveSummary}
- Revenue Model: ${currentPlan.revenueModel}
- Target Market: ${currentPlan.targetMarket}
- Value Proposition: ${currentPlan.valueProposition}

User Request: ${editInstructions}

Return the UPDATED business plan as JSON. Only change what the user requested.
Keep everything else exactly the same.

{
  "executiveSummary": "...",
  "revenueModel": "...",
  "pricingTiers": [
    { "name": "...", "price": "$X/month", "features": ["...", "..."] }
  ],
  "servicePackages": [
    { "name": "...", "description": "...", "deliverables": ["...", "..."], "price": "$X" }
  ],
  "targetMarket": "...",
  "valueProposition": "..."
}

Important:
- Price format for tiers should be "$X/month" or "$X" for one-time
- Price format for packages should be "$X" (one-time)
- Features and deliverables should be arrays of strings
- Keep the overall structure intact`;

    // Stage 3: Generating updates
    await onProgress?.({ type: 'stage', stage: 'generate', message: 'Generating updated pricing...' });

    const { text } = await generateText({
      model: openrouter('anthropic/claude-3.5-sonnet'),
      prompt,
      temperature: 0.3,
    });

    // 3. Parse the response
    let updatedPlan: BusinessPlanArtifact;
    try {
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
      updatedPlan = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('[Edit Pricing] Failed to parse:', text.slice(0, 500));
      throw new Error('Failed to parse AI response');
    }

    // Stage 4: Saving
    await onProgress?.({ type: 'stage', stage: 'save', message: 'Saving your updates...' });

    // 4. Save updated artifact
    const { data: updatedArtifact, error: saveError } = await (supabase
      .from('artifacts') as any)
      .update({
        data: updatedPlan,
        version: (artifact.version || 1) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('project_id', projectId)
      .eq('type', 'business_plan')
      .select()
      .single();

    if (saveError) {
      console.error('[Edit Pricing] Failed to save:', saveError);
      throw new Error('Failed to save pricing updates');
    }

    console.log('[Edit Pricing] ✅ Pricing updated successfully');

    return {
      success: true,
      artifact: updatedArtifact,
      summary: `💰 Pricing updated: ${editInstructions}`,
    };
  } catch (error) {
    console.error('[Edit Pricing] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
