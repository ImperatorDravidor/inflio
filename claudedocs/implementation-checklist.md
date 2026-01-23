# Implementation Checklist - Nano Banana Pro

Quick reference for completing the implementation.

## ✅ Completed

- [x] Create `nano-banana-service.ts` with character consistency
- [x] Create `persona-service-v2.ts` (no training)
- [x] Create `posts-service-improved.ts` (content-aware)
- [x] Photo analysis with Nano Banana Pro
- [x] Reference portrait generation (5 portraits)
- [x] Brand voice integration in post copy
- [x] Brand color integration in image prompts
- [x] Transcript-aware post generation
- [x] Immediate image generation (not deferred)
- [x] Natural language prompting (following best practices)

---

## 🚧 Critical Path to Launch

### **1. Gemini Image API Integration** 🔴 BLOCKER

**File**: `src/lib/services/nano-banana-service.ts`
**Method**: `extractImageUrl()`

**Tasks**:
- [ ] Research Gemini 2.0 Flash image generation API docs
- [ ] Understand response format for generated images
- [ ] Implement image extraction from response
- [ ] Upload extracted image to Supabase storage (`images` bucket)
- [ ] Return public URL
- [ ] Test end-to-end image generation

**Code Template**:
```typescript
private async extractImageUrl(response: any): Promise<string> {
  // Step 1: Extract image data from Gemini response
  // TODO: Research actual response format
  const imageData = response.data?.image || response.image

  // Step 2: Convert to buffer/blob
  const imageBuffer = Buffer.from(imageData, 'base64')

  // Step 3: Upload to Supabase
  const fileName = `generated/${Date.now()}_${crypto.randomUUID()}.png`
  const { data, error } = await supabaseAdmin.storage
    .from('images')
    .upload(fileName, imageBuffer, {
      contentType: 'image/png',
      upsert: false
    })

  if (error) throw error

  // Step 4: Get public URL
  const { data: urlData } = supabaseAdmin.storage
    .from('images')
    .getPublicUrl(fileName)

  return urlData.publicUrl
}
```

**Research Links**:
- https://ai.google.dev/gemini-api/docs
- https://ai.google.dev/gemini-api/docs/vision

---

### **2. Environment Setup**

**File**: `.env.local`

- [ ] Add `GOOGLE_GENERATIVE_AI_API_KEY`
- [ ] Verify Supabase `images` bucket exists
- [ ] Test API key is valid

```bash
# Add to .env.local
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

**Get API Key**:
1. Go to https://makersuite.google.com/app/apikey
2. Create new API key
3. Copy to .env.local

---

### **3. Database Migration**

**File**: Create `migrations/simplify-personas-for-nano-banana.sql`

- [ ] Drop LoRA training columns
- [ ] Update status enum
- [ ] Add migration file
- [ ] Run migration in Supabase

```sql
-- Remove LoRA training fields
ALTER TABLE personas
  DROP COLUMN IF EXISTS model_ref,
  DROP COLUMN IF EXISTS lora_model_url,
  DROP COLUMN IF EXISTS lora_config_url,
  DROP COLUMN IF EXISTS lora_trigger_phrase,
  DROP COLUMN IF EXISTS lora_training_status,
  DROP COLUMN IF EXISTS lora_trained_at,
  DROP COLUMN IF EXISTS training_job_id;

-- Update status constraint
ALTER TABLE personas
  DROP CONSTRAINT IF EXISTS personas_status_check;

ALTER TABLE personas
  ADD CONSTRAINT personas_status_check
  CHECK (status IN ('pending_upload', 'analyzing', 'ready', 'failed'));

-- Add index for faster persona queries
CREATE INDEX IF NOT EXISTS idx_personas_status_user
  ON personas(user_id, status);
