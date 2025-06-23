# Social Media Integration Setup

## Overview
The social media integration has been seamlessly integrated into your Inflio app. This guide will help you complete the setup.

## 1. Database Setup

First, you need to run the social media schema migration to create the necessary tables in your Supabase database.

### Option A: Using Supabase CLI
```bash
# Make sure you have your DATABASE_URL in your .env.local file
npx supabase db push --db-url=$DATABASE_URL < migrations/social-media-schema.sql
```

### Option B: Using Supabase Dashboard
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy the contents of `migrations/social-media-schema.sql`
4. Paste and run the SQL

## 2. OAuth Setup

To enable social media posting, you'll need to set up OAuth for each platform:

### Twitter/X
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app
3. Add these callback URLs:
   - `http://localhost:3000/api/social/callback/twitter` (development)
   - `https://yourdomain.com/api/social/callback/twitter` (production)
4. Copy your API keys and add to `.env.local`:
   ```
   TWITTER_CLIENT_ID=your_client_id
   TWITTER_CLIENT_SECRET=your_client_secret
   ```

### LinkedIn
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. Add OAuth 2.0 redirect URLs:
   - `http://localhost:3000/api/social/callback/linkedin` (development)
   - `https://yourdomain.com/api/social/callback/linkedin` (production)
4. Copy your credentials and add to `.env.local`:
   ```
   LINKEDIN_CLIENT_ID=your_client_id
   LINKEDIN_CLIENT_SECRET=your_client_secret
   ```

### Instagram/Facebook
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Instagram Basic Display and Facebook Login products
4. Configure OAuth redirect URIs
5. Add credentials to `.env.local`:
   ```
   FACEBOOK_APP_ID=your_app_id
   FACEBOOK_APP_SECRET=your_app_secret
   ```

### YouTube
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or use existing
3. Enable YouTube Data API v3
4. Create OAuth 2.0 credentials
5. Add redirect URIs
6. Add to `.env.local`:
   ```
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```

### TikTok
1. Go to [TikTok for Developers](https://developers.tiktok.com/)
2. Create a new app
3. Configure OAuth settings
4. Add to `.env.local`:
   ```
   TIKTOK_CLIENT_KEY=your_client_key
   TIKTOK_CLIENT_SECRET=your_client_secret
   ```

## 3. Features Overview

### Social Media Dashboard (`/social`)
- View all connected social accounts
- Monitor post statistics
- Manage scheduled posts
- Quick actions for creating new posts

### Post Composer (`/social/compose`)
- Multi-platform posting
- Character count validation per platform
- Media upload support
- AI-powered content suggestions
- Schedule posts for optimal times

### Project Integration
- Share button on project detail pages
- Create social posts directly from video projects
- Pre-fill content with project information
- Track which posts are linked to which projects

### Keyboard Shortcuts
- `Ctrl+N` - Create new post
- `Ctrl+C` - View calendar
- `Ctrl+S` - Save draft (in composer)
- `Ctrl+Enter` - Schedule post (in composer)

## 4. Testing the Integration

1. Navigate to `/social` in your app
2. Connect a social media account
3. Create a test post
4. Try sharing from a project page

## 5. Customization

### Platform Limits
Edit `src/app/social/compose/page.tsx` to adjust character limits:
```typescript
const platformConfig = {
  twitter: { maxLength: 280, supportsMedia: true, mediaTypes: ['image', 'video'] },
  // ... adjust as needed
}
```

### AI Suggestions
The AI content suggestions use your existing OpenAI setup. Make sure your `OPENAI_API_KEY` is configured.

## Troubleshooting

### "Failed to load integrations"
- Check that the database migration has run successfully
- Verify your Supabase connection

### OAuth errors
- Ensure callback URLs match exactly
- Check that all environment variables are set
- Verify API keys are correct

### Posts not appearing in projects
- Ensure you're passing `projectId` when creating posts
- Check browser console for errors

## Next Steps

1. Complete OAuth setup for desired platforms
2. Test posting functionality
3. Customize platform settings as needed
4. Set up webhook endpoints for real-time updates (optional)

For more details, see the main [Social Media Integration documentation](../SOCIAL_MEDIA_INTEGRATION.md). 