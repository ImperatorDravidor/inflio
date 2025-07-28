-- Fix RLS Policies for user_usage table
-- This allows authenticated users to manage their own usage records

-- Enable RLS on user_usage table
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own usage" ON user_usage;
DROP POLICY IF EXISTS "Users can insert own usage" ON user_usage;
DROP POLICY IF EXISTS "Users can update own usage" ON user_usage;
DROP POLICY IF EXISTS "Service role can do anything" ON user_usage;

-- Policy: Users can view their own usage
CREATE POLICY "Users can view own usage"
ON user_usage
FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own usage record
CREATE POLICY "Users can insert own usage"
ON user_usage
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own usage
CREATE POLICY "Users can update own usage"
ON user_usage
FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- Policy: Service role can do anything (for server-side operations)
CREATE POLICY "Service role can do anything"
ON user_usage
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Also fix RLS for other related tables while we're at it
-- Enable RLS on projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop existing project policies
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

-- Policy: Users can view their own projects
CREATE POLICY "Users can view own projects"
ON projects
FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own projects
CREATE POLICY "Users can insert own projects"
ON projects
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own projects
CREATE POLICY "Users can update own projects"
ON projects
FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id);

-- Policy: Users can delete their own projects
CREATE POLICY "Users can delete own projects"
ON projects
FOR DELETE
TO authenticated
USING (auth.uid()::text = user_id);

-- Enable RLS on user_profiles table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing user_profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (auth.uid()::text = clerk_user_id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = clerk_user_id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid()::text = clerk_user_id);