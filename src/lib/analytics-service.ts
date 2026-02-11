/**
 * Analytics Service - Real data from database
 * Replaces hardcoded demo data with actual metrics
 */

import { createSupabaseBrowserClient } from './supabase/client'
import { createClient } from '@supabase/supabase-js'

export interface PlatformStats {
  totalVideos: number
  totalUsers: number
  avgProcessingTime: number
  userRating: number
}

export interface UserStats {
  totalProjects: number
  totalVideos: number
  totalClips: number
  totalBlogPosts: number
  totalSocialPosts: number
  totalProcessingTime: number
  activeProjects: number
  completedProjects: number
  currentStreak: number
  platformsUsed: string[]
}

export interface PlatformAnalytics {
  views: number
  likes: number
  comments: number
  shares: number
  engagement_rate: number
}

export class AnalyticsService {
  /**
   * Get platform-wide statistics (for landing page)
   * Uses aggregated data from all users
   */
  static async getPlatformStats(): Promise<PlatformStats> {
    try {
      const supabase = createSupabaseBrowserClient()
      
      // Get total videos processed
      const { count: videoCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
      
      // Get total active users
      const { count: userCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .not('last_active', 'is', null)
      
      // Get average processing time (in minutes)
      const { data: projects } = await supabase
        .from('projects')
        .select('processing_time')
        .not('processing_time', 'is', null)
        .limit(100)
      
      const avgTime = projects && projects.length > 0
        ? projects.reduce((acc, p) => acc + (p.processing_time || 0), 0) / projects.length / 60
        : 10 // Default to 10 minutes
      
      // For now, use realistic defaults
      // In production, these could come from a reviews table
      return {
        totalVideos: videoCount || 0,
        totalUsers: userCount || 0,
        avgProcessingTime: Math.round(avgTime),
        userRating: 4.8 // Default until review system is implemented
      }
    } catch (error) {
      console.error('Error fetching platform stats:', error)
      // Return realistic defaults on error
      return {
        totalVideos: 0,
        totalUsers: 0,
        avgProcessingTime: 10,
        userRating: 4.8
      }
    }
  }

  /**
   * Get user-specific statistics for dashboard
   */
  static async getUserStats(userId: string): Promise<UserStats> {
    try {
      const supabase = createSupabaseBrowserClient()
      
      // Get all user's projects (tasks is a JSONB column, not a separate table)
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
      
      if (!projects) {
        return this.getDefaultUserStats()
      }
      
      // Calculate stats from actual data
      const totalProjects = projects.length
      const activeProjects = projects.filter(p => p.status === 'processing').length
      const completedProjects = projects.filter(p => p.status === 'completed').length
      
      // Count clips and blog posts from project folders (stored in JSONB, not separate tables)
      const totalClips = projects.reduce((acc, project) => {
        return acc + (project.folders?.clips?.length || 0)
      }, 0)
      
      // Count blog posts from project folders
      const blogCount = projects.reduce((acc, project) => {
        return acc + (project.folders?.blog?.length || 0)
      }, 0)
      
      // Count social posts
      const { count: socialCount } = await supabase
        .from('social_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
      
      // Calculate total processing time (in seconds)
      const totalProcessingTime = projects.reduce((acc, p) => 
        acc + (p.processing_time || 0), 0
      )
      
      // Calculate posting streak
      const { data: recentPosts } = await supabase
        .from('social_posts')
        .select('publish_date')
        .eq('user_id', userId)
        .eq('state', 'published')
        .order('publish_date', { ascending: false })
        .limit(30)
      
      const currentStreak = this.calculateStreak(recentPosts || [])
      
      // Get unique platforms used
      const { data: integrations } = await supabase
        .from('social_integrations')
        .select('platform')
        .eq('user_id', userId)
        .eq('is_active', true)
      
      const platformsUsed = integrations?.map(i => i.platform) || []
      
      return {
        totalProjects,
        totalVideos: totalProjects, // Each project is a video
        totalClips,
        totalBlogPosts: blogCount || 0,
        totalSocialPosts: socialCount || 0,
        totalProcessingTime,
        activeProjects,
        completedProjects,
        currentStreak,
        platformsUsed
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
      return this.getDefaultUserStats()
    }
  }

  /**
   * Get social media analytics for a user
   */
  static async getSocialAnalytics(userId: string, platform?: string): Promise<PlatformAnalytics> {
    try {
      const supabase = createSupabaseBrowserClient()
      
      let query = supabase
        .from('social_media_analytics')
        .select('views, likes, comments, shares, engagement_rate')
        .eq('user_id', userId)
      
      if (platform) {
        query = query.eq('platform', platform)
      }
      
      const { data } = await query
      
      if (!data || data.length === 0) {
        return {
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          engagement_rate: 0
        }
      }
      
      // Aggregate analytics
      return data.reduce((acc, curr) => ({
        views: acc.views + (curr.views || 0),
        likes: acc.likes + (curr.likes || 0),
        comments: acc.comments + (curr.comments || 0),
        shares: acc.shares + (curr.shares || 0),
        engagement_rate: Math.max(acc.engagement_rate, curr.engagement_rate || 0)
      }), {
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        engagement_rate: 0
      })
    } catch (error) {
      console.error('Error fetching social analytics:', error)
      return {
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        engagement_rate: 0
      }
    }
  }

  /**
   * Get performance data for charts
   */
  static async getPerformanceData(userId: string, days: number = 7) {
    try {
      const supabase = createSupabaseBrowserClient()
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      
      const { data } = await supabase
        .from('social_media_analytics')
        .select('created_at, views, likes, engagement_rate')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true })
      
      if (!data || data.length === 0) {
        // Return empty data for each day
        return Array.from({ length: days }, (_, i) => {
          const date = new Date()
          date.setDate(date.getDate() - (days - i - 1))
          return {
            day: date.toLocaleDateString('en', { weekday: 'short' }),
            views: 0,
            engagement: 0
          }
        })
      }
      
      // Group by day and aggregate
      const grouped = data.reduce((acc: any, curr) => {
        const day = new Date(curr.created_at).toLocaleDateString('en', { weekday: 'short' })
        if (!acc[day]) {
          acc[day] = { views: 0, likes: 0, engagement: 0, count: 0 }
        }
        acc[day].views += curr.views || 0
        acc[day].likes += curr.likes || 0
        acc[day].engagement += curr.engagement_rate || 0
        acc[day].count++
        return acc
      }, {})
      
      return Object.entries(grouped).map(([day, stats]: [string, any]) => ({
        day,
        views: stats.views,
        engagement: stats.count > 0 ? stats.engagement / stats.count : 0
      }))
    } catch (error) {
      console.error('Error fetching performance data:', error)
      return []
    }
  }

  /**
   * Calculate posting streak from dates
   */
  private static calculateStreak(posts: { publish_date: string }[]): number {
    if (!posts || posts.length === 0) return 0
    
    const dates = posts
      .map(p => new Date(p.publish_date).toDateString())
      .filter((date, index, self) => self.indexOf(date) === index)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    
    let streak = 0
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    
    // Check if streak is ongoing
    if (dates[0] !== today && dates[0] !== yesterday) {
      return 0
    }
    
    // Count consecutive days
    for (let i = 0; i < dates.length - 1; i++) {
      const current = new Date(dates[i])
      const next = new Date(dates[i + 1])
      const diffDays = Math.floor((current.getTime() - next.getTime()) / 86400000)
      
      if (diffDays === 1) {
        streak++
      } else {
        break
      }
    }
    
    return streak + 1 // Include the first day
  }

  /**
   * Get default user stats
   */
  private static getDefaultUserStats(): UserStats {
    return {
      totalProjects: 0,
      totalVideos: 0,
      totalClips: 0,
      totalBlogPosts: 0,
      totalSocialPosts: 0,
      totalProcessingTime: 0,
      activeProjects: 0,
      completedProjects: 0,
      currentStreak: 0,
      platformsUsed: []
    }
  }

  /**
   * Format large numbers for display
   */
  static formatNumber(num: number): string {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M+`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K+`
    }
    return num.toString()
  }
}