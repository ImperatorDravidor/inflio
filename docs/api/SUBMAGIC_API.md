# Submagic API Documentation

> **Migration Note**: Switching from Klap to Submagic for higher quality and better pricing on clip generation.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Rate Limits](#rate-limits)
- [API Endpoints](#api-endpoints)
  - [Health Check](#health-check)
  - [Get Languages](#get-languages)
  - [Get Templates](#get-templates)
  - [Create Project](#create-project)
  - [Create Magic Clips](#create-magic-clips)
  - [Upload Project](#upload-project)
  - [Get Project](#get-project)
  - [Update Project](#update-project)
  - [Export Project](#export-project)
- [Webhooks](#webhooks)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

---

## Overview

**Base URL**: `https://api.submagic.co`

**Capabilities**:
- AI-powered captions in 100+ languages
- Automatic transcription
- Magic Clips from YouTube videos
- Professional video templates
- Animated text, emojis, and visual effects
- Real-time webhook notifications

**Support**:
- Email: support@submagic.co
- Discord: https://discord.gg/submagic
- Dashboard: https://app.submagic.co

---

## Authentication

### Getting Your API Key

1. Sign up at https://app.submagic.co/signup
2. Navigate to Account Settings → API tab
3. Click "Generate API Key"
4. Copy immediately (shown only once!)

### API Key Format

```
sk-[64-character-hex-string]
```

Example: `sk-a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456`

### Authentication Method

Include in every request header:

```http
x-api-key: sk-your-api-key-here
```

### Security Best Practices

- ✅ Store in environment variables
- ✅ Use only on backend/server-side
- ❌ Never expose in client-side code
- ❌ Never commit to repositories
- ❌ Never log API keys

**Environment Variable**:
```bash
SUBMAGIC_API_KEY=sk-your-api-key-here
```

### Authentication Errors

**401 Unauthorized**:
```json
{
  "error": "UNAUTHORIZED",
  "message": "Invalid or missing API key"
}
```

---

## Rate Limits

### Rate Limit Tiers

| Tier | Limit | Endpoints |
|------|-------|-----------|
| **Lightweight** | 1000 req/hour | `/v1/languages`, `/v1/templates` |
| **Standard** | 500 req/hour | `/v1/projects/:id` (GET) |
| **Upload** | 500 req/hour | `/v1/projects` (POST), `/v1/projects/upload` |
| **Export** | 50 req/hour | `/v1/projects/:id/export` |

### Rate Limit Headers

Every response includes:

```http
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 29
X-RateLimit-Reset: 1640995200
```

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests in current window |
| `X-RateLimit-Remaining` | Requests remaining |
| `X-RateLimit-Reset` | Unix timestamp when limit resets |

### Rate Limit Exceeded Response

**429 Too Many Requests**:
```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 30
}
```

### Handling Rate Limits

**Exponential Backoff Example**:
```typescript
async function makeRequestWithRetry(url: string, options: RequestInit, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.status === 429) {
        const delay = Math.min(Math.pow(2, attempt) * 1000, 30000);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      return response;
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
    }
  }
}
```

---

## API Endpoints

### Health Check

Check API operational status.

**Endpoint**: `GET /health`

**Authentication**: Not required

**Rate Limit**: Not limited

**Request**:
```bash
curl -X GET "https://api.submagic.co/health"
```

**Response**:
```json
{
  "status": "healthy",
  "service": "submagic-public-api",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Status Values**:
- `healthy`: Operational
- `degraded`: Operational with issues
- `unhealthy`: Not operational

---

### Get Languages

Get list of supported languages for transcription.

**Endpoint**: `GET /v1/languages`

**Authentication**: Required

**Rate Limit**: 1000 req/hour

**Request**:
```bash
curl -X GET "https://api.submagic.co/v1/languages" \
  -H "x-api-key: sk-your-api-key-here"
```

**Response**:
```json
{
  "languages": [
    { "name": "English", "code": "en" },
    { "name": "Spanish", "code": "es" },
    { "name": "French", "code": "fr" },
    { "name": "German", "code": "de" },
    { "name": "Italian", "code": "it" },
    { "name": "Portuguese", "code": "pt" },
    { "name": "Dutch", "code": "nl" },
    { "name": "Russian", "code": "ru" },
    { "name": "Chinese (Simplified)", "code": "zh" },
    { "name": "Japanese", "code": "ja" },
    { "name": "Korean", "code": "ko" },
    { "name": "Arabic", "code": "ar" },
    { "name": "Hindi", "code": "hi" }
  ]
}
```

**Response Schema**:
```typescript
{
  languages: Array<{
    name: string;    // Human-readable name
    code: string;    // ISO language code (use in API requests)
  }>
}
```

**Popular Language Codes**:
- `en` - English (highest accuracy)
- `es` - Spanish
- `fr` - French
- `de` - German
- `pt` - Portuguese

**Caching Recommendation**: Cache for 24 hours (infrequent updates)

---

### Get Templates

Get list of available video templates for styling.

**Endpoint**: `GET /v1/templates`

**Authentication**: Required

**Rate Limit**: 1000 req/hour

**Request**:
```bash
curl -X GET "https://api.submagic.co/v1/templates" \
  -H "x-api-key: sk-your-api-key-here"
```

**Response**:
```json
{
  "templates": [
    "Sara",
    "Daniel",
    "Dan 2",
    "Hormozi 4",
    "Dan",
    "Devin",
    "Tayo",
    "Ella",
    "Tracy",
    "Luke",
    "Hormozi 1",
    "Hormozi 2",
    "Hormozi 3",
    "Hormozi 5",
    "Leila",
    "Jason",
    "William",
    "Leon",
    "Ali",
    "Beast",
    "Maya",
    "Karl",
    "Iman",
    "Umi",
    "David",
    "Noah",
    "Gstaad",
    "Malta",
    "Nema",
    "seth"
  ]
}
```

**Template Features**:
- Caption styling (font, size, color, position)
- Animation effects
- Visual elements (backgrounds, highlights)
- Color schemes
- Emoji integration
- Layout options

**Default Template**: `"Sara"` (applied if not specified)

**Important**: Template names are case-sensitive!

**Caching Recommendation**: Cache for 6 hours

---

### Create Project

Create a new video project with AI captions.

**Endpoint**: `POST /v1/projects`

**Authentication**: Required

**Rate Limit**: 500 req/hour

**Supported Formats**: MP4 (.mp4), MOV (.mov)

**Limits**:
- Max file size: 2GB
- Max duration: 2 hours

#### Request Body

```typescript
{
  // Required fields
  title: string;              // 1-100 characters
  language: string;           // Language code (e.g., "en", "es")
  videoUrl: string;           // Public URL to video file

  // Optional styling (mutually exclusive)
  templateName?: string;      // Template name from /v1/templates
  userThemeId?: string;       // Custom theme UUID (cannot use with templateName)

  // Optional configuration
  webhookUrl?: string;        // HTTPS URL for completion notification
  dictionary?: string[];      // Custom words (max 100 items, 50 chars each)
  
  // Optional AI features
  magicZooms?: boolean;       // Auto zoom effects (default: false)
  magicBrolls?: boolean;      // Auto B-roll insertion (default: false)
  magicBrollsPercentage?: number; // B-roll percentage 0-100 (default: 50)
  removeSilencePace?: 'natural' | 'fast' | 'extra-fast'; // Auto silence removal
  removeBadTakes?: boolean;   // AI bad take removal (default: false)
}
```

#### Silence Removal Paces

| Pace | Description |
|------|-------------|
| `extra-fast` | 0.1-0.2 seconds removal |
| `fast` | 0.2-0.6 seconds removal |
| `natural` | 0.6+ seconds removal |

#### Request Example

```bash
curl -X POST "https://api.submagic.co/v1/projects" \
  -H "x-api-key: sk-your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Awesome Video",
    "language": "en",
    "videoUrl": "https://example.com/videos/sample.mp4",
    "templateName": "Hormozi 2",
    "webhookUrl": "https://yoursite.com/webhook/submagic",
    "dictionary": ["Submagic", "AI-powered", "captions"],
    "magicZooms": true,
    "magicBrolls": true,
    "magicBrollsPercentage": 75,
    "removeSilencePace": "fast",
    "removeBadTakes": true
  }'
```

#### Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "My Awesome Video",
  "language": "en",
  "status": "processing",
  "webhookUrl": "https://yoursite.com/webhook/submagic",
  "templateName": "Hormozi 2",
  "magicZooms": true,
  "magicBrolls": true,
  "magicBrollsPercentage": 75,
  "removeSilencePace": "fast",
  "removeBadTakes": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### Response Schema

```typescript
{
  id: string;                    // UUID
  title: string;
  language: string;
  status: 'processing' | 'transcribing' | 'exporting' | 'completed' | 'failed';
  webhookUrl?: string;
  templateName?: string;
  userThemeId?: string;
  magicZooms?: boolean;
  magicBrolls?: boolean;
  magicBrollsPercentage?: number;
  removeSilencePace?: string;
  removeBadTakes?: boolean;
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601
}
```

#### Custom Dictionary Best Practices

Improve transcription accuracy with custom terms:

```json
{
  "dictionary": [
    "Submagic",
    "API endpoint",
    "captions",
    "transcription",
    "AI-powered",
    "webhook notification"
  ]
}
```

**Guidelines**:
- ✅ Brand names and product names
- ✅ Technical terms and jargon
- ✅ Frequently mispronounced words
- ❌ Max 50 characters per term
- ❌ Max 100 terms total

---

### Create Magic Clips

Automatically generate short-form video clips from YouTube videos using AI.

**Endpoint**: `POST /v1/projects/magic-clips`

**Authentication**: Required

**Rate Limit**: 500 req/hour

**Subscription Required**: Magic Clips subscription

**Important**: Magic Clips created via API use your regular Magic Clips credits, not API credits.

#### Request Body

```typescript
{
  // Required fields
  title: string;              // 1-100 characters
  language: string;           // Language code 2-10 chars (e.g., "en", "es")
  youtubeUrl: string;         // Valid YouTube URL

  // Optional configuration
  webhookUrl?: string;        // HTTPS URL for completion notification
  userThemeId?: string;       // Custom theme UUID
  minClipLength?: number;     // Min duration 15-300 seconds (default: 15)
  maxClipLength?: number;     // Max duration 15-300 seconds (default: 60)
}
```

#### Request Example

```bash
curl -X POST "https://api.submagic.co/v1/projects/magic-clips" \
  -H "x-api-key: sk-your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "YT magic-clips test1",
    "language": "en",
    "youtubeUrl": "https://www.youtube.com/watch?v=eURYVajKLVw",
    "webhookUrl": "https://webhook-test.com/6704c8535a2a913c3d094aba685d6a18",
    "minClipLength": 15,
    "maxClipLength": 60
  }'
```

#### Response

```json
{
  "id": "e568c322-7fa5-497a-8fb0-3ba32e9e67d2",
  "title": "YT magic-clips test1",
  "language": "en",
  "status": "processing",
  "webhookUrl": "https://webhook-test.com/6704c8535a2a913c3d094aba685d6a18",
  "createdAt": "2025-09-24T12:55:56.989Z"
}
```

#### Response Schema

```typescript
{
  id: string;           // UUID
  title: string;
  language: string;
  status: 'processing'; // Initial status
  webhookUrl?: string;
  createdAt: string;    // ISO 8601
}
```

#### Magic Clips Webhook Payload

When processing completes, your webhook receives:

```json
{
  "projectId": "e568c322-7fa5-497a-8fb0-3ba32e9e67d2",
  "status": "completed",
  "title": "YT magic-clips test1",
  "duration": 283,
  "completedAt": "2025-09-24T12:59:24.880Z",
  "magicClips": [
    {
      "id": "364fe092-b68d-468a-9558-bfca7c4d190e",
      "title": "ProMotion Display Breakthrough",
      "duration": 21.04,
      "status": "completed",
      "previewUrl": "https://app.submagic.co/view/364fe092-b68d-468a-9558-bfca7c4d190g",
      "downloadUrl": "https://app.submagic.co/api/file/download?path=...",
      "directUrl": "https://dqu1p08d61fh.cloudfront.net/api/..."
    }
  ]
}
```

#### Magic Clips Webhook Schema

```typescript
{
  projectId: string;        // Main project UUID
  status: 'completed' | 'failed';
  title: string;            // Project title
  duration: number;         // Original video duration (seconds)
  completedAt: string;      // ISO 8601 timestamp
  magicClips: Array<{
    id: string;             // Clip UUID
    title: string;          // AI-generated title
    duration: number;       // Clip duration (seconds)
    status: string;         // processing | completed | failed
    previewUrl: string;     // Preview page URL
    downloadUrl: string;    // Download URL with auth
    directUrl: string;      // CDN direct URL
  }>
}
```

#### Error Responses

**403 Forbidden** (No Magic Clips subscription):
```json
{
  "error": "FORBIDDEN",
  "message": "Magic Clips subscription required"
}
```

---

### Upload Project

Upload a video file directly for AI-powered caption generation.

**Endpoint**: `POST /v1/projects/upload`

**Authentication**: Required

**Rate Limit**: 500 req/hour

**Content-Type**: `multipart/form-data`

**Supported Formats**: MP4 (.mp4), MOV (.mov)

**Limits**:
- Max file size: 2GB
- Max duration: 2 hours

#### Request Body (multipart/form-data)

```typescript
{
  // Required fields
  title: string;              // 1-100 characters
  language: string;           // Language code (e.g., "en", "es")
  file: File;                 // Video file (MP4, MOV)

  // Optional styling (mutually exclusive)
  templateName?: string;      // Template name from /v1/templates
  userThemeId?: string;       // Custom theme UUID

  // Optional configuration
  webhookUrl?: string;        // HTTPS URL for notifications
  dictionary?: string;        // JSON array string of custom words

  // Optional AI features (all as strings!)
  magicZooms?: string;           // "true" or "false"
  magicBrolls?: string;          // "true" or "false"
  magicBrollsPercentage?: string; // "0" to "100"
  removeSilencePace?: string;    // "natural" | "fast" | "extra-fast"
  removeBadTakes?: string;       // "true" or "false"
}
```

**Important**: Boolean and number fields must be passed as **strings** in multipart form data!

#### Request Example

```typescript
const uploadProject = async (file: File) => {
  const formData = new FormData();
  formData.append('title', 'My Uploaded Video');
  formData.append('language', 'en');
  formData.append('file', file);
  formData.append('templateName', 'Hormozi 2');
  formData.append('webhookUrl', 'https://yoursite.com/webhook/submagic');
  formData.append('dictionary', JSON.stringify(['Submagic', 'AI-powered', 'captions']));
  formData.append('magicZooms', 'true');
  formData.append('magicBrolls', 'true');
  formData.append('magicBrollsPercentage', '75');
  formData.append('removeSilencePace', 'fast');
  formData.append('removeBadTakes', 'true');

  const response = await fetch('https://api.submagic.co/v1/projects/upload', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.SUBMAGIC_API_KEY!
    },
    body: formData
  });

  return await response.json();
};

// Usage with file input
fileInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (file) {
    const project = await uploadProject(file);
    console.log('Project uploaded:', project.id);
  }
});
```

#### Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "My Uploaded Video",
  "language": "en",
  "status": "processing",
  "webhookUrl": "https://yoursite.com/webhook/submagic",
  "templateName": "Hormozi 2",
  "magicZooms": true,
  "magicBrolls": true,
  "magicBrollsPercentage": 75,
  "removeSilencePace": "fast",
  "removeBadTakes": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### Error Responses

**413 Payload Too Large**:
```json
{
  "error": "PAYLOAD_TOO_LARGE",
  "message": "File size exceeds maximum allowed size"
}
```

**415 Unsupported Media Type**:
```json
{
  "error": "UNSUPPORTED_MEDIA_TYPE",
  "message": "Video format not supported"
}
```

**400 Validation Error**:
```json
{
  "error": "VALIDATION_ERROR",
  "message": "File validation failed",
  "details": [
    {
      "field": "file",
      "message": "File size exceeds 10GB limit",
      "value": null
    }
  ]
}
```

---

### Get Project

Retrieve details of a specific video project including status and download links.

**Endpoint**: `GET /v1/projects/:id`

**Authentication**: Required

**Rate Limit**: 100 req/hour

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Project UUID |

#### Request Example

```bash
curl -X GET "https://api.submagic.co/v1/projects/550e8400-e29b-41d4-a716-446655440000" \
  -H "x-api-key: sk-your-api-key-here"
```

#### Response (Processing)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "My Awesome Video",
  "language": "en",
  "status": "transcribing",
  "webhookUrl": "https://yoursite.com/webhook/submagic",
  "templateName": "Hormozi 2",
  "transcriptionStatus": "PROCESSING",
  "magicZooms": true,
  "magicBrolls": true,
  "magicBrollsPercentage": 75,
  "removeSilencePace": "fast",
  "removeBadTakes": true,
  "videoMetaData": {
    "width": 1920,
    "height": 1080,
    "duration": 185.2,
    "fps": 30
  },
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:32:15.000Z"
}
```

#### Response (Completed with Transcription)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "My Awesome Video",
  "language": "en",
  "status": "completed",
  "webhookUrl": "https://yoursite.com/webhook/submagic",
  "templateName": "Hormozi 2",
  "transcriptionStatus": "COMPLETED",
  "downloadUrl": "https://app.submagic.co/api/file/download?path=...",
  "directUrl": "https://dqu1p08d61fh.cloudfront.net/api/...",
  "previewUrl": "https://app.submagic.co/view/550e8400-e29b-41d4-a716-446655440000",
  "magicZooms": true,
  "magicBrolls": true,
  "magicBrollsPercentage": 75,
  "removeSilencePace": "fast",
  "removeBadTakes": true,
  "videoMetaData": {
    "width": 1920,
    "height": 1080,
    "duration": 185.2,
    "fps": 30
  },
  "words": [
    {
      "id": "silence_f9164d70-ac39-41cc-ae31-5b9de3093a2f",
      "text": "",
      "type": "silence",
      "startTime": 0,
      "endTime": 0.08
    },
    {
      "id": "w1EydrN5",
      "text": "Do",
      "type": "word",
      "startTime": 0.08,
      "endTime": 0.16
    },
    {
      "id": "8VUdYfGN",
      "text": "you",
      "type": "word",
      "startTime": 0.16,
      "endTime": 0.24
    },
    {
      "id": "eZBH24RB",
      "text": "mind",
      "type": "word",
      "startTime": 0.24,
      "endTime": 0.32
    },
    {
      "id": "LtVZ8CM",
      "text": "?",
      "type": "punctuation",
      "startTime": 0.84,
      "endTime": 0.84
    }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:35:20.000Z"
}
```

#### Response Schema

```typescript
{
  id: string;                    // UUID
  title: string;
  language: string;
  status: 'processing' | 'transcribing' | 'exporting' | 'completed' | 'failed';
  webhookUrl?: string;
  templateName?: string;
  userThemeId?: string;
  downloadUrl?: string;          // Available when status is 'completed'
  directUrl?: string;            // CDN URL when status is 'completed'
  previewUrl?: string;           // Preview page URL when completed
  transcriptionStatus?: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  failureReason?: string;        // Present if status is 'failed'
  magicZooms?: boolean;
  magicBrolls?: boolean;
  magicBrollsPercentage?: number;
  removeSilencePace?: string;
  removeBadTakes?: boolean;
  videoMetaData?: {
    width: number;
    height: number;
    duration: number;
    fps?: number;
  };
  words?: Array<{               // Available when transcription completed
    id: string;
    text: string;               // Empty for silence segments
    type: 'word' | 'silence' | 'punctuation';
    startTime: number;          // Seconds
    endTime: number;            // Seconds
  }>;
  magicClips?: Array<{          // Only for Magic Clips projects
    id: string;
    title: string;
    duration: number;
    status: 'processing' | 'completed' | 'failed';
    previewUrl?: string;
    downloadUrl?: string;
    directUrl?: string;
  }>;
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601
}
```

#### Words Array

The `words` array contains detailed transcription data:

- **word**: Spoken word with timing
- **silence**: Silent period in the video
- **punctuation**: Punctuation marks

This data is useful for:
- Custom caption positioning
- Transcript generation
- Timing-based video editing
- Search and navigation

---

### Update Project

Update an existing video project with new settings or media insertions.

**Endpoint**: `PUT /v1/projects/:id`

**Authentication**: Required

**Rate Limit**: 100 req/hour

**Important**: 
- After updating, you must re-export to see changes
- `removeBadTakes` processing may take 1-2 minutes
- All fields are optional (only provide what you want to update)

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Project UUID |

#### Request Body

```typescript
{
  // Optional AI features
  removeSilencePace?: 'natural' | 'fast' | 'extra-fast';
  removeBadTakes?: boolean;     // Takes 1-2 minutes to process
  
  // Optional media insertions
  items?: Array<{
    startTime: number;          // Start time in seconds (>= 0)
    endTime: number;            // End time in seconds (> startTime)
    userMediaId: string;        // UUID of media from your library
  }>;
}
```

#### Finding User Media ID

To get your `userMediaId`:

1. Go to Submagic editor
2. Navigate to **'B-roll' tab**
3. Add a B-roll to access your media library
4. Go to **'My videos' tab**
5. Each video displays its unique media ID

#### Request Example

```bash
curl -X PUT "https://api.submagic.co/v1/projects/550e8400-e29b-41d4-a716-446655440000" \
  -H "x-api-key: sk-your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "removeSilencePace": "fast",
    "removeBadTakes": true,
    "items": [
      {
        "startTime": 10.5,
        "endTime": 15.2,
        "userMediaId": "123e4567-e89b-12d3-a456-426614174000"
      },
      {
        "startTime": 25.0,
        "endTime": 30.8,
        "userMediaId": "987fcdeb-51a2-43d7-b123-556644330099"
      }
    ]
  }'
```

#### Response

```json
{
  "message": "Project updated successfully",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing"
}
```

#### Response Schema

```typescript
{
  message: string;      // Success message
  id: string;           // Project UUID
  status: string;       // Updated status
}
```

#### Error Responses

**404 Not Found**:
```json
{
  "error": "NOT_FOUND",
  "message": "Project not found"
}
```

**400 Validation Error (Invalid Time Range)**:
```json
{
  "error": "VALIDATION_ERROR",
  "message": "endTime must be greater than startTime"
}
```

**400 Validation Error (Invalid UUID)**:
```json
{
  "error": "VALIDATION_ERROR",
  "message": "userMediaId must be a valid UUID"
}
```

#### Usage Flow

```typescript
// 1. Update project with new settings
const updateResult = await fetch(
  `https://api.submagic.co/v1/projects/${projectId}`,
  {
    method: 'PUT',
    headers: {
      'x-api-key': process.env.SUBMAGIC_API_KEY!,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      removeSilencePace: 'fast',
      removeBadTakes: true,
      items: [
        {
          startTime: 10.5,
          endTime: 15.2,
          userMediaId: '123e4567-e89b-12d3-a456-426614174000'
        }
      ]
    })
  }
);

// 2. Re-export to apply changes (see Export Project section)
const exportResult = await fetch(
  `https://api.submagic.co/v1/projects/${projectId}/export`,
  {
    method: 'POST',
    headers: { 'x-api-key': process.env.SUBMAGIC_API_KEY! }
  }
);

// 3. Poll or wait for webhook to get updated video
```

---

### Export Project

Trigger rendering/export of a completed project to generate the final video.

**Endpoint**: `POST /v1/projects/:id/export`

**Authentication**: Required

**Rate Limit**: Enhanced limits for API projects

**Process**: Asynchronous (use webhooks or polling to track completion)

#### Prerequisites

Before exporting, ensure:
- ✅ Project is transcribed (has `words` data)
- ✅ Project is not in "uploading" status
- ✅ Project belongs to authenticated user
- ✅ Project was created via API

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Project UUID |

#### Request Body (Optional)

```typescript
{
  fps?: number;         // Frames per second 1-60 (default: original or 30)
  width?: number;       // Width in pixels 100-4000 (default: original or 1080)
  height?: number;      // Height in pixels 100-4000 (default: original or 1920)
  webhookUrl?: string;  // URL for completion notification
}
```

**Default Behavior**: If parameters not provided, uses project's original metadata or optimal defaults.

#### Request Example (Default Settings)

```bash
curl -X POST "https://api.submagic.co/v1/projects/550e8400-e29b-41d4-a716-446655440000/export" \
  -H "x-api-key: sk-your-api-key-here" \
  -H "Content-Type: application/json"
```

#### Request Example (Custom Settings)

```bash
curl -X POST "https://api.submagic.co/v1/projects/550e8400-e29b-41d4-a716-446655440000/export" \
  -H "x-api-key: sk-your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "fps": 30,
    "width": 1080,
    "height": 1920,
    "webhookUrl": "https://yoursite.com/webhook/export-complete"
  }'
```

#### Response

```json
{
  "message": "Export started successfully",
  "projectId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "exporting"
}
```

#### Response Schema

```typescript
{
  message: string;      // Success message
  projectId: string;    // UUID
  status: string;       // Status after export trigger (usually "exporting")
}
```

#### Tracking Export Progress

**Option 1: Webhooks** (Recommended)

Provide `webhookUrl` in the export request:

```typescript
await fetch(`${BASE_URL}/v1/projects/${projectId}/export`, {
  method: 'POST',
  headers: {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    webhookUrl: 'https://yoursite.com/webhook/export-complete'
  })
});

// Your webhook will receive:
// {
//   "projectId": "550e8400-e29b-41d4-a716-446655440000",
//   "status": "completed",
//   "downloadUrl": "https://app.submagic.co/api/file/download?path=...",
//   "directUrl": "https://dqu1p08d61fh.cloudfront.net/api/...",
//   "timestamp": "2024-01-15T10:45:00.000Z"
// }
```

**Option 2: Polling**

Poll the Get Project endpoint:

```typescript
async function waitForExport(projectId: string, maxAttempts = 60): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const project = await fetch(
      `${BASE_URL}/v1/projects/${projectId}`,
      { headers: { 'x-api-key': API_KEY } }
    ).then(r => r.json());

    if (project.status === 'completed' && project.downloadUrl) {
      console.log('Export complete!');
      console.log('Download URL:', project.downloadUrl);
      return;
    }

    if (project.status === 'failed') {
      throw new Error(`Export failed: ${project.failureReason}`);
    }

    // Wait 10 seconds before next check
    await new Promise(resolve => setTimeout(resolve, 10000));
  }

  throw new Error('Export timeout');
}
```

#### Error Responses

**404 Not Found**:
```json
{
  "error": "NOT_FOUND",
  "message": "Project not found"
}
```

**400 Bad Request**:
```json
{
  "error": "BAD_REQUEST",
  "message": "Project must be transcribed before exporting"
}
```

**500 Internal Server Error**:
```json
{
  "error": "INTERNAL_SERVER_ERROR",
  "message": "Export failed to start"
}
```

#### Complete Export Workflow

```typescript
// 1. Create or update project
const project = await createProject({
  title: 'My Video',
  language: 'en',
  videoUrl: 'https://example.com/video.mp4',
  templateName: 'Hormozi 2'
});

