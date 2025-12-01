// Database Schema Types for Supabase

// ============================================
// ARTIFACT TYPE DEFINITIONS
// ============================================

export type WebsiteArtifact = {
  files: Array<{
    path: string;
    content: string;
    type: 'html' | 'css' | 'js' | 'json';
  }>;
  primaryPage: string; // e.g., '/index.html'
};

export type IdentityArtifact = {
  name: string;
  logoUrl: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  font: string;
  tagline?: string;
};

export type ExtractedCompetitor = {
  name: string;
  url: string;
  description?: string;
  pricing: {
    starterPrice: number | null;
    midPrice: number | null;
    premiumPrice: number | null;
    pricingModel: 'monthly' | 'project' | 'hourly' | 'unknown';
    rawPriceStrings: string[];
  };
  strengths: string[];
  weaknesses: string[];
  marketPosition: 'budget' | 'mid-market' | 'premium' | 'unknown';
};

export type MarketIntelligence = {
  competitors: ExtractedCompetitor[];
  marketAnalysis: {
    saturationLevel: 'high' | 'medium' | 'low';
    priceRange: { min: number; max: number; median: number };
    dominantPricingModel: 'monthly' | 'project' | 'hourly' | 'mixed';
    commonFeatures: string[];
    differentiators: string[];
    gaps: string[];
  };
  customerPainPoints: Array<{
    complaint: string;
    frequency: number;
    severity: 'high' | 'medium' | 'low';
  }>;
  recommendedStrategy: 'undercut' | 'premium' | 'niche';
  strategyRationale: string;
};

export type ResearchArtifact = {
  competitors: Array<{
    name: string;
    price: string;
    url: string;
    description?: string;
  }>;
  marketSummary: string;
  targetAudience?: string;
  keyInsights?: string[];
  sources?: Array<{
    title: string;
    url: string;
  }>;
  nextSteps?: string[];
  // Enhanced research fields
  businessModelInsights?: {
    acquisitionStrategies: string[];
    pricingModels: string[];
    quickWins: string[];
    commonMistakes: string[];
  };
  recommendedFirstOffer?: {
    name: string;
    price: string;
    deliverables: string[];
    whyItWorks: string;
  };
  // NEW: Market intelligence data
  marketIntelligence?: MarketIntelligence;
};

export type BusinessPlanArtifact = {
  executiveSummary: string;
  revenueModel: string;
  pricingTiers: Array<{
    name: string;
    price: string;
    features: string[];
  }>;
  servicePackages: Array<{
    name: string;
    description: string;
    deliverables: string[];
    price: string;
  }>;
  targetMarket: string;
  valueProposition: string;
};

// Website analysis result from websiteAnalyzer service
export type WebsiteAnalysis = {
  status: 'none' | 'broken' | 'poor' | 'outdated' | 'good';
  score: number; // 0-100 contribution to lead score (higher = more opportunity)
  issues: string[];
  lastUpdated?: string;
  technologies?: string[];
  hasSSL: boolean;
  loadTime?: number;
  mobileResponsive?: boolean;
  hasContactForm?: boolean;
  socialLinks?: string[];
};

// Lead note for CRM
export type LeadNote = {
  id: string;
  content: string;
  createdAt: string;
  createdBy?: string;
};

// Enhanced Lead type with full CRM functionality
export type Lead = {
  id: string;
  projectId?: string;
  companyName: string;
  industry: string;

  // Contact Information
  website?: string;
  phone?: string;
  address?: string;
  contactName?: string;
  contactEmail?: string;
  contactLinkedIn?: string;
  contactTitle?: string;

  // Google Maps Data
  placeId?: string;
  rating?: number;
  reviewCount?: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };

  // Website Analysis
  websiteAnalysis?: WebsiteAnalysis;

  // Scoring (1-100 scale)
  score: number; // Total opportunity score 1-100
  scoreBreakdown: string[]; // Readable breakdown

  // Legacy ICP fields (for backwards compatibility)
  icpScore: number; // 0-10 ICP fit score
  icpMatchReasons: string[];
  buyingSignals?: string[];
  suggestedAngle?: string;
  painPoints: string[];

  // CRM Status & Tracking
  status: 'new' | 'contacted' | 'responded' | 'closed' | 'lost';
  notes?: LeadNote[];
  followUpDate?: string;
  lastContactedAt?: string;
  priority?: 'high' | 'medium' | 'low';
  tags?: string[];

  // Generated Content References
  previewToken?: string;
  previewUrl?: string;
  outreachGenerated?: boolean;
  outreachData?: {
    emailSubject: string;
    emailBody: string;
    followUp1: string;
    followUp2: string;
    callScript?: string;
  };

  // Timestamps
  createdAt?: string;
  updatedAt?: string;
};

