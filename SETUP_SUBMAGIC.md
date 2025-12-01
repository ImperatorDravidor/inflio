# Quick Setup Guide for Submagic Integration

This guide will help you set up the Submagic integration for clip generation.

## Prerequisites

- Node.js 18+ installed
- Supabase account and project set up
- Clerk account configured
- Submagic account (https://www.submagic.co/)

## Step 1: Get Your Submagic API Key

1. Go to [Submagic](https://www.submagic.co/) and sign up/sign in
2. Navigate to **Settings** → **API** (or **Developer**)
3. Click **Generate API Key**
4. Copy the API key (it will look like `sk-xxxxxxxxxxxxx`)

## Step 2: Configure Environment Variables

Add this to your `.env.local` file:

```env
# Submagic Configuration
SUBMAGIC_API_KEY=sk-your_actual_api_key_here
SUBMAGIC_API_URL=https://api.submagic.co/v1

# Optional: Skip video reupload to Supabase (uses Submagic URLs directly)
SKIP_VIDEO_REUPLOAD=false
```

## Step 3: Run Database Migration

Run this SQL in your Supabase SQL editor:

```sql
-- Add submagic_project_id column to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS submagic_project_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_projects_submagic_id 
ON projects(submagic_project_id);
```

Or use the migration file:

```bash
# Copy the SQL from migrations/add-submagic-project-id.sql
# and run it in your Supabase SQL editor
```

## Step 4: Install Dependencies

Make sure all dependencies are installed:

```bash
npm install
```

## Step 5: Start Development Server

```bash
npm run dev
```

Your app should now be running at http://localhost:3000

## Step 6: Start Inngest Dev Server (for local testing)

In a **separate terminal**, run:

```bash
npx inngest-cli@latest dev
```

This will:
- Start the Inngest dev server at http://localhost:8288
- Allow you to see and replay background jobs
- Show logs for video processing

## Step 7: Test the Integration

### 7.1 Upload a Test Video

1. Navigate to http://localhost:3000/studio/upload
2. Upload a short video (1-3 minutes recommended for testing)
3. Give it a title
4. Click "Upload"

### 7.2 Process the Video

1. After upload, you'll be redirected to the project page
2. Click "Process" or "Generate Clips"
3. Watch the progress bar

### 7.3 Monitor Processing

**In your terminal logs**, you should see:

```
[Inngest] Creating Submagic project for: <projectId>
[Submagic] Project created successfully
[Inngest] Polling Submagic project: <submagicProjectId>
[Inngest] Submagic project completed!
[Inngest] Processing clips from Submagic project: <submagicProjectId>
[Inngest] Successfully processed X clips for project <projectId>
```

**In Inngest Dev UI** (http://localhost:8288):
- You'll see the function execution
- Can view detailed logs
- Can replay failed jobs

### 7.4 View Generated Clips

1. Once processing is complete (usually 4-6 minutes)
2. Refresh the project page if needed
3. You should see your clips in the "Clips" section
4. Click on a clip to preview it

## Troubleshooting

### "Submagic API key is not configured"

**Problem:** API key not found or invalid

**Solution:**
1. Check that `SUBMAGIC_API_KEY` is in your `.env.local`
2. Restart your dev server: `npm run dev`
3. Verify the key is valid on Submagic dashboard

### No clips generated

**Problem:** Processing completes but no clips

**Possible causes:**
1. **Video has no audio** - Submagic requires audio
2. **Video too short** - Need at least 1 minute
3. **API rate limit** - Wait and try again

**Debug:**
```bash
# Check if the Submagic project was created
# Look in your terminal logs for the Submagic project ID
# Then check the Submagic dashboard for that project
```

### Processing stuck at X%

**Problem:** Progress bar stuck

**Solution:**
1. Check Inngest Dev UI (http://localhost:8288) for errors
2. Look at console logs in your terminal
3. Check network tab in browser DevTools
4. Maximum wait time is 30 minutes - after that it will timeout

### Database error when storing clips

**Problem:** SQL error about missing column

**Solution:**
```sql
-- Run this in Supabase SQL editor
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS submagic_project_id TEXT;
```

### Inngest not receiving events

**Problem:** Jobs not showing up in Inngest dev UI

**Solution:**
1. Make sure Inngest dev server is running: `npx inngest-cli@latest dev`
2. Check that it's running on port 8288
3. In your app terminal, look for "Inngest" connection logs
4. Try restarting both servers

## Verifying the Setup

### Quick Verification Checklist

- [ ] Submagic API key is set in `.env.local`
- [ ] Database migration has been run
- [ ] Dev server is running (`npm run dev`)
- [ ] Inngest dev server is running (optional for local testing)
- [ ] Can access the app at http://localhost:3000
- [ ] Can upload a video
- [ ] Can see processing progress
- [ ] Clips are generated and visible

### Test with a Sample Video

Use this sample video for testing (1 minute, has audio):
- **Option 1:** Use any YouTube video URL
- **Option 2:** Record a quick 1-minute video on your phone
- **Option 3:** Use a test video from https://sample-videos.com/

### Expected Timeline

For a 2-minute video:
- Upload: ~10-30 seconds
- Submagic processing: ~4-6 minutes
- Clip storage: ~10-30 seconds
- **Total: ~5-7 minutes**

## Production Deployment

### Before deploying to production:

1. **Set production environment variables** in your hosting provider:
   ```env
   SUBMAGIC_API_KEY=sk-your_production_key
   SUBMAGIC_API_URL=https://api.submagic.co/v1
   ```

2. **Run database migration** on production database

3. **Set up Inngest** for production:
   - Sign up at https://www.inngest.com/
   - Get your production keys
   - Set `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY`

4. **Configure webhooks** (optional):
   ```env
   SUBMAGIC_WEBHOOK_URL=https://your-domain.com/api/webhooks/submagic
   ```

5. **Test in staging first** before production

## Need Help?

### Resources
- [Submagic Documentation](https://docs.submagic.co)
- [Inngest Documentation](https://www.inngest.com/docs)
- [Supabase Documentation](https://supabase.com/docs)

### Files to Check
- `src/lib/submagic-api.ts` - Submagic API implementation
- `src/inngest/functions.ts` - Background job processing
- `src/app/api/process-klap/route.ts` - API endpoint
- `SUBMAGIC_MIGRATION.md` - Detailed migration guide

### Common Commands

```bash
# Start dev server
npm run dev

# Start Inngest dev server
npx inngest-cli@latest dev

# Check environment variables
npm run env-check

# Build for production
npm run build

# Run linter
npm run lint
```

## What's Next?

After successful setup:

1. **Test with different video types**
   - Different lengths (30s, 2min, 10min)
   - Different topics
   - Different languages (if needed)

2. **Monitor performance**
   - Check processing times
   - Review clip quality
   - Track success rates

3. **Customize settings**
   - Adjust max clips per video
   - Modify clip duration
   - Configure caption styles

4. **Integrate with your workflow**
   - Set up automatic processing
   - Configure post-processing actions
   - Add custom notifications

## Success! 🎉

If you've reached this point and clips are generating successfully, you're all set!

The Submagic integration is now working and ready to use.

