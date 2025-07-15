# Upstash Redis Implementation Summary

## Overview

We've implemented Upstash Redis as a background job queue system to handle long-running Klap video processing tasks that exceed Vercel's 5-minute function timeout limit.

## What Changed

### 1. **New Dependencies**
- `@upstash/redis` - Redis client for job queue management
- `@upstash/qstash` - Optional message queue for reliable delivery

### 2. **Core Components**

#### Redis Configuration (`src/lib/redis.ts`)
- Redis client initialization
- Job queue management system
- Job status tracking (queued, processing, completed, failed)
- Automatic retry logic (up to 3 attempts)
- Stale job cleanup

#### API Endpoints Updated

**`/api/process-klap`** (Updated)
- Now queues jobs instead of processing directly
- Returns immediately (10 second timeout)
- Checks for existing jobs to prevent duplicates

**`/api/worker/klap`** (New)
- Processes jobs from the Redis queue
- Runs for up to 5 minutes per job
- Handles clip downloading and storage
- Updates job progress in real-time

**`/api/cron/klap`** (New)
- Triggered every minute by Vercel cron
- Calls the worker to process pending jobs
- Includes security via WORKER_SECRET

### 3. **Configuration Updates**

#### `vercel.json`
- Reduced `process-klap` timeout to 10 seconds
- Added worker endpoint with 300 second timeout
- Added cron job to run every minute

#### Environment Variables
```env
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
QSTASH_CURRENT_SIGNING_KEY=
WORKER_SECRET=
```

## How It Works

### Job Flow

1. **User initiates clip generation**
   - Frontend calls `/api/process-klap`
   - Job is created in Redis queue
   - Returns immediately with job ID

2. **Background processing**
   - Cron job runs every minute
   - Worker picks up jobs from queue
   - Processes Klap API calls
   - Downloads and stores clips
   - Updates job status in Redis

3. **Frontend polling**
   - Polls `/api/process-klap?projectId=xxx`
   - Checks job status from Redis
   - Updates UI when complete

### Benefits

- **No timeouts**: Jobs can run as long as needed
- **Reliability**: Failed jobs retry automatically
- **Scalability**: Can process multiple videos in parallel
- **Cost-effective**: Only pay for what you use
- **Real-time updates**: Progress tracked in Redis

## Setup Required

1. Create Upstash account
2. Create Redis database
3. Add environment variables
4. Deploy to Vercel

See [Upstash Redis Setup Guide](./setup/upstash-redis-setup.md) for detailed instructions.

## Architecture Diagram

```
User Request → API (Queue Job) → Redis Queue
                                      ↓
                              Cron Job (1 min)
                                      ↓
                              Worker Process
                                      ↓
                              Klap API → Download
                                      ↓
                              Store in Supabase
                                      ↓
                              Update Project
```

## Monitoring

- Check Redis queue in Upstash console
- View cron job execution in Vercel dashboard
- Monitor worker logs: `vercel logs --filter=worker/klap`

## Future Enhancements

1. **Priority Queues**: Process premium users first
2. **Parallel Workers**: Process multiple jobs simultaneously
3. **Dead Letter Queue**: Track permanently failed jobs
4. **Webhooks**: Notify users when processing completes
5. **QStash Integration**: More reliable message delivery 