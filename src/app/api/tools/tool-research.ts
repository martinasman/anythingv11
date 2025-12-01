import { z } from 'zod';
import { tavily } from '@tavily/core';
import { createClient } from '@supabase/supabase-js';
import type { ResearchArtifact, MarketIntelligence, ExtractedCompetitor } from '@/types/database';
import { SCOUT_SYSTEM_PROMPT } from '@/config/agentPrompts';

// ============================================
// SCHEMA DEFINITION
// ============================================

export const researchSchema = z.object({
  query: z.string().describe('The business idea or market to research'),
  location: z.string().optional().describe('Target location/market for the business'),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function extractLocation(query: string): string | null {
  // Simple location extraction - could be enhanced with NLP
  const locationPattern =
    /in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)|([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+area/i;
  const match = query.match(locationPattern);
  return match ? match[1] || match[2] : null;
}

function extractPricing(text: string): string {
  // Try to extract pricing from text
  const pricePatterns = [
    /\$(\d+(?:,\d{3})*(?:\.\d{2})?)/,
    /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:USD|dollars?|€|euros?)/i,
    /price[sd]?\s*:?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
  ];

  for (const pattern of pricePatterns) {
    const match = text.match(pattern);
    if (match) return `$${match[1]}`;
  }

  return 'Contact for pricing';
}

// Extract all prices from text (for detailed pricing analysis)
function extractAllPrices(text: string): number[] {
  const pricePatterns = [
    /\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g,
    /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:USD|dollars?|per month|\/mo|\/month)/gi,
  ];

  const prices: number[] = [];
  for (const pattern of pricePatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const price = parseFloat(match[1].replace(/,/g, ''));
      if (price > 0 && price < 100000) { // Filter out unrealistic values
        prices.push(price);
      }
    }
  }
  return [...new Set(prices)].sort((a, b) => a - b);
}

// Detect pricing model from text
function detectPricingModel(text: string): 'monthly' | 'project' | 'hourly' | 'unknown' {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('/mo') || lowerText.includes('per month') || lowerText.includes('monthly') || lowerText.includes('retainer')) {
    return 'monthly';
  }
  if (lowerText.includes('per project') || lowerText.includes('one-time') || lowerText.includes('fixed price')) {
    return 'project';
  }
  if (lowerText.includes('/hr') || lowerText.includes('per hour') || lowerText.includes('hourly')) {
    return 'hourly';
  }
  return 'unknown';
}

// Extract competitor strengths and weaknesses from content
function extractStrengthsWeaknesses(content: string): { strengths: string[]; weaknesses: string[] } {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const lowerContent = content.toLowerCase();

  // Look for strength indicators
  if (lowerContent.includes('fast') || lowerContent.includes('quick turnaround')) {
    strengths.push('Fast delivery');
  }
  if (lowerContent.includes('affordable') || lowerContent.includes('budget')) {
    strengths.push('Affordable pricing');
  }
  if (lowerContent.includes('quality') || lowerContent.includes('premium')) {
    strengths.push('High quality work');
  }
  if (lowerContent.includes('experience') || lowerContent.includes('years')) {
    strengths.push('Industry experience');
  }
  if (lowerContent.includes('support') || lowerContent.includes('24/7')) {
    strengths.push('Strong support');
  }

  // Look for weakness indicators from reviews/complaints
  if (lowerContent.includes('slow') || lowerContent.includes('delayed')) {
    weaknesses.push('Slow delivery');
  }
  if (lowerContent.includes('expensive') || lowerContent.includes('overpriced')) {
    weaknesses.push('High pricing');
  }
  if (lowerContent.includes('poor communication') || lowerContent.includes('unresponsive')) {
    weaknesses.push('Communication issues');
  }
  if (lowerContent.includes('generic') || lowerContent.includes('template')) {
    weaknesses.push('Generic/templated work');
  }

  return { strengths, weaknesses };
}

