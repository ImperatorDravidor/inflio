# API Comparison: Why Whisper Can't Use URLs

## OpenAI Whisper API

**ONLY accepts file uploads:**
```bash
curl https://api.openai.com/v1/audio/transcriptions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -F file="@video.mp4" \
  -F model="whisper-1"
```

**Does NOT accept URLs:**
```bash
# ❌ This DOES NOT WORK - Whisper has no URL parameter
curl https://api.openai.com/v1/audio/transcriptions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{"url": "https://example.com/video.mp4", "model": "whisper-1"}'
```

## Klap API

**DOES accept URLs:**
```bash
curl https://api.klap.app/v2/projects/create \
  -H "Authorization: Bearer $KLAP_API_KEY" \
  -d '{
    "video_url": "https://your-supabase-url.com/video.mp4",
    "project_name": "My Video"
  }'
```

## Why This Difference?

1. **OpenAI Whisper**: 
   - General-purpose transcription API
   - Expects small audio files
   - Synchronous processing
   - Returns results immediately

2. **Klap API**:
   - Built specifically for video processing
   - Expects large video files
   - Asynchronous processing
   - Downloads and processes on their infrastructure

## Your Current Flow

```
Your Video in Supabase
    ↓
https://vxtjsfmqwdbr.supabase.co/storage/v1/object/public/videos/123/video.mp4
    ↓
    ├── To Klap: ✅ Just send the URL
    │
    └── To Whisper: ❌ Must download first, then upload
                    (fails if > 25MB)
```

## The Solution We Implemented

For files > 25MB:
- Skip Whisper entirely
- Use Klap for BOTH transcription and clips
- Klap accepts your Supabase URL directly

This is why your 75MB video works with Klap but not Whisper! 