import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import type { Lead, LeadsArtifact, WebsiteAnalysis, leadToLeadRow } from '@/types/database';
import { searchGoogleMapsBusinesses, GoogleMapsResult } from '@/lib/services/serpapi';
import { analyzeWebsite, getWebsitePriority } from '@/lib/services/websiteAnalyzer';

// ============================================
// SCHEMA DEFINITION
// ============================================

export const leadsSchema = z.object({
  category: z.string().describe('Business category to search (e.g., "restaurants", "gyms", "dentists")'),
  location: z.string().describe('Location to search (e.g., "Austin, TX", "Miami, FL")'),
  numberOfLeads: z.number().min(5).max(50).optional().describe('Number of leads to generate (default: 20)'),
  analyzeWebsites: z.boolean().optional().describe('Whether to analyze website quality (default: true)'),
});

// ============================================
// ICP TYPES
// ============================================

interface ICP {
  targetIndustries: string[];
  targetLocation: string;
  painPoints: string[];
  solutionType: string;
}

// ============================================
// SCORING ALGORITHM (1-100 SCALE)
// ============================================

interface ScoreFactors {
  websiteOpportunity: number;  // 0-40 points
  businessSignals: number;     // 0-25 points
  icpMatch: number;            // 0-20 points
  contactAvailability: number; // 0-15 points
}

function calculateLeadScore(
  business: GoogleMapsResult,
  websiteAnalysis: WebsiteAnalysis | null,
  icp: ICP
): { score: number; factors: ScoreFactors; breakdown: string[] } {
  const factors: ScoreFactors = {
    websiteOpportunity: 0,
    businessSignals: 0,
    icpMatch: 0,
    contactAvailability: 0,
  };
  const breakdown: string[] = [];

  // 1. WEBSITE OPPORTUNITY (0-40 points)
  if (websiteAnalysis) {
    switch (websiteAnalysis.status) {
      case 'none':
        factors.websiteOpportunity = 40;
        breakdown.push('No website (+40)');
        break;
      case 'broken':
        factors.websiteOpportunity = 35;
        breakdown.push('Broken website (+35)');
        break;
      case 'poor':
        factors.websiteOpportunity = 30;
        breakdown.push('Poor quality website (+30)');
        break;
      case 'outdated':
        factors.websiteOpportunity = 20;
        breakdown.push('Outdated website (+20)');
        break;
      case 'good':
        factors.websiteOpportunity = 5;
        breakdown.push('Website exists (+5)');
        break;
    }

    // Bonus for specific issues
    if (websiteAnalysis.issues.length > 3) {
      const bonus = Math.min((websiteAnalysis.issues.length - 3) * 2, 10);
      factors.websiteOpportunity = Math.min(factors.websiteOpportunity + bonus, 40);
      if (bonus > 0) breakdown.push(`Multiple issues (+${bonus})`);
    }
  } else {
    // If no analysis, assume needs investigation
    factors.websiteOpportunity = 15;
    breakdown.push('Website not analyzed (+15)');
  }

  // 2. BUSINESS SIGNALS (0-25 points)
  // Low rating = they need help
  if (business.rating !== undefined) {
    if (business.rating < 3.5) {
      factors.businessSignals += 15;
      breakdown.push(`Low rating ${business.rating} (+15)`);
    } else if (business.rating < 4.0) {
      factors.businessSignals += 8;
      breakdown.push(`Moderate rating ${business.rating} (+8)`);
    } else if (business.rating >= 4.5) {
      factors.businessSignals += 3;
      breakdown.push(`Good rating - established business (+3)`);
    }
  }

  // Few reviews = newer business, more receptive
  if (business.reviewCount !== undefined) {
    if (business.reviewCount < 10) {
      factors.businessSignals += 10;
      breakdown.push(`Few reviews (${business.reviewCount}) (+10)`);
    } else if (business.reviewCount < 50) {
      factors.businessSignals += 5;
      breakdown.push(`Growing business (${business.reviewCount} reviews) (+5)`);
    }
  }

  // 3. ICP MATCH (0-20 points)
  // Industry match
  const businessType = (business.type || business.name).toLowerCase();
  const industryMatch = icp.targetIndustries.some(ind =>
    businessType.includes(ind.toLowerCase())
  );
  if (industryMatch) {
    factors.icpMatch += 12;
    breakdown.push('Industry match (+12)');
  }

  // Location match
  const locationMatch = business.address?.toLowerCase().includes(icp.targetLocation.toLowerCase().split(',')[0]);
  if (locationMatch) {
    factors.icpMatch += 8;
    breakdown.push('Location match (+8)');
  }

  // 4. CONTACT AVAILABILITY (0-15 points)
  if (business.phone) {
    factors.contactAvailability += 8;
    breakdown.push('Phone available (+8)');
  }
  if (business.website) {
    factors.contactAvailability += 4;
    breakdown.push('Website exists (+4)');
  }
  // Reserve 3 points for email if we had it
  // factors.contactAvailability += business.email ? 3 : 0;

  const totalScore =
    factors.websiteOpportunity +
    factors.businessSignals +
    factors.icpMatch +
    factors.contactAvailability;

  return {
    score: Math.min(totalScore, 100),
    factors,
    breakdown,
  };
}

