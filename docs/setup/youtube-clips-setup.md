# YouTube + Magic Clips Setup Guide

## Overview

The app now uses a two-step process for clip generation:
1. **Upload video to YouTube** (as unlisted)
2. **Send YouTube URL to Submagic Magic Clips**
3. **Receive clips via webhook**

## Prerequisites

You need credentials for:
1. **YouTube Data API v3** (for uploading videos)
2. **Submagic API** (for generating clips)

## Step 1: Set Up YouTube API

### 1.1 Create Google Cloud Project

1. Go to https://console.cloud.google.com/
2. Create a new project or select existing one
3. Name it something like "Inflio YouTube Integration"

### 1.2 Enable YouTube Data API v3

1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "YouTube Data API v3"
3. Click **Enable**

### 1.3 Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: "Inflio App"
5. **Authorized redirect URIs**: Add:
   - `http://localhost:3000/api/auth/youtube/callback`
   - `https://your-production-domain.com/api/auth/youtube/callback`
6. Click **Create**
7. **Save the Client ID and Client Secret**

### 1.4 Get Refresh Token

You need to authorize your app once to get a refresh token:

**Option A: Use OAuth Playground** (Easiest)

1. Go to https://developers.google.com/oauthplayground/
2. Click the gear icon (⚙️) in top right
3. Check "Use your own OAuth credentials"
4. Enter your Client ID and Client Secret
5. In "Step 1", find "YouTube Data API v3"
6. Select `https://www.googleapis.com/auth/youtube.upload`
7. Click "Authorize APIs"
8. Sign in with your Google account
9. In "Step 2", click "Exchange authorization code for tokens"
10. **Copy the Refresh Token** - save it securely!

**Option B: Implement OAuth flow in your app** (More complex)

Create an endpoint that handles the OAuth flow and saves the refresh token to your environment.

### 1.5 Set Environment Variables

Add to your `.env.local`:

```env
# YouTube API Configuration
YOUTUBE_CLIENT_ID=your-client-id.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=your-client-secret
YOUTUBE_REFRESH_TOKEN=your-refresh-token
YOUTUBE_API_KEY=your-api-key (optional, for read-only operations)
```

## Step 2: Set Up Submagic Magic Clips

### 2.1 Get Submagic API Key

1. Go to https://www.submagic.co/
2. Sign up or log in
3. Navigate to **Settings** → **API**
4. Click **Generate API Key**
5. Copy the key (starts with `sk-`)

### 2.2 Subscribe to Magic Clips

1. In Submagic dashboard, go to **Billing** or **Subscriptions**
2. Subscribe to **Magic Clips** plan
3. Purchase credits if needed
4. Verify you have Magic Clips credits available

### 2.3 Set Environment Variables

Add to your `.env.local`:

```env
# Submagic API Configuration
SUBMAGIC_API_KEY=sk-your-api-key-here
SUBMAGIC_API_URL=https://api.submagic.co/v1

# Your app URL for webhook callbacks
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For production:
```env
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

## Step 3: Run Database Migration

Run this in your Supabase SQL Editor:

```sql
-- Add YouTube and Submagic tracking fields
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS submagic_project_id TEXT,
ADD COLUMN IF NOT EXISTS youtube_video_id TEXT,
ADD COLUMN IF NOT EXISTS youtube_video_url TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_submagic_id 
ON projects(submagic_project_id);

CREATE INDEX IF NOT EXISTS idx_projects_youtube_id 
ON projects(youtube_video_id);
```

## Step 4: Test the Integration

### 4.1 Start Servers

```bash
# Terminal 1: Next.js
npm run dev

# Terminal 2: Inngest
npx inngest-cli@latest dev
```

### 4.2 Upload a Test Video

1. Go to http://localhost:3000/studio/upload
2. Upload a short video (1-3 minutes)
3. Click "Process"

### 4.3 Watch the Flow

**In Next.js Terminal:**
```
[Inngest] Uploading video to YouTube
[Inngest] Video uploaded to YouTube: https://youtube.com/watch?v=...
[Inngest] Creating Submagic Magic Clips project
[Inngest] Magic Clips project created: <projectId>
[Inngest] Webhook will be called at: http://localhost:3000/api/webhooks/submagic
```

**In Inngest Terminal:**
```
⚡ Function run started: process-submagic-video
[Inngest] Step 1: Upload to YouTube
[Inngest] Step 2: Create Magic Clips project
✅ Function run completed
```

**Wait 5-10 minutes**, then:

**Webhook will be called:**
```
[Submagic Webhook] Received webhook
[Submagic Webhook] Processing 8 clips
[Submagic Webhook] Successfully processed 8 clips
```

### 4.4 Verify Clips

1. Refresh your project page
2. You should see clips in the "Clips" section
3. Each clip has a virality score
4. Click to preview

## How It Works

### The Complete Flow

```
1. User uploads video
   ↓
   Stored in Supabase
   
2. User clicks "Process"
   ↓
   Inngest job triggered
   
3. Step 1: Upload to YouTube
   ↓
   Video uploaded as "unlisted"
   ↓
   Get YouTube URL
   
4. Step 2: Create Magic Clips Project
   ↓
   POST /v1/projects/magic-clips
   {
     "youtubeUrl": "https://youtube.com/watch?v=xxx",
     "webhookUrl": "https://your-app.com/api/webhooks/submagic"
   }
   ↓
   Submagic starts processing (5-10 minutes)
   
5. Background: Submagic Processing
   ↓
   - Analyzes video for viral moments
   - Generates 5-15 short clips
   - Adds captions, effects
   - Scores each clip for virality
   
6. Webhook Called
   ↓
   POST /api/webhooks/submagic
   {
     "projectId": "...",
     "status": "completed",
     "magicClips": [...]
   }
   
7. Process Clips
   ↓
   - Download clips (or use Submagic URLs)
   - Store in Supabase (optional)
   - Update project in database
   - Mark task as completed
   
8. User sees clips!
   ↓
   - Clips appear in project page
   - Can preview, download, publish
```

