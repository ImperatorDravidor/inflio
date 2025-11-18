-- Migration: Add Submagic support to projects table
-- This adds the submagic_project_id field to track Submagic processing

-- Add submagic_project_id column to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS submagic_project_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_projects_submagic_id 
ON projects(submagic_project_id);

-- Add comment for documentation
COMMENT ON COLUMN projects.submagic_project_id IS 'Submagic project ID for clip generation tracking';

-- Optional: Migrate existing Klap IDs to Submagic IDs
-- Uncomment if you want to preserve old project references
-- UPDATE projects 
-- SET submagic_project_id = klap_project_id 
-- WHERE klap_project_id IS NOT NULL AND submagic_project_id IS NULL;

