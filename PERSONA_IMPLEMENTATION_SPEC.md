# Inflio Persona System - Complete Implementation Specification

## Executive Summary

The Inflio Persona System is a sophisticated AI-powered feature that enables users to create personalized AI avatars (personas) through photo uploads during onboarding. These personas are trained using LoRA (Low-Rank Adaptation) models via FAL.ai's FLUX model and integrated across the platform for generating personalized thumbnails, social graphics, and content featuring the user's likeness.

## System Architecture Overview

### Core Components

1. **Onboarding Flow** - Initial persona creation during user setup
2. **Photo Upload & Validation** - Quality analysis and storage management
3. **LoRA Training Pipeline** - FAL.ai integration for model fine-tuning
4. **Storage Infrastructure** - Supabase for data and image storage
5. **Generation Services** - Integration with FLUX and GPT-Image models
6. **UI Components** - React components for management and creation

## 1. Persona Creation During Onboarding

### 1.1 Onboarding Flow Integration

**Location**: Step 4 of 7 in the onboarding process  
**Component**: `src/components/onboarding/premium-onboarding.tsx`  
**Sub-component**: `src/components/onboarding/ai-avatar-training.tsx`

#### Enhanced Flow Details:
1. User reaches "AI Avatar" step after brand identity setup
2. Presented with camera capture or file upload options
3. Guidelines displayed for optimal photo quality
4. Minimum 5 photos required, 10 recommended, 20 maximum
5. Real-time quality analysis and feedback
6. **NEW: GPT-5 photo analysis for professional feedback**
7. **NEW: Generate 5 preview samples before training**
8. **NEW: User approval step with feedback collection**
9. Auto-save progress to prevent data loss
10. Training initiated only after approval

### 1.2 Photo Capture & Upload Process

#### Camera Capture:
```typescript
// WebRTC implementation for live capture
- Multiple camera support (front/back switching)
- Preview before capture
- Instant quality analysis
- Direct storage to Supabase
```

#### File Upload:
```typescript
// Drag-and-drop or file selection
- Bulk upload support
- Format validation (JPEG, PNG, WebP)
- Size limits (10MB per file)
- Dimension requirements (min 512x512, ideal 1024x1024)
```

### 1.3 Photo Quality Analysis

**Service**: `PersonaUploadService.validatePhoto()`

#### Local Quality Analysis (0-100 points):
- **Dimension Score** (40 points)
  - Full points for ≥1024px minimum dimension
  - Scaled points for 512-1024px
  - Rejection below 512px
- **Aspect Ratio Score** (20 points)
  - Optimal: 0.8-1.2 (near square)
  - Acceptable: 0.6-1.5
- **File Size Score** (20 points)
  - Higher quality files score better
  - Minimum 1MB for optimal score
- **Format Score** (20 points)
  - JPEG: 20 points (preferred for photos)
  - PNG: 15 points
  - WebP: 10 points

#### GPT-5 Enhanced Analysis:
```typescript
// New service for AI-powered photo validation
PersonaValidationService.analyzePersonaPhotos(photos)
  - Facial consistency check
  - Lighting quality assessment
  - Expression variety validation
  - Background consistency
  - Professional recommendations
  - Training readiness score
```

### 1.4 User Guidance & Tips

Displayed guidelines during photo capture:
- **Lighting**: Face a window, use soft natural light
- **Angles**: Include front-facing and 3/4 profile shots
- **Expression**: Natural, varied expressions
- **Background**: Consistent, uncluttered backgrounds
- **Clothing**: Different outfits for variety
- **Accessories**: Include/exclude glasses consistently

### 1.5 Approval Flow (NEW)

#### Preview Generation Before Training:
1. **Sample Creation**: Generate 5 style variations using base FLUX
   - Professional headshot style
   - Casual portrait style
   - YouTube thumbnail style
   - Social media profile style
   - Creative artistic style

2. **User Review Interface**:
   - Display generated samples in grid
   - Collect specific feedback on issues
   - Option to re-upload different photos
   - Clear explanation of training time

