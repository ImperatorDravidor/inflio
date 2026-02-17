-- Migration: Add missing columns used in application code
-- Date: 2025-10-30

-- Add processing_notes to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS processing_notes TEXT;

-- Add content_type to post_suggestions table
ALTER TABLE post_suggestions
ADD COLUMN IF NOT EXISTS content_type TEXT;

-- Add comments
COMMENT ON COLUMN projects.processing_notes IS 'Processing notes and error messages for debugging';
COMMENT ON COLUMN post_suggestions.content_type IS 'Type of content for the post suggestion (e.g., text, image, video)';



