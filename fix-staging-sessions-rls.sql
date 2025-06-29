-- Fix RLS policies for staging_sessions table to work with Clerk authentication

-- First, drop the existing policies that use auth.uid()
DROP POLICY IF EXISTS "Users can view own staging sessions" ON staging_sessions;
DROP POLICY IF EXISTS "Users can create own staging sessions" ON staging_sessions;
DROP POLICY IF EXISTS "Users can update own staging sessions" ON staging_sessions;
DROP POLICY IF EXISTS "Users can delete own staging sessions" ON staging_sessions;

-- Option 1: If you want to keep RLS but make it work with the user_id being passed from the app
-- Create new policies that always return true (since authentication is handled by Clerk in your app)
CREATE POLICY "Users can view own staging sessions" ON staging_sessions
  FOR SELECT USING (true);

CREATE POLICY "Users can create own staging sessions" ON staging_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own staging sessions" ON staging_sessions
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete own staging sessions" ON staging_sessions
  FOR DELETE USING (true);

-- Option 2: If you want to disable RLS entirely (simpler approach)
-- Uncomment the line below and comment out the policies above
-- ALTER TABLE staging_sessions DISABLE ROW LEVEL SECURITY;

-- Ensure the table has proper permissions
GRANT ALL ON staging_sessions TO anon;
GRANT ALL ON staging_sessions TO authenticated;
GRANT ALL ON staging_sessions TO service_role;

-- Also ensure the table exists with the correct structure
CREATE TABLE IF NOT EXISTS staging_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id UUID NOT NULL,
  selected_content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours'
);

-- Add foreign key constraint if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'staging_sessions_project_id_fkey'
  ) THEN
    ALTER TABLE staging_sessions 
      ADD CONSTRAINT staging_sessions_project_id_fkey 
      FOREIGN KEY (project_id) 
      REFERENCES projects(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- Add indexes if not exists
CREATE INDEX IF NOT EXISTS idx_staging_sessions_user_project ON staging_sessions(user_id, project_id);
CREATE INDEX IF NOT EXISTS idx_staging_sessions_expires ON staging_sessions(expires_at);

-- Test query to verify the table is accessible
-- You can run this after applying the fixes to ensure it works
-- SELECT * FROM staging_sessions LIMIT 1; 