-- Create personas table
CREATE TABLE IF NOT EXISTS personas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  photos JSONB NOT NULL DEFAULT '[]',
  is_global BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_personas_user_id ON personas(user_id);
CREATE INDEX IF NOT EXISTS idx_personas_project_id ON personas(project_id);
CREATE INDEX IF NOT EXISTS idx_personas_is_global ON personas(is_global);

-- Create composite index for efficient queries
CREATE INDEX IF NOT EXISTS idx_personas_user_project ON personas(user_id, project_id);

-- RLS policies
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own personas
CREATE POLICY "Users can view own personas" ON personas
  FOR SELECT USING (auth.uid()::text = user_id);

-- Policy: Users can create their own personas  
CREATE POLICY "Users can create own personas" ON personas
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own personas
CREATE POLICY "Users can update own personas" ON personas
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Policy: Users can delete their own personas
CREATE POLICY "Users can delete own personas" ON personas
  FOR DELETE USING (auth.uid()::text = user_id);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_personas_updated_at
  BEFORE UPDATE ON personas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 