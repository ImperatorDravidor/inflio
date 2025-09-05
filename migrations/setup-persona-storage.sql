-- Create personas table if not exists
CREATE TABLE IF NOT EXISTS public.personas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  name text NOT NULL,
  description text,
  status text DEFAULT 'pending_upload'::text,
  model_ref text,
  version integer DEFAULT 1,
  training_job_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT personas_pkey PRIMARY KEY (id)
);

-- Create persona_images table if not exists
CREATE TABLE IF NOT EXISTS public.persona_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  persona_id uuid,
  user_id text NOT NULL,
  image_url text NOT NULL,
  file_size integer,
  width integer,
  height integer,
  quality_score double precision,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT persona_images_pkey PRIMARY KEY (id),
  CONSTRAINT persona_images_persona_id_fkey FOREIGN KEY (persona_id) REFERENCES public.personas(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persona_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for personas table
CREATE POLICY "Users can view their own personas"
ON public.personas FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own personas"
ON public.personas FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own personas"
ON public.personas FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own personas"
ON public.personas FOR DELETE
TO authenticated
USING (auth.uid()::text = user_id);

-- RLS Policies for persona_images table
CREATE POLICY "Users can view their own persona images"
ON public.persona_images FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own persona images"
ON public.persona_images FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own persona images"
ON public.persona_images FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own persona images"
ON public.persona_images FOR DELETE
TO authenticated
USING (auth.uid()::text = user_id);

-- Create storage bucket for persona images (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('personas', 'personas', false)
ON CONFLICT (id) DO NOTHING;

-- Add RLS policies for personas bucket
CREATE POLICY "Users can upload their own persona images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'personas' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own persona images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'personas' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own persona images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'personas' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own persona images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'personas' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_personas_user_id ON public.personas(user_id);
CREATE INDEX IF NOT EXISTS idx_personas_status ON public.personas(status);
CREATE INDEX IF NOT EXISTS idx_persona_images_persona_id ON public.persona_images(persona_id);
CREATE INDEX IF NOT EXISTS idx_persona_images_user_id ON public.persona_images(user_id);

-- Add function to clean up orphaned persona images
CREATE OR REPLACE FUNCTION clean_orphaned_persona_images()
RETURNS void AS $$
BEGIN
  DELETE FROM public.persona_images
  WHERE persona_id NOT IN (SELECT id FROM public.personas);
END;
$$ LANGUAGE plpgsql;

-- Add default_persona_id column to user_profiles if it doesn't exist
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS default_persona_id uuid REFERENCES public.personas(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_default_persona_id ON public.user_profiles(default_persona_id);

