-- Add subtitle support to the videos bucket
-- This allows storing VTT subtitle files alongside videos

-- Update the videos bucket to allow subtitle files
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  'video/mp4', 
  'video/quicktime', 
  'video/x-msvideo', 
  'video/webm', 
  'video/ogg',
  'text/vtt',
  'text/srt',
  'application/x-subrip'
]
WHERE id = 'videos';

-- Create policy for subtitle file uploads
CREATE POLICY "Allow subtitle uploads" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'videos' AND
  (
    -- Allow video files up to 500MB
    (
      content_type LIKE 'video/%' AND
      octet_length(content) <= 524288000
    ) OR
    -- Allow subtitle files up to 1MB
    (
      content_type IN ('text/vtt', 'text/srt', 'application/x-subrip') AND
      octet_length(content) <= 1048576
    )
  )
);

-- Allow public read access to subtitle files
CREATE POLICY "Public subtitle read access" ON storage.objects
FOR SELECT 
TO public
USING (
  bucket_id = 'videos' AND 
  (
    content_type LIKE 'video/%' OR 
    content_type IN ('text/vtt', 'text/srt', 'application/x-subrip')
  )
);

-- Allow authenticated users to delete subtitle files
CREATE POLICY "Allow subtitle deletes" ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'videos' AND
  content_type IN ('text/vtt', 'text/srt', 'application/x-subrip')
);

-- Add comment explaining subtitle support
COMMENT ON TABLE storage.objects IS 'Updated to support VTT and SRT subtitle files in videos bucket'; 