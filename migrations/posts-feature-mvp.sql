-- Posts Feature MVP - Database Schema
-- Generated social media post suggestions with images and copy

-- Post suggestions table (stores AI-generated post ideas)
CREATE TABLE IF NOT EXISTS post_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  
  -- Content type and metadata
  content_type TEXT NOT NULL CHECK (content_type IN ('carousel', 'quote', 'single', 'thread')),
  title TEXT NOT NULL,
  description TEXT,
  
  -- Generated content
  images JSONB DEFAULT '[]', -- Array of image URLs with metadata
  copy_variants JSONB DEFAULT '{}', -- Platform-specific copy (captions, hashtags, CTAs)
  
  -- Eligibility and platform data
  eligible_platforms TEXT[] DEFAULT '{}',
  platform_requirements JSONB DEFAULT '{}', -- Platform-specific requirements/warnings
  
  -- Persona integration
  persona_id UUID REFERENCES personas(id) ON DELETE SET NULL,
  persona_used BOOLEAN DEFAULT FALSE,
  
  -- Generation metadata
  generation_prompt TEXT,
  generation_model TEXT,
  generation_params JSONB DEFAULT '{}',
  
  -- Status and workflow
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'ready', 'approved', 'staged', 'published', 'failed')),
  error_message TEXT,
  
  -- User interaction
  feedback TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  engagement_prediction DECIMAL(3,2) CHECK (engagement_prediction >= 0 AND engagement_prediction <= 1),
  edited_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Image generations for posts (tracks individual image generation)
