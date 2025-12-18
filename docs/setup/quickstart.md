# ⚡ QUICKSTART - Fix Clips Not Working

## 🔴 The Problem

Your clips are stuck at "pending" or "processing" because:
1. **Inngest dev server is NOT running** ← This is the main issue!
2. Submagic API key might not be set
3. Database migration not run yet

## ✅ The Solution (5 Minutes)

### Step 1: Start Inngest Dev Server (REQUIRED!)

**Open a NEW terminal window** and run:

```bash
npx inngest-cli@latest dev
```

You should see:
```
🎉 Inngest dev server running!
   View at http://localhost:8288
```

**Keep this terminal open!** Inngest needs to run alongside your Next.js server.

### Step 2: Get Submagic API Key

1. Go to https://www.submagic.co/
2. Sign up (if needed) or log in
3. Go to **Settings** → **API**
4. Click **Generate API Key**
5. Copy the key (looks like `sk-xxxxxxxxx`)

### Step 3: Add to Environment

Add to your `.env.local` file:

```env
SUBMAGIC_API_KEY=sk-paste_your_key_here
```

### Step 4: Run Database Migration

Open your **Supabase SQL Editor** and run:

```sql
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS submagic_project_id TEXT;

CREATE INDEX IF NOT EXISTS idx_projects_submagic_id 
ON projects(submagic_project_id);
```

### Step 5: Restart Your Dev Server

In your Next.js terminal:

```bash
# Press Ctrl+C to stop
# Then restart:
npm run dev
```

You should now see in the logs:
```
✓ Inngest: Connected to dev server
```

### Step 6: Try Again!

1. Go to your project: http://localhost:3000/projects/YOUR_PROJECT_ID
2. Click **"Process"** or **"Generate Clips"**
3. Watch **both terminals**:

**Terminal 1 (Next.js):**
```
[Process Route] Queueing Submagic job with Inngest...
[Process Route] Submagic job queued successfully
```

**Terminal 2 (Inngest):**
```
⚡ Function run started: process-submagic-video
[Inngest] Creating Submagic project for: <projectId>
[Inngest] Polling Submagic project: <submagicProjectId>
[Inngest] Successfully processed X clips
✅ Function run completed
```

## 🎯 What Should Happen

1. **Immediately:** Status shows "Processing"
2. **After 1-2 min:** Progress bar starts moving
3. **After 4-6 min:** Clips appear!
4. **Status:** Changes to "Completed"

## 🐛 Still Not Working?

### Issue: "Submagic API key not configured"
→ Double-check Step 3, restart dev server

### Issue: No logs in Inngest terminal
→ Make sure Inngest is running on port 8288
→ Check that Next.js shows "✓ Inngest: Connected"

### Issue: "Database error"
→ Run the SQL migration in Step 4

### Issue: Clips stay at "Pending"
→ Check Inngest UI at http://localhost:8288
→ Look for error messages in red

## 📊 How It Works

```
1. You click "Process"
   ↓
2. Next.js queues job in Inngest
   ↓
3. Inngest executes the job:
   - Creates Submagic project
   - Polls every 10 seconds
   - Downloads clips when ready
   - Stores in database
   ↓
4. Frontend polls /api/process-klap
   - Checks status every 10 seconds
   - Updates progress bar
   - Shows clips when complete
```

**The key:** Inngest MUST be running for step 3 to happen!

## 🎉 Success Looks Like This

**Next.js Terminal:**
```
[Process Route] Submagic job queued successfully
POST /api/projects/[id]/process 200 in 500ms
```

**Inngest Terminal:**
```
⚡ process-submagic-video started
[Inngest] Creating Submagic project
[Inngest] Project created: sk-12345
[Inngest] Polling status...
[Inngest] Progress: 25%
[Inngest] Progress: 50%
[Inngest] Progress: 75%
[Inngest] Project ready!
[Inngest] Processing 8 clips
[Inngest] Successfully processed 8 clips
✅ Function completed in 4m 32s
```

**Browser:**
- Progress bar moves from 0% → 100%
- Clips appear with thumbnails
- Can click and preview clips

## 🚀 Quick Commands Reference

```bash
# Terminal 1: Next.js dev server
npm run dev

# Terminal 2: Inngest dev server (REQUIRED!)
npx inngest-cli@latest dev

# View Inngest UI
open http://localhost:8288

# View your app
open http://localhost:3000
```

## 📝 Checklist

Before trying again, make sure:

- [ ] Inngest dev server is running (Terminal 2)
- [ ] You can access http://localhost:8288
- [ ] Next.js shows "✓ Inngest: Connected" in logs
- [ ] `SUBMAGIC_API_KEY` is in `.env.local`
- [ ] Database migration has been run
- [ ] Dev server has been restarted

## 💡 Pro Tip

Always run these TWO terminals side by side:

```
┌─────────────────────┬─────────────────────┐
│   Terminal 1        │   Terminal 2        │
│   Next.js           │   Inngest           │
│   npm run dev       │   npx inngest...    │
│                     │                     │
│   [Process Route]   │   ⚡ Function run   │
│   Submagic queued   │   [Inngest] Polling│
│   ✓ Success         │   ✅ Completed      │
└─────────────────────┴─────────────────────┘
```

## ❓ FAQ

**Q: Do I need Inngest for production?**
A: Yes! Sign up at https://www.inngest.com/ and set production keys.

**Q: Can't I use cron jobs instead?**
A: Inngest IS handling your cron/background jobs. It's better than regular cron because it has retries, monitoring, and a UI.

**Q: Why does it take 5 minutes?**
A: Submagic's AI analyzes your entire video to find the best clips. This takes time but produces better results.

**Q: Can I speed it up?**
A: Not really - the AI processing time is on Submagic's side. You can reduce the number of clips generated though.

---

**That's it! Follow these 6 steps and your clips should work!** 🎉

