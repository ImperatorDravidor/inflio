-- Create staging sessions table for temporary staging data
CREATE TABLE IF NOT EXISTS staging_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id UUID NOT NULL,
  selected_content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours'
);

-- Add foreign key constraint for project_id if projects table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
    ALTER TABLE staging_sessions 
      ADD CONSTRAINT staging_sessions_project_id_fkey 
      FOREIGN KEY (project_id) 
      REFERENCES projects(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_staging_sessions_user_project ON staging_sessions(user_id, project_id);
CREATE INDEX IF NOT EXISTS idx_staging_sessions_expires ON staging_sessions(expires_at);

-- Enable RLS
ALTER TABLE staging_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own staging sessions" ON staging_sessions;
DROP POLICY IF EXISTS "Users can create own staging sessions" ON staging_sessions;
DROP POLICY IF EXISTS "Users can update own staging sessions" ON staging_sessions;
DROP POLICY IF EXISTS "Users can delete own staging sessions" ON staging_sessions;

-- Create RLS policies
CREATE POLICY "Users can view own staging sessions" ON staging_sessions
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create own staging sessions" ON staging_sessions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own staging sessions" ON staging_sessions
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own staging sessions" ON staging_sessions
  FOR DELETE USING (auth.uid()::text = user_id);

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_staging_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM staging_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT ALL ON staging_sessions TO authenticated;
GRANT ALL ON staging_sessions TO service_role;

-- Add comment for documentation
COMMENT ON TABLE staging_sessions IS 'Temporary storage for content staging workflow between project content selection and the staging tool';
COMMENT ON COLUMN staging_sessions.user_id IS 'User ID from auth.users';
COMMENT ON COLUMN staging_sessions.project_id IS 'Reference to the project being staged';
COMMENT ON COLUMN staging_sessions.selected_content IS 'JSON data containing selected content items for staging';
COMMENT ON COLUMN staging_sessions.expires_at IS 'Automatic expiration time for cleanup'; 