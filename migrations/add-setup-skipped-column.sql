-- Add setup_skipped column to track when users skip the 5-step setup flow
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS setup_skipped BOOLEAN DEFAULT false;

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_setup_skipped ON user_profiles(setup_skipped) WHERE setup_skipped = true;
