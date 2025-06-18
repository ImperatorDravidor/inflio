import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { 
  SocialMediaStats, 
  SocialPlatform, 
  PlatformMetrics, 
  TopPerformingContent,
  RecapData,
  Milestone,
  Insight,
  ProjectUpdate
} from './types';
import { ProjectService } from '@/lib/project-service';

export class SocialMediaService {
  static async getRecapData(userId: string, period: 'week' | 'month' = 'week'): Promise<RecapData> {
    try {
      // Get current period stats
      const stats = await this.getSocialMediaStats(userId, period);
      
      // Get previous period stats for comparison
      const previousPeriodStats = await this.getPreviousPeriodStats(userId, period);
      
      // Generate milestones based on achievements
      const milestones = this.generateMilestones(stats, previousPeriodStats);
      
      // Generate insights and recommendations
      const insights = this.generateInsights(stats, previousPeriodStats);
      
      // Get next steps
      const nextSteps = this.generateNextSteps(stats);

      return {
        stats,
        previousPeriodStats,
        milestones,
        insights,
        nextSteps
      };
    } catch (error) {
      console.error('Error getting recap data:', error);
      // Return mock data for now
      return this.getMockRecapData(userId, period);
    }
  }

  static async getSocialMediaStats(userId: string, period: 'week' | 'month' | 'quarter' | 'year' | 'alltime' = 'week'): Promise<SocialMediaStats> {
    const endDate = new Date();
    const startDate = this.getStartDate(period, endDate);

    try {
      // In a real implementation, this would fetch from your analytics database
      // For now, we'll generate realistic mock data
      const platformMetrics = await this.getPlatformMetrics(userId, startDate, endDate);
      const topContent = await this.getTopPerformingContent(userId, startDate, endDate);
      
      const totalViews = platformMetrics.reduce((sum, p) => sum + p.views, 0);
      const totalFollowersGained = platformMetrics.reduce((sum, p) => sum + p.followersGained, 0);
      const totalEngagements = topContent.reduce((sum, c) => sum + (c.likes || 0) + (c.shares || 0) + (c.comments || 0), 0);
      
      const avgEngagementRate = totalViews > 0 ? (totalEngagements / totalViews) * 100 : 0;
      const growthRate = await this.calculateGrowthRate(userId, period, totalViews);

      return {
        userId,
        period,
        startDate,
        endDate,
        totalViews,
        totalFollowersGained,
        totalEngagements,
        platformMetrics,
        topPerformingContent: topContent,
        growthRate,
        avgEngagementRate
      };
    } catch (error) {
      console.error('Error fetching social media stats:', error);
      return this.getMockStats(userId, period, startDate, endDate);
    }
  }

