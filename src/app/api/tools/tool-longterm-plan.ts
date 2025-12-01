/**
 * Long-Term Plan Tool
 *
 * Generates a comprehensive 6-12 month business growth plan.
 * Includes monthly milestones, scaling strategy, team building timeline,
 * and year-one revenue projections.
 */

import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import type { LongTermPlanArtifact, BusinessPlanArtifact, ResearchArtifact } from '@/types/database';

// ============================================
// SCHEMA DEFINITION
// ============================================

export const longTermPlanSchema = z.object({
  businessType: z.string().describe('Type of business (e.g., "website design agency", "SMMA")'),
  currentMonthlyRevenue: z.number().optional().describe('Current monthly revenue if any'),
  targetMonthlyRevenue: z.number().optional().describe('Target monthly revenue by month 12'),
  currentTeamSize: z.number().optional().describe('Current team size (including founder)'),
  targetTeamSize: z.number().optional().describe('Target team size by month 12'),
  growthStyle: z
    .enum(['aggressive', 'moderate', 'conservative'])
    .optional()
    .describe('How aggressively to grow'),
  focusAreas: z
    .array(z.string())
    .optional()
    .describe('Specific areas to focus on (e.g., "client acquisition", "systems", "team")'),
});

// ============================================
// OPENROUTER AI INTEGRATION
// ============================================

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

interface AIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface BusinessContext {
  businessType: string;
  pricingTiers: Array<{ name: string; price: string }>;
  servicePackages: Array<{ name: string; price: string }>;
  averageClientValue: number;
  marketInsights?: string;
}

async function generateAILongTermPlan(
  context: BusinessContext,
  params: z.infer<typeof longTermPlanSchema>
): Promise<LongTermPlanArtifact | null> {
  if (!OPENROUTER_API_KEY) {
    console.warn('[LongTermPlan] No OpenRouter API key, using fallback');
    return null;
  }

  const {
    currentMonthlyRevenue = 0,
    targetMonthlyRevenue,
    currentTeamSize = 1,
    targetTeamSize,
    growthStyle = 'moderate',
    focusAreas = [],
  } = params;

  // Calculate realistic targets based on average client value
  const avgClientValue = context.averageClientValue || 1500;
  const targetMonthly = targetMonthlyRevenue || avgClientValue * 10; // 10 clients/month default
  const targetTeam = targetTeamSize || (targetMonthly > 20000 ? 3 : targetMonthly > 10000 ? 2 : 1);

  const prompt = `You are a business growth strategist. Create a detailed 12-month growth plan for a ${context.businessType} business.

BUSINESS CONTEXT:
- Business Type: ${context.businessType}
- Pricing Tiers: ${context.pricingTiers.map((t) => `${t.name}: ${t.price}`).join(', ')}
- Service Packages: ${context.servicePackages.map((p) => `${p.name}: ${p.price}`).join(', ')}
- Average Client Value: $${avgClientValue}
- Current Monthly Revenue: $${currentMonthlyRevenue}
- Target Monthly Revenue (Month 12): $${targetMonthly}
- Current Team Size: ${currentTeamSize}
- Target Team Size (Month 12): ${targetTeam}
- Growth Style: ${growthStyle}
- Focus Areas: ${focusAreas.length > 0 ? focusAreas.join(', ') : 'Balanced growth'}
${context.marketInsights ? `- Market Insights: ${context.marketInsights}` : ''}

Generate a JSON response with this EXACT structure (no markdown, just JSON):
{
  "monthlyMilestones": [
    {
      "month": 1,
      "theme": "Theme for the month (e.g., 'Foundation', 'Systems', 'Scale')",
      "revenueTarget": number (realistic monthly revenue target),
      "clientTarget": number (target number of active clients),
      "keyActivities": ["3-5 specific activities to focus on this month"],
      "hires": ["Any hires needed this month or empty array"],
      "investments": ["Tools, software, or marketing spend needed"]
    }
    // ... months 2-12
  ],
  "scalingStrategy": {
    "phase1": {
      "months": "1-3",
      "focus": "What to focus on in phase 1 (usually foundation/validation)",
      "revenue": "Revenue range for this phase"
    },
    "phase2": {
      "months": "4-6",
      "focus": "What to focus on in phase 2 (usually growth/systems)",
      "revenue": "Revenue range for this phase"
    },
    "phase3": {
      "months": "7-12",
      "focus": "What to focus on in phase 3 (usually scale/optimization)",
      "revenue": "Revenue range for this phase"
    }
  },
  "teamBuildingTimeline": [
    {
      "month": number (when to hire),
      "role": "Role title",
      "reason": "Why this hire is needed at this point",
      "estimatedCost": number (monthly cost)
    }
    // Only include if team needs to grow
  ],
  "yearOneProjection": {
    "totalRevenue": number (total revenue for year 1),
    "totalClients": number (total unique clients served),
    "averageClientValue": number,
    "profitMargin": "Expected profit margin as percentage",
    "keyRisks": ["3-5 main risks to the plan"]
  }
}

REQUIREMENTS:
1. Revenue growth should be realistic - typically 20-50% month-over-month for ${growthStyle} growth
2. Include specific, actionable activities for each month
3. Team hires should be justified by revenue milestones
4. Investments should be proportional to revenue
5. Account for typical business seasonality
6. Include both acquisition and retention activities
7. Phase 1 should focus on validation and early wins
8. Phase 2 should focus on systems and repeatability
9. Phase 3 should focus on scaling what works
10. Be realistic about the time needed to build a sustainable business`;

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data: AIResponse = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse JSON from response
    let jsonContent = content;
    if (content.includes('```json')) {
      jsonContent = content.split('```json')[1].split('```')[0];
    } else if (content.includes('```')) {
      jsonContent = content.split('```')[1].split('```')[0];
    }

    const plan = JSON.parse(jsonContent.trim());

    // Validate required fields
    if (!plan.monthlyMilestones || !plan.scalingStrategy || !plan.yearOneProjection) {
      throw new Error('AI response missing required fields');
    }

    return plan as LongTermPlanArtifact;
  } catch (error) {
    console.error('[LongTermPlan] AI generation failed:', error);
    return null;
  }
}

