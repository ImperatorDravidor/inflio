-- Migration: Add processing_notes column to projects
-- Description: Stores processing status messages and errors
-- Date: 2025-10-30

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS processing_notes TEXT;

COMMENT ON COLUMN projects.processing_notes IS 'Status messages and notes from video processing';