// Determine market position based on pricing
function determineMarketPosition(prices: number[], marketMedian: number): 'budget' | 'mid-market' | 'premium' | 'unknown' {
  if (prices.length === 0) return 'unknown';
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

  if (avgPrice < marketMedian * 0.7) return 'budget';
  if (avgPrice > marketMedian * 1.3) return 'premium';
  return 'mid-market';
}

// Extract enhanced competitor data
function extractEnhancedCompetitor(result: any, marketMedian: number): ExtractedCompetitor {
  const prices = extractAllPrices(result.content);
  const { strengths, weaknesses } = extractStrengthsWeaknesses(result.content);
  const pricingModel = detectPricingModel(result.content);

  return {
    name: result.title.split(' - ')[0].split(' | ')[0].trim(),
    url: result.url,
    description: result.content.slice(0, 200),
    pricing: {
      starterPrice: prices[0] || null,
      midPrice: prices.length > 1 ? prices[Math.floor(prices.length / 2)] : null,
      premiumPrice: prices[prices.length - 1] || null,
      pricingModel,
      rawPriceStrings: prices.map(p => `$${p}`),
    },
    strengths: strengths.slice(0, 3),
    weaknesses: weaknesses.slice(0, 3),
    marketPosition: determineMarketPosition(prices, marketMedian),
  };
}

// Analyze market saturation
function analyzeMarketSaturation(competitors: ExtractedCompetitor[], totalResults: number): 'high' | 'medium' | 'low' {
  // More competitors = higher saturation
  // More with detailed pricing = more established market
  const competitorsWithPricing = competitors.filter(c => c.pricing.starterPrice !== null).length;

  if (totalResults > 15 && competitorsWithPricing > 3) return 'high';
  if (totalResults > 8 || competitorsWithPricing > 2) return 'medium';
  return 'low';
}

// Extract market gaps from complaints
function extractMarketGaps(complaintsContent: string[]): string[] {
  const gaps: string[] = [];
  const allContent = complaintsContent.join(' ').toLowerCase();

  // Common gaps in service businesses
  if (allContent.includes('slow') || allContent.includes('takes too long')) {
    gaps.push('Fast turnaround time');
  }
  if (allContent.includes('communication') || allContent.includes('updates')) {
    gaps.push('Better communication & transparency');
  }
  if (allContent.includes('expensive') || allContent.includes('cost')) {
    gaps.push('More affordable entry-level packages');
  }
  if (allContent.includes('generic') || allContent.includes('template')) {
    gaps.push('Truly custom/personalized solutions');
  }
  if (allContent.includes('support') || allContent.includes('after')) {
    gaps.push('Better ongoing support & maintenance');
  }
  if (allContent.includes('revisions') || allContent.includes('changes')) {
    gaps.push('More flexible revision policies');
  }
  if (allContent.includes('mobile') || allContent.includes('responsive')) {
    gaps.push('Mobile-first design approach');
  }
  if (allContent.includes('seo') || allContent.includes('found online')) {
    gaps.push('Built-in SEO optimization');
  }

  return [...new Set(gaps)].slice(0, 5);
}

// Extract common features from competitors
function extractCommonFeatures(competitorContent: string[]): string[] {
  const featureCounts: Record<string, number> = {};
  const featurePatterns = [
    { pattern: /responsive|mobile/i, feature: 'Responsive design' },
    { pattern: /seo|search engine/i, feature: 'SEO optimization' },
    { pattern: /custom|bespoke/i, feature: 'Custom design' },
    { pattern: /cms|wordpress|content management/i, feature: 'CMS integration' },
    { pattern: /support|maintenance/i, feature: 'Ongoing support' },
    { pattern: /revision|changes/i, feature: 'Revision rounds' },
    { pattern: /hosting|domain/i, feature: 'Hosting included' },
    { pattern: /analytics|tracking/i, feature: 'Analytics setup' },
    { pattern: /ssl|security/i, feature: 'Security/SSL' },
    { pattern: /e-?commerce|shop|store/i, feature: 'E-commerce capability' },
  ];

  competitorContent.forEach(content => {
    featurePatterns.forEach(({ pattern, feature }) => {
      if (pattern.test(content)) {
        featureCounts[feature] = (featureCounts[feature] || 0) + 1;
      }
    });
  });

  // Return features mentioned by at least 2 competitors
  return Object.entries(featureCounts)
    .filter(([, count]) => count >= 2)
    .sort(([, a], [, b]) => b - a)
    .map(([feature]) => feature)
    .slice(0, 6);
}

