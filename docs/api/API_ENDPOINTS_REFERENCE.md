# API Endpoints Reference

## Core Video Processing

### Upload Video
```
POST /api/upload
Content-Type: multipart/form-data

Body: FormData with video file
Response: { url: string, projectId: string }
```

### Process Video with Klap
```
POST /api/process-klap
Content-Type: application/json

Body: {
  projectId: string,
  videoUrl: string
}

Response: {
  taskId: string,
  status: 'processing' | 'completed' | 'failed'
}
```

### Process Transcription
```
POST /api/process-transcription
Content-Type: application/json

Body: {
  projectId: string,
  videoUrl: string
}

Response: {
  transcription: {
    text: string,
    segments: Array<{
      start: number,
      end: number,
      text: string
    }>
  }
}
```

## Content Generation

### Generate Blog Post
```
POST /api/generate-blog
Content-Type: application/json
Auth: Required

Body: {
  projectId: string,
  enhancedContext?: {
    contentAnalysis: object,
    unifiedPrompt?: string
  }
}

Response: {
  content: string,  // HTML content
  title: string,
  readingTime: number,
  tags: string[]
}
```

### Generate Social Media Captions
```
POST /api/generate-caption
Content-Type: application/json
Auth: Required

Body: {
  content: {
    id: string,
    title: string,
    type: 'clip' | 'blog' | 'image',
    duration?: number
  },
  platform: string,
  projectContext?: string
}

Response: {
  caption: string,
  hashtags: string[],
  characterCount: number
}
```

### Generate Thumbnail Suggestions
```
POST /api/generate-thumbnail-suggestions
Content-Type: application/json
Auth: Required

Body: {
  projectId: string
}

Response: {
  suggestions: Array<{
    prompt: string,
    psychologicalTrigger: string,
    textOverlay: string,
    viralScore: number
  }>
}
```

### Generate AI Images
```
POST /api/generate-images
Content-Type: application/json
Auth: Required

Body: {
  projectId: string,
  prompt: string,
  imageType: string,
  platforms: string[],
  count: number,
  usePersona?: boolean,
  style?: object
}

Response: {
  images: Array<{
    url: string,
    metadata: object
  }>
}
```

## Social Media

### Connect Social Account
```
GET /api/social/connect?platform=PLATFORM
Auth: Required

Redirects to OAuth flow
```

### OAuth Callback
```
GET /api/social/callback/[platform]
Handles OAuth callback and stores tokens
```

### Publish Content
```
POST /api/social/publish
Content-Type: application/json
Auth: Required

Body: {
  content: string,
  platforms: string[],
  media?: string[],
  scheduledFor?: string,
  projectId?: string
}

Response: {
  posts: Array<{
    id: string,
    platform: string,
    status: 'scheduled' | 'published' | 'failed'
  }>
}
```

### Get Platform Analytics
```
GET /api/social/analytics/[platform]
Auth: Required

Response: {
  metrics: {
    views: number,
    likes: number,
    comments: number,
    shares: number
  },
  timeRange: string
}
```

## Subtitles

### Apply Subtitles to Video
```
POST /api/apply-subtitles
Content-Type: application/json
Auth: Required

Body: {
  videoUrl: string,
  segments: Array<{
    start: number,
    end: number,
    text: string
  }>,
  projectId: string,
  settings?: {
    fontSize: number,
    fontFamily: string,
    textColor: string
  }
}

Response: {
  taskId: string,
  status: 'processing'
}
```

### Check Subtitle Task Status
```
GET /api/apply-subtitles/status/[taskId]
Auth: Required

Response: {
  id: string,
  status: 'processing' | 'completed' | 'failed',
  progress: number,
  outputVideoUrl?: string
}
```

## Project Management

### List Projects
```
GET /api/list-projects
Auth: Required

Response: {
  projects: Array<Project>
}
```

### Get Project Details
```
GET /api/projects/[id]
Auth: Required

Response: Project object
```

### Update Project
```
PATCH /api/projects/[id]
Auth: Required

Body: Partial<Project>
Response: Updated project
```

## Utility Endpoints

### Check Klap Task Status
```
GET /api/check-klap-task?projectId=ID
Auth: Required

Response: {
  status: string,
  progress: number,
  clips?: Array<Clip>
}
```

### Generate Summary
```
POST /api/generate-summary
Auth: Required

Body: {
  text: string,
  maxLength?: number
}

Response: {
  summary: string
}
```

### Convert to GIF
```
POST /api/convert-to-gif
Auth: Required

Body: {
  videoUrl: string,
  startTime?: number,
  duration?: number
}

Response: {
  gifUrl: string
}
```

## Debug Endpoints (Should be removed in production)

⚠️ **These endpoints expose sensitive information and should be removed or protected:**

- `GET /api/test-klap-simple` - Klap configuration test
- `GET /api/diagnose-klap` - Klap diagnostics
- `GET /api/diagnose-social-oauth` - OAuth configuration test
- `GET /api/test-klap-status` - Klap status check
- `GET /api/test-klap-immediate` - Direct Klap API test
- `GET /api/test-subtitles` - Subtitle generation test
- Various other `/api/test-*` endpoints

## Error Responses

All endpoints may return these error formats:

### Client Error (4xx)
```json
{
  "error": "Error message",
  "details": "Additional context"
}
```

### Server Error (5xx)
```json
{
  "error": "Internal server error",
  "message": "Detailed error for debugging"
}
```

## Rate Limiting

- **Anonymous**: 10 requests/minute
- **Authenticated**: 100 requests/minute
- **Video Processing**: 5 concurrent operations

## Authentication

Most endpoints require authentication via Clerk. Include the session cookie or Authorization header:

```
Authorization: Bearer <clerk-token>
``` 