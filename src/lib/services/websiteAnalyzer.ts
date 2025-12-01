/**
 * Website Quality Analyzer Service
 *
 * Analyzes websites to determine quality and identify opportunities
 * for businesses that need website services.
 */

import type { WebsiteAnalysis } from '@/types/database';

// ============================================
// TYPES
// ============================================

export interface AnalysisResult extends WebsiteAnalysis {
  analyzedAt: string;
  url?: string;
}

// ============================================
// MAIN ANALYSIS FUNCTION
// ============================================

/**
 * Analyze a website's quality and determine opportunity score
 *
 * Status levels:
 * - none: No website = HIGHEST priority (score: 100)
 * - broken: Website returns errors = HIGH priority (score: 85-95)
 * - poor: Multiple issues = HIGH priority (score: 60-80)
 * - outdated: Some issues = MEDIUM priority (score: 30-50)
 * - good: Few/no issues = LOW priority (score: 5-25)
 */
export async function analyzeWebsite(url: string | undefined): Promise<AnalysisResult> {
  const now = new Date().toISOString();

  // No website = highest priority lead
  if (!url) {
    return {
      status: 'none',
      score: 100,
      issues: ['No website detected - highest priority for web services'],
      hasSSL: false,
      analyzedAt: now,
    };
  }

  // Normalize URL
  let normalizedUrl = url;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    normalizedUrl = `https://${url}`;
  }

  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const startTime = Date.now();

    const response = await fetch(normalizedUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BusinessAnalyzer/1.0; +http://example.com/bot)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    const loadTime = Date.now() - startTime;

    // Check for error responses
    if (!response.ok) {
      return {
        status: 'broken',
        score: 90,
        issues: [`Website returns ${response.status} error - needs replacement`],
        hasSSL: normalizedUrl.startsWith('https'),
        loadTime,
        analyzedAt: now,
        url: normalizedUrl,
      };
    }

    // Get HTML content
    const html = await response.text();

    // Analyze the HTML
    const analysis = analyzeHTMLContent(html, normalizedUrl, loadTime);
    return {
      ...analysis,
      analyzedAt: now,
      url: normalizedUrl,
    };
  } catch (error) {
    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          status: 'broken',
          score: 85,
          issues: ['Website takes too long to load (>10 seconds)'],
          hasSSL: normalizedUrl.startsWith('https'),
          analyzedAt: now,
          url: normalizedUrl,
        };
      }

      // DNS/Network errors
      if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
        return {
          status: 'broken',
          score: 95,
          issues: ['Domain not found or DNS error - website does not exist'],
          hasSSL: false,
          analyzedAt: now,
          url: normalizedUrl,
        };
      }

      // SSL/Certificate errors
      if (error.message.includes('certificate') || error.message.includes('SSL')) {
        return {
          status: 'broken',
          score: 85,
          issues: ['SSL certificate error - security issue'],
          hasSSL: false,
          analyzedAt: now,
          url: normalizedUrl,
        };
      }
    }

    // Generic connection error
    return {
      status: 'broken',
      score: 85,
      issues: ['Website unreachable or connection error'],
      hasSSL: normalizedUrl.startsWith('https'),
      analyzedAt: now,
      url: normalizedUrl,
    };
  }
}

// ============================================
// HTML ANALYSIS
// ============================================

/**
 * Analyze HTML content for quality indicators
 */
