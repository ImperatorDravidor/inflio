# AI Posts with Persona LoRA Training

## Overview

The enhanced Posts feature now includes:
- **Persona LoRA Training**: Train custom AI models using your photos
- **Intelligent Post Generation**: Create purpose-driven social media posts with personalized images
- **End-to-End Publishing**: From generation to staging to social media

## Setup Requirements

### 1. Environment Variables

Add these to your `.env.local`:

```bash
# FAL.ai API Key (required for image generation)
FAL_API_KEY=your_fal_api_key_here

# Existing requirements
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Database Migrations

Run the following migrations in order:

1. `migrations/posts-feature-mvp.sql` - Core posts tables
2. `migrations/add-persona-lora-storage.sql` - LoRA training support

```sql
-- Run in Supabase SQL editor
-- First migration creates post tables
-- Second migration adds LoRA storage to personas
```

### 3. Install Dependencies

```bash
npm install
```

## Feature Workflow

### Step 1: Train Your Persona LoRA

1. **Upload Photos** (3-10 images recommended)
   - High-quality portraits work best
   - Varied angles and expressions
   - Good lighting

2. **API Endpoint**: `/api/personas/prepare-training-images`
   ```javascript
   const response = await fetch('/api/personas/prepare-training-images', {
     method: 'POST',
     body: JSON.stringify({
       personaId: 'your-persona-id',
       images: [
         { url: 'https://...image1.jpg', caption: 'professional headshot of [trigger]' },
         { url: 'https://...image2.jpg', caption: 'portrait of [trigger] smiling' },
         // ... more images
       ],
       triggerWord: 'john doe' // Your name or identifier
     })
   })
   ```

3. **Start Training**: `/api/personas/train-lora`
   ```javascript
   const { trainingDataUrl } = await prepareResponse.json()
   
   const trainResponse = await fetch('/api/personas/train-lora', {
     method: 'POST',
     body: JSON.stringify({
       personaId: 'your-persona-id',
       imagesDataUrl: trainingDataUrl,
       triggerPhrase: 'photo of john doe',
       steps: 2500 // 10-30 minutes training time
     })
   })
   ```

4. **Check Status**: Training takes 10-30 minutes
   ```javascript
   const status = await fetch(`/api/personas/train-lora?jobId=${jobId}`)
   ```

### Step 2: Generate Intelligent Posts

Once your LoRA is trained, posts will automatically use your personalized model:

1. **Generate Posts** with your persona selected
2. **Images will feature YOU** in professional, context-appropriate scenes
3. **Content is purpose-driven** with clear messaging

Example generated post types:

#### Carousel Post (LinkedIn)
- **Slide 1**: Hook image with you + bold statement
- **Slide 2-4**: Educational content with branded visuals
- **Slide 5**: CTA with your professional photo

#### Quote Card (Instagram)
- Your photo with inspirational quote overlay
- Branded colors and typography
- Platform-optimized dimensions

#### Thread (Twitter/X)
- Text thread with 1-2 supporting images
- Your headshot for credibility
- Engagement-optimized hooks

### Step 3: Review & Edit

- **Preview** generated posts across platforms
- **Edit** captions, hashtags, CTAs
- **Regenerate** with feedback if needed
- **Download** images for manual posting

### Step 4: Approve & Stage

- **Approve** posts to move to staging
- **Schedule** for optimal times
- **Bulk publish** across platforms

## Technical Architecture

### Image Generation Pipeline

```typescript
// 1. Content Analysis → AI generates targeted prompts
const contentIdea = await generateContentIdea({
  contentType: 'carousel',
  contentAnalysis: videoAnalysis,
  projectTitle: 'Your Video Title'
})

// 2. Flux generates images with your LoRA
const imageUrl = await FALService.generateWithPersona(
  prompt: contentIdea.prompt,
  loraUrl: persona.lora_model_url,
  options: {
    aspectRatio: '4:5', // Instagram
    guidanceScale: 3.5,
    numInferenceSteps: 28
  }
)

