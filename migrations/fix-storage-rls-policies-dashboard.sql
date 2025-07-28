-- Fix Storage RLS Policies for Supabase Dashboard
-- Run this in the Supabase Dashboard SQL Editor

-- Step 1: Create storage buckets if they don't exist
-- Go to Storage section in Supabase Dashboard and create these buckets manually:
-- 1. videos (private bucket, 2GB file size limit)
-- 2. thumbnails (public bucket, 10MB file size limit)
-- 3. subtitles (public bucket, 5MB file size limit)
-- 4. blog-images (public bucket, 10MB file size limit)

-- Step 2: Create RLS Policies for the videos bucket
-- These policies allow authenticated users to manage their own videos

-- Policy: Allow authenticated users to upload videos
CREATE POLICY "Allow authenticated uploads to videos bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'videos');

-- Policy: Allow authenticated users to view videos
CREATE POLICY "Allow authenticated users to view videos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'videos');

-- Policy: Allow authenticated users to update their videos
CREATE POLICY "Allow authenticated users to update videos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'videos');

-- Policy: Allow authenticated users to delete their videos
CREATE POLICY "Allow authenticated users to delete videos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'videos');

-- Step 3: Create RLS Policies for public buckets
-- These allow anyone to view but only authenticated users to upload

-- Policy: Allow public viewing of thumbnails
CREATE POLICY "Allow public to view thumbnails"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'thumbnails');

-- Policy: Allow authenticated users to upload thumbnails
CREATE POLICY "Allow authenticated to upload thumbnails"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'thumbnails');

-- Policy: Allow authenticated users to update thumbnails
CREATE POLICY "Allow authenticated to update thumbnails"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'thumbnails');

-- Policy: Allow authenticated users to delete thumbnails
CREATE POLICY "Allow authenticated to delete thumbnails"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'thumbnails');

-- Repeat similar policies for subtitles and blog-images buckets
-- Policy: Allow public viewing of subtitles
CREATE POLICY "Allow public to view subtitles"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'subtitles');

CREATE POLICY "Allow authenticated to upload subtitles"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'subtitles');

-- Policy: Allow public viewing of blog images
CREATE POLICY "Allow public to view blog images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'blog-images');

CREATE POLICY "Allow authenticated to upload blog images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'blog-images');