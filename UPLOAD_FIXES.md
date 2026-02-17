# Upload & Usage Limit Fixes

## Issues Found

### 1. "undefined videos" Error
**Problem:** Error message showed "You've reached your monthly limit of undefined videos"
- `canProcessVideo()` was catching errors and returning `true`
- Then `getUsage()` was called separately and failing
- Result: `usage.limit` was undefined in error message

**Fix Applied:**
- Combined usage check and limit validation in one try-catch
- Get usage first, then check limit
- If usage check fails, allow upload (don't block users for DB issues)
- Log warning when allowing despite check failure

### 2. Processing Shows But Fails
**Cause:** Project was created but processing couldn't start properly
- Inngest error: "401 Event key not found" (line 172 in logs)
- This is why project exists but processing fails

## Code Changes

### `src/app/api/projects/create/route.ts`

**Before:**
```typescript
const canProcess = await ServerUsageService.canProcessVideo(userId)
if (!canProcess) {
  const usage = await ServerUsageService.getUsage(userId)
  // usage.limit could be undefined here
  error: `You've reached your monthly limit of ${usage.limit} videos...`
}
```

**After:**
```typescript
try {
  const usage = await ServerUsageService.getUsage(userId)
  const canProcess = usage.limit === -1 || usage.used < usage.limit
  
  if (!canProcess) {
    return NextResponse.json({
      error: `You've reached your monthly limit of ${usage.limit} videos...`
      // usage.limit is guaranteed to exist here
    })
  }
} catch (usageError) {
  console.error('Error checking usage limits:', usageError)
  // Allow upload if usage check fails (don't block users)
  console.warn('Allowing upload despite usage check failure')
}
```

## Database Setup

### Required Migration
The `user_usage` table must exist:

```sql
CREATE TABLE IF NOT EXISTS user_usage (
  user_id TEXT PRIMARY KEY,
  used INTEGER NOT NULL DEFAULT 0,
  limit INTEGER NOT NULL DEFAULT 25,
  plan TEXT NOT NULL DEFAULT 'basic',
  reset_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**File:** `supabase/migrations/20240123_create_user_usage_table.sql`

### Apply Migration

**If using Supabase CLI:**
```bash
supabase db push
```

**If using Supabase Dashboard:**
1. Go to SQL Editor
2. Run the migration file contents
3. Verify table exists in Table Editor

## Testing Checklist

- [x] Fixed undefined error message
- [x] Added error handling for DB failures
- [ ] Verify `user_usage` table exists in database
- [ ] Test upload with fresh user (should auto-create usage record)
- [ ] Test upload at limit (should show proper error with number)
- [ ] Verify usage increments after successful upload

## Remaining Issue: Inngest

**Error in logs:**
```
Error: Inngest API Error: 401 Event key not found
```

**This affects:**
- Klap video processing
- Background jobs

**Fix Needed:**
Check `INNGEST_EVENT_KEY` environment variable is set correctly in `.env.local`

## Next Steps

1. **Verify Database:**
   - Run migration if not applied
   - Check RLS policies allow service role access

2. **Test Upload Flow:**
   - Upload video
   - Check usage increments
   - Verify error message shows correct limit

3. **Fix Inngest (separate issue):**
   - Set `INNGEST_EVENT_KEY` in environment
   - Restart dev server

## Expected Behavior After Fix

**First Upload:**
- Creates usage record automatically
- Sets limit to 25 (basic plan)
- Shows: "Project created successfully!"

**At Limit:**
- Shows: "You've reached your monthly limit of 25 videos. Please upgrade your plan to continue."
- Returns 403 status
- Doesn't create project

**On DB Error:**
- Logs error to console
- **Allows upload anyway** (graceful degradation)
- Warns: "Allowing upload despite usage check failure"



