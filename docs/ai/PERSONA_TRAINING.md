# Persona Training Guide - Inflio Platform

## Overview

Personas are custom-trained LoRA (Low-Rank Adaptation) models that capture a user's facial features, enabling consistent, authentic representation in AI-generated content. This creates a powerful personal branding tool for content creators.

## What is a Persona?

A Persona is:
- **Facial Model**: AI representation of the user's face
- **Trigger Word**: The persona name that activates the model
- **Brand Asset**: Consistent visual identity across content
- **Privacy-First**: Stored securely, never shared

## Training Requirements

### Photo Requirements

#### Minimum Specifications
- **Count**: 5 photos minimum
- **Resolution**: 512×512 pixels minimum
- **Format**: JPEG or PNG
- **File Size**: 500KB - 10MB per image
- **Quality**: Clear, well-lit, in focus

#### Recommended Specifications
- **Count**: 10-20 photos optimal
- **Resolution**: 1024×1024 pixels or higher
- **Variety**: Different angles, expressions, lighting
- **Backgrounds**: Varied, non-distracting
- **Consistency**: Same person, recent photos

### Photo Guidelines

#### ✅ Good Photos Include:
- **Front-facing** portraits
- **3/4 angle** views
- **Profile** shots
- **Different expressions** (smile, serious, laughing)
- **Various lighting** (natural, studio, indoor)
- **Different distances** (close-up, medium, full)
- **Authentic moments** (candid shots)

#### ❌ Avoid:
- Blurry or out-of-focus images
- Heavy filters or editing
- Obstructed face (sunglasses, masks)
- Group photos (unless clearly identified)
- Extreme angles or distortion
- Poor lighting (too dark/bright)
- Old photos (>2 years)

### Quality Scoring System

```typescript
interface PhotoQualityScore {
  resolution: number      // 0-100 based on dimensions
  sharpness: number      // 0-100 blur detection
  lighting: number       // 0-100 exposure analysis
  face_detection: number // 0-100 confidence
  overall: number        // Weighted average
}

function scorePhoto(image: ImageData): PhotoQualityScore {
  return {
    resolution: scoreResolution(image.width, image.height),
    sharpness: detectBlur(image),
    lighting: analyzeExposure(image),
    face_detection: detectFace(image),
    overall: calculateOverallScore(...)
  }
}
```

## Training Process

### Step 1: Data Collection

```typescript
interface PersonaTrainingData {
  userId: string
  personaName: string  // Becomes trigger word
  photos: {
    url: string
    quality_score: number
    is_primary: boolean
    metadata: {
      width: number
      height: number
      face_bounds: Rectangle
    }
  }[]
  consent: {
    agreed: boolean
    timestamp: string
    ip_address: string
  }
}
```

### Step 2: Preprocessing

1. **Face Detection & Alignment**
```python
# Detect and align faces
for photo in photos:
    face = detect_face(photo)
    aligned = align_face(face)
    cropped = crop_to_square(aligned, padding=0.2)
    normalized = normalize_lighting(cropped)
```

2. **Dataset Augmentation**
```python
# Generate variations for robust training
augmentations = [
    RandomBrightness(0.8, 1.2),
    RandomContrast(0.8, 1.2),
    RandomHorizontalFlip(0.5),
    RandomRotation(-5, 5),
    RandomCrop(0.9, 1.0)
]
```

3. **Quality Filtering**
```python
# Remove low-quality images
filtered_photos = [
    photo for photo in photos 
    if photo.quality_score > 0.7
]
```

### Step 3: LoRA Training

#### Training Configuration
```json
{
  "model_base": "flux-dev",
  "training_steps": 1000,
  "learning_rate": 1e-4,
  "batch_size": 4,
  "rank": 16,
  "alpha": 16,
  "dropout": 0.1,
  "optimizer": "adamw",
  "scheduler": "cosine",
  "mixed_precision": "fp16",
  "gradient_checkpointing": true
}
```

