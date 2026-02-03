-- Add missing columns to post_suggestions table for generate-smart API
-- Applied: 2026-01-23

-- Add copy_variants column (JSONB for platform-specific copy)
ALTER TABLE post_suggestions
ADD COLUMN IF NOT EXISTS copy_variants jsonb;

-- Add title column
ALTER TABLE post_suggestions
ADD COLUMN IF NOT EXISTS title text;

-- Add description column
ALTER TABLE post_suggestions
ADD COLUMN IF NOT EXISTS description text;

-- Add platforms column (array of platform names)
ALTER TABLE post_suggestions
ADD COLUMN IF NOT EXISTS platforms text[];

-- Add visual_style column (JSONB for visual specifications)
ALTER TABLE post_suggestions
ADD COLUMN IF NOT EXISTS visual_style jsonb;

-- Add engagement_data column (JSONB for predicted engagement metrics)
ALTER TABLE post_suggestions
ADD COLUMN IF NOT EXISTS engagement_data jsonb;

-- Create index on project_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_post_suggestions_project_id
ON post_suggestions(project_id);

-- Create index on user_id for faster user queries
CREATE INDEX IF NOT EXISTS idx_post_suggestions_user_id
ON post_suggestions(user_id);

-- Add comment explaining the new columns
COMMENT ON COLUMN post_suggestions.copy_variants IS 'Platform-specific copy variants with captions, hashtags, CTAs per platform';
COMMENT ON COLUMN post_suggestions.title IS 'Main title/hook for the post suggestion';
COMMENT ON COLUMN post_suggestions.description IS 'Description of the content type and purpose';
COMMENT ON COLUMN post_suggestions.platforms IS 'Array of target platforms for this suggestion';
COMMENT ON COLUMN post_suggestions.visual_style IS 'Visual specifications including style, colors, and descriptions';
COMMENT ON COLUMN post_suggestions.engagement_data IS 'Predicted engagement metrics, audience info, best posting times';
