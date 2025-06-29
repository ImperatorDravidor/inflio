# AI Thumbnail Generation Setup

This guide covers the setup and configuration of the AI-powered thumbnail generation feature in Inflio.

## Overview

The thumbnail generation feature uses two AI systems:
1. **GPT-4.1** - For intelligent thumbnail suggestions and content analysis
2. **FAL AI** - For actual image generation using Flux models

## Required Environment Variables

Add these to your `.env.local` file:

```env
# OpenAI API Key (for GPT-4.1 suggestions)
OPENAI_API_KEY=your_openai_api_key_here

# FAL AI Key (for image generation)
FAL_KEY=your_fal_key_here
```

## Features

### 1. AI Suggestions (GPT-4.1)
- Analyzes video content and generates 5 diverse thumbnail concepts
- Each suggestion includes:
  - Detailed image generation prompt
  - Emotional hook (curiosity, excitement, etc.)
  - Target audience
  - Recommended visual style
  - Text overlay suggestions
  - Clickability score (1-10)
  - Rationale for the concept

### 2. Image Generation (FAL AI)
- Uses Flux models for high-quality thumbnail generation
- Supports multiple modes:
  - **Generate**: Create new thumbnails from scratch
  - **Edit**: Refine existing thumbnails
- Features:
  - Video snippet integration (extracts 6 frames)
  - Personal photo uploads for personalized thumbnails
  - Multiple style presets
  - Quality selection (high/medium)
  - Generation history

### 3. Supported Styles
- **Photorealistic**: Natural, high-quality images
- **Corporate**: Clean, professional business aesthetic
- **Gradient**: Modern, vibrant color gradients
- **Flat Design**: Minimalist, clean vector style
- **Cyberpunk**: Futuristic, tech-focused aesthetic

## API Endpoints

### `/api/generate-thumbnail-suggestions`
Generates AI-powered thumbnail suggestions using GPT-4.1.

**Method**: POST  
**Body**:
```json
{
  "projectId": "project-uuid"
}
```

**Response**:
```json
{
  "success": true,
  "suggestions": [
    {
      "id": "ai-suggestion-0",
      "prompt": "YouTube thumbnail showing...",
      "emotion": "curiosity",
      "audience": "tech enthusiasts",
      "style": "gradient",
      "textOverlay": "MIND BLOWN",
      "colorScheme": "vibrant blues and purples",
      "clickabilityScore": 9,
      "rationale": "This creates a curiosity gap..."
    }
  ],
  "metadata": {
    "projectTitle": "Video Title",
    "generatedAt": "2024-01-01T00:00:00Z",
    "model": "gpt-4.1-2025-04-14"
  }
}
```

### `/api/generate-thumbnail`
Generates actual thumbnail images using FAL AI.

**Method**: POST  
**Body**:
```json
{
  "projectId": "project-uuid",
  "prompt": "Detailed prompt for thumbnail",
  "mode": "generate", // or "edit"
  "videoSnippets": [], // Optional: extracted video frames
  "personalPhotos": [], // Optional: user photos
  "referenceImageUrl": "", // Required for edit mode
  "style": "gradient",
  "quality": "high"
}
```

## Usage in Components

The `ThumbnailCreator` component provides a complete UI for:
1. Getting AI suggestions
2. Customizing prompts
3. Selecting video frames
4. Uploading personal photos
5. Generating thumbnails
6. Viewing generation history

Example usage:
```tsx
<ThumbnailCreator
  projectId={project.id}
  projectTitle={project.title}
  projectVideoUrl={project.video_url}
  contentAnalysis={project.content_analysis}
  currentThumbnail={project.thumbnail_url}
  onThumbnailUpdate={handleThumbnailUpdate}
/>
```

## Cost Considerations

- **GPT-4.1**: ~$0.01-0.02 per suggestion generation (5 suggestions)
- **FAL AI**: ~$0.10-0.20 per thumbnail generation (depending on quality)

## Best Practices

1. **Always check for API keys** before making requests
2. **Cache suggestions** to avoid repeated API calls
3. **Store generation history** for user reference
4. **Validate image uploads** (size, format, dimensions)
5. **Handle errors gracefully** with user-friendly messages

## Troubleshooting

### "Failed to generate suggestions"
- Check OpenAI API key is valid
- Ensure project has content analysis data
- Verify network connectivity

### "Failed to generate thumbnail"
- Check FAL AI key is valid
- Ensure prompt is not empty
- Verify image URLs are accessible

### Slow generation
- High quality mode takes longer (20-30 seconds)
- Consider using medium quality for faster results

## Future Enhancements

1. **Batch generation**: Generate multiple variations at once
2. **A/B testing**: Track thumbnail performance
3. **Template library**: Save and reuse successful thumbnails
4. **Auto-optimization**: Suggest improvements based on performance 