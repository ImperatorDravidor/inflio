-- Enhanced user profiles for comprehensive onboarding
-- Adds platform handles, AI settings, legal consents, and more

-- Add new columns to user_profiles if they don't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS mission_statement TEXT,
ADD COLUMN IF NOT EXISTS content_purpose TEXT,
ADD COLUMN IF NOT EXISTS content_pillars JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS platform_handles JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS integrations JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS distribution_mode TEXT DEFAULT 'qa',
ADD COLUMN IF NOT EXISTS historical_content_urls JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ai_settings JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS legal_consents JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS persona_photo_count INTEGER DEFAULT 0;

-- Create personas table if not exists
CREATE TABLE IF NOT EXISTS personas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending_upload', -- pending_upload | photos_uploaded | training | ready | failed
  model_ref TEXT, -- Reference to trained LoRA model
  version INTEGER DEFAULT 1,
  training_job_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Create persona_images table for storing uploaded photos
CREATE TABLE IF NOT EXISTS persona_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  quality_score FLOAT, -- AI-determined quality score
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create thumbnail_history table for iteration tracking
CREATE TABLE IF NOT EXISTS thumbnail_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL, -- generate | iterate | variation
  prompt TEXT,
  base_prompt TEXT,
  edit_prompt TEXT,
  params JSONB DEFAULT '{}'::jsonb,
  model TEXT,
  lora_ref TEXT, -- Reference to persona LoRA if used
  seed INTEGER,
  input_image_url TEXT,
  output_url TEXT NOT NULL,
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  job_id TEXT,
  status TEXT DEFAULT 'completed',
  error TEXT,
  parent_id UUID REFERENCES thumbnail_history(id),
  chosen BOOLEAN DEFAULT FALSE,
  used_in_posts BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT
);

-- Create thumbnail_feedback table
CREATE TABLE IF NOT EXISTS thumbnail_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  generation_id UUID REFERENCES thumbnail_history(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create post_suggestions table
CREATE TABLE IF NOT EXISTS post_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL, -- carousel | quote | single | thread
  images JSONB DEFAULT '[]'::jsonb,
  platform_copy JSONB DEFAULT '{}'::jsonb,
  eligibility JSONB DEFAULT '{}'::jsonb,
  persona_id UUID REFERENCES personas(id),
  status TEXT DEFAULT 'suggested', -- suggested | edited | approved | staged | discarded
  version INTEGER DEFAULT 1,
  parent_id UUID REFERENCES post_suggestions(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT
);

-- Create image_generations table
CREATE TABLE IF NOT EXISTS image_generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  suggestion_id UUID REFERENCES post_suggestions(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  model TEXT NOT NULL,
  params JSONB DEFAULT '{}'::jsonb,
  prompt TEXT NOT NULL,
  output_urls JSONB DEFAULT '[]'::jsonb,
  job_id TEXT,
  status TEXT DEFAULT 'pending',
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update social_integrations to track platform handles
ALTER TABLE social_integrations
ADD COLUMN IF NOT EXISTS handle TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending_connection';

-- Add unique constraint for user_id + platform if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'social_integrations_user_platform_unique'
  ) THEN
    ALTER TABLE social_integrations 
    ADD CONSTRAINT social_integrations_user_platform_unique 
    UNIQUE (user_id, platform);
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_personas_user_id ON personas(user_id);
CREATE INDEX IF NOT EXISTS idx_persona_images_persona_id ON persona_images(persona_id);
CREATE INDEX IF NOT EXISTS idx_thumbnail_history_project_id ON thumbnail_history(project_id);
CREATE INDEX IF NOT EXISTS idx_thumbnail_history_parent_id ON thumbnail_history(parent_id);
CREATE INDEX IF NOT EXISTS idx_thumbnail_feedback_generation_id ON thumbnail_feedback(generation_id);
CREATE INDEX IF NOT EXISTS idx_post_suggestions_project_id ON post_suggestions(project_id);
CREATE INDEX IF NOT EXISTS idx_image_generations_suggestion_id ON image_generations(suggestion_id);

-- Add RLS policies
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE thumbnail_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE thumbnail_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_generations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for personas
CREATE POLICY "Users can view own personas" ON personas
  FOR SELECT USING (user_id = auth.uid() OR user_id = (SELECT clerk_user_id FROM user_profiles WHERE clerk_user_id = auth.uid()));

CREATE POLICY "Users can create own personas" ON personas
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id = (SELECT clerk_user_id FROM user_profiles WHERE clerk_user_id = auth.uid()));

CREATE POLICY "Users can update own personas" ON personas
  FOR UPDATE USING (user_id = auth.uid() OR user_id = (SELECT clerk_user_id FROM user_profiles WHERE clerk_user_id = auth.uid()));

CREATE POLICY "Users can delete own personas" ON personas
  FOR DELETE USING (user_id = auth.uid() OR user_id = (SELECT clerk_user_id FROM user_profiles WHERE clerk_user_id = auth.uid()));

-- Similar RLS policies for other tables (simplified for brevity)
-- In production, add full RLS for each table

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_personas_updated_at BEFORE UPDATE ON personas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust based on your auth setup)
GRANT ALL ON personas TO authenticated;
GRANT ALL ON persona_images TO authenticated;
GRANT ALL ON thumbnail_history TO authenticated;
GRANT ALL ON thumbnail_feedback TO authenticated;
GRANT ALL ON post_suggestions TO authenticated;
GRANT ALL ON image_generations TO authenticated;