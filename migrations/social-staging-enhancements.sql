-- Social Staging Enhancements
-- Updates the social posts table to better support the staging workflow

-- Make integration_id optional (for posts that haven't been connected to a platform yet)
ALTER TABLE social_posts 
  ALTER COLUMN integration_id DROP NOT NULL;

-- Add metadata column for storing additional information
ALTER TABLE social_posts 
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add index on project_id for faster queries
CREATE INDEX IF NOT EXISTS idx_social_posts_project_id ON social_posts(project_id);

-- Add index on metadata for platform filtering
CREATE INDEX IF NOT EXISTS idx_social_posts_metadata_platform ON social_posts((metadata->>'platform'));

-- Update the check constraint to include more states if needed
ALTER TABLE social_posts DROP CONSTRAINT IF EXISTS social_posts_state_check;
ALTER TABLE social_posts ADD CONSTRAINT social_posts_state_check 
  CHECK (state IN ('draft', 'scheduled', 'publishing', 'published', 'failed', 'cancelled', 'pending_review'));

-- Add a function to get posts by platform
CREATE OR REPLACE FUNCTION get_social_posts_by_platform(
  p_user_id TEXT,
  p_platform TEXT,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  publish_date TIMESTAMPTZ,
  state TEXT,
  media_urls TEXT[],
  hashtags TEXT[],
  metadata JSONB,
  project_id UUID,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.content,
    sp.publish_date,
    sp.state,
    sp.media_urls,
    sp.hashtags,
    sp.metadata,
    sp.project_id,
    sp.created_at
  FROM social_posts sp
  WHERE sp.user_id = p_user_id
    AND sp.deleted_at IS NULL
    AND (sp.metadata->>'platform' = p_platform OR 
         sp.metadata->'platforms' ? p_platform)
    AND (p_start_date IS NULL OR sp.publish_date >= p_start_date)
    AND (p_end_date IS NULL OR sp.publish_date <= p_end_date)
  ORDER BY sp.publish_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Add a function to bulk insert social posts
CREATE OR REPLACE FUNCTION bulk_insert_social_posts(
  p_posts JSONB
)
RETURNS SETOF social_posts AS $$
DECLARE
  v_post JSONB;
  v_result social_posts;
BEGIN
  FOR v_post IN SELECT * FROM jsonb_array_elements(p_posts)
  LOOP
    INSERT INTO social_posts (
      user_id,
      integration_id,
      project_id,
      state,
      publish_date,
      content,
      media_urls,
      hashtags,
      metadata,
      created_at,
      updated_at
    ) VALUES (
      v_post->>'user_id',
      NULLIF(v_post->>'integration_id', '')::UUID,
      NULLIF(v_post->>'project_id', '')::UUID,
      COALESCE(v_post->>'state', 'scheduled'),
      (v_post->>'publish_date')::TIMESTAMPTZ,
      v_post->>'content',
      ARRAY(SELECT jsonb_array_elements_text(v_post->'media_urls')),
      ARRAY(SELECT jsonb_array_elements_text(v_post->'hashtags')),
      COALESCE(v_post->'metadata', '{}'::jsonb),
      NOW(),
      NOW()
    )
    RETURNING * INTO v_result;
    
    RETURN NEXT v_result;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add a view for upcoming posts with project details
CREATE OR REPLACE VIEW upcoming_social_posts AS
SELECT 
  sp.id,
  sp.user_id,
  sp.content,
  sp.publish_date,
  sp.state,
  sp.media_urls,
  sp.hashtags,
  sp.metadata,
  sp.created_at,
  p.title as project_title,
  p.thumbnail_url as project_thumbnail,
  si.platform as integration_platform,
  si.name as integration_name,
  si.picture as integration_picture
FROM social_posts sp
LEFT JOIN projects p ON sp.project_id = p.id
LEFT JOIN social_integrations si ON sp.integration_id = si.id
WHERE sp.deleted_at IS NULL
  AND sp.state IN ('scheduled', 'publishing')
  AND sp.publish_date >= NOW()
ORDER BY sp.publish_date ASC;

-- Grant permissions on the view
GRANT SELECT ON upcoming_social_posts TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE social_posts IS 'Stores scheduled and published social media posts with support for multi-platform staging';
COMMENT ON COLUMN social_posts.metadata IS 'Stores additional data like platform, content type, engagement predictions, etc.';
COMMENT ON FUNCTION get_social_posts_by_platform IS 'Retrieves social posts filtered by platform and date range';
COMMENT ON FUNCTION bulk_insert_social_posts IS 'Efficiently inserts multiple social posts from the staging workflow';
COMMENT ON VIEW upcoming_social_posts IS 'Shows upcoming scheduled posts with related project and integration details'; 