export type LeadsArtifact = {
  leads: Lead[];
  activities?: LeadActivity[]; // Activity log for all leads
  idealCustomerProfile: {
    industries: string[];
    companySize: string;
    painPoints: string[];
    budget: string;
  };
  searchCriteria: string;

  // ICP-based search insights
  searchSummary?: {
    totalFound: number;
    qualified: number;
    returned: number;
    topIndustries: string[];
    avgScore: number;
  };

  icpInsights?: {
    strongestVertical: string;
    commonPainPoint: string;
    recommendedFocus: string;
  };
};

export type OutreachScript = {
  leadId: string;
  leadName: string;
  callScript: {
    opener: string;
    valueProposition: string;
    questions: string[];
    objectionHandlers: Record<string, string>;
    closeAttempt: string;
  };
  emailScript: {
    subject: string;
    body: string;
    followUp1: string;
    followUp2: string;
  };
};

export type OutreachArtifact = {
  scripts: OutreachScript[];
};

export type FirstWeekPlanArtifact = {
  strategy: string;
  quickestPath: string;
  fallbackPlan: string;
  days: Array<{
    day: number;
    theme: string;
    tasks: Array<{
      task: string;
      duration: string;
      priority: 'critical' | 'high' | 'medium';
      details: string;
      script?: string;
    }>;
    goal: string;
    metrics: string[];
  }>;
  expectedMetrics: {
    totalOutreach: number;
    expectedResponses: string;
    expectedCalls: string;
    expectedCloses: string;
    expectedRevenue: string;
  };
  criticalSuccessFactors: string[];
  taskCompletion?: Record<string, boolean>; // { "1-0": true, "2-3": false, ... }

  // NEW: Enhanced fields for revenue projections
  quickWinPackage?: {
    name: string;
    price: number;
    deliverables: string[];
    deliveryTime: string;
    targetConversionRate: string;
    estimatedTimeToClose: string;
  };

  firstClientStrategy?: {
    primaryChannel: string;
    specificOffer: string;
    urgencyElement: string;
    targetOutreachVolume: number;
    expectedResponseRate: string;
  };

  revenueProjections?: {
    week1: { optimistic: number; realistic: number; conservative: number };
    week2: { optimistic: number; realistic: number; conservative: number };
    week4: { optimistic: number; realistic: number; conservative: number };
    assumptions: string[];
  };
};

// Long-term plan (6-12 months)
export type LongTermPlanArtifact = {
  monthlyMilestones: Array<{
    month: number;
    theme: string;
    revenueTarget: number;
    clientTarget: number;
    keyActivities: string[];
    hires: string[];
    investments: string[];
  }>;

  scalingStrategy: {
    phase1: { months: string; focus: string; revenue: string };
    phase2: { months: string; focus: string; revenue: string };
    phase3: { months: string; focus: string; revenue: string };
  };

  teamBuildingTimeline: Array<{
    month: number;
    role: string;
    reason: string;
    estimatedCost: number;
  }>;

  yearOneProjection: {
    totalRevenue: number;
    totalClients: number;
    averageClientValue: number;
    profitMargin: string;
    keyRisks: string[];
  };
};

// Lead website artifact (for preview generation)
export type LeadWebsiteArtifact = {
  leadId: string;
  leadName: string;
  previewToken: string;
  files: Array<{
    path: string;
    content: string;
    type: 'html' | 'css' | 'js' | 'json';
  }>;
  expiresAt: string;
};

