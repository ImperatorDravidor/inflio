# How Clips Work Now - Quick Reference

## 🎯 The Flow

```
Your Video → YouTube (unlisted) → Submagic AI → Multiple Clips
```

**Time:** 6-12 minutes per video

## ✅ What's Implemented

**100% complete and ready to use!**

1. ✅ YouTube upload service
2. ✅ Submagic Magic Clips integration
3. ✅ Webhook handler for results
4. ✅ Inngest background jobs
5. ✅ Database schema
6. ✅ Error handling
7. ✅ No linter errors

## 🔑 What You Need

### YouTube API (Google Cloud)

```env
YOUTUBE_CLIENT_ID=xxxxx.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=xxxxx
YOUTUBE_REFRESH_TOKEN=xxxxx
```

**Get these from:**
- Google Cloud Console
- OAuth Playground (for refresh token)

**See:** `YOUTUBE_MAGIC_CLIPS_SETUP.md` Step 1

### Submagic Magic Clips

```env
SUBMAGIC_API_KEY=sk-xxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**You need:**
- Magic Clips subscription (not just regular Submagic)
- Magic Clips credits purchased

**See:** `YOUTUBE_MAGIC_CLIPS_SETUP.md` Step 2

### Database

Run this SQL in Supabase:

```sql
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS submagic_project_id TEXT,
ADD COLUMN IF NOT EXISTS youtube_video_id TEXT,
ADD COLUMN IF NOT EXISTS youtube_video_url TEXT;

CREATE INDEX IF NOT EXISTS idx_projects_submagic_id ON projects(submagic_project_id);
CREATE INDEX IF NOT EXISTS idx_projects_youtube_id ON projects(youtube_video_id);
```

## 🚀 Quick Start

### 1. Set Environment Variables

Copy to `.env.local`:
```env
# YouTube (REQUIRED)
YOUTUBE_CLIENT_ID=xxxxx
YOUTUBE_CLIENT_SECRET=xxxxx
YOUTUBE_REFRESH_TOKEN=xxxxx

# Submagic (REQUIRED)
SUBMAGIC_API_KEY=sk-xxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Run Database Migration

Copy SQL from above, paste in Supabase SQL Editor, run it.

### 3. Restart Servers

```bash
# Terminal 1
npm run dev

# Terminal 2
npx inngest-cli@latest dev
```

### 4. Test!

Upload video → Click Process → Wait 10 minutes → See clips!

## 📖 Full Documentation

- **FINAL_SETUP_GUIDE.md** - Complete setup checklist
- **YOUTUBE_MAGIC_CLIPS_SETUP.md** - Detailed YouTube & Submagic setup
- **HOW_CLIPS_WORK_NOW.md** - Technical architecture
- **IMPLEMENTATION_COMPLETE.md** - What was built

## ⚠️ Important Notes

### Why YouTube?

Submagic Magic Clips **only accepts YouTube URLs**. Regular Submagic API only adds captions, doesn't generate clips.

### Video Privacy

Videos are uploaded to YouTube as **unlisted**:
- ✅ Not public or searchable
- ✅ Only accessible with direct link
- ✅ Can be deleted after processing

### Credits

Magic Clips uses **Submagic credits**, not API credits. Make sure you have Magic Clips subscription + credits.

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| "YouTube API not configured" | Set YouTube OAuth credentials |
| "Insufficient API credits" (402) | Buy Magic Clips credits in Submagic |
| Task stuck at 25% | Normal! Waiting for webhook (5-10 min) |
| Infinite polling | Fixed! Now stops after 1 hour |
| Webhook not called | Check NEXT_PUBLIC_APP_URL is correct |

## ✨ What You Get

Each clip includes:
- 📹 Video file (MP4)
- 📊 Virality score (total, shareability, hook strength, story quality, emotional impact)
- 🎬 Duration (15-60 seconds)
- 🏷️ AI-generated title
- 🔗 Preview & download URLs
- 💬 Captions included

## 🎉 That's It!

Once you complete the 3 setup steps, clips will work automatically!

**Total setup time:** ~25 minutes
**Time per video:** ~10 minutes
**Clips per video:** 5-15 (depending on content)

---

**Ready to get started?** Open `FINAL_SETUP_GUIDE.md` and follow the checklist! 🚀


