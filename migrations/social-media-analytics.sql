-- Social Media Analytics Tables

-- Platform connections table
CREATE TABLE IF NOT EXISTS social_platform_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES user_profiles(clerk_user_id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  platform_user_id VARCHAR(255),
  platform_username VARCHAR(255),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- Social media metrics table
CREATE TABLE IF NOT EXISTS social_media_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES user_profiles(clerk_user_id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  metric_date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  followers_gained INTEGER DEFAULT 0,
  total_followers INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2),
  avg_view_duration INTEGER, -- in seconds
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform, metric_date)
);

-- Content performance table
CREATE TABLE IF NOT EXISTS social_content_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES user_profiles(clerk_user_id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  platform VARCHAR(50) NOT NULL,
  content_id VARCHAR(255), -- Platform-specific content ID
  title TEXT,
  url TEXT,
  thumbnail_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform, content_id)
);

-- Milestones table
CREATE TABLE IF NOT EXISTS user_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES user_profiles(clerk_user_id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'followers', 'views', 'engagement', 'content'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  value DECIMAL(12,2),
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  platform VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recap views table (to track when users view their recaps)
CREATE TABLE IF NOT EXISTS recap_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES user_profiles(clerk_user_id) ON DELETE CASCADE,
  period VARCHAR(20) NOT NULL, -- 'week', 'month', 'quarter', 'year'
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Indexes for performance
CREATE INDEX idx_social_metrics_user_date ON social_media_metrics(user_id, metric_date DESC);
CREATE INDEX idx_social_metrics_platform ON social_media_metrics(platform);
CREATE INDEX idx_content_performance_user ON social_content_performance(user_id, published_at DESC);
CREATE INDEX idx_content_performance_views ON social_content_performance(views DESC);
CREATE INDEX idx_milestones_user ON user_milestones(user_id, achieved_at DESC);
CREATE INDEX idx_recap_views_user ON recap_views(user_id, viewed_at DESC);

-- Row Level Security (RLS)
ALTER TABLE social_platform_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_content_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE recap_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own platform connections" 
  ON social_platform_connections FOR SELECT 
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own platform connections" 
  ON social_platform_connections FOR INSERT 
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own platform connections" 
  ON social_platform_connections FOR UPDATE 
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own platform connections" 
  ON social_platform_connections FOR DELETE 
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can view own metrics" 
  ON social_media_metrics FOR SELECT 
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can view own content performance" 
  ON social_content_performance FOR SELECT 
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can view own milestones" 
  ON user_milestones FOR SELECT 
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can view own recap views" 
  ON recap_views FOR SELECT 
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own recap views" 
  ON recap_views FOR INSERT 
  WITH CHECK (user_id = auth.uid()::text);