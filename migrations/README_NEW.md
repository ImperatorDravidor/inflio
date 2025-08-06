# Database Migrations

## 🎯 Quick Start

To set up the database for Inflio, run the consolidated schema:

```sql
-- In Supabase SQL Editor
-- Run the entire contents of:
00_consolidated_schema.sql
```

## 📁 File Structure

```
migrations/
├── 00_consolidated_schema.sql   # ✅ USE THIS - Complete database schema
├── README_NEW.md                 # This file
├── archive/                      # Old individual migration files (for reference)
│   ├── supabase-schema.sql
│   ├── social-media-schema.sql
│   └── ... (other old files)
└── future/                       # Future migration files
    └── 2024_XX_XX_description.sql
```

## 🚀 For New Deployments

1. **Run the consolidated schema:**
   ```sql
   -- Execute in Supabase SQL editor
   00_consolidated_schema.sql
   ```

2. **Create storage buckets in Supabase Dashboard:**
   - `videos` - Public, 2GB limit
   - `thumbnails` - Public, 50MB limit
   - `subtitles` - Public, 10MB limit
   - `blog-images` - Public, 50MB limit
   - `ai-images` - Public, 50MB limit
   - `project-media` - Public, 5GB limit

3. **Enable Row Level Security (RLS):**
   - Already included in the consolidated schema
   - Customize policies as needed

## 📝 For Existing Deployments

If you've already run individual migrations:
1. Check which tables exist in your database
2. Compare with `00_consolidated_schema.sql`
3. Run only the missing CREATE TABLE statements

## 🔄 Adding New Migrations

For new features after initial deployment:

1. **Create a new file with timestamp:**
   ```
   migrations/future/2024_01_15_add_feature_name.sql
   ```

2. **Include rollback instructions:**
   ```sql
   -- UP: Changes to apply
   ALTER TABLE ...
   
   -- DOWN: How to rollback
   -- DROP COLUMN ...
   ```

3. **Update the consolidated schema** periodically

## 📊 Schema Overview

### Core Tables
- `user_profiles` - User accounts linked to Clerk
- `projects` - Main content containers
- `tasks` - Processing queue

### Content Tables
- `blog_posts` - Generated blog content
- `ai_generated_images` - AI-created images
- `personas` - User personas for AI generation
- `thumbnail_history` - Thumbnail versions

### Social Media Tables
- `social_media_integrations` - OAuth connections
- `social_media_posts` - Scheduled/published posts
- `social_media_analytics` - Performance metrics
- `staging_sessions` - Content preparation
- `social_graphics` - Visual content templates

### Tracking Tables
- `user_usage` - Monthly usage limits

## 🔍 Important Notes

### Data Types
- User IDs: `TEXT` (Clerk user IDs)
- Primary keys: `UUID` with `gen_random_uuid()`
- Timestamps: `TIMESTAMP WITH TIME ZONE`
- JSON data: `JSONB` for flexibility

### Automatic Features
- `updated_at` triggers on all tables
- Monthly usage reset function
- Atomic update functions for concurrency

### Security
- RLS enabled on all tables
- Policies restrict access to own data
- Service role key bypasses RLS

## 🐛 Troubleshooting

### "Permission denied" errors
- Check RLS policies
- Ensure user is authenticated
- Verify Clerk integration

### "Table already exists" errors
- Database already has the table
- Safe to ignore or check for differences

### Missing functions
- Run the functions section again
- Check for syntax errors in SQL

## 📚 Resources

- [Supabase Migrations Guide](https://supabase.com/docs/guides/database/migrations)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [RLS Best Practices](https://supabase.com/docs/guides/auth/row-level-security)