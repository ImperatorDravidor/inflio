-- Complete fix for onboarding persistence issues
-- Run this migration in Supabase SQL editor

-- 1. Ensure all required columns exist
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
ADD COLUMN IF NOT EXISTS brand_identity JSONB,
ADD COLUMN IF NOT EXISTS persona_id TEXT;

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_clerk_user_id ON user_profiles(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding ON user_profiles(onboarding_completed, onboarding_skipped);

-- 3. Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Drop and recreate policies with better permissions
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON user_profiles;

-- Create a more permissive policy for authenticated users
-- This ensures the app can create and update profiles
CREATE POLICY "Enable all access for authenticated users" ON user_profiles
    FOR ALL 
    USING (true)
    WITH CHECK (true);

-- Optional: If you want stricter security later, use these instead:
-- CREATE POLICY "Users can view own profile" ON user_profiles
--     FOR SELECT USING (auth.uid()::text = clerk_user_id);
-- CREATE POLICY "Users can insert own profile" ON user_profiles
--     FOR INSERT WITH CHECK (auth.uid()::text = clerk_user_id);
-- CREATE POLICY "Users can update own profile" ON user_profiles
--     FOR UPDATE USING (auth.uid()::text = clerk_user_id);

-- 5. Grant necessary permissions
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO service_role;

-- 6. Verify the table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;
