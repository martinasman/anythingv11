import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import type { OutreachArtifact, OutreachScript, Lead } from '@/types/database';

// ============================================
// SCHEMA DEFINITION
// ============================================

export const outreachSchema = z.object({
  businessType: z.string().describe('The type of business offering services'),
  brandName: z.string().describe('The business/agency name'),
  valueProposition: z.string().optional().describe('Core value proposition'),
  leads: z.array(z.object({
    id: z.string(),
    companyName: z.string(),
    industry: z.string(),
    painPoints: z.array(z.string()),
    contactName: z.string().optional(),
    contactTitle: z.string().optional(),
    buyingSignals: z.array(z.string()).optional(),
    suggestedAngle: z.string().optional(),
  })).describe('Leads to generate scripts for'),
});

// ============================================
// SCRIPT TEMPLATES BY BUSINESS TYPE
// ============================================

const CALL_TEMPLATES: Record<string, {
  opener: string;
  valueProps: string[];
  questions: string[];
  objections: Record<string, string>;
  close: string;
}> = {
  'ai automation': {
    opener: `Hi {contactName}, this is {agentName} from {brandName}. I noticed {companyName} is growing quickly, and I'm curious - are you still handling {painPoint} manually, or have you started exploring automation?`,
    valueProps: [
      'We help companies like yours save 20+ hours per week by automating repetitive tasks',
      'Our clients typically see ROI within the first 30 days',
      'We specialize in {industry} automation, so we understand your specific workflows',
    ],
    questions: [
      'What processes are taking up most of your team\'s time right now?',
      'Have you tried any automation tools before? What worked or didn\'t work?',
      'If you could automate one task tomorrow, what would have the biggest impact?',
      'Who else on your team would be involved in evaluating something like this?',
    ],
    objections: {
      'too expensive': 'I totally understand budget is a concern. Most of our clients find the automation pays for itself in saved hours within the first month. Would it help if I showed you a quick ROI calculation based on your specific situation?',
      'no time': 'That\'s exactly why automation makes sense - you\'re too busy doing manual work to evaluate tools that would free up your time. What if I could show you a 15-minute demo that reveals exactly how much time you could save?',
      'already have something': 'Great, you\'re already thinking about efficiency! What\'s working well with your current setup, and where do you see gaps? We often help companies extend or replace underperforming tools.',
      'need to think': 'Of course, this is an important decision. What specific questions do you need answered to feel confident moving forward?',
    },
    close: 'Based on what you\'ve shared, I think we could help {companyName} save significant time on {painPoint}. Would you be open to a 20-minute call this week where I can show you exactly how it would work for your team?',
  },
  'web design': {
    opener: `Hi {contactName}, this is {agentName} from {brandName}. I was just looking at {companyName}'s website, and I have a couple of ideas that could help you convert more visitors into customers. Do you have a quick minute?`,
    valueProps: [
      'We\'ve helped similar {industry} businesses increase their conversion rates by 40% or more',
      'Our websites are built for speed and mobile-first, which Google rewards with higher rankings',
      'We include ongoing support so your website stays fresh and secure',
    ],
    questions: [
      'When was the last time you updated your website?',
      'What percentage of your customers find you online vs. referrals?',
      'Are you happy with how your website looks on mobile?',
      'What action do you most want visitors to take on your site?',
    ],
    objections: {
      'too expensive': 'I hear you - it\'s an investment. But consider this: if a better website brings in even one or two extra customers per month, how quickly would that pay for itself?',
      'did it recently': 'That\'s great! How\'s it performing? If you\'re not seeing the results you hoped for, we offer conversion audits that can identify quick wins.',
      'do it myself': 'DIY platforms work for some people. The trade-off is usually time and optimization. How many hours a month do you spend on website maintenance?',
      'need to think': 'Absolutely, take your time. Would it be helpful if I sent over some examples of work we\'ve done for other {industry} businesses?',
    },
    close: 'I\'d love to put together a quick mockup showing what {companyName}\'s website could look like with some modern updates. Would you be interested in a free 15-minute consultation this week?',
  },
  'lead gen': {
    opener: `Hi {contactName}, this is {agentName} from {brandName}. We help {industry} companies fill their pipeline with qualified leads. I noticed {companyName} might benefit from a more consistent lead flow - is that something you\'re working on?`,
    valueProps: [
      'We deliver pre-qualified leads that match your ideal customer profile',
      'Our clients typically see 3-5x return on their investment',
      'We handle all the outreach so your team can focus on closing',
    ],
    questions: [
      'How are you currently generating new leads?',
      'What does your ideal customer look like?',
      'What\'s your biggest challenge with lead generation right now?',
      'How many new clients do you need to hit your growth targets?',
    ],
    objections: {
      'tried before': 'I understand - there are a lot of lead gen services that don\'t deliver. What went wrong with the previous one? We do things differently and I\'d love to explain how.',
      'too expensive': 'What\'s the lifetime value of a new customer for you? Our clients typically see positive ROI by their second or third converted lead.',
      'have referrals': 'Referrals are great - they\'re our best source too! The challenge is they\'re not predictable. What if you could add a consistent stream on top of referrals?',
      'need to think': 'Of course. What information would help you make a decision? I\'m happy to send over case studies from similar companies.',
    },
    close: 'It sounds like {companyName} could really benefit from a more predictable lead flow. Would you be open to a 20-minute strategy call where I can show you exactly how we\'d find and qualify leads for your business?',
  },
  'default': {
    opener: `Hi {contactName}, this is {agentName} from {brandName}. We specialize in helping {industry} businesses like {companyName} overcome challenges like {painPoint}. Is this something you\'re actively working on?`,
    valueProps: [
      'We\'ve helped dozens of companies in your space achieve measurable results',
      'Our approach is tailored specifically to your industry and needs',
      'Most clients see meaningful improvement within the first 30 days',
    ],
    questions: [
      'What\'s your biggest challenge right now?',
      'Have you tried solving this before? What worked or didn\'t?',
      'What would success look like for you?',
      'Who else would be involved in making this decision?',
    ],
    objections: {
      'too expensive': 'I understand budget is important. Most of our clients find the ROI justifies the investment. Would it help to see some specific numbers from similar companies?',
      'no time': 'I hear that a lot - everyone\'s stretched thin. That\'s actually why we exist: to take this off your plate. What if I showed you how little time it would actually require from you?',
      'not interested': 'No problem at all. Out of curiosity, is it the timing or do you have another solution in place?',
      'need to think': 'Of course, take your time. What questions can I answer to help you make a decision?',
    },
    close: 'Based on our conversation, I think we could really help {companyName}. Would you be open to a brief call this week to explore this further?',
  },
};

