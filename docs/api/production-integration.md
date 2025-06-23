# Production API Integration Guide

This guide explains how the Inflio platform integrates with real AI services for production use.

## Overview

The platform uses two main AI services:
1. **OpenAI Whisper API** - For video transcription
2. **Klap API** - For AI-powered clip generation

Both services are integrated server-side to avoid CORS issues and protect API keys.

## API Integration Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Client (Next)  │────▶│  API Routes     │────▶│  External APIs  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │                         │
                              ├── /api/process-        ├── OpenAI
                              │   transcription        │   Whisper
                              │                        │
                              └── /api/process-        └── Klap API
                                  klap
```

## Transcription Flow (OpenAI Whisper)

### Endpoint: `/api/process-transcription`

1. **Video Download**: Downloads video from Supabase storage URL
2. **Size Validation**: Ensures video is under 25MB (Whisper limit)
3. **API Call**: Sends video to OpenAI Whisper API
4. **Response Processing**: Converts Whisper segments to our format
5. **Storage**: Saves transcription to project in database

### Code Example:
```typescript
// Transcribe using OpenAI Whisper
const transcriptionResponse = await openai.audio.transcriptions.create({
  file: videoFile,
  model: 'whisper-1',
  response_format: 'verbose_json',
  language: language || undefined,
  timestamp_granularities: ['segment']
})
```

### Features:
- Automatic language detection
- Segment-level timestamps
- Confidence scores for each segment
- Error handling with detailed messages

## Clip Generation Flow (Klap API)

### Endpoint: `/api/process-klap`

1. **Project Creation**: Creates a Klap project for the video
2. **Status Polling**: Checks project status until ready
3. **Clip Retrieval**: Fetches generated clips when ready
4. **Format Conversion**: Converts Klap clips to our schema
5. **Storage**: Saves clips to project folders

### Code Example:
```typescript
// Create Klap project
const klapResponse = await KlapAPIService.createProject({
  video_url: videoUrl,
  project_name: project.title,
  settings: {
    target_duration: 60, // 60 second clips
    language: project.transcription?.language || 'en',
    aspect_ratio: '9:16', // Vertical for social media
    virality_optimization: true
  }
})
```

### Features:
- Virality score optimization
- Multiple aspect ratios support
- Automatic clip duration settings
- Progress tracking during processing

## Error Handling

Both API integrations include comprehensive error handling:

```typescript
try {
  // API call
} catch (error) {
  // Update task status to failed
  await ProjectService.updateTaskProgress(projectId, taskType, 0, 'failed')
  
  // Return user-friendly error
  return NextResponse.json(
    { error: error.message },
    { status: 500 }
  )
}
```

## Processing Page Integration

The processing page (`/studio/processing/[id]`) handles:

1. **Real-time Progress Updates**
   - Polls Klap API for status
   - Updates task progress in UI
   - Shows estimated time remaining

2. **Parallel Processing**
   - Transcription and clips run simultaneously
   - Dependent tasks wait for prerequisites

3. **Error Recovery**
   - Falls back to local processing if APIs fail
   - Displays clear error messages
   - Allows manual retry

## Cost Optimization

### OpenAI Costs
- **Rate**: $0.006 per minute of audio
- **Optimization**: Process only necessary videos
- **Limit**: 25MB file size limit

### Klap API Costs
- **Pricing**: Based on your subscription plan
- **Optimization**: Reuse existing projects when possible
- **Caching**: Store generated clips for reuse

## Security Best Practices

1. **API Keys**: Stored server-side only
2. **Rate Limiting**: Implement per-user limits
3. **Input Validation**: Validate all user inputs
4. **Error Messages**: Don't expose internal details

## Monitoring & Logging

```typescript
console.log('Downloading video from URL:', videoUrl)
console.log('Sending to OpenAI Whisper API...')
console.log(`Transcription completed: ${segments.length} segments`)
```

Add production monitoring:
- API response times
- Error rates
- Usage tracking
- Cost monitoring

## Testing in Production

1. **Small Files First**: Test with short videos
2. **Monitor Costs**: Check API dashboards
3. **Error Scenarios**: Test network failures
4. **Load Testing**: Gradually increase usage

## Troubleshooting

### Common Issues:

1. **"OpenAI API key not configured"**
   - Check `OPENAI_API_KEY` in environment
   - Verify key starts with `sk-`

2. **"Video file exceeds 25MB limit"**
   - Extract audio from video
   - Compress video before upload
   - Use shorter clips

3. **"Klap processing failed"**
   - Check Klap API status
   - Verify video format compatibility
   - Check account limits

## Future Improvements

1. **Caching Layer**: Cache transcriptions/clips
2. **Queue System**: Handle high volume with queues
3. **Webhook Support**: Real-time status updates
4. **Multi-language**: Expand language support
5. **Custom Models**: Fine-tune for specific content 