# Staging Workflow Debug Guide

## Issue
When selecting content and clicking "Continue to Stage", the staging page shows "No content selected" error.

## Root Cause Analysis

### 1. Data Flow
The data flow between PublishingWorkflow and staging page is:
1. User selects content in PublishingWorkflow component
2. On "Continue to Stage" click, selected items are saved to sessionStorage
3. Navigation happens to `/projects/{projectId}/stage`
4. Staging page reads from sessionStorage and initializes content

### 2. Fixes Applied

#### PublishingWorkflow Component (`src/components/publishing-workflow.tsx`)
- Added console logging to debug selected items
- Ensured sessionStorage is written before navigation
- Added 100ms delay to ensure storage write completes
- Made database save non-blocking (continues even if it fails)
- Added verification that content was saved to sessionStorage

#### Staging Page (`src/app/(dashboard)/projects/[id]/stage/page.tsx`) 
- Added console logging to see what's being read from sessionStorage
- Already has logic to parse and transform selected content

### 3. Common Issues to Check

1. **Browser Console**: Check for any JavaScript errors
2. **SessionStorage**: Open DevTools > Application > Session Storage and verify:
   - Key `selectedContent` exists after clicking Continue
   - Content has valid JSON structure
3. **Content Structure**: Selected items should have:
   - `id` - unique identifier
   - `type` - clip, blog, image, etc.
   - `title` - display title
   - `exportUrl` or `url` - media URL for clips/images
   - `publicationCaptions` - pre-generated captions from Klap

### 4. Testing Steps

1. Open browser DevTools Console
2. Navigate to a project with clips
3. Go to "Publish" tab
4. Select one or more clips
5. Check console for "Selected items for staging:" log
6. Click "Continue to Stage"
7. Check console for "Saved to sessionStorage:" log
8. On staging page, check for "Staging page - selectedContentData" log

### 5. Additional Debugging

If still not working, check:

```javascript
// In browser console on project page after selecting content:
sessionStorage.getItem('selectedContent')

// Should return JSON string with selected items
```

### 6. Potential Database Issue

The StagingSessionsService tries to save to a `staging_sessions` table. If this table doesn't exist, it will log a warning but continue with sessionStorage fallback. To create the table, run:

```sql
-- Create staging_sessions table
CREATE TABLE IF NOT EXISTS staging_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  selected_content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE(user_id, project_id)
);

-- Add RLS policies
ALTER TABLE staging_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own staging sessions"
  ON staging_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);
```

### 7. Quick Fix if Still Not Working

If the staging page still shows "No content selected", try this workaround:

1. Comment out lines 393-397 in `src/app/(dashboard)/projects/[id]/stage/page.tsx`
2. This will prevent the redirect and let you see what's happening
3. Check console logs for more details

### 8. Expected Console Output

When working correctly, you should see:
```
Selected items for staging: [{...}, {...}]
Saved to sessionStorage: [{"id":"clip-123","type":"clip",...}]
Staging page - selectedContentData from sessionStorage: [{"id":"clip-123",...}]
Staging page - parsed content: [{...}]
```

If you see these logs but still get "No content selected", the issue is in the content transformation logic. 