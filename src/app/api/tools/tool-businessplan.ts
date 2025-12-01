import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';
import type { BusinessPlanArtifact, ResearchArtifact, MarketIntelligence } from '@/types/database';

// ============================================
// SCHEMA DEFINITION
// ============================================

export const businessPlanSchema = z.object({
  businessType: z.string().describe('The type of business (e.g., "AI Automation Agency", "Web Design Agency")'),
  targetMarket: z.string().describe('The target market or customer segment'),
  competitors: z.array(z.object({
    name: z.string(),
    price: z.string(),
  })).optional().describe('Competitor data from market research'),
  brandName: z.string().optional().describe('The brand name from identity generation'),
});

// ============================================
// AI PRICING STRATEGY PROMPT
// ============================================

const PRICING_STRATEGY_PROMPT = `You are a business pricing strategist. Based on the market data provided, generate a competitive pricing strategy.

MARKET DATA:
- Business Type: {businessType}
- Target Market: {targetMarket}
- Market Saturation: {saturationLevel}
- Price Range: {priceMin} - {priceMax} (median: {priceMedian})
- Recommended Strategy: {recommendedStrategy}
- Strategy Rationale: {strategyRationale}
- Market Gaps: {gaps}
- Customer Pain Points: {painPoints}
- Common Features: {commonFeatures}
- Differentiators: {differentiators}

STRATEGY RULES:
- If strategy is "undercut": Price 10-20% BELOW median to capture price-sensitive customers
- If strategy is "premium": Price 20-40% ABOVE median, addressing market gaps
- If strategy is "niche": Price at or slightly above median, focus on specialization

REQUIREMENTS:
1. Generate 3 pricing tiers (Starter, Growth, Enterprise or similar)
2. Generate 3 service packages (specific deliverable bundles)
3. Create a "Quick Win" package - low-risk entry offer that's easy to sell in the first week
4. Ensure pricing reflects the recommended strategy
5. Features should address identified pain points and gaps
6. Make the Quick Win package something that can be delivered in 3-7 days

OUTPUT FORMAT (JSON only, no markdown):
{
  "strategy": "undercut" | "premium" | "niche",
  "rationale": "One sentence explaining why this strategy",
  "pricingTiers": [
    {
      "name": "Tier name",
      "price": "$X/month",
      "features": ["feature 1", "feature 2", "..."],
      "targetCustomer": "Who this tier is for"
    }
  ],
  "servicePackages": [
    {
      "name": "Package name",
      "description": "What this package delivers",
      "deliverables": ["deliverable 1", "deliverable 2", "..."],
      "price": "$X",
      "deliveryTime": "X days/weeks"
    }
  ],
  "quickWinPackage": {
    "name": "Quick Win package name",
    "price": "$X",
    "deliverables": ["deliverable 1", "deliverable 2", "..."],
    "deliveryTime": "3-5 days",
    "whySellsFast": "Why this is easy to sell",
    "targetConversion": "What percentage of leads should convert"
  },
  "differentiators": ["What makes us different from competitors"],
  "valueProposition": "One clear sentence value proposition"
}`;

// ============================================
// HELPER FUNCTIONS
// ============================================

async function fetchResearchArtifact(projectId: string): Promise<ResearchArtifact | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data } = await supabase
    .from('artifacts')
    .select('data')
    .eq('project_id', projectId)
    .eq('type', 'market_research')
    .single();

  return data?.data as ResearchArtifact | null;
}

