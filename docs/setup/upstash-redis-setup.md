# Upstash Redis Setup Guide

This guide will help you set up Upstash Redis for background job processing in Inflio, allowing long-running Klap video processing tasks to run beyond Vercel's 5-minute timeout limit.

## Why Upstash Redis?

- **Background Jobs**: Process video clips that take longer than 5 minutes
- **Queue Management**: Handle multiple processing requests efficiently
- **Reliability**: Automatic retries for failed jobs
- **Scalability**: Process multiple videos simultaneously
- **Cost-Effective**: Pay-per-request pricing model

## Setup Steps

### 1. Create Upstash Account

1. Go to [Upstash Console](https://console.upstash.com)
2. Sign up for a free account
3. Verify your email

### 2. Create Redis Database

1. Click "Create Database" in the Upstash console
2. Choose your configuration:
   - **Name**: `inflio-production` (or your preferred name)
   - **Type**: Regional (for better performance)
   - **Region**: Choose closest to your Vercel deployment
   - **Enable TLS**: Yes (for security)
   - **Eviction**: Enable (recommended for job queues)

3. Click "Create"

### 3. Get Redis Credentials

After creating the database:

1. Go to your database dashboard
2. Find the "REST API" section
3. Copy these values:
   - **UPSTASH_REDIS_REST_URL**: The REST endpoint URL
   - **UPSTASH_REDIS_REST_TOKEN**: The REST API token

### 4. Set Up QStash (Optional but Recommended)

QStash provides reliable HTTP-based message delivery:

1. In Upstash console, go to "QStash" tab
2. Click "Create QStash"
3. Copy the **QSTASH_CURRENT_SIGNING_KEY**

### 5. Configure Environment Variables

Add these to your `.env.local`:

```env
# Upstash Redis
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
QSTASH_CURRENT_SIGNING_KEY=your-qstash-key

# Worker Secret (generate a strong random string)
WORKER_SECRET=your-secret-key-here
```

To generate a worker secret:
```bash
openssl rand -base64 32
```

### 6. Deploy to Vercel

1. Add the environment variables to your Vercel project:
   ```bash
   vercel env add UPSTASH_REDIS_REST_URL
   vercel env add UPSTASH_REDIS_REST_TOKEN
   vercel env add QSTASH_CURRENT_SIGNING_KEY
   vercel env add WORKER_SECRET
   ```

2. Deploy your application:
   ```bash
   vercel --prod
   ```

### 7. Verify Cron Job

After deployment, verify the cron job is running:

1. Go to your Vercel dashboard
2. Navigate to Functions → Cron Jobs
3. You should see `/api/cron/klap` running every minute

## How It Works

1. **Job Creation**: When a user starts clip generation, a job is queued in Redis
2. **Worker Processing**: The cron job triggers every minute to process queued jobs
3. **Status Updates**: Job progress is stored in Redis and polled by the frontend
4. **Completion**: Once clips are ready, they're stored in the project

## Monitoring

### Check Redis Usage
- Go to Upstash console → Your database → Usage tab
- Monitor requests, storage, and bandwidth

### View Job Queue
Use the Upstash console's Data Browser to inspect:
- `klap:jobs:queue` - Pending jobs
- `klap:jobs:processing` - Currently processing
- `klap:job:*` - Individual job details

### Debug Issues
Check Vercel Functions logs:
```bash
vercel logs --filter=cron/klap
vercel logs --filter=worker/klap
```

## Cost Optimization

1. **Adjust Cron Frequency**: Change from every minute to every 2-5 minutes if needed
2. **Set TTL**: Jobs expire after 24 hours to prevent storage buildup
3. **Monitor Usage**: Set up alerts in Upstash for usage thresholds

## Troubleshooting

### Jobs Not Processing
- Check cron job is running in Vercel dashboard
- Verify WORKER_SECRET matches in environment
- Check Vercel function logs for errors

### Redis Connection Issues
- Verify UPSTASH_REDIS_REST_URL is correct
- Check UPSTASH_REDIS_REST_TOKEN has proper permissions
- Ensure TLS is enabled in Upstash

### Performance Issues
- Consider upgrading to Upstash Pro for higher limits
- Implement job priority queues if needed
- Add more worker instances for parallel processing

## Advanced Configuration

### Custom Job Priority
Modify `src/lib/redis.ts` to add priority queues:
```typescript
export const REDIS_KEYS = {
  jobQueueHigh: 'klap:jobs:queue:high',
  jobQueueNormal: 'klap:jobs:queue:normal',
  jobQueueLow: 'klap:jobs:queue:low',
  // ... rest of keys
}
```

### Parallel Workers
Update cron job to process multiple jobs:
```typescript
// Process up to 3 jobs in parallel
const jobs = await Promise.all([
  KlapJobQueue.getNextJob(),
  KlapJobQueue.getNextJob(),
  KlapJobQueue.getNextJob()
].filter(Boolean))
```

### Dead Letter Queue
Add failed job tracking:
```typescript
export const REDIS_KEYS = {
  // ... existing keys
  deadLetterQueue: 'klap:jobs:dlq',
}
```

## Support

If you encounter issues:
1. Check the [Upstash Documentation](https://docs.upstash.com)
2. Review Vercel function logs
3. Open an issue in the repository with error details 