-- Add fields for tracking onboarding completion states
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS brand_reviewed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS persona_reviewed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS socials_connected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_skipped BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_reminder_dismissed BOOLEAN DEFAULT false;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding_status 
ON user_profiles(clerk_user_id, onboarding_completed, brand_reviewed, persona_reviewed, socials_connected);
