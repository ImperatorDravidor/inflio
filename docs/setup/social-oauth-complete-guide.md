# Complete Social Media OAuth Setup Guide

This guide will help you set up OAuth for all supported social media platforms in Inflio.

## Prerequisites

1. Your app must be deployed with a public URL (or use ngrok for local testing)
2. You need developer accounts for each platform you want to support

## Environment Variables Required

Add these to your `.env.local` file:

```bash
# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Change to your production URL
```

## Platform-Specific Setup

### 1. Google (YouTube)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable YouTube Data API v3 and YouTube Analytics API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Configure consent screen:
   - Add your app name and logo
   - Add scopes: 
     - `youtube.readonly`
     - `youtube.upload`
     - `yt-analytics.readonly`
6. Set authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
7. Copy credentials to `.env.local`:
   ```bash
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

### 2. Facebook (Facebook & Instagram)

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app → Select "Business" type
3. Add Facebook Login product
4. Settings → Basic:
   - Add App Domains
   - Add Privacy Policy URL
   - Add Terms of Service URL
5. Facebook Login → Settings:
   - Valid OAuth Redirect URIs:
     - `http://localhost:3000/api/auth/callback/facebook`
     - `https://yourdomain.com/api/auth/callback/facebook`
6. Add Instagram Basic Display product
7. Request permissions:
   - `email`
   - `public_profile`
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_posts`
   - `instagram_basic`
   - `instagram_content_publish`
   - `instagram_manage_insights`
8. Copy credentials to `.env.local`:
   ```bash
   FACEBOOK_APP_ID=your-app-id
   FACEBOOK_APP_SECRET=your-app-secret
   ```

### 3. X (Twitter)

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app
3. Go to User authentication settings
4. Enable OAuth 2.0
5. Set App permissions:
   - Read and write
   - Request email from users
6. Set Callback URLs:
   - `http://localhost:3000/api/auth/callback/twitter`
   - `https://yourdomain.com/api/auth/callback/twitter`
7. Type of App: Web App
8. Copy credentials to `.env.local`:
   ```bash
   TWITTER_CLIENT_ID=your-client-id
   TWITTER_CLIENT_SECRET=your-client-secret
   ```

### 4. LinkedIn

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. Go to Auth tab
4. Add Redirect URLs:
   - `http://localhost:3000/api/auth/callback/linkedin`
   - `https://yourdomain.com/api/auth/callback/linkedin`
5. Request access to:
   - Sign In with LinkedIn
   - Share on LinkedIn
6. Copy credentials to `.env.local`:
   ```bash
   LINKEDIN_CLIENT_ID=your-client-id
   LINKEDIN_CLIENT_SECRET=your-client-secret
   ```

## Testing Your Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/social` in your app

3. Try connecting each platform

## Common Issues

### "Redirect URI mismatch"
- Ensure your redirect URIs exactly match in both your app and platform settings
- Include both http://localhost:3000 and your production URL

### "Invalid client"
- Double-check your client ID and secret are copied correctly
- Ensure no extra spaces or line breaks

### Facebook/Instagram specific
- Your app may need to be reviewed by Facebook for production use
- Test users can be added in App Roles for development

### X (Twitter) specific
- Ensure your app has elevated access for full API features
- OAuth 2.0 must be explicitly enabled

## Production Checklist

Before going to production:

1. ✅ Update all redirect URIs to use HTTPS and your production domain
2. ✅ Set `NEXT_PUBLIC_APP_URL` to your production URL
3. ✅ Submit apps for review (Facebook/Instagram)
4. ✅ Enable production mode in all developer consoles
5. ✅ Set up proper privacy policy and terms of service pages
6. ✅ Test the complete OAuth flow on production

## Security Best Practices

1. Never commit `.env.local` to version control
2. Use different OAuth apps for development and production
3. Regularly rotate your client secrets
4. Monitor OAuth app usage in developer consoles
5. Implement proper token refresh logic

## Next Steps

After setting up OAuth:

1. Users can connect their accounts at `/social`
2. Connected accounts will appear in the Social Account Connector component
3. Users can schedule and publish content to connected platforms
4. Analytics will be automatically fetched for connected accounts

For platform-specific API usage and limitations, refer to each platform's documentation. 