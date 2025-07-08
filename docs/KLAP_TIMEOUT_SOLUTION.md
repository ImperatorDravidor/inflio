# Klap Processing Timeout Solution

## Overview

This document explains the improved Klap processing solution that avoids Vercel's 5-minute timeout limit while still storing clips in your Supabase storage for long-term use.

## The Problem

- Vercel functions have a 5-minute timeout limit
- Processing 7+ clips with video downloads can take longer than 5 minutes
- Users want clips stored in their own Supabase storage for reliability

## The Solution

We've implemented a **progressive processing system** with **on-demand downloads**:

### 1. Progressive Clip Saving
Each clip is saved to the database as soon as it's processed, rather than waiting for all clips to complete. This ensures no data loss even if the function times out.

### 2. Intelligent Timeout Detection
The system monitors processing time and automatically switches to URL-only mode when approaching the 4.5-minute mark, leaving a buffer before Vercel's timeout.

### 3. On-Demand Clip Downloads
A dedicated `/api/download-clip` endpoint downloads clips to Supabase only when needed (e.g., for social media posting).

## Implementation Details

### Processing Flow

1. **Initial Processing** (0-4.5 minutes)
   - Downloads and stores clips to Supabase
   - Saves each clip immediately after processing
   - Monitors elapsed time

2. **Near Timeout** (4.5+ minutes)
   - Switches to URL-only mode
   - Uses Klap's URLs directly
   - Marks clips as `needsDownload: true`

3. **On-Demand Downloads**
   - When posting to social media
   - Download individual clips as needed
   - 1-minute timeout per clip (plenty of time)

### API Endpoints

#### POST /api/process-klap
- Processes all clips from Klap
- Progressive saving to avoid data loss
- Automatic timeout detection
- Returns status and progress updates

#### GET /api/process-klap?projectId={id}
- Check processing status
- Get current progress
- Retrieve processed clips

#### POST /api/download-clip
- Download individual clip to Supabase
- Used before social media posting
- Body: `{ clipId, projectId, folderId? }`

#### GET /api/download-clip?clipId={id}&projectId={pid}
- Check if clip needs downloading
- Returns download status

## Usage Examples

### 1. Process Clips (Frontend)
```typescript
// Start processing
const response = await fetch('/api/process-klap', {
  method: 'POST',
  body: JSON.stringify({ projectId })
})

// Poll for status
const checkStatus = async () => {
  const status = await fetch(`/api/process-klap?projectId=${projectId}`)
  const data = await status.json()
  
  if (data.status === 'completed') {
    // All clips processed
  } else if (data.status === 'processing') {
    // Show progress: data.progress
    setTimeout(checkStatus, 5000) // Check again in 5 seconds
  }
}
```

### 2. Download Clip Before Posting
```typescript
// Check if download needed
const checkResponse = await fetch(
  `/api/download-clip?clipId=${clipId}&projectId=${projectId}`
)
const { needsDownload } = await checkResponse.json()

if (needsDownload) {
  // Download the clip
  const downloadResponse = await fetch('/api/download-clip', {
    method: 'POST',
    body: JSON.stringify({ clipId, projectId })
  })
  const { url } = await downloadResponse.json()
  // Use the downloaded URL for posting
}
```

## Configuration

### Environment Variables
- `SKIP_KLAP_VIDEO_REUPLOAD`: Set to `true` to always use Klap URLs (faster but less control)
- `KLAP_API_KEY`: Your Klap API key
- `SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY`: For storage

### Recommended Settings
- Keep `SKIP_KLAP_VIDEO_REUPLOAD` unset or `false` for hybrid approach
- This gives you the best of both worlds:
  - Fast initial processing
  - Clips stored in your Supabase when possible
  - On-demand downloads for remaining clips

## Benefits

1. **No Timeouts**: Processing completes successfully even with many clips
2. **Data Ownership**: Clips are stored in your Supabase storage
3. **Flexibility**: Download clips only when needed
4. **Reliability**: Progressive saving prevents data loss
5. **Performance**: Initial results available quickly

## Migration Notes

If you have existing projects with Klap URLs:
1. The system will detect clips using Klap URLs
2. Use the download-clip endpoint to migrate them to Supabase
3. Or keep using Klap URLs if they work for your use case

## Troubleshooting

### Clips not downloading
- Check Supabase storage bucket permissions
- Verify API keys are set correctly
- Check browser console for errors

### Processing seems stuck
- Check the GET /api/process-klap endpoint for status
- Look for errors in Vercel logs
- Verify Klap API key is valid

### Social media posting fails
- Ensure clip is downloaded first
- Check the clip URL is accessible
- Verify social media API credentials 