// 2. Wait for transcription (via webhook or polling)
await waitForTranscription(project.id);

// 3. Optionally update project
await updateProject(project.id, {
  removeSilencePace: 'fast',
  removeBadTakes: true
});

// 4. Export with custom settings
await exportProject(project.id, {
  fps: 30,
  width: 1080,
  height: 1920,
  webhookUrl: 'https://yoursite.com/webhook/export'
});

// 5. Wait for export completion
await waitForExport(project.id);

// 6. Download the final video
const finalProject = await getProject(project.id);
console.log('Download URL:', finalProject.downloadUrl);
```

---

## Webhooks

### Setup

Provide a webhook URL when creating a project:

```json
{
  "webhookUrl": "https://yoursite.com/webhook/submagic"
}
```

### Webhook Payload

Your endpoint will receive a POST request when processing completes:

```json
{
  "projectId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "downloadUrl": "https://app.submagic.co/api/file/download?path=3c6cd7cd-3f5e-4def-b662-69c48a7fc8ce/e568c322-7fa5-497a-8fb0-3ba32e9e67d2/364fe092-b68d-468a-9558-bfca7c4d130e-download.mp4&newFileName=ProMotion%20Display%20Breakthrough.mp4",
  "directUrl": "https://dqu1p08d61fh.cloudfront.net/api/9cc52d00-43d7-442f-9a22-050312bkm24f/1ddee5b4-101f-4c1e-a74a-b6b3bcfe206c/video.mp4-download.mp4",
  "timestamp": "2024-01-15T10:45:00.000Z"
}
```

### Webhook Schema

```typescript
{
  projectId: string;        // UUID of the project
  status: string;           // Status: "completed" or "failed"
  downloadUrl: string;      // Full download URL with auth params
  directUrl: string;        // CloudFront CDN URL
  timestamp: string;        // ISO 8601 timestamp
}
```

### Webhook Best Practices

1. **Respond quickly**: Return 200 OK immediately
2. **Process async**: Handle video download in background job
3. **Verify payload**: Validate projectId exists in your system
4. **Idempotency**: Handle duplicate webhook deliveries
5. **Security**: Use HTTPS only, validate source if possible

---

## Error Handling

### Error Response Format

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": []  // Optional additional context
}
```

