-- Migration: Add Submagic project ID column
-- Description: Adds submagic_project_id column to store Submagic API project IDs
-- Date: 2025-10-30
-- Replaces: klap_project_id (Klap → Submagic migration)

-- Add submagic_project_id column to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS submagic_project_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_projects_submagic_project_id 
ON projects(submagic_project_id);

-- Add comment
COMMENT ON COLUMN projects.submagic_project_id IS 'Submagic API project ID for video caption generation';





