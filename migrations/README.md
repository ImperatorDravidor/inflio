# Inflio Database Migrations Guide

## Overview
This guide provides the exact order and instructions for running all SQL migrations in Supabase for the Inflio application.

## Prerequisites
- Supabase project created
- Supabase CLI installed (optional, for local development)
- Access to Supabase SQL Editor

## Migration Order

Run these migrations in the **exact order** listed below. Each migration builds upon the previous ones.

### 1. Base Schema Setup
**File:** `supabase-schema.sql`
- Creates the main `projects` table
- Sets up indexes and RLS policies
- Creates update trigger for timestamps

```sql
-- Run this first to establish the core project structure
```

### 2. User Profiles Schema
**File:** `supabase-user-profiles-schema-no-vector.sql`
- Creates `user_profiles` table for Clerk integration
- Sets up user metadata storage
- Handles user profile management

```sql
-- Choose this file (without vector) for standard setup
-- Only use the vector version if you need embedding support
```

### 3. Authentication Migration
**File:** `supabase-auth-migration.sql`
- Updates authentication structure
- Ensures compatibility with Clerk
- Sets up proper user ID references

```sql
-- Run after user profiles to ensure proper auth setup
```

### 4. Social Media Base Schema
**File:** `social-media-schema.sql`
- Creates all social media related tables:
  - `social_integrations` - OAuth connections
  - `social_posts` - Scheduled/published posts
  - `social_accounts` - Connected account details
- Sets up indexes and relationships

```sql
-- This is the foundation for all social features
```

### 5. Social Media Integrations
**File:** `social-media-integrations.sql`
- Enhances integration capabilities
- Adds platform-specific fields
- Sets up token management

```sql
-- Run after base social schema
```

### 6. Social Media Analytics
**File:** `social-media-analytics.sql`
- Creates analytics tracking tables
- Sets up engagement metrics
- Adds reporting views

```sql
-- Optional but recommended for tracking performance
```

### 7. Social Staging Enhancements (NEW)
**File:** `social-staging-enhancements.sql`
- Makes `integration_id` optional for staging
- Adds metadata column for rich data
- Creates helper functions and views
- Optimizes for the staging workflow

```sql
-- REQUIRED for the new staging tool to work
```

### 8. Large File Support
**File:** `supabase-large-files.sql`
- Configures storage for large video files
- Sets up chunked upload support
- Optimizes file handling

```sql
-- Important for video processing features
```

### 9. Content Analysis
**File:** `add-content-analysis.sql`
- Adds AI content analysis fields
- Stores keywords, topics, summaries
- Enables smart content suggestions

```sql
-- Enhances AI-powered features
```

### 10. Fix Migrations (Only if Needed)
Run these only if you encounter specific issues:

**File:** `fix-projects-user-id.sql`
- Fixes missing user_id column in projects table
- Run if you get "column user_id does not exist" errors

**File:** `fix-missing-user-profiles.sql`
- Creates missing user profiles
- Run if you have users without profiles

**File:** `fix-blog-structure.sql`
- Fixes blog posts with old structure (metaTitle/metaDescription)
- Converts to new structure (seoTitle/seoDescription)
- Adds missing readingTime and sections fields
- Run if blog posts show as "generated" but don't display properly

**File:** `supabase-subtitle-storage.sql`
- Adds subtitle support to the videos bucket
- Allows VTT and SRT file uploads
- Sets up proper policies for subtitle files
- Run if subtitle functionality is not working properly

**File:** `fix-project-deletion-cascade.sql`
- Fixes foreign key constraints for proper deletion cascade

## Running Migrations

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste each migration file in order
4. Click "Run" for each migration
5. Verify successful execution

### Option 2: Supabase CLI
```bash
# Connect to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push migrations/supabase-schema.sql
supabase db push migrations/supabase-user-profiles-schema-no-vector.sql
# ... continue for each file
```

### Option 3: Direct Connection
```bash
# Using psql
psql -h your-project.supabase.co -p 5432 -d postgres -U postgres < migrations/supabase-schema.sql
```

## Verification Steps

After running all migrations, verify the setup:

1. **Check Tables Exist:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Expected tables:
- projects
- user_profiles
- social_integrations
- social_posts
- social_accounts
- (and others)

2. **Check Indexes:**
```sql
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY indexname;
```

3. **Check Functions:**
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public';
```

4. **Test RLS Policies:**
```sql
SELECT tablename, policyname FROM pg_policies 
WHERE schemaname = 'public';
```

## Storage Buckets

After migrations, create storage buckets in Supabase Dashboard:

1. Go to Storage section
2. Create these buckets:
   - `videos` (public) - For video uploads
   - `thumbnails` (public) - For video thumbnails
   - `images` (public) - For generated images
   - `exports` (public) - For processed content

## Environment Variables

Ensure these are set in your `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

## Troubleshooting

### Common Issues

1. **"Relation already exists" error**
   - The table/index was already created
   - Safe to ignore or drop and recreate

2. **"Permission denied" error**
   - Check your database role permissions
   - Use the service role key for migrations

3. **"Column does not exist" error**
   - Run the fix migrations in section 10
   - Check migration order

4. **RLS Policy Issues**
   - Temporarily disable RLS for testing:
   ```sql
   ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
   ```

### Reset Database (Development Only)
```sql
-- WARNING: This will delete all data!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

## Post-Migration Setup

1. **Test User Creation:**
   - Sign up a test user
   - Verify user profile is created
   - Check Clerk-Supabase sync

2. **Test Social Integration:**
   - Connect a social account
   - Schedule a test post
   - Verify staging workflow

3. **Test Project Creation:**
   - Upload a video
   - Process content
   - Verify all features work

## Maintenance

- Always backup before migrations
- Test migrations in a development environment first
- Keep migration files in version control
- Document any custom modifications

**Last Updated:** December 2024 