### Common Error Codes

#### 400 Validation Error

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "details": [
    {
      "field": "videoUrl",
      "message": "Must be a valid URL",
      "value": "invalid-url"
    }
  ]
}
```

#### 401 Unauthorized

```json
{
  "error": "UNAUTHORIZED",
  "message": "Invalid or missing API key"
}
```

**Fix**: Check your API key in the `x-api-key` header

#### 429 Rate Limit Exceeded

```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests",
  "retryAfter": 30
}
```

**Fix**: Implement exponential backoff, wait before retrying

#### 500 Internal Server Error

```json
{
  "error": "INTERNAL_SERVER_ERROR",
  "message": "An unexpected error occurred"
}
```

**Fix**: Retry with exponential backoff, contact support if persists

---

## Best Practices

### 1. Caching

Cache infrequently-changing data:

```typescript
class SubmagicCache {
  private templates: string[] | null = null;
  private languages: any[] | null = null;
  private lastFetch: number | null = null;
  private cacheDuration = 6 * 60 * 60 * 1000; // 6 hours

  async getTemplates(): Promise<string[]> {
    if (this.templates && this.isValid()) {
      return this.templates;
    }

    const response = await fetch('https://api.submagic.co/v1/templates', {
      headers: { 'x-api-key': process.env.SUBMAGIC_API_KEY! }
    });

    const data = await response.json();
    this.templates = data.templates;
    this.lastFetch = Date.now();

    return this.templates;
  }

