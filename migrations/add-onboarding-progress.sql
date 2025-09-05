-- Add missing onboarding_progress field to user_profiles table
-- This field stores the progress data for the onboarding flow

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS onboarding_progress jsonb DEFAULT '{}';

-- Add other missing fields that the analyze-brand route uses
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS brand_analysis jsonb DEFAULT NULL;

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS brand_personality text[] DEFAULT NULL;

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS persona_training_images jsonb DEFAULT NULL;

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS persona_lora_model jsonb DEFAULT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding 
ON public.user_profiles(clerk_user_id, onboarding_completed);

CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding_progress 
ON public.user_profiles USING gin(onboarding_progress);

-- Add comment explaining the structure
COMMENT ON COLUMN public.user_profiles.onboarding_progress IS 
'Stores onboarding progress data including completed steps, form data, and last saved timestamp';

COMMENT ON COLUMN public.user_profiles.brand_analysis IS 
'Stores comprehensive brand analysis data from uploaded brand guidelines or documents';

COMMENT ON COLUMN public.user_profiles.brand_personality IS 
'Array of personality traits extracted from brand analysis';

COMMENT ON COLUMN public.user_profiles.persona_training_images IS 
'JSON data for persona training images including URLs and metadata';

COMMENT ON COLUMN public.user_profiles.persona_lora_model IS 
'Reference to trained LoRA model for persona generation';
