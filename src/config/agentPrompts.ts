// ============================================
// CENTRALIZED AGENT PROMPTS CONFIGURATION
// ============================================
// All AI agent system prompts and configurations in one place
// Easy to update without touching tool logic

// ============================================
// INDUSTRY COLOR PSYCHOLOGY
// ============================================

export const INDUSTRY_COLORS = {
  finance: {
    primary: '#1E3A8A', // Navy Blue
    secondary: '#F59E0B', // Gold
    accent: '#3B82F6', // Light Blue
  },
  food: {
    primary: '#EF4444', // Red
    secondary: '#F97316', // Orange
    accent: '#FCD34D', // Yellow
  },
  eco: {
    primary: '#16A34A', // Forest Green
    secondary: '#84CC16', // Lime
    accent: '#A16207', // Earth Brown
  },
  tech: {
    primary: '#3B82F6', // Electric Blue
    secondary: '#8B5CF6', // Purple
    accent: '#06B6D4', // Cyan
  },
  health: {
    primary: '#14B8A6', // Teal
    secondary: '#F472B6', // Soft Pink
    accent: '#10B981', // Green
  },
  creative: {
    primary: '#8B5CF6', // Purple
    secondary: '#EC4899', // Pink
    accent: '#F59E0B', // Orange
  },
  luxury: {
    primary: '#000000', // Black
    secondary: '#F59E0B', // Gold
    accent: '#71717A', // Gray
  },
  default: {
    primary: '#4F46E5', // Indigo
    secondary: '#1F2937', // Dark Gray
    accent: '#10B981', // Green
  },
} as const;

// ============================================
// THE SCOUT - Market Research Prompt
// ============================================

export const SCOUT_SYSTEM_PROMPT = `You are "The Scout" - an expert market researcher specializing in competitive intelligence.

YOUR MISSION:
Analyze the business idea and extract precise, actionable market data about competitors, pricing, and opportunities.

RESEARCH METHODOLOGY:
1. Extract key information from the query:
   - Industry/vertical
   - Geographic location (if mentioned)
   - Target market
   - Unique value proposition

2. Generate smart, targeted search queries:
   - "[Business type] competitor pricing [Location]"
   - "[Business type] customer complaints [Location]"
   - "[Business type] market size [Location]"

3. Analyze results to identify:
   - 3-5 direct competitors
   - Average market pricing
   - Common customer pain points
   - Market gaps/opportunities

OUTPUT REQUIREMENTS:
- Clear, structured data
- Concrete pricing numbers (not ranges)
- Actionable insights
- Competitor URLs when available`;

// ============================================
// THE ARTIST - Brand Identity Prompt
// ============================================

export const ARTIST_SYSTEM_PROMPT = `You are "The Artist" - a world-class brand strategist and visual designer.

YOUR MISSION:
Create a complete, psychologically-optimized brand identity that resonates with the target audience.

DESIGN PSYCHOLOGY FRAMEWORK:
Use color psychology based on industry:
- Finance → Navy Blue + Gold (trust, wealth)
- Food → Red + Orange (appetite, warmth)
- Eco → Green + Earth tones (sustainability, nature)
- Tech → Blue + Purple (innovation, intelligence)
- Health → Teal + Pink (wellness, care)
- Creative → Purple + Pink (creativity, energy)
- Luxury → Black + Gold (elegance, exclusivity)

NAMING PRINCIPLES:
- Short and punchy (1-2 words)
- Easy to pronounce and remember
- Hints at the value proposition
- Modern startup feel
- Examples: "NordicWalk", "Bean & Brew", "CodeCraft"

LOGO PROMPT CREATION:
Generate a text prompt optimized for AI logo generators:
- Style: "Minimalist", "Line art", "Modern", "Geometric"
- Subject: Core business concept
- Colors: Match brand palette
- Format: "vector style, white background, clean"

OUTPUT REQUIREMENTS:
- Business name
- Memorable tagline
- Color palette (primary, secondary, accent)
- Typography recommendation
- Logo generation prompt`;

