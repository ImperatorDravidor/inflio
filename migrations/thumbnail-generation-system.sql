-- Comprehensive Thumbnail Generation System
-- Production-ready schema with full tracking and analytics

-- Main thumbnail generations table
CREATE TABLE IF NOT EXISTS thumbnail_generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  
  -- Generation details
  prompt TEXT NOT NULL,
  enhanced_prompt TEXT,
  negative_prompt TEXT,
  
  -- Settings
  style VARCHAR(50) NOT NULL,
  quality VARCHAR(20) NOT NULL,
  platform VARCHAR(50) NOT NULL,
  
  -- Model information
  model VARCHAR(100) NOT NULL,
  model_version VARCHAR(50),
  seed INTEGER,
  guidance_scale FLOAT DEFAULT 7.5,
  inference_steps INTEGER DEFAULT 28,
  
  -- Persona integration
  persona_id UUID REFERENCES personas(id),
  persona_blend_strength INTEGER DEFAULT 50,
  
  -- Image details
  url TEXT NOT NULL,
  storage_path TEXT,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  file_size INTEGER,
  format VARCHAR(10) DEFAULT 'png',
  
  -- Hierarchy
  parent_id UUID REFERENCES thumbnail_generations(id),
  iteration_number INTEGER DEFAULT 1,
  variation_index INTEGER,
  generation_type VARCHAR(20) DEFAULT 'generate', -- generate | iterate | variation | enhance
  
  -- Performance metrics
  performance_score FLOAT,
  ctr_percentage FLOAT,
  engagement_rate FLOAT,
  
  -- A/B Testing
  ab_test_variant CHAR(1), -- A or B
  ab_test_group_id UUID,
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'pending', -- pending | processing | completed | failed
  error_message TEXT,
  processing_time_ms INTEGER,
  
  -- Usage tracking
  chosen BOOLEAN DEFAULT FALSE,
  used_in_posts BOOLEAN DEFAULT FALSE,
  used_as_project_thumbnail BOOLEAN DEFAULT FALSE,
  published_count INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Thumbnail feedback table
CREATE TABLE IF NOT EXISTS thumbnail_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  generation_id UUID NOT NULL REFERENCES thumbnail_generations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  
  -- Specific improvement areas
  improvements JSONB DEFAULT '[]', -- Array of improvement tags
  
  -- Categorized feedback
  composition_feedback TEXT,
  color_feedback TEXT,
  text_feedback TEXT,
  style_feedback TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Text overlays for thumbnails
CREATE TABLE IF NOT EXISTS thumbnail_text_overlays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  generation_id UUID NOT NULL REFERENCES thumbnail_generations(id) ON DELETE CASCADE,
  
  text_content TEXT NOT NULL,
  position VARCHAR(20), -- top-left, top-center, top-right, etc.
  font_family VARCHAR(100),
  font_size INTEGER,
  font_weight VARCHAR(20),
  text_color VARCHAR(7),
  background_color VARCHAR(7),
  shadow_settings JSONB,
  
  is_primary BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platform-specific optimizations
CREATE TABLE IF NOT EXISTS thumbnail_platform_optimizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  generation_id UUID NOT NULL REFERENCES thumbnail_generations(id) ON DELETE CASCADE,
  
  platform VARCHAR(50) NOT NULL,
  optimized_url TEXT,
  dimensions VARCHAR(20),
  file_size INTEGER,
  
  -- Platform-specific metadata
  youtube_metadata JSONB,
  instagram_metadata JSONB,
  linkedin_metadata JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics and performance tracking
CREATE TABLE IF NOT EXISTS thumbnail_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  generation_id UUID NOT NULL REFERENCES thumbnail_generations(id) ON DELETE CASCADE,
  
  -- View metrics
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr FLOAT GENERATED ALWAYS AS (
    CASE 
      WHEN impressions > 0 THEN (clicks::FLOAT / impressions * 100)
      ELSE 0
    END
  ) STORED,
  
  -- Engagement metrics
  likes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  
  -- Platform-specific metrics
  platform VARCHAR(50),
  platform_metrics JSONB DEFAULT '{}',
  
  -- Time-based tracking
  date DATE NOT NULL,
  hour INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A/B test groups