async function generateAIPricing(
  businessType: string,
  targetMarket: string,
  marketIntelligence: MarketIntelligence
): Promise<any> {
  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY!,
  });

  // Build the prompt with market data
  const prompt = PRICING_STRATEGY_PROMPT
    .replace('{businessType}', businessType)
    .replace('{targetMarket}', targetMarket)
    .replace('{saturationLevel}', marketIntelligence.marketAnalysis.saturationLevel)
    .replace('{priceMin}', '$' + String(marketIntelligence.marketAnalysis.priceRange.min))
    .replace('{priceMax}', '$' + String(marketIntelligence.marketAnalysis.priceRange.max))
    .replace('{priceMedian}', '$' + String(marketIntelligence.marketAnalysis.priceRange.median))
    .replace('{recommendedStrategy}', marketIntelligence.recommendedStrategy)
    .replace('{strategyRationale}', marketIntelligence.strategyRationale)
    .replace('{gaps}', marketIntelligence.marketAnalysis.gaps.join(', ') || 'None identified')
    .replace('{painPoints}', marketIntelligence.customerPainPoints.map(p => p.complaint).join(', ') || 'None identified')
    .replace('{commonFeatures}', marketIntelligence.marketAnalysis.commonFeatures.join(', ') || 'Standard features')
    .replace('{differentiators}', marketIntelligence.marketAnalysis.differentiators.join(', ') || 'None identified');

  try {
    const { text } = await generateText({
      model: openrouter('anthropic/claude-3.5-sonnet'),
      prompt,
      temperature: 0.7,
    });

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('AI pricing generation failed:', error);
    throw error;
  }
}

// Fallback pricing based on strategy (if AI fails)
function generateFallbackPricing(
  businessType: string,
  marketIntelligence: MarketIntelligence
): any {
  const median = marketIntelligence.marketAnalysis.priceRange.median || 1500;
  const strategy = marketIntelligence.recommendedStrategy;

  // Calculate prices based on strategy
  let starterPrice: number, growthPrice: number, enterprisePrice: number;
  let quickWinPrice: number;

  if (strategy === 'undercut') {
    // 10-20% below median
    starterPrice = Math.round(median * 0.5 / 100) * 100;
    growthPrice = Math.round(median * 0.85 / 100) * 100;
    enterprisePrice = Math.round(median * 1.5 / 100) * 100;
    quickWinPrice = Math.round(median * 0.3 / 100) * 100;
  } else if (strategy === 'premium') {
    // 20-40% above median
    starterPrice = Math.round(median * 0.8 / 100) * 100;
    growthPrice = Math.round(median * 1.3 / 100) * 100;
    enterprisePrice = Math.round(median * 2.5 / 100) * 100;
    quickWinPrice = Math.round(median * 0.5 / 100) * 100;
  } else {
    // Niche - at or slightly above median
    starterPrice = Math.round(median * 0.6 / 100) * 100;
    growthPrice = Math.round(median * 1.1 / 100) * 100;
    enterprisePrice = Math.round(median * 2.0 / 100) * 100;
    quickWinPrice = Math.round(median * 0.4 / 100) * 100;
  }

  // Ensure minimum prices
  starterPrice = Math.max(starterPrice, 297);
  growthPrice = Math.max(growthPrice, 997);
  enterprisePrice = Math.max(enterprisePrice, 2497);
  quickWinPrice = Math.max(quickWinPrice, 197);

  const gaps = marketIntelligence.marketAnalysis.gaps;

  return {
    strategy,
    rationale: marketIntelligence.strategyRationale,
    pricingTiers: [
      {
        name: 'Starter',
        price: `$${starterPrice}/month`,
        features: [
          'Core service delivery',
          'Email support',
          'Monthly reporting',
          gaps[0] ? `Includes: ${gaps[0]}` : 'Basic features',
        ],
        targetCustomer: 'Small businesses getting started',
      },
      {
        name: 'Growth',
        price: `$${growthPrice}/month`,
        features: [
          'Everything in Starter',
          'Priority support',
          'Weekly check-ins',
          gaps[1] ? `Includes: ${gaps[1]}` : 'Advanced features',
          'Custom strategy sessions',
        ],
        targetCustomer: 'Growing businesses ready to scale',
      },
      {
        name: 'Enterprise',
        price: `$${enterprisePrice}/month`,
        features: [
          'Everything in Growth',
          'Dedicated account manager',
          '24/7 support',
          'Custom solutions',
          'White-label options',
          gaps[2] ? `Includes: ${gaps[2]}` : 'Premium features',
        ],
        targetCustomer: 'Established businesses needing full service',
      },
    ],
    servicePackages: [
      {
        name: 'Starter Package',
        description: 'Get started with essential services',
        deliverables: ['Initial consultation', 'Strategy document', 'Basic implementation', '2 revision rounds'],
        price: `$${Math.round(starterPrice * 1.5)}`,
        deliveryTime: '1-2 weeks',
      },
      {
        name: 'Complete Package',
        description: 'Full-service implementation',
        deliverables: ['Discovery session', 'Complete implementation', 'Training', 'Support documentation', '30-day support'],
        price: `$${Math.round(growthPrice * 2)}`,
        deliveryTime: '3-4 weeks',
      },
      {
        name: 'Premium Package',
        description: 'All-inclusive premium service',
        deliverables: ['Deep-dive analysis', 'Custom solution', 'Full implementation', 'Team training', '90-day support', 'Optimization'],
        price: `$${Math.round(enterprisePrice * 1.5)}`,
        deliveryTime: '4-6 weeks',
      },
    ],
    quickWinPackage: {
      name: 'Quick Start',
      price: `$${quickWinPrice}`,
      deliverables: [
        'Initial audit/analysis',
        'Quick wins implementation',
        'Action plan document',
        '1 follow-up call',
      ],
      deliveryTime: '3-5 days',
      whySellsFast: 'Low risk, fast results, immediate value',
      targetConversion: '20-30% of qualified leads',
    },
    differentiators: gaps.slice(0, 3).map(gap => `We offer: ${gap}`),
    valueProposition: `We deliver ${businessType.toLowerCase()} services that address what competitors miss, with faster delivery and better communication.`,
  };
}

