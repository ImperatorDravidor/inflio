-- Migration: Create missing user_profiles records for existing users
-- This ensures all users in the 'users' table have a corresponding profile record

-- First, check which users are missing profiles
SELECT u.id, u.email, u."firstName", u."lastName" 
FROM users u
LEFT JOIN user_profiles up ON u.id = up.clerk_user_id
WHERE up.id IS NULL;

-- Create missing user profiles
INSERT INTO user_profiles (
  clerk_user_id,
  email,
  full_name,
  onboarding_completed,
  onboarding_step,
  created_at,
  updated_at
)
SELECT 
  u.id,
  u.email,
  TRIM(CONCAT(COALESCE(u."firstName", ''), ' ', COALESCE(u."lastName", ''))),
  false, -- Mark as not completed so they'll be redirected to onboarding
  0,
  NOW(),
  NOW()
FROM users u
LEFT JOIN user_profiles up ON u.id = up.clerk_user_id
WHERE up.id IS NULL;

-- Verify all users now have profiles
SELECT 
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT up.clerk_user_id) as users_with_profiles
FROM users u
LEFT JOIN user_profiles up ON u.id = up.clerk_user_id; 