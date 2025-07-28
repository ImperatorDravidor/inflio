# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build production version
npm run build

# Run linting
npm run lint

# Start production server
npm start

# Test OAuth configuration
npm run test:oauth
```

## High-Level Architecture

Inflio is an AI-powered video content platform built with:
- **Next.js 15.3** (App Router) for the full-stack framework
- **Supabase** for database (PostgreSQL) and file storage
- **Clerk** for authentication
- **Multiple AI APIs** for content generation

### Core Architecture Flow

1. **Video Upload** → Supabase Storage → Generate signed URL
2. **Processing Pipeline** → Send URL to Klap AI → Parallel processing (transcription, clips, analysis)
3. **Content Generation** → AI services create blogs, captions, thumbnails
4. **Multi-Platform Publishing** → Social media integrations with OAuth

### Key Design Patterns

- **URL-based processing**: Videos are uploaded to Supabase and processed via URLs (not file uploads)
- **Service Layer Pattern**: All business logic in `/lib/services/` with centralized exports
- **Atomic Database Updates**: Using `supabase-atomic-updates.ts` for consistency
- **Event-driven UI**: Real-time progress tracking during processing
- **Row-Level Security**: Supabase RLS for data access control

### Directory Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (dashboard)/         # Protected routes with layout
│   │   ├── projects/       # Project management UI
│   │   ├── studio/         # Video upload and processing
│   │   └── social/         # Social media hub
│   └── api/                # API endpoints
│       ├── process*/       # Video processing endpoints
│       ├── generate*/      # AI content generation
│       └── social/         # Social media OAuth/publishing
├── lib/                     # Core business logic
│   ├── services/          # Service layer (exports all services)
│   ├── social/            # Social media integration logic
│   ├── staging/           # Content staging system
│   └── supabase/          # Database clients
└── components/             # React components
```

### Critical Services

- **ProjectService** (`lib/supabase-db.ts`): Handles all project CRUD operations
- **KlapAPIService** (`lib/klap-api.ts`): Video clip generation with virality scoring
- **TranscriptionService** (`lib/transcription-service.ts`): OpenAI Whisper integration
- **SocialMediaService** (`lib/social/social-service.ts`): Multi-platform publishing
- **UsageService** (`lib/usage-service.ts`): User quota tracking

### Database Schema

#### Core Tables

**projects** - Central table for video projects
- `id` (uuid, PK): Unique project identifier
- `user_id` (text): Clerk user ID reference
- `video_url`, `thumbnail_url`: Supabase storage URLs
- `klap_*` fields: Track Klap AI processing status
- `folders` (jsonb): Organized content by type (blog, clips, social, podcast)
- `transcription` (jsonb): Full video transcript with timestamps
- `content_analysis` (jsonb): AI-generated insights and keywords
- `status`: draft → processing → ready → published
- `klap_status`: idle → queued → processing → completed/failed

**user_profiles** - Extended user information and preferences
- `clerk_user_id` (text, unique): Links to Clerk authentication
- `brand_*` fields: Brand customization (colors, fonts, voice)
- `primary_platforms`: Preferred social media platforms
- `onboarding_completed`: Track onboarding progress
- AI content preferences: tone, style, clip length

**user_usage** - Usage quota tracking
- `user_id` (text, PK): Clerk user ID
- `used`/`usage_limit`: Current usage vs limit
- `plan`: basic/pro/enterprise
- `reset_date`: When usage resets

#### Social Media Tables

**social_integrations** - OAuth connections to platforms
- `platform`: youtube/instagram/tiktok/linkedin/twitter/facebook
- `token`/`refresh_token`: OAuth credentials (encrypted)
- `internal_id`: Platform-specific user ID
- `posting_times` (jsonb): Scheduled posting preferences

**social_posts** - Content for social platforms
- `state`: draft → scheduled → publishing → published/failed
- `integration_id` → social_integrations (platform connection)
- `project_id` → projects (source content)
- `media_urls[]`: Associated media files
- `parent_post_id`: For thread/reply chains

