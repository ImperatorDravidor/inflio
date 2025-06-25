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
  metadata?: Record<string, unknown>;
}

export type Platform = SocialPlatform; // Alias for consistency

export interface SocialIntegration {
  id: string;
  user_id: string;
  platform: Platform;
  name: string; // Account name/handle
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: Date;
  profile_image?: string;
  followers_count?: number;
  created_at: Date;
  updated_at: Date;
  disabled: boolean;
  refresh_needed?: boolean;
}

export interface SocialPost {
  id: string;
  user_id: string;
  integration?: SocialIntegration;
  integration_id?: string;
  content: string;
  media_urls?: string[];
  publish_date: Date;
  state: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'cancelled';
  error?: string;
  hashtags?: string[]; // Add hashtags property
  analytics?: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    impressions?: number;
    published_at?: string;
  };
  created_at: Date;
  updated_at: Date;
  project_id?: string; // Link to project if created from a project
  metadata?: Record<string, unknown>;
}

export interface CreatePostRequest {
  content: string;
  platforms: Platform[];
  integration_ids?: string[]; // Alternative to platforms for direct integration selection
  media_urls?: string[];
  scheduled_date?: Date;
  title?: string;
  description?: string;
  hashtags?: string[];
  publish_date?: string;
  project_id?: string;
  metadata?: Record<string, unknown>;
}

// Mock service class with instance methods
export class SocialMediaServiceClient {
  async getIntegrations(_userId: string): Promise<SocialIntegration[]> {
    // Mock implementation - return empty array for now
    return [];
  }

  async getPosts(_userId: string): Promise<SocialPost[]> {
    // Mock implementation - return empty array for now
    return [];
  }

  async getUpcomingPosts(_userId: string, _limit: number): Promise<SocialPost[]> {
    // Mock implementation - return empty array for now
    return [];
  }

  async deleteIntegration(_integrationId: string): Promise<void> {
    // Mock implementation
  }

  async deletePost(_postId: string): Promise<void> {
    // Mock implementation
  }

  async publishPostNow(_postId: string): Promise<void> {
    // Mock implementation
  }

  async getPostById(_postId: string): Promise<SocialPost | null> {
    // Mock implementation
    return null;
  }

  async updatePost(_postId: string, _updates: Partial<SocialPost>): Promise<void> {
    // Mock implementation
  }

  async createIntegration(_data: {
    user_id: string;
    platform: Platform;
    internal_id: string;
    name: string;
    picture?: string;
    provider_identifier: string;
    token: string;
    refresh_token?: string;
    token_expiration?: string;
    profile?: string;
  }): Promise<void> {
    // Mock implementation
  }

  async createPost(_userId: string, _request: CreatePostRequest): Promise<void> {
    // Mock implementation
  }
}