function generateExecutiveSummary(
  businessType: string,
  targetMarket: string,
  brandName: string | undefined,
  pricingData: any
): string {
  const name = brandName || 'Your Agency';
  return `${name} is a ${businessType.toLowerCase()} positioned to serve ${targetMarket}. ${pricingData.valueProposition} Our ${pricingData.strategy} pricing strategy is designed to ${pricingData.rationale} We offer three service tiers starting at ${pricingData.pricingTiers[0].price}, with a Quick Start package at ${pricingData.quickWinPackage.price} for new clients.`;
}

function generateRevenueModel(
  businessType: string,
  pricingData: any,
  marketIntelligence: MarketIntelligence
): string {
  const quickWinPrice = parseInt(pricingData.quickWinPackage.price.replace(/\D/g, '')) || 500;
  const starterPrice = parseInt(pricingData.pricingTiers[0].price.replace(/\D/g, '')) || 500;
  const growthPrice = parseInt(pricingData.pricingTiers[1].price.replace(/\D/g, '')) || 1500;

  const dominantModel = marketIntelligence.marketAnalysis.dominantPricingModel;

  if (dominantModel === 'monthly') {
    return `Primary revenue through monthly retainers (${pricingData.pricingTiers[0].price} - ${pricingData.pricingTiers[2].price}). Quick Start package at ${pricingData.quickWinPackage.price} serves as entry point to convert leads. Target: 60% recurring revenue within 6 months. Upsell path: Quick Start → Starter tier → Growth tier. Average client lifetime value target: $${starterPrice * 8}.`;
  } else if (dominantModel === 'project') {
    return `Project-based pricing with packages ranging from ${pricingData.quickWinPackage.price} to ${pricingData.servicePackages[2].price}. Convert successful projects to monthly retainers starting at ${pricingData.pricingTiers[0].price}. Target 30% project-to-retainer conversion. Upsell through add-on services and maintenance agreements.`;
  } else {
    return `Hybrid model: Quick Start (${pricingData.quickWinPackage.price}) converts to project work (${pricingData.servicePackages[1].price} avg) or monthly retainers (${pricingData.pricingTiers[1].price} avg). Target mix: 40% projects, 60% retainers. Focus on building recurring revenue through exceptional service delivery.`;
  }
}

// ============================================
// TOOL IMPLEMENTATION
// ============================================