// 3. Platform-specific optimization
const copyVariants = await generatePlatformCopy({
  contentIdea,
  platforms: ['instagram', 'linkedin', 'twitter']
})
```

### LoRA Training Process

1. **Image Preparation**
   - Converts to ZIP archive
   - Adds caption files with trigger phrases
   - Uploads to secure storage

2. **FAL.ai Training**
   - Uses `flux-lora-portrait-trainer` model
   - Optimized for portraits
   - 2500 steps (~20 min)
   - Learning rate: 0.00009

3. **Model Storage**
   - LoRA weights URL stored with persona
   - Automatic loading during generation
   - Trigger phrase preservation

## Content Strategy

### Purpose-Driven Posts

Each post type serves a specific purpose:

- **Educational Carousels**: Teach concepts, share insights
- **Quote Cards**: Inspire and motivate audience
- **Hook Images**: Stop the scroll, generate curiosity
- **Threads**: Deep dive into topics, build authority
- **CTAs**: Drive specific actions (sign up, watch, buy)

### Engagement Optimization

- **Hook in first 3 seconds** (or 7 words)
- **Pattern interrupts** to maintain attention
- **Social proof** and FOMO triggers
- **Clear value propositions**
- **Platform-specific best practices**

## API Reference

### Posts Generation

**Generate Smart Posts**
```http
POST /api/posts/generate-smart
{
  "projectId": "uuid",
  "projectTitle": "string",
  "contentAnalysis": {},
  "transcript": "string",
  "settings": {
    "contentTypes": ["carousel", "quote", "single"],
    "platforms": ["instagram", "twitter", "linkedin"],
    "creativity": 0.7,
    "tone": "professional",
    "usePersona": true,
    "selectedPersonaId": "uuid"
  }
}
```

**Regenerate with Feedback**
```http
POST /api/posts/regenerate
{
  "suggestionId": "uuid",
  "feedback": "Make it more casual and add humor"
}
```

### LoRA Training

**Prepare Training Data**
```http
POST /api/personas/prepare-training-images
{
  "personaId": "uuid",
  "images": [
    { "url": "string", "caption": "optional" }
  ],
  "triggerWord": "[trigger]"
}
```

**Start Training**
```http
POST /api/personas/train-lora
{
  "personaId": "uuid",
  "imagesDataUrl": "string",
  "triggerPhrase": "photo of person",
  "steps": 2500
}
```

**Check Status**
```http
GET /api/personas/train-lora?jobId=uuid
```

## Best Practices

### For LoRA Training

1. **Image Quality**
   - Use high-resolution photos (1024x1024+)
   - Good lighting, sharp focus
   - Varied backgrounds and angles

2. **Quantity**
   - Minimum: 3 images
   - Recommended: 5-10 images
   - Maximum: 20 images

3. **Captions**
   - Include trigger phrase consistently
   - Describe the scene/pose
   - Example: "photo of [trigger] speaking at conference"

### For Post Generation

1. **Content Analysis First**
   - Ensure video has been fully analyzed
   - Key moments and topics extracted
   - Sentiment and mood identified

2. **Platform Selection**
   - Choose platforms based on content type
   - Carousels → LinkedIn/Instagram
   - Threads → Twitter/X
   - Videos → TikTok/YouTube Shorts

3. **Persona Usage**
   - Train LoRA before important campaigns
   - Use consistent trigger phrases
   - Update training with new photos periodically

## Troubleshooting

### LoRA Training Issues

**Problem**: Training fails immediately
- **Solution**: Check FAL_API_KEY is set correctly
- **Solution**: Ensure images are accessible URLs
- **Solution**: Verify ZIP file < 50MB

**Problem**: Poor quality generated images
- **Solution**: Use more training images (5-10)
- **Solution**: Improve image quality/lighting
- **Solution**: Increase training steps to 3000-4000

### Post Generation Issues

**Problem**: No images generated
- **Solution**: Check FAL_API_KEY configuration
- **Solution**: Verify persona has trained LoRA
- **Solution**: Check Supabase storage permissions

**Problem**: Generic content
- **Solution**: Improve content analysis quality
- **Solution**: Provide more specific transcript
- **Solution**: Adjust creativity parameter (0.7-0.9)

## Cost Considerations

### FAL.ai Pricing

- **Image Generation**: ~$0.025 per image
- **LoRA Training**: ~$0.50-1.00 per training session
- **Bulk discounts** available for high volume

### OpenAI Costs

- **GPT-5**: ~$0.01 per post suggestion
- **Content analysis**: ~$0.02 per video

## Future Enhancements

1. **Multi-persona Campaigns**: Generate content for team members
2. **Style Transfer**: Apply brand styles to all images
3. **Video Generation**: Create short-form videos with persona
4. **A/B Testing**: Automatic variant testing and optimization
5. **Analytics Integration**: Track post performance, iterate

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review environment variables
3. Ensure migrations are applied
4. Check API key validity

## Conclusion

The AI Posts feature with Persona LoRA training enables truly personalized, purpose-driven content at scale. By training custom models with your photos and combining them with intelligent content analysis, you can create authentic, engaging posts that drive real results.
