-- Migration: Add Submagic Magic Clips and YouTube support to projects table
-- This adds fields for tracking YouTube uploads and Submagic clip processing

-- Add Submagic project ID column
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS submagic_project_id TEXT;

-- Add YouTube tracking columns
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS youtube_video_id TEXT,
ADD COLUMN IF NOT EXISTS youtube_video_url TEXT;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_projects_submagic_id 
ON projects(submagic_project_id);

CREATE INDEX IF NOT EXISTS idx_projects_youtube_id 
ON projects(youtube_video_id);

-- Add comments for documentation
COMMENT ON COLUMN projects.submagic_project_id IS 'Submagic Magic Clips project ID for clip generation tracking';
COMMENT ON COLUMN projects.youtube_video_id IS 'YouTube video ID for videos uploaded for clip generation';
COMMENT ON COLUMN projects.youtube_video_url IS 'Full YouTube video URL for reference';