// ============================================
// FALLBACK PLAN GENERATOR
// ============================================

function generateFallbackPlan(
  context: BusinessContext,
  params: z.infer<typeof longTermPlanSchema>
): LongTermPlanArtifact {
  const {
    currentMonthlyRevenue = 0,
    targetMonthlyRevenue,
    currentTeamSize = 1,
    growthStyle = 'moderate',
  } = params;

  const avgClientValue = context.averageClientValue || 1500;
  const targetMonthly = targetMonthlyRevenue || avgClientValue * 10;

  // Growth multipliers based on style
  const growthRates = {
    aggressive: 1.4, // 40% month-over-month
    moderate: 1.25, // 25% month-over-month
    conservative: 1.15, // 15% month-over-month
  };

  const growthRate = growthRates[growthStyle];

  // Generate monthly milestones
  const monthlyMilestones: LongTermPlanArtifact['monthlyMilestones'] = [];
  let currentRevenue = currentMonthlyRevenue || avgClientValue; // Start with at least 1 client
  let currentClients = Math.max(1, Math.round(currentRevenue / avgClientValue));

  const monthThemes = [
    { theme: 'Foundation & First Clients', activities: ['Finalize service offerings', 'Build portfolio/case studies', 'Set up basic systems (CRM, invoicing)', 'Land first 2-3 clients', 'Establish online presence'] },
    { theme: 'Outreach & Validation', activities: ['Increase outreach volume', 'Test different marketing channels', 'Collect testimonials', 'Refine service delivery', 'Start building referral system'] },
    { theme: 'Systems & Repeatability', activities: ['Document processes', 'Create templates and SOPs', 'Implement project management system', 'Optimize client onboarding', 'Analyze best customer segments'] },
    { theme: 'Growth & Expansion', activities: ['Double down on best channels', 'Consider first hire or contractor', 'Launch upsell/retainer offers', 'Build partnerships', 'Increase prices if justified'] },
    { theme: 'Team Building', activities: ['Hire first team member or VA', 'Delegate non-core tasks', 'Create training materials', 'Focus on high-value activities', 'Improve client retention'] },
    { theme: 'Scale Systems', activities: ['Automate repetitive tasks', 'Implement better tracking', 'Expand service offerings', 'Target larger clients', 'Build case studies from results'] },
    { theme: 'Revenue Optimization', activities: ['Introduce premium tier', 'Increase client lifetime value', 'Launch referral program', 'Reduce churn', 'Optimize pricing'] },
    { theme: 'Market Expansion', activities: ['Enter new market segment', 'Add complementary services', 'Build strategic partnerships', 'Scale marketing spend', 'Hire for growth'] },
    { theme: 'Operational Excellence', activities: ['Streamline operations', 'Reduce delivery time', 'Improve quality systems', 'Build team culture', 'Focus on profitability'] },
    { theme: 'Authority Building', activities: ['Create content/thought leadership', 'Speak at events or podcasts', 'Build email list', 'Network with industry leaders', 'Position as expert'] },
    { theme: 'Diversification', activities: ['Add recurring revenue streams', 'Create productized services', 'Build long-term client contracts', 'Expand team capabilities', 'Reduce single points of failure'] },
    { theme: 'Year 2 Planning', activities: ['Analyze year 1 results', 'Plan year 2 growth', 'Set stretch goals', 'Identify new opportunities', 'Celebrate wins and learn from losses'] },
  ];

  for (let month = 1; month <= 12; month++) {
    // Calculate revenue with growth cap to reach target
    const targetProgress = (month / 12);
    const linearTarget = currentMonthlyRevenue + (targetMonthly - currentMonthlyRevenue) * targetProgress;
    currentRevenue = Math.min(
      currentRevenue * growthRate,
      linearTarget * 1.2 // Don't exceed 20% above linear path
    );
    currentRevenue = Math.round(currentRevenue);

    currentClients = Math.round(currentRevenue / avgClientValue);

    const themeData = monthThemes[month - 1];

    // Determine hires based on revenue thresholds
    const hires: string[] = [];
    if (month === 5 && currentRevenue > 8000 && currentTeamSize === 1) {
      hires.push('Part-time Virtual Assistant ($500-1000/mo)');
    }
    if (month === 8 && currentRevenue > 15000 && currentTeamSize <= 2) {
      hires.push('Junior team member or contractor ($2000-3000/mo)');
    }
    if (month === 11 && currentRevenue > 25000) {
      hires.push('Operations/Sales support ($3000-4000/mo)');
    }

    // Determine investments based on revenue
    const investments: string[] = [];
    if (month === 1) {
      investments.push('CRM system ($50-100/mo)', 'Basic marketing budget ($200-500/mo)');
    }
    if (month === 3 && currentRevenue > 5000) {
      investments.push('Project management tool ($20-50/mo)', 'Email marketing platform ($30-50/mo)');
    }
    if (month === 6 && currentRevenue > 10000) {
      investments.push('Increased marketing budget ($500-1000/mo)', 'Professional tools upgrade');
    }
    if (month === 9 && currentRevenue > 20000) {
      investments.push('Sales/marketing software ($200-400/mo)', 'Team tools and licenses');
    }

    monthlyMilestones.push({
      month,
      theme: themeData.theme,
      revenueTarget: currentRevenue,
      clientTarget: currentClients,
      keyActivities: themeData.activities,
      hires,
      investments,
    });
  }

  // Calculate year totals
  const totalRevenue = monthlyMilestones.reduce((sum, m) => sum + m.revenueTarget, 0);
  const peakClients = Math.max(...monthlyMilestones.map((m) => m.clientTarget));

  // Generate team building timeline
  const teamBuildingTimeline: LongTermPlanArtifact['teamBuildingTimeline'] = [];

  if (targetMonthly > 8000) {
    teamBuildingTimeline.push({
      month: 5,
      role: 'Virtual Assistant',
      reason: 'Handle admin tasks, scheduling, and basic client communication to free up founder time for sales and delivery',
      estimatedCost: 800,
    });
  }

  if (targetMonthly > 15000) {
    teamBuildingTimeline.push({
      month: 8,
      role: 'Junior Team Member / Contractor',
      reason: 'Support service delivery to handle increased client volume without sacrificing quality',
      estimatedCost: 2500,
    });
  }

  if (targetMonthly > 25000) {
    teamBuildingTimeline.push({
      month: 11,
      role: 'Operations / Sales Support',
      reason: 'Scale client acquisition and improve operational efficiency for continued growth',
      estimatedCost: 3500,
    });
  }

  return {
    monthlyMilestones,

    scalingStrategy: {
      phase1: {
        months: '1-3',
        focus: `Build foundation, land first ${Math.round(currentMonthlyRevenue / avgClientValue) + 3} clients, validate service-market fit, establish basic systems`,
        revenue: `$${currentMonthlyRevenue || avgClientValue} - $${Math.round(avgClientValue * 3)}/month`,
      },
      phase2: {
        months: '4-6',
        focus: 'Systematize delivery, increase marketing, build referral engine, potentially first hire',
        revenue: `$${Math.round(avgClientValue * 3)} - $${Math.round(avgClientValue * 6)}/month`,
      },
      phase3: {
        months: '7-12',
        focus: 'Scale marketing, build team, optimize pricing, introduce premium offerings, target larger clients',
        revenue: `$${Math.round(avgClientValue * 6)} - $${targetMonthly}/month`,
      },
    },

    teamBuildingTimeline,

    yearOneProjection: {
      totalRevenue,
      totalClients: peakClients * 2, // Rough estimate accounting for churn
      averageClientValue: avgClientValue,
      profitMargin: currentTeamSize > 1 ? '40-50%' : '60-70%',
      keyRisks: [
        'Client acquisition slower than projected - mitigate with multi-channel approach',
        'Service delivery bottleneck - prepare systems before scaling',
        'Key client concentration - diversify client base early',
        'Pricing too low - review and adjust quarterly based on demand',
        'Burnout from doing everything alone - hire support before hitting capacity',
      ],
    },
  };
}