#### Training Pipeline
```typescript
async function trainPersona(data: PersonaTrainingData): Promise<PersonaModel> {
  // 1. Upload photos to training service
  const datasetId = await uploadTrainingDataset(data.photos)
  
  // 2. Initialize training job
  const jobId = await fal.training.create({
    dataset_id: datasetId,
    base_model: 'flux-dev',
    trigger_word: data.personaName,
    config: TRAINING_CONFIG
  })
  
  // 3. Monitor training progress
  const model = await pollTrainingStatus(jobId)
  
  // 4. Validate trained model
  const validation = await validatePersonaModel(model)
  
  // 5. Store model reference
  if (validation.passed) {
    return savePersonaModel(model, data.userId)
  }
  
  throw new Error('Training validation failed')
}
```

### Step 4: Validation

#### Automatic Quality Checks
```typescript
async function validatePersonaModel(model: TrainedModel): Promise<ValidationResult> {
  // Generate test images
  const testPrompts = [
    `${model.trigger_word} professional headshot`,
    `${model.trigger_word} casual portrait`,
    `${model.trigger_word} speaking at conference`
  ]
  
  const testImages = await generateTestImages(model, testPrompts)
  
  // Run quality checks
  const checks = {
    face_consistency: checkFaceConsistency(testImages),
    quality_score: assessImageQuality(testImages),
    trigger_effectiveness: verifyTriggerWord(testImages)
  }
  
  return {
    passed: Object.values(checks).every(c => c > 0.8),
    scores: checks,
    sample_images: testImages
  }
}
```

### Step 5: Deployment

```typescript
interface DeployedPersona {
  id: string
  userId: string
  name: string          // Display name
  trigger_word: string  // Activation word
  model_ref: string     // Model storage path
  version: number
  status: 'training' | 'validating' | 'ready' | 'failed'
  training_metadata: {
    photos_used: number
    training_time_minutes: number
    quality_score: number
  }
  created_at: string
  updated_at: string
}
```

## Data Model

### Database Schema

