# Social Copy Generation System

## Overview
The social copy generation system creates platform-optimized content suggestions from video analysis. It generates 6+ types of content with persona support and platform-specific copy that respects character limits.

## Content Types
1. **Carousel** - Multi-slide image posts (3-10 slides)
2. **Quote** - Speaker quotes with branded design
3. **Single** - Single image with hook text
4. **Thread** - Multi-part text posts (Twitter/X threads)
5. **Reel** - Short-form video content ideas
6. **Story** - Ephemeral content suggestions

## Platform Support
- **Instagram**: Posts, Reels, Stories, Carousels
- **Twitter/X**: Tweets, Threads (280 char limit)
- **LinkedIn**: Articles, Posts (3000 char limit)
- **Facebook**: Posts, Stories
- **YouTube**: Shorts descriptions, Community posts
- **TikTok**: Video captions with trending hashtags

## Generation Flow

### 1. Content Analysis
```javascript
// Input from project
{
  projectId: "uuid",
  projectTitle: "Video Title",
  contentAnalysis: {
    topics: ["AI", "productivity"],
    keywords: ["automation", "efficiency"],
    mood: "educational",
    keyPoints: ["point1", "point2"],
    summary: "Video summary..."
  },
  transcript: "First 2000 chars...",
  personaId: "optional-persona-id"
}
```

### 2. Suggestion Generation
For each content type:
1. Generate content idea using GPT-4
2. Create platform-specific copy
3. Generate images if needed (Flux/DALL-E)
4. Calculate engagement predictions
5. Check platform eligibility

### 3. Platform Copy Schema
```json
{
  "instagram": {
    "caption": "Engaging caption...",
    "hashtags": ["#AI", "#Tech", "#Innovation"],
    "cta": "Link in bio for full video!",
    "altText": "Description for accessibility"
  },
  "twitter": {
    "tweet": "Hook text under 280 chars",
    "thread": ["Part 1...", "Part 2..."],
    "hashtags": ["#AI", "#Tech"]
  },
  "linkedin": {
    "title": "Professional Title",
    "body": "Detailed professional content...",
    "hashtags": ["#Leadership", "#Innovation"],
    "cta": "Share your thoughts below"
  }
}
```

## Platform Limits & Eligibility

### Character Limits
- Instagram: 2,200 chars, 30 hashtags max
- Twitter/X: 280 chars per tweet
- LinkedIn: 3,000 chars for posts
- Facebook: 63,206 chars (but keep under 500)
- YouTube: 5,000 chars for descriptions
- TikTok: 2,200 chars

### Image Requirements
- Instagram: Square (1:1), Portrait (4:5), Landscape (1.91:1)
- Twitter/X: 16:9, max 4 images
- LinkedIn: 1200x627px optimal
- Facebook: 1200x630px optimal

### Eligibility Rules
- Carousels: IG (3-10), LinkedIn (1-9), FB (2-10)
- Videos: All platforms except LinkedIn posts
- Threads: Twitter/X only
- Stories: IG, FB, YouTube only

## AI Prompt Templates

### Caption Generation
```
System: You are a social media expert. Generate platform-specific copy.

Input:
- Video: {title}
- Topics: {topics}
- Key Points: {keyPoints}
- Platform: {platform}
- Style: {captionStyle}

Requirements:
- Stay within {charLimit} characters
- Include {hashtagCount} relevant hashtags
- Add clear CTA if requested
- Match brand voice: {brandVoice}

Output JSON:
{
  "caption": "...",
  "hashtags": [...],
  "cta": "...",
  "hooks": [...]
}
```

### Image Prompt Generation
```
Create a {contentType} social media graphic:
- Topic: {mainTopic}
- Visual style: {style}
- Text overlay: "{hook}"
- Brand colors: {brandColors}
- Platform: {platform} ({dimensions})
- Include persona: {personaName}

Requirements:
- High contrast for mobile viewing
- Text-safe areas for overlays
- Eye-catching composition
- Brand consistency
```

## Engagement Prediction

### Scoring Factors
1. **Content Quality** (0-100)
   - Topic relevance
   - Keyword density
   - Emotional appeal
   - Clarity score

2. **Platform Fit** (0-100)
   - Format compatibility
   - Audience match
   - Timing relevance
   - Trend alignment

3. **Visual Impact** (0-100)
   - Thumbnail quality
   - Text readability
   - Color contrast
   - Composition balance

### Prediction Formula
```javascript
engagementScore = (
  contentQuality * 0.4 +
  platformFit * 0.3 +
  visualImpact * 0.3
) * platformMultiplier
```

## Persona Integration

### When Persona is Available
1. Use persona face in carousel covers
2. Add "by @personaName" attribution
3. Blend persona style with content
4. Generate first-person captions
5. Use persona's brand voice

### Fallback Strategy
1. Use project thumbnail
2. Generate abstract graphics
3. Focus on text-based designs
4. Use brand colors/logos

## API Endpoints

### POST /api/posts/generate
Generate batch suggestions:
```json
{
  "projectId": "uuid",
  "contentTypes": ["carousel", "quote", "single", "thread", "reel", "story"],
  "platforms": ["instagram", "twitter", "linkedin"],
  "settings": {
    "creativity": 0.7,
    "usePersona": true,
    "autoHashtags": true,
    "includeCTA": true
  }
}
```

### POST /api/posts/regenerate
Regenerate with feedback:
```json
{
  "suggestionId": "uuid",
  "feedback": "Make it more professional",
  "keepImages": true,
  "platforms": ["linkedin"]
}
```

### POST /api/posts/update-copy
Edit platform copy:
```json
{
  "suggestionId": "uuid",
  "platform": "instagram",
  "copy": {
    "caption": "Updated caption...",
    "hashtags": ["#new", "#tags"]
  }
}
```

### POST /api/posts/approve
Approve for staging:
```json
{
  "suggestionIds": ["uuid1", "uuid2"],
  "moveToStaging": true
}
```

## Quality Assurance

### Content Moderation
- Text toxicity check
- Hashtag appropriateness
- Link validation
- Copyright concerns
- Brand safety

### Performance Tracking
- Generation time: < 90s for 6 suggestions
- Image quality: 1080px minimum
- Copy accuracy: Platform limits respected
- Persona usage: When available
- Error rate: < 5%

## Database Schema

### post_suggestions
```sql
- id (UUID)
- project_id (UUID)
- user_id (TEXT)
- type (TEXT) - carousel|quote|single|thread|reel|story
- images (JSONB) - Array of image URLs
- platform_copy (JSONB) - Per-platform copy
- eligibility (JSONB) - Platform compatibility
- persona_id (UUID) - Optional persona
- status (TEXT) - suggested|edited|approved|staged
- version (INTEGER)
- parent_id (UUID) - For iterations
- metadata (JSONB) - Scores, prompts, settings
- created_at (TIMESTAMP)
```

### post_generation_jobs
```sql
- id (UUID)
- project_id (UUID)
- user_id (TEXT)
- job_type (TEXT)
- status (TEXT) - pending|running|completed|failed
- input_params (JSONB)
- total_items (INTEGER)
- completed_items (INTEGER)
- output_data (JSONB)
- error_message (TEXT)
- started_at (TIMESTAMP)
- completed_at (TIMESTAMP)
```

## Testing Checklist
- [x] Generate 6+ suggestions per project
- [x] Persona integration when available
- [x] Platform copy within limits
- [x] Image generation for visual posts
- [x] Engagement predictions calculated
- [x] Batch operations (approve, export)
- [x] Real-time progress tracking
- [x] Error handling and retries
- [x] Platform eligibility badges