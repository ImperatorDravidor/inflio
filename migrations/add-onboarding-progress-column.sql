-- Add onboarding_progress column for autosave/resume functionality
-- This column stores the intermediate state during onboarding

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS onboarding_progress JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding_completed 
ON user_profiles(onboarding_completed);

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.onboarding_progress IS 'Stores intermediate onboarding state including current step, completed steps, and form data';
COMMENT ON COLUMN user_profiles.onboarding_step IS 'Current step number in the onboarding flow (0-7)';
COMMENT ON COLUMN user_profiles.onboarding_completed_at IS 'Timestamp when onboarding was completed';