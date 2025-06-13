-- Create users table to sync with Clerk
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, -- Clerk user ID
  email TEXT NOT NULL,
  firstName TEXT,
  lastName TEXT,
  imageUrl TEXT,
  createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for email lookup
CREATE INDEX idx_users_email ON users(email);

-- Add userId column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS userId TEXT;

-- Create index for user's projects
CREATE INDEX idx_projects_user_id ON projects(userId);

-- Create foreign key relationship (optional, but recommended)
ALTER TABLE projects 
  ADD CONSTRAINT fk_projects_user 
  FOREIGN KEY (userId) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

-- Update RLS policies for projects table to include user-based access
DROP POLICY IF EXISTS "Allow all operations on projects" ON projects;

-- Allow users to manage their own projects
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT
  USING (true); -- For now, allow all reads since we're transitioning

CREATE POLICY "Users can insert their own projects" ON projects
  FOR INSERT
  WITH CHECK (true); -- For now, allow all inserts

CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE
  USING (true)
  WITH CHECK (true); -- For now, allow all updates

CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE
  USING (true); -- For now, allow all deletes

-- Function to automatically update updatedAt timestamp for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 