3. **Feedback Collection**:
   - Checkbox options for common issues
   - Free-text feedback field
   - Quality confirmation before training
   - Option to adjust photos based on AI suggestions

## 2. LoRA Model Training

### 2.1 Training Pipeline

**Endpoint**: `fal-ai/flux-lora-portrait-trainer`  
**Service**: `FALService.trainLoRA()`

#### Training Configuration:
```javascript
{
  images_data_url: "ZIP archive with photos",
  trigger_phrase: "photo of [persona_name]",
  learning_rate: 0.00009,
  steps: 2500,
  multiresolution_training: true,
  subject_crop: true,
  create_masks: false
}
```

### 2.2 Training Process Flow

1. **Image Preparation** (`/api/personas/prepare-training-images`)
   - Create ZIP archive with photos
   - Generate caption files with trigger phrases
   - Upload to temporary storage
   - Return signed URL (1-hour expiry)

2. **Training Initiation** (`/api/personas/train-lora`)
   - Create training job record
   - Submit to FAL.ai API
   - Monitor progress asynchronously
   - Update database on completion

3. **Status Monitoring**
   - Polling every 30 seconds
   - Progress estimation based on elapsed time
   - Average training time: 10-30 minutes
   - Maximum timeout: 30 minutes

### 2.3 Training Data Structure

ZIP Archive Contents:
```
image_001.jpg
image_001.txt (caption: "a photo of [trigger], professional portrait")
image_002.jpg
image_002.txt
...
```

### 2.4 Model Output

Upon successful training:
- **LoRA Model File**: Diffusers format weights
- **Config File**: Training configuration
- **Trigger Phrase**: Unique identifier for generation
- **Model URL**: Persistent storage location

## 3. Database Schema

### 3.1 Tables Structure