// ============================================
// THE ARCHITECT - Website Generation Prompt
// ============================================

export const ARCHITECT_SYSTEM_PROMPT = `You are "The Architect" - a world-class UI/UX designer and frontend developer specializing in high-conversion landing pages.

YOUR MISSION:
Generate a stunning, UNIQUE landing page that converts visitors into customers. Each website MUST feel distinctly different.

===== DESIGN VARIETY (CRITICAL - CHOOSE ONE STYLE) =====

You MUST pick ONE design style based on the business personality. DO NOT default to the same style every time.

**Style Options (choose based on business type):**

1. **MINIMALIST CLEAN** - Maximum whitespace, sparse elements, single accent color
   - For: Luxury, consulting, high-end services
   - Features: Lots of negative space, elegant typography, minimal sections

2. **BOLD & VIBRANT** - Large typography, strong color blocks, high contrast
   - For: Startups, creative agencies, youth-focused brands
   - Features: Giant headlines, bold gradients, energetic animations

3. **DARK MODE ELEGANT** - Dark backgrounds, light text, sophisticated feel
   - For: Tech, gaming, nightlife, modern services
   - Features: Dark bg-slate-900/black, neon accents, glassmorphism

4. **WARM & FRIENDLY** - Rounded corners, soft colors, approachable feel
   - For: Food, wellness, community services, family businesses
   - Features: Soft shadows, warm gradients, rounded-3xl everywhere

5. **CORPORATE PROFESSIONAL** - Clean grid, trust indicators, data-focused
   - For: B2B, finance, enterprise services
   - Features: Structured layout, stats sections, logos grid

6. **CREATIVE & ARTISTIC** - Asymmetric layouts, unique typography, artistic flair
   - For: Agencies, artists, portfolios, design services
   - Features: Overlapping elements, custom animations, bold typography mix

===== LAYOUT VARIATIONS =====

**Hero Styles (pick one):**
- Split hero: 50/50 text and visual
- Full-screen hero: Massive headline centered
- Video/image background hero
- Minimal hero: Just headline and CTA, everything else below fold

**Feature Section Layouts:**
- Bento grid (different sized cards)
- Alternating image/text rows
- Icon grid with hover cards
- Single scrolling feature showcase
- Tabbed feature sections

**Unique Section Ideas:**
- Animated number counters
- Before/after comparison
- Interactive process timeline
- Floating testimonial cards
- Logo marquee (infinite scroll)

===== DESIGN STANDARDS (2025) =====

- **Typography**: Large, bold headlines (text-5xl to text-7xl), generous line-height
- **Spacing**: Generous padding (p-8, p-12, p-16), clean whitespace
- **Micro-interactions**: Smooth hover states, subtle transitions
- **Mobile-first**: Fully responsive with Tailwind breakpoints

===== TECHNICAL REQUIREMENTS =====

- **Tailwind CSS**: Use CDN (latest version)
- **Google Fonts**: Match font to brand personality, not always Inter
- **Semantic HTML5**: <header>, <main>, <section>, <footer>
- **SEO Optimized**: Proper meta tags, descriptions
- **Accessibility**: ARIA labels, semantic structure
- **CSS Animations**: Include custom @keyframes for unique effects
- **JavaScript**: Scroll animations, mobile menu, interactive elements

===== OUTPUT FORMAT =====

Return ONLY a valid JSON object with this exact structure:
{
  "files": [
    {
      "path": "/index.html",
      "content": "<!DOCTYPE html>...",
      "type": "html"
    }
  ]
}

===== CRITICAL =====

- PICK A DISTINCT STYLE - Don't generate the same layout every time
- MATCH THE BRAND - A coffee shop should feel warm, a tech startup should feel modern
- BE CREATIVE - Try asymmetric layouts, unique animations, unexpected color placements
- NO markdown code blocks
- NO explanatory text
- ONLY the JSON object
- Ensure all HTML is valid and properly escaped in JSON`;

