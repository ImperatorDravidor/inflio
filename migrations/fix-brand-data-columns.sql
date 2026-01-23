-- Migration: Fix brand data in user_profiles
-- This migration ensures brand data is available in the brand_identity column
-- so the Brand page can find it.

-- First, let's see what data structures we have
-- Run this SELECT first to understand the data:
-- SELECT
--   clerk_user_id,
--   onboarding_completed,
--   brand_identity IS NOT NULL as has_brand_identity,
--   brand_analysis IS NOT NULL as has_brand_analysis,
--   onboarding_progress IS NOT NULL as has_progress,
--   onboarding_progress->'formData'->'brandAnalysis' IS NOT NULL as has_formdata_brandAnalysis,
--   onboarding_progress->'formData'->'brandIdentity' IS NOT NULL as has_formdata_brandIdentity
-- FROM user_profiles
-- WHERE onboarding_progress IS NOT NULL
-- LIMIT 10;

-- Step 1: Copy brand_analysis to brand_identity if brand_identity is NULL but brand_analysis exists
UPDATE user_profiles
SET brand_identity = brand_analysis,
    updated_at = NOW()
WHERE brand_identity IS NULL
  AND brand_analysis IS NOT NULL;

-- Step 2: Copy from onboarding_progress.formData.brandAnalysis if neither column has data
UPDATE user_profiles
SET brand_identity = onboarding_progress->'formData'->'brandAnalysis',
    brand_analysis = onboarding_progress->'formData'->'brandAnalysis',
    updated_at = NOW()
WHERE brand_identity IS NULL
  AND brand_analysis IS NULL
  AND onboarding_progress->'formData'->'brandAnalysis' IS NOT NULL;

-- Step 3: Try brandIdentity key (different casing)
UPDATE user_profiles
SET brand_identity = onboarding_progress->'formData'->'brandIdentity',
    brand_analysis = onboarding_progress->'formData'->'brandIdentity',
    updated_at = NOW()
WHERE brand_identity IS NULL
  AND brand_analysis IS NULL
  AND onboarding_progress->'formData'->'brandIdentity' IS NOT NULL;

-- Step 4: Check for data directly under onboarding_progress (not in formData)
UPDATE user_profiles
SET brand_identity = onboarding_progress->'brandAnalysis',
    brand_analysis = onboarding_progress->'brandAnalysis',
    updated_at = NOW()
WHERE brand_identity IS NULL
  AND brand_analysis IS NULL
  AND onboarding_progress->'brandAnalysis' IS NOT NULL;

-- Verification query - run after migration to confirm:
-- SELECT
--   COUNT(*) as total_profiles,
--   COUNT(CASE WHEN brand_identity IS NOT NULL THEN 1 END) as with_brand_identity,
--   COUNT(CASE WHEN onboarding_completed = true THEN 1 END) as completed_onboarding
-- FROM user_profiles;