  private static getStartDate(period: string, endDate: Date): Date {
    const startDate = new Date(endDate);
    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'alltime':
        startDate.setFullYear(2020); // Or whenever the user joined
        break;
    }
    return startDate;
  }

  private static async getPlatformMetrics(userId: string, startDate: Date, endDate: Date): Promise<PlatformMetrics[]> {
    // Mock data - replace with actual database queries
    const platforms: SocialPlatform[] = ['instagram', 'tiktok', 'facebook', 'youtube', 'linkedin', 'x'];
    
    return platforms.map(platform => ({
      platform,
      views: Math.floor(Math.random() * 5000) + 1000,
      followersGained: Math.floor(Math.random() * 100) + 10,
      totalFollowers: Math.floor(Math.random() * 5000) + 500,
      engagementRate: Math.random() * 10 + 2,
      avgViewDuration: platform === 'youtube' ? Math.random() * 300 + 60 : undefined,
      impressions: Math.floor(Math.random() * 10000) + 2000
    }));
  }

  private static async getTopPerformingContent(userId: string, startDate: Date, endDate: Date): Promise<TopPerformingContent[]> {
    // Mock data - replace with actual content queries
    return [
      {
        id: '1',
        platform: 'youtube',
        title: 'How to Build a SaaS App in 2024',
        url: 'https://www.youtube.com/shorts/5cHsaSNeVK0',
        views: 1459,
        likes: 89,
        shares: 23,
        comments: 15,
        thumbnail: '/api/placeholder/120/68',
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        id: '2',
        platform: 'linkedin',
        title: '5 Lessons from Scaling to $1M ARR',
        url: 'https://linkedin.com/posts/example',
        views: 4532,
        likes: 234,
        shares: 67,
        comments: 43,
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      }
    ];
  }

  private static async calculateGrowthRate(userId: string, period: string, currentViews: number): Promise<number> {
    // Mock calculation - replace with actual comparison to previous period
    return Math.random() * 50 - 10; // Random growth between -10% and +40%
  }

  private static async getPreviousPeriodStats(userId: string, period: 'week' | 'month'): Promise<SocialMediaStats> {
    const endDate = new Date();
    const periodDays = period === 'week' ? 7 : 30;
    endDate.setDate(endDate.getDate() - periodDays);
    
    return this.getSocialMediaStats(userId, period);
  }

  private static generateMilestones(stats: SocialMediaStats, previousStats?: SocialMediaStats): Milestone[] {
    const milestones: Milestone[] = [];
    
    // Check for follower milestones
    if (stats.totalFollowersGained > 100) {
      milestones.push({
        id: '1',
        type: 'followers',
        title: '100+ New Followers! 🎉',
        description: `You gained ${stats.totalFollowersGained} followers this ${stats.period}`,
        achievedAt: new Date(),
        value: stats.totalFollowersGained
      });
    }
    
    // Check for view milestones
    if (stats.totalViews > 10000) {
      milestones.push({
        id: '2',
        type: 'views',
        title: '10K+ Views Milestone! 👀',
        description: 'Your content reached over 10,000 people',
        achievedAt: new Date(),
        value: stats.totalViews
      });
    }
    
    // Check for engagement milestones
    if (stats.avgEngagementRate > 5) {
      milestones.push({
        id: '3',
        type: 'engagement',
        title: 'High Engagement Rate! 💬',
        description: `${stats.avgEngagementRate.toFixed(1)}% engagement rate is above industry average`,
        achievedAt: new Date(),
        value: stats.avgEngagementRate
      });
    }
    
    return milestones;
  }

  private static generateInsights(stats: SocialMediaStats, previousStats?: SocialMediaStats): Insight[] {
    const insights: Insight[] = [];
    
    // Platform performance insights
    const bestPlatform = stats.platformMetrics.reduce((best, current) => 
      current.views > best.views ? current : best
    );
    
    insights.push({
      id: '1',
      type: 'performance',
      title: `${bestPlatform.platform.charAt(0).toUpperCase() + bestPlatform.platform.slice(1)} is Your Top Platform`,
      description: `With ${bestPlatform.views.toLocaleString()} views and ${bestPlatform.followersGained} new followers`,
      priority: 'high',
      actionable: true,
      action: 'Focus more content on this platform'
    });
    
    // Growth insights
    if (stats.growthRate > 20) {
      insights.push({
        id: '2',
        type: 'trend',
        title: 'Rapid Growth Detected! 📈',
        description: `Your views grew by ${stats.growthRate.toFixed(1)}% compared to last ${stats.period}`,
        priority: 'high',
        actionable: true,
        action: 'Keep doing what you\'re doing!'
      });
    }
    
    // Opportunity insights
    const lowPerformingPlatform = stats.platformMetrics.reduce((worst, current) => 
      current.views < worst.views ? current : worst
    );
    
    if (lowPerformingPlatform.views < 500) {
      insights.push({
        id: '3',
        type: 'opportunity',
        title: `Opportunity on ${lowPerformingPlatform.platform}`,
        description: 'This platform has room for growth. Consider adjusting your content strategy.',
        priority: 'medium',
        actionable: true,
        action: 'Try different content formats or posting times'
      });
    }
    
    // Best practices tips
    insights.push({
      id: '4',
      type: 'tip',
      title: 'Pro Tip: Optimal Posting Times',
      description: 'Tuesday-Thursday, 9AM-12PM typically see highest engagement',
      priority: 'low',
      actionable: false
    });
    
    return insights;
  }

  private static generateNextSteps(stats: SocialMediaStats): string[] {
    const nextSteps: string[] = [];
    
    if (stats.topPerformingContent.length > 0) {
      nextSteps.push(`Create more content similar to "${stats.topPerformingContent[0].title}"`);
    }
    
    nextSteps.push('Schedule content for peak engagement times');
    nextSteps.push('Engage with your audience through comments and DMs');
    
    if (stats.avgEngagementRate < 3) {
      nextSteps.push('Add more calls-to-action to boost engagement');
    }
    
    return nextSteps;
  }

  private static getMockRecapData(userId: string, period: 'week' | 'month'): RecapData {
    const mockStats = this.getMockStats(userId, period, new Date(), new Date());
    
    return {
      stats: mockStats,
      milestones: this.generateMilestones(mockStats),
      insights: this.generateInsights(mockStats),
      nextSteps: this.generateNextSteps(mockStats)
    };
  }

  private static getMockStats(userId: string, period: 'week' | 'month' | 'quarter' | 'year' | 'alltime', startDate: Date, endDate: Date): SocialMediaStats {
    const platforms: SocialPlatform[] = ['instagram', 'tiktok', 'facebook', 'youtube', 'linkedin', 'x'];
    
    const platformMetrics: PlatformMetrics[] = platforms.map(platform => {
      const baseViews = Math.floor(Math.random() * 4000) + 1000;
      const baseFollowers = Math.floor(Math.random() * 50) + 5;
      
      return {
        platform,
        views: platform === 'linkedin' ? baseViews * 1.2 : baseViews,
        followersGained: platform === 'linkedin' ? baseFollowers * 2 : baseFollowers,
        totalFollowers: Math.floor(Math.random() * 5000) + 500,
        engagementRate: Math.random() * 8 + 2,
        avgViewDuration: platform === 'youtube' ? Math.random() * 180 + 30 : undefined
      };
    });
    
    const totalViews = 22500;
    const totalFollowersGained = 76;
    
    return {
      userId,
      period,
      startDate,
      endDate,
      totalViews,
      totalFollowersGained,
      totalEngagements: Math.floor(totalViews * 0.05),
      platformMetrics,
      topPerformingContent: [
        {
          id: '1',
          platform: 'youtube',
          title: 'Your Top Video This Week',
          url: 'https://www.youtube.com/shorts/5cHsaSNeVK0',
          views: 1459,
          likes: 89,
          shares: 23,
          comments: 15,
          publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        }
      ],
      growthRate: 23.5,
      avgEngagementRate: 4.8
    };
  }

  static async getProjectUpdates(userId: string, period: 'week' | 'month' = 'week'): Promise<ProjectUpdate[]> {
    // Mock project updates - in real app, fetch from project service
    return [
      {
        id: '1',
        projectId: 'proj_1',
        title: 'Thumbnails for IG and TT',
        status: 'completed',
        description: 'Created and updated on all platforms. All future videos will have designed thumbnails.',
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        id: '2',
        projectId: 'proj_2',
        title: 'First Podcast Episode',
        status: 'scheduled',
        description: 'Going live tomorrow morning at 6:00 AM (LA time)',
        scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000)
      },
      {
        id: '3',
        projectId: 'proj_3',
        title: 'SEO and Thumbnail Updates',
        status: 'in_progress',
        description: 'Almost finished with the Modern Lending Lab playlist optimization'
      }
    ];
  }
}