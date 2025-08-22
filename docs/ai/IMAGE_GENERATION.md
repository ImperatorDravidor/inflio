# AI Thumbnail Generation System

## Overview
The AI thumbnail generation system uses a multi-model approach with Flux (via FAL) as the primary model and OpenAI DALL-E 3 as fallback. It supports generation, iteration based on feedback, and variation creation.

## Architecture

### Models
- **Primary**: Flux Dev (FAL AI) - High quality, supports img2img, LoRA personas
- **Fallback**: OpenAI DALL-E 3 - Reliable backup when Flux fails
- **Persona Support**: Flux LoRA fine-tuning for personalized faces

### Data Flow
1. User provides prompt + settings → Generate thumbnail
2. Thumbnail saved to `thumbnail_history` with full metadata
3. User can rate & provide feedback → Generate iteration
4. User can create variations → Generate 4 style variants
5. All generations tracked in history with parent-child relationships

## API Endpoints

### POST /api/generate-thumbnail
Main generation endpoint:
```json
{
  "projectId": "uuid",
  "prompt": "Create a compelling thumbnail...",
  "style": "modern|vibrant|professional|dramatic",
  "quality": "fast|balanced|high",
  "mergeVideoWithPersona": false,
  "personaName": "optional-persona-name",
  "referenceImageUrl": "optional-reference"
}
```

### POST /api/generate-thumbnail/iterate
Iteration based on feedback:
```json
{
  "projectId": "uuid",
  "parentId": "parent-thumbnail-id",
  "feedback": "Make it more vibrant and add...",
  "rating": 3,
  "keepStyle": true,
  "keepComposition": false,
  "specificChanges": ["color", "text"],
  "personaId": "optional-persona-id"
}
```

### POST /api/thumbnail/variations
Generate 4 variations:
```json
{
  "projectId": "uuid",
  "parentId": "source-thumbnail-id",
  "count": 4,
  "variationStrength": 0.3,
  "styles": ["modern", "vibrant", "dramatic", "minimal"]
}
```

### GET /api/generate-thumbnail
Fetch generation history:
```
?projectId=uuid&limit=20
```
Returns hierarchical history with parent-child relationships and feedback.

## Database Schema

### thumbnail_history
```sql
- id (UUID) - Primary key
- project_id (UUID) - Project reference
- user_id (TEXT) - Creator
- type (TEXT) - generate|iterate|variation
- prompt (TEXT) - User prompt
- base_prompt (TEXT) - Original prompt for iterations
- edit_prompt (TEXT) - Feedback for iterations
- params (JSONB) - Generation parameters
- model (TEXT) - Model used
- lora_ref (TEXT) - Persona LoRA reference
- seed (INTEGER) - For reproducibility
- input_image_url (TEXT) - Reference image
- output_url (TEXT) - Generated image URL
- file_size (INTEGER)
- width/height (INTEGER)
- job_id (TEXT) - External job ID
- status (TEXT) - pending|completed|failed
- error (TEXT) - Error message if failed
- parent_id (UUID) - Parent thumbnail for iterations
- chosen (BOOLEAN) - Selected as project thumbnail
- used_in_posts (BOOLEAN) - Used in social posts
- created_at (TIMESTAMP)
- created_by (TEXT)
```

### thumbnail_feedback
```sql
- id (UUID) - Primary key
- generation_id (UUID) - Thumbnail reference
- project_id (UUID) - Project reference
- rating (INTEGER 1-5) - Quality rating
- feedback_text (TEXT) - User feedback
- created_by (TEXT) - User ID
- created_at (TIMESTAMP)
```

## Generation Parameters

### Styles
- **modern**: Clean, contemporary design (contrast: 1.2, saturation: 1.1)
- **classic**: Timeless, professional (contrast: 1.0, saturation: 0.9)
- **minimal**: Simple, focused (contrast: 1.1, saturation: 0.8)
- **bold**: High impact (contrast: 1.4, saturation: 1.3)
- **artistic**: Creative, unique
- **dramatic**: Cinematic, intense
- **vibrant**: Bright, energetic

### Quality Levels
- **fast**: 20 inference steps, basic quality
- **balanced**: 35 steps, good quality/speed ratio
- **high**: 50 steps, maximum quality

### Platform Optimizations
- **YouTube**: 1920x1080 (16:9), high contrast, text-safe areas
- **Instagram**: 1080x1080 (1:1), mobile-optimized
- **LinkedIn**: 1200x627, professional appearance
- **Universal**: 1920x1080, adaptable design

## Iteration Logic

### Feedback Processing
1. User provides rating (1-5) and text feedback
2. GPT-4 analyzes feedback and generates improved prompt
3. System determines parameters:
   - keepStyle: Use img2img with strength 0.6
   - keepComposition: Use img2img with strength 0.3
   - specificChanges: Target particular elements

### Variation Generation
1. Takes successful thumbnail as base
2. Generates 4 variations with different styles
3. Uses variationStrength (0.1-0.5) to control difference
4. Each variation gets random seed for uniqueness

## Best Practices

### Prompt Engineering
```
Base structure:
"Create a [platform] thumbnail for [video title].
Topics: [main topics].
Style: [style], [quality] quality.
Key elements: [visual elements].
[Special requirements]"
```

### Persona Integration
- Requires pre-trained LoRA model (10-20 photos)
- Blend strength: 0.7-0.9 for clear face visibility
- Combine with video frame for context
- Fallback to non-persona if model unavailable

### Error Handling
1. Flux timeout/error → Fallback to DALL-E 3
2. DALL-E 3 error → Return user-friendly message
3. Storage error → Retry with exponential backoff
4. Invalid prompt → Sanitize and retry

## Quality Assurance

### Validation
- Minimum resolution: 1280x720
- Maximum file size: 10MB
- NSFW content check
- Text-safe area validation
- Brand consistency check

### Performance Metrics
- Average generation time: 15-30s (Flux), 10-20s (DALL-E)
- Iteration improvement rate: Track rating increases
- Variation diversity: Measure visual difference
- User satisfaction: Average rating trends

## Environment Variables
```env
FAL_KEY=your-fal-api-key
OPENAI_API_KEY=your-openai-key
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

## Testing Checklist
- [ ] Generate thumbnail with custom prompt
- [ ] Generate with video context
- [ ] Generate with persona
- [ ] Rate and iterate based on feedback
- [ ] Create 4 variations
- [ ] View generation history
- [ ] Set thumbnail as project image
- [ ] Handle API failures gracefully
- [ ] Validate all platform dimensions