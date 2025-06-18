-- Social Media Management Schema for Inflio
-- Adapted from Postiz to work with Supabase and existing user system

-- Social Media Integrations (Connected Accounts)
CREATE TABLE IF NOT EXISTS social_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL, -- Clerk user ID
  internal_id TEXT NOT NULL,
  name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'instagram', 'tiktok', 'linkedin', 'twitter', 'facebook')),
  picture TEXT,
  provider_identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  refresh_token TEXT,
  token_expiration TIMESTAMPTZ,
  profile TEXT,
  disabled BOOLEAN DEFAULT FALSE,
  refresh_needed BOOLEAN DEFAULT FALSE,
  posting_times JSONB DEFAULT '[{"time":120}, {"time":400}, {"time":700}]'::jsonb,
  additional_settings JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(user_id, internal_id)
);

-- Social Media Posts
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  integration_id UUID NOT NULL REFERENCES social_integrations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL, -- Link to existing projects
  state TEXT DEFAULT 'draft' CHECK (state IN ('draft', 'scheduled', 'publishing', 'published', 'failed', 'cancelled')),
  publish_date TIMESTAMPTZ NOT NULL,
  content TEXT NOT NULL,
  title TEXT,
  description TEXT,
  media_urls TEXT[],
  hashtags TEXT[],
  settings JSONB,
  parent_post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE,
  error TEXT,
  analytics JSONB DEFAULT '{}'::jsonb, -- Store platform-specific analytics
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Post Tags
CREATE TABLE IF NOT EXISTS social_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(user_id, name, deleted_at)
);

-- Post Tags Join Table
CREATE TABLE IF NOT EXISTS social_post_tags (
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES social_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, tag_id)
);

-- Post Comments
CREATE TABLE IF NOT EXISTS social_post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Content Templates
CREATE TABLE IF NOT EXISTS social_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  platform TEXT,
  tags TEXT[],
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Analytics Snapshots
CREATE TABLE IF NOT EXISTS social_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID NOT NULL REFERENCES social_integrations(id) ON DELETE CASCADE,
  post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  metrics JSONB NOT NULL, -- Platform-specific metrics
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhooks for Social Media Events
CREATE TABLE IF NOT EXISTS social_webhooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  integration_id UUID REFERENCES social_integrations(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Sets (Groups of posts)
CREATE TABLE IF NOT EXISTS social_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Set Posts Join Table
CREATE TABLE IF NOT EXISTS social_set_posts (
  set_id UUID NOT NULL REFERENCES social_sets(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (set_id, post_id)
);

-- Indexes for performance
CREATE INDEX idx_social_integrations_user_id ON social_integrations(user_id);
CREATE INDEX idx_social_integrations_platform ON social_integrations(platform);
CREATE INDEX idx_social_posts_user_id ON social_posts(user_id);
CREATE INDEX idx_social_posts_publish_date ON social_posts(publish_date);
CREATE INDEX idx_social_posts_state ON social_posts(state);
CREATE INDEX idx_social_posts_integration_id ON social_posts(integration_id);
CREATE INDEX idx_social_analytics_integration_id ON social_analytics(integration_id);
CREATE INDEX idx_social_analytics_date ON social_analytics(date);

-- Row Level Security
ALTER TABLE social_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_set_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own integrations" ON social_integrations
  FOR ALL USING (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can manage their own posts" ON social_posts
  FOR ALL USING (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can manage their own tags" ON social_tags
  FOR ALL USING (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can manage their own post tags" ON social_post_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM social_posts 
      WHERE social_posts.id = social_post_tags.post_id 
      AND social_posts.user_id = auth.uid()::TEXT
    )
  );

CREATE POLICY "Users can manage their own comments" ON social_post_comments
  FOR ALL USING (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can view public templates or their own" ON social_templates
  FOR SELECT USING (is_public = TRUE OR auth.uid()::TEXT = user_id);

CREATE POLICY "Users can manage their own templates" ON social_templates
  FOR INSERT WITH CHECK (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can update their own templates" ON social_templates
  FOR UPDATE USING (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can delete their own templates" ON social_templates
  FOR DELETE USING (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can view their own analytics" ON social_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM social_integrations 
      WHERE social_integrations.id = social_analytics.integration_id 
      AND social_integrations.user_id = auth.uid()::TEXT
    )
  );

CREATE POLICY "Users can manage their own webhooks" ON social_webhooks
  FOR ALL USING (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can manage their own sets" ON social_sets
  FOR ALL USING (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can manage their own set posts" ON social_set_posts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM social_sets 
      WHERE social_sets.id = social_set_posts.set_id 
      AND social_sets.user_id = auth.uid()::TEXT
    )
  );

-- Functions
CREATE OR REPLACE FUNCTION update_social_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_social_integrations_updated_at
  BEFORE UPDATE ON social_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_social_updated_at();

CREATE TRIGGER update_social_posts_updated_at
  BEFORE UPDATE ON social_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_social_updated_at();

CREATE TRIGGER update_social_tags_updated_at
  BEFORE UPDATE ON social_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_social_updated_at();

CREATE TRIGGER update_social_templates_updated_at
  BEFORE UPDATE ON social_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_social_updated_at();

CREATE TRIGGER update_social_webhooks_updated_at
  BEFORE UPDATE ON social_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_social_updated_at();

CREATE TRIGGER update_social_sets_updated_at
  BEFORE UPDATE ON social_sets
  FOR EACH ROW
  EXECUTE FUNCTION update_social_updated_at(); 