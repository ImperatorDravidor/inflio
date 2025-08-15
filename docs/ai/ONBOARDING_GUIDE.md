# Onboarding Flow Implementation Guide

## Overview
The onboarding flow is a 7-step wizard (plus welcome) that collects user information to personalize the AI content generation. It includes autosave, resume capability, and progress tracking.

## Flow Steps

1. **Welcome** - Introduction and overview
2. **Platforms** - Social media handles and connections (OAuth later)
3. **Profile** - Creator information (name, bio, industry, content pillars)
4. **Brand** - Visual identity (colors, fonts, voice, logo)
5. **Photos** - Upload photos for AI persona training (10-20 recommended)
6. **Content** - Content types and distribution preferences
7. **AI Setup** - Caption style, CTAs, language preferences
8. **Legal** - Privacy policy and consent agreements

## Key Features

### Autosave & Resume
- Progress saved to `user_profiles.onboarding_progress` column
- Automatic save on each step change
- Resume from last saved position on page reload
- Progress persists across sessions

### Photo Upload
- Handled by `PersonaUploadService`
- Stores photos in Supabase `personas` bucket
- Quality validation (min 512x512, ideal 1024x1024)
- Face detection and quality scoring
- Creates persona record for future training

### Completion Flow
1. Final validation of all required fields
2. POST to `/api/onboarding` endpoint
3. Creates/updates:
   - `user_profiles` with all settings
   - `personas` record if photos uploaded
   - `social_integrations` for platform handles
4. Sets `onboarding_completed = true`
5. Middleware redirects to dashboard

## Database Schema

### user_profiles
- `onboarding_progress` (JSONB) - Stores intermediate state
- `onboarding_step` (INT) - Current step number (0-7)
- `onboarding_completed` (BOOL) - Completion flag
- `onboarding_completed_at` (TIMESTAMP) - Completion time
- Platform handles, AI settings, legal consents stored in respective columns

### personas
- Stores persona metadata for AI training
- Links to `persona_images` for uploaded photos
- Status: pending_upload → photos_uploaded → training → ready

## API Endpoints

### POST /api/onboarding
Main submission endpoint that:
- Validates all data
- Creates user profile with all settings
- Creates persona if photos uploaded
- Sets up social integrations
- Returns success with personalized message

### POST /api/onboarding/upload-photos
Handles photo uploads:
- Validates image quality
- Stores to Supabase storage
- Creates persona_images records
- Returns upload status and analysis

### GET /api/onboarding
Fetches existing onboarding data:
- Returns user profile
- Includes persona status
- Indicates if onboarding needed

## Middleware Enforcement
The middleware (`src/middleware.ts`) enforces:
- Redirects non-onboarded users to `/onboarding`
- Prevents access to dashboard until complete
- Redirects completed users away from onboarding

## Testing Checklist
- [ ] Can start onboarding from fresh state
- [ ] Progress saves automatically
- [ ] Can resume from any step after refresh
- [ ] Photo upload works (10+ photos)
- [ ] All validations working
- [ ] Completion redirects to dashboard
- [ ] Cannot access dashboard without completing
- [ ] Completed users cannot re-enter onboarding

## Environment Variables Required
```env
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
```

## Quick Reset (Development)
To reset onboarding for testing:
```sql
UPDATE user_profiles 
SET onboarding_completed = false,
    onboarding_progress = '{}',
    onboarding_step = 0
WHERE clerk_user_id = 'YOUR_USER_ID';
```