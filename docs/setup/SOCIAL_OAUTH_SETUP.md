# Social Media OAuth Setup Guide

## 🔐 Overview

This guide walks you through setting up OAuth authentication for each social media platform. OAuth allows users to connect their social accounts to Inflio for automated publishing.

## 📋 Prerequisites

Before starting:
1. Have your production domain ready (e.g., `https://your-app.com`)
2. Access to developer portals for each platform
3. SSL certificate (HTTPS) on your domain
4. Supabase project configured

## 🚀 Platform Setup Guides

### 1. Twitter/X OAuth Setup

#### Create Twitter App
1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Click "Create Project"
3. Fill in project details:
   - **Name**: Inflio (or your app name)
   - **Use case**: Publishing content
4. Create an App within the project
5. Navigate to "User authentication settings"

#### Configure OAuth 2.0
1. Click "Set up" under OAuth 2.0
2. Configure settings:
   ```
   App permissions: Read and write
   Type of App: Web App
   Callback URI: https://your-domain.com/api/social/callback/twitter
   Website URL: https://your-domain.com
   ```
3. Save and note down:
   - Client ID
   - Client Secret

#### Add to Environment
```bash
TWITTER_CLIENT_ID=your_client_id_here
TWITTER_CLIENT_SECRET=your_client_secret_here
```

---

### 2. Facebook/Instagram OAuth Setup

