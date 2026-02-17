-- Add comprehensive creator profile fields to user_profiles table
-- This migration adds all fields needed for the comprehensive onboarding

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS professional_title TEXT,
ADD COLUMN IF NOT EXISTS years_experience TEXT,
ADD COLUMN IF NOT EXISTS content_niche TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS experience_level TEXT,
ADD COLUMN IF NOT EXISTS audience_size TEXT,
ADD COLUMN IF NOT EXISTS primary_goal TEXT,
ADD COLUMN IF NOT EXISTS secondary_goals TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS success_metrics TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS content_pillars JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS unique_value_prop TEXT,
ADD COLUMN IF NOT EXISTS target_audience_age TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS target_audience_geo TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS target_audience_interests TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS audience_pain_points TEXT,
ADD COLUMN IF NOT EXISTS content_frequency TEXT,
ADD COLUMN IF NOT EXISTS time_per_piece TEXT,
ADD COLUMN IF NOT EXISTS biggest_challenges TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- Add indexes for frequently queried fields
CREATE INDEX IF NOT EXISTS idx_user_profiles_content_niche ON user_profiles USING GIN (content_niche);
CREATE INDEX IF NOT EXISTS idx_user_profiles_primary_goal ON user_profiles (primary_goal);
CREATE INDEX IF NOT EXISTS idx_user_profiles_experience_level ON user_profiles (experience_level);

-- Update RLS policies to ensure users can update their own comprehensive profile
ALTER POLICY "Users can update own profile" ON user_profiles
  USING (auth.uid()::text = clerk_user_id);

-- Comment on new columns for documentation
COMMENT ON COLUMN user_profiles.professional_title IS 'User''s professional title or role';
COMMENT ON COLUMN user_profiles.years_experience IS 'Years of experience in content creation';
COMMENT ON COLUMN user_profiles.content_niche IS 'Array of content niche categories';
COMMENT ON COLUMN user_profiles.experience_level IS 'Content creator experience level (beginner, intermediate, advanced, expert)';
COMMENT ON COLUMN user_profiles.audience_size IS 'Current audience size range';
COMMENT ON COLUMN user_profiles.primary_goal IS 'Primary goal for using the platform';
COMMENT ON COLUMN user_profiles.secondary_goals IS 'Additional goals user wants to achieve';
COMMENT ON COLUMN user_profiles.success_metrics IS 'Key metrics user cares about';
COMMENT ON COLUMN user_profiles.content_pillars IS 'Main content topics user creates about (3-5)';
COMMENT ON COLUMN user_profiles.unique_value_prop IS 'What makes user''s content unique';
COMMENT ON COLUMN user_profiles.target_audience_interests IS 'Audience interest tags';
COMMENT ON COLUMN user_profiles.audience_pain_points IS 'Problems user''s content solves';
COMMENT ON COLUMN user_profiles.content_frequency IS 'How often user creates content';
COMMENT ON COLUMN user_profiles.time_per_piece IS 'Average time to create one piece of content';
COMMENT ON COLUMN user_profiles.biggest_challenges IS 'User''s biggest content creation challenges';