export async function generateBusinessPlan(params: z.infer<typeof businessPlanSchema> & { projectId: string }) {
  const { businessType, targetMarket, competitors, brandName, projectId } = params;

  try {
    // 1. Fetch research artifact to get market intelligence
    const research = await fetchResearchArtifact(projectId);
    let marketIntelligence = research?.marketIntelligence;

    // 2. If no market intelligence, create a default one
    if (!marketIntelligence) {
      console.log('[BusinessPlan] No market intelligence found, creating default');

      // Extract prices from competitors if available
      const prices = (competitors || [])
        .map(c => {
          const match = c.price.match(/\$?([\d,]+)/);
          return match ? parseFloat(match[1].replace(/,/g, '')) : null;
        })
        .filter((p): p is number => p !== null);

      const median = prices.length > 0
        ? prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)]
        : 1500;

      marketIntelligence = {
        competitors: [],
        marketAnalysis: {
          saturationLevel: 'medium',
          priceRange: { min: median * 0.5, max: median * 2, median },
          dominantPricingModel: 'monthly',
          commonFeatures: ['Basic service', 'Support', 'Reporting'],
          differentiators: [],
          gaps: ['Better communication', 'Faster delivery'],
        },
        customerPainPoints: [
          { complaint: 'Slow delivery', frequency: 3, severity: 'high' },
          { complaint: 'Poor communication', frequency: 2, severity: 'high' },
        ],
        recommendedStrategy: 'niche',
        strategyRationale: 'Focus on a specific segment to build expertise and referrals.',
      };
    }

    // 3. Generate pricing with AI
    let pricingData: any;
    try {
      console.log('[BusinessPlan] Generating AI pricing strategy...');
      pricingData = await generateAIPricing(businessType, targetMarket, marketIntelligence);
      console.log('[BusinessPlan] AI pricing generated successfully');
    } catch (aiError) {
      console.warn('[BusinessPlan] AI pricing failed, using fallback:', aiError);
      pricingData = generateFallbackPricing(businessType, marketIntelligence);
    }

    // 4. Build business plan artifact
    const businessPlanData: BusinessPlanArtifact = {
      executiveSummary: generateExecutiveSummary(businessType, targetMarket, brandName, pricingData),
      revenueModel: generateRevenueModel(businessType, pricingData, marketIntelligence),
      pricingTiers: pricingData.pricingTiers.map((tier: any) => ({
        name: tier.name,
        price: tier.price,
        features: tier.features,
      })),
      servicePackages: pricingData.servicePackages.map((pkg: any) => ({
        name: pkg.name,
        description: pkg.description,
        deliverables: pkg.deliverables,
        price: pkg.price,
      })),
      targetMarket,
      valueProposition: pricingData.valueProposition,
      // Store additional data for use by first-week plan
      quickWinPackage: pricingData.quickWinPackage,
      pricingStrategy: pricingData.strategy,
      differentiators: pricingData.differentiators,
    } as any;

    // 5. Save to Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: artifact, error } = await (supabase
      .from('artifacts') as any)
      .upsert(
        {
          project_id: projectId,
          type: 'business_plan',
          data: businessPlanData,
          version: 1,
        },
        {
          onConflict: 'project_id,type',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Failed to save business plan artifact:', error);
      throw new Error('Failed to save business plan');
    }

    // Build strategy summary
    const strategySummary = pricingData.strategy === 'undercut'
      ? `UNDERCUT strategy: Pricing 10-20% below market to capture volume`
      : pricingData.strategy === 'premium'
      ? `PREMIUM strategy: Pricing above market, addressing gaps: ${marketIntelligence.marketAnalysis.gaps.slice(0, 2).join(', ')}`
      : `NICHE strategy: Focused positioning at market rate`;

    return {
      success: true,
      artifact,
      pricingStrategy: pricingData.strategy,
      quickWinPackage: pricingData.quickWinPackage,
      summary: `📋 Created business plan with ${strategySummary}. Quick Win package: ${pricingData.quickWinPackage.price}. ${businessPlanData.pricingTiers.length} pricing tiers and ${businessPlanData.servicePackages.length} service packages generated.`,
    };
  } catch (error) {
    console.error('Business plan generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
