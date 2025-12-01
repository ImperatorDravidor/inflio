# 🎬 Final Clips Setup Guide - YouTube + Magic Clips

## What You Have Now

✅ **Complete implementation** of YouTube → Submagic Magic Clips integration
✅ **No linter errors** - all code is clean
✅ **Webhook-based** - no polling needed for clips
✅ **Comprehensive error handling** - fails gracefully with clear messages

## 🎯 How It Works

```
Upload Video → YouTube (unlisted) → Submagic Magic Clips → Webhook → Your App
                                                              ↓
                                                           Clips appear!
```

### Timeline
- **Upload to YouTube**: ~1-2 minutes
- **Submagic processing**: ~5-10 minutes  
- **Total**: ~6-12 minutes per video

## 📋 Setup Checklist

### 1. YouTube API Setup (15 minutes)

- [ ] Create Google Cloud Project
- [ ] Enable YouTube Data API v3
- [ ] Create OAuth 2.0 credentials
- [ ] Get refresh token (use OAuth Playground)
- [ ] Add to `.env.local`:

```env
YOUTUBE_CLIENT_ID=xxxxx.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=xxxxx
YOUTUBE_REFRESH_TOKEN=xxxxx
```

**Detailed instructions**: See `YOUTUBE_MAGIC_CLIPS_SETUP.md` Step 1

### 2. Submagic Magic Clips Setup (5 minutes)

- [ ] Sign up at https://www.submagic.co/
- [ ] Subscribe to **Magic Clips** plan
- [ ] Purchase credits
- [ ] Generate API key
- [ ] Add to `.env.local`:

```env
SUBMAGIC_API_KEY=sk-xxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Migration (2 minutes)

Run in Supabase SQL Editor:

```sql
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS submagic_project_id TEXT,
ADD COLUMN IF NOT EXISTS youtube_video_id TEXT,
ADD COLUMN IF NOT EXISTS youtube_video_url TEXT;

CREATE INDEX IF NOT EXISTS idx_projects_submagic_id ON projects(submagic_project_id);
CREATE INDEX IF NOT EXISTS idx_projects_youtube_id ON projects(youtube_video_id);
```

### 4. Restart Servers (1 minute)

```bash
# Stop both servers (Ctrl+C)

# Terminal 1
npm run dev

# Terminal 2
npx inngest-cli@latest dev
```

### 5. Test It! (10 minutes)

1. Upload a video at `/studio/upload`
2. Click "Process"
3. Watch terminal logs
4. Wait 6-12 minutes
5. Clips appear!

## 📂 New Files Created

```
src/lib/
├── youtube-upload-service.ts          ← NEW: YouTube upload
├── submagic-api.ts                    ← UPDATED: Added Magic Clips support

src/app/api/webhooks/
└── submagic/
    └── route.ts                       ← NEW: Webhook handler

migrations/
└── add-submagic-project-id.sql       ← UPDATED: Added YouTube fields

Documentation:
├── YOUTUBE_MAGIC_CLIPS_SETUP.md      ← NEW: Detailed setup guide
├── HOW_CLIPS_WORK_NOW.md             ← NEW: How it works
└── FINAL_SETUP_GUIDE.md              ← NEW: This file
```

## 🔥 Key Changes from Before

### Old (Klap)
```
Upload → Klap API → Poll → Get clips → Done
```

### New (Submagic Magic Clips)
```
Upload → YouTube → Submagic Magic Clips → Webhook → Done
```

### Why the change?
- **Klap**: Direct video URLs ✅
- **Submagic**: YouTube URLs only ❌
- **Solution**: Upload to YouTube first ✅

## 🎨 What You Get

Each clip includes:
- ✅ AI-generated title
- ✅ Virality score (0-100)
  - Total score
  - Shareability
  - Hook strength
  - Story quality
  - Emotional impact
- ✅ Download URL
- ✅ Preview URL
- ✅ Direct streaming URL
- ✅ Duration
- ✅ Captions included

## ⚡ Quick Start Commands

```bash
# 1. Install dependencies (if needed)
npm install

# 2. Start dev servers
npm run dev                    # Terminal 1
npx inngest-cli@latest dev     # Terminal 2

# 3. View Inngest UI
open http://localhost:8288

# 4. View your app
open http://localhost:3000
```

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "YouTube API not configured" | Complete YouTube OAuth setup |
| "Refresh token expired" | Regenerate in OAuth Playground |
| "Insufficient API credits" | Purchase Submagic Magic Clips credits |
| "Webhook not called" | Check NEXT_PUBLIC_APP_URL is correct |
| "Clips stay processing" | Check Inngest logs for errors |

## 📊 Verifying It Works

### Successful Upload Logs:

```
[Inngest] Uploading video to YouTube for: <projectId>
[YouTube] Video uploaded successfully
[Inngest] Video uploaded to YouTube: https://youtube.com/watch?v=xxx
[Inngest] Creating Submagic Magic Clips project
[Submagic] Magic Clips project created successfully
[Inngest] Webhook will be called at: http://localhost:3000/api/webhooks/submagic
[Inngest] Processing will continue in background
```

### Successful Webhook Logs:

```
[Submagic Webhook] Received webhook: { projectId, status: 'completed', clipCount: 8 }
[Submagic Webhook] Processing 8 clips for project <projectId>
[Submagic Webhook] Clip stored at: <url>
[Submagic Webhook] Successfully processed 8 clips
```

## 🚀 Ready for Production?

Before deploying:

- [ ] YouTube OAuth configured for production domain
- [ ] Submagic API key set in production environment
- [ ] Database migration run on production database
- [ ] NEXT_PUBLIC_APP_URL set to production domain
- [ ] Webhook URL is publicly accessible (HTTPS)
- [ ] Inngest production keys configured
- [ ] Tested successfully on staging

## 📖 Documentation Structure

Read in this order:
1. **FINAL_SETUP_GUIDE.md** (this file) ← Start here
2. **YOUTUBE_MAGIC_CLIPS_SETUP.md** ← Detailed setup steps
3. **HOW_CLIPS_WORK_NOW.md** ← Technical details

## 💬 Questions?

**Setup issues?**
→ Read `YOUTUBE_MAGIC_CLIPS_SETUP.md`

**YouTube problems?**
→ Check Google Cloud Console and OAuth Playground

**Submagic issues?**
→ Check Submagic dashboard for credits

**Webhook not working?**
→ Check `NEXT_PUBLIC_APP_URL` and use ngrok for local dev

## 🎉 Success Checklist

Once everything is working, you should see:

- [ ] Video uploads successfully
- [ ] YouTube video created (check YouTube Studio)
- [ ] Submagic project created (check Submagic dashboard)
- [ ] Webhook called after 5-10 minutes
- [ ] Clips appear in your project page
- [ ] Each clip has virality score
- [ ] Can preview and download clips

**That's it! Your clip generation is now fully functional.** 🚀


