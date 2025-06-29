# NextAuth.js Social Media OAuth Setup

This guide explains how to set up NextAuth.js for OAuth authentication with social media platforms in Inflio.

## Overview

NextAuth.js handles the OAuth flow for connecting social media accounts, allowing users to:
- Authorize your app to post on their behalf
- Read analytics from their accounts
- Manage multiple social media accounts

## Environment Variables

Add these to your `.env.local` file:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here # Generate with: openssl rand -base64 32

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Social Media OAuth Credentials
# YouTube (via Google)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Facebook & Instagram
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# X (Twitter)
TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret

# LinkedIn
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
```

## Platform Setup

### 1. Google (YouTube)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable these APIs:
   - YouTube Data API v3
   - YouTube Analytics API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs:
     ```
     http://localhost:3000/api/auth/callback/google
     https://yourdomain.com/api/auth/callback/google
     ```
5. Copy Client ID and Client Secret to your `.env.local`

### 2. Facebook & Instagram

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app (Business type)
3. Add these products:
   - Facebook Login
   - Instagram Basic Display
   - Instagram Graph API
4. Settings → Basic:
   - Add your App Domains
   - Add Platform → Website → Site URL
5. Facebook Login → Settings:
   - Valid OAuth Redirect URIs:
     ```
     http://localhost:3000/api/auth/callback/facebook
     https://yourdomain.com/api/auth/callback/facebook
     ```
6. Copy App ID and App Secret to your `.env.local`

### 3. X (Twitter)

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new Project and App
3. Set up OAuth 2.0:
   - Type of App: Web App
   - Callback URI:
     ```
     http://localhost:3000/api/auth/callback/twitter
     https://yourdomain.com/api/auth/callback/twitter
     ```
   - Website URL: Your app URL
4. Copy Client ID and Client Secret to your `.env.local`

### 4. LinkedIn

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. Auth tab → OAuth 2.0 settings:
   - Redirect URLs:
     ```
     http://localhost:3000/api/auth/callback/linkedin
     https://yourdomain.com/api/auth/callback/linkedin
     ```
4. Products tab → Request access to:
   - Share on LinkedIn
   - Sign In with LinkedIn using OpenID Connect
5. Copy Client ID and Client Secret to your `.env.local`

## How It Works

1. **User clicks "Connect" in Social Media Hub**
   - The app redirects to NextAuth sign-in URL
   - NextAuth handles the OAuth flow

2. **OAuth Authorization**
   - User authorizes your app on the platform
   - Platform redirects back with authorization code

3. **Token Exchange**
   - NextAuth exchanges code for access token
   - Token is securely stored in your database

4. **Integration Complete**
   - User can now publish content
   - App can read analytics

## Usage in Your App

### Connect a Platform
```typescript
// In your component
const handleConnect = async (platform: string) => {
  const response = await fetch('/api/social/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platform })
  })
  
  const { authUrl } = await response.json()
  window.location.href = authUrl
}
```

### Publish Content
```typescript
// After connection is established
const publishPost = async (content: string, platforms: string[]) => {
  const response = await fetch('/api/social/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, platforms })
  })
  
  return response.json()
}
```

### Read Analytics
```typescript
// Get analytics for connected accounts
const getAnalytics = async (platform: string) => {
  const response = await fetch(`/api/social/analytics/${platform}`)
  return response.json()
}
```

## Security Best Practices

1. **Never expose credentials**
   - Keep all secrets in environment variables
   - Never commit `.env.local` to git

2. **Validate state parameter**
   - NextAuth handles CSRF protection
   - Additional validation in callbacks

3. **Token refresh**
   - Implement token refresh for long-lived access
   - Handle expired tokens gracefully

4. **Scope management**
   - Only request necessary permissions
   - Explain why each permission is needed

## Troubleshooting

### "Redirect URI mismatch"
- Ensure callback URLs match exactly in platform settings
- Check for http vs https
- Include trailing slashes if required

### "Invalid client"
- Verify Client ID and Secret are correct
- Check if app is in development/production mode
- Ensure app is approved (if required)

### "Token expired"
- Implement token refresh logic
- Re-authenticate if refresh fails
- Show clear error messages to users

## Next Steps

1. Complete platform app setups
2. Add environment variables
3. Test connections in development
4. Deploy and update production URLs
5. Test in production environment

## Support

For platform-specific issues:
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)
- [Twitter OAuth 2.0 Documentation](https://developer.twitter.com/en/docs/authentication/oauth-2-0)
- [LinkedIn OAuth Documentation](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication) 