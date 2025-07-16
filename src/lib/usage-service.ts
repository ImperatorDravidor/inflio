export interface UsageData {
  used: number
  limit: number
  plan: 'basic' | 'pro' | 'enterprise'
  resetDate: string // ISO date string for when the usage resets
}

export class UsageService {
  private static STORAGE_KEY = 'inflio_usage'
  private static DEFAULT_PLAN: UsageData = {
    used: 0,
    limit: 25,
    plan: 'basic',
    resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString() // First day of next month
  }

  /**
   * Get current usage data
   */
  static getUsage(): UsageData {
    // Always return default plan during SSR or when localStorage is not available
    if (typeof window === 'undefined' || !window.localStorage) {
      return { ...this.DEFAULT_PLAN }
    }
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) {
        this.setUsage(this.DEFAULT_PLAN)
        return { ...this.DEFAULT_PLAN }
      }

      const usage = JSON.parse(stored) as UsageData
      
      // Check if we need to reset monthly usage
      if (new Date() >= new Date(usage.resetDate)) {
        const resetUsage = {
          ...usage,
          used: 0,
          resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
        }
        this.setUsage(resetUsage)
        return resetUsage
      }

      return usage
    } catch (error) {
      // If localStorage access fails (e.g., in private browsing mode), return default
      console.warn('Failed to access localStorage:', error)
      return { ...this.DEFAULT_PLAN }
    }
  }

  /**
   * Set usage data
   */
  private static setUsage(usage: UsageData) {
    if (typeof window === 'undefined' || !window.localStorage) return
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(usage))
      
      // Dispatch custom event for real-time updates
      window.dispatchEvent(new CustomEvent('usageUpdate', { detail: usage }))
    } catch (error) {
      console.warn('Failed to save usage data:', error)
    }
  }

  /**
   * Increment usage when a video is processed
   */
  static incrementUsage(): boolean {
    const usage = this.getUsage()
    
    // Check if limit reached
    if (usage.used >= usage.limit) {
      return false
    }

    const updatedUsage = {
      ...usage,
      used: usage.used + 1
    }
    
    this.setUsage(updatedUsage)
    return true
  }

  /**
   * Check if user can process more videos
   */
  static canProcessVideo(): boolean {
    // Check for bypass first
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('bypass_usage') === 'true') {
        return true
      }
    }
    
    const usage = this.getUsage()
    return usage.used < usage.limit
  }

  /**
   * Get remaining videos for the month
   */
  static getRemainingVideos(): number {
    const usage = this.getUsage()
    return Math.max(0, usage.limit - usage.used)
  }

  /**
   * Get usage percentage
   */
  static getUsagePercentage(): number {
    const usage = this.getUsage()
    if (usage.limit === 0) return 0
    return Math.min(100, Math.round((usage.used / usage.limit) * 100))
  }

  /**
   * Reset usage (for testing or admin purposes)
   */
  static resetUsage() {
    this.setUsage(this.DEFAULT_PLAN)
  }

  /**
   * Update plan (for future use)
   */
  static updatePlan(plan: 'basic' | 'pro' | 'enterprise') {
    const usage = this.getUsage()
    const limits = {
      basic: 25,
      pro: 100,
      enterprise: -1 // unlimited
    }
    
    const updatedUsage = {
      ...usage,
      plan,
      limit: limits[plan]
    }
    
    this.setUsage(updatedUsage)
  }
} 