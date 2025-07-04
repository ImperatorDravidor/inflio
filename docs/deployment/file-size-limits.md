# File Size Limits & Large Video Handling

## Current Limits

### Upload Limits
- **Default**: 500MB (configurable via environment variable)
- **Supabase Storage**: Depends on your plan (Free tier: 50MB per file)
- **Recommended**: 100-200MB for optimal performance

### Processing Limits
- **OpenAI Whisper**: 25MB maximum
- **Klap API**: Varies by plan (typically 500MB-2GB)

## Configuration

### 1. Set Upload Limit

Add to `.env.local`:
```bash
# Set max file size in bytes (500MB = 524288000)
NEXT_PUBLIC_MAX_FILE_SIZE=524288000
```

### 2. Configure Supabase Storage

In Supabase Dashboard:
1. Go to Storage → Policies
2. Update the "Insert" policy for videos bucket:

```sql
-- Allow larger uploads (up to 500MB)
CREATE POLICY "Allow video uploads up to 500MB" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'videos' AND 
  auth.uid() IS NOT NULL AND
  (octet_length(content) / 1024 / 1024) <= 500
);
```

### 3. Configure Supabase Project

In Supabase Dashboard → Settings → API:
- Increase "Max Request Size" to 500MB or higher
- This requires a Pro plan or higher

## Handling Large Videos

### Problem: OpenAI Whisper 25MB Limit

Whisper API only accepts files up to 25MB, but videos are often much larger.

### Solutions:

#### 1. Audio Extraction (Recommended)
Extract audio from video before sending to Whisper:

```typescript
// Future implementation
async function extractAudio(videoBlob: Blob): Promise<Blob> {
  // Use FFmpeg.js or similar to extract audio
  // Audio files are typically 10-20% of video size
}
```

#### 2. Video Compression
Compress video before processing:
- Reduce resolution
- Lower bitrate
- Remove unnecessary tracks

#### 3. Direct Klap Processing
Klap API accepts larger files and includes transcription:
- Skip Whisper for large files
- Use Klap for both transcription and clips

## Best Practices

### For Users:
1. **Optimize Before Upload**
   - Use 720p or 1080p instead of 4K
   - Compress videos with tools like HandBrake
   - Remove unnecessary audio tracks

2. **Video Formats**
   - MP4 (H.264) - Best compatibility
   - WebM - Smaller file sizes
   - MOV - Good for Mac users

3. **Duration Guidelines**
   - < 10 minutes: Usually under 100MB
   - 10-30 minutes: 100-500MB
   - 30+ minutes: Consider splitting

### For Developers:

1. **Progressive Upload**
```typescript
// Show upload progress
const onProgress = (progress: number) => {
  console.log(`Upload progress: ${progress}%`)
}
```

2. **Chunked Upload** (Future)
```typescript
// Upload in chunks for better reliability
await uploadVideoInChunks(file, {
  chunkSize: 10 * 1024 * 1024, // 10MB chunks
  onProgress
})
```

3. **Background Processing**
- Use job queues for large files
- Process asynchronously
- Send notifications when complete

## Error Messages

### "File size exceeds limit"
**Cause**: Video larger than configured limit
**Solution**: 
- Compress video
- Increase limit (requires plan upgrade)
- Use external storage

### "Whisper 25MB limit"
**Cause**: Video too large for transcription
**Solution**:
- Extract audio track
- Use Klap API instead
- Split video into segments

### "Storage permission denied"
**Cause**: Supabase policies blocking large files
**Solution**: Update storage policies (see above)

## Future Enhancements

1. **Audio Extraction Service**
   - Automatically extract audio for transcription
   - Reduce file size by 80-90%

2. **Video Splitting**
   - Split long videos into segments
   - Process in parallel
   - Merge results

3. **CDN Integration**
   - Upload to CDN for large files
   - Stream processing
   - Better global performance

4. **Compression Service**
   - Auto-compress before processing
   - Multiple quality options
   - Format conversion

## Recommended Architecture for Large Files

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Upload    │────▶│   Queue     │────▶│  Process    │
│  (Chunked)  │     │  (Redis)    │     │  (Worker)   │
└─────────────┘     └─────────────┘     └─────────────┘
                            │
                    ┌───────▼────────┐
                    │  Notification  │
                    │   (Webhook)    │
                    └────────────────┘
```

## Environment Variables Reference

```bash
# File size limits
NEXT_PUBLIC_MAX_FILE_SIZE=524288000  # 500MB in bytes

# Supabase (ensure proper plan)
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key

# Processing APIs
OPENAI_API_KEY=sk-...  # For files < 25MB
KLAP_API_KEY=klap_...  # For larger files
```

## 🎬 Video Processing Optimization

### Klap API Clip Generation

When processing videos with Klap API for clip generation, you may encounter timeouts, especially with multiple clips. Here's how to optimize:

#### Environment Variables

```bash
# Skip re-uploading Klap videos to your storage (RECOMMENDED)
SKIP_KLAP_VIDEO_REUPLOAD=true

# This significantly reduces processing time by:
# - Avoiding video downloads from Klap
# - Skipping re-uploads to Supabase
# - Using Klap's direct player URLs instead
```

#### Why This Helps

1. **Reduces timeout issues**: Each clip download/upload can take 30-60 seconds
2. **Faster processing**: Clips are available immediately after Klap processing
3. **Lower bandwidth usage**: No need to transfer video files
4. **Cost savings**: Less storage and bandwidth usage

#### Trade-offs

- ✅ **Pros**: Faster, more reliable, no timeout issues
- ❌ **Cons**: Videos hosted on Klap servers (not your storage)

### Processing Time Expectations

| Video Length | AI Analysis | Clip Generation | Total Time |
|--------------|-------------|-----------------|------------|
| < 5 min      | 1-2 min     | 5-10 min        | 6-12 min   |
| 5-15 min     | 2-3 min     | 10-20 min       | 12-23 min  |
| 15-30 min    | 3-5 min     | 15-25 min       | 18-30 min  |

### Troubleshooting Timeouts

If you experience "2 clips 33%" freeze:

1. **Add to your .env.local**:
   ```bash
   SKIP_KLAP_VIDEO_REUPLOAD=true
   ```

2. **For production (Vercel)**:
   - Go to your Vercel dashboard
   - Settings → Environment Variables
   - Add `SKIP_KLAP_VIDEO_REUPLOAD` = `true`
   - Redeploy

3. **Alternative: Use background processing**:
   - The current implementation processes clips in background
   - Check project status periodically
   - Clips will appear when ready
``` 
</rewritten_file>