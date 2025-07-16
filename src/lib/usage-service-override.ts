/**
 * Usage Service Override for testing and development
 * This allows bypassing usage limits via environment variables
 */

export class UsageOverride {
  /**
   * Check if usage limits should be bypassed
   */
  static shouldBypassLimits(): boolean {
    // Check multiple environment variables for flexibility
    if (typeof window !== 'undefined') {
      // Client-side check
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('bypass_usage') === 'true') {
        return true
      }
    }
    
    // Server-side check
    if (process.env.BYPASS_USAGE_LIMITS === 'true') {
      return true
    }
    
    // Check for specific user bypass (you can add your user ID here)
    if (process.env.BYPASS_USAGE_USER_IDS) {
      const bypassUserIds = process.env.BYPASS_USAGE_USER_IDS.split(',')
      // This would need to be integrated with the auth system
      // For now, just return false
    }
    
    return false
  }
  
  /**
   * Get override limit if set
   */
  static getOverrideLimit(): number | null {
    if (process.env.USAGE_LIMIT_OVERRIDE) {
      const limit = parseInt(process.env.USAGE_LIMIT_OVERRIDE)
      if (!isNaN(limit)) {
        return limit
      }
    }
    return null
  }
} 