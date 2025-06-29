# NextAuth.js Social Media OAuth - Quick Start Guide

## What We've Built

I've integrated NextAuth.js into your Inflio app to handle OAuth authentication for social media platforms. This allows users to:

✅ Connect their social media accounts securely
✅ Authorize your app to publish content on their behalf  
✅ Read analytics and insights from their accounts
✅ Manage multiple social accounts from one dashboard

## Key Components Added

### 1. **NextAuth Configuration** (`src/lib/auth.ts`)
- Configured OAuth providers for YouTube, Facebook/Instagram, X (Twitter), and LinkedIn
- Handles token storage in your existing Supabase database
- Integrates with your Clerk authentication

### 2. **API Routes**
- `/api/auth/[...nextauth]` - NextAuth OAuth handlers
- `/api/social/connect` - Initiates OAuth connection flow
- `/api/social/publish` - Publishes content to connected platforms
- `/api/social/analytics/[platform]` - Fetches platform analytics

### 3. **Updated Components**
- Social Account Connector now uses NextAuth flow
- Success redirects back to Social Media Hub

## Quick Setup Steps

### 1. Environment Variables
Add these to your `.env.local`:

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here # Generate: openssl rand -base64 32

# Social Platforms (get from each platform's developer console)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
```

### 2. Platform Setup
For each platform, add these callback URLs:
- Development: `http://localhost:3000/api/auth/callback/{provider}`
- Production: `https://yourdomain.com/api/auth/callback/{provider}`

Where `{provider}` is: `google`, `facebook`, `twitter`, or `linkedin`

### 3. Test the Flow

1. Go to `/social` in your app
2. Click on "Accounts" tab
3. Click "Connect Account" for any platform
4. Complete OAuth flow
5. Account will appear as connected

## How Users Connect Social Accounts

1. **Navigate to Social Media Hub** (`/social`)
   - Users see all available platforms
   - Connected accounts show with green checkmark

2. **Click "Connect Account"**
   - Redirects to platform's OAuth page
   - User authorizes your app
   - Automatically redirects back

3. **Start Publishing**
   - Use the compose feature to create posts
   - Select connected platforms
   - Publish immediately or schedule

## API Usage Examples

### Publishing Content
```typescript
const response = await fetch('/api/social/publish', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: 'Check out my latest video!',
    platforms: ['twitter', 'linkedin'],
    media: ['https://example.com/image.jpg'],
    projectId: 'optional-project-uuid'
  })
})
```

### Getting Analytics
```typescript
const analytics = await fetch('/api/social/analytics/twitter')
const data = await analytics.json()
// Returns follower count, engagement metrics, etc.
```

## Security Features

- ✅ Tokens stored securely in Supabase
- ✅ HTTP-only cookies for CSRF protection
- ✅ Automatic token refresh handling
- ✅ Platform-specific scope management

## Next Steps

1. **Set up OAuth apps** on each platform (see `/docs/setup/NEXTAUTH_SOCIAL_SETUP.md`)
2. **Add environment variables**
3. **Test connections** in development
4. **Deploy** and update production URLs

## Troubleshooting

### "Missing OAuth credentials"
→ Ensure all environment variables are set correctly

### "Redirect URI mismatch"  
→ Check callback URLs match exactly in platform settings

### "Failed to connect"
→ Verify OAuth app is approved/active on the platform

## Need Help?

- Detailed setup: `/docs/setup/NEXTAUTH_SOCIAL_SETUP.md`
- Platform guides: `/docs/setup/social-oauth-setup.md`
- API reference: Check the route files in `/src/app/api/social/`

---

The NextAuth.js integration is now ready to use! Just add your OAuth credentials and start connecting social accounts. 