// Activity tracking for leads
export type LeadActivity = {
  id: string;
  leadId: string;
  type: 'email_sent' | 'call_made' | 'note_added' | 'status_changed' | 'email_generated' | 'website_generated' | 'outreach_sent' | 'follow_up_set';
  content?: string; // Note text or email subject
  metadata?: {
    emailSubject?: string;
    emailTo?: string;
    callDuration?: string;
    callOutcome?: string;
    previousStatus?: string;
    newStatus?: string;
    followUpDate?: string;
    websitePreviewUrl?: string;
    previewToken?: string;
    previewUrl?: string;
  };
  createdAt: string;
};

// Union type for all artifacts
export type ArtifactData =
  | WebsiteArtifact
  | IdentityArtifact
  | ResearchArtifact
  | BusinessPlanArtifact
  | LeadsArtifact
  | OutreachArtifact
  | FirstWeekPlanArtifact
  | LongTermPlanArtifact
  | LeadWebsiteArtifact;

// ============================================
// DATABASE TABLE TYPES
// ============================================

export type Project = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: 'active' | 'archived' | 'completed';
  model_id?: string;
  created_at: string;
  updated_at: string;
};

export type ArtifactType =
  | 'website_code'
  | 'identity'
  | 'market_research'
  | 'business_plan'
  | 'leads'
  | 'outreach'
  | 'first_week_plan'
  | 'long_term_plan'
  | 'lead_website';

export type Artifact = {
  id: string;
  project_id: string;
  type: ArtifactType;
  data: ArtifactData;
  version: number;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  project_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, unknown>;
  created_at: string;
};

// ============================================
// DATABASE INTERFACE
// ============================================

// Database row type for leads table
export type LeadRow = {
  id: string;
  project_id: string;
  company_name: string;
  industry: string | null;
  website: string | null;
  phone: string | null;
  address: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_linkedin: string | null;
  contact_title: string | null;
  place_id: string | null;
  rating: number | null;
  review_count: number | null;
  coordinates: { latitude: number; longitude: number } | null;
  website_analysis: WebsiteAnalysis | null;
  score: number | null;
  score_breakdown: string[] | null;
  pain_points: string[] | null;
  icp_score: number | null;
  icp_match_reasons: string[] | null;
  buying_signals: string[] | null;
  suggested_angle: string | null;
  status: 'new' | 'contacted' | 'responded' | 'closed' | 'lost';
  notes: LeadNote[] | null;
  follow_up_date: string | null;
  last_contacted_at: string | null;
  priority: 'high' | 'medium' | 'low';
  tags: string[] | null;
  preview_token: string | null;
  outreach_generated: boolean;
  outreach_data: Lead['outreachData'] | null;
  created_at: string;
  updated_at: string;
};

// Database row type for lead_websites table
export type LeadWebsiteRow = {
  id: string;
  project_id: string;
  lead_id: string;
  preview_token: string;
  data: LeadWebsiteArtifact;
  created_at: string;
  expires_at: string;
};

// Database row type for lead_activities table
export type LeadActivityRow = {
  id: string;
  lead_id: string;
  type: LeadActivity['type'];
  content: string | null;
  metadata: LeadActivity['metadata'] | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: Project;
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at'>>;
      };
      artifacts: {
        Row: Artifact;
        Insert: Omit<Artifact, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Artifact, 'id' | 'created_at' | 'updated_at'>>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, 'id' | 'created_at'>;
        Update: Partial<Omit<Message, 'id' | 'created_at'>>;
      };
      leads: {
        Row: LeadRow;
        Insert: Omit<LeadRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<LeadRow, 'id' | 'created_at' | 'updated_at'>>;
      };
      lead_websites: {
        Row: LeadWebsiteRow;
        Insert: Omit<LeadWebsiteRow, 'id' | 'created_at'>;
        Update: Partial<Omit<LeadWebsiteRow, 'id' | 'created_at'>>;
      };
      lead_activities: {
        Row: LeadActivityRow;
        Insert: Omit<LeadActivityRow, 'id' | 'created_at'>;
        Update: Partial<Omit<LeadActivityRow, 'id' | 'created_at'>>;
      };
    };
  };
};

// ============================================
// HELPER TYPE GUARDS
// ============================================

export function isWebsiteArtifact(data: ArtifactData): data is WebsiteArtifact {
  return 'files' in data && 'primaryPage' in data;
}