CREATE TABLE IF NOT EXISTS thumbnail_ab_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  name VARCHAR(255),
  description TEXT,
  
  variant_a_id UUID REFERENCES thumbnail_generations(id),
  variant_b_id UUID REFERENCES thumbnail_generations(id),
  
  -- Test configuration
  test_type VARCHAR(50), -- ctr | engagement | conversion
  sample_size INTEGER,
  confidence_level FLOAT DEFAULT 0.95,
  
  -- Results
  winner_variant CHAR(1),
  statistical_significance FLOAT,
  improvement_percentage FLOAT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- active | completed | cancelled
  
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Competitor analysis for inspiration
CREATE TABLE IF NOT EXISTS thumbnail_competitor_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  
  competitor_url TEXT NOT NULL,
  platform VARCHAR(50),
  
  -- Extracted features
  dominant_colors JSONB DEFAULT '[]',
  text_style JSONB,
  composition_type VARCHAR(50),
  estimated_ctr FLOAT,
  
  -- AI analysis
  style_tags JSONB DEFAULT '[]',
  effectiveness_score FLOAT,
  
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Batch generation jobs
CREATE TABLE IF NOT EXISTS thumbnail_batch_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  
  -- Job configuration
  prompts JSONB NOT NULL, -- Array of prompts
  settings JSONB NOT NULL,
  platform VARCHAR(50),
  
  -- Progress tracking
  total_count INTEGER NOT NULL,
  completed_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  
  -- Results
  generation_ids JSONB DEFAULT '[]',
  
  status VARCHAR(20) DEFAULT 'pending',
  error_message TEXT,
  
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Export templates for different software
CREATE TABLE IF NOT EXISTS thumbnail_export_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  name VARCHAR(255) NOT NULL,
  software VARCHAR(50), -- photoshop | canva | figma | premiere
  
  -- Template configuration
  layers JSONB,
  export_settings JSONB,
  file_format VARCHAR(20),
  
  is_public BOOLEAN DEFAULT FALSE,
  
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_thumbnail_generations_project_id ON thumbnail_generations(project_id);
CREATE INDEX IF NOT EXISTS idx_thumbnail_generations_user_id ON thumbnail_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_thumbnail_generations_parent_id ON thumbnail_generations(parent_id);
CREATE INDEX IF NOT EXISTS idx_thumbnail_generations_status ON thumbnail_generations(status);
CREATE INDEX IF NOT EXISTS idx_thumbnail_generations_platform ON thumbnail_generations(platform);
CREATE INDEX IF NOT EXISTS idx_thumbnail_generations_ab_test ON thumbnail_generations(ab_test_group_id);
CREATE INDEX IF NOT EXISTS idx_thumbnail_generations_created_at ON thumbnail_generations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_thumbnail_feedback_generation_id ON thumbnail_feedback(generation_id);
CREATE INDEX IF NOT EXISTS idx_thumbnail_analytics_generation_id ON thumbnail_analytics(generation_id);
CREATE INDEX IF NOT EXISTS idx_thumbnail_analytics_date ON thumbnail_analytics(date);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_thumbnail_generations_project_platform 
  ON thumbnail_generations(project_id, platform);
CREATE INDEX IF NOT EXISTS idx_thumbnail_generations_chosen_used 
  ON thumbnail_generations(chosen, used_in_posts);

-- Functions for analytics
CREATE OR REPLACE FUNCTION calculate_thumbnail_performance_score(
  p_ctr FLOAT,
  p_engagement_rate FLOAT,
  p_rating FLOAT
) RETURNS FLOAT AS $$
BEGIN
  RETURN (
    (COALESCE(p_ctr, 0) * 0.5) +
    (COALESCE(p_engagement_rate, 0) * 0.3) +
    (COALESCE(p_rating, 0) * 20 * 0.2)
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger to update performance scores
CREATE OR REPLACE FUNCTION update_thumbnail_performance_score()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating FLOAT;
  avg_ctr FLOAT;
  avg_engagement FLOAT;
BEGIN
  -- Get average rating
  SELECT AVG(rating) INTO avg_rating
  FROM thumbnail_feedback
  WHERE generation_id = NEW.generation_id;
  
  -- Get average CTR from analytics
  SELECT AVG(ctr) INTO avg_ctr
  FROM thumbnail_analytics
  WHERE generation_id = NEW.generation_id;
  
  -- Calculate engagement rate
  SELECT 
    AVG((likes + shares + comments + saves)::FLOAT / NULLIF(impressions, 0) * 100)
  INTO avg_engagement
  FROM thumbnail_analytics
  WHERE generation_id = NEW.generation_id;
  
  -- Update the performance score
  UPDATE thumbnail_generations
  SET 
    performance_score = calculate_thumbnail_performance_score(avg_ctr, avg_engagement, avg_rating),
    ctr_percentage = avg_ctr,
    engagement_rate = avg_engagement,
    updated_at = NOW()
  WHERE id = NEW.generation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_performance_on_feedback
AFTER INSERT OR UPDATE ON thumbnail_feedback
FOR EACH ROW
EXECUTE FUNCTION update_thumbnail_performance_score();

CREATE TRIGGER update_performance_on_analytics
AFTER INSERT OR UPDATE ON thumbnail_analytics
FOR EACH ROW
EXECUTE FUNCTION update_thumbnail_performance_score();

-- RLS Policies
ALTER TABLE thumbnail_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE thumbnail_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE thumbnail_text_overlays ENABLE ROW LEVEL SECURITY;
ALTER TABLE thumbnail_platform_optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE thumbnail_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE thumbnail_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE thumbnail_competitor_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE thumbnail_batch_jobs ENABLE ROW LEVEL SECURITY;

-- User can only see their own thumbnails
CREATE POLICY "Users can view own thumbnails" ON thumbnail_generations
  FOR ALL USING (user_id = auth.uid() OR user_id = current_setting('app.current_user', true));

CREATE POLICY "Users can view own feedback" ON thumbnail_feedback
  FOR ALL USING (user_id = auth.uid() OR user_id = current_setting('app.current_user', true));

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;