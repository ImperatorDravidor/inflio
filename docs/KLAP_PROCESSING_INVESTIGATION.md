# Klap Processing Investigation Report

## Executive Summary

The Klap clip generation was failing on Vercel due to a fundamental mismatch between the application's background processing approach and Vercel's serverless function limitations. The code was attempting to run 10-20 minute processing tasks in the background after sending the HTTP response, which is not possible on Vercel.

## Critical Issues Found

### 1. **Serverless Function Termination**
- **Issue**: Vercel terminates functions shortly after the HTTP response is sent
- **Impact**: Background processing code (`processVideoInBackground`) was being killed
- **Evidence**: Tasks completing in <5 seconds instead of 10-20 minutes

### 2. **Synchronous Long-Running Operations**
- **Issue**: `KlapAPIService.processVideo()` blocks for up to 25 minutes
- **Impact**: Exceeds Vercel's 5-minute function timeout by 5x
- **Code**: 
  ```typescript
  await this.pollTaskUntilReady(task.id) // Polls for up to 25 minutes!
  ```

### 3. **Incorrect URL Resolution**
- **Issue**: Internal API calls using `localhost:3000` on production
- **Impact**: API calls failing on Vercel
- **Fix Applied**: Use `process.env.VERCEL_URL` for internal calls

## Solution Implemented

### Polling-Based Architecture

Changed from a background processing model to a stateless, polling-based approach:

1. **POST /api/process-klap**
   - Creates Klap task (takes ~1-2 seconds)
   - Stores task ID in database
   - Returns immediately with success response
   - No background processing

2. **GET /api/process-klap?projectId=xxx**
   - Client polls this endpoint every 10-15 seconds
   - Checks Klap task status
   - When task completes, processes and downloads clips
   - Updates progress in real-time

### Key Changes

1. **Removed Background Processing**
   - Deleted `processVideoInBackground` function
   - No more `Promise.race()` or `setImmediate` workarounds

2. **Made KlapAPIService Methods Public**
   - `createVideoTask()` - To create tasks directly
   - `getClipsFromFolder()` - To fetch clips when ready

3. **Added Stateful Polling Logic**
   - Tracks whether we have a task ID or folder ID
   - Handles task completion and clip processing
   - Downloads clips to Supabase storage

## Timeline Comparison

### Before (Broken)
```
0s    - Request received
1s    - Try to start background processing
2s    - Return response
3s    - Function terminated by Vercel ❌
10-20min - (Never happens)
```

### After (Working)
```
0s    - Request received
1s    - Create Klap task
2s    - Return response ✅
---
10s   - Client polls status
20s   - Client polls status
...
10min - Task ready, process clips
12min - Clips downloaded and stored ✅
```

## Required Environment Variables

```bash
KLAP_API_KEY=klap_xxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=https://inflio.ai
# DO NOT set SKIP_KLAP_VIDEO_REUPLOAD
```

## Deployment Checklist

- [x] Remove all background processing code
- [x] Implement polling-based architecture
- [x] Fix internal URL resolution
- [x] Make necessary KlapAPIService methods public
- [x] Test task creation (<5 seconds)
- [x] Test polling mechanism
- [x] Verify clip download to Supabase

## Monitoring

Watch for these in production logs:
- `[Klap Route] Klap task created successfully: tsk_xxx`
- `[Klap GET] Task tsk_xxx is ready. Processing clips...`
- `[Klap] Successfully processed X clips for project Y`

## Future Improvements

1. **Consider Background Jobs Service**
   - Use services like Inngest, Trigger.dev, or QStash
   - Allows true background processing
   - More reliable for long-running tasks

2. **Webhook Support**
   - If Klap adds webhook support, use that instead of polling
   - More efficient than polling every 10 seconds

3. **Caching Layer**
   - Cache Klap task status to reduce API calls
   - Use Redis or Vercel KV

## Conclusion

The refactoring successfully addresses Vercel's serverless limitations by moving from a background processing model to a polling-based architecture. This ensures reliable clip generation while working within the constraints of serverless functions. 