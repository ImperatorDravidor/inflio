# Project Deletion Guide

## Overview

When users delete a project in Inflio, the system now performs a comprehensive cleanup to remove all associated data from both the database and storage buckets.

## What Gets Deleted

When a project is deleted, the following data is removed:

### Database Records
1. **Project record** - The main project entry
2. **Staging sessions** - All staging/scheduling data (cascades automatically)
3. **Social posts** - All social media posts linked to the project
4. **User profile embeddings** - AI embeddings associated with the project (after migration)
5. **Social analytics** - Analytics data for the project (after migration)

### Storage Files
1. **Videos** - Original video files and processed versions
2. **Subtitles** - VTT/SRT subtitle files
3. **AI-generated images** - All thumbnails, social images, and AI-generated content
4. **Clips** - Any extracted video clips

## Migration Required

To enable proper cascading deletion, run the following migration in your Supabase SQL editor:

```sql
-- Run migrations/fix-project-deletion-cascade.sql
```

This migration:
- Updates foreign key constraints to use CASCADE instead of SET NULL
- Creates a deletion audit log table
- Adds indexes for better performance

## Cleaning Up Existing Orphaned Data

If you have existing orphaned data from previous deletions, you can clean it up manually:

### 1. Find Orphaned Social Posts
```sql
-- View orphaned social posts
SELECT * FROM social_posts 
WHERE project_id IS NOT NULL 
AND project_id NOT IN (SELECT id FROM projects);

-- Delete orphaned social posts
DELETE FROM social_posts 
WHERE project_id IS NOT NULL 
AND project_id NOT IN (SELECT id FROM projects);
```

### 2. Find Orphaned Analytics
```sql
-- View orphaned analytics
SELECT * FROM social_analytics 
WHERE project_id IS NOT NULL 
AND project_id NOT IN (SELECT id FROM projects);

-- Delete orphaned analytics
DELETE FROM social_analytics 
WHERE project_id IS NOT NULL 
AND project_id NOT IN (SELECT id FROM projects);
```

### 3. Clean Storage Buckets
Storage cleanup must be done through the Supabase dashboard:

1. Go to Storage in your Supabase dashboard
2. Check each bucket (videos, ai-generated-images)
3. Look for folders with IDs that don't exist in the projects table
4. Delete these orphaned folders manually

### 4. View Deletion History
After the migration, all project deletions are logged:

```sql
-- View deletion history
SELECT * FROM project_deletion_log 
ORDER BY deleted_at DESC;
```

## Best Practices

1. **Regular Cleanup**: Run orphaned data cleanup queries periodically
2. **Monitor Storage**: Check storage usage regularly for orphaned files
3. **Backup First**: Always backup your database before bulk deletions
4. **Test First**: Test deletion on a development environment first

## Troubleshooting

### Storage Deletion Fails
If storage deletion fails during project deletion:
- The project will still be deleted from the database
- Check Supabase logs for storage errors
- Manually clean up storage files if needed

### Foreign Key Constraint Errors
If you get foreign key errors when deleting:
- Make sure you've run the migration
- Check for custom tables that reference projects
- Update those tables to use CASCADE as well

### Performance Issues
If deletion is slow:
- Check if indexes exist (the migration creates them)
- Consider deleting in batches for large projects
- Monitor database performance during deletion

## Implementation Details

The deletion process follows this order:

1. Delete AI-generated images from storage
2. Delete videos and subtitles from storage
3. Delete social posts from database
4. Delete project record (triggers cascade deletions)
5. Log the deletion for audit

Storage deletions are wrapped in try-catch blocks to ensure the project deletion completes even if storage operations fail. 