#### personas
```sql
CREATE TABLE personas (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT, -- 'pending_upload', 'preparing', 'training', 'trained', 'failed'
  model_ref TEXT,
  lora_model_url TEXT,
  lora_config_url TEXT,
  lora_trigger_phrase TEXT,
  lora_training_status TEXT,
  lora_trained_at TIMESTAMPTZ,
  training_job_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

#### persona_images
```sql
CREATE TABLE persona_images (
  id UUID PRIMARY KEY,
  persona_id UUID REFERENCES personas(id),
  user_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  quality_score FLOAT,
  metadata JSONB,
  created_at TIMESTAMPTZ
)
```

#### lora_training_jobs
```sql
CREATE TABLE lora_training_jobs (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  persona_id UUID REFERENCES personas(id),
  images_data_url TEXT NOT NULL,
  trigger_phrase TEXT,
  learning_rate DECIMAL,
  steps INTEGER,
  status TEXT, -- 'pending', 'processing', 'completed', 'failed', 'cancelled'
  error_message TEXT,
  lora_model_url TEXT,
  lora_config_url TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
```

### 3.2 Storage Structure

**Supabase Storage Bucket**: `personas`
```
/personas/
  /{user_id}/
    /{persona_id}/
      /{photo_id}.jpg
```

### 3.3 User Profile Integration

The `user_profiles` table includes:
- `default_persona_id`: Links to primary persona
- `persona_photo_count`: Quick reference count

## 4. AI Models Integration

### 4.0 GPT-5 Integration for Analysis (NEW)

**Model**: GPT-5 (per user preference)  
**Temperature**: 1.0 (default only)  
**max_completion_tokens**: Used instead of max_tokens

#### Key Uses:
1. **Photo Set Analysis**: Evaluate training readiness
2. **Preview Generation Prompts**: Create optimized prompts
3. **User Feedback Processing**: Understand improvement needs
4. **Thumbnail Prompt Enhancement**: Generate better prompts with personas
5. **Content Analysis**: Deep analysis of video content for persona integration

### 4.1 Base Engine Model - FLUX.1 [dev] with LoRAs

**Endpoint**: `https://fal.run/fal-ai/flux-lora`  
**Documentation**: `docs/base-engine-model.md`

#### Key Features:
- LoRA support for personalization
- Fast inference (28 steps default)
- Multiple image sizes
- Safety checker enabled
- Batch generation support

#### Usage with Personas:
```javascript
const input = {
  prompt: "YouTube thumbnail featuring [trigger_phrase]",
  loras: [{
    path: persona.lora_model_url,
    scale: 1.0
  }],
  image_size: { width: 1920, height: 1080 },
  guidance_scale: 8.0
}
```

### 4.2 Image Editing Model - FLUX.1 Kontext [max]

**Endpoint**: `https://fal.run/fal-ai/flux-pro/kontext/max`  
**Documentation**: `docs/image-editing-model.md`

#### Key Features:
- Image-to-image transformation
- Typography generation
- Premium consistency
- Fast editing without quality compromise

#### Usage with Personas:
```javascript
const input = {
  prompt: "Add text overlay to persona image",
  image_url: persona_generated_image,
  guidance_scale: 3.5,
  aspect_ratio: "16:9"
}
```

### 4.3 Persona Trainer Model

**Endpoint**: `https://fal.run/fal-ai/flux-lora-portrait-trainer`  
**Documentation**: `docs/personatrainermodel.md`

#### Optimizations:
- Portrait-specific training
- Bright highlights emphasis
- Excellent prompt following
- Highly detailed results
- Consistent facial features

## 5. Persona Usage in Content Generation

### 5.1 AI Thumbnail Generation

**Component**: `src/components/thumbnail-creator.tsx`  
**API**: `/api/generate-thumbnail`

#### Enhanced Integration Flow:
1. User selects persona from dropdown
2. System loads persona's LoRA model URL
3. **GPT-5 analyzes content and generates optimized prompt**
4. Prompt properly structured with trigger phrase at start
5. FLUX generates with LoRA weights (scale 0.5-1.5)
6. Optional video snippet merging
7. Quality enhancement post-processing
8. **User can iterate with feedback**

#### Enhanced Prompt Structure:
```javascript
// GPT-5 generates context-aware prompts
const smartPrompt = await ThumbnailPromptService.generateSmartPrompt(
  persona,
  contentAnalysis
)

// Base structure with proper LoRA trigger
`${persona.lora_trigger_phrase}, YouTube thumbnail, 1920x1080, ultra HD quality,
PROMINENTLY featuring ${personaName}'s face with ${sentiment} expression,
direct eye contact with viewer, face takes up 30-40% of frame,
professional lighting, sharp facial features,
${contentAnalysis.thumbnailIdeas?.concepts[0]?.visualElements.join(', ')},
${style} style, ${keywords} theme,
photorealistic, highly detailed`

// Negative prompt for quality control
negativePrompt: 'blurry, low quality, distorted face, bad anatomy, extra limbs'
```

### 5.2 Social Graphics Generation with GPT-Image-1 (STANDARDIZED)

**Component**: `src/components/unified-content-generator.tsx`  
**API**: `/api/generate-images`  
**Model**: GPT-Image-1 (OpenAI's native multimodal model)

#### Standardized Workflow for Social Posts:

Since GPT-Image-1 cannot use LoRA models, we use a pre-generated persona image as reference:

1. **Pre-generated Persona Image Selection**:
   ```typescript
   // Select best persona sample for the platform
   const personaImage = await PersonaService.getBestSampleForPlatform(
     persona.id,
     platform // 'instagram' | 'linkedin' | 'twitter' etc.
   )
   ```

2. **Reference Image Integration**:
   ```typescript
   // Include persona image as base64 in prompt
   const prompt = `
   Using the attached image as reference for the person named ${persona.name},
   create a ${platform} social media post graphic.
   
   IMPORTANT: The attached image shows ${persona.name} - use their exact likeness,
   maintaining their facial features, expression style, and appearance.
   
   Content requirements:
   - ${contentDescription}
   - Style: ${brandStyle}
   - Include text overlay: "${postText}"
   - Platform: ${platform} (optimize for ${platformDimensions})
   
   The person in the attached reference image should be prominently featured
   in the generated image, maintaining their authentic appearance.
   `
   ```

3. **GPT-Image-1 API Call with Image Reference**:
   ```typescript
   // Using the edit endpoint for persona integration
   const response = await openai.images.edit({
     model: "gpt-image-1",
     image: [personaImageFile], // Pre-generated persona sample
     prompt: prompt,
     n: 1, // Number of variations
     size: platformOptimizedSize,
     quality: "high", // or "medium", "low"
     input_fidelity: "high" // Preserve persona features
   })
   
   // Alternative: Using Responses API for multi-turn editing
   const response = await openai.responses.create({
     model: "gpt-5",
     input: [
       {
         role: "user",
         content: [
           { type: "input_text", text: prompt },
           { type: "input_image", image_url: personaImageDataUrl }
         ]
       }
     ],
     tools: [{ type: "image_generation", quality: "high" }]
   })
   ```

4. **Platform-Specific Optimizations**:
   - **Instagram**: Square (1024x1024), carousel support
   - **LinkedIn**: Professional tone, 1200x627
   - **Twitter/X**: 1024x512 for optimal timeline display
   - **Facebook**: Multiple formats based on post type
   - **YouTube Community**: 1024x1024 square format

#### Key Differences from Thumbnail Generation:
- Thumbnails use FLUX with LoRA (direct persona integration)
- Social posts use GPT-Image-1 with reference image (indirect integration)
- Both maintain persona consistency through different methods

#### Supported Platforms:
- Instagram (square, carousel, story)
- LinkedIn (professional layouts)
- Twitter/X (optimized for timeline)
- YouTube (community posts)
- Facebook (various formats)

### 5.3 Unified Content Service

**Service**: `src/lib/unified-content-service.ts`

#### Key Methods:
```typescript
// Apply persona to any content type
UnifiedContentService.applyPersonaToPrompt(
  basePrompt: string,
  persona: ContentPersona,
  contentType: 'thumbnail' | 'social' | 'blog'
): string

// Merge video snippets with persona
UnifiedContentService.mergeVideoSnippetsIntoPrompt(
  basePrompt: string,
  snippets: VideoSnippet[],
  contentType: string
): string
```

## 6. Implementation Services & APIs (NEW)

### 6.1 Persona Validation Service

**Location**: `src/lib/services/persona-validation-service.ts`

```typescript
export class PersonaValidationService {
  // Analyze photos with GPT-5
  static async analyzePersonaPhotos(photos: string[]): Promise<{
    quality: 'excellent' | 'good' | 'needs_improvement'
    feedback: string[]
    suggestions: string[]
    readyForTraining: boolean
  }>
  
  // Generate preview descriptions
  static async generatePersonaPreview(
    personaName: string,
    photos: string[]
  ): Promise<{
    thumbnailConcepts: string[]
    socialPostConcepts: string[]  
    potentialIssues: string[]
  }>
  
  // Process user feedback
  static async processUserFeedback(
    feedback: string,
    issues: string[]
  ): Promise<{
    shouldProceed: boolean
    recommendations: string[]
  }>
}
```

### 6.2 Sample Generation API

**Endpoint**: `/api/personas/generate-samples`

```typescript
// Generate 5 preview samples without training
POST /api/personas/generate-samples
{
  personaPhotos: string[],  // Base64 or URLs
  personaName: string,
  styles: string[]  // Optional style preferences
}

// Returns
{
  samples: [
    {
      url: string,
      style: string,
      prompt: string,
      quality: number
    }
  ],
  recommendations: string[]
}
```

### 6.3 Thumbnail Prompt Service

**Location**: `src/lib/services/thumbnail-prompt-service.ts`

```typescript
export class ThumbnailPromptService {
  // Generate optimized prompts with persona
  static generatePersonaThumbnailPrompt(
    persona: Persona,
    project: Project,
    style: string
  ): {
    basePrompt: string
    loraConfig: { path: string, scale: number }
    negativePrompt: string
  }
  
  // GPT-5 smart prompt generation
  static async generateSmartPrompt(
    persona: Persona,
    contentAnalysis: ContentAnalysis
  ): Promise<string>
  
  // Iterate based on user feedback
  static async improvePrompt(
    currentPrompt: string,
    feedback: string,
    persona: Persona
  ): Promise<string>
}
```

## 7. UI Components & User Experience

### 7.1 Persona Management Interface

**Global Context**: `src/contexts/persona-context.tsx`
- Centralized persona state management
- LocalStorage persistence
- Import/export functionality
- Usage tracking

**Key Features**:
- Create multiple personas
- Set default persona
- Edit descriptions and tags
- Track usage statistics
- Delete with confirmation

### 7.2 Persona Profile Tab (NEW)

**Location**: `/profile/personas` or as tab in user profile page
**Component**: `src/components/profile/persona-tab.tsx`

#### UI/UX Features:

1. **Persona Gallery Display**:
   - 5 sample images generated with the trained LoRA
   - Grid layout (2x2 + 1 large hero image)
   - Each image shows different styles/contexts:
     - Professional headshot
     - Casual portrait
     - YouTube thumbnail style
     - Social media profile
     - Creative/artistic style

2. **Persona Information Panel**:
   - Persona name and description
   - Training date and status
   - Number of photos used
   - Trigger phrase display
   - Usage statistics (times used in content)

3. **Retrain Options**:
   ```
   UI Message: "Don't like the persona we trained? 
   Retrain up to 3 times for free, or reach out to 
   support for free guidance!"
   ```
   - Retrain button (disabled after 3 attempts)
   - Remaining attempts counter
   - Support contact link
   - Upload new photos option

4. **Sample Generation Status**:
   - Loading states for each sample
   - Regenerate individual samples
   - Download samples as pack

#### Database Schema Update:
```sql
ALTER TABLE personas ADD COLUMN retrain_count INTEGER DEFAULT 0;
ALTER TABLE personas ADD COLUMN sample_images JSONB DEFAULT '[]';
ALTER TABLE personas ADD COLUMN last_retrained_at TIMESTAMPTZ;
```

### 7.3 Content Generation UI

### 7.3 Enhanced Avatar Training Component Integration

**Existing Component**: `src/components/onboarding/ai-avatar-training.tsx`

#### New Features to Add:

1. **After Photo Upload (Line ~650)**:
```typescript
// Add approval flow after minimum photos reached
if (photos.length >= minPhotos && !hasShownApproval) {
  setShowApprovalDialog(true)
  
  // Generate preview samples
  const samples = await generatePreviewSamples(photos)
  setSampleImages(samples)
  
  // Get GPT-5 analysis
  const analysis = await PersonaValidationService.analyzePersonaPhotos(photos)
  setPhotoAnalysis(analysis)
}
```

2. **Approval Dialog Component**:
```typescript
// New component to integrate
<PersonaApprovalDialog
  open={showApprovalDialog}
  photos={photos}
  samples={sampleImages}
  analysis={photoAnalysis}
  onApprove={handleApproveAndTrain}
  onReject={handleRejectAndReupload}
  onFeedback={handleUserFeedback}
/>
```

3. **Training Initiation Enhancement**:
```typescript
// Modify existing handleComplete function
const handleComplete = async () => {
  if (!approvalReceived) {
    // Show approval flow first
    await showApprovalFlow()
    return
  }
  
  // Existing training logic...
  onComplete(photos)
}
```

**Thumbnail Creator**:
- Persona selector dropdown
- Photo gallery viewer
- Real-time preview
- Style customization
- Batch generation support

**Social Graphics Generator**:
- Persona toggle switch
- Platform-specific previews
- Brand integration
- Schedule optimization

## 8. API Endpoints Summary

### Persona Management
- `POST /api/onboarding/upload-photos` - Initial photo upload
- `GET /api/onboarding/upload-photos` - Retrieve personas
- **NEW**: `POST /api/personas/analyze-photos` - GPT-5 photo analysis
- **NEW**: `POST /api/personas/generate-samples` - Preview generation
- `POST /api/personas/prepare-training-images` - Create training ZIP
- `POST /api/personas/train-lora` - Start LoRA training
- `GET /api/personas/train-lora` - Check training status
- `GET /api/personas/check-config` - Verify FAL.ai setup
- **NEW**: `POST /api/personas/approve-training` - Record approval
- **NEW**: `POST /api/personas/generate-display-samples` - Generate 5 display samples
- **NEW**: `POST /api/personas/retrain` - Initiate retrain with new photos
- **NEW**: `GET /api/personas/retrain-status` - Check remaining retrain attempts

### Content Generation
- `POST /api/generate-thumbnail` - Create thumbnails with persona
- **ENHANCED**: Now uses GPT-5 for smart prompt generation
- `POST /api/generate-images` - Social graphics with persona  
- **ENHANCED**: Better GPT-Image-1 integration with personas
- `POST /api/generate-professional-photos` - Business headshots
- `POST /api/generate-thumbnail/batch` - Bulk thumbnail creation
- **NEW**: `POST /api/generate-thumbnail/iterate` - Improve with feedback

## 9. Performance & Optimization

### 8.1 Image Processing
- Client-side compression before upload
- Progressive JPEG encoding
- WebP format support
- Lazy loading in galleries
- CDN distribution via Supabase

### 8.2 Training Optimization
- Automatic quality filtering
- Batch processing support
- Incremental training capability
- Resume from checkpoint option

### 8.3 Generation Optimization
- LoRA model caching
- Parallel generation requests
- Quality/speed presets
- Progressive enhancement

## 10. Security & Privacy

### 9.1 Data Protection
- Row-level security (RLS) on all tables
- User-scoped storage buckets
- Signed URLs for temporary access
- Encrypted data transmission

### 9.2 Consent & Rights
- Explicit consent during onboarding
- Clear data usage policies
- User-controlled deletion
- Export functionality for portability

## 11. Persona Display & Retrain Workflow (NEW)

### 11.1 Generating Display Samples

After successful LoRA training, generate 5 showcase samples:

```typescript
// API: /api/personas/generate-display-samples
async function generatePersonaDisplaySamples(personaId: string) {
  const persona = await getPersona(personaId)
  
  const samplePrompts = [
    {
      style: 'professional_headshot',
      prompt: `${persona.lora_trigger_phrase}, professional headshot, 
               studio lighting, business attire, neutral background`
    },
    {
      style: 'casual_portrait',
      prompt: `${persona.lora_trigger_phrase}, casual portrait, 
               natural lighting, relaxed pose, outdoor setting`
    },
    {
      style: 'youtube_thumbnail',
      prompt: `${persona.lora_trigger_phrase}, YouTube thumbnail style,
               excited expression, vibrant background, high energy`
    },
    {
      style: 'social_media_profile',
      prompt: `${persona.lora_trigger_phrase}, social media profile photo,
               friendly smile, approachable, modern setting`
    },
    {
      style: 'creative_artistic',
      prompt: `${persona.lora_trigger_phrase}, artistic portrait,
               creative lighting, unique angle, stylized`
    }
  ]
  
  const samples = await Promise.all(
    samplePrompts.map(async ({ style, prompt }) => {
      const result = await fal.subscribe('fal-ai/flux-lora', {
        input: {
          prompt,
          loras: [{
            path: persona.lora_model_url,
            scale: 1.0
          }],
          image_size: { width: 1024, height: 1024 }
        }
      })
      
      return {
        style,
        url: result.data.images[0].url,
        prompt
      }
    })
  )
  
  // Store samples in database
  await updatePersona(personaId, {
    sample_images: samples
  })
  
  return samples
}
```

### 11.2 Retrain Workflow

```typescript
// Check retrain eligibility
async function checkRetrainEligibility(personaId: string) {
  const persona = await getPersona(personaId)
  
  return {
    canRetrain: persona.retrain_count < 3,
    remainingAttempts: 3 - persona.retrain_count,
    lastRetrainedAt: persona.last_retrained_at
  }
}

// Initiate retrain
async function retrainPersona(personaId: string, newPhotos: File[]) {
  const eligibility = await checkRetrainEligibility(personaId)
  
  if (!eligibility.canRetrain) {
    throw new Error('Maximum retrain attempts reached. Please contact support.')
  }
  
  // Upload new photos
  const uploadedPhotos = await uploadPersonaPhotos(newPhotos)
  
  // Start new training
  const trainingJob = await startLoRATraining({
    photos: uploadedPhotos,
    personaId,
    isRetrain: true
  })
  
  // Update retrain count
  await updatePersona(personaId, {
    retrain_count: persona.retrain_count + 1,
    last_retrained_at: new Date(),
    status: 'retraining'
  })
  
  return trainingJob
}
```

### 11.3 Profile Tab Implementation

```typescript
// Component: PersonaProfileTab.tsx
export function PersonaProfileTab({ userId }: { userId: string }) {
  const [persona, setPersona] = useState<Persona | null>(null)
  const [samples, setSamples] = useState<PersonaSample[]>([])
  const [retrainEligibility, setRetrainEligibility] = useState<RetrainStatus>()
  
  // Fetch persona and samples
  useEffect(() => {
    fetchPersonaWithSamples(userId).then(data => {
      setPersona(data.persona)
      setSamples(data.samples)
      setRetrainEligibility(data.retrainStatus)
    })
  }, [userId])
  
  return (
    <div className="persona-profile-tab">
      {/* Hero Section with Main Sample */}
      <div className="hero-sample">
        <img src={samples[0]?.url} alt="Main persona preview" />
      </div>
      
      {/* Grid of 4 Additional Samples */}
      <div className="samples-grid">
        {samples.slice(1).map((sample, i) => (
          <div key={i} className="sample-card">
            <img src={sample.url} alt={sample.style} />
            <span className="sample-label">{sample.style}</span>
          </div>
        ))}
      </div>
      
      {/* Retrain Section */}
      <div className="retrain-section">
        {retrainEligibility?.canRetrain ? (
          <>
            <p>Don't like the persona we trained?</p>
            <p>Retrain up to 3 times for free, or reach out to support for free guidance!</p>
            <Button onClick={handleRetrain}>
              Retrain Persona ({retrainEligibility.remainingAttempts} attempts left)
            </Button>
          </>
        ) : (
          <>
            <p>Maximum retrain attempts reached.</p>
            <Button onClick={contactSupport}>
              Contact Support for Guidance
            </Button>
          </>
        )}
      </div>
      
      {/* Persona Info */}
      <div className="persona-info">
        <h3>{persona?.name}</h3>
        <p>Trigger: {persona?.metadata?.lora_trigger_phrase}</p>
        <p>Trained: {formatDate(persona?.created_at)}</p>
        <p>Photos used: {persona?.metadata?.photo_count}</p>
      </div>
    </div>
  )
}
```

## 12. Enhanced Workflow Examples

### 11.1 Complete Persona Creation Flow

```typescript
// 1. Upload photos
const photos = await captureOrUploadPhotos()

// 2. Analyze with GPT-5
const analysis = await PersonaValidationService.analyzePersonaPhotos(photos)

if (!analysis.readyForTraining) {
  // Show feedback and request better photos
  showFeedback(analysis.suggestions)
  return
}

// 3. Generate preview samples
const samples = await fetch('/api/personas/generate-samples', {
  method: 'POST',
  body: JSON.stringify({ 
    personaPhotos: photos,
    personaName: userName 
  })
})

// 4. Get user approval
const approved = await showApprovalDialog(samples)

if (!approved) {
  // Collect feedback and retry
  const feedback = await collectUserFeedback()
  // Process feedback with GPT-5
  const improvements = await processUserFeedback(feedback)
  return
}

// 5. Train LoRA model
const persona = await PersonaService.startTraining(photos)

// 6. Monitor progress
await PersonaService.monitorTrainingProgress(
  persona.trainingJobId,
  onProgress,
  onComplete
)
```

### 11.2 Thumbnail Generation with Persona

```typescript
// 1. Get persona and content analysis
const persona = await PersonaService.getDefaultPersona(userId)
const contentAnalysis = project.content_analysis

// 2. Generate smart prompt with GPT-5
const smartPrompt = await ThumbnailPromptService.generateSmartPrompt(
  persona,
  contentAnalysis
)

// 3. Generate thumbnail with LoRA
const result = await fal.subscribe('fal-ai/flux-lora', {
  input: {
    prompt: smartPrompt,
    loras: [{
      path: persona.lora_model_url,
      scale: 1.0
    }],
    image_size: { width: 1920, height: 1080 },
    negative_prompt: 'blurry, distorted'
  }
})

// 4. If user wants changes
if (userFeedback) {
  const improvedPrompt = await ThumbnailPromptService.improvePrompt(
    smartPrompt,
    userFeedback,
    persona
  )
  // Regenerate with improved prompt
}
```

## 12. Current Limitations & Future Enhancements

### 12.1 Current Limitations
- Single persona training at a time
- 10-30 minute training duration
- Manual photo selection required
- Limited style customization post-training

### 12.2 Planned Enhancements
1. **Multiple Persona Support**
   - Family/team member personas
   - Different styles per persona
   - Persona mixing capabilities

2. **Advanced Training**
   - Video-based training
   - Voice cloning integration
   - Expression mapping
   - Age progression/regression

3. **Smart Features**
   - Auto-photo selection from galleries
   - Quality enhancement preprocessing
   - Background removal/replacement
   - Lighting correction

4. **Platform Integrations**
   - Direct social media publishing
   - Canva/Figma plugins
   - Adobe Creative Suite integration
   - Zapier automation

5. **Business Features**
   - Team collaboration
   - Brand consistency enforcement
   - Usage analytics dashboard
   - A/B testing capabilities

## 13. Troubleshooting Guide

### Common Issues & Solutions

#### Training Failures
- **Insufficient Photos**: Ensure minimum 5 photos uploaded
- **Poor Quality**: Check quality scores, replace low-scoring images
- **Timeout**: Retry training, check FAL.ai status
- **API Errors**: Verify FAL_API_KEY configuration

#### Generation Issues
- **Persona Not Appearing**: Verify LoRA model URL accessibility
- **Poor Likeness**: Retrain with better photos, adjust trigger phrase
- **Style Inconsistency**: Use consistent prompts, adjust guidance scale

#### Storage Problems
- **Upload Failures**: Check file size/format, network connection
- **Missing Images**: Verify bucket permissions, check URLs
- **Quota Exceeded**: Clean up old personas, upgrade storage plan

## 14. Development Setup

### Environment Variables
```env
# FAL.ai Configuration
FAL_API_KEY=your_fal_api_key
FAL_KEY=your_fal_key

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# OpenAI (for GPT-Image)
OPENAI_API_KEY=your_openai_key
```

### Database Migrations
```bash
# Run in order:
1. setup-persona-storage.sql
2. add-persona-lora-storage.sql
3. add-onboarding-progress.sql
```

### Testing Personas
```bash
# Test endpoints
npm run test:personas

# Test training pipeline
npm run test:lora-training

# Test generation
npm run test:persona-generation
```

## 15. Migration Path for Existing Implementation

### 15.1 Required Changes

1. **Add Approval Flow to AI Avatar Training**:
   - Integrate approval dialog after photo upload
   - Add preview generation before training
   - Implement feedback collection

2. **Create New Services**:
   - `PersonaValidationService` for GPT-5 analysis
   - `ThumbnailPromptService` for smart prompts
   - Sample generation endpoints

3. **Update APIs**:
   - Enhance thumbnail generation with GPT-5
   - Add approval tracking to database
   - Implement feedback processing

4. **Database Updates**:
   - Add approval_status to personas table
   - Store user feedback and iterations
   - Track preview generation history

### 15.2 Backward Compatibility

- Existing personas continue to work
- Optional approval flow (can be skipped)
- Gradual rollout with feature flags
- Legacy prompt generation as fallback

## Conclusion

The Inflio Persona System represents a comprehensive implementation of AI-powered personalization, seamlessly integrating photo capture, model training, and content generation. The system leverages cutting-edge AI models (FLUX, GPT-Image) while maintaining user privacy and providing an intuitive experience. The modular architecture allows for easy expansion and enhancement while the robust infrastructure ensures reliability and performance at scale.

This implementation provides users with unprecedented ability to create professional, personalized content featuring their likeness, revolutionizing content creation for personal branding, marketing, and social media presence.