// Extract customer pain points with severity
function extractPainPoints(complaintsContent: string[]): MarketIntelligence['customerPainPoints'] {
  const painPointPatterns = [
    { pattern: /slow|delayed|took forever|waiting/i, complaint: 'Slow delivery times', severity: 'high' as const },
    { pattern: /expensive|overpriced|cost|price/i, complaint: 'High pricing concerns', severity: 'medium' as const },
    { pattern: /communication|respond|reply|updates/i, complaint: 'Poor communication', severity: 'high' as const },
    { pattern: /quality|poor|bad|terrible/i, complaint: 'Quality issues', severity: 'high' as const },
    { pattern: /generic|template|cookie.?cutter/i, complaint: 'Generic/templated work', severity: 'medium' as const },
    { pattern: /support|help|after.?sale/i, complaint: 'Lack of post-sale support', severity: 'medium' as const },
    { pattern: /hidden|extra|fee|charge/i, complaint: 'Hidden fees or charges', severity: 'high' as const },
    { pattern: /revision|change|update/i, complaint: 'Limited revisions', severity: 'low' as const },
  ];

  const painPoints: MarketIntelligence['customerPainPoints'] = [];
  const allContent = complaintsContent.join(' ');

  painPointPatterns.forEach(({ pattern, complaint, severity }) => {
    const matches = allContent.match(new RegExp(pattern, 'gi')) || [];
    if (matches.length > 0) {
      painPoints.push({
        complaint,
        frequency: matches.length,
        severity,
      });
    }
  });

  return painPoints.sort((a, b) => b.frequency - a.frequency).slice(0, 6);
}

// Determine recommended pricing strategy
function determineStrategy(
  saturation: 'high' | 'medium' | 'low',
  gaps: string[],
  painPoints: MarketIntelligence['customerPainPoints']
): { strategy: 'undercut' | 'premium' | 'niche'; rationale: string } {
  const highSeverityPainPoints = painPoints.filter(p => p.severity === 'high').length;

  // If market is highly saturated, undercut to stand out
  if (saturation === 'high' && gaps.length < 3) {
    return {
      strategy: 'undercut',
      rationale: 'Market is saturated with similar offerings. Compete on price (10-20% below median) while maintaining quality to capture price-sensitive customers.',
    };
  }

  // If there are significant gaps or pain points, go premium
  if (gaps.length >= 3 || highSeverityPainPoints >= 2) {
    return {
      strategy: 'premium',
      rationale: `Significant market gaps identified: ${gaps.slice(0, 2).join(', ')}. Position as premium solution addressing what competitors miss.`,
    };
  }

  // Otherwise, find a niche
  return {
    strategy: 'niche',
    rationale: 'Market has moderate competition. Focus on a specific niche or customer segment to build expertise and referrals.',
  };
}

function calculateAveragePrice(competitors: Array<{ price: string }>): string {
  const prices = competitors
    .map((c) => {
      const match = c.price.match(/\$?([\d,]+(?:\.\d{2})?)/);
      return match ? parseFloat(match[1].replace(/,/g, '')) : null;
    })
    .filter((p): p is number => p !== null);

  if (prices.length === 0) return 'Varies';

  const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  return `$${avg.toFixed(2)}`;
}

