-- Add content_brief JSONB column to projects table
-- Stores the AI-generated strategic brief that aligns all downstream content generation

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS content_brief jsonb DEFAULT NULL;

COMMENT ON COLUMN projects.content_brief IS 'AI-generated content brief with core narrative, key takeaways, transcript highlights, tone guidance, and CTA for consistent cross-platform content';
