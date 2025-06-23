# Inflio - Functional App Guide

## Overview

Inflio is a comprehensive social media content creation platform that transforms long-form videos into short-form content, transcriptions, and social media posts. This guide explains the real, functional features available today.

## Current Features

### 1. Video Upload & Processing
- **Drag & Drop Upload**: Simply drag your video file onto the upload area
- **Supported Formats**: MP4, MOV, AVI, WebM (up to 2GB)
- **Automatic Processing**: Once uploaded, your video is automatically processed

### 2. AI-Powered Workflows (Active)
- **Transcription**: Converts speech to text with high accuracy
  - Speaker detection
  - Timestamps
  - Multiple language support
- **Smart Clips**: AI extracts viral moments from your video
  - Automatically identifies key moments
  - Generates clips optimized for social media
  - Includes viral scores and explanations

### 3. Social Media Integration
- **Platform Authentication Check**: Before publishing, the app verifies if your social accounts are connected
- **Redirect to Social Hub**: If accounts aren't connected, you're redirected to connect them first
- **Supported Platforms** (with proper OAuth setup):
  - Twitter/X
  - Instagram
  - LinkedIn
  - YouTube
  - TikTok
  - Facebook

## Workflow

### Step 1: Upload Video
1. Go to `/studio/upload`
2. Drag and drop your video or click to browse
3. Enter project title and description
4. Click "Start Processing"

### Step 2: Processing
- Automatic redirect to processing page
- Real-time progress tracking
- Transcription: 2-3 minutes
- Smart Clips: 5-7 minutes

### Step 3: Recap Page
- Automatic redirect after processing
- Shows summary of generated content:
  - Number of clips created
  - Transcription completed
  - Ready for publishing

### Step 4: Project Page
- View all generated content
- Select what to publish
- Edit content as needed
- Click "Publish Content"

### Step 5: Publishing
- Select platforms for each content piece
- **Authentication Check**: If platforms aren't connected, redirects to Social Hub
- Schedule or publish immediately

## Setting Up Social Media Authentication

### Database Setup
1. Run the social media integrations migration:
```sql
-- Located in migrations/social-media-integrations.sql
CREATE TABLE social_media_integrations (
  -- Table structure for storing OAuth tokens
);
```

### OAuth Configuration
For each platform, you need to:
1. Create a developer app on the platform
2. Add OAuth credentials to your `.env` file:
```env
# Twitter/X
TWITTER_CLIENT_ID=your_client_id
TWITTER_CLIENT_SECRET=your_client_secret

# Instagram/Facebook
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret

# Add similar for other platforms...
```

3. Configure callback URLs in platform settings:
```
https://your-domain.com/api/social/callback/twitter
https://your-domain.com/api/social/callback/instagram
# etc...
```

## Coming Soon Features
- **Blog Post Generation**: AI-generated SEO-optimized articles
- **Social Media Content**: Platform-specific posts with hashtags
- **Podcast Features**: Chapters, show notes, and highlights
- **Analytics Dashboard**: Track performance across platforms
- **Team Collaboration**: Multiple users on projects

## Important Notes

1. **Real Processing**: The app uses actual AI services (OpenAI, Klap) for processing
2. **Authentication Required**: You must connect social accounts before publishing
3. **Usage Limits**: Free tier includes 25 videos per month
4. **Processing Time**: Varies based on video length (typically 5-10 minutes total)

## Troubleshooting

### "Please connect social media platform first" error
- Go to `/social` 
- Click on the "Accounts" tab
- Follow setup instructions to connect platforms

### Processing takes too long
- Check video file size (should be under 2GB)
- Ensure stable internet connection
- Longer videos take more time to process

### Can't see publish button
- Ensure processing is complete
- At least one content type must be generated
- Check if you're on the correct project page

## API Endpoints

### Video Upload
- `POST /api/upload` - Uploads video to storage
- `POST /api/process-klap` - Starts clip generation
- `POST /api/process-transcription` - Starts transcription

### Social Media
- `GET /api/social/callback/[platform]` - OAuth callback
- `POST /api/social/publish` - Publishes content
- `GET /api/social/auth-check` - Verifies platform connection

## Best Practices

1. **Video Quality**: Use high-quality source videos for best results
2. **Video Length**: 5-30 minutes works best for clip generation
3. **Platform Selection**: Different content types work better on different platforms
4. **Review Before Publishing**: Always review generated content before publishing 