function extractBusinessModelInsights(results: any[]): {
  acquisitionStrategies: string[];
  pricingModels: string[];
  quickWins: string[];
  commonMistakes: string[];
} {
  const insights = {
    acquisitionStrategies: [] as string[],
    pricingModels: [] as string[],
    quickWins: [] as string[],
    commonMistakes: [] as string[],
  };

  results.forEach((result) => {
    const content = result.content.toLowerCase();

    // Look for acquisition strategies
    if (content.includes('cold email') || content.includes('cold outreach')) {
      insights.acquisitionStrategies.push('Cold email outreach to targeted prospects');
    }
    if (content.includes('linkedin')) {
      insights.acquisitionStrategies.push('LinkedIn direct outreach and content');
    }
    if (content.includes('referral')) {
      insights.acquisitionStrategies.push('Referral-based growth from existing network');
    }
    if (
      content.includes('free') &&
      (content.includes('audit') || content.includes('consultation') || content.includes('trial'))
    ) {
      insights.acquisitionStrategies.push('Free value-first offer (audit/consultation/trial)');
    }
    if (content.includes('upwork') || content.includes('fiverr') || content.includes('freelance')) {
      insights.acquisitionStrategies.push('Freelance platforms for initial clients');
    }
    if (content.includes('portfolio') || content.includes('case stud')) {
      insights.acquisitionStrategies.push('Portfolio-based outreach showing previous work');
    }

    // Look for pricing models
    if (content.includes('retainer') || content.includes('monthly')) {
      insights.pricingModels.push('Monthly retainer model');
    }
    if (content.includes('project') && content.includes('based')) {
      insights.pricingModels.push('Project-based pricing');
    }
    if (content.includes('hourly') || content.includes('per hour')) {
      insights.pricingModels.push('Hourly rate pricing');
    }
    if (content.includes('tier') || content.includes('package')) {
      insights.pricingModels.push('Tiered package pricing');
    }

    // Look for quick wins (first week/client strategies)
    if (content.includes('first week') || content.includes('first client') || content.includes('quick win')) {
      insights.quickWins.push(result.content.slice(0, 150) + '...');
    }

    // Look for mistakes to avoid
    if (
      content.includes('mistake') ||
      content.includes('avoid') ||
      content.includes("don't") ||
      content.includes('failed')
    ) {
      insights.commonMistakes.push(result.content.slice(0, 150) + '...');
    }
  });

  // Dedupe and limit
  return {
    acquisitionStrategies: [...new Set(insights.acquisitionStrategies)].slice(0, 5),
    pricingModels: [...new Set(insights.pricingModels)].slice(0, 3),
    quickWins: [...new Set(insights.quickWins)].slice(0, 3),
    commonMistakes: [...new Set(insights.commonMistakes)].slice(0, 3),
  };
}

function generateRecommendedFirstOffer(
  query: string,
  avgPrice: string,
  insights: ReturnType<typeof extractBusinessModelInsights>
): {
  name: string;
  price: string;
  deliverables: string[];
  whyItWorks: string;
} {
  // Detect if it's website-related service
  const isWebsiteService =
    query.toLowerCase().includes('website') ||
    query.toLowerCase().includes('web design') ||
    query.toLowerCase().includes('web dev');

  if (isWebsiteService) {
    return {
      name: 'Website + Branding Starter Package',
      price: avgPrice !== 'Varies' ? avgPrice : '$1,500',
      deliverables: [
        'Custom 5-page website design',
        'Logo and brand color palette',
        'Mobile-responsive development',
        '3 rounds of revisions',
        'Basic SEO setup',
      ],
      whyItWorks:
        'Combines immediate value (new website) with high perceived value (branding). Easy to demo with mockups.',
    };
  }

  // Default service offer
  return {
    name: 'Starter Package',
    price: avgPrice !== 'Varies' ? avgPrice : '$500',
    deliverables: [
      'Initial consultation and strategy session',
      'Customized action plan',
      '2 weeks of implementation support',
      'Follow-up review call',
    ],
    whyItWorks: 'Low-risk entry point that demonstrates value before asking for larger commitment.',
  };
}

// ============================================
// TOOL IMPLEMENTATION
// ============================================

