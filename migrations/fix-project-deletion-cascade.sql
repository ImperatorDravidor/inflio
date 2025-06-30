-- Fix foreign key constraints to properly cascade on project deletion
-- This prevents orphaned data when projects are deleted

-- 1. Fix social_posts table
ALTER TABLE social_posts 
DROP CONSTRAINT IF EXISTS social_posts_project_id_fkey;

ALTER TABLE social_posts 
ADD CONSTRAINT social_posts_project_id_fkey 
FOREIGN KEY (project_id) 
REFERENCES projects(id) 
ON DELETE CASCADE;

-- 2. Fix user_profile_embeddings table
ALTER TABLE user_profile_embeddings 
DROP CONSTRAINT IF EXISTS user_profile_embeddings_project_id_fkey;

ALTER TABLE user_profile_embeddings 
ADD CONSTRAINT user_profile_embeddings_project_id_fkey 
FOREIGN KEY (project_id) 
REFERENCES projects(id) 
ON DELETE CASCADE;

-- 3. Fix social_analytics table
ALTER TABLE social_analytics 
DROP CONSTRAINT IF EXISTS social_analytics_project_id_fkey;

ALTER TABLE social_analytics 
ADD CONSTRAINT social_analytics_project_id_fkey 
FOREIGN KEY (project_id) 
REFERENCES projects(id) 
ON DELETE CASCADE;

-- 4. Create a function to clean up orphaned storage files
-- This can be called periodically or after project deletion
CREATE OR REPLACE FUNCTION cleanup_orphaned_storage()
RETURNS void AS $$
DECLARE
  project_record RECORD;
BEGIN
  -- Find project IDs that exist in storage but not in projects table
  -- This would require integration with storage API
  -- For now, this is a placeholder for manual cleanup
  RAISE NOTICE 'Storage cleanup should be handled by the application layer';
END;
$$ LANGUAGE plpgsql;

-- 5. Create a trigger to log project deletions for audit
CREATE TABLE IF NOT EXISTS project_deletion_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  project_title TEXT,
  deleted_by TEXT,
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- 6. Create function to log deletions
CREATE OR REPLACE FUNCTION log_project_deletion()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO project_deletion_log (project_id, project_title, deleted_by, metadata)
  VALUES (
    OLD.id,
    OLD.title,
    current_user,
    jsonb_build_object(
      'video_url', OLD.video_url,
      'thumbnail_url', OLD.thumbnail_url,
      'status', OLD.status,
      'user_id', OLD.user_id
    )
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for deletion logging
DROP TRIGGER IF EXISTS project_deletion_trigger ON projects;
CREATE TRIGGER project_deletion_trigger
BEFORE DELETE ON projects
FOR EACH ROW
EXECUTE FUNCTION log_project_deletion();

-- 8. Add index for better performance on project_id lookups
CREATE INDEX IF NOT EXISTS idx_social_posts_project_id ON social_posts(project_id);
CREATE INDEX IF NOT EXISTS idx_social_analytics_project_id ON social_analytics(project_id);
CREATE INDEX IF NOT EXISTS idx_user_profile_embeddings_project_id ON user_profile_embeddings(project_id);

-- 9. Clean up existing orphaned records (optional - run manually if needed)
-- DELETE FROM social_posts WHERE project_id IS NOT NULL AND project_id NOT IN (SELECT id FROM projects);
-- DELETE FROM social_analytics WHERE project_id IS NOT NULL AND project_id NOT IN (SELECT id FROM projects);
-- DELETE FROM user_profile_embeddings WHERE project_id IS NOT NULL AND project_id NOT IN (SELECT id FROM projects);

COMMENT ON TABLE project_deletion_log IS 'Audit log for project deletions to track what was deleted and when'; 