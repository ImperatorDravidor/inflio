-- Fix: Make persona-photos bucket public so FAL.AI can access the images
-- The Gemini 3 Pro Image Edit API needs to download reference images from URLs

-- Update the bucket to be public
UPDATE storage.buckets
SET public = true
WHERE id = 'persona-photos';

-- Add a policy to allow public/anonymous read access to persona photos
-- This is needed for external services like FAL.AI to download the images
CREATE POLICY "Public read access for persona photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'persona-photos');
