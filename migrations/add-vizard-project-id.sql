-- Add Vizard project ID column to projects table
-- This migration adds support for Vizard AI clip generation

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS vizard_project_id INTEGER;

-- Add comment explaining the column
COMMENT ON COLUMN projects.vizard_project_id IS 'Vizard AI project ID for tracking clip generation status';