### Why YouTube?

Submagic's Magic Clips API **requires YouTube URLs**. It's designed to:
- Pull videos from YouTube
- Analyze for viral potential
- Generate optimized clips

This is different from regular Submagic projects which accept direct URLs but only add captions.

## Environment Variables Reference

### Required

```env
# YouTube OAuth (REQUIRED for uploading)
YOUTUBE_CLIENT_ID=xxxxx.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=xxxxx
YOUTUBE_REFRESH_TOKEN=xxxxx

# Submagic API (REQUIRED)
SUBMAGIC_API_KEY=sk-xxxxx

# App URL for webhooks (REQUIRED)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Optional

```env
# Submagic API URL (has default)
SUBMAGIC_API_URL=https://api.submagic.co/v1

# Skip video reupload to Supabase (use Submagic URLs directly)
SKIP_VIDEO_REUPLOAD=false

# YouTube API Key (optional, for read-only operations)
YOUTUBE_API_KEY=xxxxx
```

## Troubleshooting

### "YouTube API is not configured"

**Missing YouTube credentials**

**Solution:**
1. Complete Step 1 above
2. Set all YouTube environment variables
3. Restart dev server

### "Failed to upload to YouTube"

**Possible causes:**
1. Invalid OAuth credentials
2. Refresh token expired
3. YouTube quota exceeded
4. Video file too large

**Debug:**
1. Check YouTube OAuth credentials
2. Regenerate refresh token
3. Check Google Cloud Console for quota
4. Ensure video is < 2GB

### "Insufficient API credits" (402)

**Not enough Submagic credits**

**Solution:**
1. Go to Submagic dashboard
2. Purchase Magic Clips credits
3. Verify credits are available

### "Webhook not called"

**Submagic can't reach your webhook**

**For local development:**
1. Use ngrok: `ngrok http 3000`
2. Set webhook URL to ngrok URL
3. Or use Inngest's built-in webhook forwarding

**For production:**
1. Ensure webhook URL is publicly accessible
2. Use HTTPS (required)
3. Check firewall/security settings

### Clips stay at "Processing" forever

**Webhook might have failed**

**Check:**
1. Inngest logs for completion
2. Submagic dashboard for project status
3. Webhook endpoint logs
4. Network logs

**Manual fix:**
```bash
# Check Submagic project status manually
curl -H "x-api-key: sk-your-key" \
  https://api.submagic.co/v1/projects/<projectId>
```

## Cost Estimates

### YouTube API
- **Upload quota**: 1600 points per upload
- **Daily quota**: 10,000 points (free tier)
- **Uploads per day**: ~6 videos
- **Cost to increase**: $0 (just request quota increase)

### Submagic Magic Clips
- **Per video**: 1 Magic Clip credit
- **Free tier**: Usually includes some credits
- **Paid plans**: Check Submagic pricing page

## Security Considerations

### YouTube Videos
- Uploaded as **unlisted** (not public, not searchable)
- Only people with the link can watch
- Can be deleted after clip processing
- Consider implementing auto-deletion after 7 days

### API Keys
- Store securely in environment variables
- Never commit to git
- Rotate periodically
- Use different keys for dev/production

### Webhook Security
- Consider adding signature verification
- Validate project IDs before processing
- Rate limit webhook endpoint
- Log all webhook calls for debugging

## Performance

### Expected Timings

| Step | Duration |
|------|----------|
| Upload to YouTube | 30s - 2min |
| YouTube processing | 1-2min |
| Submagic Magic Clips | 5-10min |
| Webhook delivery | < 1min |
| Store clips in Supabase | 1-2min |
| **Total** | **8-15 minutes** |

### Optimization Tips

1. **Skip Supabase reupload**: Set `SKIP_VIDEO_REUPLOAD=true` to use Submagic URLs directly (faster)
2. **Adjust clip settings**: Lower `maxClipLength` for faster processing
3. **Use webhooks**: Don't poll - let webhook notify when ready
4. **Parallel processing**: Transcription can run while YouTube uploads

## Production Deployment

### Vercel/Netlify Environment Variables

Set these in your hosting provider dashboard:

```env
# YouTube (Production)
YOUTUBE_CLIENT_ID=xxxxx
YOUTUBE_CLIENT_SECRET=xxxxx
YOUTUBE_REFRESH_TOKEN=xxxxx

# Submagic (Production)
SUBMAGIC_API_KEY=sk-xxxxx

# App URL (Production)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Webhook URL

Make sure your webhook is publicly accessible:
```
https://your-domain.com/api/webhooks/submagic
```

Test it:
```bash
curl -X POST https://your-domain.com/api/webhooks/submagic \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### Inngest Production

1. Sign up at https://www.inngest.com/
2. Create production app
3. Get production keys
4. Add to environment:
```env
INNGEST_EVENT_KEY=xxxxx
INNGEST_SIGNING_KEY=xxxxx
```

## Next Steps

1. ✅ Complete setup (Steps 1-3 above)
2. ✅ Test with one video
3. ✅ Verify clips are generated
4. ✅ Deploy to staging
5. ✅ Deploy to production

## Support

- **YouTube API**: https://developers.google.com/youtube/v3
- **Submagic API**: https://docs.submagic.co
- **Inngest**: https://www.inngest.com/docs
- **This codebase**: Check `src/lib/youtube-upload-service.ts` and `src/lib/submagic-api.ts`

---

**Once setup is complete, clips will work automatically!** 🎉


