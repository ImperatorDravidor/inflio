-- Future migration to add thumbnail history storage
-- This migration should be run when implementing proper thumbnail history

-- Add thumbnail_history column to projects table
-- ALTER TABLE projects 
-- ADD COLUMN IF NOT EXISTS thumbnail_history JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
-- COMMENT ON COLUMN projects.thumbnail_history IS 'History of generated thumbnails for the project';

-- Example thumbnail history structure:
-- [
--   {
--     "id": "thumb_123",
--     "url": "https://storage.url/thumbnail.png",
--     "prompt": "Create a thumbnail for...",
--     "style": "modern",
--     "quality": "hd",
--     "createdAt": "2024-01-01T00:00:00Z",
--     "metadata": {
--       "hasVideoSnippets": true,
--       "hasPersonalPhotos": false,
--       "mergeVideoWithPersona": false
--     }
--   }
-- ]

-- Note: Currently the API returns empty history.
-- When implementing, update:
-- 1. src/app/api/generate-thumbnail/route.ts GET handler
-- 2. src/app/api/generate-thumbnail/route.ts POST handler to save history
-- 3. Consider adding a cleanup mechanism for old thumbnails 