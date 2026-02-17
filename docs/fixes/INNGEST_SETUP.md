# Inngest Setup for Klap Video Processing

## Overview

Inflio uses Inngest for background job processing, specifically for Klap video clip generation. This is an **optional feature** - the app will work without it, but video clips won't be generated.

## Development Setup (Recommended)

For local development, use the Inngest Dev Server:

### 1. Install Inngest CLI (one-time)

```bash
npm install -g inngest-cli
# or use npx directly (no installation needed)
```

### 2. Start Inngest Dev Server

In a separate terminal, run:

```bash
npx inngest-cli@latest dev
```

This will:
- Start a local Inngest server at `http://localhost:8288`
- Provide a UI to monitor background jobs
- Automatically detect your Next.js app
- No cloud signup or API keys needed

### 3. Keep Dev Server Running

Keep this terminal running while developing. Your app will automatically connect to it.

### 4. Monitor Jobs

Visit `http://localhost:8288` to see:
- Active background jobs
- Job history and logs
- Execution details
- Failure debugging

## Production Setup

For production/staging environments:

### 1. Sign Up for Inngest

1. Go to [https://www.inngest.com/](https://www.inngest.com/)
2. Create a free account
3. Create a new app

### 2. Get API Keys

From your Inngest dashboard:
- Copy your **Event Key** (for sending events)
- Copy your **Signing Key** (for webhook verification)

### 3. Configure Environment Variables

Add to your `.env.local` or production environment:

```bash
INNGEST_EVENT_KEY=your_event_key_here
INNGEST_SIGNING_KEY=your_signing_key_here
```

### 4. Deploy

Inngest will automatically detect and sync your functions when you deploy.

## Verification

### Check if Inngest is Configured

The app logs will show:

**Not Configured:**
```
[Process Route] Inngest not configured - skipping Klap processing
[Process Route] To enable Klap processing:
[Process Route] 1. Run: npx inngest-cli@latest dev
[Process Route] 2. Or set INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY in .env.local
```

**Configured:**
```
[Process Route] Queueing Klap job with Inngest...
[Process Route] Klap job queued successfully
```

## Troubleshooting

### Issue: "Inngest API Error: 401 Event key not found"

**Cause:** Environment variables not set or dev server not running

**Solution:**
1. For development: Start dev server with `npx inngest-cli@latest dev`
2. For production: Verify `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` are set
3. Restart your Next.js dev server after adding environment variables

### Issue: Jobs Not Appearing in UI

**Cause:** Dev server not detecting your app

**Solution:**
1. Ensure dev server is running before starting Next.js
2. Check that `/api/inngest` endpoint is accessible
3. Restart both Inngest dev server and Next.js

### Issue: Functions Not Registering

**Cause:** Build or TypeScript errors

**Solution:**
1. Check terminal for errors
2. Ensure `src/inngest/functions.ts` compiles without errors
3. Restart dev server

## Workflow Without Inngest

If you choose not to configure Inngest:

1. ✅ Video upload works
2. ✅ AI transcription works
3. ✅ AI post generation works
4. ❌ Klap video clips won't be generated
5. ⚠️ Clips task will remain in "pending" state

This is perfectly fine for development or if you don't need the clips feature.

## Architecture

```
User uploads video
    ↓
Transcription starts immediately (no Inngest)
    ↓
If INNGEST_ENABLED:
    Klap job queued via Inngest → Background processing
Else:
    Clips task marked as skipped
    ↓
User redirected to posts when transcription completes
```

## Related Files

- `src/inngest/client.ts` - Inngest client configuration
- `src/inngest/functions.ts` - Background job definitions
- `src/app/api/inngest/route.ts` - Inngest webhook endpoint
- `src/app/api/projects/[id]/process/route.ts` - Processing orchestration
