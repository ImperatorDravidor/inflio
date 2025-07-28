-- Fix Storage RLS Policies for Video Uploads
-- This script sets up proper Row Level Security policies for the storage buckets

-- First, ensure the storage schema and buckets exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('videos', 'videos', false, 2147483648, ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm', 'video/mpeg']),
  ('thumbnails', 'thumbnails', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('subtitles', 'subtitles', true, 5242880, ARRAY['text/vtt', 'text/srt', 'application/x-subrip', 'text/plain']),
  ('blog-images', 'blog-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Enable RLS on storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can upload their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own videos" ON storage.objects;

-- Videos bucket policies (private - only owner can access)
CREATE POLICY "Users can upload their own videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'videos' AND 
  auth.uid()::text IS NOT NULL
);

CREATE POLICY "Users can view their own videos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'videos' AND 
  auth.uid()::text IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own videos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'videos' AND 
  auth.uid()::text IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'videos' AND 
  auth.uid()::text IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Public bucket policies (thumbnails, subtitles, blog-images)
DROP POLICY IF EXISTS "Anyone can view public files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload public files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their public files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their public files" ON storage.objects;

CREATE POLICY "Anyone can view public files"
ON storage.objects FOR SELECT
USING (
  bucket_id IN ('thumbnails', 'subtitles', 'blog-images')
);

CREATE POLICY "Users can upload public files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id IN ('thumbnails', 'subtitles', 'blog-images') AND
  auth.uid()::text IS NOT NULL
);

CREATE POLICY "Users can update their public files"
ON storage.objects FOR UPDATE
USING (
  bucket_id IN ('thumbnails', 'subtitles', 'blog-images') AND
  auth.uid()::text IS NOT NULL
);

CREATE POLICY "Users can delete their public files"
ON storage.objects FOR DELETE
USING (
  bucket_id IN ('thumbnails', 'subtitles', 'blog-images') AND
  auth.uid()::text IS NOT NULL
);

-- Alternative: If you want simpler policies for videos bucket (any authenticated user can upload)
-- Comment out the above video policies and uncomment these:

/*
-- Simple video policies - any authenticated user can upload
CREATE POLICY "Authenticated users can upload videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'videos' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can view all videos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'videos' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update videos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'videos' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'videos' AND 
  auth.role() = 'authenticated'
);
*/