const EMAIL_TEMPLATES: Record<string, {
  subjects: string[];
  bodyTemplate: string;
  followUp1: string;
  followUp2: string;
}> = {
  'ai automation': {
    subjects: [
      'Quick question about {companyName}\'s workflows',
      '{contactName}, saving 20+ hours/week at {companyName}?',
      'Idea for {companyName}: {painPoint} automation',
    ],
    bodyTemplate: `Hi {contactName},

I noticed {companyName} is growing, and I wanted to reach out because we help {industry} companies automate time-consuming tasks like {painPoint}.

Our clients typically save 20+ hours per week and see ROI within the first 30 days.

Would you be open to a quick 15-minute call to see if automation could help {companyName}?

Best,
{agentName}
{brandName}`,
    followUp1: `Hi {contactName},

Just following up on my previous email. I know {industry} businesses like {companyName} often struggle with {painPoint}.

If you're spending too much time on manual tasks, I'd love to show you how we've helped similar companies automate and scale.

Worth a quick chat?

{agentName}`,
    followUp2: `{contactName},

Last note from me - I don't want to be a bother.

If automating {painPoint} is ever a priority for {companyName}, I'm here to help.

Feel free to book time directly: [calendar link]

{agentName}`,
  },
  'web design': {
    subjects: [
      'Ideas for {companyName}\'s website',
      '{contactName}, quick question about your online presence',
      'Helping {companyName} convert more visitors',
    ],
    bodyTemplate: `Hi {contactName},

I was looking at {companyName}'s website and had a few ideas that could help you stand out in the {industry} space.

We've helped similar businesses increase their online conversions by 40% or more with modern, mobile-first designs.

Would you be open to a free 15-minute consultation to see what's possible?

Best,
{agentName}
{brandName}`,
    followUp1: `Hi {contactName},

Following up on my note about {companyName}'s website.

Your competitors are investing in their online presence - I'd love to help you stay ahead.

Quick call this week?

{agentName}`,
    followUp2: `{contactName},

Final follow-up - I'll assume the timing isn't right.

If you ever want fresh eyes on your website, reach out anytime.

{agentName}`,
  },
  'lead gen': {
    subjects: [
      'Filling {companyName}\'s pipeline',
      '{contactName}, consistent leads for {industry}',
      'New customers for {companyName}?',
    ],
    bodyTemplate: `Hi {contactName},

I help {industry} businesses like {companyName} generate a consistent flow of qualified leads.

If you're looking to grow but struggling with {painPoint}, we should talk.

Our clients typically see 3-5x return on investment, and we handle all the outreach so your team can focus on closing.

Worth a 15-minute call?

Best,
{agentName}
{brandName}`,
    followUp1: `Hi {contactName},

Circling back on my previous email about lead generation for {companyName}.

I know {industry} is competitive - that's exactly why a predictable lead pipeline is so valuable.

Open to a quick chat?

{agentName}`,
    followUp2: `{contactName},

Last email from me on this.

If lead generation becomes a priority, I'm here to help {companyName} grow.

{agentName}`,
  },
  'default': {
    subjects: [
      'Quick question for {contactName}',
      'Idea for {companyName}',
      'Helping {industry} businesses like yours',
    ],
    bodyTemplate: `Hi {contactName},

I help {industry} businesses overcome challenges like {painPoint}.

We've helped dozens of companies achieve measurable results, and I think {companyName} could benefit too.

Would you be open to a quick call to explore this?

Best,
{agentName}
{brandName}`,
    followUp1: `Hi {contactName},

Following up on my previous email.

If {painPoint} is something {companyName} is working on, I'd love to help.

Quick chat this week?

{agentName}`,
    followUp2: `{contactName},

Final follow-up from me.

If this becomes a priority, reach out anytime.

{agentName}`,
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function detectBusinessType(businessType: string): string {
  const type = businessType.toLowerCase();

  if (type.includes('ai') || type.includes('automation')) return 'ai automation';
  if (type.includes('web') || type.includes('design')) return 'web design';
  if (type.includes('lead') || type.includes('gen')) return 'lead gen';

  return 'default';
}

function personalizeTemplate(template: string, variables: Record<string, string>): string {
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  });
  return result;
}

