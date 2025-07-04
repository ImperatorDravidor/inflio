# Unified Content Generation System

The Unified Content Generation system allows you to create a complete content package with AI-powered suggestions, personas, and video snippets - all from a single interface.

## Overview

This system integrates:
- **AI Suggestions**: Pre-generated content ideas based on video analysis
- **Personas**: Add your personal brand to thumbnails and social graphics
- **Video Snippets**: Extract key moments from videos for visual content
- **Multi-Platform Support**: Create content optimized for YouTube, Instagram, LinkedIn, etc.

## Features

### 1. AI-Powered Content Suggestions

The system automatically generates content suggestions based on your video:

- **Thumbnails**: High-CTR YouTube thumbnails with personas
- **Social Graphics**: Platform-specific images (Instagram posts, LinkedIn graphics, etc.)
- **Blog Images**: Featured images and in-article graphics
- **Carousels**: Multi-slide educational content

Each suggestion includes:
- Detailed AI-generated prompts
- Platform-specific optimizations
- Relevance scores (1-10)
- Style recommendations

### 2. Persona Integration

#### Creating Personas
1. Upload 1-3 photos of yourself or your brand
2. Name your persona (e.g., "Professional Me", "Casual Style")
3. Save for reuse across all projects

#### Using Personas
- Select personas in the content generator
- AI will incorporate your likeness into thumbnails
- Maintains consistent brand identity

### 3. Video Snippet Integration

- Extract key moments from your video
- Use video frames as backgrounds
- Merge personas with video content
- Create dynamic, context-aware graphics

## How to Use

### Accessing the Unified Content Generator

1. Navigate to any project page
2. Click the **"Generate Content Package"** button
3. The unified content dialog will open

### Generating Content

1. **Review AI Suggestions**
   - Pre-generated suggestions appear automatically
   - Each has a relevance score
   - Select the ones you want to generate

2. **Customize Prompts** (Optional)
   - Click on any suggestion to expand it
   - Edit the prompt text
   - Choose different styles

3. **Enable Personas** (Optional)
   - Toggle "Use Persona"
   - Select from saved personas or upload new photos
   - AI will incorporate your likeness

4. **Extract Video Moments** (Optional)
   - Toggle "Use Video Moments"
   - Click "Extract Key Moments"
   - Select which moments to include

5. **Generate All Content**
   - Click "Generate All Content"
   - Progress updates show for each item
   - Results appear in your project

## Content Types

### Thumbnails
- YouTube-optimized (16:9 ratio)
- High contrast for visibility
- Bold text overlays
- Emotional expressions

### Social Graphics
- **Instagram**: Square posts, carousels, stories
- **LinkedIn**: Professional infographics
- **Twitter/X**: Eye-catching hook images
- **Facebook**: Community-focused visuals

### Blog Images
- Featured/hero images
- In-article infographics
- Social share previews
- Visual breakpoints

## Prompt Customization

### Available Styles
- **Modern**: Clean, contemporary design
- **Professional**: Corporate, trustworthy
- **Vibrant**: Bright, energetic colors
- **Minimal**: Simple, focused design
- **Corporate**: Business presentation style

### Customization Options
- Text overlays
- Brand colors
- Mood/atmosphere
- Platform-specific requirements

## Best Practices

### For Thumbnails
1. Use personas for recognition
2. Include emotional expressions
3. Add bold, readable text
4. Test different styles

### For Social Graphics
1. Match platform aesthetics
2. Use consistent branding
3. Include clear CTAs
4. Optimize for mobile viewing

### For Blog Images
1. Support article narrative
2. Break up long text sections
3. Include data visualizations
4. Maintain visual consistency

## API Integration

### Generate Unified Suggestions
```typescript
POST /api/generate-unified-suggestions
{
  "projectId": "project-id",
  "contentAnalysis": { /* optional override */ }
}
```

### Generate Images with Personas
```typescript
POST /api/generate-images
{
  "projectId": "project-id",
  "prompt": "custom prompt",
  "usePersona": true,
  "personaPhotos": ["base64..."],
  "useVideoSnippets": true,
  "videoSnippets": [{ timestamp: 30, thumbnailUrl: "..." }]
}
```

### Generate Enhanced Blog
```typescript
POST /api/generate-blog
{
  "projectId": "project-id",
  "enhancedContext": {
    "unifiedPrompt": "specific instructions",
    "includeVideoMoments": true,
    "selectedMoments": [{ timestamp: 45, description: "Key point" }]
  }
}
```

## Troubleshooting

### Persona Photos Not Working
- Ensure photos are clear and well-lit
- Face should be clearly visible
- Maximum 3 photos per persona
- JPEG/PNG format only

### Video Snippets Not Extracting
- Check video is fully processed
- Ensure browser supports video element
- Try refreshing the page
- Check console for errors

### AI Suggestions Not Loading
- Verify content analysis is complete
- Check network connection
- Review project has transcription
- Try regenerating suggestions

## Tips for Success

1. **Start with AI Suggestions**: They're optimized based on your content
2. **Mix and Match**: Combine personas with video snippets
3. **Platform First**: Always consider where content will be posted
4. **Iterate**: Generate multiple versions and A/B test
5. **Save Personas**: Build a library for consistent branding

## Future Enhancements

- Template library for common formats
- Batch processing for multiple platforms
- A/B testing integration
- Analytics tracking for generated content
- Brand kit integration 