// ============================================
// LEAD ENRICHMENT
// ============================================

async function enrichLeadWithAnalysis(
  business: GoogleMapsResult,
  icp: ICP,
  analyzeWebsites: boolean
): Promise<Lead> {
  // Analyze website if requested
  let websiteAnalysis: WebsiteAnalysis | null = null;
  if (analyzeWebsites) {
    const analysis = await analyzeWebsite(business.website);
    websiteAnalysis = {
      status: analysis.status,
      score: analysis.score,
      issues: analysis.issues,
      lastUpdated: analysis.lastUpdated,
      technologies: analysis.technologies,
      hasSSL: analysis.hasSSL,
      loadTime: analysis.loadTime,
      mobileResponsive: analysis.mobileResponsive,
      hasContactForm: analysis.hasContactForm,
      socialLinks: analysis.socialLinks,
    };
  }

  // Calculate score
  const { score, breakdown } = calculateLeadScore(business, websiteAnalysis, icp);

  // Determine pain points based on website analysis
  const painPoints: string[] = [];
  if (websiteAnalysis) {
    if (websiteAnalysis.status === 'none') {
      painPoints.push('No website - missing online presence');
    } else if (websiteAnalysis.status === 'broken') {
      painPoints.push('Website is broken or inaccessible');
    } else {
      painPoints.push(...websiteAnalysis.issues.slice(0, 3));
    }
  }

  // Determine suggested outreach angle
  let suggestedAngle = '';
  if (websiteAnalysis?.status === 'none') {
    suggestedAngle = `"Hi, I noticed ${business.name} doesn't have a website yet. I built a concept for you..."`;
  } else if (websiteAnalysis?.status === 'broken') {
    suggestedAngle = `"I tried visiting your website and noticed it's not loading. I'd love to help fix that..."`;
  } else if (websiteAnalysis?.status === 'poor' || websiteAnalysis?.status === 'outdated') {
    const mainIssue = websiteAnalysis.issues[0] || 'could use an update';
    suggestedAngle = `"I noticed your website ${mainIssue.toLowerCase()}. I have some ideas to improve it..."`;
  } else {
    suggestedAngle = `"I was impressed by ${business.name}. I help businesses like yours grow online..."`;
  }

  // Determine priority
  const priority = websiteAnalysis ? getWebsitePriority(websiteAnalysis) : 'medium';

  // Build the lead
  const lead: Lead = {
    id: crypto.randomUUID(),
    companyName: business.name,
    industry: business.type || icp.targetIndustries[0] || 'Business',

    // Contact info
    website: business.website,
    phone: business.phone,
    address: business.address,

    // Google Maps data
    placeId: business.placeId,
    rating: business.rating,
    reviewCount: business.reviewCount,
    coordinates: business.coordinates,

    // Website analysis
    websiteAnalysis: websiteAnalysis || undefined,

    // Scoring (1-100)
    score,
    scoreBreakdown: breakdown,

    // Legacy ICP fields (for backwards compat)
    icpScore: Math.round(score / 10), // Convert to 0-10 for legacy
    icpMatchReasons: breakdown.slice(0, 3),
    painPoints,
    suggestedAngle,

    // CRM fields
    status: 'new',
    priority,

    // Timestamps
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return lead;
}

// ============================================
// CHAT OUTPUT FORMATTING
// ============================================

function formatLeadsForChat(leads: Lead[]): string {
  // Group by website status
  const noWebsite = leads.filter(l => l.websiteAnalysis?.status === 'none');
  const broken = leads.filter(l => l.websiteAnalysis?.status === 'broken');
  const poor = leads.filter(l => l.websiteAnalysis?.status === 'poor');
  const outdated = leads.filter(l => l.websiteAnalysis?.status === 'outdated');
  const good = leads.filter(l => l.websiteAnalysis?.status === 'good');

  let output = '## Website Analysis Results\n\n';

  if (noWebsite.length > 0) {
    output += `### 🔴 HIGH PRIORITY - No Website (${noWebsite.length})\n`;
    noWebsite.forEach(lead => {
      output += `- **${lead.companyName}** - No online presence detected\n`;
      output += `  Score: ${lead.score}/100 | ${lead.phone || 'No phone'} | ${lead.rating ? `⭐ ${lead.rating}` : ''}\n`;
    });
    output += '\n';
  }

  if (broken.length > 0) {
    output += `### 🔴 HIGH PRIORITY - Broken Websites (${broken.length})\n`;
    broken.forEach(lead => {
      output += `- **${lead.companyName}** - ${lead.website}\n`;
      output += `  Issues: ${lead.websiteAnalysis?.issues.slice(0, 2).join(', ')}\n`;
      output += `  Score: ${lead.score}/100\n`;
    });
    output += '\n';
  }

  if (poor.length > 0) {
    output += `### 🔴 HIGH PRIORITY - Poor Quality (${poor.length})\n`;
    poor.forEach(lead => {
      output += `- **${lead.companyName}** - ${lead.website}\n`;
      output += `  Issues: ${lead.websiteAnalysis?.issues.slice(0, 2).join(', ')}\n`;
      output += `  Score: ${lead.score}/100\n`;
    });
    output += '\n';
  }

  if (outdated.length > 0) {
    output += `### 🟡 MEDIUM PRIORITY - Outdated (${outdated.length})\n`;
    outdated.forEach(lead => {
      const lastUpdate = lead.websiteAnalysis?.lastUpdated || 'Unknown';
      output += `- **${lead.companyName}** - Last updated: ${lastUpdate}\n`;
      output += `  Score: ${lead.score}/100\n`;
    });
    output += '\n';
  }

  if (good.length > 0) {
    output += `### 🟢 LOW PRIORITY - Good Websites (${good.length})\n`;
    good.forEach(lead => {
      output += `- **${lead.companyName}** - Website in good condition\n`;
      output += `  Score: ${lead.score}/100\n`;
    });
    output += '\n';
  }

  // Summary
  output += '---\n';
  output += `**Total leads analyzed:** ${leads.length}\n`;
  output += `**High priority (no site/broken/poor):** ${noWebsite.length + broken.length + poor.length}\n`;
  output += `**Medium priority (outdated):** ${outdated.length}\n`;

  return output;
}

// ============================================
// TOOL IMPLEMENTATION
// ============================================

export async function generateLeads(params: z.infer<typeof leadsSchema> & { projectId: string }) {
  console.log('[Leads] ===== FUNCTION CALLED =====');
  console.log('[Leads] Params:', JSON.stringify(params, null, 2));
  console.log('[Leads] SERPAPI_KEY exists:', !!process.env.SERPAPI_KEY);
  console.log('[Leads] SERPAPI_KEY value (first 10 chars):', process.env.SERPAPI_KEY?.substring(0, 10));

  // Apply defaults for optional params
  const {
    category,
    location,
    numberOfLeads = 20,
    analyzeWebsites = true,
    projectId
  } = params;

  try {
    console.log(`[Leads] Searching for ${category} in ${location}...`);

    // 1. Build ICP
    const icp: ICP = {
      targetIndustries: [category],
      targetLocation: location,
      painPoints: ['Needs website improvement', 'Missing online presence'],
      solutionType: 'web design',
    };

    // 2. Search Google Maps via SerpAPI (with Tavily fallback)
    const businesses = await searchGoogleMapsBusinesses(
      `${category} near ${location}`,
      location,
      { limit: numberOfLeads * 2 } // Get extra to filter
    );

    if (businesses.length === 0) {
      return {
        success: false,
        error: 'No businesses found for the given category and location.',
      };
    }

    console.log(`[Leads] Found ${businesses.length} businesses, enriching...`);

    // 3. Enrich leads with website analysis and scoring
    // Process in batches to avoid overwhelming
    const enrichedLeads: Lead[] = [];
    const batchSize = 5;

    for (let i = 0; i < Math.min(businesses.length, numberOfLeads); i += batchSize) {
      const batch = businesses.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(biz => enrichLeadWithAnalysis(biz, icp, analyzeWebsites))
      );
      enrichedLeads.push(...batchResults);
    }

    // 4. Sort by score (highest opportunity first)
    const sortedLeads = enrichedLeads.sort((a, b) => b.score - a.score);

    // 5. Save to dedicated leads table
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Insert leads into dedicated table
    const leadsToInsert = sortedLeads.map(lead => ({
      project_id: projectId,
      company_name: lead.companyName,
      industry: lead.industry,
      website: lead.website,
      phone: lead.phone,
      address: lead.address,
      place_id: lead.placeId,
      rating: lead.rating,
      review_count: lead.reviewCount,
      coordinates: lead.coordinates,
      website_analysis: lead.websiteAnalysis,
      score: lead.score,
      score_breakdown: lead.scoreBreakdown,
      pain_points: lead.painPoints,
      icp_score: lead.icpScore,
      icp_match_reasons: lead.icpMatchReasons,
      suggested_angle: lead.suggestedAngle,
      status: lead.status,
      priority: lead.priority,
    }));

    // First, delete existing leads for this project (fresh search)
    await supabase
      .from('leads')
      .delete()
      .eq('project_id', projectId);

    // Insert new leads
    const { error: insertError } = await supabase
      .from('leads')
      .insert(leadsToInsert);

    if (insertError) {
      console.error('[Leads] Failed to insert leads:', insertError);
      // Continue anyway - we'll still show results
    }

    // 6. Also save to artifacts for backwards compatibility
    const leadsArtifact: LeadsArtifact = {
      leads: sortedLeads,
      idealCustomerProfile: {
        industries: icp.targetIndustries,
        companySize: 'small-medium',
        painPoints: icp.painPoints,
        budget: 'Varies',
      },
      searchCriteria: `${category} in ${location}`,
      searchSummary: {
        totalFound: businesses.length,
        qualified: sortedLeads.filter(l => l.score >= 50).length,
        returned: sortedLeads.length,
        topIndustries: [...new Set(sortedLeads.map(l => l.industry))].slice(0, 3),
        avgScore: sortedLeads.length > 0
          ? parseFloat((sortedLeads.reduce((sum, l) => sum + l.score, 0) / sortedLeads.length).toFixed(1))
          : 0,
      },
      icpInsights: {
        strongestVertical: category,
        commonPainPoint: sortedLeads[0]?.painPoints[0] || 'Needs online presence',
        recommendedFocus: `Focus on ${sortedLeads.filter(l => l.score >= 70).length} high-priority leads first`,
      },
    };

    const { error: artifactError } = await supabase
      .from('artifacts')
      .upsert(
        {
          project_id: projectId,
          type: 'leads',
          data: leadsArtifact,
          version: 1,
        },
        { onConflict: 'project_id,type' }
      );

    if (artifactError) {
      console.error('[Leads] Failed to save leads artifact:', artifactError);
    } else {
      console.log('[Leads] Successfully saved leads artifact with', sortedLeads.length, 'leads');
    }

    // 7. Format output for chat
    const chatOutput = formatLeadsForChat(sortedLeads);

    // 8. Generate summary
    const highPriority = sortedLeads.filter(l =>
      l.websiteAnalysis?.status === 'none' ||
      l.websiteAnalysis?.status === 'broken' ||
      l.websiteAnalysis?.status === 'poor'
    ).length;
    const avgScore = leadsArtifact.searchSummary?.avgScore || 0;

    return {
      success: true,
      leads: sortedLeads,
      chatOutput,
      summary: `🎯 Found ${sortedLeads.length} leads in ${location}. **${highPriority} high-priority** (no/broken/poor website). Average opportunity score: ${avgScore}/100.`,
    };
  } catch (error) {
    console.error('[Leads] Generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
