/**
 * Supabase-based Usage Service
 * Replaces localStorage with database persistence for usage tracking
 */

import React from 'react'
import { createSupabaseBrowserClient } from './supabase/client'

export interface UsageData {
  plan: 'free' | 'pro' | 'enterprise'
  limit: number
  used: number
  resetDate: string
  features: {
    maxVideoSize: number
    maxVideoDuration: number
    watermark: boolean
    priority: boolean
  }
}

export class SupabaseUsageService {
  private static DEFAULT_PLAN: UsageData = {
    plan: 'free',
    limit: 25,
    used: 0,
    resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
    features: {
      maxVideoSize: 500 * 1024 * 1024, // 500MB
      maxVideoDuration: 30 * 60, // 30 minutes
      watermark: true,
      priority: false
    }
  }

  /**
   * Get usage data from Supabase
   */
  static async getUsage(userId: string): Promise<UsageData> {
    if (!userId) return { ...this.DEFAULT_PLAN }
    
    try {
      const supabase = createSupabaseBrowserClient()
      
      // Get user profile with usage data
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('ai_quota, ai_usage, reset_date, subscription_tier')
        .eq('clerk_user_id', userId)
        .single()
      
      if (error || !profile) {
        console.warn('Failed to fetch usage data:', error)
        return { ...this.DEFAULT_PLAN }
      }
      
      // Check if we need to reset monthly usage
      const resetDate = new Date(profile.reset_date)
      if (new Date() >= resetDate) {
        // Reset usage in database
        await this.resetMonthlyUsage(userId)
        return {
          ...this.DEFAULT_PLAN,
          plan: profile.subscription_tier as 'free' | 'pro' | 'enterprise' || 'free',
          limit: profile.ai_quota || 25,
          used: 0,
          resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
        }
      }
      
      // Return current usage
      return {
        plan: profile.subscription_tier as 'free' | 'pro' | 'enterprise' || 'free',
        limit: profile.ai_quota || 25,
        used: profile.ai_usage || 0,
        resetDate: profile.reset_date,
        features: this.getFeaturesForPlan(profile.subscription_tier || 'free')
      }
    } catch (error) {
      console.error('Error fetching usage from Supabase:', error)
      return { ...this.DEFAULT_PLAN }
    }
  }

  /**
   * Increment usage in database
   */
  static async incrementUsage(userId: string, amount: number = 1): Promise<UsageData | null> {
    if (!userId) return null
    
    try {
      const supabase = createSupabaseBrowserClient()
      
      // Use database function for atomic increment
      const { data, error } = await supabase
        .rpc('increment_ai_usage', {
          p_user_id: userId,
          p_amount: amount
        })
      
      if (error) {
        console.error('Failed to increment usage:', error)
        return null
      }
      
      // Return updated usage data
      return await this.getUsage(userId)
    } catch (error) {
      console.error('Error incrementing usage:', error)
      return null
    }
  }

  /**
   * Reset monthly usage
   */
  static async resetMonthlyUsage(userId: string): Promise<void> {
    if (!userId) return
    
    try {
      const supabase = createSupabaseBrowserClient()
      const nextResetDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
      
      await supabase
        .from('user_profiles')
        .update({
          ai_usage: 0,
          reset_date: nextResetDate.toISOString()
        })
        .eq('clerk_user_id', userId)
      
      // Dispatch event for real-time updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('usageUpdate', { 
          detail: await this.getUsage(userId) 
        }))
      }
    } catch (error) {
      console.error('Error resetting usage:', error)
    }
  }

  /**
   * Check if user can process more videos
   */
  static async canProcess(userId: string): Promise<boolean> {
    const usage = await this.getUsage(userId)
    return usage.used < usage.limit
  }

  /**
   * Get remaining credits
   */
  static async getRemainingCredits(userId: string): Promise<number> {
    const usage = await this.getUsage(userId)
    return Math.max(0, usage.limit - usage.used)
  }

  /**
   * Check if feature is available for user's plan
   */
  static async hasFeature(userId: string, feature: keyof UsageData['features']): Promise<boolean> {
    const usage = await this.getUsage(userId)
    return !!usage.features[feature]
  }

  /**
   * Get features for a specific plan
   */
  private static getFeaturesForPlan(plan: string): UsageData['features'] {
    switch (plan) {
      case 'pro':
        return {
          maxVideoSize: 2 * 1024 * 1024 * 1024, // 2GB
          maxVideoDuration: 60 * 60, // 60 minutes
          watermark: false,
          priority: true
        }
      case 'enterprise':
        return {
          maxVideoSize: 5 * 1024 * 1024 * 1024, // 5GB
          maxVideoDuration: 120 * 60, // 120 minutes
          watermark: false,
          priority: true
        }
      default:
        return this.DEFAULT_PLAN.features
    }
  }

  /**
   * Subscribe to usage updates
   */
  static subscribeToUpdates(userId: string, callback: (usage: UsageData) => void): () => void {
    if (typeof window === 'undefined') return () => {}
    
    const handler = async (event: Event) => {
      const usage = await this.getUsage(userId)
      callback(usage)
    }
    
    window.addEventListener('usageUpdate', handler)
    
    // Return unsubscribe function
    return () => {
      window.removeEventListener('usageUpdate', handler)
    }
  }

  /**
   * Get usage for display (formatted)
   */
  static async getUsageDisplay(userId: string): Promise<{
    used: number
    limit: number
    percentage: number
    remaining: number
    daysUntilReset: number
    plan: string
  }> {
    const usage = await this.getUsage(userId)
    const resetDate = new Date(usage.resetDate)
    const now = new Date()
    const daysUntilReset = Math.ceil((resetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    return {
      used: usage.used,
      limit: usage.limit,
      percentage: Math.min(100, Math.round((usage.used / usage.limit) * 100)),
      remaining: Math.max(0, usage.limit - usage.used),
      daysUntilReset: Math.max(0, daysUntilReset),
      plan: usage.plan
    }
  }
}

// Export a hook for React components
export function useSupabaseUsage(userId: string) {
  const [usage, setUsage] = React.useState<UsageData | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    // Load initial usage
    SupabaseUsageService.getUsage(userId).then((data) => {
      setUsage(data)
      setLoading(false)
    })

    // Subscribe to updates
    const unsubscribe = SupabaseUsageService.subscribeToUpdates(userId, setUsage)

    return unsubscribe
  }, [userId])

  return { usage, loading }
}

// For backward compatibility, export a default that uses Supabase
// but falls back to a mock for unauthenticated users
export const UsageService = {
  async getUsage(userId?: string): Promise<UsageData> {
    if (!userId) {
      // Return default for unauthenticated users
      return SupabaseUsageService['DEFAULT_PLAN']
    }
    return SupabaseUsageService.getUsage(userId)
  },
  
  async incrementUsage(userId: string, amount: number = 1): Promise<void> {
    await SupabaseUsageService.incrementUsage(userId, amount)
  },
  
  async canProcess(userId: string): Promise<boolean> {
    if (!userId) return false
    return SupabaseUsageService.canProcess(userId)
  },
  
  async getRemainingCredits(userId: string): Promise<number> {
    if (!userId) return 0
    return SupabaseUsageService.getRemainingCredits(userId)
  }
}