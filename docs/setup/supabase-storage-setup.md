# Supabase Storage Setup

## Create Videos Bucket

1. Go to your Supabase dashboard
2. Navigate to Storage
3. Click "New bucket"
4. Create a bucket with these settings:
   - Name: `videos`
   - Public bucket: ✅ (Check this)
   - File size limit: 50MB (default) or higher
   - Allowed MIME types: `video/*,image/*`

## Increase File Size Limit (Important!)

By default, Supabase limits file uploads to 50MB. To upload larger videos:

1. Go to **Settings** → **Storage**
2. Find **Global file upload limit**
3. Increase to your desired limit (e.g., 500MB or 2GB)
4. Save changes

**Note**: The free tier has a 50MB limit. You need a Pro plan for larger files.

## Set Bucket Policies

Add these RLS policies to the `videos` bucket:

### Upload Policy
```sql
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'videos');
```

### View Policy
```sql
-- Allow public viewing of videos
CREATE POLICY "Allow public viewing" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'videos');
```

### Delete Policy
```sql
-- Allow users to delete their own videos
CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'videos');
```

## CORS Configuration

If you encounter CORS issues, configure CORS in Supabase:

1. Go to **Settings** → **API**
2. Add your domain to allowed origins:
   ```
   http://localhost:3000
   https://yourdomain.com
   ```

## Environment Variables

Make sure these are set in your `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Troubleshooting

### "The object exceeded the maximum allowed size"
- Check your Supabase plan limits
- Increase the global file upload limit in Settings
- Consider video compression before upload

### "Storage bucket 'videos' not found"
- Make sure you created the bucket named exactly `videos`
- Check that it's set to public

### Permission Errors
- Ensure RLS policies are properly set
- Check that your user is authenticated 