```sql
-- Personas table
CREATE TABLE personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name VARCHAR(100) NOT NULL,  -- Display name
  trigger_word VARCHAR(50) UNIQUE NOT NULL,  -- Must be unique
  status VARCHAR(20) DEFAULT 'pending',
  model_ref TEXT,  -- Storage path to LoRA weights
  version INTEGER DEFAULT 1,
  quality_score FLOAT,
  training_started_at TIMESTAMP,
  training_completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Persona images table
CREATE TABLE persona_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  storage_path TEXT,
  quality_score FLOAT,
  is_primary BOOLEAN DEFAULT FALSE,
  face_detected BOOLEAN,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Training jobs table
CREATE TABLE persona_training_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL,  -- External training service ID
  status VARCHAR(20) DEFAULT 'queued',
  progress INTEGER DEFAULT 0,
  error_message TEXT,
  config JSONB,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Usage in Generation

### Trigger Word System

The trigger word is the persona name that activates the trained model:

```typescript
// No need to type trigger word after training
const generationParams = {
  prompt: "professional headshot in modern office",
  loras: [{
    path: persona.model_ref,  // e.g., "users/123/john_doe_v1"
    scale: 0.6  // Blend strength
  }]
  // Trigger word is embedded in the LoRA model
}
```

### Integration Examples

#### Thumbnail Generation with Persona
```typescript
async function generateThumbnailWithPersona(
  prompt: string,
  personaId: string,
  blendStrength: number = 0.5
): Promise<GeneratedImage> {
  const persona = await getPersona(personaId)
  
  if (persona.status !== 'ready') {
    throw new Error('Persona not ready')
  }
  
  return await fal.generate({
    model: 'flux-dev',
    prompt: enhancePromptForPersona(prompt, persona),
    loras: [{
      path: persona.model_ref,
      scale: blendStrength
    }],
    // ... other params
  })
}
```

#### Social Post with Persona
```typescript
async function generateSocialGraphic(
  content: ContentContext,
  personaId: string,
  platform: string
): Promise<SocialGraphic> {
  const persona = await getPersona(personaId)
  
  // Build persona-aware prompt
  const prompt = `${content.description}, 
                  professional social media graphic,
                  ${PLATFORM_SPECS[platform].style}`
  
  // Generate with persona
  const image = await generateWithPersona(prompt, persona, 0.7)
  
  return {
    url: image.url,
    platform,
    persona_used: true,
    persona_id: personaId
  }
}
```

## Privacy & Consent

### User Consent Requirements

```typescript
interface PersonaConsent {
  user_id: string
  agreed_to_terms: boolean
  consent_items: {
    facial_recognition: boolean
    ai_training: boolean
    likeness_usage: boolean
    data_retention: boolean
  }
  restrictions?: {
    no_commercial_use?: boolean
    no_third_party?: boolean
    time_limit_days?: number
  }
  signed_at: string
  ip_address: string
  user_agent: string
}
```

### Data Protection

1. **Encryption**: All photos encrypted at rest
2. **Access Control**: Strict user-only access
3. **Deletion Rights**: Complete removal on request
4. **No Sharing**: Models never shared between accounts
5. **Audit Trail**: All access logged

### GDPR Compliance

```typescript
async function handlePersonaDeletion(userId: string): Promise<void> {
  // 1. Stop any active training
  await cancelActiveTraining(userId)
  
  // 2. Delete model files
  await deleteModelFiles(userId)
  
  // 3. Remove from storage
  await deletePersonaPhotos(userId)
  
  // 4. Clear database records
  await deletePersonaRecords(userId)
  
  // 5. Log deletion
  await auditLog('persona.deleted', { userId, timestamp: new Date() })
}
```

## Best Practices

### Training Tips

1. **Photo Diversity**: Include various angles and expressions
2. **Consistent Identity**: Recent photos of same appearance
3. **Good Lighting**: Natural light preferred
4. **Multiple Outfits**: Helps model generalize
5. **Clear Face**: No obstructions or heavy makeup

### Usage Guidelines

1. **Blend Strength**: Start at 0.5, adjust based on results
2. **Prompt Clarity**: Be specific about desired output
3. **Platform Matching**: Use appropriate style for platform
4. **Version Control**: Keep older versions for comparison
5. **Regular Updates**: Retrain annually or after major changes

### Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Face not recognizable | Low blend strength | Increase LoRA scale to 0.7-0.8 |
| Distorted features | Too high blend | Reduce LoRA scale to 0.3-0.4 |
| Inconsistent results | Poor training data | Add more diverse photos |
| Wrong person appearing | Trigger word conflict | Use unique trigger word |
| Slow generation | High-res + persona | Use lower resolution first |

## Cost & Performance

### Training Costs

| Tier | Photos | Training Time | Cost | Quality |
|------|--------|---------------|------|---------|
| Basic | 5-10 | 15 minutes | $5 | Good |
| Standard | 10-15 | 25 minutes | $10 | Better |
| Premium | 15-20 | 35 minutes | $15 | Best |

### Generation Performance

```typescript
// Performance impact of persona usage
const performanceMetrics = {
  without_persona: {
    generation_time: 15, // seconds
    cost: 0.02 // dollars
  },
  with_persona: {
    generation_time: 18, // seconds (+20%)
    cost: 0.025 // dollars (+25%)
  }
}
```

## API Reference

### Training Endpoints

```typescript
// POST /api/personas/train
{
  name: string,
  photos: File[],
  consent: ConsentObject
}

// GET /api/personas/:id/status
{
  status: 'training' | 'ready' | 'failed',
  progress: number,
  estimated_time_remaining: number
}

// DELETE /api/personas/:id
// Deletes persona and all associated data
```

### Usage Endpoints

```typescript
// POST /api/generate-with-persona
{
  prompt: string,
  persona_id: string,
  blend_strength: number,
  platform: string
}

// GET /api/personas
// List all user personas
{
  personas: Persona[],
  total: number
}
```

## Future Enhancements

### Planned Features

1. **Voice Cloning**: Match voice to persona
2. **Video Personas**: Animated personas
3. **Style Transfer**: Apply persona style without face
4. **Multi-Person**: Scenes with multiple personas
5. **Age Progression**: Adjust apparent age