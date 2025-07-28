-- Add chapters column to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS chapters JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN projects.chapters IS 'Video chapters with timestamps, titles, descriptions, and keywords for easy navigation';

-- Create an index for better performance when querying projects with chapters
CREATE INDEX IF NOT EXISTS idx_projects_chapters ON projects USING GIN (chapters);

-- Example chapter structure:
-- {
--   "id": "chapter_1",
--   "title": "Introduction",
--   "description": "Overview of the video content",
--   "timestamp": 0,
--   "formattedTimestamp": "00:00",
--   "keywords": ["intro", "overview"],
--   "order": 0
-- } 