  private isValid(): boolean {
    return this.lastFetch !== null && 
           Date.now() - this.lastFetch < this.cacheDuration;
  }
}
```

### 2. Use Webhooks Instead of Polling

❌ **Bad**: Polling for status
```typescript
// Don't do this!
while (status !== 'completed') {
  await sleep(5000);
  status = await checkStatus(projectId);
}
```

✅ **Good**: Use webhooks
```typescript
const project = await createProject({
  // ... other params
  webhookUrl: 'https://yoursite.com/webhook/submagic'
});

// Handle in webhook endpoint
app.post('/webhook/submagic', async (req, res) => {
  const { projectId, downloadUrl } = req.body;
  // Process completed video
  res.sendStatus(200);
});
```

### 3. Monitor Rate Limits

```typescript
async function makeRequest(url: string, options: RequestInit) {
  const response = await fetch(url, options);
  
  const remaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '0');
  const resetTime = parseInt(response.headers.get('X-RateLimit-Reset') || '0');
  
  if (remaining < 10) {
    console.warn(`Low rate limit: ${remaining} requests remaining`);
    console.warn(`Resets at: ${new Date(resetTime * 1000)}`);
  }
  
  return response;
}
```

### 4. Error Recovery

```typescript
async function createProjectWithRetry(
  data: CreateProjectRequest,
  maxRetries = 3
): Promise<Project> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await createProject(data);
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry client errors
      if (error.statusCode >= 400 && error.statusCode < 500) {
        throw error;
      }

      // Exponential backoff for server errors
      const delay = Math.min(Math.pow(2, attempt) * 1000, 30000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
```

### 5. Video URL Requirements

Ensure video URLs are:
- ✅ Publicly accessible (no auth required)
- ✅ Direct file URLs (not landing pages)
- ✅ Supported format (MP4, MOV)
- ✅ Under 2GB and 2 hours
- ✅ HTTPS preferred

### 6. TypeScript Type Definitions

```typescript
// types/submagic.ts

export interface SubmagicLanguage {
  name: string;
  code: string;
}

export interface CreateProjectRequest {
  title: string;
  language: string;
  videoUrl: string;
  templateName?: string;
  userThemeId?: string;
  webhookUrl?: string;
  dictionary?: string[];
  magicZooms?: boolean;
  magicBrolls?: boolean;
  magicBrollsPercentage?: number;
  removeSilencePace?: 'natural' | 'fast' | 'extra-fast';
  removeBadTakes?: boolean;
}

export interface Project {
  id: string;
  title: string;
  language: string;
  status: 'processing' | 'transcribing' | 'exporting' | 'completed' | 'failed';
  webhookUrl?: string;
  templateName?: string;
  userThemeId?: string;
  magicZooms?: boolean;
  magicBrolls?: boolean;
  magicBrollsPercentage?: number;
  removeSilencePace?: string;
  removeBadTakes?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookPayload {
  projectId: string;
  status: string;
  downloadUrl: string;
  directUrl: string;
  timestamp: string;
}
```

---

## Implementation Checklist

- [ ] Get API key from https://app.submagic.co
- [ ] Store API key in environment variables
- [ ] Implement language/template caching
- [ ] Create project creation endpoint
- [ ] Set up webhook handler endpoint
- [ ] Implement exponential backoff for retries
- [ ] Add rate limit monitoring
- [ ] Handle all error cases
- [ ] Add TypeScript types
- [ ] Test with sample videos
- [ ] Document internal usage

---

## Quick Reference

```typescript
// Initialize client
const SUBMAGIC_API_KEY = process.env.SUBMAGIC_API_KEY;
const BASE_URL = 'https://api.submagic.co';
const headers = {
  'x-api-key': SUBMAGIC_API_KEY,
  'Content-Type': 'application/json'
};

// 1. Create project from URL
const project = await fetch(`${BASE_URL}/v1/projects`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    title: 'My Video',
    language: 'en',
    videoUrl: 'https://example.com/video.mp4',
    templateName: 'Hormozi 2',
    webhookUrl: 'https://yoursite.com/webhook',
    magicZooms: true,
    removeSilencePace: 'fast'
  })
}).then(r => r.json());