CREATE TABLE IF NOT EXISTS post_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  suggestion_id UUID NOT NULL REFERENCES post_suggestions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  
  -- Image details
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  platform TEXT NOT NULL,
  dimensions TEXT NOT NULL, -- e.g., "1080x1350", "1920x1080"
  file_size INTEGER,
  
  -- Generation details
  prompt TEXT NOT NULL,
  model TEXT NOT NULL,
  persona_id UUID REFERENCES personas(id) ON DELETE SET NULL,
  generation_params JSONB DEFAULT '{}',
  
  -- Position in carousel/set
  position INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'generated' CHECK (status IN ('generating', 'generated', 'failed', 'deleted')),
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Platform copy variants (stores platform-specific text)
CREATE TABLE IF NOT EXISTS post_copy (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  suggestion_id UUID NOT NULL REFERENCES post_suggestions(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  
  -- Content fields
  caption TEXT NOT NULL,
  hashtags TEXT[] DEFAULT '{}',
  cta TEXT,
  title TEXT, -- For YouTube/LinkedIn
  description TEXT, -- For YouTube/LinkedIn
  
  -- Character counts
  caption_length INTEGER GENERATED ALWAYS AS (char_length(caption)) STORED,
  total_length INTEGER, -- Including hashtags
  
  -- Validation
  is_valid BOOLEAN DEFAULT TRUE,
  validation_errors TEXT[],
  
  -- User edits
  is_edited BOOLEAN DEFAULT FALSE,
  edited_caption TEXT,
  edited_hashtags TEXT[],
  edited_cta TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(suggestion_id, platform)
);

-- Generation jobs tracking
CREATE TABLE IF NOT EXISTS post_generation_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  
  -- Job details
  job_type TEXT NOT NULL CHECK (job_type IN ('batch_suggestions', 'single_image', 'batch_images', 'copy_generation', 'regenerate')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  
  -- Input/Output
  input_params JSONB NOT NULL,
  output_data JSONB,
  
  -- Progress tracking
  total_items INTEGER DEFAULT 1,
  completed_items INTEGER DEFAULT 0,
  progress_percentage INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN total_items > 0 THEN (completed_items * 100 / total_items)
      ELSE 0
    END
  ) STORED,
  
  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_post_suggestions_project_id ON post_suggestions(project_id);
CREATE INDEX idx_post_suggestions_user_id ON post_suggestions(user_id);
CREATE INDEX idx_post_suggestions_status ON post_suggestions(status);
CREATE INDEX idx_post_suggestions_created_at ON post_suggestions(created_at DESC);

CREATE INDEX idx_post_images_suggestion_id ON post_images(suggestion_id);
CREATE INDEX idx_post_images_user_id ON post_images(user_id);

CREATE INDEX idx_post_copy_suggestion_id ON post_copy(suggestion_id);
CREATE INDEX idx_post_copy_platform ON post_copy(platform);

CREATE INDEX idx_post_generation_jobs_project_id ON post_generation_jobs(project_id);
CREATE INDEX idx_post_generation_jobs_status ON post_generation_jobs(status);

-- RLS Policies
ALTER TABLE post_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_copy ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_generation_jobs ENABLE ROW LEVEL SECURITY;

-- Post suggestions policies
CREATE POLICY "Users can view own post suggestions" ON post_suggestions
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own post suggestions" ON post_suggestions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own post suggestions" ON post_suggestions
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own post suggestions" ON post_suggestions
  FOR DELETE USING (auth.uid()::text = user_id);

-- Post images policies
CREATE POLICY "Users can view own post images" ON post_images
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own post images" ON post_images
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own post images" ON post_images
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own post images" ON post_images
  FOR DELETE USING (auth.uid()::text = user_id);

-- Post copy policies
CREATE POLICY "Users can view own post copy" ON post_copy
  FOR SELECT USING (
    suggestion_id IN (SELECT id FROM post_suggestions WHERE user_id = auth.uid()::text)
  );

CREATE POLICY "Users can insert own post copy" ON post_copy
  FOR INSERT WITH CHECK (
    suggestion_id IN (SELECT id FROM post_suggestions WHERE user_id = auth.uid()::text)
  );

CREATE POLICY "Users can update own post copy" ON post_copy
  FOR UPDATE USING (
    suggestion_id IN (SELECT id FROM post_suggestions WHERE user_id = auth.uid()::text)
  );

CREATE POLICY "Users can delete own post copy" ON post_copy
  FOR DELETE USING (
    suggestion_id IN (SELECT id FROM post_suggestions WHERE user_id = auth.uid()::text)
  );

-- Generation jobs policies
CREATE POLICY "Users can view own generation jobs" ON post_generation_jobs
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own generation jobs" ON post_generation_jobs
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own generation jobs" ON post_generation_jobs
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Update triggers
CREATE TRIGGER update_post_suggestions_updated_at
  BEFORE UPDATE ON post_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_post_copy_updated_at
  BEFORE UPDATE ON post_copy
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Helper function to check platform eligibility
CREATE OR REPLACE FUNCTION check_platform_eligibility(
  content_type TEXT,
  image_count INTEGER,
  caption_length INTEGER,
  platform TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  CASE platform
    WHEN 'instagram' THEN
      -- IG: square/portrait, ≤10 images for carousels, caption ≤2200
      RETURN caption_length <= 2200 AND 
             (content_type != 'carousel' OR image_count <= 10);
    
    WHEN 'twitter' THEN
      -- X: 1-4 images, 280 chars
      RETURN caption_length <= 280 AND image_count <= 4;
    
    WHEN 'linkedin' THEN
      -- LinkedIn: 1-9 images, 3000 chars
      RETURN caption_length <= 3000 AND image_count <= 9;
    
    WHEN 'facebook' THEN
      -- Facebook: similar to IG
      RETURN caption_length <= 2200 AND 
             (content_type != 'carousel' OR image_count <= 10);
    
    WHEN 'youtube' THEN
      -- YouTube: only for video content or single images as thumbnails
      RETURN content_type = 'single';
    
    WHEN 'tiktok' THEN
      -- TikTok: primarily video, images need conversion
      RETURN FALSE; -- Images not directly eligible
    
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to get platform requirements
CREATE OR REPLACE FUNCTION get_platform_requirements() 
RETURNS JSONB AS $$
BEGIN
  RETURN jsonb_build_object(
    'instagram', jsonb_build_object(
      'max_caption_length', 2200,
      'max_hashtags', 30,
      'max_images', 10,
      'image_sizes', ARRAY['1080x1350', '1080x1080'],
      'video_max_duration', 60
    ),
    'twitter', jsonb_build_object(
      'max_caption_length', 280,
      'max_hashtags', 5,
      'max_images', 4,
      'image_sizes', ARRAY['1920x1080', '1200x675'],
      'video_max_duration', 140
    ),
    'linkedin', jsonb_build_object(
      'max_caption_length', 3000,
      'max_hashtags', 5,
      'max_images', 9,
      'image_sizes', ARRAY['1200x628', '1080x1080'],
      'video_max_duration', 600
    ),
    'facebook', jsonb_build_object(
      'max_caption_length', 2200,
      'max_hashtags', 30,
      'max_images', 10,
      'image_sizes', ARRAY['1200x630', '1080x1080'],
      'video_max_duration', 240
    ),
    'youtube', jsonb_build_object(
      'max_title_length', 100,
      'max_description_length', 5000,
      'max_tags', 500,
      'thumbnail_size', '1280x720',
      'shorts_max_duration', 60
    ),
    'tiktok', jsonb_build_object(
      'max_caption_length', 2200,
      'max_hashtags', 100,
      'video_only', true,
      'max_duration', 180,
      'min_duration', 3
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;