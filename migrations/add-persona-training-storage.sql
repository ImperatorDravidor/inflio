-- Create storage buckets for persona photos and training data
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('persona-photos', 'persona-photos', false),
  ('persona-training', 'persona-training', false),
  ('brand-materials', 'brand-materials', false)
ON CONFLICT (id) DO NOTHING;

-- Add RLS policies for persona-photos bucket
CREATE POLICY "Users can upload their own persona photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'persona-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own persona photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'persona-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own persona photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'persona-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own persona photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'persona-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add RLS policies for persona-training bucket
CREATE POLICY "Users can upload their own training data"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'persona-training'
);

CREATE POLICY "Users can view their own training data"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'persona-training'
);

CREATE POLICY "Users can delete their own training data"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'persona-training'
);

CREATE POLICY "Users can update their own training data"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'persona-training'
);

-- Add RLS policies for brand-materials bucket
CREATE POLICY "Users can upload their own brand materials"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'brand-materials' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own brand materials"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'brand-materials' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own brand materials"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'brand-materials' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own brand materials"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'brand-materials' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