export async function performMarketResearch(params: z.infer<typeof researchSchema> & { projectId: string }) {
  const { query, projectId, location: providedLocation } = params;

  try {
    // Initialize Tavily client
    const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY! });

    // Extract location for targeted search
    const location = providedLocation || extractLocation(query);
    const locationSuffix = location ? ` in ${location}` : '';

    // Enhanced Query Generation (following plan requirements)
    const queries = [
      `${query} competitor pricing${locationSuffix}`,
      `${query} packages pricing tiers`,
      `${query} reviews complaints problems`,
      `${query} market rates 2024 2025`,
      `${query} successful agencies revenue business model`,
      `how to start ${query} first clients strategies`,
    ];

    // Execute searches in parallel (6 searches for comprehensive data)
    const [
      pricingResults,
      packagesResults,
      complaintsResults,
      ratesResults,
      businessModelResults,
      strategyResults
    ] = await Promise.all([
      tvly.search(queries[0], { searchDepth: 'advanced', maxResults: 8, includeAnswer: true }),
      tvly.search(queries[1], { searchDepth: 'advanced', maxResults: 5, includeAnswer: true }),
      tvly.search(queries[2], { searchDepth: 'advanced', maxResults: 5, includeAnswer: true }),
      tvly.search(queries[3], { searchDepth: 'basic', maxResults: 5 }),
      tvly.search(queries[4], { searchDepth: 'basic', maxResults: 5 }),
      tvly.search(queries[5], { searchDepth: 'basic', maxResults: 5 }),
    ]);

    // Combine pricing results for better coverage
    const allPricingContent = [
      ...pricingResults.results.map(r => r.content),
      ...packagesResults.results.map(r => r.content),
      ...ratesResults.results.map(r => r.content),
    ];

    // Extract all prices to calculate market median
    const allPrices: number[] = [];
    allPricingContent.forEach(content => {
      allPrices.push(...extractAllPrices(content));
    });
    const sortedPrices = allPrices.sort((a, b) => a - b);
    const marketMedian = sortedPrices.length > 0
      ? sortedPrices[Math.floor(sortedPrices.length / 2)]
      : 1500; // Default median if no prices found

    // Extract enhanced competitor data (5 competitors)
    const enhancedCompetitors = pricingResults.results.slice(0, 5).map(result =>
      extractEnhancedCompetitor(result, marketMedian)
    );

    // Legacy competitor format (for backwards compatibility)
    const competitors = enhancedCompetitors.map(c => ({
      name: c.name,
      url: c.url,
      description: c.description || '',
      price: c.pricing.rawPriceStrings[0] || 'Contact for pricing',
    }));

    // Calculate average market price
    const avgPrice = calculateAveragePrice(competitors);

    // Determine dominant pricing model
    const pricingModelCounts = { monthly: 0, project: 0, hourly: 0, unknown: 0 };
    enhancedCompetitors.forEach(c => {
      pricingModelCounts[c.pricing.pricingModel]++;
    });
    const dominantPricingModel = (Object.entries(pricingModelCounts)
      .filter(([key]) => key !== 'unknown')
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'mixed') as 'monthly' | 'project' | 'hourly' | 'mixed';

    // Extract market gaps from complaints
    const complaintsContent = complaintsResults.results.map(r => r.content);
    const marketGaps = extractMarketGaps(complaintsContent);

    // Extract common features
    const commonFeatures = extractCommonFeatures(allPricingContent);

    // Extract differentiators (what top competitors do differently)
    const differentiators = enhancedCompetitors
      .flatMap(c => c.strengths)
      .filter((s, i, arr) => arr.indexOf(s) === i)
      .slice(0, 4);

    // Analyze market saturation
    const saturationLevel = analyzeMarketSaturation(
      enhancedCompetitors,
      pricingResults.results.length + packagesResults.results.length
    );

    // Extract customer pain points
    const customerPainPoints = extractPainPoints(complaintsContent);

    // Determine recommended strategy
    const { strategy, rationale } = determineStrategy(saturationLevel, marketGaps, customerPainPoints);

    // Build Market Intelligence object
    const marketIntelligence: MarketIntelligence = {
      competitors: enhancedCompetitors,
      marketAnalysis: {
        saturationLevel,
        priceRange: {
          min: sortedPrices[0] || 0,
          max: sortedPrices[sortedPrices.length - 1] || 0,
          median: marketMedian,
        },
        dominantPricingModel,
        commonFeatures,
        differentiators,
        gaps: marketGaps,
      },
      customerPainPoints,
      recommendedStrategy: strategy,
      strategyRationale: rationale,
    };

    // Extract business model insights from additional searches
    const allInsightResults = [
      ...businessModelResults.results,
      ...strategyResults.results,
    ];
    const businessModelInsights = extractBusinessModelInsights(allInsightResults);

    // Generate recommended first offer
    const recommendedFirstOffer = generateRecommendedFirstOffer(query, avgPrice, businessModelInsights);

    // Extract all unique sources from results
    const allSources = [
      ...pricingResults.results.map((r) => ({ title: r.title, url: r.url })),
      ...packagesResults.results.map((r) => ({ title: r.title, url: r.url })),
      ...complaintsResults.results.map((r) => ({ title: r.title, url: r.url })),
      ...allInsightResults.map((r) => ({ title: r.title, url: r.url })),
    ].filter((s, i, arr) => arr.findIndex((x) => x.url === s.url) === i);

    // Generate enhanced next steps based on strategy
    const nextSteps = strategy === 'undercut'
      ? [
          `Price 10-20% below market median ($${Math.round(marketMedian * 0.85)})`,
          `Focus on speed and efficiency to maintain margins`,
          `Target price-sensitive customers with clear value proposition`,
          `Build volume through competitive pricing before raising rates`,
        ]
      : strategy === 'premium'
      ? [
          `Price 20-40% above median ($${Math.round(marketMedian * 1.3)})`,
          `Address market gaps: ${marketGaps.slice(0, 2).join(', ')}`,
          `Create premium packages with high-touch service`,
          `Build case studies demonstrating superior results`,
        ]
      : [
          `Find a specific niche within ${query}`,
          `Become the go-to expert for that niche`,
          `Price at or slightly above market ($${Math.round(marketMedian * 1.1)})`,
          `Build referral network within the niche`,
        ];

    // Build enhanced research data
    const researchData: ResearchArtifact = {
      competitors,
      marketSummary: pricingResults.answer ||
        `Market analysis for ${query}. Average pricing: ${avgPrice}. ${competitors.length} competitors identified. Market saturation: ${saturationLevel}. Recommended strategy: ${strategy}.`,
      targetAudience: location ? `Customers in ${location}` : 'Target market consumers',
      keyInsights: [
        `Market saturation: ${saturationLevel.toUpperCase()}`,
        `Price range: $${sortedPrices[0] || 0} - $${sortedPrices[sortedPrices.length - 1] || 0} (median: $${marketMedian})`,
        `Dominant pricing model: ${dominantPricingModel}`,
        `Recommended strategy: ${strategy.toUpperCase()} - ${rationale.slice(0, 100)}...`,
        `${customerPainPoints.length} customer pain points identified`,
        `${marketGaps.length} market gaps found`,
      ],
      sources: allSources.slice(0, 15),
      nextSteps,
      businessModelInsights,
      recommendedFirstOffer,
      marketIntelligence, // NEW: Full market intelligence data
    };

    // Save to Supabase with UPSERT for updates
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: artifact, error } = await (supabase
      .from('artifacts') as any)
      .upsert(
        {
          project_id: projectId,
          type: 'market_research',
          data: researchData,
          version: 1,
        },
        {
          onConflict: 'project_id,type',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Failed to save research artifact:', error);
      throw new Error('Failed to save research results');
    }

    // Build summary with strategy recommendation
    const strategySummary = strategy === 'undercut'
      ? `Strategy: UNDERCUT - Price 10-20% below $${marketMedian} median`
      : strategy === 'premium'
      ? `Strategy: PREMIUM - Address gaps: ${marketGaps.slice(0, 2).join(', ')}`
      : `Strategy: NICHE - Specialize in a segment`;

    return {
      success: true,
      artifact,
      marketIntelligence,
      summary: `🔍 Found ${competitors.length} competitors. Market: ${saturationLevel} saturation. ${strategySummary}. ${customerPainPoints.length} pain points identified.`,
    };
  } catch (error) {
    console.error('Market research error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
