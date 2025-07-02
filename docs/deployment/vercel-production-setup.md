# Vercel Production Setup Guide

## Overview
This guide covers the essential steps to deploy Inflio to Vercel production environment and resolve common deployment issues.

## 1. Environment Variables Setup

### Required Production Environment Variables

In your Vercel dashboard, add these environment variables:

#### Authentication (Clerk)
```bash
# Replace with production keys from Clerk Dashboard
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Production redirect URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

#### Database (Supabase)
```bash
# Production Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

#### AI Services
```bash
# OpenAI API key for transcription and content generation
OPENAI_API_KEY=sk-...

# Klap API for video processing
KLAP_API_KEY=klap_...
```

#### File Upload Limits
```bash
# Set to 500MB for production (bytes)
NEXT_PUBLIC_MAX_FILE_SIZE=524288000
```

#### Error Tracking (Sentry)
```bash
# Production Sentry DSN
SENTRY_DSN=https://...@sentry.io/...
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

## 2. Vercel Configuration

### Function Timeouts
The `vercel.json` file is configured with extended timeouts for processing:
- Upload: 5 minutes (300s)
- Processing: 5 minutes (300s)
- Caption generation: 1 minute (60s)

### Body Size Limits
- Configured for 2GB uploads in `next.config.ts`
- Vercel Pro plan required for files > 100MB

## 3. Common Production Issues & Fixes

### Issue 1: 413 Request Entity Too Large
**Symptoms:**
```
/api/upload:1 Failed to load resource: the server responded with a status of 413 ()
```

**Solutions:**
1. **Upgrade Vercel Plan**: Free tier has 100MB limit
2. **Check Environment Variables**: Ensure `NEXT_PUBLIC_MAX_FILE_SIZE` is set
3. **Verify Supabase Plan**: Ensure storage plan supports large files

### Issue 2: Clerk Development Keys Warning
**Symptoms:**
```
Clerk: Clerk has been loaded with development keys
```

**Solution:**
Replace development keys with production keys:
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Switch to production instance
3. Copy production keys to Vercel environment variables

### Issue 3: Sentry Blocked by Ad Blockers
**Symptoms:**
```
net::ERR_BLOCKED_BY_CLIENT
```

**Solutions:**
1. **Enable Sentry Tunnel** (recommended for production):
   ```typescript
   // Uncomment in next.config.ts
   tunnelRoute: "/monitoring"
   ```

2. **Or disable Sentry in production** if not needed:
   ```bash
   # Remove or comment out in environment variables
   # SENTRY_DSN=...
   ```

### Issue 4: Missing /help Route
**Symptoms:**
```
/help?_rsc=1onzy:1 Failed to load resource: 404
```

**Solution:**
The `vercel.json` includes a rewrite rule. Create the docs page:
```bash
# Create the missing page
mkdir -p src/app/docs
echo "export default function DocsPage() { return <div>Documentation</div> }" > src/app/docs/page.tsx
```

## 4. Performance Optimizations

### Large File Handling
1. **Enable Chunked Uploads**:
   - Files > 100MB automatically use chunked upload
   - Progress tracking included

2. **Supabase Storage Configuration**:
   ```sql
   -- Increase storage limits in Supabase
   UPDATE storage.buckets 
   SET file_size_limit = 2147483648 -- 2GB
   WHERE id = 'videos';
   ```

### CDN Configuration
1. **Enable Vercel Edge Network**
2. **Configure proper caching headers**
3. **Use Image Optimization for thumbnails**

## 5. Monitoring & Debugging

### Enable Logging
```typescript
// Add to your API routes for debugging
console.log('Upload attempt:', {
  fileSize: file.size,
  fileName: file.name,
  contentType: file.type
});
```

### Sentry Configuration
```typescript
// In sentry.server.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  debug: false,
});
```

### Error Boundaries
Ensure error boundaries are in place for upload components.

## 6. Security Considerations

### File Validation
- Strict MIME type checking
- File size limits enforced
- Malicious file detection

### API Rate Limiting
Consider implementing rate limiting for production:
```typescript
// Example rate limiting middleware
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10 // limit each IP to 10 requests per windowMs
});
```

## 7. Deployment Checklist

- [ ] All environment variables set in Vercel
- [ ] Clerk production keys configured
- [ ] Supabase production database setup
- [ ] File upload limits configured
- [ ] Error tracking enabled (Sentry)
- [ ] Domain configured and SSL enabled
- [ ] Performance monitoring enabled
- [ ] Backup strategy in place

## 8. Troubleshooting Commands

### Check Environment Variables
```bash
# In Vercel CLI
vercel env ls

# Pull environment variables locally
vercel env pull .env.local
```

### Test Upload Locally
```bash
# Test with production environment
vercel dev --prod
```

### Monitor Logs
```bash
# Real-time function logs
vercel logs --follow
```

## 9. Support & Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Clerk Production Setup](https://clerk.com/docs/deployments/overview)
- [Supabase Production Guide](https://supabase.com/docs/guides/platform/going-to-prod)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

## 10. Emergency Rollback

If issues occur in production:

1. **Revert to previous deployment**:
   ```bash
   vercel rollback
   ```

2. **Check function logs**:
   ```bash
   vercel logs --since=1h
   ```

3. **Temporary fixes**:
   - Reduce file size limits
   - Disable problematic features
   - Switch to fallback services 

## Production Optimizations

1. **Database Connection Pooling**
   - Supabase automatically handles connection pooling
   - Use the pooler URL for serverless functions if needed

2. **Video Processing Optimization**
   - Add `SKIP_KLAP_VIDEO_REUPLOAD=true` to skip re-uploading Klap videos to your storage
   - This significantly reduces processing time and bandwidth usage
   - Klap URLs remain accessible for 30 days

3. **Function Timeouts**
   - All processing functions are configured with 5-minute timeouts
   - Monitor for 504 errors and adjust video length recommendations

## Monitoring

### Enable Logging
```typescript
// Add to your API routes for debugging
console.log('Upload attempt:', {
  fileSize: file.size,
  fileName: file.name,
  contentType: file.type
});
```

### Sentry Configuration
```typescript
// In sentry.server.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  debug: false,
});
```

### Error Boundaries
Ensure error boundaries are in place for upload components. 