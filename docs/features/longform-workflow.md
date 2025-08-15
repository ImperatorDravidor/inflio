# Long-form Video Workflow

## Overview
The long-form workflow provides comprehensive video editing capabilities including transcript editing, chapter generation, and subtitle management for YouTube and other platforms.

## Components

### 1. Video Player with Transcript Timeline
- **Component**: EnhancedTranscriptEditor
- **Features**:
  - Interactive transcript segments
  - Click-to-seek functionality
  - Real-time editing with auto-save
  - Word count and duration tracking
  - Visual timeline with segment highlighting

### 2. Chapters Editor
- **Component**: VideoChapters
- **Features**:
  - AI-powered chapter generation from transcript
  - Manual chapter editing (title, description, timestamp)
  - YouTube format export (00:00 format)
  - Chapter validation for platform requirements
  - Style options: descriptive, concise, engaging, keyword-focused
  - Platform-specific optimization (YouTube, Vimeo, generic)

### 3. Subtitle Generation & Export
- **Service**: TranscriptionService
- **Features**:
  - VTT format with styling support
  - SRT format for compatibility
  - Custom styling options:
    - Font family, size, color
    - Background and shadow effects
    - Position (top/center/bottom)
    - Animation effects (fade/slide)
  - Burn-in subtitles to video (CloudVideoService)

## Implementation

### Transcript Editing
```typescript
<EnhancedTranscriptEditor
  segments={transcriptionSegments}
  onSegmentsChange={(updated) => saveTranscript(updated)}
  projectId={projectId}
  videoUrl={videoUrl}
  videoDuration={duration}
  onSegmentClick={(segment) => seekVideo(segment.start)}
/>
```

### Chapter Generation
```typescript
// Generate chapters from transcript
const response = await fetch('/api/generate-chapters', {
  method: 'POST',
  body: JSON.stringify({
    projectId,
    style: 'engaging',
    minChapterDuration: 30,
    maxChapters: 15,
    includeIntro: true,
    targetPlatform: 'youtube'
  })
})
```

### Subtitle Export
```typescript
// Generate VTT with styling
const vttContent = TranscriptionService.formatSubtitles(
  segments,
  'vtt'
)

// Generate SRT for compatibility
const srtContent = TranscriptionService.formatSubtitles(
  segments,
  'srt'
)
```

## API Endpoints

### POST /api/generate-chapters
Generates AI-powered chapters from transcript:
```json
{
  "projectId": "uuid",
  "style": "engaging",
  "minChapterDuration": 30,
  "maxChapters": 15,
  "includeIntro": true,
  "targetPlatform": "youtube"
}
```

### POST /api/apply-subtitles
Burns subtitles into video:
```json
{
  "projectId": "uuid",
  "videoUrl": "https://...",
  "segments": [...],
  "settings": {
    "fontFamily": "Arial",
    "fontSize": 24,
    "fontColor": "#FFFFFF",
    "backgroundColor": "#000000",
    "position": "bottom"
  }
}
```

### PATCH /api/projects/[id]/transcription
Updates transcript segments:
```json
{
  "segments": [
    {
      "start": 0,
      "end": 5.2,
      "text": "Updated text"
    }
  ]
}
```

## Database Schema

### projects table extensions
```sql
- transcription_data (JSONB) - Full transcript with segments
- chapters (JSONB) - Generated chapters array
- subtitle_settings (JSONB) - User preferences for subtitles
```

### Chapter Format
```json
{
  "id": "chapter_1",
  "title": "Introduction",
  "description": "Overview of the topic",
  "timestamp": 0,
  "duration": 120,
  "order": 0,
  "keywords": ["intro", "overview"]
}
```

## YouTube Export Format

### Chapters in Description
```
00:00 Introduction
02:15 Getting Started
05:30 Main Concepts
10:45 Advanced Features
15:20 Best Practices
20:00 Conclusion
```

### Requirements
- First chapter must start at 00:00
- Minimum 3 chapters
- At least 10 seconds between chapters
- Maximum title length: 100 characters

## Subtitle Formats

### VTT (Web Video Text Tracks)
```vtt
WEBVTT

00:00:00.000 --> 00:00:05.000
Welcome to this comprehensive tutorial

00:00:05.000 --> 00:00:10.000
Today we'll explore advanced features
```

### SRT (SubRip)
```srt
1
00:00:00,000 --> 00:00:05,000
Welcome to this comprehensive tutorial

2
00:00:05,000 --> 00:00:10,000
Today we'll explore advanced features
```

## Quality Checks

### Chapter Validation
- Timestamp within video duration
- No overlapping chapters
- Minimum duration met
- Platform-specific rules

### Subtitle Validation
- Proper timing format
- No overlapping segments
- Character limit per line
- Reading speed appropriate

### Transcript Accuracy
- Grammar and spelling check
- Punctuation consistency
- Speaker identification
- Technical term accuracy

## User Workflow

1. **Upload Video** → Automatic transcription
2. **Edit Transcript** → Fix errors, add punctuation
3. **Generate Chapters** → AI creates logical sections
4. **Review & Edit Chapters** → Refine titles and timestamps
5. **Style Subtitles** → Choose appearance settings
6. **Export Options**:
   - YouTube description with chapters
   - VTT/SRT subtitle files
   - Video with burned-in subtitles
   - Transcript document (TXT/PDF)

## Performance Considerations

- Transcript segments cached for quick editing
- Debounced auto-save (2 second delay)
- Lazy loading for long transcripts (> 500 segments)
- Background processing for subtitle burn-in
- Progressive chapter generation for long videos

## Testing Checklist
- [x] Transcript loads and displays correctly
- [x] Click-to-seek works on segments
- [x] Edits save automatically
- [x] Chapters generate from transcript
- [x] Chapter editing persists
- [x] YouTube format exports correctly
- [x] VTT subtitles generate with styling
- [x] SRT format exports for compatibility
- [x] Subtitle burn-in processes successfully