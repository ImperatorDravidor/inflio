# Submagic Migration Notes

> Migration from Klap to Submagic for clip generation

## Why the Switch?

- **Higher Quality**: Better AI-powered captions and clip generation
- **Better Pricing**: More cost-effective than Klap
- **More Features**: Magic Clips, custom themes, advanced editing

## Key Differences from Klap

### Capabilities

| Feature | Klap | Submagic |
|---------|------|----------|
| AI Captions | ✅ | ✅ Enhanced |
| Video Templates | Limited | 30+ templates |
| Languages | Limited | 100+ |
| YouTube Clips | ❌ | ✅ Magic Clips |
| File Upload | ✅ | ✅ |
| Custom Themes | ❌ | ✅ |
| Magic Zooms | ❌ | ✅ |
| Auto B-rolls | ❌ | ✅ |
| Silence Removal | ❌ | ✅ (3 paces) |
| Bad Takes Removal | ❌ | ✅ AI-powered |
| Word-level Transcription | ❌ | ✅ |

### API Endpoints

#### Submagic Endpoints
1. `GET /health` - Health check
2. `GET /v1/languages` - List 100+ languages
3. `GET /v1/templates` - List 30+ templates
4. `POST /v1/projects` - Create from URL
5. `POST /v1/projects/upload` - Upload file
6. `POST /v1/projects/magic-clips` - YouTube clips
7. `GET /v1/projects/:id` - Get project
8. `PUT /v1/projects/:id` - Update project
9. `POST /v1/projects/:id/export` - Export video

#### Key Workflows

**Simple Caption Generation**:
```typescript
// 1. Create project
const project = await createProject({
  title: 'My Video',
  language: 'en',
  videoUrl: 'https://example.com/video.mp4',
  templateName: 'Hormozi 2',
  webhookUrl: 'https://yoursite.com/webhook'
});

// 2. Wait for webhook
// { projectId, status: 'completed', downloadUrl, directUrl }
```

**Magic Clips (NEW)**:
```typescript
// Generate multiple clips from YouTube
const magicClips = await createMagicClips({
  title: 'YT Clips',
  language: 'en',
  youtubeUrl: 'https://youtube.com/watch?v=ID',
  minClipLength: 15,
  maxClipLength: 60,
  webhookUrl: 'https://yoursite.com/webhook'
});

// Webhook receives array of clips with individual download URLs
```

**Advanced Editing**:
```typescript
// 1. Create project
const project = await createProject({ ... });

// 2. Wait for transcription

// 3. Update with AI features
await updateProject(project.id, {
  removeSilencePace: 'fast',
  removeBadTakes: true,
  items: [
    { startTime: 10, endTime: 15, userMediaId: 'b-roll-uuid' }
  ]
});

// 4. Export with custom settings
await exportProject(project.id, {
  fps: 30,
  width: 1080,
  height: 1920
});
```

## Rate Limits

| Tier | Limit | Endpoints |
|------|-------|-----------|
| **Lightweight** | 1000/hour | Languages, Templates |
| **Standard** | 500/hour | Project creation, uploads |
| **Enhanced** | Custom | Exports (API projects) |
| **Retrieval** | 100/hour | Get/Update project |

## File Limits

- **Max file size**: 2GB
- **Max duration**: 2 hours
- **Formats**: MP4, MOV

## Cost Considerations

### Magic Clips
- Uses regular Magic Clips credits (not API credits)
- Requires Magic Clips subscription
- More cost-effective for batch processing

### Regular Projects
- Uses API credits
- Pay-per-use model
- Better pricing than Klap

## Authentication

```bash
# Environment variable
SUBMAGIC_API_KEY=sk-your-api-key-here

# Header
x-api-key: sk-your-api-key-here
```

## Webhooks

### Project Completion
```json
{
  "projectId": "uuid",
  "status": "completed",
  "downloadUrl": "https://app.submagic.co/api/file/download?path=...",
  "directUrl": "https://cdn.cloudfront.net/...",
  "timestamp": "2024-01-15T10:45:00.000Z"
}
```

### Magic Clips Completion
```json
{
  "projectId": "uuid",
  "status": "completed",
  "title": "Project Title",
  "duration": 283,
  "completedAt": "2024-01-15T10:45:00.000Z",
  "magicClips": [
    {
      "id": "clip-uuid",
      "title": "AI Generated Title",
      "duration": 21.04,
      "status": "completed",
      "previewUrl": "https://app.submagic.co/view/...",
      "downloadUrl": "https://app.submagic.co/api/file/download?path=...",
      "directUrl": "https://cdn.cloudfront.net/..."
    }
  ]
}
```

## Migration Checklist

- [ ] Get Submagic API key from https://app.submagic.co
- [ ] Add `SUBMAGIC_API_KEY` to environment variables
- [ ] Create Submagic service wrapper (`src/lib/services/submagic-service.ts`)
- [ ] Replace Klap calls with Submagic calls
- [ ] Update webhook handlers for new payload format
- [ ] Test with sample videos
- [ ] Update database schema if needed for new features
- [ ] Remove Klap integration code
- [ ] Remove `KLAP_API_KEY` from environment variables
- [ ] Update documentation

## Integration Code Structure

```
src/lib/services/
  ├── submagic-service.ts          # Main service wrapper
  ├── submagic-types.ts            # TypeScript types
  └── submagic-webhook-handler.ts  # Webhook processing
```

## Error Handling

Common errors to handle:

1. **401 Unauthorized** - Invalid API key
2. **403 Forbidden** - No Magic Clips subscription
3. **413 Payload Too Large** - File > 2GB
4. **415 Unsupported Media** - Wrong format
5. **429 Rate Limited** - Too many requests

## Best Practices

1. **Use Webhooks**: Don't poll for status
2. **Cache Static Data**: Languages and templates change infrequently
3. **Monitor Rate Limits**: Check response headers
4. **Exponential Backoff**: For retries on server errors
5. **Server-Side Only**: Never expose API key client-side

## Next Steps

1. Review full documentation: `docs/api/SUBMAGIC_API.md`
2. Implement service wrapper
3. Test with sample video
4. Migrate existing Klap integration
5. Deploy and monitor

---

**Migration Date**: October 30, 2025
**Status**: Documentation Complete - Ready for Implementation





