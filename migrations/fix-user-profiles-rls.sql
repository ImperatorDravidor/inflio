-- Enable RLS on user_profiles if not already enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Create policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid()::text = clerk_user_id OR clerk_user_id IS NOT NULL);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid()::text = clerk_user_id OR clerk_user_id IS NOT NULL);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid()::text = clerk_user_id OR clerk_user_id IS NOT NULL);

-- Ensure all required columns exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS onboarding_progress JSONB,
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER,
ADD COLUMN IF NOT EXISTS onboarding_step_id TEXT,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS brand_reviewed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS persona_reviewed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS socials_connected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_skipped BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_reminder_dismissed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS brand_analysis JSONB,
ADD COLUMN IF NOT EXISTS persona_id TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_clerk_user_id ON user_profiles(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding ON user_profiles(onboarding_completed, onboarding_skipped);
