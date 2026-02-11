import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export interface PlatformAuthStatus {
  platform: string
  isConnected: boolean
  username?: string
  expiresAt?: Date
}

export class SocialAuthChecker {
  static async checkPlatformAuth(userId: string, platform: string): Promise<boolean> {
    try {
      const supabase = createSupabaseBrowserClient()
      
      const { data, error } = await supabase
        .from('social_integrations')
        .select('id, platform, token_expiration')
        .eq('user_id', userId)
        .eq('platform', platform)
        .single()
      
      if (error || !data) {
        return false
      }
      
      // Check if token is expired
      if (data.token_expiration) {
        const expiration = new Date(data.token_expiration)
        if (expiration < new Date()) {
          return false
        }
      }
      
      return true
    } catch (error) {
      console.error('Error checking platform auth:', error)
      return false
    }
  }
  
  static async checkAllPlatforms(userId: string): Promise<PlatformAuthStatus[]> {
    try {
      const supabase = createSupabaseBrowserClient()
      
      const { data, error } = await supabase
        .from('social_integrations')
        .select('platform, name, token_expiration')
        .eq('user_id', userId)
      
      if (error) {
        console.error('Error fetching platform integrations:', error)
        return []
      }
      
      const platforms = ['twitter', 'instagram', 'linkedin', 'youtube', 'tiktok', 'facebook']
      
      return platforms.map(platform => {
        const integration = data?.find(d => d.platform === platform)
        return {
          platform,
          isConnected: !!integration,
          username: integration?.name,
          expiresAt: integration?.token_expiration ? new Date(integration.token_expiration) : undefined
        }
      })
    } catch (error) {
      console.error('Error checking platforms:', error)
      return []
    }
  }
  
  static async getConnectedPlatforms(userId: string): Promise<string[]> {
    const platforms = await this.checkAllPlatforms(userId)
    return platforms.filter(p => p.isConnected).map(p => p.platform)
  }
} 