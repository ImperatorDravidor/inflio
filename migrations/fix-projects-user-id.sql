-- Fix for projects table to use Clerk user IDs instead of UUIDs
-- This migration changes the user_id column from UUID to TEXT to support Clerk user IDs

-- Step 1: Drop any existing constraints and indexes on user_id
DROP INDEX IF EXISTS idx_projects_user_id;

-- Step 2: Alter the column type from UUID to TEXT
ALTER TABLE projects 
ALTER COLUMN user_id TYPE TEXT;

-- Step 3: Create an index on user_id for better query performance
CREATE INDEX idx_projects_user_id ON projects(user_id);

-- Step 4: Update Row Level Security policies if needed
-- First, drop existing policies
DROP POLICY IF EXISTS "Allow all operations on projects" ON projects;

-- Create a new policy that allows users to see only their own projects (optional)
-- If you want to keep it open for now (no auth restrictions), use this:
CREATE POLICY "Allow all operations on projects" ON projects
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- OR if you want to restrict to user's own projects (recommended for production):
-- CREATE POLICY "Users can view their own projects" ON projects
--   FOR SELECT
--   USING (auth.uid()::text = user_id);
-- 
-- CREATE POLICY "Users can insert their own projects" ON projects
--   FOR INSERT
--   WITH CHECK (auth.uid()::text = user_id);
-- 
-- CREATE POLICY "Users can update their own projects" ON projects
--   FOR UPDATE
--   USING (auth.uid()::text = user_id)
--   WITH CHECK (auth.uid()::text = user_id);
-- 
-- CREATE POLICY "Users can delete their own projects" ON projects
--   FOR DELETE
--   USING (auth.uid()::text = user_id);

-- Note: Run this SQL in your Supabase SQL editor to fix the issue 