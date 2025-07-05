# 🚨 Quick Fix: Social Media OAuth "Invalid App ID" Error

## The Problem
You're getting "Invalid App ID" errors because the OAuth credentials for social platforms aren't configured. You need to:
1. Create developer apps on each platform
2. Add the credentials to your `.env.local` file

## 🔍 Run Diagnostics First

Visit this URL after signing in:
```
http://localhost:3000/api/diagnose-social-oauth
```

This will show you exactly which credentials are missing!

## ✅ Quick Setup for Each Platform

### 📘 Facebook & Instagram (Same App)

1. **Create Facebook App**:
   - Go to [https://developers.facebook.com](https://developers.facebook.com)
   - Click "My Apps" → "Create App"
   - Choose "Business" type
   - Name it something like "Inflio Development"

2. **Add Products**:
   - Click "Add Product" → Facebook Login → Set Up
   - Click "Add Product" → Instagram Basic Display → Set Up

3. **Configure OAuth**:
   - Go to Facebook Login → Settings
   - Add to "Valid OAuth Redirect URIs":
     ```
     http://localhost:3000/api/social/callback/facebook
     http://localhost:3000/api/social/callback/instagram
     ```

4. **Get Credentials**:
   - Go to Settings → Basic
   - Copy App ID and App Secret

5. **Add to `.env.local`**:
   ```bash
   FACEBOOK_APP_ID=your-app-id-here
   FACEBOOK_APP_SECRET=your-app-secret-here
   # Instagram uses the same credentials
   INSTAGRAM_CLIENT_ID=same-as-facebook-app-id
   INSTAGRAM_CLIENT_SECRET=same-as-facebook-app-secret
   ```

### 🎥 YouTube (Google)

1. **Create Google Project**:
   - Go to [https://console.cloud.google.com](https://console.cloud.google.com)
   - Create new project or select existing
   - Enable "YouTube Data API v3" in APIs & Services

2. **Create OAuth Credentials**:
   - Go to APIs & Services → Credentials
   - Create Credentials → OAuth 2.0 Client ID
   - Application type: Web application
   - Add authorized redirect URI:
     ```
     http://localhost:3000/api/social/callback/youtube
     ```

3. **Configure Consent Screen**:
   - Go to OAuth consent screen
   - Fill in app name and email
   - Add scopes: youtube.upload, youtube.readonly

4. **Add to `.env.local`**:
   ```bash
   YOUTUBE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   YOUTUBE_CLIENT_SECRET=your-client-secret
   # Or use GOOGLE_ prefix
   GOOGLE_CLIENT_ID=same-client-id
   GOOGLE_CLIENT_SECRET=same-secret
   ```

### 🐦 X (Twitter)

1. **Create X App**:
   - Go to [https://developer.twitter.com](https://developer.twitter.com)
   - Create a new app in your project
   - Set up "User authentication settings"

2. **Configure OAuth 2.0**:
   - Enable OAuth 2.0
   - Type of App: Web App, Automated App or Bot
   - Callback URL:
     ```
     http://localhost:3000/api/social/callback/x
     ```
   - Website URL: http://localhost:3000

3. **Set Permissions**:
   - Read and write
   - Request email from users

4. **Add to `.env.local`**:
   ```bash
   TWITTER_CLIENT_ID=your-client-id
   TWITTER_CLIENT_SECRET=your-client-secret
   # Or use X_ prefix
   X_API_KEY=same-client-id
   X_API_SECRET=same-secret
   ```

## 🔧 Complete `.env.local` Example

```bash
# App URL (required for all platforms)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Facebook & Instagram (same credentials)
FACEBOOK_APP_ID=123456789012345
FACEBOOK_APP_SECRET=abcdef123456789abcdef123456789ab
INSTAGRAM_CLIENT_ID=123456789012345
INSTAGRAM_CLIENT_SECRET=abcdef123456789abcdef123456789ab

# YouTube
YOUTUBE_CLIENT_ID=123456-abcdef.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=GOCSPX-1234567890abcdefghij

# X (Twitter)
TWITTER_CLIENT_ID=ABC123DEF456GHI789JKL012
TWITTER_CLIENT_SECRET=1234567890abcdefghijklmnopqrstuvwxyz123456
```

## 🚀 After Adding Credentials

1. **Restart your dev server**:
   ```bash
   # Stop with Ctrl+C then restart
   npm run dev
   ```

2. **Test connections**:
   - Go to `/social` page
   - Click "Connect Account" for each platform
   - You should see the OAuth consent screen

## ⚠️ Common Issues

### Still getting "Invalid App ID"?

1. **Check for typos** - No extra spaces or quotes in `.env.local`
2. **Restart server** - Environment variables only load on startup
3. **Check platform status** - Make sure your app isn't in sandbox/development mode
4. **Verify redirect URIs** - Must match EXACTLY (including http:// prefix)

### Facebook/Instagram specific:
- App might be in "Development" mode - switch to "Live" for production
- You may need to add test users for development

### YouTube specific:
- OAuth consent screen must be configured
- Project must have YouTube API enabled

### X specific:
- App must have "User authentication" set up
- OAuth 2.0 must be explicitly enabled

## 📊 Production Deployment

When deploying to Vercel:

1. **Update redirect URIs** in each platform to use your production URL:
   ```
   https://your-app.vercel.app/api/social/callback/[platform]
   ```

2. **Add environment variables** to Vercel:
   - Go to your project settings
   - Add all the OAuth credentials
   - Update `NEXT_PUBLIC_APP_URL` to your production URL

3. **Submit for review** (if needed):
   - Facebook/Instagram may require app review
   - Other platforms usually work immediately

## 🆘 Still Having Issues?

1. Run the diagnostic endpoint to see what's missing
2. Check browser console for specific error messages
3. Verify credentials are copied correctly (no extra spaces)
4. Make sure all required APIs are enabled on each platform
5. Check that redirect URIs match exactly

Remember: Each platform has its own developer portal and setup process. Take your time and follow each step carefully! 