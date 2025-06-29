-- Create staging sessions table for temporary staging data
CREATE TABLE IF NOT EXISTS staging_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  selected_content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours'
);

-- Add indexes
CREATE INDEX idx_staging_sessions_user_project ON staging_sessions(user_id, project_id);
CREATE INDEX idx_staging_sessions_expires ON staging_sessions(expires_at);

-- RLS policies
ALTER TABLE staging_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own staging sessions
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

-- Schedule cleanup to run every hour (if pg_cron is enabled)
-- SELECT cron.schedule(
--   'cleanup-staging-sessions',
--   '0 * * * *',  -- Run every hour
--   'SELECT cleanup_expired_staging_sessions()'
-- ); 