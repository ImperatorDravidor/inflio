import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { createClient } from '@supabase/supabase-js'

export interface UserUsage {
  user_id: string
  used: number
  limit: number
  plan: 'basic' | 'pro' | 'enterprise'
  reset_date: string
  created_at?: string
  updated_at?: string
}

/**
 * Server-side usage tracking service
 * Stores usage data in Supabase to prevent client-side manipulation
 */
export class ServerUsageService {
  private static PLAN_LIMITS = {
    basic: 25,
    pro: 100,
    enterprise: -1 // unlimited
  }

  /**
   * Get or create usage record for a user
   */
  static async getUsage(userId: string): Promise<UserUsage> {
    const supabase = createSupabaseBrowserClient()
    
    // Try to get existing usage record
    const { data: existingUsage, error: fetchError } = await supabase
      .from('user_usage')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (existingUsage && !fetchError) {
      // Check if we need to reset monthly usage
      const resetDate = new Date(existingUsage.reset_date)
      if (new Date() >= resetDate) {
        return await this.resetMonthlyUsage(userId, existingUsage)
      }
      return existingUsage
    }

    // Create new usage record if none exists
    if (fetchError?.code === 'PGRST116') { // Not found
      return await this.createUsageRecord(userId)
    }

    throw new Error(`Failed to fetch usage: ${fetchError?.message}`)
  }

  /**
   * Create a new usage record for a user
   */
  private static async createUsageRecord(userId: string): Promise<UserUsage> {
    const supabase = createSupabaseBrowserClient()
    
    const newUsage: UserUsage = {
      user_id: userId,
      used: 0,
      limit: this.PLAN_LIMITS.basic,
      plan: 'basic',
      reset_date: this.getNextResetDate().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('user_usage')
      .insert(newUsage)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create usage record: ${error.message}`)
    }

    return data
  }

  /**
   * Reset monthly usage for a user
   */
  private static async resetMonthlyUsage(userId: string, currentUsage: UserUsage): Promise<UserUsage> {
    const supabase = createSupabaseBrowserClient()
    
    const updatedUsage = {
      ...currentUsage,
      used: 0,
      reset_date: this.getNextResetDate().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('user_usage')
      .update(updatedUsage)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to reset usage: ${error.message}`)
    }

    return data
  }

  /**
   * Increment usage when a video is processed
   * Returns true if successful, false if limit reached
   */
  static async incrementUsage(userId: string): Promise<boolean> {
    const supabase = createSupabaseBrowserClient()
    
    // Get current usage
    const usage = await this.getUsage(userId)
    
    // Check if limit reached (unless unlimited)
    if (usage.limit !== -1 && usage.used >= usage.limit) {
      return false
    }

    // Increment usage
    const { error } = await supabase
      .from('user_usage')
      .update({
        used: usage.used + 1,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to increment usage: ${error.message}`)
    }

    return true
  }

  /**
   * Check if user can process more videos
   */
  static async canProcessVideo(userId: string): Promise<boolean> {
    try {
      const usage = await this.getUsage(userId)
      return usage.limit === -1 || usage.used < usage.limit
    } catch (error) {
      console.error('Error checking usage:', error)
      // Default to allowing if there's an error (to not block users)
      return true
    }
  }

  /**
   * Update user's plan
   */
  static async updatePlan(userId: string, plan: 'basic' | 'pro' | 'enterprise'): Promise<UserUsage> {
    const supabase = createSupabaseBrowserClient()
    
    const { data, error } = await supabase
      .from('user_usage')
      .update({
        plan,
        limit: this.PLAN_LIMITS[plan],
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update plan: ${error.message}`)
    }

    return data
  }

  /**
   * Get the next reset date (first day of next month)
   */
  private static getNextResetDate(): Date {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth() + 1, 1)
  }

  /**
   * Create admin client for server-side operations
   */
  static getAdminClient() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration missing')
    }

    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  }
}