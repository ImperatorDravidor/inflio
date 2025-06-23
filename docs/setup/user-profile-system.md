# User Profile System for LLM Personalization

## Overview

Inflio uses a sophisticated user profile system to provide personalized AI-generated content. This system stores user preferences, brand identity, and historical interactions to improve content generation over time.

## Database Architecture

### 1. **user_profiles** Table
Stores all user preferences and settings collected during onboarding:
- Company information (name, industry, size, role)
- Content preferences (types, goals, target audience)
- Brand identity (colors, fonts, voice, assets)
- Style preferences (video style, transitions, music)
- Platform preferences (primary platforms, posting schedule)
- AI preferences (tone, auto-suggestions, clip length)

### 2. **user_embeddings** Table
Stores AI embeddings for semantic understanding:
- **Profile embeddings**: Overall user context and preferences
- **Brand voice embeddings**: Specific brand tone and style
- **Content style embeddings**: Preferred content formats
- Uses OpenAI's text-embedding-3-small model (1536 dimensions)

### 3. **user_content_history** Table
Tracks all generated content and user interactions:
- Links to specific projects and content types
- Stores actual content data generated
- Tracks performance metrics (views, engagement)
- Records user feedback (liked, edited, rejected)

### 4. **user_preferences_history** Table
Maintains a history of preference changes:
- Tracks what changed and when
- Stores old and new values
- Helps AI understand evolving preferences

## How It Works

### User Registration Flow
1. User signs up via Clerk
2. Webhook creates record in `users` table
3. Webhook creates initial `user_profiles` record with `onboarding_completed: false`
4. User is redirected to `/onboarding` page
5. User completes onboarding form
6. Profile data is saved and embeddings are generated
7. User is marked as `onboarding_completed: true`

### AI Personalization Process
1. **Initial Profile Creation**:
   - User preferences are collected during onboarding
   - AI embeddings are generated from profile summary
   - Brand voice embeddings are created

2. **Content Generation**:
   - When generating content, the system retrieves user profile
   - AI uses embeddings to find similar successful content
   - Content is personalized based on brand voice, style, and preferences

3. **Continuous Learning**:
   - Every interaction (like, edit, reject) is tracked
   - System analyzes edits to understand preference changes
   - New embeddings are generated based on user behavior
   - Future content improves based on historical data

## API Integration

### Using Profile in Content Generation
```javascript
// Example: Generate blog with user profile
const response = await fetch('/api/process-with-profile', {
  method: 'POST',
  body: JSON.stringify({
    videoId,
    processingType: 'blog',
    clerkUserId: user.id,
    transcription: videoTranscript
  })
})
```

### Profile Data Structure
```typescript
interface UserProfile {
  // Basic info
  company_name: string
  industry: string
  brand_voice: 'professional' | 'casual' | 'friendly' | 'playful' | 'inspirational'
  
  // Target audience
  target_audience: {
    age_groups: string[]
    interests: string[]
    description: string
  }
  
  // Content preferences
  content_goals: string[]
  primary_platforms: string[]
  preferred_clip_length: number
  
  // AI settings
  ai_tone: 'creative' | 'balanced' | 'conservative'
  auto_suggestions: boolean
}
```

## Troubleshooting

### User Not Redirected to Onboarding
1. Check if user has a record in `user_profiles` table
2. Verify `onboarding_completed` is `false`
3. Check browser console for redirect logs
4. Run the migration script to create missing profiles

### Profile Not Loading
1. Verify Clerk user ID matches `clerk_user_id` in database
2. Check Supabase connection and RLS policies
3. Ensure UserProfileProvider wraps the app

### AI Not Using Preferences
1. Verify embeddings were created in `user_embeddings` table
2. Check OpenAI API key is set
3. Ensure profile is being passed to AI service

## Security Considerations

- User profiles are protected by Row Level Security (RLS)
- Only authenticated users can access their own profiles
- Embeddings are stored securely and linked to user profiles
- Historical data is retained for learning but can be deleted on request 