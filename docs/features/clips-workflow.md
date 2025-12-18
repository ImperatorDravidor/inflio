# How Clips Work Now (Submagic Migration)

## 🎯 Current State

The app has been migrated from Klap to Submagic for clip generation. However, **Submagic's API works differently** than Klap.

## ⚠️ Important Limitation

**Submagic `/v1/projects` endpoint does NOT generate clips.**

It only adds captions to ONE video and returns the same video with captions. To generate MULTIPLE clips (like Klap did), you need the `/v1/projects/magic-clips` endpoint, which **ONLY accepts YouTube URLs**.

## 📋 Current Implementation

### What We Implemented

1. **Endpoint**: `POST /v1/projects` 
2. **Input**: Direct video URL from Supabase storage
3. **Output**: ONE video with AI-generated captions
4. **Does NOT**: Generate multiple short clips

### The Flow

```
1. User uploads video → Supabase Storage
   ↓
2. User clicks "Process" → Creates Inngest job
   ↓
3. Inngest sends video to Submagic → POST /v1/projects
   ↓
4. Submagic adds captions to the video
   ↓
5. Returns ONE captioned video (not clips)
```

## 🚨 The Problem

**You're trying to generate clips, but Submagic's regular API doesn't do that.**

### Two Options in Submagic:

| Feature | Endpoint | Input | Output |
|---------|----------|-------|--------|
| **Captions** | `/v1/projects` | Any video URL | 1 video with captions |
| **Magic Clips** | `/v1/projects/magic-clips` | YouTube URL only | Multiple short clips |

## 💡 Your Options

### Option 1: Change Workflow (Use Magic Clips)

**Requires YouTube upload first:**

```
1. User uploads video → Supabase Storage
   ↓
2. Automatically upload to YouTube (unlisted)
   ↓
3. Send YouTube URL to Submagic Magic Clips
   ↓
4. Get multiple short clips back
```

**Pros:**
- Gets you actual clips (like Klap)
- Maintains current UI/UX

**Cons:**
- Need YouTube API integration
- Extra step (upload to YouTube)
- Video must be on YouTube

### Option 2: Keep Current Implementation (Captions Only)

**Current flow:**

```
1. User uploads video → Supabase Storage
   ↓
2. Send to Submagic /v1/projects
   ↓
3. Get ONE video with captions back
```

**Pros:**
- Works with direct URLs
- Simpler implementation
- Already done

**Cons:**
- NO clip generation
- Just adds captions to existing video
- Not what Klap did

### Option 3: Switch to Different Service

Find a service that:
- Accepts direct video URLs (like Klap did)
- Generates multiple clips
- Has a REST API

**Examples:**
- **Opus Clip** - Similar to Klap
- **Vizard.ai** - AI clip generation
- **Munch** - Another alternative
- **Back to Klap** - If it was working before

## 🔧 What You Need To Decide

### Question 1: What's your goal?

- **A) Generate multiple short clips** → Need Magic Clips (YouTube) or different service
- **B) Add captions to videos** → Current implementation works (need credits)

### Question 2: Are you willing to upload to YouTube?

- **YES** → Can use Submagic Magic Clips
- **NO** → Need different service

## 🎬 If You Choose Magic Clips (Option 1)

I can update the code to:

1. **Detect video source:**
   - If YouTube URL → Use Magic Clips endpoint
   - If direct upload → Upload to YouTube first, then Magic Clips

2. **Update endpoints:**
   ```typescript
   // For uploaded videos
   POST /v1/projects/magic-clips
   {
     "title": "My Video",
     "language": "en",
     "youtubeUrl": "https://youtube.com/watch?v=...",
     "webhookUrl": "https://your-app.com/webhook"
   }
   ```

3. **Process clips:**
   - Wait for webhook notification
   - Extract clips from `magicClips[]` array
   - Each clip has virality scores, download URLs

## 💰 About Credits

### Current Setup (Captions):
- Endpoint: `/v1/projects`
- Requires: **API credits**
- Error: `402 Insufficient API credits`

### If Using Magic Clips:
- Endpoint: `/v1/projects/magic-clips`
- Requires: **Magic Clips subscription + credits**
- Different pricing

## 🚀 Quick Fix Guide

### If you want CLIPS (like Klap):

**Tell me and I'll:**
1. Implement YouTube upload integration
2. Update Submagic calls to use Magic Clips endpoint
3. Handle webhook responses with clip arrays
4. Update UI to show multiple clips

### If you want CAPTIONS only:

**You just need to:**
1. Add credits to Submagic account
2. Current code will work immediately
3. Get ONE video with captions back

## 📝 Summary

**Current implementation:**
- ✅ Code is correct
- ✅ Authentication works
- ✅ Error handling works
- ❌ Does NOT generate clips (just captions)
- ❌ Needs credits to work

**What Klap did:**
- ✅ Generated multiple short clips
- ✅ Virality scores
- ✅ Direct video URL support

**What Submagic does with current endpoint:**
- ✅ Adds captions to video
- ❌ Returns ONE video (not clips)
- ❌ Different from what Klap did

## ❓ Next Steps

**Tell me:**
1. Do you want multiple CLIPS or just CAPTIONS?
2. Are you willing to upload to YouTube first?
3. Or should we use a different service entirely?

Once I know what you want, I can finish the implementation properly! 🎯


