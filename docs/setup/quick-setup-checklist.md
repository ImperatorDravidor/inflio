# Quick Setup Checklist

Follow this checklist to get your video upload system working:

## ✅ 1. Supabase Setup

- [ ] Create a Supabase account at [supabase.com](https://supabase.com)
- [ ] Create a new project
- [ ] Go to **Storage** → Create bucket named `videos`
- [ ] Set bucket to **Public**
- [ ] Go to **Settings** → **Storage** → Increase file limit if needed

## ✅ 2. Environment Variables

Create `.env.local` file with:

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Optional (app works without these)
NEXT_PUBLIC_KLAP_API_KEY=your_klap_key
OPENAI_API_KEY=your_openai_key
```

## ✅ 3. Run SQL Policies

In Supabase SQL Editor, run:

```sql
-- Allow uploads
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'videos');

-- Allow viewing
CREATE POLICY "Allow public viewing" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'videos');

-- Allow deletes
CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'videos');
```

## ✅ 4. Test Upload

1. Start the app: `npm run dev`
2. Sign in with Clerk
3. Upload a small video (< 50MB)
4. Check for errors in browser console

## ✅ 5. Common Issues

### 🔴 "Storage bucket not found"
→ Create `videos` bucket in Supabase Storage

### 🔴 "File size exceeded"
→ Video is too large. Use smaller file or upgrade Supabase plan

### 🔴 "Failed to fetch"
→ API keys missing or incorrect. App will use mock data

### 🔴 "OpenAI API key missing"
→ Normal - app works without it using mock transcription

## ✅ 6. Success Indicators

- ✅ Video uploads without errors
- ✅ Project created successfully
- ✅ Mock transcription appears
- ✅ Mock clips generated
- ✅ Can view project details

## Need Help?

1. Check browser console (F12)
2. Review error messages
3. Verify all steps completed
4. Try with a smaller test video 

## Handling Large Videos (75MB+)

### Current Limitations:
- **Supabase Free Tier**: 50MB per file
- **OpenAI Whisper**: 25MB maximum
- **Default Upload Limit**: 500MB (configurable)

### Solutions:

1. **Upgrade Supabase** (Recommended)
   - Pro plan supports up to 5GB files
   - Run the migration: `migrations/supabase-large-files.sql`

2. **Configure File Limits**
   ```bash
   # In .env.local
   NEXT_PUBLIC_MAX_FILE_SIZE=1073741824  # 1GB in bytes
   ```

3. **For Videos > 25MB**
   - Klap API will handle both transcription and clips
   - OpenAI Whisper can't process files > 25MB
   - Audio extraction feature coming soon

### Quick Fixes:

1. **Compress your video** before upload:
   - Use HandBrake or FFmpeg
   - Target 720p resolution
   - Reduce bitrate

2. **Use shorter clips**:
   - Split long videos into parts
   - Process segments separately

3. **Check Supabase Dashboard**:
   - Settings → API → Max Request Size
   - Storage → Buckets → videos → Settings

See `docs/file-size-limits.md` for detailed information. 