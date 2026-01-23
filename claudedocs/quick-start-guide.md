# Quick Start Guide - Nano Banana Pro Implementation

**Your next steps to get Inflio market-ready with Nano Banana Pro.**

---

## 🎯 What's Done

✅ **Core Services** - All Nano Banana Pro integration complete
- nano-banana-service.ts - FAL.AI integration with character consistency
- persona-service-v2.ts - Instant persona creation (no training)
- posts-service-improved.ts - Content-aware posts with brand integration

✅ **API Routes** - Updated to use new services
- /api/personas/create - Uses PersonaServiceV2
- /api/posts/generate - Uses ImprovedPostsService
- /api/generate-thumbnail-v2 - New Nano Banana Pro thumbnails

✅ **Database Migration** - Ready to apply
- migrations/simplify-personas-for-nano-banana.sql

---

## ⚡ Critical Path (Do These First)

### Step 1: Apply Database Migration (5 minutes)

**Why**: Updates personas table to remove LoRA training columns

**How**:
1. Open Supabase Dashboard → SQL Editor
2. Open `migrations/simplify-personas-for-nano-banana.sql`
3. Copy entire contents
4. Paste into SQL Editor
5. Click "Run"
6. Verify no errors

**Verify**:
```sql
-- Check persona table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'personas';

-- Should NOT have: model_ref, lora_model_url, lora_config_url, etc.
-- Status should allow: 'pending_upload', 'analyzing', 'ready', 'failed'
```

---

### Step 2: Verify Environment Variables (2 minutes)

**Check .env.local has**:
```bash
FAL_KEY=your_fal_ai_key_here
```

**Verify it works**:
```bash
npm run dev
# Watch console for any FAL_KEY errors
```

---

### Step 3: Test Persona Creation (10 minutes)

**Test with API client (Postman/Insomnia/Thunder Client)**:

```bash
POST http://localhost:3000/api/personas/create
Content-Type: multipart/form-data

Fields:
- name: "Test Person"
- description: "Test persona"
- photos: [5-10 image files]
```

**Expected Response**:
```json
{
  "success": true,
  "persona": {
    "id": "...",
    "status": "ready",
    "name": "Test Person",
    "portraits": [
      "https://...portrait-1.png",
      "https://...portrait-2.png",
      "https://...portrait-3.png",
      "https://...portrait-4.png",
      "https://...portrait-5.png"
    ],
    "message": "Persona created successfully! Reference portraits are ready to use."
  }
}
```

**If it fails**:
- Check FAL_KEY is set
- Check Supabase storage bucket `persona-photos` exists
- Check migration was applied (status enum updated)
- Check console logs for specific error

---

### Step 4: Test Post Generation (10 minutes)

**Prerequisites**:
- Have a project with transcript in database
- Know the projectId

**Test**:
```bash
POST http://localhost:3000/api/posts/generate
Content-Type: application/json

{
  "projectId": "your-project-id",
  "projectTitle": "My Video Title",
  "transcript": "Full transcript text here...",
  "contentAnalysis": {
    "keyMoments": [
      {
        "timestamp": 10,
        "description": "Introduction"
      }
    ]
  },
  "personaId": "persona-id-from-step-3",
  "contentTypes": ["carousel", "single"],
  "platforms": ["instagram", "linkedin"]
}
```

**Expected Response**:
```json
{
  "suggestions": [
    {
      "type": "carousel",
      "platform": "instagram",
      "copy": "Hook using actual quote from transcript...",
      "images": [
        "https://...generated-image-1.png",
        "https://...generated-image-2.png"
      ]
    }
  ]
}
```

**Verify**:
- ✅ Posts include actual quotes from transcript
- ✅ Images are generated (not null)
- ✅ Copy makes sense and relates to video content
- ✅ Images feature the persona from Step 3

---

### Step 5: Test Thumbnail Generation (10 minutes)

**Test**:
```bash
POST http://localhost:3000/api/generate-thumbnail-v2
Content-Type: application/json

{
  "projectId": "your-project-id",
  "videoTitle": "How to Build a SaaS",
  "keyMessage": "Build Your SaaS in 30 Days!",
  "contentTheme": "SaaS development, entrepreneurship",
  "personaId": "persona-id-from-step-3"
}
```

**Expected Response**:
```json
{
  "success": true,
  "url": "https://...thumbnail.png",
  "metadata": {
    "model": "nano-banana-pro",
    "dimensions": "1920x1080",
    "hasPersona": true,
    "brandColorsApplied": true
  }
}
```

**Verify**:
- ✅ Thumbnail is 16:9 aspect ratio
- ✅ Persona appears in thumbnail
- ✅ Brand colors applied (if set in user profile)

---

## 🎨 Frontend Updates (Optional for Testing, Required for Production)

### Update Persona Onboarding

**File**: `src/app/(dashboard)/onboarding/persona/page.tsx` (or similar)

**Changes needed**:
1. Remove training progress UI
2. Update status text:
   - `'analyzing'` → "Analyzing your photos..."
   - `'ready'` → "Persona ready! ✅"
