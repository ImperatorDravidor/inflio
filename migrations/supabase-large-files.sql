-- Supabase Storage Configuration for Large Video Files
-- Run this in your Supabase SQL Editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON storage.objects;
DROP POLICY IF EXISTS "Enable read access for all users" ON storage.objects;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON storage.objects;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON storage.objects;

-- Create new policies with larger file size limits
-- Note: File size limit in policies is in bytes

-- Allow authenticated users to upload videos up to 500MB
CREATE POLICY "Allow video uploads up to 500MB" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'videos' AND
  (octet_length(content) <= 524288000) -- 500MB in bytes
);

-- Allow public read access to videos
CREATE POLICY "Public video read access" ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'videos');

-- Allow users to update their own videos
CREATE POLICY "Users can update own videos" ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'videos' AND auth.uid()::text = owner)
WITH CHECK (
  bucket_id = 'videos' AND 
  auth.uid()::text = owner AND
  (octet_length(content) <= 524288000) -- 500MB limit on updates too
);

-- Allow users to delete their own videos
CREATE POLICY "Users can delete own videos" ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'videos' AND auth.uid()::text = owner);

-- Create videos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  true,
  524288000, -- 500MB
  ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/ogg']
)
ON CONFLICT (id) 
DO UPDATE SET 
  file_size_limit = 524288000,
  allowed_mime_types = ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/ogg'];

-- Note: For files larger than 500MB, you'll need to:
-- 1. Upgrade to Supabase Pro or higher
-- 2. Contact support to increase the global upload limit
-- 3. Consider using Supabase's resumable uploads feature 