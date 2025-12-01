-- ============================================
-- ANYTHING V10 - COMPLETE SUPABASE SCHEMA
-- ============================================
-- This schema supports the full Anything application
-- including projects, messages, artifacts, and model selection
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROJECTS TABLE
-- ============================================
-- Stores user projects with selected AI model
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'anonymous',
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
  model_id TEXT DEFAULT 'google/gemini-3-pro-preview',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- ============================================
-- MESSAGES TABLE
-- ============================================
-- Stores chat messages for each project
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_project_id ON messages(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- ============================================
-- ARTIFACTS TABLE
-- ============================================
-- Stores generated artifacts (research, identity, website code)
CREATE TABLE IF NOT EXISTS artifacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('website_code', 'identity', 'market_research')),
  data JSONB NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, type)
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_artifacts_project_id ON artifacts(project_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_type ON artifacts(type);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
-- Automatically updates the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- APPLY TRIGGERS
-- ============================================
-- Trigger for projects table
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for artifacts table
DROP TRIGGER IF EXISTS update_artifacts_updated_at ON artifacts;
CREATE TRIGGER update_artifacts_updated_at
  BEFORE UPDATE ON artifacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================
-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - PUBLIC ACCESS (FOR NOW)
-- ============================================
-- Note: These policies allow public access for development
-- Update these when you implement authentication

-- Projects policies
DROP POLICY IF EXISTS "Allow public read access to projects" ON projects;
CREATE POLICY "Allow public read access to projects"
  ON projects FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert access to projects" ON projects;
CREATE POLICY "Allow public insert access to projects"
  ON projects FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access to projects" ON projects;
CREATE POLICY "Allow public update access to projects"
  ON projects FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Allow public delete access to projects" ON projects;
CREATE POLICY "Allow public delete access to projects"
  ON projects FOR DELETE
  USING (true);

-- Messages policies
DROP POLICY IF EXISTS "Allow public read access to messages" ON messages;
CREATE POLICY "Allow public read access to messages"
  ON messages FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert access to messages" ON messages;
CREATE POLICY "Allow public insert access to messages"
  ON messages FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access to messages" ON messages;
CREATE POLICY "Allow public update access to messages"
  ON messages FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Allow public delete access to messages" ON messages;
CREATE POLICY "Allow public delete access to messages"
  ON messages FOR DELETE
  USING (true);

-- Artifacts policies
DROP POLICY IF EXISTS "Allow public read access to artifacts" ON artifacts;
CREATE POLICY "Allow public read access to artifacts"
  ON artifacts FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert access to artifacts" ON artifacts;
CREATE POLICY "Allow public insert access to artifacts"
  ON artifacts FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access to artifacts" ON artifacts;
CREATE POLICY "Allow public update access to artifacts"
  ON artifacts FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Allow public delete access to artifacts" ON artifacts;
CREATE POLICY "Allow public delete access to artifacts"
  ON artifacts FOR DELETE
  USING (true);

-- ============================================
-- ENABLE REALTIME
-- ============================================
-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE artifacts;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify your schema is set up correctly:

-- Check tables exist
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check projects table structure
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'projects' ORDER BY ordinal_position;

-- Check if RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- ============================================
-- SAMPLE DATA (OPTIONAL - FOR TESTING)
-- ============================================
-- Uncomment to insert test data

-- INSERT INTO projects (name, description, status, model_id, user_id) VALUES
--   ('Coffee Shop Website', 'A modern coffee shop in downtown Seattle', 'active', 'google/gemini-3-pro-preview', 'test-user');

-- Get the project ID for testing
-- SELECT id FROM projects WHERE name = 'Coffee Shop Website';

-- ============================================
-- LEADS TABLE (CRM)
-- ============================================
-- Stores individual leads with full CRM functionality
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Basic Info
  company_name TEXT NOT NULL,
  industry TEXT,

  -- Contact Information
  website TEXT,
  phone TEXT,
  address TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_linkedin TEXT,
  contact_title TEXT,

  -- Google Maps Data
  place_id TEXT,
  rating DECIMAL(2,1),
  review_count INTEGER,
  coordinates JSONB,

  -- Website Analysis
  website_analysis JSONB,

  -- Scoring (1-100)
  score INTEGER CHECK (score >= 0 AND score <= 100),
  score_breakdown TEXT[],
  pain_points TEXT[],

  -- Legacy ICP fields (for backwards compatibility)
  icp_score INTEGER DEFAULT 0,
  icp_match_reasons TEXT[],
  buying_signals TEXT[],
  suggested_angle TEXT,

  -- CRM Fields
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'responded', 'closed', 'lost')),
  notes JSONB DEFAULT '[]',
  follow_up_date TIMESTAMPTZ,
  last_contacted_at TIMESTAMPTZ,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  tags TEXT[],

  -- Generated Content References
  preview_token TEXT,
  outreach_generated BOOLEAN DEFAULT FALSE,
  outreach_data JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_leads_project ON leads(project_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_follow_up ON leads(follow_up_date) WHERE follow_up_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority);

