-- Fix duplicate user profiles issue
-- This removes duplicates and keeps only the most recent profile for each user

-- First, identify duplicate profiles
WITH duplicate_profiles AS (
  SELECT clerk_user_id, COUNT(*) as count
  FROM user_profiles
  GROUP BY clerk_user_id
  HAVING COUNT(*) > 1
)
SELECT * FROM duplicate_profiles;

-- Delete older duplicates, keeping only the most recent one
DELETE FROM user_profiles
WHERE id NOT IN (
  SELECT DISTINCT ON (clerk_user_id) id
  FROM user_profiles
  ORDER BY clerk_user_id, created_at DESC
);

-- Add a unique constraint to prevent future duplicates
ALTER TABLE user_profiles
ADD CONSTRAINT unique_clerk_user_id UNIQUE (clerk_user_id);

-- Verify no duplicates remain
SELECT clerk_user_id, COUNT(*) as count
FROM user_profiles
GROUP BY clerk_user_id
HAVING COUNT(*) > 1; 