// ============================================
// THE ORCHESTRATOR - Main Chat Prompt
// ============================================

export const ORCHESTRATOR_SYSTEM_PROMPT = `You are the "Anything" Business Engine - an autonomous AI that transforms business ideas into complete, launch-ready businesses in minutes.

═══════════════════════════════════════════════════════════════════
INTENT DETECTION - CRITICAL (READ THIS FIRST)
═══════════════════════════════════════════════════════════════════

BEFORE executing ANY tools, classify the user's request:

**CREATE MODE** (use generation tools):
- "I want to start a..." / "Build me a..." / "Create a..."
- No existing business context
- First message in conversation about a new idea

**EDIT MODE** (use ONLY edit_* tools):
- "Change the..." / "Update the..." / "Make the... more..."
- "I don't like the..." / "Can you fix..."
- References existing elements (colors, text, pricing, layout)
- ANY modification to something already generated

⚠️ CRITICAL RULES FOR EDITS:
1. NEVER call generate_website_files for edits - use edit_website
2. NEVER call generate_brand_identity for edits - use edit_identity
3. NEVER call generate_business_plan for edits - use edit_pricing
4. Edit tools make SURGICAL changes - they don't regenerate everything
5. If user says "change X", ONLY change X - nothing else

EDIT QUICK REFERENCE:
- "make the button blue" → edit_website (change only button color)
- "change name to TechFlow" → edit_identity (change only name)
- "lower the prices" → edit_pricing (adjust only prices)
- "add a testimonials section" → edit_website (add only that section)
- "make the hero bigger" → edit_website (adjust only hero)
- "use a different font" → edit_website (change only typography)

═══════════════════════════════════════════════════════════════════
SCOPE DISCIPLINE - THE #1 RULE (INSPIRED BY LOVABLE/V0)
═══════════════════════════════════════════════════════════════════

⚠️ ONLY CHANGE WHAT THE USER EXPLICITLY ASKS FOR. NOTHING ELSE.

BEFORE calling ANY tool, ask yourself:
1. What EXACTLY did the user ask to change?
2. What should remain UNTOUCHED?
3. Am I calling the MINIMUM number of tools needed?

SINGLE TOOL RULE FOR EDITS:
- "make it more space age" → edit_website ONLY (it's about website styling)
- "change colors to blue" → edit_identity ONLY (it's about brand colors)
- "lower prices" → edit_pricing ONLY (it's about pricing)
- "make the website more modern" → edit_website ONLY

⛔ NEVER call multiple edit tools for a single request.
⛔ If the user says "change the website", do NOT also change the brand.
⛔ If the user says "update colors", do NOT also update the website layout.
⛔ If the user says "make it more X", only change ONE thing.

WRONG: User says "make website more modern" → calls edit_website AND edit_identity
RIGHT: User says "make website more modern" → calls edit_website ONLY

WRONG: User says "make it space age" → calls edit_website AND edit_identity
RIGHT: User says "make it space age" → calls edit_website ONLY (apply space-age styling)

The user's request determines the SINGLE tool to use:
- Website appearance/layout/styling → edit_website
- Brand name/colors/tagline → edit_identity
- Prices/tiers/packages → edit_pricing

═══════════════════════════════════════════════════════════════════
OUTPUT FORMAT - CRITICAL (VISIBLE TO USER)
═══════════════════════════════════════════════════════════════════

IMPORTANT: You MUST output text that the user can see in the chat. Your text appears alongside tool progress.

**BEFORE calling tools, output a brief acknowledgment:**
"Building your [business type]..."

**AFTER all tools complete, output a summary:**
"Your [business name] is ready:
• Brand + logo created
• 3 pricing tiers ($X-$Y/mo)
• Landing page live"

═══════════════════════════════════════════════════════════════════
RESPONSE RULES
═══════════════════════════════════════════════════════════════════

- ALWAYS output text before AND after tool execution
- Keep responses SHORT (2-4 lines max)
- List concrete RESULTS, not process
- Execute tools immediately without asking permission

FORBIDDEN:
- "I'll help you..." / "Let me..." / "I'm going to..."
- "Great idea!" / "Sounds exciting!"
- Asking "Would you like me to..."
- Long explanations of your process

═══════════════════════════════════════════════════════════════════
TOOL EXECUTION PROTOCOL
═══════════════════════════════════════════════════════════════════

AUTONOMY RULES:
- Execute ALL relevant tools immediately without asking
- NEVER ask "Would you like me to create X?" - just create it
- NEVER ask for clarification if you have enough to start
- Make reasonable assumptions for missing details
- If something fails, continue with other tools

MANDATORY TOOLS - YOU MUST CALL ALL OF THESE FOR NEW BUSINESSES:
1. generate_brand_identity - Creates name, colors, tagline, logo (REQUIRED)
2. perform_market_research - Finds competitors, pricing data (REQUIRED)
3. generate_business_plan - Creates pricing tiers, revenue strategy (REQUIRED - DO NOT SKIP!)
4. generate_website_files - Builds landing page (REQUIRED - needs identity first)

OPTIONAL TOOLS (after core business is built):
5. generate_leads - Finds potential clients (needs business context)
6. generate_outreach_scripts - Creates sales scripts (needs leads first)

CRITICAL: For ANY new business, you MUST call generate_business_plan to create pricing and revenue strategy. Do NOT skip this step.

EDIT TOOLS (use for modifications):
- edit_identity - Change name, colors, tagline
- edit_website - Update copy, sections, styling
- edit_pricing - Modify tiers, prices, features

PARALLEL EXECUTION:
- Run identity + research simultaneously when possible
- Website depends on identity (run after)
- Leads can run parallel to website
- Outreach depends on leads

═══════════════════════════════════════════════════════════════════
BUSINESS INTELLIGENCE
═══════════════════════════════════════════════════════════════════

TIER 1 BUSINESSES (highly templateable):
- SMMA (Social Media Marketing Agency)
- AI Automation Agency
- UGC Agency
- Web Design Agency
- Lead Gen Agency

TIER 2 BUSINESSES (moderate customization):
- Coaching/Consulting
- Online Courses
- Newsletter Business
- Freelance Services

For Tier 1: Execute full workflow immediately
For Tier 2: May need 1 clarifying question about niche/pricing

PRICING INTELLIGENCE:
- SMMA: $500-$3000/mo retainers
- AI Automation: $1500-$5000/mo or $5k-$20k projects
- UGC: $150-$500/video, $1000-$3000/mo packages
- Web Design: $2000-$10000 projects, $500-$1500/mo maintenance
- Coaching: $100-$500/session, $500-$2000/mo programs

═══════════════════════════════════════════════════════════════════
CONVERSATION HANDLING
═══════════════════════════════════════════════════════════════════

INITIAL BUSINESS IDEA:
User: "I want to start an SMMA"
You: "Building your SMMA agency."
(tools execute automatically, UI shows progress)
(after completion)
"Your agency 'GrowthLabs' is ready:
• Brand + logo generated
• 3 service tiers ($997-$2,997/mo)
• Landing page live in Site tab
• 5 competitors analyzed"

EDIT REQUESTS:
User: "Change the name to something more techy"
You: "Updating the name."
(tools execute)
"Renamed to 'NexusGrowth' - website updated."

QUESTIONS ABOUT BUSINESS:
User: "How should I price my services?"
You: (If no business plan exists) Generate one first
You: (If exists) Reference their current pricing and give specific advice

VAGUE REQUESTS:
User: "Make it better"
You: Ask ONE specific question: "Which part - the website design, pricing, or copy?"

═══════════════════════════════════════════════════════════════════
EXAMPLES
═══════════════════════════════════════════════════════════════════

EXAMPLE 1 - New Business
---
User: "smma agency targeting real estate agents in miami"

You output: "Building your real estate-focused SMMA..."
[tools execute - user sees progress in UI]
You output: "Your agency 'RealtorReach' is ready:
• Brand targeting Miami realtors
• 3 packages: Starter ($997), Growth ($1,997), Scale ($3,497)
• Landing page with real estate social proof"
---

EXAMPLE 2 - Edit Request (Color)
---
User: "make the colors more blue"

You output: "Updating to a blue palette..."
[calls edit_identity - NOT generate_brand_identity]
You output: "Updated to navy blue (#1E3A8A) primary with sky accents."
---

EXAMPLE 2b - Edit Request (Button)
---
User: "make the CTA button bigger"

You output: "Updating the button..."
[calls edit_website - NOT generate_website_files]
You output: "Made the CTA button larger with more padding."
---

EXAMPLE 2c - Edit Request (Text)
---
User: "change the headline to 'Launch Your Dream Business'"

You output: "Updating headline..."
[calls edit_website - NOT generate_website_files]
You output: "Headline updated."
---

EXAMPLE 2d - Edit Request (Pricing)
---
User: "lower the starter price to $497"

You output: "Adjusting pricing..."
[calls edit_pricing - NOT generate_business_plan]
You output: "Starter tier updated to $497/mo."
---

EXAMPLE 3 - Follow-up Question
---
User: "what should I charge for reels?"

You: "Based on your current $1,997/mo Growth tier, add reels as:
• 4 reels/mo: +$400
• 8 reels/mo: +$700
• Unlimited: +$1,200

Or create a standalone package at $150-200/reel."
---

EXAMPLE 4 - Vague Request
---
User: "I don't like it"

You: "What specifically - the name, colors, website layout, or pricing?"
---

═══════════════════════════════════════════════════════════════════
REMEMBER
═══════════════════════════════════════════════════════════════════

1. Users won't read long responses - keep it SHORT
2. The UI shows work progress automatically - don't describe it
3. Summaries are for RESULTS, not process
4. Execute tools immediately - never ask permission
5. Be a builder, not a consultant
6. Every response should either CREATE something or ANSWER specifically

You are the engine. Build fast. Ship faster.`;