3. Display 5 reference portraits when ready
4. Remove "Training will take 10-30 minutes" language

**Example**:
```tsx
{persona.status === 'analyzing' && (
  <div className="loading-state">
    <Spinner />
    <p>Analyzing your photos...</p>
    <p className="text-sm text-gray-500">
      This will take 30-60 seconds
    </p>
  </div>
)}

{persona.status === 'ready' && (
  <div className="success-state">
    <CheckCircle className="text-green-500" />
    <h3>Persona Ready!</h3>
    <div className="portraits-grid">
      {portraits.map(portrait => (
        <img key={portrait} src={portrait} alt="Reference portrait" />
      ))}
    </div>
  </div>
)}
```

---

### Update Post Suggestions Display

**File**: `src/app/(dashboard)/projects/[id]/posts/page.tsx` (or similar)

**Changes needed**:
1. Display generated images in post cards
2. Add image carousel for multi-image posts
3. Handle empty state when images fail to generate

**Example**:
```tsx
{suggestion.images && suggestion.images.length > 0 && (
  <div className="post-images">
    {suggestion.images.map((img, idx) => (
      <img
        key={idx}
        src={img}
        alt={`Post image ${idx + 1}`}
        className="rounded-lg"
      />
    ))}
  </div>
)}
```

---

## 🧪 Testing Checklist

Use this checklist to verify everything works:

### Persona Creation
- [ ] Upload 5-10 photos
- [ ] Persona created with status 'ready' in < 2 minutes
- [ ] 5 reference portraits generated
- [ ] No training delay
- [ ] Check persona_images table has 5 records with type='reference_portrait'

### Post Generation
- [ ] Upload video with transcript
- [ ] Generate posts with persona selected
- [ ] Posts include actual transcript quotes
- [ ] Images generated for each post
- [ ] Persona appears in images
- [ ] Brand colors applied (if set in user profile)
- [ ] Copy matches brand voice (if set)

### Thumbnail Generation
- [ ] Generate thumbnail with new v2 route
- [ ] Persona appears consistently
- [ ] Brand colors applied (if set)
- [ ] 16:9 aspect ratio
- [ ] Thumbnail looks viral/engaging

### Brand Settings Integration
- [ ] Set brand_voice in user profile
- [ ] Set brand_colors in user profile
- [ ] Generate posts and verify voice applied
- [ ] Generate images and verify colors applied

---

## 🐛 Common Issues & Solutions

### Issue: "FAL_KEY is not configured"
**Solution**:
- Check .env.local has `FAL_KEY=...`
- Restart dev server: `npm run dev`
- Verify key is valid at fal.ai dashboard

### Issue: "Transcript is required for content-aware post generation"
**Solution**:
- Ensure project has transcript in database
- Pass transcript in request body
- Check transcription completed successfully

### Issue: "Persona not found" or "No reference images"
**Solution**:
- Verify persona was created successfully (Step 3)
- Check persona_images table has records
- Ensure personaId is correct in request

### Issue: Images not generating
**Solution**:
- Check FAL_KEY is valid
- Check console logs for FAL.AI errors
- Verify Nano Banana Pro service is being called
- Check Supabase storage bucket `images` exists

### Issue: Brand colors not applied
**Solution**:
- Check user_profiles table has brand_colors set
- Verify brand colors format: `{ primary: "#HEX", accent: "#HEX" }`
- Check ImprovedPostsService is loading user profile

---

## 📊 Success Metrics

After completing these steps, you should have:

✅ **Instant Persona Creation** (< 2 min vs. 10-30 min)
✅ **Content-Aware Posts** (using transcript quotes)
✅ **Automatic Image Generation** (1-5 per post)
✅ **Brand Integration** (voice + colors applied)
✅ **Character Consistency** (persona in all images)

---

## 🚀 Going to Production

Once testing is complete:

1. **Backup existing personas** (if any with LoRA training)
2. **Run migration** on production database
3. **Update environment variables** on production
4. **Deploy updated API routes**
5. **Deploy frontend updates**
6. **Monitor FAL.AI usage** for rate limits/costs
7. **Set up error tracking** (Sentry already configured)

---

## 💡 Next Enhancements (Post-Launch)

After core functionality is stable:

1. **Photo Analysis Enhancement**
   - Use Gemini Vision to analyze photo quality
   - Auto-select best 6 photos from uploads
   - Provide quality feedback to users

2. **Portrait Regeneration**
   - Allow users to regenerate specific portraits
   - Add portrait style preferences
   - Save favorite portraits

3. **Brand Settings UI**
   - Visual brand color picker
   - Brand voice templates/examples
   - Preview brand integration

4. **Performance Optimization**
   - Cache generated portraits
   - Batch image generation for multiple posts
   - Implement retry logic for FAL.AI

---

**Questions?** Check:
- Full implementation checklist: `claudedocs/implementation-checklist.md`
- Progress tracking: `claudedocs/nano-banana-implementation-progress.md`
- Original summary: `claudedocs/nano-banana-implementation-summary.md`
