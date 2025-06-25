import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { 
  SocialMediaStats, 
  SocialPlatform, 
  PlatformMetrics, 
  TopPerformingContent,
  ProjectUpdate
} from './types';
import { ProjectService } from '@/lib/project-service';

export class SocialMediaService {

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