#### Create Facebook App
1. Go to [Facebook Developers](https://developers.facebook.com/apps)
2. Click "Create App"
3. Choose "Business" type
4. Fill in details:
   - **App Name**: Inflio
   - **App Contact Email**: your-email@example.com
   - **App Purpose**: Business

#### Configure Facebook Login
1. Add "Facebook Login" product
2. Settings → Basic:
   ```
   Valid OAuth Redirect URIs:
   https://your-domain.com/api/social/callback/facebook
   ```
3. Settings → Advanced:
   - Set "Native or desktop app?" to "No"

#### Configure Instagram Basic Display
1. Add "Instagram Basic Display" product
2. Settings:
   ```
   Valid OAuth Redirect URIs:
   https://your-domain.com/api/social/callback/instagram
   
   Deauthorize Callback URL:
   https://your-domain.com/api/social/deauth/instagram
   
   Data Deletion Request URL:
   https://your-domain.com/api/social/delete/instagram
   ```

#### Required Permissions
- `pages_show_list`
- `pages_read_engagement`
- `pages_manage_posts`
- `instagram_basic`
- `instagram_content_publish`

#### Add to Environment
```bash
FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_APP_SECRET=your_app_secret_here
```

---

### 3. LinkedIn OAuth Setup

#### Create LinkedIn App
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Click "Create app"
3. Fill in details:
   - **App name**: Inflio
   - **LinkedIn Page**: Your company page
   - **App logo**: Upload logo
   - **Legal agreement**: Check

#### Configure OAuth 2.0
1. Go to "Auth" tab
2. Add Redirect URLs:
   ```
   https://your-domain.com/api/social/callback/linkedin
   ```
3. Request Products:
   - Sign In with LinkedIn
   - Share on LinkedIn
   - Marketing Developer Platform (if needed)

#### Required Scopes
- `r_emailaddress`
- `r_liteprofile`
- `w_member_social`

#### Add to Environment
```bash
LINKEDIN_CLIENT_ID=your_client_id_here
LINKEDIN_CLIENT_SECRET=your_client_secret_here
```

---

### 4. YouTube OAuth Setup

#### Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable YouTube Data API v3:
   - APIs & Services → Library
   - Search "YouTube Data API v3"
   - Click Enable

#### Configure OAuth Consent Screen
1. APIs & Services → OAuth consent screen
2. Choose "External" user type
3. Fill in app information:
   - **App name**: Inflio
   - **Support email**: your-email@example.com
   - **App domain**: your-domain.com
4. Add scopes:
   - `.../auth/youtube`
   - `.../auth/youtube.upload`
   - `.../auth/youtube.readonly`

#### Create OAuth Credentials
1. APIs & Services → Credentials
2. Create Credentials → OAuth client ID
3. Application type: Web application
4. Configure:
   ```
   Authorized redirect URIs:
   https://your-domain.com/api/social/callback/youtube
   ```

#### Add to Environment
```bash
YOUTUBE_CLIENT_ID=your_client_id_here
YOUTUBE_CLIENT_SECRET=your_client_secret_here
YOUTUBE_API_KEY=your_api_key_here
```

---

### 5. TikTok OAuth Setup

#### Register TikTok App
1. Go to [TikTok for Developers](https://developers.tiktok.com/apps)
2. Click "Create App"
3. Fill in details:
   - **App name**: Inflio
   - **Description**: Video content publishing
   - **Category**: Content & Publishing

#### Configure Login Kit
1. Add "Login Kit" product
2. Configure settings:
   ```
   Redirect URI:
   https://your-domain.com/api/social/callback/tiktok
   ```

#### Required Scopes
- `user.info.basic`
- `video.upload`
- `video.publish`

#### Add to Environment
```bash
TIKTOK_CLIENT_KEY=your_client_key_here
TIKTOK_CLIENT_SECRET=your_client_secret_here
```

---

## 🔧 Implementation

### 1. OAuth Flow Structure

```typescript
// src/lib/social/oauth-config.ts
export const oauthConfig = {
  twitter: {
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    scopes: ['tweet.read', 'tweet.write', 'users.read'],
    clientId: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
  },
  // ... other platforms
}
```

### 2. Callback Handler

```typescript
// src/app/api/social/callback/[platform]/route.ts
export async function GET(request: Request, { params }) {
  const { platform } = params
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  
  // Exchange code for token
  const token = await exchangeCodeForToken(platform, code)
  
  // Save to database
  await saveIntegration(userId, platform, token)
  
  // Redirect to success page
  return redirect('/social?connected=true')
}
```

### 3. Database Schema

```sql
-- Already included in consolidated schema
CREATE TABLE social_media_integrations (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  account_name TEXT,
  account_id TEXT,
  is_active BOOLEAN DEFAULT true
);
```

## 🧪 Testing OAuth

### Development Testing

1. **Use ngrok for local testing:**
   ```bash
   ngrok http 3000
   ```
   Use the HTTPS URL as your redirect URI during development

2. **Test accounts:**
   - Create test accounts on each platform
   - Use platform-specific sandboxes when available

### Production Testing

1. **Verify redirect URIs** match exactly
2. **Check SSL certificate** is valid
3. **Test token refresh** for platforms that support it
4. **Monitor error logs** during first connections

## 🔍 Common Issues & Solutions

### "Redirect URI mismatch"
- **Solution**: Ensure URLs match exactly (including trailing slashes)
- Check for `http` vs `https`
- Verify domain with/without `www`

### "Invalid client credentials"
- **Solution**: Check environment variables are loaded
- Verify no extra spaces in keys
- Ensure using production keys in production

### "Insufficient permissions"
- **Solution**: Request necessary scopes
- User must grant all requested permissions
- Some platforms require app review for certain scopes

### "Token expired"
- **Solution**: Implement token refresh logic
- Store refresh tokens securely
- Check token expiry before API calls

## 📊 Platform Limits & Considerations

### Rate Limits
| Platform | Posts/Day | API Calls/Hour |
|----------|-----------|----------------|
| Twitter  | 300       | 300            |
| Facebook | 25        | 200            |
| Instagram| 25        | 200            |
| LinkedIn | 100       | 100            |
| YouTube  | 50        | 10,000 points  |
| TikTok   | 10        | 100            |

### Content Requirements
- **Twitter**: 280 characters, 4 images, 1 video
- **Facebook**: 63,206 characters, 10 images
- **Instagram**: 2,200 characters, 10 images/video
- **LinkedIn**: 3,000 characters, 20 images
- **YouTube**: Title 100 chars, Description 5,000 chars
- **TikTok**: 2,200 characters, 3-minute video

## 🚀 Production Checklist

Before going live:

- [ ] All OAuth apps approved/verified
- [ ] Production redirect URIs configured
- [ ] Environment variables set in production
- [ ] Token encryption implemented
- [ ] Refresh token logic tested
- [ ] Error handling for expired tokens
- [ ] Rate limiting implemented
- [ ] User disconnect flow working
- [ ] Privacy policy updated
- [ ] Terms of service updated

## 📚 Resources

- [OAuth 2.0 Specification](https://oauth.net/2/)
- [Twitter OAuth Documentation](https://developer.twitter.com/en/docs/authentication/oauth-2-0)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)
- [LinkedIn OAuth Documentation](https://docs.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow)
- [YouTube API Documentation](https://developers.google.com/youtube/v3/guides/authentication)
- [TikTok Login Kit Documentation](https://developers.tiktok.com/doc/login-kit-web)

## 🆘 Support

If you encounter issues:
1. Check platform-specific developer forums
2. Review error logs in Supabase
3. Test with platform-provided tools
4. Contact platform developer support

Remember: Each platform has its own review process and timeline. Plan accordingly for production launch.