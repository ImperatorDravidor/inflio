# 🔧 Fix Social OAuth "App Not Found" Errors

## The Problem

You're getting "app not found" errors because:
1. OAuth credentials aren't configured in your `.env.local`
2. Callback URLs in platform settings don't match your app's routes

## ✅ Step 1: Add Missing Credentials

Add these to your `.env.local` file:

```bash
# REQUIRED - Your app URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Facebook & Instagram (same app)
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
INSTAGRAM_CLIENT_ID=your-facebook-app-id      # Same as Facebook
INSTAGRAM_CLIENT_SECRET=your-facebook-app-secret # Same as Facebook

# YouTube (Google)
YOUTUBE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=your-google-client-secret

# X (Twitter)
TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret

# LinkedIn
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
```

## ✅ Step 2: Configure Each Platform

### 📘 Facebook & Instagram

1. Go to [Facebook Developers](https://developers.facebook.com)
2. Create App → Business Type → Name it "Inflio Dev"
3. Add Products:
   - Facebook Login → Set Up
   - Instagram Basic Display → Set Up
4. **Settings → Basic**: Copy App ID and App Secret
5. **Facebook Login → Settings**:
   - Valid OAuth Redirect URIs (add BOTH):
   ```
   http://localhost:3000/api/social/callback/facebook
   http://localhost:3000/api/social/callback/instagram
   ```
   - Save Changes

### 🎥 YouTube

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create Project → Enable "YouTube Data API v3"
3. Credentials → Create Credentials → OAuth 2.0 Client ID
4. Application type: Web application
5. **Authorized redirect URIs** (add this EXACT URL):
   ```
   http://localhost:3000/api/social/callback/youtube
   ```
6. Copy Client ID and Client Secret

### 🐦 X (Twitter)

1. Go to [Twitter Developer Portal](https://developer.twitter.com)
2. Create App → User authentication settings
3. Enable OAuth 2.0
4. App permissions: Read and write
5. **Callback URLs** (add this EXACT URL):
   ```
   http://localhost:3000/api/social/callback/x
   ```
6. Copy Client ID and Client Secret

### 💼 LinkedIn

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers)
2. Create App → Fill details
3. Auth tab → **Redirect URLs** (add this EXACT URL):
   ```
   http://localhost:3000/api/social/callback/linkedin
   ```
4. Copy Client ID and Client Secret

## ✅ Step 3: Test Your Setup

1. **Restart your dev server**:
   ```bash
   npm run dev
   ```

2. **Run diagnostics**:
   Visit: http://localhost:3000/api/diagnose-social-oauth

3. **Test connections**:
   - Go to `/social` page
   - Click "Connect Account" for each platform
   - You should see the OAuth login screen

## 🚨 Common Fixes

### Still getting errors?

1. **Exact URL Match**: The callback URL must match EXACTLY:
   - ✅ `http://localhost:3000/api/social/callback/facebook`
   - ❌ `http://localhost:3000/api/social/callback/facebook/` (no trailing slash)
   - ❌ `https://localhost:3000/api/social/callback/facebook` (http not https for local)

2. **Platform-Specific Issues**:
   - **Facebook**: App must be in "Development" mode for testing
   - **YouTube**: OAuth consent screen must be configured
   - **Twitter**: OAuth 2.0 must be explicitly enabled
   - **LinkedIn**: App must be verified (can take time)

3. **Environment Variables**:
   - No quotes around values in `.env.local`
   - No extra spaces
   - Restart server after changes

## 📊 Production Setup

When deploying to production:

1. **Update callback URLs** in each platform to:
   ```
   https://your-app.vercel.app/api/social/callback/[platform]
   ```

2. **Add environment variables** to Vercel

3. **Update** `NEXT_PUBLIC_APP_URL` to your production URL

## 🆘 Quick Debug

Check browser console for specific errors:
- "Invalid client" = Wrong credentials
- "Redirect URI mismatch" = URL doesn't match exactly
- "App not found" = App ID is wrong or not configured 