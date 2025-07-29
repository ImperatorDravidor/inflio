-- Create social_graphics table to store generated graphics metadata
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
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_social_graphics_project_id ON social_graphics(project_id);
CREATE INDEX idx_social_graphics_user_id ON social_graphics(user_id);
CREATE INDEX idx_social_graphics_platform ON social_graphics(platform);
CREATE INDEX idx_social_graphics_created_at ON social_graphics(created_at DESC);

-- Add RLS policies
ALTER TABLE social_graphics ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own graphics
CREATE POLICY "Users can view own social graphics" ON social_graphics
  FOR SELECT USING (auth.uid()::text = user_id);

-- Policy for users to insert their own graphics
CREATE POLICY "Users can insert own social graphics" ON social_graphics
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Policy for users to update their own graphics
CREATE POLICY "Users can update own social graphics" ON social_graphics
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Policy for users to delete their own graphics
CREATE POLICY "Users can delete own social graphics" ON social_graphics
  FOR DELETE USING (auth.uid()::text = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_social_graphics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_social_graphics_updated_at_trigger
  BEFORE UPDATE ON social_graphics
  FOR EACH ROW
  EXECUTE FUNCTION update_social_graphics_updated_at(); 