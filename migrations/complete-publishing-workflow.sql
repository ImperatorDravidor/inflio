-- Complete Publishing Workflow Migration
-- This migration adds all missing tables and updates for the publishing workflow

-- 1. Create staging_sessions table for temporary staging data
CREATE TABLE IF NOT EXISTS public.staging_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  selected_content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours'
);

-- Add indexes for staging_sessions
CREATE INDEX IF NOT EXISTS idx_staging_sessions_user_project ON public.staging_sessions(user_id, project_id);
CREATE INDEX IF NOT EXISTS idx_staging_sessions_expires ON public.staging_sessions(expires_at);

-- Enable RLS for staging_sessions
ALTER TABLE public.staging_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for staging_sessions
CREATE POLICY "Users can view own staging sessions" ON public.staging_sessions
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create own staging sessions" ON public.staging_sessions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own staging sessions" ON public.staging_sessions
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own staging sessions" ON public.staging_sessions
  FOR DELETE USING (auth.uid()::text = user_id);

-- 2. Add missing columns to projects table if they don't exist
DO $$ 
BEGIN
  -- Add klap_project_id for Klap integration
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'projects' 
                 AND column_name = 'klap_project_id') THEN
    ALTER TABLE public.projects ADD COLUMN klap_project_id TEXT;
  END IF;

  -- Add workflow_state for tracking project workflow progress
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'projects' 
                 AND column_name = 'workflow_state') THEN
    ALTER TABLE public.projects ADD COLUMN workflow_state JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- Update folders jsonb to include images array if not present
  UPDATE public.projects 
  SET folders = jsonb_set(
    folders,
    '{images}',
    COALESCE(folders->'images', '[]'::jsonb)
  )
  WHERE folders IS NOT NULL AND NOT (folders ? 'images');
END $$;

-- 3. Create thumbnail_generation_history table
CREATE TABLE IF NOT EXISTS public.thumbnail_generation_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  prompt TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('generate', 'edit')),
  style TEXT,
  quality TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT NOT NULL
);

-- Add index for thumbnail history
CREATE INDEX IF NOT EXISTS idx_thumbnail_history_project ON public.thumbnail_generation_history(project_id, created_at DESC);

-- Enable RLS for thumbnail_generation_history
ALTER TABLE public.thumbnail_generation_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for thumbnail_generation_history
CREATE POLICY "Users can view own thumbnail history" ON public.thumbnail_generation_history
  FOR SELECT USING (auth.uid()::text = created_by);

CREATE POLICY "Users can create own thumbnail history" ON public.thumbnail_generation_history
  FOR INSERT WITH CHECK (auth.uid()::text = created_by);

-- 4. Update social_posts table to ensure all needed columns exist
DO $$ 
BEGIN
  -- Add content_source to track where content originated from
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'social_posts' 
                 AND column_name = 'content_source') THEN
    ALTER TABLE public.social_posts ADD COLUMN content_source JSONB;
  END IF;

  -- Add original_content_id to link back to source content
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'social_posts' 
                 AND column_name = 'original_content_id') THEN
    ALTER TABLE public.social_posts ADD COLUMN original_content_id TEXT;
  END IF;

  -- Add content_type to identify the type of content
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'social_posts' 
                 AND column_name = 'content_type') THEN
    ALTER TABLE public.social_posts ADD COLUMN content_type TEXT CHECK (content_type IN ('clip', 'blog', 'image', 'carousel', 'longform'));
  END IF;
END $$;

-- 5. Create content_performance_analytics table
CREATE TABLE IF NOT EXISTS public.content_performance_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  engagement_score DECIMAL(5,2),
  virality_score DECIMAL(5,2),
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_content_analytics UNIQUE (project_id, content_type, content_id, platform, collected_at)
);

-- Add indexes for analytics
CREATE INDEX IF NOT EXISTS idx_content_analytics_project ON public.content_performance_analytics(project_id);
CREATE INDEX IF NOT EXISTS idx_content_analytics_scores ON public.content_performance_analytics(engagement_score DESC, virality_score DESC);

