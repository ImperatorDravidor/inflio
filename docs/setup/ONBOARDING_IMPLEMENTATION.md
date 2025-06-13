# Inflio Onboarding & Personalization System

## Overview

This implementation creates a comprehensive onboarding system for Inflio that collects user preferences and builds a personalized AI-powered content generation experience that improves over time.

## Key Features

### 1. Multi-Step Onboarding Flow
- **Welcome Screen**: Introduction to Inflio's capabilities
- **Company Information**: Collects company name, industry, size, and role
- **Audience Definition**: Target demographics, interests, and ideal viewer description
- **Brand Identity**: Color palette, fonts, brand voice, and logo upload
- **Content Preferences**: Video style, transition preferences, music choices
- **Goals Setting**: Content objectives and success metrics
- **Platform Selection**: Primary social media platforms for distribution
- **Publishing Schedule**: Posting frequency and preferred times

### 2. User Profile Database Schema

#### Tables Created:
- `user_profiles`: Stores all user preferences and onboarding data
- `user_embeddings`: Stores AI embeddings for semantic understanding
- `user_content_history`: Tracks all generated content and user feedback
- `user_preferences_history`: Maintains history of preference changes

### 3. AI-Powered Personalization

The system includes:
- **AIProfileService**: Generates content based on user preferences
- **Embedding System**: Creates vector embeddings of user preferences for semantic matching
- **Learning System**: Tracks user feedback (liked, edited, rejected) to improve over time
- **Content History**: Finds similar successful content for better recommendations

### 4. Integration Points

#### API Endpoints:
- `/api/onboarding`: Handles onboarding form submission and profile creation
- `/api/process-with-profile`: Enhanced content processing using user profiles

#### Hooks:
- `useUserProfile()`: Custom hook for accessing user profile throughout the app
- `useProfile()`: Context-based hook for profile state management

#### Components:
- `OnboardingCheck`: Automatically redirects new users to complete onboarding
- `UserProfileProvider`: Context provider for global profile access

## Setup Instructions

### 1. Database Setup

Run the following SQL in your Supabase dashboard:

```sql
-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Run the user profiles schema
-- Execute the contents of supabase-user-profiles-schema.sql
```

### 2. Environment Variables

Add these to your `.env.local`:

```env
OPENAI_API_KEY=your_openai_api_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Update Middleware

The system automatically checks if users need onboarding via the `OnboardingCheck` component in the dashboard layout.

## Usage

### For New Users:
1. User signs up via Clerk
2. Automatically redirected to `/onboarding`
3. Completes 8-step onboarding process
4. Profile created with AI embeddings
5. Redirected to dashboard

### For Content Generation:
```javascript
// Use the enhanced API with user profile
const response = await fetch('/api/process-with-profile', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    videoId,
    processingType: 'clips', // or 'blog', 'social'
    clerkUserId: user.id,
    transcription: videoTranscription
  })
})
```

### Tracking User Interactions:
```javascript
// In your component
const { trackContentInteraction } = useProfile()

// When user interacts with content
await trackContentInteraction(
  'clip',
  clipData,
  'liked' // or 'edited', 'rejected'
)
```

## How It Learns

1. **Initial Profile**: Created during onboarding with user preferences
2. **Content Generation**: Uses profile to personalize all generated content
3. **User Feedback**: Tracks when users like, edit, or reject content
4. **Analysis**: When content is edited, analyzes changes to understand preferences
5. **Embedding Updates**: Creates new embeddings based on user behavior
6. **Improved Suggestions**: Uses historical data to make better recommendations

## Customization Options

### Brand Voice Options:
- Professional
- Casual
- Friendly
- Playful
- Inspirational

### Video Styles:
- Minimal
- Dynamic
- Corporate
- Creative
- Educational

### AI Tone Settings:
- Creative (0.8 temperature)
- Balanced (0.5 temperature)
- Conservative (0.3 temperature)

## Future Enhancements

1. **A/B Testing**: Test different content variations
2. **Performance Analytics**: Track engagement metrics
3. **Team Profiles**: Support for multiple team members
4. **API Access**: Allow external tools to use profile data
5. **Export/Import**: Backup and restore preferences
6. **Advanced ML**: Use more sophisticated learning algorithms

## Troubleshooting

### User Not Redirected to Onboarding:
- Check if `OnboardingCheck` component is included in layout
- Verify Clerk user ID is being passed correctly

### Embeddings Not Created:
- Ensure OpenAI API key is set
- Check Supabase pgvector extension is enabled

### Profile Not Loading:
- Verify Supabase connection
- Check RLS policies on user_profiles table

## Support

For issues or questions, please check:
1. Browser console for errors
2. Network tab for API failures
3. Supabase logs for database issues
4. Clerk dashboard for auth problems 