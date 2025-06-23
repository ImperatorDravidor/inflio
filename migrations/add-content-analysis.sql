-- Add content_analysis column to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS content_analysis JSONB;

-- Create an index for better query performance on keywords and topics
CREATE INDEX IF NOT EXISTS idx_projects_content_analysis_keywords 
ON projects USING gin ((content_analysis->'keywords'));

CREATE INDEX IF NOT EXISTS idx_projects_content_analysis_topics 
ON projects USING gin ((content_analysis->'topics'));

-- Add comment to document the structure
COMMENT ON COLUMN projects.content_analysis IS 'AI-generated content analysis including keywords, topics, summary, sentiment, key moments, and content suggestions'; 