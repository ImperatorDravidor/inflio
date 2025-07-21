# Klap Processing with Inngest - Implementation Guide

## Quick Start

### 1. Set Up Inngest Account (5 minutes)

1. Go to [inngest.com](https://inngest.com) and sign up for free
2. Create a new app called "inflio"
3. Go to Keys section and copy:
   - Event Key
   - Signing Key

### 2. Add Environment Variables

Add these to your `.env.local`:

```env
# Inngest Configuration
INNGEST_EVENT_KEY=test_xxxxx
INNGEST_SIGNING_KEY=signkey_test_xxxxx
```

### 3. Run Database Migration

Execute this SQL in your Supabase dashboard:

```sql
-- Add Klap status tracking columns
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS klap_status TEXT DEFAULT 'idle',
ADD COLUMN IF NOT EXISTS klap_task_id TEXT,
ADD COLUMN IF NOT EXISTS klap_queued_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS klap_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS klap_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS klap_error TEXT;

CREATE INDEX IF NOT EXISTS idx_projects_klap_status ON projects(klap_status);
```

### 4. Start Development Servers

```bash
# Terminal 1: Start Next.js
npm run dev

# Terminal 2: Start Inngest Dev Server
npx inngest-cli@latest dev
```

### 5. Test the Implementation

1. Upload a video to any project
2. Enable "Generate Clips" 
3. Start processing
4. Watch the Inngest dashboard at http://localhost:8288
5. See your function run in real-time!

## How It Works

### Old Architecture (Complex)
```
User → API → Redis Queue → Cron Job → Worker → Polling → Klap
                ↑                         ↓
                └─── Timeout Issues ──────┘
```

### New Architecture (Simple)
```
User → API → Inngest → Klap API
                ↓
         Automatic retries
         No timeouts
         Real-time monitoring
```

## Benefits

1. **No Timeouts**: Inngest handles long-running tasks
2. **Automatic Retries**: Failed tasks retry automatically
3. **Real-time Monitoring**: See exactly what's happening
4. **Simpler Code**: No Redis, no workers, no cron jobs
5. **Better Reliability**: Guaranteed execution

## Testing Checklist

- [ ] Upload a test video (< 5 minutes for faster testing)
- [ ] Start processing with clips enabled
- [ ] Check Inngest dashboard shows the event
- [ ] Monitor function execution
- [ ] Verify clips appear in project after ~10-15 minutes
- [ ] Check error handling with invalid video

## Production Deployment

1. **Get Production Keys**: 
   - Create production app at inngest.com
   - Get production Event Key and Signing Key

2. **Add to Vercel**:
   ```bash
   vercel env add INNGEST_EVENT_KEY production
   vercel env add INNGEST_SIGNING_KEY production
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

## Monitoring in Production

1. Go to [app.inngest.com](https://app.inngest.com)
2. Select your app
3. View:
   - Function runs
   - Success/failure rates
   - Execution times
   - Error logs

## Troubleshooting

### "Inngest key not found"
- Ensure environment variables are set
- Restart dev server after adding keys

### "Function not registered"
- Check `/api/inngest` route is accessible
- Verify function exports in `src/inngest/functions.ts`

### "Clips not appearing"
- Check Inngest dashboard for errors
- Verify Klap API key is valid
- Check Supabase storage permissions

## Next Steps

1. **Add Email Notifications**: 
   ```typescript
   // In processKlapVideo function
   await step.run('send-notification', async () => {
     await sendEmail(user.email, 'Your clips are ready!')
   })
   ```

2. **Add Webhook Support**:
   - When Klap adds webhooks, update to use those instead of polling

3. **Add Analytics**:
   - Track processing times
   - Monitor success rates
   - Identify bottlenecks

## Summary

This new implementation:
- ✅ Eliminates timeouts
- ✅ Simplifies architecture  
- ✅ Improves reliability
- ✅ Provides better monitoring
- ✅ Reduces operational complexity

The Redis queue system can be completely removed once this is working well. 