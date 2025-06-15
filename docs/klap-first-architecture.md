# Klap-First Architecture

## Overview

We've adopted a **Klap-first approach** for video processing because:
1. **No file size limits** - Works with any video size via URL
2. **All-in-one processing** - Handles both transcription and clips
3. **Built for video** - Specialized infrastructure for video content
4. **URL-based** - Uses your Supabase storage URLs directly

## Architecture Flow

```
Video Upload (Any Size)
    ↓
Stored in Supabase
    ↓
Get Storage URL
    ↓
Send URL to Klap API ← Primary Processing
    ↓
Klap Downloads & Processes
    ↓
Returns: Transcription + Clips + Metadata
```

## Implementation Details

### 1. Video Upload
```typescript
// Any size video gets uploaded to Supabase
const videoUrl = "https://vxtjsfmqwdbr.supabase.co/storage/v1/object/public/videos/123/video.mp4"
```

### 2. Klap Project Creation
```typescript
// Send URL directly to Klap
const klapResponse = await KlapAPIService.createProject({
  video_url: videoUrl,  // Just the URL!
  project_name: project.title,
  settings: {
    target_duration: 60,
    language: 'en',
    aspect_ratio: '9:16',
    virality_optimization: true
  }
})
```

### 3. Processing & Polling
```typescript
// Poll for completion
const status = await KlapAPIService.getProjectStatus(projectId)
// status: 'processing' | 'ready' | 'failed'

// When ready, get results
const transcription = await KlapAPIService.getTranscription(projectId)
const clips = await KlapAPIService.getClips(projectId)
```

## Benefits Over Whisper

| Feature | Whisper | Klap |
|---------|---------|------|
| Max File Size | 25MB | Unlimited* |
| Input Method | File Upload | URL |
| Processing | Sync | Async |
| Output | Transcription Only | Transcription + Clips |
| Video Optimized | No | Yes |
| Virality Analysis | No | Yes |

*Limited by your Supabase storage plan

## Error Handling

The Klap integration includes:
- **Retry Logic**: 3 attempts with exponential backoff
- **Graceful Degradation**: Falls back to mock data if needed
- **Status Monitoring**: Real-time progress updates
- **Comprehensive Logging**: `[Klap]` prefixed console logs

## Configuration

### Environment Variables
```bash
KLAP_API_KEY=klap_xxxxx  # Required
KLAP_API_URL=https://api.klap.app/v2  # Optional, defaults to v2
```

### Feature Flags
```typescript
// In processing page
const useKlapForEverything = true  // Enable Klap-first approach

// In transcription API
const USE_REAL_WHISPER = false  // Disable Whisper, use mock
```

## Processing Flow

1. **User uploads video** → Stored in Supabase
2. **Processing starts** → Create Klap project with video URL
3. **Poll for status** → Check every 5 seconds
4. **When ready** → Fetch both transcription and clips
5. **Store results** → Save to database
6. **Update UI** → Show completed tasks

## API Endpoints

### `/api/process-klap`
- Creates Klap project
- Handles status checking
- Returns clips when ready

### `/api/process-transcription`
- Currently returns mock data
- Whisper code preserved but disabled
- Easy to switch back if needed

## Best Practices

1. **Always use URLs**: Don't download videos unnecessarily
2. **Poll efficiently**: 5-second intervals, 5-minute timeout
3. **Handle failures**: Retry with backoff, fall back to mocks
4. **Log everything**: Use `[Klap]` prefix for easy debugging

## Future Enhancements

1. **Webhook Support**: Instead of polling
2. **Batch Processing**: Multiple videos at once
3. **Custom Models**: Train on your content
4. **Advanced Settings**: More control over output

## Debugging

Check console for `[Klap]` logs:
```
[Klap] Creating project (attempt 1/3)...
[Klap] Project details: { name: "My Video", url: "https://..." }
[Klap] Project created successfully: { project_id: "abc123" }
[Klap] Checking project status: abc123
[Klap] Project status: { status: "processing", progress: 45 }
```

## Common Issues

### "Klap API key not configured"
- Check `KLAP_API_KEY` in `.env.local`

### "Failed to create Klap project"
- Check video URL is accessible
- Verify API key is valid
- Check Klap service status

### "Timeout waiting for Klap"
- Large videos take longer
- Increase timeout in code
- Check Klap dashboard 