-- 6. Create function to clean up expired staging sessions
CREATE OR REPLACE FUNCTION cleanup_expired_staging_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.staging_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 7. Create function to update project workflow state
CREATE OR REPLACE FUNCTION update_project_workflow_state(
  p_project_id UUID,
  p_step TEXT,
  p_completed BOOLEAN,
  p_metadata JSONB DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE public.projects
  SET workflow_state = jsonb_set(
    COALESCE(workflow_state, '{}'::jsonb),
    ARRAY[p_step],
    jsonb_build_object(
      'completed', p_completed,
      'timestamp', NOW(),
      'metadata', COALESCE(p_metadata, '{}'::jsonb)
    )
  )
  WHERE id = p_project_id;
END;
$$ LANGUAGE plpgsql;

-- 8. Create view for content publishing status
CREATE OR REPLACE VIEW public.content_publishing_status AS
SELECT 
  p.id as project_id,
  p.title as project_title,
  p.user_id,
  p.publishing_status,
  p.last_published_at,
  COUNT(DISTINCT CASE WHEN sp.status = 'published' THEN sp.id END) as published_posts,
  COUNT(DISTINCT CASE WHEN sp.status = 'scheduled' THEN sp.id END) as scheduled_posts,
  COUNT(DISTINCT CASE WHEN sp.status = 'failed' THEN sp.id END) as failed_posts,
  jsonb_agg(DISTINCT sp.platform) FILTER (WHERE sp.platform IS NOT NULL) as platforms_used,
  MAX(sp.updated_at) as last_activity
FROM public.projects p
LEFT JOIN public.social_posts sp ON sp.project_id = p.id
GROUP BY p.id, p.title, p.user_id, p.publishing_status, p.last_published_at;

-- 9. Add helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_user_status ON public.projects(user_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_publishing ON public.projects(user_id, publishing_status, last_published_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_project_state ON public.social_posts(project_id, state, publish_date);
CREATE INDEX IF NOT EXISTS idx_social_posts_user_date ON public.social_posts(user_id, publish_date DESC);

-- 10. Create trigger to update project last_published_at
CREATE OR REPLACE FUNCTION update_project_last_published()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.state = 'published' AND OLD.state != 'published' THEN
    UPDATE public.projects
    SET last_published_at = NOW(),
        publishing_status = CASE 
          WHEN EXISTS (
            SELECT 1 FROM public.social_posts 
            WHERE project_id = NEW.project_id 
            AND state IN ('scheduled', 'draft')
          ) THEN 'partial'
          ELSE 'published'
        END
    WHERE id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_project_last_published ON public.social_posts;
CREATE TRIGGER trigger_update_project_last_published
  AFTER UPDATE ON public.social_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_project_last_published();

-- 11. Add RLS policies for new tables/views
-- Enable RLS on all tables that need it
ALTER TABLE public.content_performance_analytics ENABLE ROW LEVEL SECURITY;

-- RLS for content_performance_analytics
CREATE POLICY "Users can view analytics for their projects" ON public.content_performance_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p 
      WHERE p.id = content_performance_analytics.project_id 
      AND p.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert analytics for their projects" ON public.content_performance_analytics
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p 
      WHERE p.id = content_performance_analytics.project_id 
      AND p.user_id = auth.uid()::text
    )
  );

-- 12. Create scheduled job for cleanup (if pg_cron extension is available)
-- Note: Uncomment these lines if you have pg_cron extension enabled
-- SELECT cron.schedule(
--   'cleanup-staging-sessions',
--   '0 * * * *',  -- Run every hour
--   'SELECT cleanup_expired_staging_sessions()'
-- );

-- Grant necessary permissions
GRANT SELECT ON public.content_publishing_status TO authenticated;
GRANT ALL ON public.staging_sessions TO authenticated;
GRANT ALL ON public.thumbnail_generation_history TO authenticated;
GRANT ALL ON public.content_performance_analytics TO authenticated; 