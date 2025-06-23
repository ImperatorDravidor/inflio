-- Create social_media_integrations table
CREATE TABLE IF NOT EXISTS social_media_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  internal_id TEXT,
  name TEXT,
  picture TEXT,
  provider_identifier TEXT,
  token TEXT NOT NULL,
  refresh_token TEXT,
  token_expiration TIMESTAMP WITH TIME ZONE,
  profile JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- Create indexes
CREATE INDEX idx_social_media_integrations_user_id ON social_media_integrations(user_id);
CREATE INDEX idx_social_media_integrations_platform ON social_media_integrations(platform);

-- Enable RLS
ALTER TABLE social_media_integrations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own integrations"
  ON social_media_integrations
  FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own integrations"
  ON social_media_integrations
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own integrations"
  ON social_media_integrations
  FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own integrations"
  ON social_media_integrations
  FOR DELETE
  USING (auth.uid()::text = user_id); 