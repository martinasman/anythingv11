/**
 * First Week Plan Tool
 *
 * Generates a comprehensive 7-day action plan to land first client.
 * Uses AI to create personalized, actionable steps with revenue projections.
 * Integrates with business plan pricing for realistic targets.
 */

import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import type { FirstWeekPlanArtifact, BusinessPlanArtifact } from '@/types/database';

// ============================================
// SCHEMA DEFINITION
// ============================================

export const firstWeekPlanSchema = z.object({
  businessType: z.string().describe('Type of business (e.g., "website design agency", "SMMA", "marketing consultant")'),
  offer: z
    .object({
      name: z.string(),
      price: z.number(),
      deliverables: z.array(z.string()),
    })
    .optional()
    .describe('The main offer being sold - if not provided, will pull from business plan'),
  targetMarket: z.string().describe('Who the ideal customer is'),
  hasExistingNetwork: z.boolean().optional().describe('Whether user has existing professional network'),
  hasPortfolio: z.boolean().optional().describe('Whether user has existing work samples'),
  location: z.string().optional().describe('User location for local outreach strategies'),
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

async function generateAIFirstWeekPlan(
  businessType: string,
  quickWinPackage: { name: string; price: number; deliverables: string[] },
  targetMarket: string,
  hasNetwork: boolean,
  hasPortfolio: boolean,
  location?: string
): Promise<FirstWeekPlanArtifact | null> {
  if (!OPENROUTER_API_KEY) {
    console.warn('[FirstWeekPlan] No OpenRouter API key, using fallback');
    return null;
  }

  const prompt = `You are a business launch expert. Generate a detailed 7-day action plan to land the first paying client for a new ${businessType} business.

CONTEXT:
- Business Type: ${businessType}
- Quick Win Package: "${quickWinPackage.name}" at $${quickWinPackage.price}
- Deliverables: ${quickWinPackage.deliverables.join(', ')}
- Target Market: ${targetMarket}
- Location: ${location || 'Remote/Online'}
- Has Existing Network: ${hasNetwork ? 'Yes - leverage personal connections' : 'No - rely on cold outreach'}
- Has Portfolio: ${hasPortfolio ? 'Yes - can show existing work' : 'No - need to create samples first'}

Generate a JSON response with this EXACT structure (no markdown, just JSON):
{
  "strategy": "One-sentence summary of the overall week strategy",
  "quickestPath": "The fastest path to first client in 2-3 sentences",
  "fallbackPlan": "What to do if primary strategy doesn't work",
  "quickWinPackage": {
    "name": "${quickWinPackage.name}",
    "price": ${quickWinPackage.price},
    "deliverables": ${JSON.stringify(quickWinPackage.deliverables)},
    "deliveryTime": "Realistic delivery timeframe",
    "targetConversionRate": "Expected % of prospects that convert",
    "estimatedTimeToClose": "Average time from first contact to signed deal"
  },
  "firstClientStrategy": {
    "primaryChannel": "Main outreach channel (cold email, phone, LinkedIn, etc.)",
    "specificOffer": "The exact offer/hook to use in outreach",
    "urgencyElement": "How to create urgency (limited time, limited spots, etc.)",
    "targetOutreachVolume": number of people to contact in week 1,
    "expectedResponseRate": "Realistic response rate percentage"
  },
  "revenueProjections": {
    "week1": { "optimistic": number, "realistic": number, "conservative": number },
    "week2": { "optimistic": number, "realistic": number, "conservative": number },
    "week4": { "optimistic": number, "realistic": number, "conservative": number },
    "assumptions": ["List of assumptions these projections are based on"]
  },
  "days": [
    {
      "day": 1,
      "theme": "Theme for the day",
      "goal": "Specific goal for the day",
      "metrics": ["Measurable outcomes for the day"],
      "tasks": [
        {
          "task": "Specific task name",
          "duration": "Time estimate (e.g., '2 hours')",
          "priority": "critical" | "high" | "medium",
          "details": "Detailed instructions for completing the task",
          "script": "Optional: actual scripts, templates, or copy to use"
        }
      ]
    }
  ],
  "expectedMetrics": {
    "totalOutreach": number,
    "expectedResponses": "X-Y (percentage range)",
    "expectedCalls": "X-Y",
    "expectedCloses": "X-Y",
    "expectedRevenue": "$X - $Y"
  },
  "criticalSuccessFactors": ["List of 5-7 most important things to get right"]
}

REQUIREMENTS:
1. Each day should have 3-5 specific, actionable tasks
2. Day 1-2 should focus on preparation and initial outreach
3. Day 3-4 should focus on follow-ups and delivering value
4. Day 5-6 should focus on closing deals
5. Day 7 should focus on onboarding first client and preparing week 2
6. Include actual scripts and templates where helpful
7. Be realistic - this is for someone just starting out
8. Revenue projections should be based on the $${quickWinPackage.price} package price
9. If they ${hasNetwork ? 'have' : 'don\'t have'} a network, adjust day 1 accordingly
10. If they ${hasPortfolio ? 'have' : 'don\'t have'} a portfolio, add portfolio-building tasks if needed`;

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

    // Parse JSON from response (handle markdown code blocks if present)
    let jsonContent = content;
    if (content.includes('```json')) {
      jsonContent = content.split('```json')[1].split('```')[0];
    } else if (content.includes('```')) {
      jsonContent = content.split('```')[1].split('```')[0];
    }

    const plan = JSON.parse(jsonContent.trim());

    // Validate required fields
    if (!plan.strategy || !plan.days || !plan.expectedMetrics) {
      throw new Error('AI response missing required fields');
    }

    return {
      strategy: plan.strategy,
      quickestPath: plan.quickestPath,
      fallbackPlan: plan.fallbackPlan,
      days: plan.days,
      expectedMetrics: plan.expectedMetrics,
      criticalSuccessFactors: plan.criticalSuccessFactors,
      taskCompletion: {},
      quickWinPackage: plan.quickWinPackage,
      firstClientStrategy: plan.firstClientStrategy,
      revenueProjections: plan.revenueProjections,
    };
  } catch (error) {
    console.error('[FirstWeekPlan] AI generation failed:', error);
    return null;
  }
}

// ============================================
// FALLBACK TEMPLATE
// ============================================

function generateFallbackPlan(
  businessType: string,
  quickWinPackage: { name: string; price: number; deliverables: string[] },
  targetMarket: string,
  hasNetwork: boolean,
  hasPortfolio: boolean
): FirstWeekPlanArtifact {
  const price = quickWinPackage.price;
  const packageName = quickWinPackage.name;

  return {
    strategy: `Local business outreach with free value-add offer to convert prospects to ${packageName}`,
    quickestPath: hasNetwork
      ? `Leverage your existing network first - reach out to 10 people who might know businesses that need help, get warm intros, close 1-2 in the first week`
      : `Find 50 businesses in your target market, send personalized outreach with free value offer, convert 1-2 to ${packageName}`,
    fallbackPlan: `If no responses by Day 5, pivot to: 1) Join local business Facebook/LinkedIn groups, 2) Offer even lower "trial" pricing, 3) Partner with complementary service providers for referrals`,

    quickWinPackage: {
      name: packageName,
      price: price,
      deliverables: quickWinPackage.deliverables,
      deliveryTime: '5-7 business days',
      targetConversionRate: '2-5%',
      estimatedTimeToClose: '3-5 days from first contact',
    },

    firstClientStrategy: {
      primaryChannel: hasNetwork ? 'Warm referrals + LinkedIn' : 'Cold email + LinkedIn',
      specificOffer: `Free ${businessType} audit/mockup with no obligation - if you like it, we can discuss ${packageName}`,
      urgencyElement: 'Only taking 3 new clients this month to ensure quality',
      targetOutreachVolume: 50,
      expectedResponseRate: hasNetwork ? '15-25%' : '5-15%',
    },

    revenueProjections: {
      week1: {
        optimistic: price * 2,
        realistic: price,
        conservative: 0,
      },
      week2: {
        optimistic: price * 3,
        realistic: price * 2,
        conservative: price,
      },
      week4: {
        optimistic: price * 6,
        realistic: price * 4,
        conservative: price * 2,
      },
      assumptions: [
        `${price} ${packageName} price point`,
        `${hasNetwork ? '15-25%' : '5-15%'} response rate on outreach`,
        '2-5% conversion rate from response to paid client',
        '50 prospects contacted in week 1',
        'Referrals start coming in weeks 2-4',
      ],
    },

    days: [
      {
        day: 1,
        theme: hasPortfolio ? 'Research & Outreach Prep' : 'Portfolio Building & Research',
        goal: hasPortfolio
          ? 'Build prospect list of 50 businesses and prepare outreach materials'
          : 'Create 2-3 portfolio samples and build prospect list',
        metrics: [
          '50 target businesses identified',
          hasPortfolio ? 'Outreach templates created' : '2-3 portfolio samples created',
          'Contact info for 30+ decision makers',
        ],
        tasks: [
          ...(hasNetwork
            ? [
                {
                  task: 'Reach out to 10 people in your network',
                  duration: '1 hour',
                  priority: 'critical' as const,
                  details:
                    'Text/call friends, family, former colleagues. Ask: "Do you know any business owners who might need help with [your service]?" Personal connections convert 10x better than cold outreach.',
                },
              ]
            : []),
          ...(!hasPortfolio
            ? [
                {
                  task: 'Create 2-3 sample portfolio pieces',
                  duration: '3 hours',
                  priority: 'critical' as const,
                  details: `Create mock projects for fictional businesses in your target market (${targetMarket}). These will serve as proof of your capabilities. Make them high-quality and relevant to your ideal clients.`,
                },
              ]
            : []),
          {
            task: `Find 50 ${targetMarket} businesses that could use your services`,
            duration: '2 hours',
            priority: 'critical' as const,
            details: `Use Google Maps, LinkedIn, industry directories to find businesses. Look for signs they need help: outdated presence, negative reviews mentioning areas you can improve, competitors doing better. Create spreadsheet with: Business Name, Contact Name, Email, Phone, Current Status, Notes.`,
          },
          {
            task: 'Research decision makers and gather contact info',
            duration: '2 hours',
            priority: 'critical' as const,
            details:
              'Find owner/manager names via LinkedIn, Facebook business pages, company websites. Get direct emails (use Hunter.io or similar). Quality contacts matter more than quantity.',
          },
          {
            task: 'Create your outreach templates',
            duration: '1 hour',
            priority: 'high' as const,
            details:
              'Prepare email template, LinkedIn message template, and phone script. Focus on value first, not selling. Your goal is to start a conversation, not close a deal.',
          },
        ],
      },

      {
        day: 2,
        theme: 'Cold Outreach Blitz',
        goal: 'Send 25 personalized outreach messages',
        metrics: ['25 emails/messages sent', '5+ opens/views', '1-3 responses'],
        tasks: [
          {
            task: 'Send 25 personalized cold emails',
            duration: '3 hours',
            priority: 'critical' as const,
            details:
              'Personalize each email with specific observations about their business. Keep under 100 words. Clear call-to-action. Track opens if possible.',
            script: `Subject: Quick question about [Business Name]

Hi [Name],

I noticed [specific observation about their business - be specific, not generic].

I help ${targetMarket} businesses with [your service]. I'd love to show you [free value offer] - no cost, no obligation.

Worth a 15-minute call this week?

[Your Name]
[Your Website/Portfolio]`,
          },
          {
            task: 'Connect with 20 decision makers on LinkedIn',
            duration: '1 hour',
            priority: 'high' as const,
            details:
              "Send connection requests with personalized notes. Don't pitch in the request - just mention you're in the same industry or admire their business.",
          },
          {
            task: 'Set up email tracking',
            duration: '30 min',
            priority: 'medium' as const,
            details:
              'Use Mailtrack, Streak, or similar to track opens. This helps you know who to prioritize for follow-ups.',
          },
        ],
      },

      {
        day: 3,
        theme: 'Multi-Channel Push',
        goal: 'Send 25 more outreaches + start follow-ups',
        metrics: ['50 total outreaches sent', '3-5 total responses', '1-2 calls booked'],
        tasks: [
          {
            task: 'Send 25 more personalized outreaches',
            duration: '2.5 hours',
            priority: 'critical' as const,
            details:
              'Target different segment than Day 2. Test different subject lines or approaches. Track what gets best response.',
          },
          {
            task: 'Follow up on Day 2 non-responders',
            duration: '1 hour',
            priority: 'critical' as const,
            details: 'Short, friendly follow-up. Add new value or angle. "Bumping this to the top of your inbox..."',
            script: `Subject: Re: Quick question about [Business Name]

Hi [Name],

Just following up on my note from yesterday. I put together [specific value-add for them] - happy to share it with you, no strings attached.

Would a quick 10-minute call work this week?

[Your Name]`,
          },
          {
            task: 'Call 10 warm prospects',
            duration: '1.5 hours',
            priority: 'high' as const,
            details:
              "Call businesses that opened emails or engaged on LinkedIn. They've shown interest - now convert that to a conversation.",
            script: `"Hi, is this [Name]? This is [Your Name]. I sent you an email about [your service] - did you get a chance to see it? I have some specific ideas that could help [Business Name] with [specific problem]. Do you have 2 minutes right now, or should I schedule a better time?"`,
          },
        ],
      },

      {
        day: 4,
        theme: 'Deliver Value & Book Calls',
        goal: 'Deliver free value to interested prospects, book discovery calls',
        metrics: ['3-5 value deliverables sent', '2-3 discovery calls booked', 'First proposal drafted'],
        tasks: [
          {
            task: 'Create and deliver free value to interested prospects',
            duration: '2-3 hours',
            priority: 'critical' as const,
            details: `For everyone who responded positively, create a personalized [audit/mockup/analysis]. Make it genuinely valuable - this is your proof of capability. Record a Loom video walking through it.`,
          },
          {
            task: 'Send all outstanding follow-ups',
            duration: '1 hour',
            priority: 'critical' as const,
            details: 'Anyone who hasn\'t responded gets a final "Is this still relevant?" check-in. Keep it short and low-pressure.',
          },
          {
            task: 'Prepare proposal template',
            duration: '1 hour',
            priority: 'high' as const,
            details: `Create a professional proposal document for "${packageName}" at $${price}. Include: problem statement, your solution, deliverables, timeline, investment, and clear next steps. Make it easy to customize for each prospect.`,
          },
          {
            task: 'Schedule and confirm all booked calls',
            duration: '30 min',
            priority: 'high' as const,
            details: 'Send calendar invites with agenda. Confirm 24 hours before. Set up your call environment.',
          },
        ],
      },

      {
        day: 5,
        theme: 'Discovery Calls & Proposals',
        goal: 'Conduct discovery calls, send proposals',
        metrics: ['2-3 discovery calls completed', '1-2 proposals sent', 'Pipeline qualified'],
        tasks: [
          {
            task: 'Conduct discovery calls',
            duration: '2-3 hours',
            priority: 'critical' as const,
            details: `Ask about their goals, current challenges, timeline, and budget. Listen more than you talk. Take detailed notes. Qualify: Are they decision-makers? Do they have budget? Is the timing right?`,
            script: `Discovery Call Framework:
1. Build rapport (2 min): "Thanks for taking the time. Tell me a bit about [Business Name]."
2. Understand current situation (5 min): "What's working well right now? What's frustrating?"
3. Identify goals (5 min): "If we could wave a magic wand, what would ideal look like?"
4. Discuss timing/budget (3 min): "When are you looking to make a change? Do you have a budget in mind?"
5. Present solution (5 min): "Based on what you've shared, here's how I can help..."
6. Next steps (2 min): "I'll send over a proposal by [time]. Can we reconnect [specific time] to discuss?"`,
          },
          {
            task: 'Send customized proposals',
            duration: '1-2 hours',
            priority: 'critical' as const,
            details: `Customize proposal based on discovery call. Reference specific pain points they mentioned. Include "${packageName}" at $${price}. Create urgency with "proposal valid for 48 hours" or similar.`,
          },
          {
            task: 'Continue pipeline building',
            duration: '1 hour',
            priority: 'high' as const,
            details: "Don't stop outreach even if you have hot leads. Send 10 more messages to new prospects.",
          },
        ],
      },

      {
        day: 6,
        theme: 'Close First Client',
        goal: 'Get signed contract and deposit',
        metrics: ['1+ contract signed', 'First payment received', '2-3 referral asks made'],
        tasks: [
          {
            task: 'Follow up on all open proposals',
            duration: '2 hours',
            priority: 'critical' as const,
            details: `Call everyone who received a proposal. Don't wait for them to respond. Ask: "Did you get a chance to review the proposal? What questions do you have?" Be prepared to handle objections.`,
            script: `Objection Handling:

"Too expensive" → "I understand. What budget did you have in mind? I might be able to adjust the scope."

"Need to think about it" → "Of course. What specifically would help you make a decision? Maybe I can address that now."

"Need to talk to partner" → "Makes sense. When will you discuss? Can I follow up [specific day]?"

Close: "What would it take to get started today? I can begin work as early as [date]."`,
          },
          {
            task: 'If closed: Collect payment and ask for referrals',
            duration: '1 hour',
            priority: 'critical' as const,
            details: `Send invoice/contract immediately. Collect 50% upfront or full payment. Then: "I'm so excited to work together! Quick question - do you know 2-3 other business owners who might need similar help?"`,
          },
          {
            task: 'If not closed: Send "take-away" email',
            duration: '30 min',
            priority: 'high' as const,
            details: 'Create final urgency. "I have another project starting next week, so this is the last day for [special pricing/bonus]. Let me know by 5pm if you want to move forward."',
          },
          {
            task: 'Analyze what worked and adjust',
            duration: '1 hour',
            priority: 'medium' as const,
            details:
              'Review: Which outreach got responses? What objections came up? What resonated? Document everything for Week 2 optimization.',
          },
        ],
      },

      {
        day: 7,
        theme: 'Onboard & Scale',
        goal: 'Onboard first client professionally, prepare for Week 2',
        metrics: ['Client onboarded', '50 new prospects added', 'Week 2 outreach scheduled'],
        tasks: [
          {
            task: 'Send professional welcome/onboarding',
            duration: '1 hour',
            priority: 'critical' as const,
            details: `Welcome email with: project timeline, what you need from them, communication plan, first milestone date. Set expectations high from day one.`,
          },
          {
            task: 'Set up client project management',
            duration: '1 hour',
            priority: 'high' as const,
            details:
              'Create client folder, project board (Notion/Trello), communication channel. Share with client for transparency.',
          },
          {
            task: 'Build Week 2 prospect list',
            duration: '2 hours',
            priority: 'high' as const,
            details:
              'Focus on what worked in Week 1. If certain industries responded better, double down. Add 50 new qualified prospects.',
          },
          {
            task: 'Schedule Week 2 outreach',
            duration: '30 min',
            priority: 'high' as const,
            details:
              'Block time on calendar for outreach. Prepare templates based on Week 1 learnings. Monday should start with outreach.',
          },
          {
            task: 'Document Week 1 learnings',
            duration: '30 min',
            priority: 'medium' as const,
            details:
              'Write down: best performing messages, common objections, ideal client profile refinements, pricing feedback. This is gold for Week 2.',
          },
        ],
      },
    ],

    expectedMetrics: {
      totalOutreach: 50,
      expectedResponses: hasNetwork ? '8-15 (15-25%)' : '3-8 (5-15%)',
      expectedCalls: hasNetwork ? '4-8' : '2-5',
      expectedCloses: '1-2',
      expectedRevenue: `$${price} - $${price * 2}`,
    },

    criticalSuccessFactors: [
      'Personalize every outreach message - no copy-paste templates',
      'Follow up within 24 hours of any positive response',
      'Always lead with free value before asking for money',
      'Track everything - response rates, objections, what works',
      "Don't give up after one message - most deals close after 3+ touches",
      `Target businesses that can actually afford $${price} - avoid broke prospects`,
      'Handle objections in real-time on calls - don\'t let "I\'ll think about it" linger',
    ],

    taskCompletion: {},
  };
}

// ============================================
// TOOL IMPLEMENTATION
// ============================================

export async function generateFirstWeekPlan(
  params: z.infer<typeof firstWeekPlanSchema> & { projectId: string }
) {
  const {
    businessType,
    offer,
    targetMarket,
    hasExistingNetwork = false,
    hasPortfolio = false,
    location,
    projectId,
  } = params;

  try {
    // Initialize Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Try to get business plan for pricing info
    let quickWinPackage = offer
      ? {
          name: offer.name,
          price: offer.price,
          deliverables: offer.deliverables,
        }
      : null;

    if (!quickWinPackage) {
      // Fetch business plan to get Quick Win package
      const { data: businessPlanArtifact } = await (supabase
        .from('artifacts') as any)
        .select('data')
        .eq('project_id', projectId)
        .eq('type', 'business_plan')
        .single();

      if (businessPlanArtifact?.data) {
        const businessPlan = businessPlanArtifact.data as BusinessPlanArtifact;
        // Look for Quick Win or entry-level package
        const quickWin =
          businessPlan.servicePackages?.find(
            (p) =>
              p.name.toLowerCase().includes('quick') ||
              p.name.toLowerCase().includes('starter') ||
              p.name.toLowerCase().includes('basic') ||
              p.name.toLowerCase().includes('entry')
          ) || businessPlan.servicePackages?.[0];

        if (quickWin) {
          const priceNum = parseInt(quickWin.price.replace(/[^0-9]/g, ''));
          quickWinPackage = {
            name: quickWin.name,
            price: priceNum || 500,
            deliverables: quickWin.deliverables || [],
          };
        }
      }
    }

    // Default package if nothing found
    if (!quickWinPackage) {
      quickWinPackage = {
        name: 'Starter Package',
        price: 500,
        deliverables: ['Initial consultation', 'Basic deliverable', 'Email support'],
      };
    }

    // Try AI generation first
    let planData = await generateAIFirstWeekPlan(
      businessType,
      quickWinPackage,
      targetMarket,
      hasExistingNetwork,
      hasPortfolio,
      location
    );

    // Fallback to template if AI fails
    if (!planData) {
      planData = generateFallbackPlan(
        businessType,
        quickWinPackage,
        targetMarket,
        hasExistingNetwork,
        hasPortfolio
      );
    }

    // Save to Supabase
    const { data: artifact, error } = await (supabase
      .from('artifacts') as any)
      .upsert(
        {
          project_id: projectId,
          type: 'first_week_plan',
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
      console.error('Failed to save first week plan:', error);
      throw new Error('Failed to save plan');
    }

    // Format revenue projections for summary
    const projections = planData.revenueProjections;
    const revenueStr = projections
      ? `Week 1: $${projections.week1.conservative}-$${projections.week1.optimistic}, Week 4: $${projections.week4.conservative}-$${projections.week4.optimistic}`
      : planData.expectedMetrics.expectedRevenue;

    return {
      success: true,
      artifact,
      summary: `📅 Created your 7-day action plan to land your first client!

**Strategy:** ${planData.strategy}

**Quick Win Package:** ${planData.quickWinPackage?.name || quickWinPackage.name} at $${planData.quickWinPackage?.price || quickWinPackage.price}

**Revenue Projections:** ${revenueStr}

**Expected Outcomes:**
- Outreach: ${planData.expectedMetrics.totalOutreach} prospects
- Responses: ${planData.expectedMetrics.expectedResponses}
- Closes: ${planData.expectedMetrics.expectedCloses}

**Fastest Path:** ${planData.quickestPath}`,
    };
  } catch (error) {
    console.error('First week plan generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
