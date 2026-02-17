# Submagic API Documentation

Complete API documentation for Submagic integration (replacing Klap).

## 📚 Documentation Files

1. **[SUBMAGIC_API.md](./SUBMAGIC_API.md)** - Complete API reference
   - All endpoints with examples
   - Authentication & rate limits
   - Webhooks & error handling
   - Best practices & TypeScript examples

2. **[SUBMAGIC_MIGRATION_NOTES.md](./SUBMAGIC_MIGRATION_NOTES.md)** - Migration guide
   - Why we're switching from Klap
   - Key differences & improvements
   - Migration checklist
   - Integration code structure

3. **[submagic-types.ts](./submagic-types.ts)** - TypeScript definitions
   - Complete type definitions
   - Type guards & utilities
   - Constants & enums
   - Service interface

## 🚀 Quick Start

### 1. Get API Key

Sign up at [app.submagic.co](https://app.submagic.co/signup) and generate your API key.

### 2. Set Environment Variable

```bash
SUBMAGIC_API_KEY=sk-your-api-key-here
```

### 3. Basic Usage

```typescript
import { SubmagicClient } from './lib/services/submagic-service';

const client = new SubmagicClient({
  apiKey: process.env.SUBMAGIC_API_KEY!
});

// Create project
const project = await client.createProject({
  title: 'My Video',
  language: 'en',
  videoUrl: 'https://example.com/video.mp4',
  templateName: 'Hormozi 2',
  webhookUrl: 'https://yoursite.com/webhook'
});

// Handle webhook
app.post('/webhook/submagic', async (req, res) => {
  const { projectId, downloadUrl } = req.body;
  // Process completed video
  res.sendStatus(200);
});
```

## 📋 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/v1/languages` | GET | List 100+ languages |
| `/v1/templates` | GET | List 30+ templates |
| `/v1/projects` | POST | Create project from URL |
| `/v1/projects/upload` | POST | Upload video file |
| `/v1/projects/magic-clips` | POST | Generate clips from YouTube |
| `/v1/projects/:id` | GET | Get project status |
| `/v1/projects/:id` | PUT | Update project |
| `/v1/projects/:id/export` | POST | Export video |

## ✨ Key Features

### AI-Powered Captions
- 100+ languages
- Automatic transcription
- Word-level timing
- Custom dictionary support

### Magic Clips (YouTube)
- Automatic clip generation
- AI-generated titles
- Configurable clip length
- Multiple clips per video

### Advanced Editing
- Magic Zooms
- Auto B-rolls
- Silence removal (3 paces)
- Bad takes removal
- Custom media insertion

### Professional Templates
30+ pre-built templates:
- Hormozi 1-5 (popular for business content)
- Sara, Daniel, Dan, etc.
- Custom themes support

## 🔧 Implementation Checklist

- [ ] Review [SUBMAGIC_API.md](./SUBMAGIC_API.md) for complete reference
- [ ] Copy [submagic-types.ts](./submagic-types.ts) to `src/types/`
- [ ] Create `src/lib/services/submagic-service.ts`
- [ ] Add `SUBMAGIC_API_KEY` to `.env`
- [ ] Set up webhook handler
- [ ] Test with sample video
- [ ] Replace Klap integration
- [ ] Update database if needed
- [ ] Deploy and monitor

## 🎯 Use Cases

### 1. Simple Captioning
Generate captions for uploaded videos with templates.

```typescript
const project = await client.createProject({
  title: 'Tutorial Video',
  language: 'en',
  videoUrl: videoUrl,
  templateName: 'Hormozi 2'
});
```

### 2. YouTube Clip Generation
Create viral clips from long-form YouTube content.

```typescript
const magicClips = await client.createMagicClips({
  title: 'Podcast Clips',
  language: 'en',
  youtubeUrl: 'https://youtube.com/watch?v=VIDEO_ID',
  minClipLength: 30,
  maxClipLength: 90
});
```

### 3. Advanced Video Editing
Apply AI features and custom media.

```typescript
// Update project with AI features
await client.updateProject(projectId, {
  removeSilencePace: 'fast',
  removeBadTakes: true,
  items: [
    { startTime: 10, endTime: 15, userMediaId: 'b-roll-uuid' }
  ]
});

// Export with custom settings
await client.exportProject(projectId, {
  fps: 30,
  width: 1080,
  height: 1920
});
```

## 📊 Rate Limits

| Tier | Limit | Endpoints |
|------|-------|-----------|
| Lightweight | 1000/hour | Languages, Templates |
| Standard | 500/hour | Project creation, Uploads |
| Enhanced | Custom | Exports (API projects) |
| Retrieval | 100/hour | Get/Update project |

## 💰 Pricing Notes

- **Regular Projects**: Uses API credits, pay-per-use
- **Magic Clips**: Uses Magic Clips credits (requires subscription)
- **Cost-effective**: Better pricing than Klap for similar quality

## 🔗 Resources

- **API Base URL**: `https://api.submagic.co`
- **Dashboard**: https://app.submagic.co
- **Support**: support@submagic.co
- **Discord**: https://discord.gg/submagic

## 🛠️ Example Service Implementation

Create `src/lib/services/submagic-service.ts`:

```typescript
import type {
  CreateProjectRequest,
  Project,
  SubmagicClientConfig
} from '@/types/submagic';

export class SubmagicService {
  private baseUrl = 'https://api.submagic.co';
  private apiKey: string;

  constructor(config: SubmagicClientConfig) {
    this.apiKey = config.apiKey;
    if (config.baseUrl) this.baseUrl = config.baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new SubmagicError(error);
    }

    return response.json();
  }

  async createProject(request: CreateProjectRequest): Promise<Project> {
    return this.request<Project>('/v1/projects', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getProject(projectId: string): Promise<Project> {
    return this.request<Project>(`/v1/projects/${projectId}`);
  }

  // ... other methods
}
```

## 🚨 Error Handling

Always handle these error codes:

- `401` - Unauthorized (invalid API key)
- `403` - Forbidden (no subscription)
- `413` - Payload too large (> 2GB)
- `415` - Unsupported media type
- `429` - Rate limit exceeded

```typescript
try {
  const project = await client.createProject(request);
} catch (error) {
  if (error.error === 'RATE_LIMIT_EXCEEDED') {
    // Wait and retry
    await sleep(error.retryAfter * 1000);
  } else if (error.error === 'FORBIDDEN') {
    // Handle subscription error
  }
}
```

## 📝 Next Steps

1. Read [SUBMAGIC_API.md](./SUBMAGIC_API.md) for complete API details
2. Review [SUBMAGIC_MIGRATION_NOTES.md](./SUBMAGIC_MIGRATION_NOTES.md) for migration strategy
3. Copy [submagic-types.ts](./submagic-types.ts) for TypeScript support
4. Implement service wrapper
5. Test with sample videos
6. Deploy!

---

**Last Updated**: October 30, 2025  
**Status**: Ready for Implementation  
**Migration**: From Klap to Submagic





