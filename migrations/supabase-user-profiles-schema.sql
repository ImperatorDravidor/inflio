-- User profiles table to store user preferences and onboarding data
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  
  -- Basic info
  full_name TEXT,
  company_name TEXT,
  industry TEXT,
  company_size TEXT,
  role TEXT,
  
  -- Content preferences
  content_types TEXT[] DEFAULT '{}', -- ['educational', 'entertainment', 'promotional', 'testimonial']
  target_audience JSONB DEFAULT '{}', -- {demographics: [], interests: [], platforms: []}
  content_goals TEXT[] DEFAULT '{}', -- ['increase_engagement', 'build_brand', 'educate', 'sell']
  
  -- Brand preferences
  brand_colors JSONB DEFAULT '{}', -- {primary: '#hex', secondary: '#hex', accent: '#hex'}
  brand_fonts JSONB DEFAULT '{}', -- {heading: 'font-name', body: 'font-name'}
  brand_voice TEXT, -- 'professional', 'casual', 'friendly', 'authoritative', 'playful'
  brand_assets JSONB DEFAULT '{}', -- {logo_url: '', watermark_url: ''}
  
  -- Style preferences
  video_style TEXT, -- 'minimal', 'dynamic', 'corporate', 'creative', 'educational'
  transition_style TEXT, -- 'smooth', 'quick', 'dramatic', 'simple'
  music_preference TEXT, -- 'upbeat', 'calm', 'corporate', 'none', 'custom'
  
  -- Platform preferences
  primary_platforms TEXT[] DEFAULT '{}', -- ['youtube', 'tiktok', 'instagram', 'linkedin']
  posting_schedule JSONB DEFAULT '{}', -- {monday: ['morning'], tuesday: ['afternoon']}
  
  -- AI preferences
  ai_tone TEXT DEFAULT 'balanced', -- 'creative', 'balanced', 'conservative'
  auto_suggestions BOOLEAN DEFAULT true,
  preferred_clip_length INTEGER DEFAULT 60, -- in seconds
  
  -- Metadata
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_step INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- User embeddings table for AI context
CREATE TABLE IF NOT EXISTS user_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  embedding_type TEXT NOT NULL, -- 'profile', 'content_style', 'brand_voice', 'preferences'
  embedding vector(1536), -- OpenAI embedding dimension
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User content history for learning
CREATE TABLE IF NOT EXISTS user_content_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  content_type TEXT NOT NULL, -- 'clip', 'blog', 'social_post', 'template'
  content_data JSONB NOT NULL, -- actual content data
  performance_metrics JSONB DEFAULT '{}', -- views, engagement, etc.
  user_feedback JSONB DEFAULT '{}', -- liked, edited, rejected
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User preferences history for tracking changes
CREATE TABLE IF NOT EXISTS user_preferences_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  preference_type TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_user_profiles_clerk_user_id ON user_profiles(clerk_user_id);
CREATE INDEX idx_user_embeddings_user_profile_id ON user_embeddings(user_profile_id);
CREATE INDEX idx_user_embeddings_type ON user_embeddings(embedding_type);
CREATE INDEX idx_user_content_history_user_profile_id ON user_content_history(user_profile_id);
CREATE INDEX idx_user_content_history_content_type ON user_content_history(content_type);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_content_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences_history ENABLE ROW LEVEL SECURITY;

-- Policies (adjust based on your auth setup)
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (true); -- Will be updated with proper auth

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (true); -- Will be updated with proper auth

-- Function to update updated_at timestamp
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_embeddings_updated_at BEFORE UPDATE ON user_embeddings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable pgvector extension for embeddings (run in Supabase Dashboard)
-- CREATE EXTENSION IF NOT EXISTS vector; 