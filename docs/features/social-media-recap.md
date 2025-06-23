# Social Media Recap Wizard

The Recap Wizard provides users with comprehensive analytics and insights about their social media performance across all connected platforms.

## Features

### 1. Multi-Platform Analytics
- **Supported Platforms**: Instagram, TikTok, Facebook, YouTube, LinkedIn, X (Twitter), Threads
- **Key Metrics**: Views, followers gained, engagement rate, top performing content
- **Time Periods**: Weekly and monthly recaps

### 2. Intelligent Insights
- **Performance Analysis**: Identifies best-performing platforms and content
- **Growth Tracking**: Compares current period with previous period
- **Actionable Recommendations**: Provides specific suggestions to improve reach

### 3. Project Updates
- Shows progress on content creation projects
- Tracks completed, in-progress, and scheduled tasks
- Integrates with the main project management system

### 4. Milestones & Achievements
- Celebrates follower milestones (100+, 1K+, 10K+)
- Recognizes view milestones
- Highlights engagement achievements

## Usage

### Automatic Display
The recap wizard automatically shows:
1. **On First Login**: New users see it after completing onboarding
2. **Daily Login**: Returning users see it once per day on first login
3. **Manual Access**: Users can view it anytime via the "View Recap" button

### Components Structure

```typescript
// Main component
<RecapWizard 
  userId={string}           // User's ID
  isReturningUser={boolean} // New vs returning user
  onClose={() => void}      // Callback when closed
/>
```

### Sections

1. **Overview**: Key metrics, top content, milestones
2. **Platform Breakdown**: Detailed stats per platform
3. **Project Updates**: Content creation progress
4. **Insights & Next Steps**: AI-powered recommendations

## Implementation Details

### Data Sources

Currently using mock data with realistic values based on the example provided. To connect real data:

1. **Social Media APIs**: Integrate with platform APIs for real metrics
2. **Database Tables**: Use the provided SQL schema to store historical data
3. **Analytics Services**: Connect to third-party analytics tools

### Database Schema

```sql
-- Key tables created:
- social_platform_connections    -- Store OAuth tokens
- social_media_metrics          -- Daily platform metrics
- social_content_performance    -- Individual content stats
- user_milestones              -- Achievement tracking
- recap_views                  -- Track recap viewing
```

### Customization

#### Modify Metrics
Edit `src/lib/social/social-service.ts`:
```typescript
// Add new platforms
const platforms: SocialPlatform[] = ['instagram', 'tiktok', ...];

// Adjust milestone thresholds
if (stats.totalFollowersGained > 100) { // Change threshold
  milestones.push({...});
}
```

#### Style Customization
Edit `src/components/social/recap-wizard.tsx`:
```typescript
// Platform colors
const platformColors: Record<string, string> = {
  instagram: 'bg-gradient-to-br from-purple-600 to-pink-600',
  // Add or modify colors
};
```

## API Integration

To connect real social media data:

### 1. Instagram
```typescript
// Example integration point
async getPlatformMetrics(userId: string, startDate: Date, endDate: Date) {
  const instagramData = await fetchInstagramInsights(accessToken);
  return {
    platform: 'instagram',
    views: instagramData.impressions,
    followersGained: instagramData.follower_count_delta,
    // ... map other metrics
  };
}
```

### 2. YouTube
```typescript
// YouTube Analytics API
const youtubeData = await youtube.reports.query({
  ids: 'channel==MINE',
  metrics: 'views,subscribersGained',
  dimensions: 'day',
  startDate: startDate.toISOString(),
  endDate: endDate.toISOString()
});
```

### 3. Other Platforms
Similar integration patterns for TikTok, LinkedIn, etc.

## Best Practices

1. **Data Freshness**: Update metrics daily via cron jobs
2. **Performance**: Cache recap data for quick loading
3. **Privacy**: Only show data from connected platforms
4. **Mobile Responsive**: Optimized for all screen sizes

## Future Enhancements

1. **Export Reports**: PDF/CSV export functionality
2. **Email Summaries**: Weekly email recaps
3. **Competitor Analysis**: Compare with industry benchmarks
4. **Content Calendar**: Integrated scheduling based on insights
5. **A/B Testing**: Track performance of different content strategies

## Troubleshooting

### Common Issues

1. **No Data Showing**: Ensure user has connected social accounts
2. **Incorrect Metrics**: Check API rate limits and token expiration
3. **Slow Loading**: Implement pagination for large datasets

### Debug Mode

Enable debug logging:
```typescript
// In social-service.ts
const DEBUG = process.env.NODE_ENV === 'development';
if (DEBUG) console.log('Fetching metrics:', userId, period);
```