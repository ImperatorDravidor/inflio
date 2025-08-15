# Stage → Smart Schedule → Publish Workflow

## Overview
Complete content publishing pipeline from content selection through smart scheduling to final publication on social media platforms.

## Components

### 1. Content Staging (EnhancedContentStager)
- **Features**:
  - Multi-content selection (clips, images, posts, long-form)
  - Platform validation and eligibility checks
  - Per-platform content customization
  - Media preview and management
  - Batch operations

### 2. Smart Scheduling (SchedulingWizard)
- **Strategies**:
  - **Optimal**: AI-powered best times based on audience behavior
  - **Rapid**: Quick succession for momentum building
  - **Steady**: Even distribution over time
  - **Prime Time**: Peak engagement hours only
  - **Weekend Warrior**: Weekend-focused strategy
  - **Business Hours**: Professional timing

### 3. Publishing Manager
- **Features**:
  - Multi-step validation
  - Platform-specific publishing
  - Error handling and retries
  - Progress tracking
  - Success/failure notifications

### 4. Calendar View
- **Views**:
  - Month view with day-by-day posts
  - Week view with detailed timeslots
  - List view with drag-to-reorder
- **Actions**:
  - Edit captions inline
  - Reschedule by dragging
  - Publish immediately
  - Duplicate posts
  - Delete scheduled items

## Data Flow

### Stage Process
```typescript
1. Select content from project
2. Validate platform requirements
3. Customize per-platform copy
4. Apply platform-specific settings
5. Move to scheduling queue
```

### Schedule Process
```typescript
1. Analyze content for optimal timing
2. Check platform rate limits
3. Avoid conflicts with existing posts
4. Generate schedule with AI optimization
5. Allow manual adjustments
```

### Publish Process
```typescript
1. Validate OAuth tokens
2. Prepare media assets
3. Call platform APIs
4. Handle errors with retry
5. Update status in database
6. Send notifications
```

## Platform Requirements

### Instagram
- Image: 1080x1080 (square), 1080x1350 (portrait)
- Caption: Max 2,200 characters
- Hashtags: Max 30
- Carousel: 2-10 images/videos

### Twitter/X
- Images: Max 4 per tweet
- Text: 280 characters
- Threads: Unlimited tweets
- Video: Max 2:20 duration

### LinkedIn
- Images: 1200x627 optimal
- Text: 3,000 characters
- Articles: Unlimited length
- Native video preferred

### TikTok
- Video only: 9:16 aspect ratio
- Caption: 2,200 characters
- Duration: 10 seconds to 10 minutes

### YouTube
- Shorts: Max 60 seconds, vertical
- Thumbnail: 1280x720
- Title: 100 characters
- Description: 5,000 characters

### Facebook
- Images: 1200x630 optimal
- Text: 63,206 characters (keep under 500)
- Video: Various formats supported
- Stories: 9:16 aspect ratio

## Smart Scheduling Algorithm

### Factors Considered
1. **Historical Performance**: Past engagement patterns
2. **Platform Best Practices**: Known optimal times
3. **Audience Timezone**: Geographic distribution
4. **Content Type**: Video vs image vs text
5. **Competition**: Avoid oversaturated times
6. **Frequency Caps**: Platform rate limits

### Optimal Times (Default)
```javascript
const optimalTimes = {
  instagram: ['08:00', '12:00', '17:00', '20:00'],
  twitter: ['09:00', '12:30', '17:30', '21:00'],
  linkedin: ['07:30', '10:00', '17:00'],
  tiktok: ['06:00', '10:00', '19:00', '23:00'],
  youtube: ['14:00', '17:00', '20:00'],
  facebook: ['09:00', '15:00', '20:00']
}
```

## API Endpoints

### POST /api/social/publish
Immediate publishing:
```json
{
  "content": "Post text",
  "mediaUrls": ["..."],
  "platforms": ["instagram", "twitter"],
  "projectId": "uuid"
}
```