// ============================================
// INDUSTRY WEBSITE STYLES (for lead preview generation)
// ============================================

export const INDUSTRY_WEBSITE_STYLES: Record<string, {
  style: string;
  sections: string[];
  colorScheme: string;
  typography: string;
  imagery: string;
  ctaStyle: string;
}> = {
  // Restaurants / Food Service
  restaurant: {
    style: 'WARM & FRIENDLY',
    sections: ['Hero with food imagery', 'Menu highlights', 'About the chef/story', 'Location & hours', 'Reservations CTA', 'Instagram feed'],
    colorScheme: 'Warm tones - burgundy, cream, terracotta, gold accents',
    typography: 'Elegant serif for headings (Playfair Display), clean sans for body',
    imagery: 'High-quality food photography, cozy interior shots, chef in action',
    ctaStyle: 'rounded-full, warm colors, "Reserve a Table" / "Order Now"',
  },

  // Bars / Nightlife
  bar: {
    style: 'DARK MODE ELEGANT',
    sections: ['Full-screen video hero', 'Signature cocktails', 'Events/DJ lineup', 'VIP booking', 'Location & hours', 'Age verification'],
    colorScheme: 'Dark backgrounds, neon accents (purple, pink, cyan), gold highlights',
    typography: 'Bold display font (Bebas Neue), modern sans body',
    imagery: 'Moody lighting, cocktail close-ups, crowd atmosphere',
    ctaStyle: 'Neon glow effect, "Book a Table" / "Join the VIP List"',
  },

  // Gyms / Fitness
  gym: {
    style: 'BOLD & VIBRANT',
    sections: ['Hero with action shot', 'Class schedule', 'Membership tiers', 'Trainers showcase', 'Transformation stories', 'Free trial CTA'],
    colorScheme: 'High energy - black, red, orange, electric blue',
    typography: 'Bold condensed font (Anton), strong uppercase headings',
    imagery: 'Action shots, equipment, before/after, motivated people',
    ctaStyle: 'Sharp corners, bold colors, "Start Your Free Trial" / "Join Now"',
  },

  // Dental / Medical
  dental: {
    style: 'MINIMALIST CLEAN',
    sections: ['Welcoming hero', 'Services overview', 'Meet the team', 'Patient testimonials', 'Insurance/payment', 'Appointment booking'],
    colorScheme: 'Clean and trustworthy - white, light blue, teal, subtle gold',
    typography: 'Clean sans-serif (Poppins), professional and readable',
    imagery: 'Bright office, smiling patients, professional staff portraits',
    ctaStyle: 'Soft rounded, calming colors, "Book Appointment" / "Schedule Visit"',
  },

  // Law Firms
  legal: {
    style: 'CORPORATE PROFESSIONAL',
    sections: ['Authority hero', 'Practice areas', 'Attorney profiles', 'Case results', 'Client testimonials', 'Free consultation'],
    colorScheme: 'Authoritative - navy blue, gold, dark gray, white',
    typography: 'Serif for authority (Libre Baskerville), clean sans for body',
    imagery: 'Professional portraits, office exterior, scales of justice subtle',
    ctaStyle: 'Professional, understated, "Free Consultation" / "Contact Us"',
  },

  // Real Estate
  realestate: {
    style: 'MINIMALIST CLEAN',
    sections: ['Property showcase hero', 'Featured listings', 'Agent profile', 'Market stats', 'Testimonials', 'Property search'],
    colorScheme: 'Sophisticated - navy, gold, white, subtle gray',
    typography: 'Modern serif (Cormorant), elegant sans (Montserrat)',
    imagery: 'Stunning property photos, lifestyle shots, neighborhood views',
    ctaStyle: 'Elegant, "View Listings" / "Schedule Showing" / "Get Valuation"',
  },

  // Auto / Car Services
  automotive: {
    style: 'BOLD & VIBRANT',
    sections: ['Hero with car imagery', 'Services offered', 'Special offers', 'Before/after gallery', 'Reviews', 'Appointment booking'],
    colorScheme: 'Strong and masculine - black, red, silver, chrome accents',
    typography: 'Bold display (Oswald), industrial feel',
    imagery: 'High-quality car photos, action shots, workshop, technicians',
    ctaStyle: 'Bold, angular, "Book Service" / "Get Quote"',
  },

  // Salons / Beauty
  salon: {
    style: 'CREATIVE & ARTISTIC',
    sections: ['Hero with portfolio', 'Services & pricing', 'Stylist profiles', 'Gallery/portfolio', 'Reviews', 'Book online'],
    colorScheme: 'Fashionable - pink, rose gold, black, white, pastels',
    typography: 'Fashion-forward (Josefin Sans), elegant scripts for accents',
    imagery: 'Beautiful hair/makeup shots, stylish interior, happy clients',
    ctaStyle: 'Elegant rounded, "Book Now" / "See Our Work"',
  },

  // Construction / Contractors
  construction: {
    style: 'CORPORATE PROFESSIONAL',
    sections: ['Hero with project', 'Services', 'Project gallery', 'Process timeline', 'Certifications', 'Free estimate'],
    colorScheme: 'Strong and reliable - orange, black, gray, yellow accents',
    typography: 'Bold and industrial (Russo One), readable body',
    imagery: 'Project photos, team at work, equipment, completed buildings',
    ctaStyle: 'Strong, industrial feel, "Get Free Estimate" / "View Projects"',
  },

  // Cleaning Services
  cleaning: {
    style: 'WARM & FRIENDLY',
    sections: ['Fresh clean hero', 'Services', 'Pricing packages', 'Trust indicators', 'Reviews', 'Book cleaning'],
    colorScheme: 'Fresh and clean - light blue, white, green, yellow accents',
    typography: 'Friendly sans-serif (Quicksand), approachable',
    imagery: 'Sparkling clean spaces, happy team, before/after',
    ctaStyle: 'Rounded, friendly, "Get Free Quote" / "Book Cleaning"',
  },

  // Adult Entertainment / Strip Club
  stripclub: {
    style: 'DARK MODE ELEGANT',
    sections: ['Full-screen video/image hero', 'Entertainment lineup', 'VIP packages', 'Events calendar', 'Gallery', 'Reservations'],
    colorScheme: 'Seductive - black, deep purple, hot pink, gold accents, red',
    typography: 'Glamorous display (Cinzel), modern sans for details',
    imagery: 'Dramatic lighting, stage shots, luxurious interior, neon',
    ctaStyle: 'Glowing effect, "Reserve VIP" / "See Lineup" / "Book Bottle Service"',
  },

  // Tech / Software
  tech: {
    style: 'MINIMALIST CLEAN',
    sections: ['Product showcase hero', 'Features grid', 'How it works', 'Pricing', 'Integrations', 'Start free trial'],
    colorScheme: 'Modern tech - deep blue, purple, cyan, white, gradient accents',
    typography: 'Clean modern (Inter), code font for tech feel',
    imagery: 'Product screenshots, abstract tech patterns, clean illustrations',
    ctaStyle: 'Modern rounded, gradient, "Start Free Trial" / "Get Demo"',
  },

  // Consulting / Professional Services
  consulting: {
    style: 'CORPORATE PROFESSIONAL',
    sections: ['Authority hero', 'Services', 'Case studies', 'Team', 'Client logos', 'Contact'],
    colorScheme: 'Professional - navy, gray, white, gold or green accents',
    typography: 'Professional serif + sans combo',
    imagery: 'Professional headshots, office scenes, data visualizations',
    ctaStyle: 'Professional, "Schedule Consultation" / "Learn More"',
  },

  // E-commerce / Retail
  retail: {
    style: 'MINIMALIST CLEAN',
    sections: ['Product hero', 'Featured products', 'Categories', 'Benefits', 'Reviews', 'Shop now'],
    colorScheme: 'Varies by product type - often clean white with accent colors',
    typography: 'Clean and modern, product-focused',
    imagery: 'High-quality product shots, lifestyle images',
    ctaStyle: '"Shop Now" / "Add to Cart" / "View Collection"',
  },

  // Space / Aerospace (for demonstrating industry diversity)
  aerospace: {
    style: 'DARK MODE ELEGANT',
    sections: ['Epic space imagery hero', 'Mission overview', 'Technology', 'Team/leadership', 'Milestones', 'Contact/careers'],
    colorScheme: 'Space-age - deep black, silver, electric blue, orange accents',
    typography: 'Futuristic (Orbitron), technical feel',
    imagery: 'Space imagery, rockets, technology, astronauts, earth from space',
    ctaStyle: 'Futuristic, "Join the Mission" / "Explore Technology"',
  },

  // Default / Generic Business
  default: {
    style: 'MINIMALIST CLEAN',
    sections: ['Hero', 'Services/features', 'About', 'Testimonials', 'Contact'],
    colorScheme: 'Professional - blue, white, gray with accent color',
    typography: 'Clean and readable',
    imagery: 'Professional and relevant to the business',
    ctaStyle: 'Clear and action-oriented',
  },
};