function analyzeHTMLContent(
  html: string,
  url: string,
  loadTime: number
): WebsiteAnalysis {
  const issues: string[] = [];
  let score = 0;

  // 1. Check SSL
  const hasSSL = url.startsWith('https');
  if (!hasSSL) {
    issues.push('No SSL certificate (HTTP only) - security risk');
    score += 20;
  }

  // 2. Check for outdated copyright
  const copyrightMatch = html.match(/copyright\s*(?:&copy;|©|&#169;)?\s*(\d{4})/i);
  const copyrightYear = copyrightMatch ? parseInt(copyrightMatch[1]) : null;
  const currentYear = new Date().getFullYear();

  if (copyrightYear && copyrightYear < currentYear - 2) {
    issues.push(`Copyright shows ${copyrightYear} - website likely outdated`);
    score += 30;
  }

  // 3. Check for mobile responsiveness
  const hasViewport = html.includes('viewport');
  const hasMediaQueries = html.includes('@media') || html.includes('responsive');
  const mobileResponsive = hasViewport || hasMediaQueries;

  if (!mobileResponsive) {
    issues.push('Not mobile responsive - poor mobile experience');
    score += 25;
  }

  // 4. Check for outdated HTML patterns
  const usesTableLayout = (html.match(/<table/gi) || []).length > 5;
  const usesFontTags = /<font\s/i.test(html);
  const usesFrames = /<frame|<frameset/i.test(html);
  const usesMarquee = /<marquee/i.test(html);

  if (usesFontTags || usesFrames || usesMarquee) {
    issues.push('Uses very outdated HTML (font tags/frames/marquee)');
    score += 30;
  } else if (usesTableLayout) {
    issues.push('Uses table-based layout - outdated design approach');
    score += 15;
  }

  // 5. Check load time
  if (loadTime > 8000) {
    issues.push(`Very slow load time: ${(loadTime / 1000).toFixed(1)}s`);
    score += 20;
  } else if (loadTime > 5000) {
    issues.push(`Slow load time: ${(loadTime / 1000).toFixed(1)}s`);
    score += 10;
  }

  // 6. Check for basic SEO
  const hasTitle = /<title[^>]*>[^<]+<\/title>/i.test(html);
  const hasMetaDesc = /meta.*name=["']description["']/i.test(html);
  const hasH1 = /<h1[^>]*>/i.test(html);

  if (!hasTitle) {
    issues.push('Missing page title - poor SEO');
    score += 10;
  }
  if (!hasMetaDesc) {
    issues.push('Missing meta description - poor SEO');
    score += 5;
  }
  if (!hasH1) {
    issues.push('Missing H1 heading - poor SEO structure');
    score += 5;
  }

  // 7. Check for contact methods
  const hasContactForm = /type=["']email["']|<form.*contact|contact.*form/i.test(html);
  const hasPhone = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(html);

  // 8. Check for social links
  const socialPatterns = [
    /facebook\.com/i,
    /twitter\.com|x\.com/i,
    /instagram\.com/i,
    /linkedin\.com/i,
    /youtube\.com/i,
  ];
  const socialLinks = socialPatterns
    .filter(pattern => pattern.test(html))
    .map(pattern => {
      const match = pattern.toString();
      if (match.includes('facebook')) return 'Facebook';
      if (match.includes('twitter') || match.includes('x.com')) return 'Twitter/X';
      if (match.includes('instagram')) return 'Instagram';
      if (match.includes('linkedin')) return 'LinkedIn';
      if (match.includes('youtube')) return 'YouTube';
      return 'Social';
    });

  // 9. Detect technologies
  const technologies: string[] = [];
  if (/wordpress|wp-content/i.test(html)) technologies.push('WordPress');
  if (/wix\.com/i.test(html)) technologies.push('Wix');
  if (/squarespace/i.test(html)) technologies.push('Squarespace');
  if (/shopify/i.test(html)) technologies.push('Shopify');
  if (/react|__NEXT_DATA__|next\.js/i.test(html)) technologies.push('React/Next.js');
  if (/vue\.js|nuxt/i.test(html)) technologies.push('Vue/Nuxt');
  if (/bootstrap/i.test(html)) technologies.push('Bootstrap');
  if (/tailwind/i.test(html)) technologies.push('Tailwind CSS');
  if (/jquery/i.test(html)) technologies.push('jQuery');

  // 10. Check for Flash (very outdated)
  if (/\.swf|<embed.*flash|<object.*flash/i.test(html)) {
    issues.push('Uses Flash content - completely obsolete');
    score += 25;
  }

  // 11. Check for modern framework indicators (reduces score if modern)
  const isModern =
    technologies.includes('React/Next.js') ||
    technologies.includes('Vue/Nuxt') ||
    technologies.includes('Tailwind CSS');

  if (isModern) {
    // Modern site, reduce score
    score = Math.max(0, score - 15);
  }

  // Cap score at 80 for existing websites (save 100 for no website)
  score = Math.min(score, 80);

  // Determine status based on score
  let status: WebsiteAnalysis['status'];
  if (score >= 50) {
    status = 'poor';
  } else if (score >= 25) {
    status = 'outdated';
  } else {
    status = 'good';
  }

  return {
    status,
    score,
    issues: issues.length > 0 ? issues : ['Website appears to be in good condition'],
    lastUpdated: copyrightYear ? String(copyrightYear) : undefined,
    technologies: technologies.length > 0 ? technologies : undefined,
    hasSSL,
    loadTime,
    mobileResponsive,
    hasContactForm,
    socialLinks: socialLinks.length > 0 ? socialLinks : undefined,
  };
}

// ============================================
// BATCH ANALYSIS
// ============================================

/**
 * Analyze multiple websites in parallel
 * Returns Map of URL -> AnalysisResult
 */
export async function analyzeMultipleWebsites(
  urls: (string | undefined)[],
  concurrency: number = 5
): Promise<Map<string | undefined, AnalysisResult>> {
  const results = new Map<string | undefined, AnalysisResult>();

  // Process in batches to avoid overwhelming servers
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (url) => {
        const analysis = await analyzeWebsite(url);
        return { url, analysis };
      })
    );

    batchResults.forEach(({ url, analysis }) => {
      results.set(url, analysis);
    });
  }

  return results;
}

// ============================================
// SCORING UTILITIES
// ============================================

/**
 * Get priority level based on website analysis
 */
export function getWebsitePriority(analysis: WebsiteAnalysis): 'high' | 'medium' | 'low' {
  if (analysis.status === 'none' || analysis.status === 'broken' || analysis.status === 'poor') {
    return 'high';
  }
  if (analysis.status === 'outdated') {
    return 'medium';
  }
  return 'low';
}

/**
 * Format analysis for display in chat
 */
export function formatAnalysisForChat(analysis: AnalysisResult, businessName?: string): string {
  const name = businessName || 'Business';
  const priority = getWebsitePriority(analysis);

  let output = `**${name}**\n`;
  output += `Status: ${analysis.status.toUpperCase()} | Score: ${analysis.score}/100 | Priority: ${priority.toUpperCase()}\n`;

  if (analysis.issues.length > 0) {
    output += `Issues:\n`;
    analysis.issues.forEach(issue => {
      output += `  - ${issue}\n`;
    });
  }

  if (analysis.technologies && analysis.technologies.length > 0) {
    output += `Tech: ${analysis.technologies.join(', ')}\n`;
  }

  return output;
}

/**
 * Group businesses by website status for summary
 */
export function groupByWebsiteStatus(
  analyses: Map<string, AnalysisResult>
): {
  none: string[];
  broken: string[];
  poor: string[];
  outdated: string[];
  good: string[];
} {
  const groups = {
    none: [] as string[],
    broken: [] as string[],
    poor: [] as string[],
    outdated: [] as string[],
    good: [] as string[],
  };

  analyses.forEach((analysis, key) => {
    groups[analysis.status].push(key);
  });

  return groups;
}
