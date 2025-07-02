# Large Video Handling - Complete Solutions

## What I've Fixed

### 1. **Increased Upload Limit**
- Changed from 50MB to **500MB default**
- Made it configurable via `NEXT_PUBLIC_MAX_FILE_SIZE`
- Updated error messages to be more helpful

### 2. **Better Error Handling**
- Fixed JSON parsing errors 
- Added proper error messages for each failure type
- Shows file size in MB in error messages

### 3. **Smart Processing Pipeline**
- Videos < 25MB: Use OpenAI Whisper
- Videos > 25MB: Automatically fall back to Klap API
- Klap handles both transcription and clips for large files

### 4. **Supabase Configuration**
- Created SQL migration for 500MB file support
- Added storage policies for large files
- Documented upgrade path for bigger files

## Quick Start for Large Videos

### Step 1: Configure Your Environment

```bash
# In .env.local
NEXT_PUBLIC_MAX_FILE_SIZE=1073741824  # 1GB
```

### Step 2: Update Supabase

1. **Free Tier (50MB limit)**: Upgrade to Pro
2. **Run Migration**: Execute `migrations/supabase-large-files.sql`
3. **Dashboard Settings**: 
   - Go to Settings → API
   - Increase "Max Request Size"

### Step 3: Upload and Process

The system now automatically:
- ✅ Accepts files up to 500MB (configurable)
- ✅ Falls back to Klap for videos > 25MB
- ✅ Shows clear error messages
- ✅ Handles processing failures gracefully

## File Size Guidelines

| Video Size | Storage | Transcription | Clips | Notes |
|------------|---------|---------------|-------|-------|
| < 25MB | ✅ Supabase Free | ✅ OpenAI Whisper | ✅ Klap API | Optimal |
| 25-50MB | ✅ Supabase Free | ⚠️ Klap Only | ✅ Klap API | Works with fallback |
| 50-500MB | ⚡ Supabase Pro | ⚠️ Klap Only | ✅ Klap API | Requires upgrade |
| > 500MB | ⚡ Custom Solution | ⚠️ Klap Only | ✅ Klap API | Contact support |

## Common Scenarios

### "My 75MB video won't upload"
1. **Check Supabase Plan**: Free tier = 50MB limit
2. **Upgrade to Pro**: Supports up to 5GB
3. **Or compress video**: Use HandBrake to reduce size

### "Transcription fails for large video"
- **Automatic**: System uses Klap API instead
- **Manual**: Video will still get clips and transcription via Klap
- **No action needed**: Just wait for processing

### "I need to upload 1GB+ videos"
1. Set `NEXT_PUBLIC_MAX_FILE_SIZE=2147483648` (2GB)
2. Ensure Supabase Pro or Enterprise plan
3. Consider video compression or chunking

## Future Enhancements

1. **Audio Extraction** (Coming Soon)
   - Extract audio to reduce file size by 80%
   - Send smaller files to Whisper
   - Better quality transcriptions

2. **Resumable Uploads**
   - Upload large files in chunks
   - Resume interrupted uploads
   - Progress tracking

3. **Video Compression**
   - Automatic compression option
   - Multiple quality presets
   - Format conversion

## Testing Your Setup

1. **Test File Sizes**:
   - Small: 10MB video ✅
   - Medium: 50MB video ✅ (needs Supabase Pro)
   - Large: 100MB video ✅ (needs Supabase Pro)

2. **Check Processing**:
   - Transcription works for < 25MB
   - Klap fallback works for > 25MB
   - Error messages are clear

3. **Monitor Costs**:
   - OpenAI: $0.006/minute
   - Klap: Check your plan
   - Supabase: Storage + bandwidth

## Support

- **Supabase Limits**: Dashboard → Settings → API
- **Error Logs**: Browser Console + Server Logs
- **File Compression**: Use HandBrake or FFmpeg
- **API Limits**: Check respective dashboards 

# Handling Large Video Uploads

## Issue
When uploading large videos (>50MB), you may encounter a 413 error (Request Entity Too Large) due to server limitations.

## Root Cause
Vercel has a default request body size limit of 4.5MB for serverless functions. While we've configured the app to handle up to 2GB files, the platform hosting limits may override this.

## Solutions

### 1. Direct Browser Upload (Implemented)
The app now automatically detects files larger than 50MB and uploads them directly from the browser to Supabase Storage, bypassing the API route entirely.

### 2. Vercel Configuration
We've added the following configurations:
- `next.config.ts`: Set `bodySizeLimit: '2gb'` in experimental.serverActions
- `vercel.json`: Increased maxDuration for all processing routes

### 3. Platform Limits
Different hosting platforms have different limits:
- **Vercel Hobby**: 4.5MB body size limit
- **Vercel Pro**: 4.5MB body size limit (same as hobby)
- **Vercel Enterprise**: Custom limits available
- **Self-hosted**: No limits

## Recommendations

### For Production Deployment

1. **Use Direct Upload**: The app automatically uses direct browser-to-Supabase upload for files >50MB
2. **Set Supabase Limits**: Ensure your Supabase project allows large file uploads:
   ```sql
   -- Check current settings
   SELECT * FROM storage.buckets WHERE name = 'videos';
   
   -- Update if needed (requires admin access)
   UPDATE storage.buckets 
   SET file_size_limit = 2147483648  -- 2GB in bytes
   WHERE name = 'videos';
   ```

3. **Alternative Solutions**:
   - Use presigned URLs for direct S3/Cloudinary uploads
   - Implement chunked uploads with resumable support
   - Use a dedicated media server for large files

### For Users

If you encounter upload errors:
1. **Check file size**: Maximum supported is 2GB
2. **Check file format**: MP4, MOV, AVI, or WebM only
3. **Try compressing**: Use HandBrake or similar to reduce file size
4. **Check connection**: Large uploads need stable internet

### Error Messages

- **"File too large. Maximum size is 2GB"**: File exceeds app limit
- **"Request Entity Too Large"**: File exceeds server limit (use smaller file)
- **"Failed to upload"**: Network or server error (retry)

## Technical Details

The upload flow works as follows:
1. Files ≤50MB: Upload through API route to Supabase
2. Files >50MB: Direct browser upload to Supabase Storage
3. All files: Create project record and start processing

This ensures reliable uploads regardless of file size while working within platform constraints. 