-- Migration to fix onboarding errors
-- Run this in your Supabase SQL editor

-- Add onboarding_progress column to user_profiles table if it doesn't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS onboarding_progress jsonb DEFAULT '{}'::jsonb;

-- Add column for storing onboarding completed timestamp if needed
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamp with time zone;

-- Ensure all required columns exist with proper defaults
ALTER TABLE user_profiles 
ALTER COLUMN onboarding_completed SET DEFAULT false;

ALTER TABLE user_profiles 
ALTER COLUMN onboarding_step SET DEFAULT 0;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding 
ON user_profiles(clerk_user_id, onboarding_completed);

CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding_progress 
ON user_profiles USING gin(onboarding_progress);

-- Add comment explaining the structure
COMMENT ON COLUMN user_profiles.onboarding_progress IS 
'Stores onboarding progress data including completed steps, form data, and last saved timestamp';

-- Ensure the upsert will work properly
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_clerk_user_id_unique 
UNIQUE (clerk_user_id) ON CONFLICT DO NOTHING;
