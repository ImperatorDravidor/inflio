# Social Media Integration Documentation

## Overview

The social media management system has been seamlessly integrated into the Inflio app, providing a comprehensive solution for scheduling, publishing, and managing content across multiple social platforms. This integration is built using the existing tech stack and follows the established design patterns.

## Architecture

### Tech Stack Integration
- **Framework**: Next.js 14 with App Router (matching existing setup)
- **Database**: Supabase (using existing connection)
- **Authentication**: Clerk (integrated with existing auth flow)
- **UI Components**: Existing design system with shadcn/ui
- **State Management**: React hooks with custom event system

### Database Schema
The social media tables are designed to work alongside existing project tables:
- `social_integrations` - OAuth connections for each platform
- `social_posts` - Content and scheduling with project linking
- `social_tags` - Categorization system
- `social_templates` - Reusable content templates
- `social_analytics` - Performance tracking
- `social_sets` - Grouped content campaigns

## Features

### 1. Social Media Dashboard (`/social`)
- **Connected Accounts Overview**: Visual status of all connected platforms
- **Post Statistics**: Real-time metrics and engagement data
- **Quick Actions**: One-click access to compose, calendar, and analytics
- **Platform Filtering**: View posts by specific social network
- **Upcoming Posts**: Timeline of scheduled content

### 2. Post Composer (`/social/compose`)
- **Multi-Platform Publishing**: Select multiple platforms for simultaneous posting
- **Character Limits**: Real-time validation per platform requirements
- **Media Support**: Upload images and videos with platform-specific formats
- **AI Content Suggestions**: Powered by existing OpenAI integration
- **Smart Scheduling**: Optimal timing recommendations
- **Project Integration**: Create posts directly from video projects

### 3. Project Integration
- **Share Button**: Added to project detail pages
- **Context Preservation**: Automatically includes project title and description
- **Media Linking**: Use project thumbnails and video clips
- **Analytics Tracking**: Link social performance back to projects

### 4. Navigation & Shortcuts
- **Sidebar Integration**: Social Media link with IconShare2
- **Keyboard Shortcuts**:
  - `Ctrl+N` - New post
  - `Ctrl+C` - Calendar view
  - `Ctrl+S` - Save draft
  - `Ctrl+Enter` - Schedule post
- **Project Navigation**: Seamless flow between projects and social

## API Structure

### Endpoints
- `/api/social/publish` - Handles post publishing queue
- `/api/social/callback/[platform]` - OAuth callback handlers
- **Integration with existing APIs**: Works with project and user endpoints

### Services
- `SocialMediaService` - Main service class following project service patterns
- Event-driven updates using `dispatchSocialUpdate()`
- Automatic project folder synchronization

## Implementation Details

### Code Organization
```
src/
├── app/
│   ├── social/
│   │   ├── page.tsx          # Dashboard
│   │   └── compose/
│   │       └── page.tsx      # Post composer
│   │
│   └── api/
│       └── social/
│           ├── publish/
│           └── callback/
├── lib/
│   └── social/
│       ├── types.ts          # TypeScript types
│       ├── social-service.ts # Service layer
│       └── index.ts          # Exports
└── components/
    └── social/
        └── social-share-button.tsx
```

### Design System Integration
- Uses existing gradient styles (`gradient-premium`, `gradient-subtle`)
- Consistent with app-wide animation patterns (Framer Motion)
- Follows established color scheme and spacing
- Responsive design matching existing layouts

### State Management
- Integrates with existing event system (`projectUpdate`, `socialUpdate`)
- Uses existing hooks (`useAuth`, `useKeyboardShortcuts`)
- Follows established loading and error patterns

## Platform Support

### Currently Integrated
1. **Twitter/X**
   - 280 character limit
   - Image and video support
   - Thread creation capability

2. **LinkedIn**
   - 3000 character limit
   - Professional content focus
   - Company page support

3. **Instagram**
   - 2200 character limit
   - Image/video requirements
   - Story and post types

4. **TikTok**
   - 2200 character limit
   - Video-first platform
   - Trending hashtags

5. **YouTube Shorts**
   - Title and description
   - Video thumbnail support
   - Playlist integration

6. **Facebook**
   - 63,206 character limit
   - Multiple media types
   - Page management

## Security & Permissions

### Row Level Security
All tables include RLS policies:
- Users can only see their own data
- Soft delete implementation
- Audit trails with timestamps

### OAuth Token Management
- Encrypted token storage
- Automatic refresh handling
- Secure callback validation

## Usage Examples

### Creating a Post from Project
```typescript
// In project detail page
<SocialShareButton project={project} />

// This opens composer with pre-filled content:
// - Project title and description
// - Link to project
// - Suggested hashtags
```

### Scheduling Posts
```typescript
// Multi-platform scheduling
const request: CreatePostRequest = {
  integration_ids: ['twitter_id', 'linkedin_id'],
  content: "Check out our latest video!",
  publish_date: scheduledDate.toISOString(),
  project_id: currentProject.id
}
```

## Future Enhancements

### Planned Features
1. **Analytics Dashboard**: Comprehensive performance metrics
2. **Content Calendar**: Visual scheduling interface
3. **Bulk Operations**: Multi-post management
4. **Team Collaboration**: Approval workflows
5. **AI Enhancements**: Auto-generated captions and hashtags

### Platform Additions
- Reddit integration
- Discord webhooks
- Slack notifications
- Custom webhook support

## Troubleshooting

### Common Issues
1. **Database Migration**: Ensure schema is applied via Supabase
2. **OAuth Setup**: Verify callback URLs match exactly
3. **Environment Variables**: Check all platform credentials
4. **CORS Issues**: Ensure API routes are properly configured

### Debug Mode
Enable debug logging:
```typescript
// In social-service.ts
const DEBUG = process.env.NODE_ENV === 'development'
```

## Contributing

### Adding New Platforms
1. Add platform type to `Platform` enum
2. Create OAuth handler in `/api/social/callback/[platform]`
3. Update `platformConfig` in composer
4. Add platform icon and colors

### Code Style
- Follow existing TypeScript patterns
- Use existing UI components
- Maintain consistent error handling
- Add proper loading states

For setup instructions, see [Social Media Setup Guide](setup/SOCIAL_MEDIA_SETUP.md). 