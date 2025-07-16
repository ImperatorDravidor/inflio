# Klap Processing Troubleshooting Guide

## Issue: Clips Stay Pending and Never Process

If your clips are showing as "pending" and never start processing, follow this troubleshooting guide.

## Quick Diagnosis

Run the diagnostic script with your project ID:
```bash
node scripts/diagnose-klap-processing.js YOUR_PROJECT_ID
```

This will check all components of the Klap processing system.

## Common Issues and Solutions

### 1. Missing Environment Variables

**Issue**: Redis credentials or worker secret not configured

**Check**: Look for these in your `.env.local`:
```env
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
WORKER_SECRET=any_secure_random_string
KLAP_API_KEY=your_klap_api_key
```

**Solution**: 
1. Set up Upstash Redis (see setup guide below)
2. Add `WORKER_SECRET` with any secure random string (e.g., generate with `openssl rand -base64 32`)
3. Ensure your Klap API key is valid

### 2. Cron Job Not Running

**Issue**: The cron job isn't triggering the worker

**Check**: In development, manually trigger the cron:
```bash
node scripts/trigger-klap-cron.js
```

**Solution for Production**: 
- The cron is configured in `vercel.json` to run every minute
- Check Vercel Functions logs for cron execution
- Ensure the cron job has proper permissions

### 3. Worker Authentication Failure

**Issue**: Worker endpoint returns 401 Unauthorized

**Check**: The diagnostic script will test the worker endpoint

**Solution**: 
- Ensure `WORKER_SECRET` is set in both `.env.local` and Vercel environment variables
- The value must match exactly

### 4. Redis Connection Issues

**Issue**: Cannot connect to Redis or jobs aren't being stored

**Check**: The diagnostic will show if jobs are in Redis

**Solution**:
1. Verify Upstash credentials are correct
2. Check Upstash dashboard for connection activity
3. Ensure Redis isn't at quota limits

### 5. Klap API Issues

**Issue**: Klap API is down or returning errors

**Check**: Look for error messages in worker logs

**Solution**:
- Verify Klap API key is valid
- Check Klap service status
- The system will retry failed jobs up to 3 times

## Setting Up Upstash Redis

1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a new Redis database
3. Copy the REST URL and token
4. Add to your `.env.local`:
   ```env
   UPSTASH_REDIS_REST_URL=https://YOUR_INSTANCE.upstash.io
   UPSTASH_REDIS_REST_TOKEN=YOUR_TOKEN
   ```

## Manual Testing Flow

1. **Queue a job manually**:
   ```bash
   # This happens automatically when you select clips during upload
   # But you can test with: POST /api/process-klap with {projectId: "YOUR_ID"}
   ```

2. **Trigger the worker**:
   ```bash
   node scripts/trigger-klap-cron.js
   ```

3. **Check job status**:
   ```bash
   node scripts/diagnose-klap-processing.js YOUR_PROJECT_ID
   ```

## How the System Works

1. **Upload & Select Clips** → Job queued in Redis
2. **Cron (every minute)** → Triggers worker
3. **Worker** → Processes one job from queue
4. **Klap API** → Generates clips (can take 2-5 minutes)
5. **Worker** → Downloads clips and stores in Supabase
6. **Project Update** → Clips appear in project

## Logs to Check

1. **Browser Console**: Check for API errors
2. **Terminal (dev mode)**: Look for `[Process Route]`, `[Worker]`, and `[Cron]` logs
3. **Vercel Functions** (production): Check function logs for errors

## Emergency Fixes

If clips are stuck:

1. **Clear the job and retry**:
   - Delete the project and re-upload
   - Or manually clear Redis job (advanced)

2. **Force process without queue** (not recommended):
   - Use the old `/api/process-klap-force` endpoint
   - This bypasses the queue but may timeout

## Still Having Issues?

1. Run the diagnostic script and share the output
2. Check browser console for errors
3. Check server logs for `[Worker]` and `[Cron]` messages
4. Verify all environment variables are set correctly 