// ============================================
// TOOL IMPLEMENTATION
// ============================================

export async function generateLongTermPlan(
  params: z.infer<typeof longTermPlanSchema> & { projectId: string }
) {
  const { businessType, projectId, ...planParams } = params;

  try {
    // Initialize Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch business plan for context
    const { data: businessPlanArtifact } = await (supabase
      .from('artifacts') as any)
      .select('data')
      .eq('project_id', projectId)
      .eq('type', 'business_plan')
      .single();

    // Fetch market research for insights
    const { data: marketResearchArtifact } = await (supabase
      .from('artifacts') as any)
      .select('data')
      .eq('project_id', projectId)
      .eq('type', 'market_research')
      .single();

    // Build context from existing artifacts
    const businessPlan = businessPlanArtifact?.data as BusinessPlanArtifact | undefined;
    const marketResearch = marketResearchArtifact?.data as ResearchArtifact | undefined;

    // Calculate average client value from pricing
    let avgClientValue = 1500; // Default
    if (businessPlan?.servicePackages?.length) {
      const prices = businessPlan.servicePackages
        .map((p) => parseInt(p.price.replace(/[^0-9]/g, '')))
        .filter((p) => p > 0);
      if (prices.length > 0) {
        avgClientValue = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
      }
    }

    // Build market insights summary
    let marketInsights: string | undefined;
    if (marketResearch) {
      const intel = (marketResearch as any).marketIntelligence;
      if (intel) {
        marketInsights = `Market saturation: ${intel.saturationLevel || 'unknown'}. ${
          intel.gaps?.slice(0, 2).join('. ') || ''
        }`;
      }
    }

    const context: BusinessContext = {
      businessType,
      pricingTiers: businessPlan?.pricingTiers || [],
      servicePackages: businessPlan?.servicePackages || [],
      averageClientValue: avgClientValue,
      marketInsights,
    };

    // Try AI generation first
    let planData = await generateAILongTermPlan(context, { businessType, ...planParams });

    // Fallback if AI fails
    if (!planData) {
      planData = generateFallbackPlan(context, { businessType, ...planParams });
    }

    // Save to Supabase
    const { data: artifact, error } = await (supabase
      .from('artifacts') as any)
      .upsert(
        {
          project_id: projectId,
          type: 'long_term_plan',
          data: planData,
          version: 1,
        },
        {
          onConflict: 'project_id,type',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Failed to save long-term plan:', error);
      throw new Error('Failed to save plan');
    }

    // Format summary
    const month1 = planData.monthlyMilestones[0];
    const month6 = planData.monthlyMilestones[5];
    const month12 = planData.monthlyMilestones[11];

    return {
      success: true,
      artifact,
      summary: `📈 Created your 12-month growth roadmap!

**Year 1 Projection:** $${planData.yearOneProjection.totalRevenue.toLocaleString()} total revenue

**Revenue Milestones:**
- Month 1: $${month1.revenueTarget.toLocaleString()}/mo (${month1.clientTarget} clients)
- Month 6: $${month6.revenueTarget.toLocaleString()}/mo (${month6.clientTarget} clients)
- Month 12: $${month12.revenueTarget.toLocaleString()}/mo (${month12.clientTarget} clients)

**Scaling Phases:**
1. **Months 1-3:** ${planData.scalingStrategy.phase1.focus}
2. **Months 4-6:** ${planData.scalingStrategy.phase2.focus}
3. **Months 7-12:** ${planData.scalingStrategy.phase3.focus}

**Team Growth:** ${planData.teamBuildingTimeline.length > 0
  ? planData.teamBuildingTimeline.map((h) => `${h.role} (Month ${h.month})`).join(', ')
  : 'Solo operator for year 1'}

**Profit Margin:** ${planData.yearOneProjection.profitMargin}`,
    };
  } catch (error) {
    console.error('Long-term plan generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
