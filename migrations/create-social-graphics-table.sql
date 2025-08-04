-- Create social_graphics table
CREATE TABLE IF NOT EXISTS social_graphics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  size TEXT NOT NULL,
  template TEXT,
  url TEXT NOT NULL,
  prompt TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_social_graphics_project_id ON social_graphics(project_id);
CREATE INDEX idx_social_graphics_user_id ON social_graphics(user_id);
CREATE INDEX idx_social_graphics_platform ON social_graphics(platform);
CREATE INDEX idx_social_graphics_created_at ON social_graphics(created_at DESC);

-- Enable RLS
ALTER TABLE social_graphics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own graphics" ON social_graphics
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can create their own graphics" ON social_graphics
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own graphics" ON social_graphics
  FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own graphics" ON social_graphics
  FOR DELETE USING (user_id = auth.uid()::text);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_social_graphics_updated_at BEFORE UPDATE ON social_graphics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 