-- Make integration_id optional for demo/staging purposes
-- This allows creating scheduled posts without connected social accounts

-- Make integration_id nullable in social_posts table
ALTER TABLE social_posts 
ALTER COLUMN integration_id DROP NOT NULL;

-- Add a comment to indicate demo posts
COMMENT ON COLUMN social_posts.integration_id IS 'NULL for demo/staged posts without connected accounts';

-- Add a demo platform field to track intended platform when no integration exists
ALTER TABLE social_posts 
ADD COLUMN IF NOT EXISTS demo_platform TEXT;

-- Add index for demo posts
CREATE INDEX IF NOT EXISTS idx_social_posts_demo 
ON social_posts(user_id, state) 
WHERE integration_id IS NULL;

-- Update the check constraint to ensure either integration_id or demo_platform is set
ALTER TABLE social_posts 
ADD CONSTRAINT social_posts_platform_check 
CHECK (integration_id IS NOT NULL OR demo_platform IS NOT NULL);