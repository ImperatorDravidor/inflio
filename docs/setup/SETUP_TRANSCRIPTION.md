# AI Transcription Setup Guide

This guide will help you set up the AI transcription feature using OpenAI's Whisper API.

## Environment Setup

### 1. Create Environment Variables

Create a `.env.local` file in the root of your project with the following content:

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Database Configuration (using SQLite for development)
DATABASE_URL="file:./dev.db"

# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to API keys section
4. Create a new API key
5. Copy the key and replace `your_openai_api_key_here` in `.env.local`

### 3. Initialize Database

Run the following commands to set up the database:

```bash
# Generate Prisma client
npx prisma generate

# Create database tables
npx prisma db push
```

## How It Works

### Architecture Overview

1. **Video Upload**: Videos are uploaded and metadata is stored in the database
2. **Transcription Request**: When transcription is requested, the video file is sent to OpenAI's Whisper API
3. **Storage**: Transcripts are stored in the database with timestamped segments
4. **Display**: Transcripts can be viewed with synchronized timestamps

### Database Schema

- **Video**: Stores video metadata (filename, format, resolution, etc.)
- **Transcript**: Stores the full transcript and metadata
- **TranscriptSegment**: Stores timestamped segments of the transcript

### API Endpoints

- `POST /api/upload`: Upload a video and save metadata
- `POST /api/transcribe`: Send video to Whisper API for transcription
- `GET /api/transcribe?videoId={id}`: Retrieve transcript for a video

## Usage Example

```typescript
import { uploadVideo, transcribeVideo, getTranscript } from '@/lib/api'
import { TranscriptViewer } from '@/components/TranscriptViewer'

// Upload video
const video = await uploadVideo(file)

// Transcribe video
const transcription = await transcribeVideo(video.id, file)

// Display transcript
<TranscriptViewer 
  videoId={video.id} 
  hasTranscript={true}
  onTranscribe={() => handleTranscribe(video.id, file)}
/>
```

## Pricing

OpenAI Whisper API pricing (as of 2024):
- $0.006 per minute of audio

For example:
- 10-minute video: $0.06
- 60-minute video: $0.36

## Limitations

- Maximum file size: 25MB (OpenAI limit)
- Supported formats: mp3, mp4, mpeg, mpga, m4a, wav, webm
- For larger files, you may need to:
  - Compress the video
  - Extract audio track
  - Split into smaller segments

## Next Steps

1. Implement audio extraction for video files larger than 25MB
2. Add support for multiple languages
3. Implement real-time transcription status updates
4. Add transcript editing capabilities
5. Export transcripts in various formats (SRT, VTT, TXT) 