// 2. Upload project from file
const formData = new FormData();
formData.append('title', 'Uploaded Video');
formData.append('language', 'en');
formData.append('file', videoFile);
formData.append('templateName', 'Hormozi 2');

const uploadedProject = await fetch(`${BASE_URL}/v1/projects/upload`, {
  method: 'POST',
  headers: { 'x-api-key': SUBMAGIC_API_KEY },
  body: formData
}).then(r => r.json());

// 3. Create Magic Clips from YouTube
const magicClips = await fetch(`${BASE_URL}/v1/projects/magic-clips`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    title: 'YT Clips',
    language: 'en',
    youtubeUrl: 'https://www.youtube.com/watch?v=VIDEO_ID',
    minClipLength: 15,
    maxClipLength: 60,
    webhookUrl: 'https://yoursite.com/webhook/magic-clips'
  })
}).then(r => r.json());

// 4. Get project status
const projectStatus = await fetch(
  `${BASE_URL}/v1/projects/${project.id}`,
  { headers: { 'x-api-key': SUBMAGIC_API_KEY } }
).then(r => r.json());

// 5. Update project
await fetch(`${BASE_URL}/v1/projects/${project.id}`, {
  method: 'PUT',
  headers,
  body: JSON.stringify({
    removeSilencePace: 'fast',
    removeBadTakes: true
  })
});

// 6. Export project
await fetch(`${BASE_URL}/v1/projects/${project.id}/export`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    fps: 30,
    width: 1080,
    height: 1920,
    webhookUrl: 'https://yoursite.com/webhook/export'
  })
});

// Handle webhooks
app.post('/webhook/submagic', async (req, res) => {
  const { projectId, downloadUrl, directUrl } = req.body;
  // Process completed video
  res.sendStatus(200);
});

app.post('/webhook/magic-clips', async (req, res) => {
  const { projectId, magicClips } = req.body;
  // Process array of clips
  for (const clip of magicClips) {
    console.log(`Clip: ${clip.title} - ${clip.downloadUrl}`);
  }
  res.sendStatus(200);
});
```

---

**Last Updated**: October 30, 2025
**API Version**: v1
**Status**: Migration from Klap in progress

