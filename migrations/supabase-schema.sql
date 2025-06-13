-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  video_id UUID NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  metadata JSONB NOT NULL,
  transcription JSONB,
  folders JSONB NOT NULL DEFAULT '{"clips": [], "blog": [], "social": [], "podcast": []}',
  tasks JSONB NOT NULL DEFAULT '[]',
  settings JSONB NOT NULL DEFAULT '{"autoGenerateClips": true, "clipDuration": 60, "blogStyle": "professional", "socialPlatforms": ["twitter", "linkedin", "youtube-short"], "language": "en"}',
  analytics JSONB NOT NULL DEFAULT '{"totalViews": 0, "totalEngagement": 0, "bestPerformingContent": ""}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'ready', 'published')),
  tags TEXT[] DEFAULT '{}',
  user_id TEXT
);

-- Create index for faster queries
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_projects_title ON projects(title);
CREATE INDEX idx_projects_user_id ON projects(user_id);

-- Create storage bucket for videos (run this in Supabase Dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true);

-- Enable RLS (Row Level Security) - optional, but recommended
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for now (since no auth)
CREATE POLICY "Allow all operations on projects" ON projects
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to automatically update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updatedAt
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 