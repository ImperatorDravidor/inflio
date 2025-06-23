# Cloud Video Processing Services Setup

## Overview

For production SaaS deployment, Inflio uses cloud-based video processing services instead of local FFmpeg. This ensures scalability, reliability, and eliminates server dependencies.

## Supported Services

### 1. Cloudinary (Recommended)

Cloudinary provides comprehensive video transformation capabilities including subtitle burning.

**Setup:**
```env
# .env.local
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

**Features:**
- Automatic video optimization
- Real-time transformations
- CDN delivery
- Subtitle overlay support

**Pricing:** Free tier includes 25 credits/month

### 2. Mux

Mux offers professional video infrastructure with subtitle track support.

**Setup:**
```env
# .env.local
MUX_TOKEN_ID=your_token_id
MUX_TOKEN_SECRET=your_token_secret
```

**Features:**
- Adaptive streaming
- Multiple subtitle tracks
- Analytics included
- Live streaming capable

**Pricing:** $0.05/minute streamed

### 3. Shotstack

Shotstack specializes in video editing automation via API.

**Setup:**
```env
# .env.local
SHOTSTACK_API_KEY=your_api_key
```

**Features:**
- Programmatic video editing
- Subtitle burning
- Multiple output formats
- Template system

**Pricing:** $0.10/minute rendered

## Fallback: Client-Side Subtitles

When no cloud service is configured, the system automatically falls back to HTML5 native subtitle rendering:

- Creates WebVTT subtitle files
- Uses `<track>` element for subtitles
- Applies custom styling via CSS
- No video re-encoding required

**Limitations:**
- Subtitles can be toggled off by users
- Styling options are limited
- Not suitable for social media exports

## Configuration Priority

The system checks for services in this order:
1. Cloudinary
2. Mux
3. Shotstack
4. Client-side fallback

## Quick Start

### Step 1: Choose a Service

For most use cases, **Cloudinary** is recommended:
- Easy setup
- Generous free tier
- Best subtitle support

### Step 2: Get API Credentials

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Get your API credentials from the dashboard
3. Add to `.env.local`:
   ```env
   CLOUDINARY_URL=cloudinary://123456789:abcdefghijk@your-cloud-name
   ```

### Step 3: Test Configuration

The system will automatically detect and use the configured service. Check the console for:
```
Using video processing provider: cloudinary
```

## Production Considerations

### Rate Limits
- Cloudinary: 500 transformations/hour (free tier)
- Mux: No hard limits, pay per use
- Shotstack: 100 renders/month (free tier)

### Processing Times
- 1-minute video: 30-60 seconds
- 5-minute video: 2-3 minutes
- 10-minute video: 4-6 minutes

### Cost Optimization
1. **Cache processed videos** - Store subtitle variants
2. **Lazy processing** - Only process when requested
3. **Use webhooks** - Avoid polling for status

### Scaling Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Next.js   │────▶│ Cloud Video  │────▶│     CDN     │
│     App     │     │   Service    │     │ (Delivery)  │
└─────────────┘     └──────────────┘     └─────────────┘
        │                    │                    │
        ▼                    ▼                    ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Supabase   │     │   Webhooks   │     │    Users    │
│  (Storage)  │     │  (Updates)   │     │  (Viewing)  │
└─────────────┘     └──────────────┘     └─────────────┘
```

## Monitoring

### Key Metrics
- Processing success rate
- Average processing time
- API usage vs limits
- Cost per video processed

### Error Handling
```javascript
// Automatic retry with exponential backoff
// Fallback to client-side rendering
// User notification of processing status
```

## Security

1. **Never expose API keys in frontend**
2. **Use environment variables**
3. **Implement rate limiting**
4. **Validate video sources**

## Migration from FFmpeg

If migrating from local FFmpeg:

1. **No code changes required** - System auto-detects available services
2. **Update environment variables** - Add cloud service credentials
3. **Test processing** - Verify subtitle rendering
4. **Monitor costs** - Track API usage

## Troubleshooting

### "No video service configured"
- Check environment variables
- Verify API credentials
- Ensure service is activated

### "Processing failed"
- Check service status page
- Verify video format compatibility
- Review API rate limits

### "Subtitles not appearing"
- Confirm WebVTT format for client-side
- Check browser console for errors
- Verify CORS settings for subtitle files

## Conclusion

Cloud video processing services provide a scalable, production-ready solution for subtitle application. With automatic fallback to client-side rendering, the system ensures subtitles work in all scenarios while optimizing for the best user experience. 