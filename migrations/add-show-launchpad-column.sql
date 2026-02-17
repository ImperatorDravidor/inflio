-- Add column for tracking when to show the launchpad
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS show_launchpad BOOLEAN DEFAULT false;