```

---

### **4. API Route Updates**

#### **4a. Persona Creation**
**File**: `src/app/api/personas/create/route.ts`

- [ ] Replace `PersonaService` with `PersonaServiceV2`
- [ ] Remove training-related code
- [ ] Update response format
- [ ] Test endpoint

#### **4b. Post Generation**
**File**: `src/app/api/posts/generate/route.ts`

- [ ] Replace `PostsService` with `ImprovedPostsService`
- [ ] Ensure transcript is passed
- [ ] Verify persona reference images loading
- [ ] Test endpoint

#### **4c. Thumbnail Generation**
**File**: `src/app/api/generate-thumbnail/route.ts`

- [ ] Add `NanoBananaService` integration
- [ ] Use `generateViralThumbnail()` method
- [ ] Apply brand colors
- [ ] Test endpoint

---

### **5. Frontend Components**

#### **5a. Persona Onboarding**
**Files**: Components in `src/app/(dashboard)/onboarding/`

- [ ] Remove training progress UI
- [ ] Show "Analyzing photos..." state
- [ ] Display 5 generated portraits
- [ ] Add "Ready!" success state
- [ ] Update copy to remove training language

#### **5b. Post Suggestions View**
**Files**: Components in `src/app/(dashboard)/projects/`

- [ ] Display generated images in post cards
- [ ] Show carousel slides (if applicable)
- [ ] Add image preview functionality
- [ ] Update empty state if images fail

#### **5c. Loading States**
- [ ] Add analyzing photos loader (30s-1min)
- [ ] Add generating portraits loader
- [ ] Add generating posts loader
- [ ] Update thumbnail generation loader

---

## 🧪 Testing Checklist

### **Unit Tests**
- [ ] Test `NanoBananaService.analyzePhotos()`
- [ ] Test `NanoBananaService.generateReferencePortraits()`
- [ ] Test `PersonaServiceV2.processPersonaPhotos()`
- [ ] Test `ImprovedPostsService.extractKeyMoments()`
- [ ] Test `ImprovedPostsService.generateContentIdea()`

### **Integration Tests**
- [ ] End-to-end persona creation
- [ ] End-to-end post generation
- [ ] Thumbnail generation with persona
- [ ] Brand settings application

### **User Flow Tests**
- [ ] Upload 5 photos → persona created
- [ ] Persona ready immediately (no training wait)
- [ ] Upload video → posts generated with images
- [ ] Posts use actual transcript quotes
- [ ] Images include persona consistently
- [ ] Brand colors appear in images

### **Error Handling Tests**
- [ ] Photo analysis fails gracefully
- [ ] Image generation failure → placeholder
- [ ] Gemini API errors handled
- [ ] Supabase upload errors handled

---

## 📊 Success Criteria

### **Persona Creation**
- ✅ 5-10 photos uploaded
- ✅ Analysis completes in <1 minute
- ✅ 5 reference portraits generated
- ✅ Persona status = "ready"
- ✅ No training wait

### **Post Generation**
- ✅ Posts use actual transcript quotes
- ✅ Posts make logical sense
- ✅ Each post has 1-5 images (depending on type)
- ✅ Images include user's persona
- ✅ Images use brand colors
- ✅ Copy matches brand voice

### **Character Consistency**
- ✅ Person looks the same across all images
- ✅ Facial features match reference photos
- ✅ Expressions vary appropriately
- ✅ Poses vary while maintaining identity

### **Brand Integration**
- ✅ Post copy uses brand voice
- ✅ Images use brand primary color
- ✅ Images use brand accent color
- ✅ Overall vibe matches brand

---

## 🐛 Known Issues / Edge Cases

### **Issue 1: Gemini API Response Format**
**Status**: Unknown until tested
**Mitigation**: Research docs, test with sample requests

### **Issue 2: Photo Analysis Accuracy**
**Status**: Depends on Gemini's vision capabilities
**Mitigation**: Fallback to using first 6 photos if analysis fails

### **Issue 3: Image Generation Time**
**Status**: Unknown performance
**Mitigation**: Add timeout handling, retry logic

### **Issue 4: Character Consistency Quality**
**Status**: Depends on reference photo quality
**Mitigation**: Photo analysis helps select best photos

---

## 📚 Documentation Needed

- [ ] User guide: How to upload persona photos
- [ ] User guide: How to review generated posts
- [ ] Dev docs: Nano Banana Pro integration
- [ ] Dev docs: Brand settings configuration
- [ ] API docs: New endpoints

---

## 🚀 Launch Readiness

### **Phase 1: Internal Testing** (Day 1-2)
- [ ] All critical path items complete
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Manual QA completed

### **Phase 2: Beta Testing** (Day 3-4)
- [ ] 5-10 beta users invited
- [ ] User flows documented
- [ ] Feedback collected
- [ ] Critical bugs fixed

### **Phase 3: Production Deploy** (Day 5)
- [ ] All tests green
- [ ] Performance validated
- [ ] Error handling tested
- [ ] Rollback plan ready

---

## ⚡ Quick Commands

### **Install Dependencies**
```bash
npm install @google/generative-ai
```

### **Test Gemini API**
```bash
node -e "
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
model.generateContent('Test').then(r => console.log(r.response.text()));
"
```

### **Run Migrations**
```bash
# In Supabase dashboard SQL editor:
# Copy content from migrations/simplify-personas-for-nano-banana.sql
# Run query
```

### **Test Image Upload**
```bash
# Test Supabase storage
curl -X POST "https://YOUR_PROJECT.supabase.co/storage/v1/object/images/test.png" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -F "file=@test-image.png"
```

---

## 🎯 Priority Order

1. **FIRST**: Gemini image API integration (BLOCKER)
2. **SECOND**: Database migration
3. **THIRD**: API route updates
4. **FOURTH**: Frontend updates
5. **FIFTH**: Testing & QA

Work in this order to unblock progress fastest.

---

## 💬 Questions to Resolve

- [ ] Which Gemini model for images? (`gemini-2.0-flash-exp` or other?)
- [ ] Image storage bucket name? (using `images` - confirm)
- [ ] Should we keep old `PersonaService` or fully migrate?
- [ ] Rollback strategy if Nano Banana Pro doesn't work?
- [ ] Rate limits for Gemini API?
- [ ] Cost per image generation?

---

**Last Updated**: [Current Date]
**Status**: Ready for implementation 🚀