export function isIdentityArtifact(data: ArtifactData): data is IdentityArtifact {
  return 'logoUrl' in data && 'colors' in data && 'font' in data;
}

export function isResearchArtifact(data: ArtifactData): data is ResearchArtifact {
  return 'competitors' in data && 'marketSummary' in data;
}

export function isBusinessPlanArtifact(data: ArtifactData): data is BusinessPlanArtifact {
  return 'executiveSummary' in data && 'pricingTiers' in data;
}

export function isLeadsArtifact(data: ArtifactData): data is LeadsArtifact {
  return 'leads' in data && 'idealCustomerProfile' in data;
}

export function isOutreachArtifact(data: ArtifactData): data is OutreachArtifact {
  return 'scripts' in data && Array.isArray((data as OutreachArtifact).scripts);
}

export function isFirstWeekPlanArtifact(data: ArtifactData): data is FirstWeekPlanArtifact {
  return 'strategy' in data && 'days' in data && 'expectedMetrics' in data;
}

export function isLongTermPlanArtifact(data: ArtifactData): data is LongTermPlanArtifact {
  return 'monthlyMilestones' in data && 'scalingStrategy' in data && 'yearOneProjection' in data;
}

export function isLeadWebsiteArtifact(data: ArtifactData): data is LeadWebsiteArtifact {
  return 'leadId' in data && 'previewToken' in data && 'files' in data;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Convert database row to Lead type
export function leadRowToLead(row: LeadRow): Lead {
  return {
    id: row.id,
    projectId: row.project_id,
    companyName: row.company_name,
    industry: row.industry || '',
    website: row.website || undefined,
    phone: row.phone || undefined,
    address: row.address || undefined,
    contactName: row.contact_name || undefined,
    contactEmail: row.contact_email || undefined,
    contactLinkedIn: row.contact_linkedin || undefined,
    contactTitle: row.contact_title || undefined,
    placeId: row.place_id || undefined,
    rating: row.rating || undefined,
    reviewCount: row.review_count || undefined,
    coordinates: row.coordinates || undefined,
    websiteAnalysis: row.website_analysis || undefined,
    score: row.score || 0,
    scoreBreakdown: row.score_breakdown || [],
    icpScore: row.icp_score || 0,
    icpMatchReasons: row.icp_match_reasons || [],
    buyingSignals: row.buying_signals || undefined,
    suggestedAngle: row.suggested_angle || undefined,
    painPoints: row.pain_points || [],
    status: row.status,
    notes: row.notes || undefined,
    followUpDate: row.follow_up_date || undefined,
    lastContactedAt: row.last_contacted_at || undefined,
    priority: row.priority,
    tags: row.tags || undefined,
    previewToken: row.preview_token || undefined,
    outreachGenerated: row.outreach_generated,
    outreachData: row.outreach_data || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Convert Lead type to database row format
export function leadToLeadRow(lead: Lead, projectId: string): Omit<LeadRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    project_id: projectId,
    company_name: lead.companyName,
    industry: lead.industry || null,
    website: lead.website || null,
    phone: lead.phone || null,
    address: lead.address || null,
    contact_name: lead.contactName || null,
    contact_email: lead.contactEmail || null,
    contact_linkedin: lead.contactLinkedIn || null,
    contact_title: lead.contactTitle || null,
    place_id: lead.placeId || null,
    rating: lead.rating || null,
    review_count: lead.reviewCount || null,
    coordinates: lead.coordinates || null,
    website_analysis: lead.websiteAnalysis || null,
    score: lead.score || null,
    score_breakdown: lead.scoreBreakdown || null,
    pain_points: lead.painPoints || null,
    icp_score: lead.icpScore || null,
    icp_match_reasons: lead.icpMatchReasons || null,
    buying_signals: lead.buyingSignals || null,
    suggested_angle: lead.suggestedAngle || null,
    status: lead.status,
    notes: lead.notes || null,
    follow_up_date: lead.followUpDate || null,
    last_contacted_at: lead.lastContactedAt || null,
    priority: lead.priority || 'medium',
    tags: lead.tags || null,
    preview_token: lead.previewToken || null,
    outreach_generated: lead.outreachGenerated || false,
    outreach_data: lead.outreachData || null,
  };
}