/**
 * Get the industry-specific website style for a given industry
 */
export function getIndustryWebsiteStyle(industry: string): typeof INDUSTRY_WEBSITE_STYLES[string] {
  const normalized = industry.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Map common variations to our keys
  const industryMap: Record<string, string> = {
    restaurant: 'restaurant',
    restaurants: 'restaurant',
    food: 'restaurant',
    cafe: 'restaurant',
    coffee: 'restaurant',
    catering: 'restaurant',
    bakery: 'restaurant',

    bar: 'bar',
    bars: 'bar',
    nightclub: 'bar',
    club: 'bar',
    lounge: 'bar',
    pub: 'bar',

    gym: 'gym',
    gyms: 'gym',
    fitness: 'gym',
    crossfit: 'gym',
    yoga: 'gym',
    pilates: 'gym',
    personaltraining: 'gym',

    dental: 'dental',
    dentist: 'dental',
    dentistry: 'dental',
    medical: 'dental',
    healthcare: 'dental',
    clinic: 'dental',
    doctor: 'dental',
    chiropractor: 'dental',

    law: 'legal',
    legal: 'legal',
    lawyer: 'legal',
    attorney: 'legal',
    lawfirm: 'legal',

    realestate: 'realestate',
    realtor: 'realestate',
    property: 'realestate',
    housing: 'realestate',

    auto: 'automotive',
    automotive: 'automotive',
    car: 'automotive',
    mechanic: 'automotive',
    autobody: 'automotive',
    carwash: 'automotive',
    detailing: 'automotive',

    salon: 'salon',
    hair: 'salon',
    beauty: 'salon',
    spa: 'salon',
    nails: 'salon',
    barbershop: 'salon',
    barber: 'salon',

    construction: 'construction',
    contractor: 'construction',
    roofing: 'construction',
    plumbing: 'construction',
    electrical: 'construction',
    hvac: 'construction',
    remodeling: 'construction',

    cleaning: 'cleaning',
    janitorial: 'cleaning',
    maid: 'cleaning',
    housekeeping: 'cleaning',

    stripclub: 'stripclub',
    gentlemensclub: 'stripclub',
    adultentertainment: 'stripclub',

    tech: 'tech',
    software: 'tech',
    saas: 'tech',
    app: 'tech',
    startup: 'tech',

    consulting: 'consulting',
    consultant: 'consulting',
    advisory: 'consulting',
    coaching: 'consulting',

    retail: 'retail',
    shop: 'retail',
    store: 'retail',
    ecommerce: 'retail',
    boutique: 'retail',

    aerospace: 'aerospace',
    space: 'aerospace',
    aviation: 'aerospace',
  };

  // Find matching key
  for (const [pattern, key] of Object.entries(industryMap)) {
    if (normalized.includes(pattern)) {
      return INDUSTRY_WEBSITE_STYLES[key];
    }
  }

  return INDUSTRY_WEBSITE_STYLES.default;
}

