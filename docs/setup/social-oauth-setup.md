# Social Media OAuth Setup Guide

This guide will walk you through setting up OAuth credentials for each social media platform to enable account linking and publishing in Inflio.

## Prerequisites

- A deployed application URL (for production) or `http://localhost:3000` (for development)
- Admin/developer access to create apps on each platform
- SSL certificate for production deployments (required by most platforms)

## Environment Variables

Add these to your `.env.local` file:

```env
# Application URL (update for production)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Social Media OAuth Credentials
INSTAGRAM_CLIENT_ID=
INSTAGRAM_CLIENT_SECRET=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
THREADS_CLIENT_ID=
THREADS_CLIENT_SECRET=
```

## Platform Setup Instructions

### 1. Instagram & Facebook (Meta)

Instagram and Facebook use the same Meta app.

1. Go to [Facebook Developers](https://developers.facebook.com)
2. Click "My Apps" → "Create App"
3. Choose "Business" type
4. Fill in app details
5. Add products:
   - Facebook Login
   - Instagram Basic Display
   - Instagram Graph API

**OAuth Settings:**
- Valid OAuth Redirect URIs:
  ```
  http://localhost:3000/api/social/callback/instagram
  http://localhost:3000/api/social/callback/facebook
  https://yourdomain.com/api/social/callback/instagram
  https://yourdomain.com/api/social/callback/facebook
  ```

**Required Permissions:**
- `instagram_basic`
- `instagram_content_publish`
- `pages_show_list`
- `pages_read_engagement`
- `pages_manage_posts`

**Get Credentials:**
- App ID → `INSTAGRAM_CLIENT_ID` & `FACEBOOK_APP_ID`
- App Secret → `INSTAGRAM_CLIENT_SECRET` & `FACEBOOK_APP_SECRET`

### 2. X (Twitter)

1. Go to [Twitter Developer Portal](https://developer.twitter.com)
2. Create a new Project and App
3. Set up OAuth 2.0 settings

**App Settings:**
- App permissions: Read and write
- Type of App: Web App
- Callback URL:
  ```
  http://localhost:3000/api/social/callback/x
  https://yourdomain.com/api/social/callback/x
  ```

**Required Scopes:**
- `tweet.read`
- `tweet.write`
- `users.read`
- `offline.access`

**Get Credentials:**
- Client ID → `TWITTER_CLIENT_ID`
- Client Secret → `TWITTER_CLIENT_SECRET`

### 3. LinkedIn

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Create a new app
3. Add products:
   - Share on LinkedIn
   - Sign In with LinkedIn using OpenID Connect

**OAuth 2.0 Settings:**
- Authorized redirect URLs:
  ```
  http://localhost:3000/api/social/callback/linkedin
  https://yourdomain.com/api/social/callback/linkedin
  ```

**Required Scopes:**
- `openid`
- `profile`
- `email`
- `w_member_social`

**Get Credentials:**
- Client ID → `LINKEDIN_CLIENT_ID`
- Client Secret → `LINKEDIN_CLIENT_SECRET`

### 4. YouTube (Google)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable YouTube Data API v3
4. Create OAuth 2.0 credentials

**OAuth Setup:**
- Application type: Web application
- Authorized redirect URIs:
  ```
  http://localhost:3000/api/social/callback/youtube
  https://yourdomain.com/api/social/callback/youtube
  ```

**Required Scopes:**
- `https://www.googleapis.com/auth/youtube.upload`
- `https://www.googleapis.com/auth/youtube`
- `https://www.googleapis.com/auth/userinfo.profile`

**Get Credentials:**
- Client ID → `YOUTUBE_CLIENT_ID`
- Client Secret → `YOUTUBE_CLIENT_SECRET`

### 5. TikTok

1. Go to [TikTok for Developers](https://developers.tiktok.com)
2. Create a new app
3. Configure Login Kit

**App Configuration:**
- Redirect URI:
  ```
  http://localhost:3000/api/social/callback/tiktok
  https://yourdomain.com/api/social/callback/tiktok
  ```

**Required Scopes:**
- `user.info.basic`
- `video.list`
- `video.upload`

**Get Credentials:**
- Client Key → `TIKTOK_CLIENT_KEY`
- Client Secret → `TIKTOK_CLIENT_SECRET`

### 6. Threads

Threads uses the same Meta app infrastructure as Instagram.

1. Use the same Facebook app created earlier
2. Add Threads API product
3. Configure permissions

**OAuth Settings:**
- Same as Instagram/Facebook
- Additional redirect URI:
  ```
  http://localhost:3000/api/social/callback/threads
  https://yourdomain.com/api/social/callback/threads
  ```

**Required Permissions:**
- `threads_basic`
- `threads_content_publish`

**Get Credentials:**
- Use same as Instagram → `THREADS_CLIENT_ID` & `THREADS_CLIENT_SECRET`

## Testing OAuth Flow

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/social` page

3. Click "Connect Account" for any platform

4. You should be redirected to the platform's OAuth consent screen

5. After authorization, you'll be redirected back to your app

## Common Issues

### "Redirect URI mismatch"
- Ensure the redirect URI in your app settings exactly matches what's in the code
- Include both http (dev) and https (prod) versions
- Check for trailing slashes

### "Invalid client"
- Double-check your client ID and secret
- Ensure environment variables are loaded correctly
- Some platforms require app review for certain permissions

### "Scope not authorized"
- Start with minimal scopes and add more as needed
- Some scopes require app review
- Check platform documentation for scope availability

## Production Considerations

1. **SSL Required**: Most platforms require HTTPS in production
2. **App Review**: Some platforms require app review for publishing permissions
3. **Rate Limits**: Each platform has different rate limits
4. **Token Storage**: Tokens are stored encrypted in Supabase
5. **Token Refresh**: Implement automatic token refresh for expired tokens

## Security Best Practices

1. Never commit credentials to version control
2. Use environment variables for all secrets
3. Implement CSRF protection with state parameter
4. Validate all redirect URIs
5. Use HTTPS in production
6. Regularly rotate credentials
7. Monitor for suspicious OAuth activity

## Next Steps

After setting up OAuth:

1. Test account connection for each platform
2. Verify publishing permissions
3. Set up webhook endpoints for real-time updates (optional)
4. Configure platform-specific features
5. Test the complete publishing flow

## Support

If you encounter issues:

1. Check platform-specific developer documentation
2. Verify all redirect URIs match exactly
3. Ensure all required APIs are enabled
4. Check browser console for detailed error messages
5. Review platform's OAuth troubleshooting guides 