-- Trigger for leads table
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- LEAD WEBSITES TABLE
-- ============================================
-- Stores generated website previews for leads (with 30-day expiration)
CREATE TABLE IF NOT EXISTS lead_websites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  preview_token TEXT UNIQUE NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_lead_websites_token ON lead_websites(preview_token);
CREATE INDEX IF NOT EXISTS idx_lead_websites_project ON lead_websites(project_id);
CREATE INDEX IF NOT EXISTS idx_lead_websites_lead ON lead_websites(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_websites_expires ON lead_websites(expires_at);

-- ============================================
-- LEAD ACTIVITIES TABLE
-- ============================================
-- Tracks all activities for leads (notes, status changes, emails, etc.)
CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('note_added', 'status_changed', 'email_generated', 'website_generated', 'outreach_sent', 'call_made', 'follow_up_set')),
  content TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_activities_lead ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON lead_activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_created ON lead_activities(created_at DESC);

-- ============================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================

-- Enable RLS on new tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;

-- Leads policies
DROP POLICY IF EXISTS "Allow public read access to leads" ON leads;
CREATE POLICY "Allow public read access to leads"
  ON leads FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert access to leads" ON leads;
CREATE POLICY "Allow public insert access to leads"
  ON leads FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access to leads" ON leads;
CREATE POLICY "Allow public update access to leads"
  ON leads FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Allow public delete access to leads" ON leads;
CREATE POLICY "Allow public delete access to leads"
  ON leads FOR DELETE
  USING (true);

-- Lead websites policies
DROP POLICY IF EXISTS "Allow public read access to lead_websites" ON lead_websites;
CREATE POLICY "Allow public read access to lead_websites"
  ON lead_websites FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert access to lead_websites" ON lead_websites;
CREATE POLICY "Allow public insert access to lead_websites"
  ON lead_websites FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access to lead_websites" ON lead_websites;
CREATE POLICY "Allow public update access to lead_websites"
  ON lead_websites FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Allow public delete access to lead_websites" ON lead_websites;
CREATE POLICY "Allow public delete access to lead_websites"
  ON lead_websites FOR DELETE
  USING (true);

-- Lead activities policies
DROP POLICY IF EXISTS "Allow public read access to lead_activities" ON lead_activities;
CREATE POLICY "Allow public read access to lead_activities"
  ON lead_activities FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert access to lead_activities" ON lead_activities;
CREATE POLICY "Allow public insert access to lead_activities"
  ON lead_activities FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete access to lead_activities" ON lead_activities;
CREATE POLICY "Allow public delete access to lead_activities"
  ON lead_activities FOR DELETE
  USING (true);

-- ============================================
-- ENABLE REALTIME FOR NEW TABLES
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE leads;
ALTER PUBLICATION supabase_realtime ADD TABLE lead_activities;

-- ============================================
-- CLEANUP FUNCTION FOR EXPIRED LEAD WEBSITES
-- ============================================
-- Run this periodically via cron or Supabase Edge Function
-- DELETE FROM lead_websites WHERE expires_at < NOW();

-- ============================================
-- CLEANUP (IF NEEDED)
-- ============================================
-- Uncomment these ONLY if you want to completely reset the database

-- DROP TABLE IF EXISTS lead_activities CASCADE;
-- DROP TABLE IF EXISTS lead_websites CASCADE;
-- DROP TABLE IF EXISTS leads CASCADE;
-- DROP TABLE IF EXISTS artifacts CASCADE;
-- DROP TABLE IF EXISTS messages CASCADE;
-- DROP TABLE IF EXISTS projects CASCADE;
-- DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
