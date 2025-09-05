# AI Posts Generation Fix - Documentation

## Issue Summary
The AI posts generation feature was failing with "Failed to generate suggestions" error due to:
1. Missing database tables (migration not applied)
2. Missing or invalid OpenAI API key configuration
3. Insufficient error handling and logging

## Fixes Applied

### 1. Enhanced Error Handling
- Added detailed error logging in both frontend and backend
- Improved error messages to be more descriptive
- Added proper error propagation from API to UI

### 2. Mock Data Fallback
- Created `MockPostsGenerator` class for testing without OpenAI
- Feature now works even without AI services configured
- Allows testing the UI/UX flow with placeholder data

### 3. Database Setup Scripts
- Created `scripts/check-posts-setup.js` to verify configuration
- Created `scripts/setup-posts-feature.ps1` for easy migration

### 4. Improved Service Resilience
- PostsService now gracefully handles missing AI services
- Fallback to mock data when OpenAI/image generation fails
- Better error recovery for partial failures

## Setup Instructions

### Step 1: Check Current Setup
```bash
node scripts/check-posts-setup.js
```
This will show you:
- Which environment variables are configured
- Which database tables exist
- What needs to be fixed

### Step 2: Apply Database Migration
Run the PowerShell setup script:
```powershell
./scripts/setup-posts-feature.ps1
```

Or manually apply the migration:
```bash
npx supabase db push --file migrations/posts-feature-mvp.sql
```

### Step 3: Configure Environment Variables
Add to your `.env.local`:
```env
# Required for AI features (optional with mock fallback)
OPENAI_API_KEY=your_actual_openai_api_key

# Required for database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 4: Restart Development Server
```bash
npm run dev
```

## How It Works Now

### With AI Services Configured
1. Uses OpenAI GPT-4 to generate content ideas
2. Uses AI image generation (Flux) for visuals
3. Creates platform-optimized copy for each platform
4. Full feature set available

### Without AI Services (Mock Mode)
1. Uses pre-defined templates for content ideas
2. Uses placeholder images from Lorem Picsum
3. Generates template-based copy for platforms
4. Perfect for testing and development

## Features

### Content Types Supported
- **Carousel**: Multi-slide posts (3-8 images)
- **Quote Card**: Powerful quotes with attribution
- **Single Image**: One impactful visual
- **Thread**: Text-based with 1-3 visuals

### Platforms Supported
- Instagram (optimized for feed posts)
- Twitter/X (character-limited posts)
- LinkedIn (professional content)
- Facebook (general social posts)

### Generation Settings
- Creativity level adjustment
- Persona integration (when available)
- Auto-hashtag generation
- Call-to-action inclusion
- Engagement optimization

## Troubleshooting

### "Failed to generate suggestions" Error
1. Check browser console for detailed error
2. Run `node scripts/check-posts-setup.js`
3. Verify database tables exist
4. Check OpenAI API key is valid

### Database Connection Issues
1. Verify Supabase credentials in `.env.local`
2. Check if tables exist in Supabase dashboard
3. Ensure RLS policies are enabled

### AI Service Failures
- The system will automatically fall back to mock data
- Check console logs for specific AI errors
- Verify API keys are correct and have credits

## API Endpoints

### Generate Posts
`POST /api/posts/generate`
```json
{
  "projectId": "uuid",
  "projectTitle": "string",
  "contentAnalysis": {},
  "transcript": "string",
  "personaId": "uuid",
  "contentTypes": ["carousel", "quote"],
  "platforms": ["instagram", "twitter"],
  "settings": {
    "creativity": 0.7,
    "usePersona": true,
    "autoHashtags": true,
    "includeCTA": true,
    "optimizeForEngagement": true
  }
}
```

### Get Suggestions
`GET /api/posts/suggestions?projectId={uuid}`

### Approve Suggestion
`POST /api/posts/approve`
```json
{
  "suggestionId": "uuid"
}
```

## Next Steps

1. **Test the feature** with a project that has content analysis
2. **Configure OpenAI** for full AI capabilities
3. **Monitor logs** for any remaining issues
4. **Customize templates** in `posts-service-mock.ts` for better mock data

## Support

If issues persist after following these steps:
1. Check the browser console for errors
2. Review server logs for API errors
3. Verify all migrations have been applied
4. Ensure all environment variables are set correctly
