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