# Klap API Production Troubleshooting Guide

## Common Production Issues

### 1. "Video clip generation service is temporarily unavailable"

**Symptom**: When processing a video with both AI analysis and clips enabled, the processing page shows "FAILED" and the console shows a 503 error.

**Cause**: The `KLAP_API_KEY` environment variable is not configured in production.

**Solution**:
1. Get your Klap API key from [klap.app](https://klap.app) → Developer Settings
2. Add to your production environment variables:
   ```
   KLAP_API_KEY=klap_xxxxx
   ```
3. Also add this for better performance:
   ```
   SKIP_KLAP_VIDEO_REUPLOAD=true
   ```
4. Restart your production deployment

### 2. Clips Processing Timeout

**Symptom**: Clips get stuck at "processing" or timeout after a few minutes.

**Cause**: Klap processing can take 10-20 minutes for longer videos, but Vercel has timeout limits.

**Solution**: The app now handles this gracefully:
- AI analysis completes in 2-3 minutes
- Page redirects to project after AI analysis is done
- Clips continue processing in the background
- Project page shows clip progress with auto-refresh

### 3. Production vs Development Behavior

**Development**:
- May work without Klap API key (shows mock progress)
- Faster processing times
- Lower video quality limits

**Production**:
- Requires valid Klap API key
- Real processing times (10-20 minutes for clips)
- Higher quality output
- Better error handling

### 4. Error Messages Explained

| Error | Meaning | Solution |
|-------|---------|----------|
| 503 Service Unavailable | Klap API key not configured | Add `KLAP_API_KEY` to environment |
| 504 Gateway Timeout | Processing took too long | Normal for long videos, clips process in background |
| 401 Unauthorized | Invalid Klap API key | Check your API key is correct |
| 429 Too Many Requests | Rate limit exceeded | Wait or upgrade Klap plan |

### 5. Best Practices for Production

1. **Environment Variables**:
   ```bash
   KLAP_API_KEY=klap_xxxxx
   SKIP_KLAP_VIDEO_REUPLOAD=true  # Saves processing time
   KLAP_API_URL=https://api.klap.app/v2  # Optional, this is default
   ```

2. **Video Guidelines**:
   - Optimal length: 5-30 minutes
   - Longer videos = longer processing
   - Higher quality = better clip detection

3. **User Experience**:
   - Users can view AI analysis results immediately
   - Clips appear gradually as they're processed
   - Dashboard shows processing status

### 6. Monitoring Clip Generation

Check clip generation status:
1. Go to project page
2. Look for "Clips generating..." indicator
3. Page auto-refreshes every 5 seconds
4. Clips appear as they're completed

### 7. If Clips Never Complete

1. Check Klap API dashboard for usage/errors
2. Verify video was successfully uploaded to Supabase
3. Check browser console for specific errors
4. Try with a shorter test video (< 5 minutes)

### 8. Fallback Options

If Klap is unavailable:
- AI analysis still works (transcription, summaries)
- Users can manually create clips later
- Content generation features remain available
- Social media posting works without clips

## Testing in Production

1. **Quick Test**:
   ```bash
   curl -X POST https://your-app.com/api/process-klap \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
     -d '{"projectId": "test", "videoUrl": "test"}'
   ```

2. **Expected Response** (if not configured):
   ```json
   {
     "error": "Video clip generation is temporarily unavailable. Please try again later.",
     "details": "Klap API service not configured. Contact administrator."
   }
   ```

## Support

If issues persist after following this guide:
1. Check Klap API status at [status.klap.app](https://status.klap.app)
2. Verify your Klap account is active and has available credits
3. Contact Klap support with your API request ID 