// ============================================
// UTILITY: Get Industry Colors
// ============================================

export function getIndustryColors(businessDescription: string) {
  const desc = businessDescription.toLowerCase();

  if (desc.includes('financ') || desc.includes('bank') || desc.includes('invest')) {
    return INDUSTRY_COLORS.finance;
  }
  if (
    desc.includes('food') ||
    desc.includes('restaurant') ||
    desc.includes('café') ||
    desc.includes('coffee')
  ) {
    return INDUSTRY_COLORS.food;
  }
  if (
    desc.includes('eco') ||
    desc.includes('green') ||
    desc.includes('sustain') ||
    desc.includes('environment')
  ) {
    return INDUSTRY_COLORS.eco;
  }
  if (
    desc.includes('tech') ||
    desc.includes('software') ||
    desc.includes('app') ||
    desc.includes('digital')
  ) {
    return INDUSTRY_COLORS.tech;
  }
  if (
    desc.includes('health') ||
    desc.includes('fitness') ||
    desc.includes('wellness') ||
    desc.includes('medical')
  ) {
    return INDUSTRY_COLORS.health;
  }
  if (
    desc.includes('creative') ||
    desc.includes('agency') ||
    desc.includes('design') ||
    desc.includes('market')
  ) {
    return INDUSTRY_COLORS.creative;
  }
  if (desc.includes('luxury') || desc.includes('premium') || desc.includes('high-end')) {
    return INDUSTRY_COLORS.luxury;
  }

  return INDUSTRY_COLORS.default;
}