### POST /api/social/publish-scheduled
Scheduled publishing:
```json
{
  "posts": [{
    "content": "...",
    "publishDate": "2024-01-20T14:00:00Z",
    "platforms": ["..."],
    "metadata": {}
  }]
}
```

### GET /api/social/calendar
Fetch scheduled posts:
```
?userId=xxx&start=2024-01-01&end=2024-01-31&platform=instagram
```

## Database Schema

### social_posts
```sql
- id (UUID)
- user_id (TEXT)
- project_id (UUID)
- integration_id (UUID) - OAuth connection
- content (TEXT)
- media_urls (TEXT[])
- hashtags (TEXT[])
- publish_date (TIMESTAMP)
- state (TEXT) - draft|scheduled|publishing|published|failed
- settings (JSONB) - Platform-specific settings
- error_message (TEXT)
- published_at (TIMESTAMP)
- engagement_metrics (JSONB)
```

### staging_sessions
```sql
- id (UUID)
- user_id (TEXT)
- project_id (UUID)
- session_data (JSONB) - Staged content
- status (TEXT) - active|completed|abandoned
- created_at (TIMESTAMP)
- expires_at (TIMESTAMP)
```

### social_integrations
```sql
- id (UUID)
- user_id (TEXT)
- platform (TEXT)
- handle (TEXT)
- access_token (TEXT encrypted)
- refresh_token (TEXT encrypted)
- expires_at (TIMESTAMP)
- status (TEXT) - active|expired|revoked
```

## Publishing States

### State Machine
```
draft → scheduled → publishing → published
         ↓              ↓
       cancelled      failed → retry → published/failed
```

### Status Definitions
- **draft**: Created but not scheduled
- **scheduled**: Queued for future publishing
- **publishing**: Currently being processed
- **published**: Successfully posted
- **failed**: Publishing failed
- **cancelled**: User cancelled before publishing

## Error Handling

### Retry Strategy
1. **Immediate retry**: Network timeouts
2. **Delayed retry**: Rate limits (exponential backoff)
3. **Manual retry**: Auth failures
4. **No retry**: Invalid content, policy violations

### Common Errors
- **401**: OAuth token expired → Refresh token
- **429**: Rate limited → Wait and retry
- **400**: Invalid content → Notify user
- **503**: Service unavailable → Retry later

## Analytics & Tracking

### Metrics Collected
- Posts scheduled per platform
- Publishing success rate
- Average engagement per time slot
- Optimal posting times discovered
- Content type performance

### Events Tracked
```javascript
// Analytics events
track('post.staged', { contentType, platforms })
track('post.scheduled', { scheduledDate, strategy })
track('post.published', { platform, success })
track('post.failed', { platform, error })
track('calendar.viewed', { view, dateRange })
```

## User Workflow

### Complete Flow
1. **Create Content** in project (video/blog/images)
2. **Generate Posts** with AI suggestions
3. **Select Content** to publish
4. **Stage Content** with platform customization
5. **Smart Schedule** with AI optimization
6. **Review Calendar** and adjust
7. **Auto-Publish** at scheduled times
8. **Track Performance** in analytics

## Permissions & Security

### OAuth Scopes Required
- Instagram: `instagram_basic`, `instagram_content_publish`
- Twitter/X: `tweet.read`, `tweet.write`
- LinkedIn: `w_member_social`
- Facebook: `pages_manage_posts`, `pages_read_engagement`
- YouTube: `youtube.upload`
- TikTok: `video.upload`

### Security Measures
- Encrypted token storage
- Token refresh before expiry
- Rate limit compliance
- Content moderation checks
- Audit logging

## Testing Checklist
- [x] Content stages with all media types
- [x] Platform validation works correctly
- [x] Smart scheduling generates optimal times
- [x] Calendar displays all views properly
- [x] Drag-to-reschedule updates database
- [x] Publishing to platforms succeeds
- [x] Error handling and retries work
- [x] OAuth token refresh functions
- [x] Analytics events fire correctly