# Social Media Production Deployment Checklist

## 🚀 Before Deploying

### 1. Environment Variables Required

```bash
# CRITICAL - Set your production URL
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Social Media OAuth Credentials
FACEBOOK_APP_ID=your_production_facebook_app_id
FACEBOOK_APP_SECRET=your_production_facebook_app_secret
TWITTER_CLIENT_ID=your_production_x_client_id
TWITTER_CLIENT_SECRET=your_production_x_client_secret
YOUTUBE_CLIENT_ID=your_production_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_production_youtube_client_secret

# Cron Job Security (Generate a secure random string)
CRON_SECRET=your_secure_random_string_here
```

### 2. OAuth Redirect URIs

Update these in each platform's developer console:

**Facebook & Instagram:**
- `https://yourdomain.com/api/social/callback/facebook`
- `https://yourdomain.com/api/social/callback/instagram`

**X (Twitter):**
- `https://yourdomain.com/api/social/callback/x`

**YouTube:**
- `https://yourdomain.com/api/social/callback/youtube`

### 3. Platform-Specific Requirements

#### Facebook & Instagram
- [ ] App is in "Live" mode (not Development)
- [ ] Business verification completed (if required)
- [ ] All required permissions approved
- [ ] Instagram Business Account connected

#### X (Twitter)
- [ ] OAuth 2.0 enabled
- [ ] Elevated access approved (for full features)
- [ ] App permissions set to "Read and Write"

#### YouTube
- [ ] YouTube Data API v3 enabled
- [ ] OAuth consent screen configured
- [ ] App verified (if using sensitive scopes)

## 🔧 Deployment Steps

### 1. Vercel Deployment

The app is configured to automatically publish scheduled posts using Vercel Cron Jobs:

```json
// vercel.json already configured with:
"crons": [
  {
    "path": "/api/social/publish-scheduled",
    "schedule": "*/5 * * * *"  // Runs every 5 minutes
  }
]
```

### 2. Database Migration

Ensure all social media tables are created:

```bash
# Run in Supabase SQL editor
-- Already included migrations:
- social-media-schema.sql
- social-staging-enhancements.sql
```

### 3. Test OAuth Flow

After deployment:
1. Go to `/social`
2. Test connecting each platform
3. Verify tokens are stored in database
4. Test posting manually

### 4. Test Scheduled Publishing

1. Create a test post scheduled 10 minutes in future
2. Wait for cron job to run (max 5 minutes)
3. Check if post was published to platform
4. Verify post state updated to "published"

## ⚠️ Common Issues & Solutions

### "Redirect URI mismatch"
- Ensure production URL is exactly as configured
- No trailing slashes
- Use HTTPS (not HTTP)

### Posts not auto-publishing
- Check `CRON_SECRET` is set in Vercel
- Check Vercel Functions logs for errors
- Ensure social_integrations have valid tokens

### Token expiration
- The cron job automatically refreshes expired tokens
- Monitor failed posts for token issues

## 📊 Monitoring

### Vercel Dashboard
- Monitor Function logs at: `https://vercel.com/[your-team]/[your-project]/functions`
- Check Cron execution at: `https://vercel.com/[your-team]/[your-project]/crons`

### Database Queries
```sql
-- Check scheduled posts
SELECT * FROM social_posts 
WHERE state = 'scheduled' 
AND publish_date <= NOW()
ORDER BY publish_date;

-- Check failed posts
SELECT * FROM social_posts 
WHERE state = 'failed'
AND created_at > NOW() - INTERVAL '24 hours';

-- Check integration health
SELECT platform, name, token_expiration, disabled
FROM social_integrations
WHERE user_id = '[user-id]';
```

## ✅ Post-Deployment Verification

- [ ] All environment variables set
- [ ] OAuth redirect URIs updated for production
- [ ] Can connect all social accounts
- [ ] Manual posting works
- [ ] Scheduled posts auto-publish
- [ ] Cron job runs every 5 minutes
- [ ] Failed posts show error messages
- [ ] Tokens auto-refresh when expired

## 🚨 Emergency Procedures

### Disable Auto-Publishing
Remove or comment out the cron configuration in `vercel.json`

### Manual Publishing
Use "Publish Now" button in `/social/calendar` for critical posts

### Debug Failed Posts
```sql
SELECT content, error, metadata 
FROM social_posts 
WHERE state = 'failed' 
ORDER BY created_at DESC 
LIMIT 10;
``` 