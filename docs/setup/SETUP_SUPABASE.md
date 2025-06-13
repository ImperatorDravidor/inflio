# Supabase Setup Guide for Inflio

This guide will help you set up Supabase for your Inflio application.

## Prerequisites

1. A Supabase account (create one at https://supabase.com)
2. Your Supabase project URL and anon key

## Step 1: Update Environment Variables

Make sure your `env.local` file has the correct Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace these with your actual Supabase project URL and anon key from your Supabase dashboard.

## Step 2: Create the Database Table

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the following SQL script:

```sql
-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  videoId UUID NOT NULL,
  videoUrl TEXT NOT NULL,
  thumbnailUrl TEXT NOT NULL,
  metadata JSONB NOT NULL,
  transcription JSONB,
  folders JSONB NOT NULL DEFAULT '{"clips": [], "blog": [], "social": [], "podcast": []}',
  tasks JSONB NOT NULL DEFAULT '[]',
  settings JSONB NOT NULL DEFAULT '{"autoGenerateClips": true, "clipDuration": 60, "blogStyle": "professional", "socialPlatforms": ["twitter", "linkedin", "youtube-short"], "language": "en"}',
  analytics JSONB NOT NULL DEFAULT '{"totalViews": 0, "totalEngagement": 0, "bestPerformingContent": ""}',
  createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'ready', 'published')),
  tags TEXT[] DEFAULT '{}'
);

-- Create indexes for better performance
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(createdAt DESC);
CREATE INDEX idx_projects_title ON projects(title);

-- Enable RLS (Row Level Security)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (since no auth)
CREATE POLICY "Allow all operations on projects" ON projects
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to automatically update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updatedAt = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updatedAt
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Step 3: Create Storage Bucket

1. In your Supabase dashboard, go to Storage
2. Click "Create a new bucket"
3. Name it `videos`
4. Make sure "Public bucket" is enabled (toggle ON)
5. Click "Save"

Alternatively, you can run this SQL command:

```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true);
```

## Step 4: Configure Storage Policies

To allow uploads and downloads without authentication:

1. Go to Storage > Policies
2. For the `videos` bucket, create the following policies:

**Upload Policy:**
- Policy name: `Allow uploads`
- Target roles: `anon`
- With CHECK expression: `true`

**Download Policy:**
- Policy name: `Allow downloads`
- Target roles: `anon`
- With USING expression: `true`

Or run these SQL commands:

```sql
-- Allow anyone to upload files
CREATE POLICY "Allow uploads" ON storage.objects
FOR INSERT TO anon
WITH CHECK (bucket_id = 'videos');

-- Allow anyone to view files
CREATE POLICY "Allow downloads" ON storage.objects
FOR SELECT TO anon
USING (bucket_id = 'videos');

-- Allow anyone to delete files
CREATE POLICY "Allow deletes" ON storage.objects
FOR DELETE TO anon
USING (bucket_id = 'videos');
```

## Step 5: Test Your Setup

1. Start your Next.js application:
   ```bash
   npm run dev
   ```

2. Try uploading a video through the UI
3. Check your Supabase dashboard:
   - The `projects` table should have a new entry
   - The Storage bucket should contain the uploaded video

## Troubleshooting

### Common Issues:

1. **"relation 'projects' does not exist"**
   - Make sure you've run the SQL script to create the table

2. **"permission denied for storage"**
   - Check that your storage bucket is public
   - Verify storage policies are correctly set

3. **"Failed to upload video to storage"**
   - Check your Supabase URL and anon key in env.local
   - Ensure the storage bucket exists and is named 'videos'

4. **CORS errors**
   - This shouldn't happen with public buckets, but if it does, check your Supabase project settings

## Data Migration (Optional)

If you have existing data in localStorage that you want to migrate to Supabase, you can use the browser console:

```javascript
// Run this in browser console on your app
async function migrateToSupabase() {
  const { ProjectService } = await import('@/lib/db-migration');
  
  // Get all projects from localStorage
  const projectIds = JSON.parse(localStorage.getItem('inflio_projects') || '[]');
  
  for (const id of projectIds) {
    const projectData = localStorage.getItem(`inflio_project_${id}`);
    if (projectData) {
      const project = JSON.parse(projectData);
      try {
        await ProjectService.saveProject(project);
        console.log(`Migrated project: ${project.title}`);
      } catch (error) {
        console.error(`Failed to migrate project ${id}:`, error);
      }
    }
  }
}

migrateToSupabase();
```

## Next Steps

Your app is now connected to Supabase! The application will:
- Store all project data in the Supabase database
- Upload videos to Supabase Storage
- Use public URLs for video playback

Note: Since you're not using authentication, all data is publicly accessible. Consider adding authentication in the future for production use. 