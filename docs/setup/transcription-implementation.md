# AI Transcription Implementation with OpenAI Whisper

This document explains how the AI transcription feature is implemented using OpenAI's Whisper API.

## Overview

The transcription feature provides:
- **Accurate speech-to-text conversion** using OpenAI's Whisper model
- **Timestamp synchronization** for each transcript segment
- **Interactive transcript viewer** with video synchronization
- **Multiple export formats** (TXT, SRT, VTT)
- **Search functionality** within transcripts
- **Real-time progress tracking** during processing

## Architecture

### Components

1. **TranscriptionService** (`src/lib/transcription-service.ts`)
   - Handles communication with OpenAI Whisper API
   - Processes video files and returns timestamped segments
   - Formats transcripts for different subtitle formats
   - Provides search and navigation utilities

2. **API Route** (`src/app/api/process-transcription/route.ts`)
   - POST endpoint for initiating transcription
   - GET endpoint for downloading transcripts in various formats
   - Handles authentication and progress tracking

3. **TranscriptionViewer** (`src/components/transcription-viewer.tsx`)
   - Interactive UI component for viewing transcripts
   - Synchronized playback with video player
   - Search and navigation features
   - Export functionality

## Features

### 1. Timestamp Synchronization

Each transcript segment includes precise timestamps:
```typescript
{
  id: "segment-1",
  text: "Hello, welcome to our video.",
  start: 0.0,      // Start time in seconds
  end: 3.5,        // End time in seconds
  confidence: 0.98 // Confidence score
}
```

### 2. Video Player Integration

The transcript viewer synchronizes with the video player:
- **Auto-scroll** to current segment during playback
- **Click to jump** to any segment in the video
- **Visual highlighting** of active segment

### 3. Export Formats

#### TXT Format
Plain text transcript without timestamps

#### SRT Format (SubRip)
```
1
00:00:00,000 --> 00:00:03,500
Hello, welcome to our video.

2
00:00:03,500 --> 00:00:07,200
Today we'll be discussing AI transcription.
```

#### VTT Format (WebVTT)
```
WEBVTT

1
00:00:00.000 --> 00:00:03.500
Hello, welcome to our video.

2
00:00:03.500 --> 00:00:07.200
Today we'll be discussing AI transcription.
```

### 4. Search Functionality

- Real-time search within transcript
- Highlighted search results
- Jump to search results in video

## API Usage

### Transcribe Video

```typescript
// POST /api/process-transcription
const response = await fetch('/api/process-transcription', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectId: 'project-123',
    videoUrl: 'https://example.com/video.mp4',
    language: 'en' // Optional, auto-detected if not provided
  })
})

const result = await response.json()
// Returns:
// {
//   success: true,
//   transcription: { ... },
//   segmentCount: 45,
//   duration: 180.5
// }
```

### Download Transcript

```typescript
// GET /api/process-transcription?projectId=xxx&format=srt
const response = await fetch('/api/process-transcription?projectId=project-123&format=srt')
// Downloads file: "Project Title-subtitles.srt"
```

## Configuration

### Environment Variables

```env
OPENAI_API_KEY=your_openai_api_key_here
```

### Whisper API Limitations

- **File size limit**: 25MB
- **Supported formats**: mp3, mp4, mpeg, mpga, m4a, wav, webm
- **Languages**: 50+ languages supported with auto-detection

## Processing Flow

1. **User uploads video** → Stored in Supabase
2. **Transcription task starts** → Video URL sent to API
3. **Download video** → Fetch video from storage
4. **Send to Whisper** → Process with OpenAI API
5. **Receive segments** → Timestamped transcript segments
6. **Store in database** → Save to project record
7. **Display in UI** → Interactive viewer with sync

## Error Handling

The system handles various error cases:
- File size exceeds limit → Clear error message
- Network failures → Retry mechanism
- API rate limits → Queuing system
- Invalid formats → Pre-upload validation

## Performance Considerations

- **Streaming downloads** for large video files
- **Progress tracking** with real-time updates
- **Caching** of transcription results
- **Lazy loading** of transcript segments

## Future Enhancements

- [ ] Support for multiple speakers detection
- [ ] Translation to other languages
- [ ] Custom vocabulary/terminology
- [ ] Real-time transcription for live streams
- [ ] Batch processing for multiple videos
- [ ] Advanced editing capabilities
- [ ] Integration with video editing timeline 