**scheduled_posts** - Publishing queue
- `scheduled_for`: When to publish
- `content_data` (jsonb): Platform-specific content format
- `status`: scheduled → pending → published/failed

#### Content Organization

**staging_sessions** - Temporary content editing
- `selected_content` (jsonb): Content being staged
- `expires_at`: Auto-cleanup after 24 hours

**social_sets** & **social_set_posts** - Content collections
- Group related posts together
- Maintain order with `order_index`

**social_tags** & **social_post_tags** - Content categorization
- User-defined tags with colors
- Many-to-many relationship with posts

#### Analytics & History

**social_analytics** - Platform performance metrics
- `metrics` (jsonb): Platform-specific analytics
- Links to both integration and specific post

**user_content_history** - Track generated content
- `content_type`: blog/clip/social/etc
- `performance_metrics`: How content performed
- `user_feedback`: User ratings/edits

#### Key Relationships

- All social tables cascade delete from `social_integrations`
- Projects soft-delete (tracked in `project_deletion_log`)
- User profiles created automatically via Clerk webhook
- Foreign keys ensure referential integrity

#### Important Patterns

1. **JSONB Fields**: Heavy use for flexible, schema-less data
2. **Soft Deletes**: Most tables have `deleted_at` for recovery
3. **Audit Fields**: `created_at`, `updated_at` on all tables
4. **Status Enums**: CHECK constraints ensure valid states
5. **Clerk Integration**: `user_id`/`clerk_user_id` links to auth

Migrations are in `/migrations/` - apply in order when setting up.

### API Pattern

All API routes follow this pattern:
1. Authenticate user with Clerk
2. Validate input with Zod schemas
3. Check user quotas if needed
4. Execute business logic via service layer
5. Return JSON response with proper error handling

### Environment Variables

Critical env vars needed:
- `CLERK_*` - Authentication
- `SUPABASE_*` - Database and storage
- `OPENAI_API_KEY` - Transcription and analysis
- `KLAP_API_KEY` - Video clip generation
- `GOOGLE_GENERATIVE_AI_API_KEY` - Content generation

### Common Development Tasks

When modifying video processing:
- Check `lib/video-processing-service.ts` for the main workflow
- Processing status is tracked in `project.klap_status` field
- Use `lib/klap-api.ts` for Klap AI interactions

When working with social media:
- OAuth flow starts at `/api/social/connect`
- Platform-specific publishers in `lib/social/platform-publishers.ts`
- Check `lib/social/oauth-config.ts` for platform settings

When handling errors:
- Use `lib/error-handler.ts` for consistent error responses
- AI errors have special handling in `lib/ai-error-handler.ts`
- Sentry is configured for production error tracking

### Database Best Practices

1. **Always use transactions** for multi-table updates
2. **Check user ownership** before any data access:
   ```typescript
   const { data, error } = await supabase
     .from('projects')
     .select()
     .eq('user_id', userId)
     .single()
   ```
3. **Handle JSONB updates carefully** - use spread operator to preserve existing data
4. **Use Supabase RLS** - Row Level Security policies enforce access control
5. **Soft delete pattern** - Set `deleted_at` instead of DELETE for recovery
6. **Status transitions** - Always validate state machine transitions

### Typecheck Command

Since there's no explicit typecheck script in package.json, use:
```bash
npx tsc --noEmit
```

This validates TypeScript without generating output files.

### Storage Setup

When setting up Supabase storage buckets, you must configure RLS policies. Run the migration:
```sql
-- Apply migrations/fix-storage-rls-policies.sql in Supabase SQL editor
```

This creates the required buckets and RLS policies for:
- `videos` - Private bucket for video uploads (2GB limit)
- `thumbnails` - Public bucket for thumbnails
- `subtitles` - Public bucket for subtitle files
- `blog-images` - Public bucket for blog images

If you get "row-level security policy" errors, ensure you've run this migration.