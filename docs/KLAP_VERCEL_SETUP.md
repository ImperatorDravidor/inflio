# Klap Processing Setup for Vercel Production

## Overview

Klap processing uses a Redis job queue system to handle long-running video processing tasks that exceed Vercel's timeout limits. This guide explains how to set it up properly.

## Required Environment Variables

Add these to your Vercel Dashboard → Settings → Environment Variables:

### 1. Redis Configuration (Required for Job Queue)

```bash
# Upstash Redis credentials
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxxx
```

**How to get these:**
1. Sign up at [upstash.com](https://upstash.com)
2. Create a new Redis database
3. Choose a region close to your Vercel deployment
4. Copy the REST URL and REST Token from the dashboard

### 2. Worker Security (Required)

```bash
# Generate a secure random string
WORKER_SECRET=your-secure-random-string-here
```

**How to generate:**
```bash
# Option 1: Using OpenSSL
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Use any password generator (32+ characters)
```

### 3. Klap API Configuration (Required)

```bash
# Your Klap API key
KLAP_API_KEY=klap_xxxxx
```

**Already set?** You mentioned you already have this, so just verify it's correct.

### 4. Vercel URL Configuration (Automatic)

These are set automatically by Vercel, but verify they exist:
- `VERCEL_URL` - Set automatically by Vercel
- `VERCEL_ENV` - Set automatically by Vercel

## Quick Setup Steps

### Step 1: Set Up Redis

1. Go to [console.upstash.com](https://console.upstash.com)
2. Click "Create Database"
3. Settings:
   - Name: `inflio-klap-queue` (or any name)
   - Type: Regional
   - Region: Choose closest to your Vercel deployment
   - Enable Eviction: Yes
   - Max Request Size: 1MB (default is fine)
4. Click "Create"
5. Copy the REST URL and REST Token

### Step 2: Add to Vercel

1. Go to your Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable:
   - Name: `UPSTASH_REDIS_REST_URL`
   - Value: Your Redis REST URL
   - Environment: Production ✓, Preview ✓, Development ✗
5. Repeat for:
   - `UPSTASH_REDIS_REST_TOKEN`
   - `WORKER_SECRET`

### Step 3: Redeploy

After adding all variables:
1. Go to Deployments tab
2. Click the three dots on your latest deployment
3. Select "Redeploy"
4. Wait for deployment to complete

## Testing Your Setup

### 1. Check Configuration

Visit: `https://your-app.vercel.app/api/debug-production`

You should see:
```json
{
  "status": "Debug information",
  "missingCritical": "None",
  "redisStatus": "Connected successfully",
  "environment": {
    "KLAP_API_KEY": true,
    "UPSTASH_REDIS_REST_URL": true,
    "UPSTASH_REDIS_REST_TOKEN": true,
    "WORKER_SECRET": true
  }
}
```

### 2. Test Video Processing

1. Upload a short video (< 2 minutes)
2. Enable "Generate Clips"
3. Check the project page - should show "Processing clips..."
4. Wait 2-5 minutes for clips to appear

## How It Works

1. **User uploads video** → Creates project
2. **Process endpoint** → Creates job in Redis queue
3. **Worker processes** → Pulls job from queue, processes with Klap
4. **Polling updates** → Client checks status every 15 seconds
5. **Completion** → Clips saved to database

## Troubleshooting

### "Service temporarily unavailable"
- Check `KLAP_API_KEY` is set correctly
- Verify API key is valid at klap.app

### "No Redis connection"
- Check `UPSTASH_REDIS_REST_URL` and token
- Verify Redis database is active in Upstash dashboard

### Worker not processing
- Check `WORKER_SECRET` is set
- Look at Vercel function logs for `/api/worker/klap`
- Verify cron job is running every 5 minutes

### Clips stuck at 10%
- Check worker logs in Vercel dashboard
- Verify all environment variables are set
- Check Redis queue isn't full (Upstash dashboard)

## Monitoring

### Vercel Functions
Monitor these endpoints in Vercel dashboard:
- `/api/process-klap` - Should complete in < 60s
- `/api/worker/klap` - Should complete in < 300s
- `/api/cron/klap` - Should run every 5 minutes

### Redis Queue
Check queue status in Upstash dashboard:
- Look for keys starting with `klap:`
- Monitor queue length
- Check for stuck jobs

## Cost Considerations

- **Upstash Redis**: Free tier includes 10,000 commands/day
- **Vercel Functions**: Free tier includes 100GB-hrs/month
- **Klap API**: Based on your plan (check klap.app)

For most users, the free tiers are sufficient.

## Support

If issues persist after following this guide:
1. Check `/api/debug-production` for missing variables
2. Review Vercel function logs
3. Verify Redis is accessible from Upstash dashboard
4. Check Klap API status at klap.app 