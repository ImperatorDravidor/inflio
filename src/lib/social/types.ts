export type SocialPlatform = 
  | 'instagram' 
  | 'tiktok' 
  | 'facebook' 
  | 'youtube' 
  | 'linkedin' 
  | 'x' // Twitter/X
  | 'threads';

export interface PlatformMetrics {
  platform: SocialPlatform;
  views: number;
  followersGained: number;
  totalFollowers: number;
  engagementRate?: number;
  avgViewDuration?: number;
  impressions?: number;
}

export interface TopPerformingContent {
  id: string;
  platform: SocialPlatform;
  title: string;
  url: string;
  views: number;
  likes?: number;
  shares?: number;
  comments?: number;
  thumbnail?: string;
  publishedAt: Date;
}

export interface SocialMediaStats {
  userId: string;
  period: 'week' | 'month' | 'quarter' | 'year' | 'alltime';
  startDate: Date;
  endDate: Date;
  totalViews: number;
  totalFollowersGained: number;
  totalEngagements: number;
  platformMetrics: PlatformMetrics[];
  topPerformingContent: TopPerformingContent[];
  growthRate: number; // Percentage growth compared to previous period
  avgEngagementRate: number;
}

export interface RecapData {
  stats: SocialMediaStats;
  previousPeriodStats?: SocialMediaStats;
  milestones: Milestone[];
  insights: Insight[];
  nextSteps: string[];
}

export interface Milestone {
  id: string;
  type: 'followers' | 'views' | 'engagement' | 'content';
  title: string;
  description: string;
  achievedAt: Date;
  icon?: string;
  value?: number;
}

export interface Insight {
  id: string;
  type: 'tip' | 'trend' | 'performance' | 'opportunity';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  action?: string;
}

export interface ProjectUpdate {
  id: string;
  projectId: string;
  title: string;
  status: 'completed' | 'in_progress' | 'scheduled';
  description: string;
  completedAt?: Date;
  scheduledFor?: Date;
}

// Database schema
export interface SocialMediaRecord {
  id: string;
  user_id: string;
  platform: SocialPlatform;
  metric_type: 'views' | 'followers' | 'engagement';
  value: number;
  recorded_at: Date;
  created_at: Date;
  metadata?: Record<string, any>;
}