function generateCallScript(
  template: typeof CALL_TEMPLATES['default'],
  lead: {
    companyName: string;
    industry: string;
    painPoints: string[];
    contactName?: string;
    contactTitle?: string;
    buyingSignals?: string[];
    suggestedAngle?: string;
  },
  brandName: string
): OutreachScript['callScript'] {
  const primaryPainPoint = lead.painPoints[0] || 'operational challenges';
  const contactName = lead.contactName || 'there';
  const buyingSignal = lead.buyingSignals?.[0] || 'growing';

  const variables = {
    contactName,
    agentName: 'your name',
    brandName,
    companyName: lead.companyName,
    industry: lead.industry,
    painPoint: primaryPainPoint,
    buyingSignal,
  };

  // Use suggested angle if available, otherwise use template opener
  const customOpener = lead.suggestedAngle
    ? `Hi {contactName}, this is {agentName} from {brandName}. I noticed ${lead.suggestedAngle.toLowerCase()}. Do you have a quick moment?`
    : template.opener;

  return {
    opener: personalizeTemplate(customOpener, variables),
    valueProposition: template.valueProps.map(vp => personalizeTemplate(vp, variables)).join('\n• '),
    questions: template.questions,
    objectionHandlers: Object.fromEntries(
      Object.entries(template.objections).map(([k, v]) => [k, personalizeTemplate(v, variables)])
    ),
    closeAttempt: personalizeTemplate(template.close, variables),
  };
}

function generateEmailScript(
  template: typeof EMAIL_TEMPLATES['default'],
  lead: {
    companyName: string;
    industry: string;
    painPoints: string[];
    contactName?: string;
    contactTitle?: string;
    buyingSignals?: string[];
    suggestedAngle?: string;
  },
  brandName: string
): OutreachScript['emailScript'] {
  const primaryPainPoint = lead.painPoints[0] || 'growth challenges';
  const contactName = lead.contactName || 'there';
  const buyingSignal = lead.buyingSignals?.[0] || 'growing';

  const variables = {
    contactName,
    agentName: '[Your Name]',
    brandName,
    companyName: lead.companyName,
    industry: lead.industry,
    painPoint: primaryPainPoint,
    buyingSignal,
  };

  // Pick a random subject from templates
  const subjectTemplate = template.subjects[Math.floor(Math.random() * template.subjects.length)];

  // Use suggested angle to create more personalized email body if available
  let customBody = template.bodyTemplate;
  if (lead.suggestedAngle) {
    customBody = `Hi {contactName},

I noticed ${lead.suggestedAngle.toLowerCase()}.

${template.bodyTemplate.split('\n\n').slice(1).join('\n\n')}`;
  }

  return {
    subject: personalizeTemplate(subjectTemplate, variables),
    body: personalizeTemplate(customBody, variables),
    followUp1: personalizeTemplate(template.followUp1, variables),
    followUp2: personalizeTemplate(template.followUp2, variables),
  };
}

// ============================================
// TOOL IMPLEMENTATION
// ============================================

export async function generateOutreachScripts(params: z.infer<typeof outreachSchema> & { projectId: string }) {
  const { businessType, brandName, valueProposition, leads, projectId } = params;

  try {
    // Detect business type for template selection
    const detectedType = detectBusinessType(businessType);
    const callTemplate = CALL_TEMPLATES[detectedType] || CALL_TEMPLATES['default'];
    const emailTemplate = EMAIL_TEMPLATES[detectedType] || EMAIL_TEMPLATES['default'];

    // Generate personalized scripts for each lead
    const scripts: OutreachScript[] = leads.map(lead => ({
      leadId: lead.id,
      leadName: lead.companyName,
      callScript: generateCallScript(callTemplate, lead, brandName),
      emailScript: generateEmailScript(emailTemplate, lead, brandName),
    }));

    const outreachData: OutreachArtifact = {
      scripts,
    };

    // Save to Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: artifact, error } = await (supabase
      .from('artifacts') as any)
      .upsert(
        {
          project_id: projectId,
          type: 'outreach',
          data: outreachData,
          version: 1,
        },
        {
          onConflict: 'project_id,type',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Failed to save outreach artifact:', error);
      throw new Error('Failed to save outreach scripts');
    }

    return {
      success: true,
      artifact,
      summary: `📞 Generated ${scripts.length} personalized outreach scripts (call + email sequences for each lead).`,
    };
  } catch (error) {
    console.error('Outreach script generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
