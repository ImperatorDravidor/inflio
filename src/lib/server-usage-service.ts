import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export interface UserUsage {
  user_id: string
  used: number
  limit: number  // Changed from usage_limit to match database column
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
    console.log('[ServerUsageService] Getting usage for user:', userId)
    const supabase = createSupabaseServerClient()
    
    // Try to get existing usage record
    const { data: existingUsage, error: fetchError } = await supabase
      .from('user_usage')
      .select('*')
      .eq('user_id', userId)
      .single()

    console.log('[ServerUsageService] Query result:', { data: existingUsage, error: fetchError })

    if (existingUsage && !fetchError) {
      console.log('[ServerUsageService] Found existing usage:', existingUsage)
      
      // Map database column names to interface (database uses usage_limit, code uses limit)
      const mappedUsage: UserUsage = {
        user_id: existingUsage.user_id,
        used: existingUsage.used,
        limit: existingUsage.usage_limit || existingUsage.limit, // Support both column names
        plan: existingUsage.plan,
        reset_date: existingUsage.reset_date,
        created_at: existingUsage.created_at,
        updated_at: existingUsage.updated_at
      }
      
      // Check if we need to reset monthly usage
      const resetDate = new Date(mappedUsage.reset_date)
      if (new Date() >= resetDate) {
        return await this.resetMonthlyUsage(userId, mappedUsage)
      }
      return mappedUsage
    }

    // Create new usage record if none exists
    if (fetchError?.code === 'PGRST116') { // Not found
      console.log('[ServerUsageService] No record found, creating new one')
      return await this.createUsageRecord(userId)
    }

    console.error('[ServerUsageService] Failed to fetch usage:', fetchError)
    throw new Error(`Failed to fetch usage: ${fetchError?.message}`)
  }

  /**
   * Create a new usage record for a user
   */
  private static async createUsageRecord(userId: string): Promise<UserUsage> {
    console.log('[ServerUsageService] Creating new usage record for user:', userId)
    const supabase = createSupabaseServerClient()

    // Database uses usage_limit column, but we'll map it to limit in the return
    const dbRecord = {
      user_id: userId,
      used: 0,
      usage_limit: this.PLAN_LIMITS.basic,  // Database column is usage_limit
      plan: 'basic',
      reset_date: this.getNextResetDate().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('[ServerUsageService] Inserting new usage record:', dbRecord)

    const { data, error } = await supabase
      .from('user_usage')
      .insert(dbRecord)
      .select()
      .single()

    if (error) {
      console.error('[ServerUsageService] Failed to create record:', error)
      throw new Error(`Failed to create usage record: ${error.message}`)
    }

    console.log('[ServerUsageService] Created usage record:', data)
    
    // Map database column to interface
    return {
      user_id: data.user_id,
      used: data.used,
      limit: data.usage_limit || data.limit,
      plan: data.plan,
      reset_date: data.reset_date,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  }

  /**
   * Reset monthly usage for a user
   */
  private static async resetMonthlyUsage(userId: string, currentUsage: UserUsage): Promise<UserUsage> {
    const supabase = createSupabaseServerClient()
    
    const { data, error } = await supabase
      .from('user_usage')
      .update({
        used: 0,
        reset_date: this.getNextResetDate().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to reset usage: ${error.message}`)
    }

    // Map database column to interface
    return {
      user_id: data.user_id,
      used: data.used,
      limit: data.usage_limit || data.limit,
      plan: data.plan,
      reset_date: data.reset_date,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  }

  /**
   * Increment usage when a video is processed
   * Returns true if successful, false if limit reached
   */
  static async incrementUsage(userId: string): Promise<boolean> {
    const supabase = createSupabaseServerClient()

    // Get current usage
    const usage = await this.getUsage(userId)

    // Check if limit reached (unless unlimited)
    if (usage.limit !== -1 && usage.used >= usage.limit) {  // Changed from usage_limit to limit
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
      return usage.limit === -1 || usage.used < usage.limit  // Changed from usage_limit to limit
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
    const supabase = createSupabaseServerClient()

    const { data, error } = await supabase
      .from('user_usage')
      .update({
        plan,
        usage_limit: this.PLAN_LIMITS[plan],  // Database column is usage_limit
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